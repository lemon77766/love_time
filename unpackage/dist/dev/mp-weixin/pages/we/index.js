"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        displayName: "",
        displayAvatar: "",
        nickName: ""
      },
      stats: [
        { num: 30, label: "Moment", icon: "◐" },
        { num: 78, label: "图片", icon: "🖼️" },
        { num: 6, label: "视频", icon: "🎬" },
        { num: 590, label: "文字", icon: "✎" }
      ],
      lastUpdate: "15:24",
      menus: [
        { key: "memory", text: "恋爱记忆", icon: "💕" },
        { key: "profile", text: "我的资料", icon: "◎" },
        { key: "settings", text: "设置", icon: "⚙" },
        { key: "about", text: "关于应用", icon: "ℹ" }
      ]
    };
  },
  onLoad() {
    this.loadUserInfo();
  },
  onShow() {
    this.loadUserInfo();
  },
  methods: {
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
        common_vendor.index.__f__("error", "at pages/we/index.vue:97", "加载用户信息失败", error);
        this.userInfo.displayName = "用户";
        this.userInfo.displayAvatar = "/static/zhuye/lanmei_boy.png";
      }
    },
    onMenu() {
      common_vendor.index.showActionSheet({
        itemList: ["设置", "主题", "关于"],
        success: () => {
        }
      });
    },
    onScan() {
      common_vendor.index.showToast({ title: "打开相机/扫描（示例）", icon: "none" });
    },
    openMenu(key) {
      const map = {
        memory: "恋爱记忆",
        profile: "我的资料",
        settings: "设置",
        about: "关于应用"
      };
      if (key === "memory") {
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
  return {
    a: $data.userInfo.displayAvatar,
    b: common_vendor.t($data.userInfo.displayName),
    c: common_vendor.o((...args) => $options.onMenu && $options.onMenu(...args)),
    d: common_vendor.o((...args) => $options.onScan && $options.onScan(...args)),
    e: common_vendor.f($data.stats, (s, i, i0) => {
      return {
        a: common_vendor.t(s.num),
        b: common_vendor.t(s.icon),
        c: common_vendor.t(s.label),
        d: i
      };
    }),
    f: common_vendor.t($data.lastUpdate),
    g: common_vendor.f($data.menus, (m, i, i0) => {
      return {
        a: common_vendor.t(m.icon),
        b: common_vendor.t(m.text),
        c: i,
        d: common_vendor.o(($event) => $options.openMenu(m.key), i)
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/we/index.js.map
