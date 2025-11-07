"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "iconify-icon",
  props: {
    icon: {
      type: String,
      required: true,
      default: ""
    },
    size: {
      type: [String, Number],
      default: 24
    },
    color: {
      type: String,
      default: "#666666"
    }
  },
  setup(__props) {
    const props = __props;
    common_vendor.ref(null);
    const svgUrl = common_vendor.ref("");
    const iconUnicodeMap = {
      "mdi:heart": "❤",
      "mdi:account": "👤",
      "mdi:chat-question": "💬",
      "mdi:check-all": "✓",
      "mdi:heart-box": "💝",
      "mdi:email-heart": "✉",
      "mdi:camera": "📷",
      "mdi:achievement": "🏆",
      "mdi:calendar": "📅",
      "mdi:calendar-heart": "💕",
      "mdi:arrow-left": "←",
      "mdi:map": "🗺",
      "mdi:apps": "☰",
      "mdi:home": "🏠",
      "mdi:message": "💬",
      "mdi:gift": "🎁",
      "mdi:pencil": "✏",
      "mdi:bell": "🔔",
      "mdi:shield-account": "🛡",
      "mdi:cloud-upload": "☁",
      "mdi:lock": "🔒",
      "mdi:chevron-right": "›",
      "mdi:cupcake": "🧁",
      "mdi:airplane": "✈"
    };
    const iconUnicode = common_vendor.computed(() => {
      return iconUnicodeMap[props.icon] || "●";
    });
    const iconStyle = common_vendor.computed(() => {
      const sizeValue = typeof props.size === "number" ? `${props.size}rpx` : props.size;
      return {
        fontSize: sizeValue,
        color: props.color,
        display: "inline-block",
        lineHeight: "1"
      };
    });
    const wrapperStyle = common_vendor.computed(() => {
      const sizeValue = typeof props.size === "number" ? `${props.size}rpx` : props.size;
      return {
        width: sizeValue,
        height: sizeValue,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      };
    });
    const imageStyle = common_vendor.computed(() => {
      const sizeValue = typeof props.size === "number" ? `${props.size}rpx` : props.size;
      return {
        width: sizeValue,
        height: sizeValue,
        filter: `drop-shadow(0 0 0 ${props.color})`
      };
    });
    const loadSvgIcon = async () => {
      if (!props.icon)
        return;
      try {
        const [iconSet, iconName] = props.icon.split(":");
        if (!iconSet || !iconName)
          return;
        const svgApiUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=${encodeURIComponent(props.color)}&width=${props.size}&height=${props.size}`;
        svgUrl.value = svgApiUrl;
      } catch (error) {
        common_vendor.index.__f__("warn", "at components/iconify-icon/iconify-icon.vue:138", "Failed to load icon:", error);
        svgUrl.value = "";
      }
    };
    common_vendor.onMounted(() => {
      loadSvgIcon();
    });
    common_vendor.watch(() => props.icon, () => {
      loadSvgIcon();
    });
    common_vendor.watch(() => [props.color, props.size], () => {
      loadSvgIcon();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: svgUrl.value
      }, svgUrl.value ? {
        b: svgUrl.value,
        c: common_vendor.s(imageStyle.value)
      } : {
        d: common_vendor.t(iconUnicode.value),
        e: common_vendor.s(iconStyle.value)
      }, {
        f: common_vendor.s(wrapperStyle.value)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd9ce4c8"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/iconify-icon/iconify-icon.js.map
