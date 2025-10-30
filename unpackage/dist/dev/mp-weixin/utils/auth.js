"use strict";
const common_vendor = require("../common/vendor.js");
function isLoggedIn() {
  try {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    return loginInfo && loginInfo.isLoggedIn === true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/auth.js:14", "检查登录状态失败", e);
    return false;
  }
}
function logout() {
  return new Promise((resolve) => {
    try {
      common_vendor.index.removeStorageSync("login_info");
      common_vendor.index.showToast({
        title: "已退出登录",
        icon: "success",
        duration: 1500
      });
      setTimeout(() => {
        common_vendor.index.reLaunch({
          url: "/pages/login/index"
        });
      }, 1500);
      resolve(true);
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/auth.js:79", "退出登录失败", e);
      common_vendor.index.showToast({
        title: "退出失败，请重试",
        icon: "none",
        duration: 2e3
      });
      resolve(false);
    }
  });
}
exports.isLoggedIn = isLoggedIn;
exports.logout = logout;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth.js.map
