"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      items: [
        { icon: "/static/love.png", text: "恋爱时光轴", url: "/pages/index/index" },
        { icon: "/static/hudong.png", text: "情侣互动", url: "/pages/hudong/index" },
        { icon: "/static/remerber.png", text: "共同记忆", url: "/pages/jiyi/index" },
        { icon: "/static/we.png", text: "我们", url: "/pages/we/index" }
      ]
    };
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.items, (item, idx, i0) => {
      return {
        a: item.icon,
        b: common_vendor.t(item.text),
        c: idx,
        d: item.url
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/BottomNav.js.map
