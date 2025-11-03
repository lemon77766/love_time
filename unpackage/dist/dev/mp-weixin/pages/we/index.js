"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      userInfo: {
        displayName: "",
        displayAvatar: "",
        nickName: ""
      },
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: "",
      stats: [
        { num: 30, label: "Moment", icon: "◐" },
        { num: 78, label: "图片", icon: "🖼️" },
        { num: 6, label: "视频", icon: "🎬" },
        { num: 590, label: "文字", icon: "✎" }
      ],
      lastUpdate: "15:24",
      menus: [
        { key: "invite", text: "邀请另一半", icon: "👫" },
        { key: "memory", text: "恋爱记忆", icon: "💕" },
        { key: "profile", text: "我的资料", icon: "◎" },
        { key: "settings", text: "设置", icon: "⚙" },
        { key: "about", text: "关于应用", icon: "ℹ" }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    },
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
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  methods: {
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 54;
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          if (!this.userInfo.displayName) {
            this.userInfo.displayName = this.userInfo.nickName || "用户";
          }
          if (!this.userInfo.displayAvatar) {
            this.userInfo.displayAvatar = this.userInfo.avatarUrl || "/static/zhuye/lanmei_boy.png";
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:164", "加载用户信息失败", error);
        this.userInfo.displayName = "用户";
        this.userInfo.displayAvatar = "/static/zhuye/lanmei_boy.png";
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
            common_vendor.index.__f__("error", "at pages/we/index.vue:203", "同步绑定状态失败", e);
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
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:230", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:240", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    openMenu(key) {
      const map = {
        memory: "恋爱记忆",
        profile: "我的资料",
        settings: "设置",
        about: "关于应用"
      };
      if (key === "invite") {
        common_vendor.index.navigateTo({
          url: "/pages/invite/index"
        });
      } else if (key === "memory") {
        common_vendor.index.navigateTo({
          url: "/pages/jiyi/index"
        });
      } else if (key === "profile") {
        common_vendor.index.navigateTo({
          url: "/pages/profile/index"
        });
      } else {
        common_vendor.index.showToast({ title: map[key] + "（待开发）", icon: "none" });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    d: $data.userInfo.displayAvatar,
    e: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/zhuye/lanmei_boy.png"
  } : {
    f: $data.userInfo.displayAvatar
  }, {
    g: common_vendor.t($data.userInfo.displayName),
    h: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    i: common_vendor.t($data.partnerInfo.displayName || $data.partnerInfo.nickName || "TA"),
    j: common_vendor.t($options.daysTogether)
  } : {}, {
    k: common_vendor.f($data.stats, (s, i, i0) => {
      return {
        a: common_vendor.t(s.num),
        b: common_vendor.t(s.icon),
        c: common_vendor.t(s.label),
        d: i
      };
    }),
    l: common_vendor.t($data.lastUpdate),
    m: common_vendor.f($data.menus, (m, i, i0) => {
      return {
        a: common_vendor.t(m.icon),
        b: common_vendor.t(m.text),
        c: i,
        d: common_vendor.o(($event) => $options.openMenu(m.key), i)
      };
    }),
    n: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/we/index.js.map
