"use strict";
const common_vendor = require("../../../../common/vendor.js");
const common_assets = require("../../../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx;
    }
  },
  onLoad() {
    this.getSystemInfo();
  },
  methods: {
    getSystemInfo() {
      try {
        const windowInfo = common_vendor.wx$1.getWindowInfo && common_vendor.wx$1.getWindowInfo();
        const deviceInfo = common_vendor.wx$1.getDeviceInfo && common_vendor.wx$1.getDeviceInfo();
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = common_vendor.index.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    handleFeature(featureType) {
      switch (featureType) {
        case "chat":
          common_vendor.index.showToast({
            title: "启动智能聊天",
            icon: "none"
          });
          break;
        case "remind":
          common_vendor.index.showToast({
            title: "设置纪念日提醒",
            icon: "none"
          });
          break;
        case "record":
          common_vendor.index.showToast({
            title: "记录恋爱点滴",
            icon: "none"
          });
          break;
        case "advice":
          common_vendor.index.showToast({
            title: "获取恋爱建议",
            icon: "none"
          });
          break;
      }
    },
    startChat() {
      common_vendor.index.showToast({
        title: "正在启动聊天功能...",
        icon: "none"
      });
    }
  }
};
if (!Array) {
  const _easycom_iconify_icon2 = common_vendor.resolveComponent("iconify-icon");
  _easycom_iconify_icon2();
}
const _easycom_iconify_icon = () => "../../../../components/iconify-icon/iconify-icon.js";
if (!Math) {
  _easycom_iconify_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      icon: "mdi:arrow-left",
      size: 24,
      color: "#666"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    d: $data.navBarHeight + "px",
    e: common_assets._imports_0$2,
    f: common_vendor.p({
      icon: "mdi:chat",
      size: 32,
      color: "#4A90E2"
    }),
    g: common_vendor.o(($event) => $options.handleFeature("chat")),
    h: common_vendor.p({
      icon: "mdi:bell",
      size: 32,
      color: "#FF6B6B"
    }),
    i: common_vendor.o(($event) => $options.handleFeature("remind")),
    j: common_vendor.p({
      icon: "mdi:notebook",
      size: 32,
      color: "#50C878"
    }),
    k: common_vendor.o(($event) => $options.handleFeature("record")),
    l: common_vendor.p({
      icon: "mdi:lightbulb",
      size: 32,
      color: "#FFD700"
    }),
    m: common_vendor.o(($event) => $options.handleFeature("advice")),
    n: common_vendor.o((...args) => $options.startChat && $options.startChat(...args)),
    o: $options.containerPaddingTop + "px"
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/virtual/pages/virtual/index.js.map
