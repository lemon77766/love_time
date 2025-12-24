"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_anniversary = require("../../../../api/anniversary.js");
const common_assets = require("../../../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      showAddModal: false,
      showEditModal: false,
      isDeleting: -1,
      // 用于删除动画
      anniversaryList: [],
      newAnniversary: {
        title: "",
        date: "",
        icon: "mdi:calendar-heart",
        color: "#FF91A4",
        remind: false
      },
      editingAnniversary: {
        id: null,
        title: "",
        date: "",
        icon: "mdi:calendar-heart",
        color: "#FF91A4",
        remind: false
      },
      iconOptions: [
        { name: "mdi:calendar-heart", color: "#FF91A4" },
        { name: "mdi:cake", color: "#FFD93D" },
        { name: "mdi:airplane", color: "#4A90E2" },
        { name: "mdi:ring", color: "#D9ACFF" },
        { name: "mdi:heart-outline", color: "#FF91A4" },
        { name: "mdi:human-handsup", color: "#FF91A4" },
        { name: "mdi:heart-multiple-outline", color: "#FF91A4" },
        { name: "mdi:gift", color: "#FF6B6B" }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + "rpx";
    },
    // 计算有多少个提醒
    reminderCount() {
      return this.anniversaryList.filter((item) => item.remind).length;
    },
    // 是否有设置提醒
    hasReminders() {
      return this.reminderCount > 0;
    }
  },
  mounted() {
    this.getSystemInfo();
    const today = /* @__PURE__ */ new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    this.newAnniversary.date = `${year}-${month}-${day}`;
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    const isGuest = !loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn;
    if (isGuest) {
      common_vendor.index.__f__("log", "at subPackages/record/pages/anniversary/index.vue:248", "👤 游客模式：显示示例纪念日");
      this.useGuestMode();
    } else {
      try {
        this.loadAnniversaryData();
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:255", "加载服务器数据失败:", error);
        this.useGuestMode();
      }
    }
  },
  methods: {
    // 游客模式：使用默认数据
    useGuestMode() {
      this.anniversaryList = [
        {
          id: "sample1",
          title: "第一次见面",
          date: "2023-01-01",
          icon: "mdi:calendar-heart",
          color: "#FF91A4",
          remind: false
        },
        {
          id: "sample2",
          title: "第一次约会",
          date: "2023-02-14",
          icon: "mdi:heart",
          color: "#FF6B6B",
          remind: true
        },
        {
          id: "sample3",
          title: "确定关系",
          date: "2023-03-15",
          icon: "mdi:star",
          color: "#FFD93D",
          remind: true
        }
      ];
      common_vendor.index.__f__("log", "at subPackages/record/pages/anniversary/index.vue:292", "✅ 游客模式初始化完成");
    },
    // 检查是否需要登录
    checkLoginRequired() {
      const loginInfo = common_vendor.index.getStorageSync("login_info");
      if (!loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "该功能需要登录后才能使用，是否前往登录？\\n\\n您仍然可以继续浏览纪念日。",
          confirmText: "去登录",
          cancelText: "继续浏览",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateTo({
                url: "/pages/login/index"
              });
            }
          }
        });
        return false;
      }
      return true;
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    getSystemInfo() {
      try {
        const windowInfo = common_vendor.wx$1.getWindowInfo && common_vendor.wx$1.getWindowInfo();
        const deviceInfo = common_vendor.wx$1.getDeviceInfo && common_vendor.wx$1.getDeviceInfo();
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = common_vendor.index.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
    },
    // 加载纪念日数据（从后端获取）
    async loadAnniversaryData() {
      try {
        const response = await api_anniversary.getAnniversaryList();
        common_vendor.index.__f__("log", "at subPackages/record/pages/anniversary/index.vue:359", "[纪念日页面] 接收到的原始响应数据:", response);
        let dataList = [];
        if (response && response.anniversaryList) {
          dataList = response.anniversaryList;
        } else if (response && response.data && response.data.anniversaryList) {
          dataList = response.data.anniversaryList;
        } else if (response && response.data && Array.isArray(response.data)) {
          dataList = response.data;
        } else if (response && Array.isArray(response)) {
          dataList = response;
        } else {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/anniversary/index.vue:376", "[纪念日页面] 获取纪念日列表数据格式异常:", response);
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/anniversary/index.vue:379", "[纪念日页面] 处理后的纪念日列表:", dataList);
        this.anniversaryList = dataList;
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:382", "[纪念日页面] 加载纪念日数据失败:", error);
        common_vendor.index.showToast({
          title: "加载数据失败",
          icon: "none"
        });
        this.anniversaryList = [];
      }
    },
    // 格式化日期显示
    formatDate(dateStr) {
      if (!dateStr)
        return "";
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    },
    // 计算距离指定日期的天数
    calculateDays(dateStr) {
      if (!dateStr)
        return 0;
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      date.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    },
    // 切换提醒状态
    async toggleRemind(index) {
      if (!this.checkLoginRequired()) {
        return;
      }
      try {
        const item = this.anniversaryList[index];
        const newRemindState = !item.remind;
        await api_anniversary.toggleAnniversaryRemind(item.id, newRemindState);
        this.anniversaryList[index].remind = newRemindState;
        const message = newRemindState ? "已设置提醒" : "已取消提醒";
        common_vendor.index.showToast({
          title: message,
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:435", "切换提醒状态失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    },
    // 选择日期
    onDateChange(e) {
      this.newAnniversary.date = e.detail.value;
    },
    // 编辑时选择日期
    onEditDateChange(e) {
      this.editingAnniversary.date = e.detail.value;
    },
    // 选择图标
    selectIcon(icon) {
      this.newAnniversary.icon = icon.name;
      this.newAnniversary.color = icon.color;
    },
    // 编辑时选择图标
    selectEditIcon(icon) {
      this.editingAnniversary.icon = icon.name;
      this.editingAnniversary.color = icon.color;
    },
    // 设置提醒变化
    onRemindChange(e) {
      this.newAnniversary.remind = e.detail.value;
    },
    // 编辑时设置提醒变化
    onEditRemindChange(e) {
      this.editingAnniversary.remind = e.detail.value;
    },
    // 添加纪念日
    async addAnniversary() {
      if (!this.checkLoginRequired()) {
        return;
      }
      if (!this.newAnniversary.title) {
        common_vendor.index.showToast({
          title: "请输入纪念日标题",
          icon: "none"
        });
        return;
      }
      if (!this.newAnniversary.date) {
        common_vendor.index.showToast({
          title: "请选择纪念日日期",
          icon: "none"
        });
        return;
      }
      try {
        const response = await api_anniversary.addAnniversary({
          title: this.newAnniversary.title,
          date: this.newAnniversary.date,
          icon: this.newAnniversary.icon,
          color: this.newAnniversary.color,
          remind: this.newAnniversary.remind
        });
        if (response && response.data) {
          const newItem = {
            id: response.data.id,
            title: response.data.title,
            date: response.data.date,
            icon: response.data.icon,
            color: response.data.color,
            remind: response.data.remind
          };
          this.anniversaryList.push(newItem);
          this.newAnniversary.title = "";
          const today = /* @__PURE__ */ new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          this.newAnniversary.date = `${year}-${month}-${day}`;
          this.newAnniversary.icon = "mdi:calendar-heart";
          this.newAnniversary.color = "#FF91A4";
          this.newAnniversary.remind = false;
          this.showAddModal = false;
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "success"
          });
        } else {
          throw new Error("添加纪念日响应数据异常");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:536", "添加纪念日失败:", error);
        common_vendor.index.showToast({
          title: "添加失败",
          icon: "none"
        });
      }
    },
    // 测试删除方法
    testDelete(index) {
      common_vendor.index.__f__("log", "at subPackages/record/pages/anniversary/index.vue:545", "测试删除方法被调用，索引：", index);
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个纪念日吗？",
        success: (res) => {
          if (res.confirm) {
            this.deleteAnniversary(index);
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:558", "显示确认框失败:", err);
          this.deleteAnniversary(index);
        }
      });
    },
    // 删除纪念日
    async deleteAnniversary(index) {
      if (!this.checkLoginRequired()) {
        return;
      }
      if (index < 0 || index >= this.anniversaryList.length) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:573", "无效的索引:", index);
        common_vendor.index.showToast({
          title: "删除失败",
          icon: "none"
        });
        return;
      }
      try {
        const item = this.anniversaryList[index];
        await api_anniversary.deleteAnniversary(item.id);
        this.isDeleting = index;
        setTimeout(() => {
          this.anniversaryList.splice(index, 1);
          this.isDeleting = -1;
          common_vendor.index.showToast({
            title: "删除成功",
            icon: "success"
          });
        }, 300);
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:603", "删除纪念日失败:", error);
        this.isDeleting = -1;
        common_vendor.index.showToast({
          title: "删除失败",
          icon: "none"
        });
      }
    },
    // 编辑纪念日
    editAnniversary(index) {
      if (!this.checkLoginRequired()) {
        return;
      }
      const item = { ...this.anniversaryList[index] };
      this.editingAnniversary = {
        id: item.id,
        title: item.title,
        date: item.date || "",
        icon: item.icon,
        color: item.color,
        remind: item.remind || false
      };
      this.showEditModal = true;
    },
    // 保存编辑的纪念日
    async saveEditedAnniversary() {
      if (!this.checkLoginRequired()) {
        return;
      }
      if (!this.editingAnniversary.title) {
        common_vendor.index.showToast({
          title: "请输入纪念日标题",
          icon: "none"
        });
        return;
      }
      if (!this.editingAnniversary.date) {
        common_vendor.index.showToast({
          title: "请选择纪念日日期",
          icon: "none"
        });
        return;
      }
      try {
        const response = await api_anniversary.updateAnniversary(this.editingAnniversary.id, {
          title: this.editingAnniversary.title,
          date: this.editingAnniversary.date,
          icon: this.editingAnniversary.icon,
          color: this.editingAnniversary.color,
          remind: this.editingAnniversary.remind
        });
        if (response && response.data) {
          const index = this.anniversaryList.findIndex((item) => item.id === this.editingAnniversary.id);
          if (index !== -1) {
            this.anniversaryList[index] = {
              id: response.data.id,
              title: response.data.title,
              date: response.data.date,
              icon: response.data.icon,
              color: response.data.color,
              remind: response.data.remind
            };
          }
          this.showEditModal = false;
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
        } else {
          throw new Error("更新纪念日响应数据异常");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/anniversary/index.vue:687", "保存纪念日失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_iconify_icon2 = common_vendor.resolveComponent("iconify-icon");
  _easycom_iconify_icon2();
}
const _easycom_iconify_icon = () => "../../../../components/iconify-icon/iconify-icon.js";
if (!Math) {
  _easycom_iconify_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_assets._imports_0$4,
    e: common_vendor.f($data.anniversaryList, (item, index, i0) => {
      return common_vendor.e({
        a: "693c5a64-0-" + i0,
        b: common_vendor.p({
          icon: item.icon,
          size: 24,
          color: item.color
        }),
        c: common_vendor.t(item.title),
        d: item.date
      }, item.date ? {
        e: common_vendor.t($options.formatDate(item.date))
      } : {}, {
        f: common_vendor.o(($event) => $options.editAnniversary(index), item.id),
        g: item.date
      }, item.date ? {
        h: common_vendor.t($options.calculateDays(item.date))
      } : {}, {
        i: common_vendor.o(($event) => $options.toggleRemind(index), item.id),
        j: "693c5a64-1-" + i0,
        k: common_vendor.p({
          icon: item.remind ? "mdi:bell" : "mdi:bell-outline",
          size: 24,
          color: item.remind ? "#FFCC66" : "#CCCCCC"
        }),
        l: "693c5a64-2-" + i0,
        m: common_vendor.o(($event) => $options.testDelete(index), item.id),
        n: item.id,
        o: $data.isDeleting === index ? 1 : ""
      });
    }),
    f: common_vendor.p({
      icon: "mdi:delete-outline",
      size: 24,
      color: "#FF6B6B"
    }),
    g: $options.hasReminders
  }, $options.hasReminders ? {
    h: common_vendor.p({
      icon: "mdi:bell",
      size: 18,
      color: "#FFCC66"
    }),
    i: common_vendor.t($options.reminderCount)
  } : {
    j: common_vendor.p({
      icon: "mdi:alert-outline",
      size: 18,
      color: "#FFA500"
    })
  }, {
    k: common_vendor.p({
      icon: "mdi:plus",
      size: 24,
      color: "#ffffff"
    }),
    l: common_vendor.o(($event) => $data.showAddModal = true),
    m: $data.showAddModal
  }, $data.showAddModal ? {
    n: $data.newAnniversary.title,
    o: common_vendor.o(($event) => $data.newAnniversary.title = $event.detail.value),
    p: common_vendor.t($data.newAnniversary.date || "请选择日期"),
    q: $data.newAnniversary.date,
    r: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    s: common_vendor.f($data.iconOptions, (icon, k0, i0) => {
      return {
        a: "693c5a64-6-" + i0,
        b: common_vendor.p({
          icon: icon.name,
          size: 24,
          color: icon.color
        }),
        c: icon.name,
        d: $data.newAnniversary.icon === icon.name ? 1 : "",
        e: common_vendor.o(($event) => $options.selectIcon(icon), icon.name)
      };
    }),
    t: $data.newAnniversary.remind,
    v: common_vendor.o((...args) => $options.onRemindChange && $options.onRemindChange(...args)),
    w: common_vendor.o(($event) => $data.showAddModal = false),
    x: common_vendor.o((...args) => $options.addAnniversary && $options.addAnniversary(...args)),
    y: common_vendor.o(() => {
    }),
    z: common_vendor.o(($event) => $data.showAddModal = false)
  } : {}, {
    A: $data.showEditModal
  }, $data.showEditModal ? {
    B: $data.editingAnniversary.title,
    C: common_vendor.o(($event) => $data.editingAnniversary.title = $event.detail.value),
    D: common_vendor.t($data.editingAnniversary.date || "请选择日期"),
    E: $data.editingAnniversary.date,
    F: common_vendor.o((...args) => $options.onEditDateChange && $options.onEditDateChange(...args)),
    G: common_vendor.f($data.iconOptions, (icon, k0, i0) => {
      return {
        a: "693c5a64-7-" + i0,
        b: common_vendor.p({
          icon: icon.name,
          size: 24,
          color: icon.color
        }),
        c: icon.name,
        d: $data.editingAnniversary.icon === icon.name ? 1 : "",
        e: common_vendor.o(($event) => $options.selectEditIcon(icon), icon.name)
      };
    }),
    H: $data.editingAnniversary.remind,
    I: common_vendor.o((...args) => $options.onEditRemindChange && $options.onEditRemindChange(...args)),
    J: common_vendor.o(($event) => $data.showEditModal = false),
    K: common_vendor.o((...args) => $options.saveEditedAnniversary && $options.saveEditedAnniversary(...args)),
    L: common_vendor.o(() => {
    }),
    M: common_vendor.o(($event) => $data.showEditModal = false)
  } : {}, {
    N: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-693c5a64"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/anniversary/index.js.map
