"use strict";
const common_vendor = require("../../common/vendor.js");
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
    // 加载信件列表
    loadLetters() {
      try {
        const letters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
        this.letters = letters;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/xinxiang/history.vue:168", "加载信件失败", e);
        this.letters = [];
      }
    },
    // 获取信件背景图
    getLetterBackground(letter) {
      if (letter.style === "custom") {
        return letter.customImage;
      }
      return `/static/xinxiang/xin${letter.style}.jpg`;
    },
    // 查看信件详情
    viewLetter(letter, index) {
      this.currentLetter = letter;
      this.currentIndex = index;
      this.showDetailModal = true;
    },
    // 关闭详情弹窗
    closeDetail() {
      this.showDetailModal = false;
      this.currentLetter = null;
      this.currentIndex = -1;
    },
    // 确认删除
    confirmDelete(index) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这封信件吗？",
        success: (res) => {
          if (res.confirm) {
            this.deleteLetter(index);
          }
        }
      });
    },
    // 删除信件
    deleteLetter(index) {
      try {
        this.letters.splice(index, 1);
        common_vendor.index.setStorageSync("xinxiang_letters", this.letters);
        common_vendor.index.showToast({ title: "已删除", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: "删除失败", icon: "none" });
      }
    },
    // 去写信
    goWrite() {
      common_vendor.index.navigateTo({ url: "/pages/xinxiang/create" });
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
        f: common_vendor.t(letter.createTime),
        g: common_vendor.t(letter.content.slice(0, 50)),
        h: common_vendor.t(letter.content.length > 50 ? "..." : ""),
        i: common_vendor.o(($event) => $options.viewLetter(letter, index), index),
        j: common_vendor.o(($event) => $options.confirmDelete(index), index),
        k: index,
        l: common_vendor.o(($event) => $options.viewLetter(letter, index), index)
      };
    })
  } : {
    f: common_vendor.o((...args) => $options.goWrite && $options.goWrite(...args))
  }, {
    g: $data.showDetailModal
  }, $data.showDetailModal ? common_vendor.e({
    h: $options.getLetterBackground($data.currentLetter),
    i: 1 - $data.currentLetter.opacity / 100,
    j: common_vendor.t($data.currentLetter.title),
    k: common_vendor.t($data.currentLetter.deliveryDate),
    l: common_vendor.t($data.currentLetter.content),
    m: common_vendor.t($data.currentLetter.phone.slice(0, 3)),
    n: common_vendor.t($data.currentLetter.phone.slice(-4)),
    o: $data.currentLetter.wechat
  }, $data.currentLetter.wechat ? {
    p: common_vendor.t($data.currentLetter.wechat)
  } : {}, {
    q: common_vendor.t($data.currentLetter.createTime),
    r: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    s: common_vendor.o(() => {
    }),
    t: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {}, {
    v: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/xinxiang/history.js.map
