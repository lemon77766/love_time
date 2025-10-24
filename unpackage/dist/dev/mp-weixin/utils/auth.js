"use strict";
const common_vendor = require("../common/vendor.js");
function logout() {
  try {
    common_vendor.index.removeStorageSync("login_info");
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/auth.js:62", "退出登录失败", e);
    return false;
  }
}
exports.logout = logout;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth.js.map
