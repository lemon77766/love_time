"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_auth = require("../../utils/auth.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      currentTab: "home",
      currentDay: "",
      currentYearMonth: "",
      currentWeek: "",
      timer: null,
      gridItems: [
        { icon: "/static/zhuye/question1.png", text: "甜蜜问答" },
        { icon: "/static/zhuye/100.png", text: "一百事" },
        { icon: "/static/zhuye/yellow_love.png", text: "心形墙" },
        { icon: "/static/zhuye/letter.png", text: "未来情书" }
      ]
    };
  },
  onLoad() {
    this.updateDateTime();
    this.timer = setInterval(() => {
      this.updateDateTime();
    }, 6e4);
  },
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    updateDateTime() {
      const now = /* @__PURE__ */ new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = now.getDate();
      const weekDay = now.getDay();
      const weekNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      this.currentDay = day;
      this.currentYearMonth = `${year}年${month}月`;
      this.currentWeek = weekNames[weekDay];
    },
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
      } else if (item.text === "未来情书") {
        common_vendor.index.navigateTo({ url: "/pages/xinxiang/index" });
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
    a: common_vendor.t($data.currentDay),
    b: common_vendor.t($data.currentYearMonth),
    c: common_vendor.t($data.currentWeek),
    d: common_assets._imports_0$1,
    e: common_assets._imports_0$2,
    f: common_assets._imports_2,
    g: common_vendor.f($data.gridItems, (item, index, i0) => {
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
