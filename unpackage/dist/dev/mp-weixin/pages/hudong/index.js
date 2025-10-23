"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      menuItems: [
        { icon: "/static/love.png", text: "甜蜜问答" },
        { icon: "/static/hudong.png", text: "恋爱一百件小事" },
        { icon: "/static/remerber.png", text: "心形墙" },
        { icon: "/static/we.png", text: "未来情书" }
      ],
      cards: [
        {
          title: "纪念日记录",
          desc: "辅助信息示例文本技术，好处和科学的方法",
          btnText: "立即观看",
          img: "/static/logo.png"
        },
        {
          title: "纪念日查看",
          desc: "科学有效的专业人士的增强效果",
          btnText: "未来情书",
          img: "/static/hudong.png"
        }
      ],
      navItems: [
        { icon: "/static/logo.png" },
        { icon: "/static/music.png" },
        { icon: "/static/avatar.png" }
      ]
    };
  },
  methods: {
    onCardClick(card) {
      common_vendor.index.showToast({ title: card.btnText, icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.menuItems, (m, i, i0) => {
      return {
        a: m.icon,
        b: common_vendor.t(m.text),
        c: i
      };
    }),
    b: common_vendor.f($data.cards, (c, i, i0) => {
      return {
        a: common_vendor.t(c.title),
        b: common_vendor.t(c.desc),
        c: common_vendor.t(c.btnText),
        d: common_vendor.o(($event) => $options.onCardClick(c), i),
        e: c.img,
        f: i
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hudong/index.js.map
