"use strict";
const common_vendor = require("../../../../common/vendor.js");
const common_assets = require("../../../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      stages: [],
      // 清空默认阶段，由用户自己添加
      isRiverActive: false,
      hoveredIdx: -1,
      showDetail: false,
      currentStage: {},
      showAdd: false,
      form: {
        title: "",
        date: "",
        description: "",
        top: null,
        left: null
      },
      selectPosMode: false,
      tempPos: null
    };
  },
  methods: {
    onSideChange(e) {
      this.form.sideIndex = Number(e.detail.value || 0);
    },
    setHover(v) {
      this.isRiverActive = !!v;
      if (!v)
        this.hoveredIdx = -1;
    },
    onStartSelectPosition() {
      this.selectPosMode = true;
      this.showAdd = false;
      this.isRiverActive = true;
      this.tempPos = null;
      common_vendor.index.showToast({ title: "请在长河上点击选择位置", icon: "none" });
    },
    onRiverClick(e) {
      if (!this.selectPosMode)
        return;
      const touch = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0] || e.detail || {};
      const pageX = touch.pageX || touch.x || 0;
      const pageY = touch.pageY || touch.y || 0;
      common_vendor.index.createSelectorQuery().in(this).select(".river-wrapper").boundingClientRect((rect) => {
        if (!rect || !rect.width || !rect.height)
          return;
        const leftPct = Math.max(0, Math.min(100, (pageX - rect.left) / rect.width * 100));
        const topPct = Math.max(0, Math.min(100, (pageY - rect.top) / rect.height * 100));
        this.form.left = leftPct;
        this.form.top = topPct;
        this.tempPos = { left: leftPct, top: topPct };
        this.selectPosMode = false;
        this.showAdd = true;
        common_vendor.index.showToast({ title: "位置已选择", icon: "none" });
      }).exec();
    },
    setStageHover(idx, v) {
      if (!this.isRiverActive)
        return;
      this.hoveredIdx = v ? idx : -1;
    },
    openStage(stage) {
      this.currentStage = stage;
      this.showDetail = true;
    },
    closeDetail() {
      this.showDetail = false;
      this.currentStage = {};
    },
    cancelAdd() {
      this.showAdd = false;
      this.resetForm();
    },
    saveAdd() {
      if (!this.form.title || !this.form.date) {
        common_vendor.index.showToast({ title: "请填写标题和日期", icon: "none" });
        return;
      }
      const side = this.form.left != null && this.form.left > 50 ? "right" : "left";
      const top = this.form.top != null ? this.form.top : this.computeNextTop();
      const left = this.form.left != null ? this.form.left : 50;
      this.stages.push({
        title: this.form.title,
        date: this.form.date,
        description: this.form.description,
        side,
        top,
        left
      });
      this.showAdd = false;
      this.selectPosMode = false;
      this.tempPos = null;
      this.resetForm();
      common_vendor.index.showToast({ title: "已新增阶段", icon: "none" });
    },
    computeNextTop() {
      if (this.stages.length === 0)
        return 6;
      const last = this.stages[this.stages.length - 1];
      return Math.min(94, last.top + 12);
    },
    resetForm() {
      this.form = { title: "", date: "", description: "", top: null, left: null };
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$2,
    b: $data.showAdd && $data.selectPosMode
  }, $data.showAdd && $data.selectPosMode ? {} : {}, {
    c: $data.tempPos
  }, $data.tempPos ? {
    d: $data.tempPos.top + "%",
    e: $data.tempPos.left + "%"
  } : {}, {
    f: common_vendor.f($data.stages, (stage, idx, i0) => {
      return {
        a: idx,
        b: common_vendor.n(stage.side),
        c: stage.top + "%",
        d: (stage.left || 50) + "%",
        e: common_vendor.o(($event) => $options.openStage(stage), idx)
      };
    }),
    g: common_vendor.o(($event) => $data.showAdd = true),
    h: $data.isRiverActive ? 1 : "",
    i: common_vendor.o(($event) => $options.setHover(true)),
    j: common_vendor.o(($event) => $options.setHover(false)),
    k: common_vendor.o((...args) => $options.onRiverClick && $options.onRiverClick(...args)),
    l: common_vendor.o((...args) => $options.onRiverClick && $options.onRiverClick(...args)),
    m: $data.showDetail
  }, $data.showDetail ? common_vendor.e({
    n: common_assets._imports_1$1,
    o: common_vendor.t($data.currentStage.title),
    p: common_vendor.t($data.currentStage.date),
    q: $data.currentStage.description
  }, $data.currentStage.description ? {
    r: common_vendor.t($data.currentStage.description)
  } : {}, {
    s: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    t: common_vendor.o(() => {
    }),
    v: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {}, {
    w: $data.showAdd
  }, $data.showAdd ? common_vendor.e({
    x: $data.form.title,
    y: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    z: $data.form.date,
    A: common_vendor.o(($event) => $data.form.date = $event.detail.value),
    B: $data.form.description,
    C: common_vendor.o(($event) => $data.form.description = $event.detail.value),
    D: common_vendor.o((...args) => $options.onStartSelectPosition && $options.onStartSelectPosition(...args)),
    E: $data.form.top !== null
  }, $data.form.top !== null ? {
    F: common_vendor.t(($data.form.top || 0).toFixed(1)),
    G: common_vendor.t(($data.form.left || 0).toFixed(1))
  } : {}, {
    H: common_vendor.o((...args) => $options.cancelAdd && $options.cancelAdd(...args)),
    I: common_vendor.o((...args) => $options.saveAdd && $options.saveAdd(...args)),
    J: common_vendor.o(() => {
    }),
    K: common_vendor.o((...args) => $options.cancelAdd && $options.cancelAdd(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/jiyi/index.js.map
