"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
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
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    },
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
  onLoad() {
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
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.currentStep === 1 ? 1 : "",
    e: $data.currentStep === 2 ? 1 : "",
    f: $data.currentStep === 1
  }, $data.currentStep === 1 ? common_vendor.e({
    g: common_vendor.f([1, 2, 4, 5, 6, 7], (i, k0, i0) => {
      return common_vendor.e({
        a: `/static/xinxiang/xin${i}.jpg`,
        b: $data.selectedStyle === i && !$data.isCustomStyle
      }, $data.selectedStyle === i && !$data.isCustomStyle ? {} : {}, {
        c: i,
        d: $data.selectedStyle === i && !$data.isCustomStyle ? 1 : "",
        e: common_vendor.o(($event) => $options.selectPresetStyle(i), i)
      });
    }),
    h: common_vendor.o((...args) => $options.uploadCustom && $options.uploadCustom(...args)),
    i: $data.customImage
  }, $data.customImage ? {
    j: $data.customImage,
    k: 1 - $data.opacity / 100,
    l: $data.cropArea.top + "%",
    m: $data.cropArea.left + "%",
    n: $data.cropArea.width + "%",
    o: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    p: $data.cropArea.top + "%",
    q: $data.cropArea.height + "%",
    r: $data.cropArea.top + $data.cropArea.height + "%",
    s: 100 - $data.cropArea.top - $data.cropArea.height + "%",
    t: $data.cropArea.left + "%",
    v: $data.cropArea.top + "%",
    w: $data.cropArea.width + "%",
    x: $data.cropArea.height + "%",
    y: common_vendor.o(($event) => $data.showOpacityModal = true)
  } : {}, {
    z: common_vendor.o((...args) => $options.nextStep && $options.nextStep(...args))
  }) : {}, {
    A: $data.showOpacityModal
  }, $data.showOpacityModal ? {
    B: $data.customImage,
    C: "scale(" + $data.imageScale / 100 + ")",
    D: 1 - $data.opacity / 100,
    E: $data.cropArea.top + "%",
    F: $data.cropArea.left + "%",
    G: $data.cropArea.width + "%",
    H: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    I: $data.cropArea.top + "%",
    J: $data.cropArea.height + "%",
    K: $data.cropArea.top + $data.cropArea.height + "%",
    L: 100 - $data.cropArea.top - $data.cropArea.height + "%",
    M: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    N: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    O: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    P: $data.cropArea.left + "%",
    Q: $data.cropArea.top + "%",
    R: $data.cropArea.width + "%",
    S: $data.cropArea.height + "%",
    T: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    U: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    V: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    W: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    X: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    Y: $data.opacity,
    Z: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    aa: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    ab: common_vendor.t($data.opacity),
    ac: $data.imageScale,
    ad: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    ae: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    af: common_vendor.t($data.imageScale),
    ag: common_vendor.o((...args) => $options.finishAdjust && $options.finishAdjust(...args)),
    ah: common_vendor.o(() => {
    }),
    ai: common_vendor.o(($event) => $data.showOpacityModal = false)
  } : {}, {
    aj: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    ak: $data.form.title,
    al: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    am: common_vendor.t($data.form.deliveryDate || "请选择日期"),
    an: $data.form.deliveryDate,
    ao: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    ap: $options.minDate,
    aq: $data.form.phone,
    ar: common_vendor.o(($event) => $data.form.phone = $event.detail.value),
    as: $data.form.wechat,
    at: common_vendor.o(($event) => $data.form.wechat = $event.detail.value),
    av: $data.form.content,
    aw: common_vendor.o(($event) => $data.form.content = $event.detail.value),
    ax: common_vendor.t($data.form.content.length),
    ay: common_vendor.o((...args) => $options.prevStep && $options.prevStep(...args)),
    az: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args)),
    aA: common_vendor.o((...args) => $options.submitLetter && $options.submitLetter(...args))
  } : {}, {
    aB: $data.showLivePreviewModal
  }, $data.showLivePreviewModal ? common_vendor.e({
    aC: $options.letterBackground,
    aD: "scale(" + $data.imageScale / 100 + ")",
    aE: 1 - $data.opacity / 100,
    aF: common_vendor.t($data.form.title || "信件主题"),
    aG: common_vendor.t($data.form.deliveryDate || "未选择"),
    aH: common_vendor.t($data.form.content || "信件内容..."),
    aI: $data.form.phone
  }, $data.form.phone ? {
    aJ: common_vendor.t($data.form.phone.slice(0, 3)),
    aK: common_vendor.t($data.form.phone.slice(-4))
  } : {}, {
    aL: $data.opacity,
    aM: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    aN: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    aO: common_vendor.t($data.opacity),
    aP: $data.imageScale,
    aQ: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    aR: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    aS: common_vendor.t($data.imageScale),
    aT: common_vendor.o((...args) => $options.openAdjustFromPreview && $options.openAdjustFromPreview(...args)),
    aU: common_vendor.o(($event) => $data.showLivePreviewModal = false),
    aV: common_vendor.o(() => {
    }),
    aW: common_vendor.o(($event) => $data.showLivePreviewModal = false)
  }) : {}, {
    aX: $data.showOpacityModal
  }, $data.showOpacityModal ? common_vendor.e({
    aY: $options.letterBackground,
    aZ: "scale(" + $data.imageScale / 100 + ")",
    ba: 1 - $data.opacity / 100,
    bb: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    bc: $data.cropArea.top + "%",
    bd: $data.cropArea.left + "%",
    be: $data.cropArea.width + "%",
    bf: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    bg: $data.cropArea.top + "%",
    bh: $data.cropArea.height + "%",
    bi: $data.cropArea.top + $data.cropArea.height + "%",
    bj: 100 - $data.cropArea.top - $data.cropArea.height + "%"
  } : {}, {
    bk: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    bl: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    bm: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    bn: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    bo: $data.cropArea.left + "%",
    bp: $data.cropArea.top + "%",
    bq: $data.cropArea.width + "%",
    br: $data.cropArea.height + "%",
    bs: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    bt: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    bv: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args))
  } : {}, {
    bw: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    bx: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    by: $data.opacity,
    bz: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    bA: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    bB: common_vendor.t($data.opacity),
    bC: $data.imageScale,
    bD: common_vendor.o((...args) => $options.onScaleChange && $options.onScaleChange(...args)),
    bE: common_vendor.o((...args) => $options.onScaleChanging && $options.onScaleChanging(...args)),
    bF: common_vendor.t($data.imageScale),
    bG: common_vendor.o((...args) => $options.finishAdjust && $options.finishAdjust(...args)),
    bH: common_vendor.o(() => {
    }),
    bI: common_vendor.o(($event) => $data.showOpacityModal = false)
  }) : {}, {
    bJ: $data.showPreviewModal
  }, $data.showPreviewModal ? {
    bK: $options.letterBackground,
    bL: $data.isCustomStyle ? `inset(${$data.cropArea.top}% ${100 - $data.cropArea.left - $data.cropArea.width}% ${100 - $data.cropArea.top - $data.cropArea.height}% ${$data.cropArea.left}%)` : "none",
    bM: 1 - $data.opacity / 100,
    bN: common_vendor.t($data.form.title),
    bO: common_vendor.t($data.form.deliveryDate),
    bP: common_vendor.t($data.form.content),
    bQ: common_vendor.t($data.form.phone.slice(0, 3)),
    bR: common_vendor.t($data.form.phone.slice(-4)),
    bS: common_vendor.o((...args) => $options.closePreviewAndBack && $options.closePreviewAndBack(...args)),
    bT: common_vendor.o(() => {
    })
  } : {}, {
    bU: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/create.js.map
