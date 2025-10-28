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
    // 打开调整弹窗
    openAdjustModal() {
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
    z: 1 - $data.opacity / 100,
    A: $data.cropArea.top + "%",
    B: $data.cropArea.left + "%",
    C: $data.cropArea.width + "%",
    D: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    E: $data.cropArea.top + "%",
    F: $data.cropArea.height + "%",
    G: $data.cropArea.top + $data.cropArea.height + "%",
    H: 100 - $data.cropArea.top - $data.cropArea.height + "%",
    I: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    J: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    K: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    L: $data.cropArea.left + "%",
    M: $data.cropArea.top + "%",
    N: $data.cropArea.width + "%",
    O: $data.cropArea.height + "%",
    P: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    Q: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    R: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    S: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    T: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    U: $data.opacity,
    V: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    W: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    X: common_vendor.t($data.opacity),
    Y: common_vendor.o(($event) => $data.showOpacityModal = false),
    Z: common_vendor.o(() => {
    }),
    aa: common_vendor.o(($event) => $data.showOpacityModal = false)
  } : {}, {
    ab: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    ac: $data.form.title,
    ad: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    ae: common_vendor.t($data.form.deliveryDate || "请选择日期"),
    af: $data.form.deliveryDate,
    ag: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    ah: $options.minDate,
    ai: $data.form.phone,
    aj: common_vendor.o(($event) => $data.form.phone = $event.detail.value),
    ak: $data.form.wechat,
    al: common_vendor.o(($event) => $data.form.wechat = $event.detail.value),
    am: $data.form.content,
    an: common_vendor.o(($event) => $data.form.content = $event.detail.value),
    ao: common_vendor.t($data.form.content.length),
    ap: common_vendor.o((...args) => $options.prevStep && $options.prevStep(...args)),
    aq: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args)),
    ar: common_vendor.o((...args) => $options.submitLetter && $options.submitLetter(...args))
  } : {}, {
    as: $data.showLivePreviewModal
  }, $data.showLivePreviewModal ? common_vendor.e({
    at: $options.letterBackground,
    av: 1 - $data.opacity / 100,
    aw: common_vendor.t($data.form.title || "信件主题"),
    ax: common_vendor.t($data.form.deliveryDate || "未选择"),
    ay: common_vendor.t($data.form.content || "信件内容..."),
    az: $data.form.phone
  }, $data.form.phone ? {
    aA: common_vendor.t($data.form.phone.slice(0, 3)),
    aB: common_vendor.t($data.form.phone.slice(-4))
  } : {}, {
    aC: common_vendor.o((...args) => $options.openAdjustModal && $options.openAdjustModal(...args)),
    aD: common_vendor.o(($event) => $data.showLivePreviewModal = false),
    aE: common_vendor.o(() => {
    }),
    aF: common_vendor.o(($event) => $data.showLivePreviewModal = false)
  }) : {}, {
    aG: $data.showOpacityModal
  }, $data.showOpacityModal ? common_vendor.e({
    aH: $options.letterBackground,
    aI: 1 - $data.opacity / 100,
    aJ: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    aK: $data.cropArea.top + "%",
    aL: $data.cropArea.left + "%",
    aM: $data.cropArea.width + "%",
    aN: 100 - $data.cropArea.left - $data.cropArea.width + "%",
    aO: $data.cropArea.top + "%",
    aP: $data.cropArea.height + "%",
    aQ: $data.cropArea.top + $data.cropArea.height + "%",
    aR: 100 - $data.cropArea.top - $data.cropArea.height + "%"
  } : {}, {
    aS: $data.isCustomStyle
  }, $data.isCustomStyle ? {
    aT: common_vendor.o((...args) => $options.startResize && $options.startResize(...args)),
    aU: common_vendor.o((...args) => $options.onResize && $options.onResize(...args)),
    aV: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    aW: $data.cropArea.left + "%",
    aX: $data.cropArea.top + "%",
    aY: $data.cropArea.width + "%",
    aZ: $data.cropArea.height + "%",
    ba: common_vendor.o((...args) => $options.startDrag && $options.startDrag(...args)),
    bb: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    bc: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args))
  } : {}, {
    bd: common_vendor.o((...args) => $options.onDrag && $options.onDrag(...args)),
    be: common_vendor.o((...args) => $options.endDrag && $options.endDrag(...args)),
    bf: $data.opacity,
    bg: common_vendor.o((...args) => $options.onOpacityChange && $options.onOpacityChange(...args)),
    bh: common_vendor.o((...args) => $options.onOpacityChanging && $options.onOpacityChanging(...args)),
    bi: common_vendor.t($data.opacity),
    bj: common_vendor.o(($event) => $data.showOpacityModal = false),
    bk: common_vendor.o(() => {
    }),
    bl: common_vendor.o(($event) => $data.showOpacityModal = false)
  }) : {}, {
    bm: $data.showPreviewModal
  }, $data.showPreviewModal ? {
    bn: $options.letterBackground,
    bo: $data.isCustomStyle ? `inset(${$data.cropArea.top}% ${100 - $data.cropArea.left - $data.cropArea.width}% ${100 - $data.cropArea.top - $data.cropArea.height}% ${$data.cropArea.left}%)` : "none",
    bp: 1 - $data.opacity / 100,
    bq: common_vendor.t($data.form.title),
    br: common_vendor.t($data.form.deliveryDate),
    bs: common_vendor.t($data.form.content),
    bt: common_vendor.t($data.form.phone.slice(0, 3)),
    bv: common_vendor.t($data.form.phone.slice(-4)),
    bw: common_vendor.o((...args) => $options.closePreviewAndBack && $options.closePreviewAndBack(...args)),
    bx: common_vendor.o(() => {
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/create.js.map
