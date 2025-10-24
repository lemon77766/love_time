"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      stages: [
        { title: "初遇", date: "2022-03-12", summary: "第一次见面，怦然心动", description: "图书馆偶遇，笑容很温暖。", side: "left", top: 6 },
        { title: "表白", date: "2022-05-20", summary: "确定关系的那一天", description: "晚风微醺，你说我们在一起吧。", side: "right", top: 18 },
        { title: "第一次旅行", date: "2022-08-15", summary: "海边日落很美", description: "一起踏浪、看日出，拍了很多照片。", side: "left", top: 32 },
        { title: "第一次共度新年", date: "2023-01-01", summary: "倒数的那一刻拥抱", description: "在家做了很多好吃的，烟花很绚烂。", side: "right", top: 46 },
        { title: "见家长", date: "2023-03-18", summary: "紧张又期待", description: "叔叔阿姨都很亲切，准备了礼物。", side: "left", top: 60 },
        { title: "同居", date: "2023-09-01", summary: "开启新的生活", description: "一起装修小家，买了绿植。", side: "right", top: 74 },
        { title: "订婚", date: "2024-02-14", summary: "玫瑰与承诺", description: "在一起更坚定了彼此。", side: "left", top: 88 }
      ],
      isRiverActive: false,
      hoveredIdx: -1,
      showDetail: false,
      currentStage: {},
      showAdd: false,
      form: {
        title: "",
        date: "",
        summary: "",
        description: "",
        sideIndex: 0,
        top: null,
        left: null
      },
      sideOptions: ["左侧", "右侧"],
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
      if (!this.isRiverActive)
        return;
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
      const side = this.form.sideIndex === 0 ? "left" : "right";
      const top = this.form.top != null ? this.form.top : this.computeNextTop();
      const left = this.form.left != null ? this.form.left : 50;
      this.stages.push({
        title: this.form.title,
        date: this.form.date,
        summary: this.form.summary,
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
      this.form = { title: "", date: "", summary: "", description: "", sideIndex: 0 };
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$3,
    b: !$data.isRiverActive
  }, !$data.isRiverActive ? {} : {}, {
    c: $data.showAdd && $data.selectPosMode
  }, $data.showAdd && $data.selectPosMode ? {} : {}, {
    d: $data.tempPos
  }, $data.tempPos ? {
    e: $data.tempPos.top + "%",
    f: $data.tempPos.left + "%"
  } : {}, {
    g: common_vendor.f($data.stages, (stage, idx, i0) => {
      return common_vendor.e({
        a: $data.isRiverActive && $data.hoveredIdx === idx
      }, $data.isRiverActive && $data.hoveredIdx === idx ? {
        b: common_vendor.t(stage.title),
        c: common_vendor.t(stage.date),
        d: common_vendor.t(stage.summary),
        e: common_vendor.n(stage.side)
      } : {}, {
        f: idx,
        g: common_vendor.n(stage.side),
        h: stage.top + "%",
        i: (stage.left || 50) + "%",
        j: common_vendor.o(($event) => $options.setStageHover(idx, true), idx),
        k: common_vendor.o(($event) => $options.setStageHover(idx, false), idx),
        l: common_vendor.o(($event) => $options.openStage(stage), idx)
      });
    }),
    h: common_vendor.o(($event) => $data.showAdd = true),
    i: $data.isRiverActive ? 1 : "",
    j: common_vendor.o(($event) => $options.setHover(true)),
    k: common_vendor.o(($event) => $options.setHover(false)),
    l: common_vendor.o((...args) => $options.onRiverClick && $options.onRiverClick(...args)),
    m: common_vendor.o((...args) => $options.onRiverClick && $options.onRiverClick(...args)),
    n: $data.showDetail
  }, $data.showDetail ? {
    o: common_vendor.t($data.currentStage.title),
    p: common_vendor.t($data.currentStage.date),
    q: common_vendor.t($data.currentStage.description || $data.currentStage.summary),
    r: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    s: common_vendor.o(() => {
    }),
    t: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  } : {}, {
    v: $data.showAdd
  }, $data.showAdd ? common_vendor.e({
    w: $data.form.title,
    x: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    y: $data.form.date,
    z: common_vendor.o(($event) => $data.form.date = $event.detail.value),
    A: $data.form.summary,
    B: common_vendor.o(($event) => $data.form.summary = $event.detail.value),
    C: $data.form.description,
    D: common_vendor.o(($event) => $data.form.description = $event.detail.value),
    E: common_vendor.t($data.sideOptions[$data.form.sideIndex]),
    F: $data.sideOptions,
    G: $data.form.sideIndex,
    H: common_vendor.o((...args) => $options.onSideChange && $options.onSideChange(...args)),
    I: common_vendor.o((...args) => $options.onStartSelectPosition && $options.onStartSelectPosition(...args)),
    J: $data.form.top !== null
  }, $data.form.top !== null ? {
    K: common_vendor.t(($data.form.top || 0).toFixed(1)),
    L: common_vendor.t(($data.form.left || 0).toFixed(1))
  } : {}, {
    M: common_vendor.o((...args) => $options.cancelAdd && $options.cancelAdd(...args)),
    N: common_vendor.o((...args) => $options.saveAdd && $options.saveAdd(...args)),
    O: common_vendor.o(() => {
    }),
    P: common_vendor.o((...args) => $options.cancelAdd && $options.cancelAdd(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/jiyi/index.js.map
