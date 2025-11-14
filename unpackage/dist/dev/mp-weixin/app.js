"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/index.js";
  "./pages/index/index.js";
  "./pages/we/index.js";
  "./pages/we/profile.js";
  "./pages/trajectory/index.js";
  "./pages/invite/index.js";
  "./subPackages/record/pages/jiyi/index.js";
  "./subPackages/record/pages/heartwall/index.js";
  "./subPackages/record/pages/heartwall/create.js";
  "./subPackages/record/pages/xinxiang/index.js";
  "./subPackages/record/pages/xinxiang/create.js";
  "./subPackages/record/pages/xinxiang/history.js";
  "./subPackages/record/pages/xinxiang/received.js";
  "./subPackages/record/pages/trajectory/history.js";
  "./subPackages/interaction/pages/qna/index.js";
  "./subPackages/interaction/pages/qna/history.js";
  "./subPackages/interaction/pages/hundred/index.js";
}
(function() {
  const originalError = console.error;
  console.error = function(...args) {
    const errorMsg = args.join(" ");
    if (errorMsg.includes("WebSocket connection") && errorMsg.includes("failed") && (errorMsg.includes("mp-weixin") || errorMsg.includes("8090"))) {
      return;
    }
    if (errorMsg.includes("not node js file system") || errorMsg.includes("saaa_config.json") || errorMsg.includes("readFile") && errorMsg.includes("worker") || errorMsg.includes("__invokeHandler__ readFile")) {
      return;
    }
    originalError.apply(console, args);
  };
  if (typeof common_vendor.index !== "undefined") {
    common_vendor.index.onError && common_vendor.index.onError((error) => {
      if (!error)
        return;
      const errorStr = typeof error === "string" ? error : JSON.stringify(error);
      if (errorStr.includes("WebSocket") && errorStr.includes("mp-weixin") || errorStr.includes("not node js file system") || errorStr.includes("saaa_config.json") || errorStr.includes("readFile") && errorStr.includes("worker") || errorStr.includes("__invokeHandler__ readFile")) {
        return;
      }
      originalError("未捕获的错误:", error);
    });
  }
  if (typeof window !== "undefined") {
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      const errorMsg = message || "";
      if (errorMsg.includes("not node js file system") || errorMsg.includes("saaa_config.json") || errorMsg.includes("readFile") && errorMsg.includes("worker") || errorMsg.includes("__invokeHandler__ readFile")) {
        return true;
      }
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
  }
})();
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:81", "App Launch");
    this.checkLoginStatus();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:87", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:90", "App Hide");
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      var _a;
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage ? currentPage.route : "";
        const whiteList = ["pages/login/index"];
        const hasToken = loginInfo && (loginInfo.token && loginInfo.token.trim() || ((_a = loginInfo.data) == null ? void 0 : _a.token) && loginInfo.data.token.trim() || loginInfo.accessToken && loginInfo.accessToken.trim());
        if (loginInfo && loginInfo.isLoggedIn && !hasToken) {
          common_vendor.index.__f__("warn", "at App.vue:113", "⚠️ 检测到无效的登录信息（缺少token），正在清除...");
          common_vendor.index.removeStorageSync("login_info");
          common_vendor.index.__f__("warn", "at App.vue:115", "✅ 已清除无效的登录信息");
        }
        if (!loginInfo || !loginInfo.isLoggedIn || !hasToken) {
          if (!whiteList.includes(currentRoute)) {
            common_vendor.index.reLaunch({
              url: "/pages/login/index"
            });
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:127", "检查登录状态失败", e);
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
