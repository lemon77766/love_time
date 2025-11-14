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
        if (response && response.data) {
          const backendLetters = Array.isArray(response.data) ? response.data : [];
          this.letters = backendLetters.map((letter) => ({
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: letter.scheduledDate,
            // 后端字段名
            createTime: letter.createdAt || letter.createTime,
            sentAt: letter.sentAt,
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: 100,
            // 默认透明度
            // 保留后端原始数据
            _backendData: letter
          }));
        } else {
          this.letters = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/received.vue:192", "加载收到的信件失败", error);
        this.letters = [];
        if (error.statusCode !== 401) {
          common_vendor.index.showToast({
            title: "加载失败，请重试",
            icon: "none"
          });
        }
      }
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
      return `../../static/xinxiang/xin${letter.style}.jpg`;
    },
    // 查看信件详情
    async viewLetter(letter, index) {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const response = await api_futureLetter.getFutureLetterDetail(letter.id);
        common_vendor.index.hideLoading();
        if (response && response.data) {
          const detailData = response.data;
          this.currentLetter = {
            ...letter,
            ...detailData,
            // 确保字段映射正确
            id: detailData.id || letter.id,
            title: detailData.title || letter.title,
            content: detailData.content || letter.content,
            deliveryDate: detailData.scheduledDate || detailData.deliveryDate || letter.deliveryDate,
            createTime: detailData.createdAt || detailData.createTime || letter.createTime,
            sentAt: detailData.sentAt || letter.sentAt,
            status: detailData.status || letter.status,
            style: this.getStyleFromBackground(detailData.backgroundImage || letter.backgroundImage),
            customImage: detailData.backgroundImage || letter.customImage,
            opacity: detailData.opacity !== void 0 ? detailData.opacity : letter.opacity || 100,
            _backendData: detailData
          };
        } else {
          this.currentLetter = letter;
        }
        this.currentIndex = index;
        this.showDetailModal = true;
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/received.vue:266", "获取信件详情失败", error);
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
    j: common_vendor.t($data.currentLetter.deliveryDate),
    k: $data.currentLetter.sentAt
  }, $data.currentLetter.sentAt ? {
    l: common_vendor.t($data.currentLetter.sentAt)
  } : {}, {
    m: common_vendor.t($data.currentLetter.content),
    n: common_vendor.t($data.currentLetter.createTime),
    o: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    p: common_vendor.o(() => {
    }),
    q: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {}, {
    r: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/received.js.map
