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
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    const isGuest = !loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn;
    if (isGuest) {
      common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/history.vue:206", "👤 游客模式：显示示例信件");
      this.useGuestMode();
    } else {
      this.loadLetters();
    }
  },
  onShow() {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    const isGuest = !loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn;
    if (!isGuest) {
      this.loadLetters();
    }
  },
  methods: {
    // 游客模式：使用默认数据
    useGuestMode() {
      this.letters = [
        {
          id: "sample1",
          title: "示例情书1",
          deliveryDate: "2024-01-01",
          content: "这是一封示例情书的内容...",
          createTime: (/* @__PURE__ */ new Date()).toLocaleDateString(),
          status: "DRAFT"
        },
        {
          id: "sample2",
          title: "示例情书2",
          deliveryDate: "2024-02-14",
          content: "这是另一封示例情书的内容...",
          createTime: (/* @__PURE__ */ new Date()).toLocaleDateString(),
          status: "SENT"
        }
      ];
      common_vendor.index.__f__("log", "at subPackages/record/pages/xinxiang/history.vue:246", "✅ 游客模式初始化完成");
    },
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
        const backendLetters = this.extractLetterArray(response).filter(Boolean);
        this.letters = backendLetters.filter((letter) => letter.status !== "SENT").map((letter) => {
          const deliveryDateRaw = letter.scheduledTime || letter.scheduledDate || letter.deliveryDate;
          const createTimeRaw = letter.createdAt || letter.createTime;
          return {
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: this.formatToMinute(deliveryDateRaw),
            createTime: this.formatToMinute(createTimeRaw),
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: 100,
            // 默认透明度
            fontStyle: letter.fontStyle || letter.font_style || "default",
            // 保留后端原始数据
            _backendData: letter
          };
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:296", "加载信件失败", error);
        try {
          const localLetters = common_vendor.index.getStorageSync("xinxiang_letters") || [];
          this.letters = localLetters.filter((letter) => letter.status !== "SENT");
        } catch (e) {
          common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:302", "加载本地信件失败", e);
          this.letters = [];
        }
        if (error.statusCode !== 401) {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:309", "从后端加载信件失败，使用本地数据");
        }
      }
      try {
        const sentResponse = await api_futureLetter.getSentLetters();
        const backendSentLetters = this.extractLetterArray(sentResponse);
        this.sentLetters = backendSentLetters.map((letter) => {
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
            opacity: 100,
            fontStyle: letter.fontStyle || letter.font_style || "default",
            _backendData: letter
          };
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:338", "加载已发送信件失败", error);
        if (error.statusCode !== 401) {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:340", "从后端加载已发送信件失败");
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
      return `/subPackages/record/static/xinxiang/xin${letter.style}.jpg`;
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:479", "获取信件详情失败", error);
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
            common_vendor.index.__f__("warn", "at subPackages/record/pages/xinxiang/history.vue:549", "更新本地存储失败", e);
          }
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at subPackages/record/pages/xinxiang/history.vue:555", "删除信件失败:", error);
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
  }, $data.showDetailModal ? common_vendor.e({
    p: $options.getLetterBackground($data.currentLetter),
    q: 1 - $data.currentLetter.opacity / 100,
    r: common_vendor.t($data.currentLetter.title),
    s: common_vendor.n($options.getFontClass($data.currentLetter)),
    t: $data.currentLetter.sentAt && $data.currentLetter.sentAt !== "--"
  }, $data.currentLetter.sentAt && $data.currentLetter.sentAt !== "--" ? {
    v: common_vendor.t($data.currentLetter.sentAt),
    w: common_vendor.n($options.getFontClass($data.currentLetter))
  } : {}, {
    x: $data.currentLetter.deliveryDate && $data.currentLetter.deliveryDate !== "--"
  }, $data.currentLetter.deliveryDate && $data.currentLetter.deliveryDate !== "--" ? {
    y: common_vendor.t($data.currentLetter.deliveryDate),
    z: common_vendor.n($options.getFontClass($data.currentLetter))
  } : {}, {
    A: common_vendor.t($data.currentLetter.content),
    B: common_vendor.n($options.getFontClass($data.currentLetter)),
    C: common_vendor.n($options.getFontClass($data.currentLetter)),
    D: common_vendor.t($data.currentLetter.createTime),
    E: common_vendor.n($options.getFontClass($data.currentLetter)),
    F: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    G: common_vendor.o(() => {
    }),
    H: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {}, {
    I: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/xinxiang/history.js.map
