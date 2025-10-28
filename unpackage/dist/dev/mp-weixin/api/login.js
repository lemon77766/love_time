"use strict";
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function wxLogin(code, userInfo) {
  return utils_http.http.post(utils_config.config.API.LOGIN.WECHAT, {
    code,
    nickName: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl
  });
}
exports.wxLogin = wxLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/login.js.map
