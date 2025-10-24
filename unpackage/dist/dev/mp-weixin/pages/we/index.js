"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      stats: [
        { num: 30, label: "Moment", icon: "◐" },
        { num: 78, label: "图片", icon: "🖼️" },
        { num: 6, label: "视频", icon: "🎬" },
        { num: 590, label: "文字", icon: "✎" }
      ],
      lastUpdate: "15:24",
      menus: [
        { key: "profile", text: "我的资料", icon: "◎" },
        { key: "notify", text: "通知设置", icon: "🔔" },
        { key: "theme", text: "主题设置", icon: "☘" },
        { key: "settings", text: "设置", icon: "⚙" },
        { key: "about", text: "关于应用", icon: "ℹ" }
      ]
    };
  },
  methods: {
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
        profile: "我的资料",
        notify: "通知设置",
        theme: "主题设置",
        settings: "设置",
        about: "关于应用"
      };
      common_vendor.index.showToast({ title: map[key] + "（待开发）", icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.onMenu && $options.onMenu(...args)),
    b: common_vendor.o((...args) => $options.onScan && $options.onScan(...args)),
    c: common_assets._imports_0$2,
    d: common_vendor.f($data.stats, (s, i, i0) => {
      return {
        a: common_vendor.t(s.num),
        b: common_vendor.t(s.icon),
        c: common_vendor.t(s.label),
        d: i
      };
    }),
    e: common_vendor.t($data.lastUpdate),
    f: common_vendor.f($data.menus, (m, i, i0) => {
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
