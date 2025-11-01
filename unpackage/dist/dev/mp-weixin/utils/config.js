"use strict";
const devConfig = {
  baseURL: "http://192.168.54.229:8080/lovetime",
  timeout: 1e4,
  // 普通请求超时时间
  uploadTimeout: 3e4,
  // 上传请求超时时间
  API: {
    LOGIN: {
      WECHAT: "/api/login/wechat",
      LOGOUT: "/api/login/logout"
    },
    USER: {
      INFO: "/api/user/info",
      AVATAR_UPLOAD: "/api/user/avatar/upload",
      UPDATE: "/api/user/update"
    },
    LETTER: {
      LIST: "/api/letter/list",
      DETAIL: "/api/letter/detail",
      CREATE: "/api/letter/create",
      UPDATE: "/api/letter/update",
      DELETE: "/api/letter/delete"
    },
    QA: {
      LIST: "/api/qa/list",
      DETAIL: "/api/qa/detail",
      CREATE: "/api/qa/create",
      UPDATE: "/api/qa/update",
      DELETE: "/api/qa/delete"
    },
    QNA: {
      LIST: "/api/qna/questions",
      // 获取问题列表
      SUBMIT: "/api/qna/answer/submit",
      // 提交答案
      HISTORY: "/api/qna/history",
      // 获取历史记录
      PARTNER_ANSWER: "/api/qna/partner",
      // 获取对方答案
      ADD_QUESTION: "/api/qna/question/add",
      // 添加自定义问题
      DELETE_QUESTION: "/api/qna/question/delete"
      // 删除自定义问题
    },
    CHALLENGE: {
      LIST: "/api/challenge/tasks",
      // 获取任务列表
      PROGRESS: "/api/challenge/progress",
      // 获取用户进度
      ADD: "/api/challenge/task/add",
      // 添加自定义任务
      DELETE: "/api/challenge/task/delete",
      // 删除自定义任务
      COMPLETE: "/api/challenge/complete",
      // 标记完成/取消完成
      FAVORITE: "/api/challenge/favorite"
      // 收藏/取消收藏
    }
  }
};
const config = devConfig;
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/config.js.map
