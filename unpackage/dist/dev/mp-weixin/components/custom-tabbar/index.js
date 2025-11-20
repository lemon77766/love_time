"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "CustomTabbar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      safeAreaInsets: {
        bottom: 0
      },
      tabList: [
        {
          pagePath: "pages/index/index",
          text: "首页",
          iconPath: "/static/love.png",
          selectedIconPath: "/static/love.png"
        },
        {
          pagePath: "pages/trajectory/index",
          text: "轨迹",
          iconPath: "/static/trajectory.png",
          selectedIconPath: "/static/trajectory.png"
        },
        {
          pagePath: "pages/we/index",
          text: "我们",
          iconPath: "/static/we.png",
          selectedIconPath: "/static/we.png"
        }
      ]
    };
  },
  mounted() {
    this.getSafeAreaInsets();
  },
  methods: {
    switchTab(item, index) {
      if (this.current === index)
        return;
      common_vendor.index.switchTab({
        url: "/" + item.pagePath,
        fail: (err) => {
          common_vendor.index.__f__("error", "at components/custom-tabbar/index.vue:72", "切换页面失败", err);
        }
      });
    },
    getSafeAreaInsets() {
      var _a;
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.safeAreaInsets.bottom = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.tabList, (item, index, i0) => {
      return common_vendor.e({
        a: $props.current === index ? item.selectedIconPath : item.iconPath,
        b: $props.current === index
      }, $props.current === index ? {} : {}, {
        c: common_vendor.t(item.text),
        d: $props.current === index ? 1 : "",
        e: index,
        f: $props.current === index ? 1 : "",
        g: common_vendor.o(($event) => $options.switchTab(item, index), index)
      });
    }),
    b: $data.safeAreaInsets.bottom + "px"
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-52454e90"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/custom-tabbar/index.js.map
