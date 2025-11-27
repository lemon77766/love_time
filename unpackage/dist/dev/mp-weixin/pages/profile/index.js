"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375
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
    // 修改密码
    changePassword() {
      common_vendor.index.showToast({
        title: "修改密码功能暂未开放",
        icon: "none"
      });
    },
    // 绑定手机
    bindPhone() {
      common_vendor.index.showToast({
        title: "绑定手机功能暂未开放",
        icon: "none"
      });
    },
    // 绑定邮箱
    bindEmail() {
      common_vendor.index.showToast({
        title: "绑定邮箱功能暂未开放",
        icon: "none"
      });
    },
    // 退出登录
    logout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确认要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.removeStorageSync("login_info");
              common_vendor.index.removeStorageSync("token");
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/profile/index.vue:189", "清除登录信息出错", error);
            }
            common_vendor.index.redirectTo({
              url: "/pages/login/index"
            });
          }
        }
      });
    },
    goToPrivacySettings() {
      common_vendor.index.__f__("log", "at pages/profile/index.vue:201", "Attempting to navigate to privacy settings page");
      common_vendor.index.navigateTo({
        url: "/subPackages/record/pages/privacy/index",
        success: () => {
          common_vendor.index.__f__("log", "at pages/profile/index.vue:205", "Successfully navigated to privacy settings page");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/profile/index.vue:208", "Failed to navigate to privacy settings page", err);
          common_vendor.index.showToast({
            title: "跳转失败，请检查网络",
            icon: "none"
          });
        }
      });
    },
    goToNotificationSettings() {
      common_vendor.index.__f__("log", "at pages/profile/index.vue:217", "Attempting to navigate to notification settings page");
      common_vendor.index.navigateTo({
        url: "/subPackages/record/pages/notification/index",
        success: () => {
          common_vendor.index.__f__("log", "at pages/profile/index.vue:221", "Successfully navigated to notification settings page");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/profile/index.vue:224", "Failed to navigate to notification settings page", err);
          common_vendor.index.showToast({
            title: "跳转失败，请检查网络",
            icon: "none"
          });
        }
      });
    },
    goToHeartwall() {
      common_vendor.index.__f__("log", "at pages/profile/index.vue:233", "Attempting to navigate to heartwall page");
      common_vendor.index.navigateTo({
        url: "/subPackages/record/pages/heartwall/index",
        success: () => {
          common_vendor.index.__f__("log", "at pages/profile/index.vue:237", "Successfully navigated to heartwall page");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/profile/index.vue:240", "Failed to navigate to heartwall page", err);
          common_vendor.index.showToast({
            title: "跳转失败，请检查网络",
            icon: "none"
          });
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
    d: common_vendor.o((...args) => $options.changePassword && $options.changePassword(...args)),
    e: common_vendor.o((...args) => $options.bindPhone && $options.bindPhone(...args)),
    f: common_vendor.o((...args) => $options.bindEmail && $options.bindEmail(...args)),
    g: common_vendor.o((...args) => $options.goToPrivacySettings && $options.goToPrivacySettings(...args)),
    h: common_vendor.o((...args) => $options.goToNotificationSettings && $options.goToNotificationSettings(...args)),
    i: common_vendor.o((...args) => $options.goToHeartwall && $options.goToHeartwall(...args)),
    j: common_vendor.o((...args) => $options.logout && $options.logout(...args)),
    k: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-201c0da5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/index.js.map
