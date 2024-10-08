import createRequest from "./request.js";
import { logger } from "./utils.js";
export default class ChatGPT {
  language;
  request;
  constructor(config) {
    const { BASE_URL, API_KEY, DEFAULT_MODEL } = process.env;
    const baseUrl = BASE_URL || "https://api.openai.com";
    this.request = createRequest(baseUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      data: {
        model: DEFAULT_MODEL || "gpt3.5-turbo",
        temperature: 1,
        top_p: 1,
        presence_penalty: 1,
        stream: false,
        max_tokens: 1000,
      },
    });
    this.language = "Chinese";
  }

  generatePrompt = (patch) => {
    const answerLanguage = `Answer me in ${this.language},`;

    return `Bellow is the gitlab code patch, please help me do a brief code review,${answerLanguage} if any bug risk and improvement suggestion are welcome
    ${patch}
    `;
  };

  sendMessage = async (msg) => {
    const currentDate = new Date().toISOString().split("T")[0];
    return this.request.post("/v1/chat/completions", {
      messages: [
        {
          role: "system",
          content:
            "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n" +
            "Knowledge cutoff: 2021-09-01\n" +
            `Current date: ${currentDate}`,
        },
        { role: "user", content: msg, name: undefined },
      ],
    });
  };

  codeReview = async (patch) => {
    if (!patch) {
      logger.error("patch is empty");
      return "";
    }

    console.time("code-review cost");
    const prompt = this.generatePrompt(patch);

    const res = await this.sendMessage(prompt);

    console.timeEnd("code-review cost");
    // console.log(res.data);
    const { choices } = res.data;

    if (Array.isArray(choices) && choices.length > 0) {
      return choices[0]?.message?.content;
    }
    return "";
  };
}
