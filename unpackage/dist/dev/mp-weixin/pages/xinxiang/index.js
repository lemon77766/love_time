"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {};
  },
  methods: {
    openHistory() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/history" });
    },
    createLetter() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/create" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0$5,
    b: common_vendor.o((...args) => $options.openHistory && $options.openHistory(...args)),
    c: common_vendor.o((...args) => $options.createLetter && $options.createLetter(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/index.js.map
