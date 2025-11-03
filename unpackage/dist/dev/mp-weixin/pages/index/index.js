"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      remainingDays: 5,
      anniversaryDate: "2025-07-22",
      // 使用标准日期格式，兼容 iOS
      wishText: "这一刻的幸福足以支撑以后的漫长岁月",
      screenWidth: 375
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    },
    // 格式化日期显示（保持原有格式）
    formattedAnniversaryDate() {
      return this.anniversaryDate.replace(/-/g, ".");
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.calculateRemainingDays();
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
      this.navBarHeight = 54;
    },
    calculateRemainingDays() {
      let dateStr = this.anniversaryDate;
      if (dateStr.includes(".")) {
        dateStr = dateStr.replace(/\./g, "-");
      }
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:173", "日期格式无效:", this.anniversaryDate);
        this.remainingDays = 0;
        return;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays > 0) {
        this.remainingDays = diffDays;
      } else {
        this.remainingDays = 0;
      }
    },
    goToSweetQA() {
      common_vendor.index.navigateTo({
        url: "/pages/qna/index"
      });
    },
    goToHundredThings() {
      common_vendor.index.navigateTo({
        url: "/pages/hundred/index"
      });
    },
    goToHeartWall() {
      common_vendor.index.navigateTo({
        url: "/pages/heartwall/index"
      });
    },
    goToFutureLetter() {
      common_vendor.index.navigateTo({
        url: "/pages/xinxiang/index"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: common_vendor.t($data.remainingDays),
    d: common_vendor.t($options.formattedAnniversaryDate),
    e: common_assets._imports_0$1,
    f: common_vendor.o((...args) => $options.goToSweetQA && $options.goToSweetQA(...args)),
    g: common_vendor.o((...args) => $options.goToHundredThings && $options.goToHundredThings(...args)),
    h: common_vendor.o((...args) => $options.goToHeartWall && $options.goToHeartWall(...args)),
    i: common_vendor.o((...args) => $options.goToFutureLetter && $options.goToFutureLetter(...args)),
    j: common_vendor.t($data.wishText),
    k: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
