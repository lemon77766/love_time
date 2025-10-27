"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/index.js";
  "./pages/index/index.js";
  "./pages/jiyi/index.js";
  "./pages/we/index.js";
  "./pages/qna/index.js";
  "./pages/qna/history.js";
  "./pages/hundred/index.js";
  "./pages/heartwall/index.js";
  "./pages/heartwall/create.js";
  "./pages/xinxiang/index.js";
}
const pages = [
  {
    path: "pages/index/index",
    style: {
      navigationBarTitleText: "恋爱时光轴"
    }
  },
  {
    path: "pages/hudong/index",
    style: {
      navigationBarTitleText: "情侣互动"
    }
  },
  {
    path: "pages/jiyi/index",
    style: {
      navigationBarTitleText: "共同记忆"
    }
  },
  {
    path: "pages/we/index",
    style: {
      navigationBarTitleText: "我们"
    }
  }
];
const tabBar = {
  color: "#8f8f94",
  selectedColor: "#FF78A6",
  backgroundColor: "#fff5f7",
  borderStyle: "white",
  list: [
    {
      pagePath: "pages/index/index",
      text: "恋爱时光轴",
      iconPath: "/static/love.png",
      selectedIconPath: "/static/love.png"
    },
    {
      pagePath: "pages/hudong/index",
      text: "情侣互动",
      iconPath: "/static/hudong.png",
      selectedIconPath: "/static/hudong.png"
    },
    {
      pagePath: "pages/jiyi/index",
      text: "共同记忆",
      iconPath: "/static/remerber.png",
      selectedIconPath: "/static/remerber.png"
    },
    {
      pagePath: "pages/we/index",
      text: "我们",
      iconPath: "/static/we.png",
      selectedIconPath: "/static/we.png"
    }
  ]
};
const globalStyle = {
  navigationBarTextStyle: "black",
  navigationBarBackgroundColor: "#fff5f7",
  backgroundColor: "#fff5f7"
};
const App = {
  pages,
  tabBar,
  globalStyle
};
function createApp() {
  const app = common_vendor.createSSRApp(App);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
