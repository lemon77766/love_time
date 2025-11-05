"use strict";
require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function getUserInfo() {
  return utils_http.http.get(utils_config.config.API.USER.INFO);
}
exports.getUserInfo = getUserInfo;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/login.js.map
