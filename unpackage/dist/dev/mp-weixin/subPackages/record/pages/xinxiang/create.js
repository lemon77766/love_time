"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_futureLetter = require("../../../../api/futureLetter.js");
const utils_couple = require("../../../../utils/couple.js");
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
      showPreviewModal: false,
      showLivePreviewModal: false,
      form: {
        title: "",
        deliveryDate: "",
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
      return `../../static/xinxiang/xin${this.selectedStyle}.jpg`;
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
          common_vendor.index.showToast({ title: "自定义底图已选择", icon: "success" });
        }
      });
    },
    // 打开预览弹窗
    openPreview() {
      this.showLivePreviewModal = true;
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
    async submitLetter() {
      var _a;
      if (!this.form.title) {
        common_vendor.index.showToast({ title: "请填写信件主题", icon: "none" });
        return;
      }
      if (!this.form.deliveryDate) {
        common_vendor.index.showToast({ title: "请选择送达时间", icon: "none" });
        return;
      }
      if (!this.form.content) {
        common_vendor.index.showToast({ title: "请填写信件内容", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "正在创建..." });
      try {
        let receiverId = null;
        if (utils_couple.isBound()) {
          try {
            const coupleInfo = common_vendor.index.getStorageSync("couple_info");
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:335", "👫 [情侣信息]", coupleInfo);
            if (coupleInfo && coupleInfo.partnerId) {
              receiverId = coupleInfo.partnerId;
              common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:340", "✅ [获取对方ID] 从 partnerId 获取:", receiverId);
            } else {
              const partnerInfo = utils_couple.getPartnerInfo();
              if (partnerInfo && partnerInfo.userId) {
                receiverId = partnerInfo.userId;
                common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:346", "✅ [获取对方ID] 从 partnerInfo.userId 获取:", receiverId);
              }
            }
          } catch (e) {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:350", "⚠️ 获取对方ID失败:", e);
          }
        } else {
          common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:353", "⚠️ 未绑定情侣关系，跳过 receiverId");
        }
        let backgroundImage = null;
        if (this.isCustomStyle && this.customImage) {
          backgroundImage = this.customImage;
        } else {
          backgroundImage = `../../static/xinxiang/xin${this.selectedStyle}.jpg`;
        }
        if (!this.form.deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(this.form.deliveryDate)) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "日期格式错误，请重新选择", icon: "none" });
          return;
        }
        const letterData = {
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          deliveryMethod: "PARTNER",
          // 目前只支持PARTNER
          scheduledDate: this.form.deliveryDate,
          // 格式：YYYY-MM-DD
          scheduledTime: "00:00:00",
          // 默认时间
          status: "DRAFT"
          // 草稿状态
        };
        if (receiverId) {
          letterData.receiverId = Number(receiverId);
          if (isNaN(letterData.receiverId)) {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:388", "receiverId 不是有效数字:", receiverId);
            delete letterData.receiverId;
          }
        }
        if (backgroundImage && backgroundImage.trim()) {
          letterData.backgroundImage = backgroundImage.trim();
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:398", "📤 [创建情书] 最终请求参数:", JSON.stringify(letterData, null, 2));
        const response = await api_futureLetter.createFutureLetter(letterData);
        if (response && response.success !== false && ((_a = response.data) == null ? void 0 : _a.id)) {
          const letterId = response.data.id;
          common_vendor.index.showLoading({ title: "正在发送..." });
          try {
            const sendResponse = await api_futureLetter.sendFutureLetter(letterId);
            common_vendor.index.hideLoading();
            if (sendResponse && sendResponse.success !== false) {
              const localData = {
                id: letterId,
                style: this.isCustomStyle ? "custom" : this.selectedStyle,
                customImage: this.customImage,
                title: this.form.title,
                deliveryDate: this.form.deliveryDate,
                content: this.form.content,
                createTime: (/* @__PURE__ */ new Date()).toLocaleString(),
                status: "SENT"
                // 标记为已发送
              };
              try {
                const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
                letters.unshift(localData);
                common_vendor.index.setStorageSync("xinxiang_letters", letters);
              } catch (e) {
                common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:434", "保存本地预览数据失败", e);
              }
              common_vendor.index.showToast({ title: "提交成功", icon: "success" });
              this.showPreviewModal = true;
            } else {
              common_vendor.index.showToast({
                title: sendResponse.message || "创建成功，但发送失败",
                icon: "none",
                duration: 2e3
              });
              this.showPreviewModal = true;
            }
          } catch (sendError) {
            common_vendor.index.hideLoading();
            common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:454", "发送未来情书失败:", sendError);
            const localData = {
              id: letterId,
              style: this.isCustomStyle ? "custom" : this.selectedStyle,
              customImage: this.customImage,
              title: this.form.title,
              deliveryDate: this.form.deliveryDate,
              content: this.form.content,
              createTime: (/* @__PURE__ */ new Date()).toLocaleString(),
              status: "DRAFT"
              // 标记为草稿（发送失败）
            };
            try {
              const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
              letters.unshift(localData);
              common_vendor.index.setStorageSync("xinxiang_letters", letters);
            } catch (e) {
              common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:474", "保存本地预览数据失败", e);
            }
            common_vendor.index.showToast({
              title: sendError.message || "创建成功，但发送失败，请稍后重试",
              icon: "none",
              duration: 2e3
            });
            this.showPreviewModal = true;
          }
        } else {
          common_vendor.index.showToast({
            title: response.message || "创建失败，请重试",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:494", "创建未来情书失败:", error);
        common_vendor.index.showToast({
          title: error.message || "创建失败，请重试",
          icon: "none",
          duration: 2e3
        });
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
    g: common_vendor.f([1, 2, 3], (i, k0, i0) => {
      return common_vendor.e({
        a: `../../static/xinxiang/xin${i}.jpg`,
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
    j: $data.customImage
  } : {}, {
    k: common_vendor.o((...args) => $options.nextStep && $options.nextStep(...args))
  }) : {}, {
    l: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    m: $data.form.title,
    n: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    o: common_vendor.t($data.form.deliveryDate || "请选择日期"),
    p: $data.form.deliveryDate,
    q: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    r: $options.minDate,
    s: $data.form.content,
    t: common_vendor.o(($event) => $data.form.content = $event.detail.value),
    v: common_vendor.t($data.form.content.length),
    w: common_vendor.o((...args) => $options.prevStep && $options.prevStep(...args)),
    x: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args)),
    y: common_vendor.o((...args) => $options.submitLetter && $options.submitLetter(...args))
  } : {}, {
    z: $data.showLivePreviewModal
  }, $data.showLivePreviewModal ? {
    A: $options.letterBackground,
    B: common_vendor.t($data.form.title || "信件主题"),
    C: common_vendor.t($data.form.deliveryDate || "未选择"),
    D: common_vendor.t($data.form.content || "信件内容..."),
    E: common_vendor.o(($event) => $data.showLivePreviewModal = false),
    F: common_vendor.o(() => {
    }),
    G: common_vendor.o(($event) => $data.showLivePreviewModal = false)
  } : {}, {
    H: $data.showPreviewModal
  }, $data.showPreviewModal ? {
    I: $options.letterBackground,
    J: common_vendor.t($data.form.title),
    K: common_vendor.t($data.form.deliveryDate),
    L: common_vendor.t($data.form.content),
    M: common_vendor.o((...args) => $options.closePreviewAndBack && $options.closePreviewAndBack(...args)),
    N: common_vendor.o(() => {
    })
  } : {}, {
    O: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/create.js.map
