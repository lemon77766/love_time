"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      strangerProfileVisible: false,
      searchable: true,
      hideOnlineStatus: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + "rpx";
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.strangerProfileVisible = false;
    this.searchable = true;
    this.hideOnlineStatus = false;
  },
  methods: {
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
    toggleStrangerProfile(e) {
      this.strangerProfileVisible = e.target.value;
      common_vendor.index.showToast({
        title: this.strangerProfileVisible ? "已允许陌生人查看" : "已禁止陌生人查看",
        icon: "none"
      });
    },
    toggleSearchable(e) {
      this.searchable = e.target.value;
      common_vendor.index.showToast({
        title: this.searchable ? "已允许被搜索到" : "已禁止被搜索到",
        icon: "none"
      });
    },
    toggleOnlineStatus(e) {
      this.hideOnlineStatus = e.target.value;
      common_vendor.index.showToast({
        title: this.hideOnlineStatus ? "已隐藏在线状态" : "已显示在线状态",
        icon: "none"
      });
    },
    viewDataPolicy() {
      common_vendor.index.showToast({
        title: "数据政策页面待开发",
        icon: "none"
      });
    },
    requestDataExport() {
      common_vendor.index.showModal({
        title: "导出个人数据",
        content: "我们将把您的个人数据打包发送到您的邮箱，请确认您的邮箱地址。",
        confirmText: "确认导出",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "数据导出请求已提交",
              icon: "success"
            });
          }
        }
      });
    },
    requestAccountDeletion() {
      common_vendor.index.showModal({
        title: "注销账号",
        content: "注销账号后，您的所有数据将被永久删除且无法恢复，确定要继续吗？",
        confirmText: "确认注销",
        confirmColor: "#FF6B6B",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "账号注销申请已提交",
              icon: "success"
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.strangerProfileVisible,
    e: common_vendor.o((...args) => $options.toggleStrangerProfile && $options.toggleStrangerProfile(...args)),
    f: $data.searchable,
    g: common_vendor.o((...args) => $options.toggleSearchable && $options.toggleSearchable(...args)),
    h: $data.hideOnlineStatus,
    i: common_vendor.o((...args) => $options.toggleOnlineStatus && $options.toggleOnlineStatus(...args)),
    j: common_vendor.o((...args) => $options.viewDataPolicy && $options.viewDataPolicy(...args)),
    k: common_vendor.o((...args) => $options.requestDataExport && $options.requestDataExport(...args)),
    l: common_vendor.o((...args) => $options.requestAccountDeletion && $options.requestAccountDeletion(...args)),
    m: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a96802b8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/privacy/index.js.map
