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
      sentLetters: [],
      activeTab: "all",
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
    },
    filteredLetters() {
      if (this.activeTab === "all") {
        return [...this.letters, ...this.sentLetters];
      } else if (this.activeTab === "unsent") {
        return this.letters;
      } else if (this.activeTab === "sent") {
        return this.sentLetters;
      }
      return [];
    },
    emptyText() {
      if (this.activeTab === "sent") {
        return "还没有已发送的信件";
      } else if (this.activeTab === "unsent") {
        return "还没有未发送的信件";
      }
      return "还没有写过信件";
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
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab;
    },
    // 加载信件列表
    async loadLetters() {
      try {
        const response = await api_futureLetter.getFutureLetterList();
        if (response && response.data) {
          const backendLetters = Array.isArray(response.data) ? response.data : [];
          this.letters = backendLetters.filter((letter) => letter.status !== "SENT").map((letter) => ({
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: letter.scheduledDate,
            // 后端字段名
            createTime: letter.createdAt || letter.createTime,
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: 100,
            // 默认透明度
            // 保留后端原始数据
            _backendData: letter
          }));
        } else {
          const localLetters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
          this.letters = localLetters.filter((letter) => letter.status !== "SENT");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:253", "加载信件失败", error);
        try {
          const localLetters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
          this.letters = localLetters.filter((letter) => letter.status !== "SENT");
        } catch (e) {
          common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:259", "加载本地信件失败", e);
          this.letters = [];
        }
        if (error.statusCode !== 401) {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:266", "从后端加载信件失败，使用本地数据");
        }
      }
      try {
        const sentResponse = await api_futureLetter.getSentLetters();
        if (sentResponse && sentResponse.data) {
          const backendSentLetters = Array.isArray(sentResponse.data) ? sentResponse.data : [];
          this.sentLetters = backendSentLetters.map((letter) => ({
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: letter.scheduledDate,
            createTime: letter.createdAt || letter.createTime,
            sentAt: letter.sentAt,
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: 100,
            _backendData: letter
          }));
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:290", "加载已发送信件失败", error);
        if (error.statusCode !== 401) {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:292", "从后端加载已发送信件失败");
        }
      }
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        "DRAFT": "草稿",
        "SCHEDULED": "已安排",
        "SENT": "已发送"
      };
      return statusMap[status] || status;
    },
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        "DRAFT": "status-draft",
        "SCHEDULED": "status-scheduled",
        "SENT": "status-sent"
      };
      return classMap[status] || "";
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:377", "获取信件详情失败", error);
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
    },
    // 确认删除
    confirmDelete(letter, index) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这封信件吗？",
        success: (res) => {
          if (res.confirm) {
            this.deleteLetter(letter, index);
          }
        }
      });
    },
    // 删除信件
    async deleteLetter(letter, index) {
      const isInSent = this.sentLetters.some((l) => l.id === letter.id);
      const sourceList = isInSent ? this.sentLetters : this.letters;
      const sourceIndex = sourceList.findIndex((l) => l.id === letter.id);
      if (letter && letter.id) {
        try {
          common_vendor.index.showLoading({ title: "正在删除..." });
          await api_futureLetter.deleteFutureLetter(letter.id);
          common_vendor.index.hideLoading();
          if (sourceIndex !== -1) {
            sourceList.splice(sourceIndex, 1);
          }
          try {
            const localLetters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
            const localIndex = localLetters.findIndex((l) => l.id === letter.id);
            if (localIndex !== -1) {
              localLetters.splice(localIndex, 1);
              common_vendor.index.setStorageSync("xinxiang_letters", localLetters);
            }
          } catch (e) {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:440", "更新本地存储失败", e);
          }
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:446", "删除信件失败:", error);
          common_vendor.index.showToast({
            title: error.message || "删除失败，请重试",
            icon: "none"
          });
        }
      } else {
        try {
          if (sourceIndex !== -1) {
            sourceList.splice(sourceIndex, 1);
          }
          common_vendor.index.setStorageSync("xinxiang_letters", [...this.letters, ...this.sentLetters]);
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        } catch (e) {
          common_vendor.index.showToast({ title: "删除失败", icon: "none" });
        }
      }
    },
    // 去写信
    goWrite() {
      common_vendor.index.navigateTo({ url: "/subPackages/record/pages/xinxiang/create" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.activeTab === "all" ? 1 : "",
    e: common_vendor.o(($event) => $options.switchTab("all")),
    f: $data.activeTab === "unsent" ? 1 : "",
    g: common_vendor.o(($event) => $options.switchTab("unsent")),
    h: $data.activeTab === "sent" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchTab("sent")),
    j: $options.filteredLetters.length > 0
  }, $options.filteredLetters.length > 0 ? {
    k: common_vendor.f($options.filteredLetters, (letter, index, i0) => {
      return {
        a: $options.getLetterBackground(letter),
        b: 1 - letter.opacity / 100,
        c: common_vendor.t(letter.style === "custom" ? "自定义" : "样式" + letter.style),
        d: common_vendor.t(letter.title),
        e: common_vendor.t(letter.deliveryDate),
        f: common_vendor.t(letter.createTime),
        g: common_vendor.t($options.getStatusText(letter.status)),
        h: common_vendor.n($options.getStatusClass(letter.status)),
        i: common_vendor.t(letter.content.slice(0, 50)),
        j: common_vendor.t(letter.content.length > 50 ? "..." : ""),
        k: common_vendor.o(($event) => $options.viewLetter(letter, index), letter.id || index),
        l: common_vendor.o(($event) => $options.confirmDelete(letter, index), letter.id || index),
        m: letter.id || index,
        n: common_vendor.o(($event) => $options.viewLetter(letter, index), letter.id || index)
      };
    })
  } : common_vendor.e({
    l: common_vendor.t($options.emptyText),
    m: $data.activeTab !== "sent"
  }, $data.activeTab !== "sent" ? {
    n: common_vendor.o((...args) => $options.goWrite && $options.goWrite(...args))
  } : {}), {
    o: $data.showDetailModal
  }, $data.showDetailModal ? {
    p: $options.getLetterBackground($data.currentLetter),
    q: 1 - $data.currentLetter.opacity / 100,
    r: common_vendor.t($data.currentLetter.title),
    s: common_vendor.t($data.currentLetter.deliveryDate),
    t: common_vendor.t($data.currentLetter.content),
    v: common_vendor.t($data.currentLetter.createTime),
    w: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    x: common_vendor.o(() => {
    }),
    y: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  } : {}, {
    z: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/history.js.map
