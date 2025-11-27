"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/login/index.js";
  "./pages/we/index.js";
  "./pages/profile/index.js";
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
  "./subPackages/record/pages/anniversary/index.js";
  "./subPackages/record/pages/profile/edit.js";
  "./subPackages/record/pages/privacy/index.js";
  "./subPackages/record/pages/notification/index.js";
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
    this.setGuestStatus();
    common_vendor.index.reLaunch({
      url: "/pages/index/index"
    });
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:92", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:95", "App Hide");
  },
  methods: {
    // 设置游客状态
    setGuestStatus() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (!loginInfo || !loginInfo.isLoggedIn) {
          const guestUserInfo = {
            nickName: "游客用户",
            displayName: "游客用户",
            isGuest: true
          };
          const guestLoginInfo = {
            isLoggedIn: true,
            userInfo: guestUserInfo,
            isGuest: true,
            loginTime: (/* @__PURE__ */ new Date()).toISOString()
          };
          common_vendor.index.setStorageSync("login_info", guestLoginInfo);
          common_vendor.index.__f__("log", "at App.vue:120", "已设置游客状态");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:123", "设置游客状态失败", e);
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
