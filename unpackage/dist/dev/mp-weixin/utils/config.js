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
    }
  }
};
const config = devConfig;
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/config.js.map
