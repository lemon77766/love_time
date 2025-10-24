"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_auth = require("../../utils/auth.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      currentTab: "home",
      gridItems: [
        { icon: "/static/zhuye/question1.png", text: "甜蜜问答" },
        { icon: "/static/zhuye/100.png", text: "一百事" },
        { icon: "/static/zhuye/yellow_love.png", text: "心形墙" },
        { icon: "/static/zhuye/letter.png", text: "未来情书" },
        { icon: "/static/zhuye/jinian.png", text: "纪念日" },
        { icon: "/static/zhuye/guiji.png", text: "情侣轨迹" },
        { icon: "/static/zhuye/jiudian.png", text: "情侣酒店" },
        { icon: "/static/zhuye/xiangce.png", text: "相册" },
        { icon: "/static/zhuye/xuyuandeng.png", text: "许愿灯" }
      ]
    };
  },
  methods: {
    switchTab(tab) {
      this.currentTab = tab;
    },
    openGrid(item) {
      if (item.text === "甜蜜问答") {
        common_vendor.index.navigateTo({ url: "/pages/qna/index" });
      } else if (item.text === "一百事") {
        common_vendor.index.navigateTo({ url: "/pages/hundred/index" });
      } else if (item.text === "心形墙") {
        common_vendor.index.navigateTo({ url: "/pages/heartwall/index" });
      } else {
        common_vendor.index.showToast({ title: item.text + "（待开发）", icon: "none" });
      }
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            utils_auth.logout();
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
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0$1,
    b: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args)),
    c: common_assets._imports_1$1,
    d: common_assets._imports_0$2,
    e: common_assets._imports_3,
    f: common_vendor.f($data.gridItems, (item, index, i0) => {
      return {
        a: item.icon,
        b: common_vendor.t(item.text),
        c: index,
        d: common_vendor.o(($event) => $options.openGrid(item), index)
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
