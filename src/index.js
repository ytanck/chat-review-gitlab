import express from "express";
import cors from "cors";
import { logger } from "./utils.js";
import ChatGPT from "./chatgpt.js";
import Gitlab from "./gitlab.js";
// import * as dotenv from 'dotenv'
// dotenv.config()
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  logger.success(new Date().toLocaleString(), req.url, req.method);
  res.send("get-ok");
});

app.post("/code-review", async (req, res) => {
  try {
    const { body, query } = req;

    console.log(body.project.id, body.object_attributes.iid);
    const chatgpt = new ChatGPT();
    const gitlab = new Gitlab({
      projectId: body.project.id,
      mrIId: body.object_attributes.iid,
      accessToken: query.access_token,
    });
    const { state, changes, ref } = await gitlab.getChanges();

    if (state !== "opened") {
      console.log("MR is closed");
      return res.status(200).send({ status: "200", msg: "MR is closed" });
    }
    if (!chatgpt) {
      logger.error("Chat is null");
      return res.status(200).send({ status: "200", msg: "ChatGpt is null" });
    }
    for (let i = 0; i < changes.length; i += 1) {
      const change = changes[i];
      const message = await chatgpt.codeReview(change.diff);
      const result = await gitlab.codeReview({ message, ref, change });
      // logger.info(message, result?.data);
    }
    res.status(200).send({ status: "200", msg: "ok" });
  } catch (error) {
    console.log("catch", error);
    // gitlab_rails['webhook_timeout'] = 10
    res.status(500).send({ status: "500", error });
  }
});
app.use((err, req, res, next) => {
  logger.error("something run err...");
  res.status(500).json({ message: err.message });
});
app.listen(4000, () => {
  console.log("listening on 4000...");
});
