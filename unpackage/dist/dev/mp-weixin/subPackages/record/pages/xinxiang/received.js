"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_futureLetter = require("../../../../api/futureLetter.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      letters: [],
      showDetailModal: false,
      currentLetter: null,
      currentIndex: -1
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadLetters();
  },
  onShow() {
    this.loadLetters();
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
    // 加载收到的信件列表
    async loadLetters() {
      try {
        const response = await api_futureLetter.getReceivedLetters();
        const backendLetters = this.extractLetterArray(response);
        this.letters = backendLetters.map((letter) => {
          const opacityValue = Number(letter.backgroundOpacity);
          const normalizedOpacity = isNaN(opacityValue) ? 100 : opacityValue <= 1 ? opacityValue * 100 : opacityValue;
          const deliveryDateRaw = letter.scheduledTime || letter.scheduledDate || letter.deliveryDate;
          const createTimeRaw = letter.createdAt || letter.createTime;
          const sentAtRaw = letter.sentAt;
          return {
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: this.formatToMinute(deliveryDateRaw),
            createTime: this.formatToMinute(createTimeRaw),
            sentAt: this.formatToMinute(sentAtRaw),
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: Math.min(100, Math.max(0, normalizedOpacity)),
            fontStyle: letter.fontStyle || letter.font_style || "default",
            _backendData: letter
          };
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/received.vue:198", "加载收到的信件失败", error);
        this.letters = [];
        if (error.statusCode !== 401) {
          common_vendor.index.showToast({
            title: "加载失败，请重试",
            icon: "none"
          });
        }
      }
    },
    // 兼容多种响应结构
    extractLetterArray(response) {
      var _a, _b, _c, _d, _e, _f, _g;
      if (!response)
        return [];
      const candidates = [
        response,
        response == null ? void 0 : response.data,
        response == null ? void 0 : response.letters,
        response == null ? void 0 : response.records,
        response == null ? void 0 : response.items,
        response == null ? void 0 : response.list,
        response == null ? void 0 : response.result,
        response == null ? void 0 : response.body,
        (_a = response == null ? void 0 : response.data) == null ? void 0 : _a.letters,
        (_b = response == null ? void 0 : response.data) == null ? void 0 : _b.records,
        (_c = response == null ? void 0 : response.data) == null ? void 0 : _c.items,
        (_d = response == null ? void 0 : response.data) == null ? void 0 : _d.list,
        (_e = response == null ? void 0 : response.data) == null ? void 0 : _e.result,
        (_f = response == null ? void 0 : response.data) == null ? void 0 : _f.content,
        (_g = response == null ? void 0 : response.data) == null ? void 0 : _g.rows
      ];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
      return [];
    },
    // 将时间统一格式化到分钟
    formatToMinute(dateInput) {
      if (!dateInput)
        return "--";
      const dateValue = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (Number.isNaN(dateValue.getTime())) {
        return typeof dateInput === "string" ? dateInput : "--";
      }
      const pad = (num) => num < 10 ? `0${num}` : `${num}`;
      const year = dateValue.getFullYear();
      const month = pad(dateValue.getMonth() + 1);
      const day = pad(dateValue.getDate());
      const hours = pad(dateValue.getHours());
      const minutes = pad(dateValue.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 从背景图片URL提取样式ID
    getStyleFromBackground(backgroundImage) {
      if (!backgroundImage)
        return 1;
      if (backgroundImage.includes("custom") || backgroundImage.startsWith("http")) {
        return "custom";
      }
      const match = backgroundImage.match(/xin(\d+)\.jpg/);
      return match ? parseInt(match[1]) : 1;
    },
    // 获取信件背景图
    getLetterBackground(letter) {
      if (letter.style === "custom") {
        return letter.customImage;
      }
      return `/subPackages/record/static/xinxiang/xin${letter.style}.jpg`;
    },
    // 查看信件详情
    async viewLetter(letter, index) {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const response = await api_futureLetter.getFutureLetterDetail(letter.id);
        common_vendor.index.hideLoading();
        if (response && response.data) {
          const detailData = response.data;
          const detailDeliveryDate = detailData.scheduledTime || detailData.scheduledDate || detailData.deliveryDate || letter.deliveryDate;
          const detailCreateTime = detailData.createdAt || detailData.createTime || letter.createTime;
          const detailSentAt = detailData.sentAt || letter.sentAt;
          this.currentLetter = {
            ...letter,
            ...detailData,
            // 确保字段映射正确
            id: detailData.id || letter.id,
            title: detailData.title || letter.title,
            content: detailData.content || letter.content,
            deliveryDate: this.formatToMinute(detailDeliveryDate),
            createTime: this.formatToMinute(detailCreateTime),
            sentAt: this.formatToMinute(detailSentAt),
            status: detailData.status || letter.status,
            style: this.getStyleFromBackground(detailData.backgroundImage || letter.backgroundImage),
            customImage: detailData.backgroundImage || letter.customImage,
            opacity: detailData.opacity !== void 0 ? detailData.opacity : letter.opacity || 100,
            fontStyle: detailData.fontStyle || detailData.font_style || letter.fontStyle || "default",
            _backendData: detailData
          };
        } else {
          this.currentLetter = letter;
        }
        this.currentIndex = index;
        this.showDetailModal = true;
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/received.vue:326", "获取信件详情失败", error);
        this.currentLetter = letter;
        this.currentIndex = index;
        this.showDetailModal = true;
        common_vendor.index.showToast({
          title: "加载详情失败，显示基本信息",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 获取字体样式类
    getFontClass(letter) {
      if (!letter)
        return "font-style-default";
      const fontStyle = letter.fontStyle || letter.font_style || "default";
      return `font-style-${fontStyle}`;
    },
    // 关闭详情弹窗
    closeDetail() {
      this.showDetailModal = false;
      this.currentLetter = null;
      this.currentIndex = -1;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.letters.length > 0
  }, $data.letters.length > 0 ? {
    e: common_vendor.f($data.letters, (letter, index, i0) => {
      return {
        a: $options.getLetterBackground(letter),
        b: 1 - letter.opacity / 100,
        c: common_vendor.t(letter.style === "custom" ? "自定义" : "样式" + letter.style),
        d: common_vendor.t(letter.title),
        e: common_vendor.t(letter.deliveryDate),
        f: common_vendor.t(letter.sentAt || letter.createTime),
        g: common_vendor.t(letter.content.slice(0, 50)),
        h: common_vendor.t(letter.content.length > 50 ? "..." : ""),
        i: common_vendor.o(($event) => $options.viewLetter(letter, index), letter.id || index),
        j: letter.id || index,
        k: common_vendor.o(($event) => $options.viewLetter(letter, index), letter.id || index)
      };
    })
  } : {}, {
    f: $data.showDetailModal
  }, $data.showDetailModal ? common_vendor.e({
    g: $options.getLetterBackground($data.currentLetter),
    h: 1 - $data.currentLetter.opacity / 100,
    i: common_vendor.t($data.currentLetter.title),
    j: common_vendor.n($options.getFontClass($data.currentLetter)),
    k: $data.currentLetter.deliveryDate && $data.currentLetter.deliveryDate !== "--"
  }, $data.currentLetter.deliveryDate && $data.currentLetter.deliveryDate !== "--" ? {
    l: common_vendor.t($data.currentLetter.deliveryDate),
    m: common_vendor.n($options.getFontClass($data.currentLetter))
  } : {}, {
    n: common_vendor.t($data.currentLetter.content),
    o: common_vendor.n($options.getFontClass($data.currentLetter)),
    p: common_vendor.n($options.getFontClass($data.currentLetter)),
    q: common_vendor.t($data.currentLetter.createTime),
    r: common_vendor.n($options.getFontClass($data.currentLetter)),
    s: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    t: common_vendor.o(() => {
    }),
    v: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {}, {
    w: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/received.js.map
