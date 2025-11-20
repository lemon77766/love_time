"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_futureLetter = require("../../../../api/futureLetter.js");
const utils_couple = require("../../../../utils/couple.js");
const utils_config = require("../../../../utils/config.js");
const FALLBACK_FONT_OPTIONS = [
  { label: "默认字体", value: "default", description: "清晰易读", sample: "未来与你" },
  { label: "马善政手写", value: "mashanzheng", description: "温柔手写感", sample: "未来与你" },
  { label: "站酷快乐体", value: "zcoolkuaile", description: "活泼可爱", sample: "未来与你" },
  { label: "清松手写体", value: "qingsong", description: "自然流畅", sample: "未来与你" },
  { label: "站酷小薇体", value: "zcoolxiaowei", description: "清新文艺", sample: "未来与你" },
  { label: "站酷文艺体", value: "zcoolwenyi", description: "优雅文艺", sample: "未来与你" }
];
const FALLBACK_FONT_MAP = FALLBACK_FONT_OPTIONS.reduce((map, option) => {
  map[option.value] = option;
  return map;
}, {});
let maShanZhengFontPromise = null;
let zcoolKuaiLeFontPromise = null;
let qingSongFontPromise = null;
let zcoolXiaoWeiFontPromise = null;
let zcoolWenYiFontPromise = null;
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
        content: "",
        fontStyle: "default"
      },
      fontOptions: [...FALLBACK_FONT_OPTIONS],
      fontLoading: false,
      fontRequestError: "",
      customFontLoaded: false
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
    },
    selectedFontStyle() {
      return this.form.fontStyle || "default";
    },
    selectedFontClass() {
      return `font-style-${this.selectedFontStyle}`;
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.preloadCustomFont();
    this.fetchFontOptions();
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
    async fetchFontOptions() {
      this.fontLoading = true;
      this.fontRequestError = "";
      try {
        const response = await api_futureLetter.getFutureLetterFonts();
        const fontList = this.extractFontList(response);
        const normalized = this.normalizeFontOptions(fontList);
        if (normalized.length > 0) {
          this.fontOptions = normalized;
        } else {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:333", "字体列表为空，使用默认字体配置");
          this.fontOptions = [...FALLBACK_FONT_OPTIONS];
        }
        if (!this.fontOptions.some((font) => font.value === this.selectedFontStyle) && this.fontOptions.length > 0) {
          this.form.fontStyle = this.fontOptions[0].value;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:340", "获取字体列表失败:", error);
        this.fontRequestError = "字体加载失败，已使用默认字体";
        this.fontOptions = [...FALLBACK_FONT_OPTIONS];
        common_vendor.index.showToast({ title: "字体加载失败，使用默认字体", icon: "none" });
      } finally {
        this.fontLoading = false;
      }
    },
    async preloadCustomFont() {
      if (this.customFontLoaded) {
        return;
      }
      if (typeof common_vendor.index === "undefined" || typeof common_vendor.index.loadFontFace !== "function") {
        common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:353", "当前平台不支持自定义字体加载");
        return;
      }
      try {
        await Promise.allSettled([
          this.ensureMaShanZhengFont(),
          this.ensureZcoolKuaiLeFont(),
          this.ensureQingSongFont(),
          this.ensureZcoolXiaoWeiFont(),
          this.ensureZcoolWenYiFont()
        ]);
        this.customFontLoaded = true;
        common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:366", "所有手写字体加载完成");
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:368", "加载字体失败:", error);
      }
    },
    ensureMaShanZhengFont() {
      if (maShanZhengFontPromise) {
        return maShanZhengFontPromise;
      }
      let fontSource;
      fontSource = `url("${utils_config.config.baseURL}/fonts/MaShanZheng-Regular.ttf")`;
      maShanZhengFontPromise = new Promise((resolve, reject) => {
        common_vendor.index.loadFontFace({
          global: true,
          family: "MaShanZheng",
          source: fontSource,
          desc: {
            style: "normal",
            weight: "400"
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:396", "MaShanZheng 字体加载成功", res);
            resolve(res);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:400", "MaShanZheng 字体加载失败:", error);
            maShanZhengFontPromise = null;
            resolve(null);
            maShanZhengFontPromise = null;
            resolve(null);
          }
        });
      });
      return maShanZhengFontPromise;
    },
    ensureZcoolKuaiLeFont() {
      if (zcoolKuaiLeFontPromise) {
        return zcoolKuaiLeFontPromise;
      }
      let fontSource;
      fontSource = `url("${utils_config.config.baseURL}/fonts/ZCOOLKuaiLe-Regular.ttf")`;
      zcoolKuaiLeFontPromise = new Promise((resolve, reject) => {
        common_vendor.index.loadFontFace({
          global: true,
          family: "ZCOOLKuaiLe",
          source: fontSource,
          desc: {
            style: "normal",
            weight: "400"
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:463", "ZCOOLKuaiLe 字体加载成功", res);
            resolve(res);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:467", "ZCOOLKuaiLe 字体加载失败:", error);
            zcoolKuaiLeFontPromise = null;
            resolve(null);
            zcoolKuaiLeFontPromise = null;
            resolve(null);
          }
        });
      });
      return zcoolKuaiLeFontPromise;
    },
    ensureQingSongFont() {
      if (qingSongFontPromise) {
        return qingSongFontPromise;
      }
      let fontSource;
      fontSource = `url("${utils_config.config.baseURL}/fonts/QingSong-Regular.ttf")`;
      qingSongFontPromise = new Promise((resolve, reject) => {
        common_vendor.index.loadFontFace({
          global: true,
          family: "QingSong",
          source: fontSource,
          desc: {
            style: "normal",
            weight: "400"
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:530", "QingSong 字体加载成功", res);
            resolve(res);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:534", "QingSong 字体加载失败:", error);
            qingSongFontPromise = null;
            resolve(null);
            qingSongFontPromise = null;
            resolve(null);
          }
        });
      });
      return qingSongFontPromise;
    },
    ensureZcoolXiaoWeiFont() {
      if (zcoolXiaoWeiFontPromise) {
        return zcoolXiaoWeiFontPromise;
      }
      let fontSource;
      fontSource = `url("${utils_config.config.baseURL}/fonts/ZCOOLXiaoWei-Regular.ttf")`;
      zcoolXiaoWeiFontPromise = new Promise((resolve, reject) => {
        common_vendor.index.loadFontFace({
          global: true,
          family: "ZCOOLXiaoWei",
          source: fontSource,
          desc: {
            style: "normal",
            weight: "400"
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:597", "ZCOOLXiaoWei 字体加载成功", res);
            resolve(res);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:601", "ZCOOLXiaoWei 字体加载失败:", error);
            zcoolXiaoWeiFontPromise = null;
            resolve(null);
            zcoolXiaoWeiFontPromise = null;
            resolve(null);
          }
        });
      });
      return zcoolXiaoWeiFontPromise;
    },
    ensureZcoolWenYiFont() {
      if (zcoolWenYiFontPromise) {
        return zcoolWenYiFontPromise;
      }
      let fontSource;
      fontSource = `url("${utils_config.config.baseURL}/fonts/ZCOOLWenYi-Regular.ttf")`;
      zcoolWenYiFontPromise = new Promise((resolve, reject) => {
        common_vendor.index.loadFontFace({
          global: true,
          family: "ZCOOLWenYi",
          source: fontSource,
          desc: {
            style: "normal",
            weight: "400"
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:664", "ZCOOLWenYi 字体加载成功", res);
            resolve(res);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:668", "ZCOOLWenYi 字体加载失败:", error);
            zcoolWenYiFontPromise = null;
            resolve(null);
            zcoolWenYiFontPromise = null;
            resolve(null);
          }
        });
      });
      return zcoolWenYiFontPromise;
    },
    extractFontList(response) {
      var _a, _b;
      if (!response)
        return [];
      const candidates = [
        (_a = response.data) == null ? void 0 : _a.fonts,
        (_b = response.data) == null ? void 0 : _b.items,
        response.data,
        response.fonts,
        response.items,
        response.list,
        response
      ];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
      return [];
    },
    normalizeFontOptions(fonts = []) {
      if (!Array.isArray(fonts))
        return [];
      return fonts.map((item) => {
        if (typeof item === "string") {
          return this.createFontOption(item);
        }
        const value = item.value || item.fontStyle || item.font_style || item.code || item.key;
        if (!value)
          return null;
        const base = this.createFontOption(value);
        return {
          ...base,
          ...item,
          value: base.value,
          label: item.label || item.name || base.label,
          description: item.description || base.description,
          sample: item.sample || base.sample
        };
      }).filter(Boolean);
    },
    createFontOption(value) {
      if (!value && value !== 0) {
        return FALLBACK_FONT_OPTIONS[0];
      }
      const normalizedValue = String(value).trim().toLowerCase();
      const base = FALLBACK_FONT_MAP[normalizedValue] || {
        label: value,
        description: "自定义字体",
        sample: "未来与你"
      };
      return {
        value: normalizedValue,
        label: base.label,
        description: base.description,
        sample: base.sample
      };
    },
    selectFont(value) {
      if (!value)
        return;
      this.form.fontStyle = String(value).trim().toLowerCase();
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
            common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:837", "👫 [情侣信息]", coupleInfo);
            if (coupleInfo && coupleInfo.partnerId) {
              receiverId = coupleInfo.partnerId;
              common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:842", "✅ [获取对方ID] 从 partnerId 获取:", receiverId);
            } else {
              const partnerInfo = utils_couple.getPartnerInfo();
              if (partnerInfo && partnerInfo.userId) {
                receiverId = partnerInfo.userId;
                common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:848", "✅ [获取对方ID] 从 partnerInfo.userId 获取:", receiverId);
              }
            }
          } catch (e) {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:852", "⚠️ 获取对方ID失败:", e);
          }
        } else {
          common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:855", "⚠️ 未绑定情侣关系，跳过 receiverId");
        }
        let backgroundImage = null;
        if (this.isCustomStyle && this.customImage) {
          backgroundImage = this.customImage;
        } else {
          backgroundImage = `/static/xinxiang/xin${this.selectedStyle}.jpg`;
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
          scheduledTime: `${this.form.deliveryDate}T00:00:00.000`,
          // 默认时间，确保后端可解析
          status: "DRAFT",
          // 草稿状态
          fontStyle: this.selectedFontStyle
        };
        letterData.font_style = this.selectedFontStyle;
        if (receiverId) {
          letterData.receiverId = Number(receiverId);
          if (isNaN(letterData.receiverId)) {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:892", "receiverId 不是有效数字:", receiverId);
            delete letterData.receiverId;
          }
        }
        if (backgroundImage && backgroundImage.trim()) {
          letterData.backgroundImage = backgroundImage.trim();
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/create.vue:902", "📤 [创建情书] 最终请求参数:", JSON.stringify(letterData, null, 2));
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
                fontStyle: this.selectedFontStyle,
                createTime: (/* @__PURE__ */ new Date()).toLocaleString(),
                status: "SENT"
                // 标记为已发送
              };
              try {
                const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
                letters.unshift(localData);
                common_vendor.index.setStorageSync("xinxiang_letters", letters);
              } catch (e) {
                common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:939", "保存本地预览数据失败", e);
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
            common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:959", "发送未来情书失败:", sendError);
            const localData = {
              id: letterId,
              style: this.isCustomStyle ? "custom" : this.selectedStyle,
              customImage: this.customImage,
              title: this.form.title,
              deliveryDate: this.form.deliveryDate,
              content: this.form.content,
              fontStyle: this.selectedFontStyle,
              createTime: (/* @__PURE__ */ new Date()).toLocaleString(),
              status: "DRAFT"
              // 标记为草稿（发送失败）
            };
            try {
              const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
              letters.unshift(localData);
              common_vendor.index.setStorageSync("xinxiang_letters", letters);
            } catch (e) {
              common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/create.vue:980", "保存本地预览数据失败", e);
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/create.vue:1000", "创建未来情书失败:", error);
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
    j: $data.customImage
  } : {}, {
    k: common_vendor.o((...args) => $options.nextStep && $options.nextStep(...args))
  }) : {}, {
    l: $data.currentStep === 2
  }, $data.currentStep === 2 ? common_vendor.e({
    m: $data.form.title,
    n: common_vendor.o(($event) => $data.form.title = $event.detail.value),
    o: common_vendor.t($data.form.deliveryDate || "请选择日期"),
    p: $data.form.deliveryDate,
    q: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    r: $options.minDate,
    s: $data.fontLoading
  }, $data.fontLoading ? {} : {
    t: common_vendor.f($data.fontOptions, (font, k0, i0) => {
      return {
        a: common_vendor.t(font.label),
        b: common_vendor.t(font.description || "点击选择"),
        c: common_vendor.t(font.sample || "未来与你"),
        d: common_vendor.n(`font-style-${font.value}`),
        e: font.value,
        f: $options.selectedFontStyle === font.value ? 1 : "",
        g: common_vendor.o(($event) => $options.selectFont(font.value), font.value)
      };
    })
  }, {
    v: $data.fontRequestError
  }, $data.fontRequestError ? {
    w: common_vendor.t($data.fontRequestError)
  } : {}, {
    x: $data.form.content,
    y: common_vendor.o(($event) => $data.form.content = $event.detail.value),
    z: common_vendor.t($data.form.content.length),
    A: common_vendor.o((...args) => $options.prevStep && $options.prevStep(...args)),
    B: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args)),
    C: common_vendor.o((...args) => $options.submitLetter && $options.submitLetter(...args))
  }) : {}, {
    D: $data.showLivePreviewModal
  }, $data.showLivePreviewModal ? {
    E: $options.letterBackground,
    F: common_vendor.t($data.form.title || "信件主题"),
    G: common_vendor.n($options.selectedFontClass),
    H: common_vendor.t($data.form.deliveryDate || "未选择"),
    I: common_vendor.n($options.selectedFontClass),
    J: common_vendor.t($data.form.content || "信件内容..."),
    K: common_vendor.n($options.selectedFontClass),
    L: common_vendor.n($options.selectedFontClass),
    M: common_vendor.o(($event) => $data.showLivePreviewModal = false),
    N: common_vendor.o(() => {
    }),
    O: common_vendor.o(($event) => $data.showLivePreviewModal = false)
  } : {}, {
    P: $data.showPreviewModal
  }, $data.showPreviewModal ? {
    Q: $options.letterBackground,
    R: common_vendor.t($data.form.title),
    S: common_vendor.n($options.selectedFontClass),
    T: common_vendor.t($data.form.deliveryDate),
    U: common_vendor.n($options.selectedFontClass),
    V: common_vendor.t($data.form.content),
    W: common_vendor.n($options.selectedFontClass),
    X: common_vendor.n($options.selectedFontClass),
    Y: common_vendor.o((...args) => $options.closePreviewAndBack && $options.closePreviewAndBack(...args)),
    Z: common_vendor.o(() => {
    })
  } : {}, {
    aa: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/create.js.map
