"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  methods: {
    goFeature(type) {
      const map = {
        trail: "情侣轨迹",
        hotel: "情侣酒店",
        album: "相册"
      };
      common_vendor.index.showToast({ title: map[type] + "（待开发）", icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: common_vendor.o(($event) => $options.goFeature("trail")),
    c: common_assets._imports_1,
    d: common_vendor.o(($event) => $options.goFeature("trail")),
    e: common_assets._imports_2,
    f: common_vendor.o(($event) => $options.goFeature("hotel")),
    g: common_assets._imports_3,
    h: common_vendor.o(($event) => $options.goFeature("album"))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/jiyi/index.js.map
