"use strict";
const common_vendor = require("../common/vendor.js");
function isLoggedIn() {
  try {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    return loginInfo && loginInfo.isLoggedIn === true && loginInfo.isGuest !== true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/auth.js:15", "检查登录状态失败", e);
    return false;
  }
}
function isGuestUser() {
  try {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    return loginInfo && loginInfo.isGuest === true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/auth.js:29", "检查游客状态失败", e);
    return false;
  }
}
function getUserInfo() {
  try {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    return loginInfo && loginInfo.userInfo ? loginInfo.userInfo : null;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/auth.js:43", "获取用户信息失败", e);
    return null;
  }
}
function logout(silent = false) {
  return new Promise((resolve) => {
    try {
      common_vendor.index.removeStorageSync("login_info");
      const guestUserInfo = {
        nickName: "游客用户",
        avatarUrl: "/static/zhuye/smile.png",
        displayName: "游客用户",
        displayAvatar: "/static/zhuye/smile.png",
        isGuest: true
      };
      const guestLoginInfo = {
        isLoggedIn: true,
        userInfo: guestUserInfo,
        isGuest: true,
        loginTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      common_vendor.index.setStorageSync("login_info", guestLoginInfo);
      if (!silent) {
        common_vendor.index.showToast({
          title: "已退出登录",
          icon: "success",
          duration: 1500
        });
      }
      setTimeout(() => {
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
      }, silent ? 500 : 1500);
      resolve(true);
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/auth.js:115", "退出登录失败", e);
      common_vendor.index.showToast({
        title: "退出失败，请重试",
        icon: "none",
        duration: 2e3
      });
      resolve(false);
    }
  });
}
exports.getUserInfo = getUserInfo;
exports.isGuestUser = isGuestUser;
exports.isLoggedIn = isLoggedIn;
exports.logout = logout;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth.js.map
