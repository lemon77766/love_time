"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return { history: [] };
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    loadHistory() {
      try {
        const data = common_vendor.index.getStorageSync("qna_history");
        const list = Array.isArray(data) ? data : [];
        this.history = list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      } catch (e) {
        this.history = [];
      }
    },
    pad2(n) {
      return String(n).padStart(2, "0");
    },
    openItem(item) {
      const qid = encodeURIComponent(item.questionId);
      const time = encodeURIComponent(item.time || "");
      common_vendor.index.navigateTo({ url: `/pages/qna/index?qid=${qid}&time=${time}` });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.history, (item, i, i0) => {
      return {
        a: common_vendor.t($options.pad2(i + 1)),
        b: common_vendor.t(item.question),
        c: common_vendor.n(item.myAnswer ? "done" : "todo"),
        d: i,
        e: common_vendor.o(($event) => $options.openItem(item), i)
      };
    }),
    b: $data.history.length === 0
  }, $data.history.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/qna/history.js.map
