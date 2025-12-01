"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_auth = require("../../utils/auth.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const CustomTabbar = () => "../../components/custom-tabbar/index.js";
const _sfc_main = {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      userInfo: {
        nickName: "",
        avatarUrl: "",
        displayName: "",
        displayAvatar: ""
      },
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: "",
      // 相爱天数相关
      loveDays: 0,
      // 成就数据
      achievements: [
        { icon: "🧁", name: "美食家", bgColor: "rgba(255, 217, 61, 0.2)" },
        { icon: "✈️", name: "旅行者", bgColor: "rgba(255, 158, 188, 0.2)" },
        { icon: "📅", name: "纪念日", bgColor: "rgba(217, 172, 255, 0.2)" }
      ]
    };
  },
  computed: {
    // 计算在一起的天数（优先使用接口返回的数据）
    daysTogether() {
      if (this.loveDays > 0) {
        return this.loveDays;
      }
      if (!this.bindTime)
        return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = /* @__PURE__ */ new Date();
        const diffTime = now - bindDate;
        const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
      } catch (e) {
        return 0;
      }
    },
    // 计算容器顶部内边距
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + "rpx";
    }
  },
  onLoad() {
    this.getSystemInfo();
    if (utils_auth.isGuestUser()) {
      this.goToLogin();
      return;
    }
    this.loadUserInfo();
    this.loadCoupleInfo();
    this.loadLoveDays();
  },
  onShow() {
    if (utils_auth.isGuestUser()) {
      this.goToLogin();
      return;
    }
    this.loadUserInfo();
    this.loadCoupleInfo();
    this.loadLoveDays();
  },
  methods: {
    // 跳转到登录页面
    goToLogin() {
      common_vendor.index.redirectTo({
        url: "/pages/login/index"
      });
    },
    // 跳转到账号与安全页面
    goToProfileSettings() {
      common_vendor.index.navigateTo({
        url: "/pages/profile/index"
      });
    },
    // 跳转到编辑资料页面
    goToEdit() {
      common_vendor.index.__f__("log", "at pages/we/index.vue:242", "跳转到编辑资料页面");
      common_vendor.index.navigateTo({
        url: "/subPackages/record/pages/profile/edit",
        success: () => {
          common_vendor.index.__f__("log", "at pages/we/index.vue:246", "成功跳转到编辑资料页面");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/we/index.vue:249", "跳转到编辑资料页面失败", err);
          common_vendor.index.showToast({
            title: "跳转失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 获取系统信息
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
      this.navBarHeight = 54;
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          this.useWechatNickname = !this.userInfo.displayName || this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? "" : this.userInfo.displayName;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:308", "加载用户信息失败", error);
      }
    },
    // 加载相爱天数
    async loadLoveDays() {
      if (utils_auth.isGuestUser()) {
        common_vendor.index.__f__("log", "at pages/we/index.vue:317", "游客用户，跳过加载相爱天数");
        this.loveDays = 0;
        return;
      }
      if (!this.isBound) {
        this.loveDays = 0;
        return;
      }
      try {
        const response = await api_couple.getLoveDays();
        if (response && response.data) {
          this.loveDays = response.data.loveDays || 0;
          common_vendor.index.__f__("log", "at pages/we/index.vue:333", "✅ 成功加载相爱天数:", this.loveDays);
        } else {
          common_vendor.index.__f__("warn", "at pages/we/index.vue:335", "⚠️ 获取相爱天数失败，无法识别有效数据结构:", response);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:338", "❌ 获取相爱天数失败:", error);
      }
    },
    // 加载情侣信息
    async loadCoupleInfo() {
      var _a, _b;
      if (utils_auth.isGuestUser()) {
        common_vendor.index.__f__("log", "at pages/we/index.vue:347", "游客用户，跳过加载情侣信息");
        this.isBound = false;
        this.partnerInfo = null;
        this.bindTime = "";
        return;
      }
      try {
        const localCoupleInfo = utils_couple.getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || null;
          this.bindTime = localCoupleInfo.bindTime || "";
          try {
            const response = await api_couple.getCoupleStatus();
            if (response && response.data && response.data.isBound) {
              utils_couple.saveCoupleInfo({
                isBound: true,
                coupleId: response.data.coupleId,
                partnerId: ((_a = response.data.partnerInfo) == null ? void 0 : _a.userId) || "",
                partnerInfo: response.data.partnerInfo || {},
                bindTime: response.data.bindTime || "",
                role: response.data.role || ""
              });
              this.partnerInfo = response.data.partnerInfo || {};
              this.bindTime = response.data.bindTime || "";
            } else {
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = "";
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/we/index.vue:384", "同步绑定状态失败", e);
          }
          return;
        }
        this.isBound = false;
        this.partnerInfo = null;
        try {
          const response = await api_couple.getCoupleStatus();
          if (response && response.data && response.data.isBound) {
            this.isBound = true;
            this.partnerInfo = response.data.partnerInfo || {};
            this.bindTime = response.data.bindTime || "";
            utils_couple.saveCoupleInfo({
              isBound: true,
              coupleId: response.data.coupleId,
              partnerId: ((_b = response.data.partnerInfo) == null ? void 0 : _b.userId) || "",
              partnerInfo: response.data.partnerInfo || {},
              bindTime: response.data.bindTime || "",
              role: response.data.role || ""
            });
          } else {
            this.isBound = false;
            this.partnerInfo = null;
            this.bindTime = "";
            utils_couple.clearCoupleInfo();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:417", "查询情侣状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:427", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    // 处理设置项点击
    handleSetting(type) {
      switch (type) {
        case "notification":
          common_vendor.index.navigateTo({
            url: "/subPackages/record/pages/notification/index"
          });
          break;
        case "privacy":
          common_vendor.index.navigateTo({
            url: "/subPackages/record/pages/privacy/index"
          });
          break;
        case "sync":
          common_vendor.index.navigateTo({
            url: "/subPackages/record/pages/anniversary/index"
          });
          break;
        default:
          common_vendor.index.__f__("warn", "at pages/we/index.vue:462", "未知设置项:", type);
      }
    },
    // 解除关系
    async handleUnbind() {
      common_vendor.index.showModal({
        title: "确认解除关系",
        content: "解除关系后，你们将不再是情侣关系，相关数据也会被删除。是否确认解除？",
        confirmColor: "#FF6B6B",
        success: async (res) => {
          if (res.confirm) {
            try {
              const response = await api_couple.unbindCouple();
              if (response && response.code === 200) {
                utils_couple.clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = "";
                common_vendor.index.showToast({
                  title: "解除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.switchTab({
                    url: "/pages/index/index"
                  });
                }, 1500);
              } else {
                common_vendor.index.__f__("error", "at pages/we/index.vue:497", "解除关系失败", response);
                common_vendor.index.showToast({
                  title: (response == null ? void 0 : response.message) || "解除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/we/index.vue:504", "解除关系异常", error);
              common_vendor.index.showToast({
                title: "操作异常，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_custom_tabbar = common_vendor.resolveComponent("custom-tabbar");
  _component_custom_tabbar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl,
    d: common_vendor.t($data.userInfo.displayName || $data.userInfo.nickName || "用户"),
    e: $data.isBound && $data.bindTime
  }, $data.isBound && $data.bindTime ? {
    f: common_vendor.t($options.daysTogether)
  } : $data.isBound ? {} : {}, {
    g: $data.isBound,
    h: common_vendor.o((...args) => $options.goToEdit && $options.goToEdit(...args)),
    i: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    j: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl,
    k: common_vendor.t($data.userInfo.displayName || $data.userInfo.nickName || "我"),
    l: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/login/love.jpg",
    m: common_vendor.t($data.partnerInfo.displayName || $data.partnerInfo.nickName || "另一半")
  } : {}, {
    n: common_vendor.f($data.achievements, (achievement, index, i0) => {
      return {
        a: common_vendor.t(achievement.icon),
        b: achievement.bgColor,
        c: common_vendor.t(achievement.name),
        d: index
      };
    }),
    o: common_vendor.o(($event) => $options.handleSetting("notification")),
    p: common_vendor.o(($event) => $options.handleSetting("privacy")),
    q: common_vendor.o(($event) => $options.handleSetting("sync")),
    r: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    s: common_vendor.o((...args) => $options.handleUnbind && $options.handleUnbind(...args))
  } : {}, {
    t: _ctx.showProfileSettings ? 1 : "",
    v: common_vendor.o((...args) => $options.goToProfileSettings && $options.goToProfileSettings(...args)),
    w: common_vendor.p({
      current: 2
    }),
    x: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5f4b3cd0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/we/index.js.map
