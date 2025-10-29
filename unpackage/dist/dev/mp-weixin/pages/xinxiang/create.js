"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentStep: 1,
      selectedStyle: 1,
      isCustomStyle: false,
      customImage: "",
      opacity: 100,
      showOpacityModal: false,
      showPreviewModal: false,
      showLivePreviewModal: false,
      // 裁剪区域相关
      cropArea: {
        left: 0,
        top: 0,
        width: 100,
        height: 100
      },
      // 底图缩放比例（100% 为原始大小）
      imageScale: 100,
      // 是否从预览打开的调整弹窗
      fromPreview: false,
      isDragging: false,
      isResizing: false,
      dragStart: { x: 0, y: 0 },
      imageInfo: { width: 0, height: 0 },
      form: {
        title: "",
        deliveryDate: "",
        phone: "",
        wechat: "",
        content: ""
      }
    };
  },
  computed: {
    minDate() {
      const today = /* @__PURE__ */ new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 获取信件底图路径
    letterBackground() {
      if (this.isCustomStyle) {
        return this.customImage;
      }
      return `/static/xinxiang/xin${this.selectedStyle}.jpg`;
    }
  },
  methods: {
    // 选择预设样式
    selectPresetStyle(index) {
      this.selectedStyle = index;
      this.isCustomStyle = false;
      this.customImage = "";
    },
    // 上传自定义图片
    uploadCustom() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.customImage = res.tempFilePaths[0];
          this.isCustomStyle = true;
          this.opacity = 100;
          this.cropArea = {
            left: 10,
            top: 10,
            width: 80,
            height: 80
          };
          common_vendor.index.getImageInfo({
            src: res.tempFilePaths[0],
            success: (info) => {
              this.imageInfo = {
                width: info.width,
                height: info.height
              };
            }
          });
          this.showOpacityModal = true;
          common_vendor.index.showToast({ title: "自定义底图已选择", icon: "success" });
        }
      });
    },
    // 调整透明度（滑动中）
    onOpacityChanging(e) {
      this.opacity = e.detail.value;
    },
    // 调整透明度（松开）
    onOpacityChange(e) {
      this.opacity = e.detail.value;
    },
    // 调整图片缩放（滑动中）
    onScaleChanging(e) {
      this.imageScale = e.detail.value;
    },
    // 调整图片缩放（松开）
    onScaleChange(e) {
      this.imageScale = e.detail.value;
    },
    // 开始拖动裁剪框
    startDrag(e) {
      this.isDragging = true;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    // 拖动裁剪框
    onDrag(e) {
      if (!this.isDragging)
        return;
      const deltaX = e.touches[0].clientX - this.dragStart.x;
      const deltaY = e.touches[0].clientY - this.dragStart.y;
      const percentX = deltaX / 600 * 100;
      const percentY = deltaY / 600 * 100;
      let newLeft = this.cropArea.left + percentX;
      let newTop = this.cropArea.top + percentY;
      newLeft = Math.max(0, Math.min(100 - this.cropArea.width, newLeft));
      newTop = Math.max(0, Math.min(100 - this.cropArea.height, newTop));
      this.cropArea.left = newLeft;
      this.cropArea.top = newTop;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    // 结束拖动
    endDrag() {
      this.isDragging = false;
      this.isResizing = false;
    },
    // 开始调整大小
    startResize(e) {
      this.isResizing = true;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      e.stopPropagation();
    },
    // 调整大小
    onResize(e) {
      if (!this.isResizing)
        return;
      const deltaX = e.touches[0].clientX - this.dragStart.x;
      const deltaY = e.touches[0].clientY - this.dragStart.y;
      const percentX = deltaX / 600 * 100;
      const percentY = deltaY / 600 * 100;
      let newWidth = this.cropArea.width + percentX;
      let newHeight = this.cropArea.height + percentY;
      newWidth = Math.max(20, Math.min(100 - this.cropArea.left, newWidth));
      newHeight = Math.max(20, Math.min(100 - this.cropArea.top, newHeight));
      this.cropArea.width = newWidth;
      this.cropArea.height = newHeight;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      e.stopPropagation();
    },
    // 打开预览弹窗
    openPreview() {
      this.showLivePreviewModal = true;
    },
    // 完成调整（智能判断是否需要返回预览）
    finishAdjust() {
      this.showOpacityModal = false;
      if (this.fromPreview) {
        this.showLivePreviewModal = true;
        this.fromPreview = false;
      }
    },
    // 从预览打开调整弹窗
    openAdjustFromPreview() {
      this.fromPreview = true;
      this.showLivePreviewModal = false;
      this.showOpacityModal = true;
    },
    // 日期选择
    onDateChange(e) {
      this.form.deliveryDate = e.detail.value;
    },
    // 下一步
    nextStep() {
      if (!this.selectedStyle && !this.isCustomStyle) {
        common_vendor.index.showToast({ title: "请选择信件样式", icon: "none" });
        return;
      }
      this.currentStep = 2;
    },
    // 上一步
    prevStep() {
      this.currentStep = 1;
    },
    // 提交信件
    submitLetter() {
      if (!this.form.title) {
        common_vendor.index.showToast({ title: "请填写信件主题", icon: "none" });
        return;
      }
      if (!this.form.deliveryDate) {
        common_vendor.index.showToast({ title: "请选择送达时间", icon: "none" });
        return;
      }
      if (!this.form.phone) {
        common_vendor.index.showToast({ title: "请填写手机号", icon: "none" });
        return;
      }
      if (this.form.phone.length !== 11) {
        common_vendor.index.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      if (!this.form.content) {
        common_vendor.index.showToast({ title: "请填写信件内容", icon: "none" });
        return;
      }
      const letterData = {
        style: this.isCustomStyle ? "custom" : this.selectedStyle,
        customImage: this.customImage,
        opacity: this.opacity,
        cropArea: this.cropArea,
        title: this.form.title,
        deliveryDate: this.form.deliveryDate,
        phone: this.form.phone,
        wechat: this.form.wechat,
        content: this.form.content,
        createTime: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      try {
        const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
        letters.unshift(letterData);
        common_vendor.index.setStorageSync("xinxiang_letters", letters);
        this.showPreviewModal = true;
      } catch (e) {
        common_vendor.index.showToast({ title: "提交失败，请重试", icon: "none" });
      }
    },
    // 关闭预览弹窗并返回
    closePreviewAndBack() {
      this.showPreviewModal = false;
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 300);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentStep === 1 ? 1 : "",
    b: $data.currentStep === 2 ? 1 : "",
    c: $data.currentStep === 1
  }, $data.currentStep === 1 ? common_vendor.e({
    d: common_vendor.f([1, 2, 4, 5, 6, 7], (i, k0, i0) => {
      return common_vendor.e({
        a: `/static/xinxiang/xin${i}.jpg`,
        b: $data.selectedStyle === i && !$data.isCustomStyle
      }, $data.selectedStyle === i && !$data.isCustomStyle ? {} : {}, {
        c: i,
        d: $data.selectedStyle === i && !$data.isCustomStyle ? 1 : "",
        e: common_vendor.o(($event) => $options.selectPresetStyle(i), i)
      });
    }),
    e: common_vendor.o((...args) => $options.uploadCustom && $options.uploadCustom(...args)),
    f: $data.customImage
  }, $data.customImage ? {
    g: $data.customImage,
    h: 1 - $data.opacity / 100,
    i: $data.cropArea.top + "%",
    j: $data.cropArea.left + "%",
    k: $data.cropArea.width + "%",
    l: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    m: $data.cropArea.top + "%",
    n: $data.cropArea.height + "%",
    o: $data.cropArea.top + $data.cropArea.height + "%",
    p: 100 - $data.cropArea.top - $data.cropArea.height + "%",
    q: $data.cropArea.left + "%",
    r: $data.cropArea.top + "%",
    s: $data.cropArea.width + "%",
    t: $data.cropArea.height + "%",
    v: common_vendor.o(($event) => $data.showOpacityModal = true)
  } : {}, {
    w: common_vendor.o((...args) => $options.nextStep && $options.nextStep(...args))
  }) : {}, {
    x: $data.showOpacityModal
  }, $data.showOpacityModal ? {
    y: $data.customImage,
    z: "scale(" + $data.imageScale / 100 + ")",
    A: 1 - $data.opacity / 100,
    B: $data.cropArea.top + "%",
    C: $data.cropArea.left + "%",
    D: $data.cropArea.width + "%",
    E: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    F: $data.cropArea.top + "%",
    G: $data.cropArea.height + "%",
    H: $data.cropArea.top + $data.cropArea.height + "%",
    I: 100 - $data.cropArea.top - $data.cropArea.height + "%",
    J: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    K: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    L: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    M: $data.cropArea.left + "%",
    N: $data.cropArea.top + "%",
    O: $data.cropArea.width + "%",
    P: $data.cropArea.height + "%",
    Q: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    R: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    S: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    T: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    U: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    V: $data.opacity,
    W: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    X: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    Y: common_vendor.t($data.opacity),
    Z: $data.imageScale,
    aa: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    ab: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    ac: common_vendor.t($data.imageScale),
    ad: common_vendor.o((...args) => $options.finishAdjust && $options.finishAdjust(...args)),
    ae: common_vendor.o(() => {
    }),
    af: common_vendor.o(($event) => $data.showOpacityModal = false)
  } : {}, {
    ag: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    ah: $data.form.title,
    ai: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    aj: common_vendor.t($data.form.deliveryDate || "请选择日期"),
    ak: $data.form.deliveryDate,
    al: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    am: $options.minDate,
    an: $data.form.phone,
    ao: common_vendor.o(($event) => $data.form.phone = $event.detail.value),
    ap: $data.form.wechat,
    aq: common_vendor.o(($event) => $data.form.wechat = $event.detail.value),
    ar: $data.form.content,
    as: common_vendor.o(($event) => $data.form.content = $event.detail.value),
    at: common_vendor.t($data.form.content.length),
    av: common_vendor.o((...args) => $options.prevStep && $options.prevStep(...args)),
    aw: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args)),
    ax: common_vendor.o((...args) => $options.submitLetter && $options.submitLetter(...args))
  } : {}, {
    ay: $data.showLivePreviewModal
  }, $data.showLivePreviewModal ? common_vendor.e({
    az: $options.letterBackground,
    aA: "scale(" + $data.imageScale / 100 + ")",
    aB: 1 - $data.opacity / 100,
    aC: common_vendor.t($data.form.title || "信件主题"),
    aD: common_vendor.t($data.form.deliveryDate || "未选择"),
    aE: common_vendor.t($data.form.content || "信件内容..."),
    aF: $data.form.phone
  }, $data.form.phone ? {
    aG: common_vendor.t($data.form.phone.slice(0, 3)),
    aH: common_vendor.t($data.form.phone.slice(-4))
  } : {}, {
    aI: $data.opacity,
    aJ: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    aK: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    aL: common_vendor.t($data.opacity),
    aM: $data.imageScale,
    aN: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    aO: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    aP: common_vendor.t($data.imageScale),
    aQ: common_vendor.o((...args) => $options.openAdjustFromPreview && $options.openAdjustFromPreview(...args)),
    aR: common_vendor.o(($event) => $data.showLivePreviewModal = false),
    aS: common_vendor.o(() => {
    }),
    aT: common_vendor.o(($event) => $data.showLivePreviewModal = false)
  }) : {}, {
    aU: $data.showOpacityModal
  }, $data.showOpacityModal ? common_vendor.e({
    aV: $options.letterBackground,
    aW: "scale(" + $data.imageScale / 100 + ")",
    aX: 1 - $data.opacity / 100,
    aY: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    aZ: $data.cropArea.top + "%",
    ba: $data.cropArea.left + "%",
    bb: $data.cropArea.width + "%",
    bc: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    bd: $data.cropArea.top + "%",
    be: $data.cropArea.height + "%",
    bf: $data.cropArea.top + $data.cropArea.height + "%",
    bg: 100 - $data.cropArea.top - $data.cropArea.height + "%"
  } : {}, {
    bh: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    bi: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    bj: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    bk: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    bl: $data.cropArea.left + "%",
    bm: $data.cropArea.top + "%",
    bn: $data.cropArea.width + "%",
    bo: $data.cropArea.height + "%",
    bp: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    bq: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    br: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args))
  } : {}, {
    bs: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    bt: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    bv: $data.opacity,
    bw: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    bx: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    by: common_vendor.t($data.opacity),
    bz: $data.imageScale,
    bA: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    bB: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    bC: common_vendor.t($data.imageScale),
    bD: common_vendor.o((...args) => $options.finishAdjust && $options.finishAdjust(...args)),
    bE: common_vendor.o(() => {
    }),
    bF: common_vendor.o(($event) => $data.showOpacityModal = false)
  }) : {}, {
    bG: $data.showPreviewModal
  }, $data.showPreviewModal ? {
    bH: $options.letterBackground,
    bI: $data.isCustomStyle ? `inset(${$data.cropArea.top}% ${100 - $data.cropArea.left - $data.cropArea.width}% ${100 - $data.cropArea.top - $data.cropArea.height}% ${$data.cropArea.left}%)` : "none",
    bJ: 1 - $data.opacity / 100,
    bK: common_vendor.t($data.form.title),
    bL: common_vendor.t($data.form.deliveryDate),
    bM: common_vendor.t($data.form.content),
    bN: common_vendor.t($data.form.phone.slice(0, 3)),
    bO: common_vendor.t($data.form.phone.slice(-4)),
    bP: common_vendor.o((...args) => $options.closePreviewAndBack && $options.closePreviewAndBack(...args)),
    bQ: common_vendor.o(() => {
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/create.js.map
