"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
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
      return totalHeightRpx + "rpx";
    }
  },
  mounted() {
    this.getSystemInfo();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 44;
    },
    openHistory() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/history" });
    },
    openReceived() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/received" });
    },
    createLetter() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/create" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_assets._imports_0$3,
    e: common_vendor.o((...args) => $options.openHistory && $options.openHistory(...args)),
    f: common_vendor.o((...args) => $options.openReceived && $options.openReceived(...args)),
    g: common_vendor.o((...args) => $options.createLetter && $options.createLetter(...args)),
    h: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/index.js.map
