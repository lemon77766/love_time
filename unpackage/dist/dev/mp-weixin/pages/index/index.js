"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const utils_auth = require("../../utils/auth.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      wishText: "这一刻的幸福足以支撑以后的漫长岁月",
      screenWidth: 375,
      // 用户信息
      userInfo: {
        displayName: "",
        displayAvatar: "",
        avatarUrl: "",
        nickName: ""
      },
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: "",
      // 相爱天数相关
      loveDays: 0,
      anniversaryDate: "",
      relationshipName: "",
      // 近期动态
      recentActivities: []
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
    // 计算下一个周年纪念日
    nextAnniversaryDays() {
      return 93;
    },
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    }
  },
  async onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    await this.loadCoupleInfo();
    this.loadLoveDays();
    this.loadRecentActivities();
  },
  async onShow() {
    this.loadUserInfo();
    await this.loadCoupleInfo();
    this.loadLoveDays();
    this.loadRecentActivities();
  },
  methods: {
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
    goToSweetQA() {
      common_vendor.index.navigateTo({
        url: "/pages/qna/index"
      });
    },
    goToHundredThings() {
      common_vendor.index.navigateTo({
        url: "/pages/hundred/index"
      });
    },
    goToHeartWall() {
      common_vendor.index.navigateTo({
        url: "/pages/heartwall/index"
      });
    },
    goToFutureLetter() {
      common_vendor.index.navigateTo({
        url: "/pages/xinxiang/index"
      });
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const userInfoData = utils_auth.getUserInfo();
        if (userInfoData) {
          this.userInfo = { ...userInfoData };
          if (!this.userInfo.displayName) {
            this.userInfo.displayName = this.userInfo.nickName || "用户";
          }
          if (!this.userInfo.displayAvatar) {
            this.userInfo.displayAvatar = this.userInfo.avatarUrl || "/static/login/love.jpg";
          }
        } else {
          const loginInfo = common_vendor.index.getStorageSync("login_info");
          if (loginInfo && loginInfo.userInfo) {
            this.userInfo = { ...loginInfo.userInfo };
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:311", "加载用户信息失败", error);
      }
    },
    // 加载情侣信息
    async loadCoupleInfo() {
      var _a, _b;
      try {
        const localCoupleInfo = utils_couple.getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || null;
          this.bindTime = localCoupleInfo.bindTime || "";
          try {
            const response = await api_couple.getCoupleStatus();
            if (response && response.data) {
              if (response.data.isBound) {
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
                common_vendor.index.__f__("log", "at pages/index/index.vue:342", "⚠️ 服务器返回未绑定，清除本地状态");
                utils_couple.clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = "";
              }
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/index/index.vue:350", "同步绑定状态失败", e);
          }
          return;
        }
        this.isBound = false;
        this.partnerInfo = null;
        try {
          const response = await api_couple.getCoupleStatus();
          if (response && response.data) {
            if (response.data.isBound) {
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
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:385", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:395", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    // 加载相爱天数
    async loadLoveDays() {
      if (!this.isBound) {
        this.loveDays = 0;
        this.anniversaryDate = "";
        this.relationshipName = "";
        return;
      }
      try {
        const response = await api_couple.getLoveDays();
        if (response && response.success && response.data) {
          this.loveDays = response.data.loveDays || 0;
          this.anniversaryDate = response.data.anniversaryDate || "";
          this.relationshipName = response.data.relationshipName || "";
          common_vendor.index.__f__("log", "at pages/index/index.vue:419", "✅ 成功加载相爱天数:", {
            loveDays: this.loveDays,
            anniversaryDate: this.anniversaryDate,
            relationshipName: this.relationshipName
          });
        } else {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:425", "⚠️ 获取相爱天数失败，响应格式异常:", response);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:428", "❌ 获取相爱天数失败:", error);
      }
    },
    // 加载近期动态
    loadRecentActivities() {
      this.recentActivities = [
        {
          icon: "mdi:camera",
          color: "#FF9EBC",
          text: '共同创建了"2024旅行记忆"相册'
        },
        {
          icon: "mdi:achievement",
          color: "#FFD93D",
          text: '达成成就"美食探险家"'
        },
        {
          icon: "mdi:calendar",
          color: "#D9ACFF",
          text: "2025年11月10日 纪念日即将到来"
        }
      ];
    },
    // 跳转到邀请页面
    goToInvite() {
      common_vendor.index.navigateTo({
        url: "/pages/invite/index"
      });
    },
    // 跳转到个人中心
    goToProfile() {
      common_vendor.index.navigateTo({
        url: "/pages/we/index"
      });
    }
  }
};
if (!Array) {
  const _easycom_iconify_icon2 = common_vendor.resolveComponent("iconify-icon");
  _easycom_iconify_icon2();
}
const _easycom_iconify_icon = () => "../../components/iconify-icon/iconify-icon.js";
if (!Math) {
  _easycom_iconify_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      icon: "mdi:heart",
      size: 24,
      color: "#ff6b6b"
    }),
    c: common_vendor.p({
      icon: "mdi:account",
      size: 24,
      color: "#666"
    }),
    d: common_vendor.o((...args) => $options.goToProfile && $options.goToProfile(...args)),
    e: $data.navBarHeight + "px",
    f: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    g: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    h: common_vendor.p({
      icon: "mdi:heart",
      size: 48,
      color: "#ff6b6b"
    }),
    i: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/login/love.jpg",
    j: common_vendor.t($options.daysTogether),
    k: common_vendor.p({
      icon: "mdi:robot",
      size: 32,
      color: "#4A90E2"
    }),
    l: common_vendor.p({
      icon: "mdi:emoticon-angry",
      size: 32,
      color: "#FF6B6B"
    }),
    m: common_vendor.p({
      icon: "mdi:calendar-heart",
      size: 32,
      color: "#FF91A4"
    }),
    n: common_vendor.t($options.nextAnniversaryDays)
  } : {
    o: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    p: common_vendor.p({
      icon: "mdi:heart",
      size: 48,
      color: "#ff6b6b"
    }),
    q: common_vendor.o((...args) => $options.goToInvite && $options.goToInvite(...args))
  }, {
    r: common_vendor.p({
      icon: "mdi:chat-question",
      size: 48,
      color: "#FF9EBC"
    }),
    s: common_vendor.o((...args) => $options.goToSweetQA && $options.goToSweetQA(...args)),
    t: common_vendor.p({
      icon: "mdi:check-all",
      size: 48,
      color: "#D9ACFF"
    }),
    v: common_vendor.o((...args) => $options.goToHundredThings && $options.goToHundredThings(...args)),
    w: common_vendor.p({
      icon: "mdi:heart-box",
      size: 48,
      color: "#FF6B6B"
    }),
    x: common_vendor.o((...args) => $options.goToHeartWall && $options.goToHeartWall(...args)),
    y: common_vendor.p({
      icon: "mdi:book-heart",
      size: 48,
      color: "#FF91A4"
    }),
    z: common_vendor.o((...args) => $options.goToFutureLetter && $options.goToFutureLetter(...args)),
    A: common_vendor.t($data.wishText),
    B: $data.recentActivities.length > 0
  }, $data.recentActivities.length > 0 ? {
    C: common_vendor.f($data.recentActivities, (activity, index, i0) => {
      return {
        a: "141f41a3-11-" + i0,
        b: common_vendor.p({
          icon: activity.icon,
          size: 32,
          color: activity.color
        }),
        c: common_vendor.t(activity.text),
        d: index
      };
    })
  } : {}, {
    D: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
