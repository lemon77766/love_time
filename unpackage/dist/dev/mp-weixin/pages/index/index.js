"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      events: [
        { title: "初识", date: "2023-01-15", tags: ["第一次聊天", "互相加微信"] },
        { title: "暖昧期", date: "2023-02-20", tags: ["第一次约会", "一起看电影"] },
        { title: "告白", date: "2023-04-10", tags: ["公园告白成功", "第一次牵手"] },
        { title: "确定关系", date: "2023-05-01", tags: ["正式成为情侣", "第一次拥抱"] }
      ]
    };
  },
  methods: {
    onFabClick() {
      common_vendor.index.showToast({ title: "许愿灯", icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: common_vendor.f($data.events, (item, index, i0) => {
      return {
        a: common_vendor.t(item.title),
        b: common_vendor.t(item.date),
        c: common_vendor.f(item.tags, (tag, idx, i1) => {
          return {
            a: common_vendor.t(tag),
            b: idx
          };
        }),
        d: index
      };
    }),
    c: common_vendor.o((...args) => $options.onFabClick && $options.onFabClick(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
