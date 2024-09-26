import createRequest from "./request.js";
import { logger } from "./utils.js";
import camelCase from "camelcase";

const formatByCamelCase = (obj) => {
  const target = Object.keys(obj).reduce((result, key) => {
    const newkey = camelCase(key);
    return { ...result, [newkey]: obj[key] };
  }, {});

  return target;
};

/**
对diff 的处理：
Gitlab 的每一行 diff 其实是由三种状态组成 ‘+’ ‘-’ 和 ‘’：
如果最后一行是 ‘+’，则给该接口传入 new_line 和 new_path；
如果最后一行是 ‘-’ ，则给该接口传入 old_line 和 old_path；
如果最后一行是 ‘’， 则 new_line、new_path 和 old_line、old_path 都要传入
*/

const parseLastDiff = (gitDiff) => {
  const diffList = gitDiff.split("\n").reverse();
  const lastLineFirstChar = diffList?.[1]?.[0];
  const lastDiff =
    diffList.find((item) => {
      return /^@@ \-\d+,\d+ \+\d+,\d+ @@/g.test(item);
    }) || "";

  const [lastOldLineCount, lastNewLineCount] = lastDiff
    .replace(/@@ \-(\d+),(\d+) \+(\d+),(\d+) @@.*/g, ($0, $1, $2, $3, $4) => {
      return `${+$1 + +$2},${+$3 + +$4}`;
    })
    .split(",");

  if (!/^\d+$/.test(lastOldLineCount) || !/^\d+$/.test(lastNewLineCount)) {
    return {
      lastOldLine: -1,
      lastNewLine: -1,
    };
  }

  const lastOldLine =
    lastLineFirstChar === "+" ? -1 : (parseInt(lastOldLineCount) || 0) - 1;
  const lastNewLine =
    lastLineFirstChar === "-" ? -1 : (parseInt(lastNewLineCount) || 0) - 1;

  return {
    lastOldLine,
    lastNewLine,
  };
};

export default class Gitlab {
  projectId;
  mrIId;
  request;
  target;

  constructor({ projectId, mrIId, accessToken }) {
    const host = process.env.GITLAB_URL || "https://gitlab.cn";
    this.request = createRequest(host, {
      params: { private_token: accessToken },
    });
    this.mrIId = mrIId;
    this.projectId = projectId;
    this.target = process.env.TARGET_CR_FILE || /\.(j|t)sx?$/;
  }

  getChanges() {
    /** https://docs.gitlab.com/ee/api/merge_requests.html#get-single-merge-request-changes */
    return this.request
      .get(
        `/api/v4/projects/${this.projectId}/merge_requests/${this.mrIId}/changes`
      )
      .then((res) => {
        const { changes, diff_refs: diffRef, state } = res.data;
        const codeChanges = changes
          .map((item) => formatByCamelCase(item))
          .filter((item) => {
            const { newPath, renamedFile, deletedFile } = item;
            if (renamedFile || deletedFile) {
              return false;
            }
            if (!this.target.test(newPath)) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const { lastOldLine, lastNewLine } = parseLastDiff(item.diff);
            return { ...item, lastNewLine, lastOldLine };
          });
        return {
          state,
          changes: codeChanges,
          ref: formatByCamelCase(diffRef),
        };
      })
      .catch((error) => {
        logger.error(error);
        return {
          state: "",
          changes: [],
          ref: {},
        };
      });
  }

  postComment({ newPath, newLine, oldPath, oldLine, body, ref }) {
    /** https://docs.gitlab.com/ee/api/discussions.html#create-a-new-thread-in-the-merge-request-diff */
    return this.request
      .post(
        `/api/v4/projects/${this.projectId}/merge_requests/${this.mrIId}/discussions`,
        {
          body,
          position: {
            position_type: "text",
            base_sha: ref?.baseSha,
            head_sha: ref?.headSha,
            start_sha: ref?.startSha,
            new_path: newPath,
            new_line: newLine,
            old_path: oldPath,
            old_line: oldLine,
          },
        }
      )
      .catch((error) => {
        logger.error(error);
      });
  }

  async codeReview({ change, message, ref }) {
    const { lastNewLine = -1, lastOldLine = -1, newPath, oldPath } = change;

    if (lastNewLine === -1 && lastOldLine === -1) {
      logger.error("Code line error");
      return;
    }

    const params = {};

    if (lastOldLine !== -1) {
      params.oldLine = lastOldLine;
      params.oldPath = oldPath;
    }

    if (lastNewLine !== -1) {
      params.newLine = lastNewLine;
      params.newPath = newPath;
    }

    return await this.postComment({
      ...params,
      body: message,
      ref,
    });
  }
}
