"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const utils_auth = require("../../utils/auth.js");
const common_assets = require("../../common/assets.js");
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
      // 近期动态
      recentActivities: []
    };
  },
  computed: {
    // 计算在一起的天数
    daysTogether() {
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
      if (!this.bindTime)
        return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = /* @__PURE__ */ new Date();
        const currentYear = now.getFullYear();
        const nextAnniversary = new Date(currentYear, bindDate.getMonth(), bindDate.getDate());
        if (nextAnniversary < now) {
          nextAnniversary.setFullYear(currentYear + 1);
        }
        const diffTime = nextAnniversary - now;
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      } catch (e) {
        return 0;
      }
    },
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
    this.loadRecentActivities();
  },
  onShow() {
    this.loadUserInfo();
    this.loadCoupleInfo();
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
            this.userInfo.displayAvatar = this.userInfo.avatarUrl || "/static/zhuye/lanmei_boy.png";
          }
        } else {
          const loginInfo = common_vendor.index.getStorageSync("login_info");
          if (loginInfo && loginInfo.userInfo) {
            this.userInfo = { ...loginInfo.userInfo };
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:325", "加载用户信息失败", error);
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
                common_vendor.index.__f__("log", "at pages/index/index.vue:356", "⚠️ 服务器返回未绑定，清除本地状态");
                utils_couple.clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = "";
              }
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/index/index.vue:364", "同步绑定状态失败", e);
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
          common_vendor.index.__f__("error", "at pages/index/index.vue:399", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:409", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    // 加载近期动态
    loadRecentActivities() {
      this.recentActivities = [
        {
          icon: "📸",
          text: '共同创建了"2024旅行记忆"相册'
        },
        {
          icon: "🏆",
          text: '达成成就"美食探险家"'
        },
        {
          icon: "📅",
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
    },
    // 解绑关系
    async handleUnbind() {
      common_vendor.index.showModal({
        title: "确认解绑",
        content: "解除关系后，双方将无法共享数据。确定要解除吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "解绑中..." });
              await api_couple.unbindCouple();
              common_vendor.index.hideLoading();
              utils_couple.clearCoupleInfo();
              common_vendor.index.showToast({
                title: "已解除关系",
                icon: "success"
              });
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = "";
              setTimeout(() => {
                this.loadCoupleInfo();
              }, 1500);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/index/index.vue:477", "解绑失败", error);
              common_vendor.index.showToast({
                title: error.message || "解绑失败，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goToProfile && $options.goToProfile(...args)),
    c: $data.navBarHeight + "px",
    d: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    e: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/zhuye/lanmei_boy.png",
    f: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/zhuye/lanmei_boy.png",
    g: common_vendor.t($options.daysTogether),
    h: common_vendor.t($options.nextAnniversaryDays),
    i: common_vendor.o((...args) => $options.handleUnbind && $options.handleUnbind(...args))
  } : {
    j: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/zhuye/lanmei_boy.png",
    k: common_vendor.o((...args) => $options.goToInvite && $options.goToInvite(...args))
  }, {
    l: common_assets._imports_0$1,
    m: common_vendor.o((...args) => $options.goToSweetQA && $options.goToSweetQA(...args)),
    n: common_vendor.o((...args) => $options.goToHundredThings && $options.goToHundredThings(...args)),
    o: common_vendor.o((...args) => $options.goToHeartWall && $options.goToHeartWall(...args)),
    p: common_vendor.o((...args) => $options.goToFutureLetter && $options.goToFutureLetter(...args)),
    q: common_vendor.t($data.wishText),
    r: $data.recentActivities.length > 0
  }, $data.recentActivities.length > 0 ? {
    s: common_vendor.f($data.recentActivities, (activity, index, i0) => {
      return {
        a: common_vendor.t(activity.icon),
        b: common_vendor.t(activity.text),
        c: index
      };
    })
  } : {}, {
    t: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
