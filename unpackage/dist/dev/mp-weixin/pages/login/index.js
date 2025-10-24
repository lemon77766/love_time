"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      isLoading: false,
      userInfo: {
        nickName: "",
        avatarUrl: ""
      }
    };
  },
  onLoad() {
    this.checkLoginStatus();
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.isLoggedIn) {
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:85", "检查登录状态失败", e);
      }
    },
    // 微信授权登录
    async handleWxLogin() {
      this.isLoading = true;
      try {
        const userProfile = await this.getUserProfile();
        if (userProfile) {
          this.userInfo = {
            nickName: userProfile.nickName,
            avatarUrl: userProfile.avatarUrl
          };
          const loginInfo = {
            isLoggedIn: true,
            userInfo: this.userInfo,
            loginTime: (/* @__PURE__ */ new Date()).toISOString()
          };
          common_vendor.index.setStorageSync("login_info", loginInfo);
          this.isLoggedIn = true;
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success",
            duration: 1500
          });
          setTimeout(() => {
            this.enterApp();
          }, 1500);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:127", "登录失败", e);
        common_vendor.index.showToast({
          title: e.errMsg || "登录失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 获取用户信息（微信小程序）
    getUserProfile() {
      return new Promise((resolve, reject) => {
        common_vendor.index.getUserProfile({
          desc: "用于完善用户资料",
          success: (res) => {
            resolve(res.userInfo);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    // 进入应用
    enterApp() {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_assets._imports_1,
    c: $data.userInfo.nickName
  }, $data.userInfo.nickName ? {
    d: $data.userInfo.avatarUrl,
    e: common_vendor.t($data.userInfo.nickName)
  } : {}, {
    f: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    g: common_vendor.o((...args) => $options.handleWxLogin && $options.handleWxLogin(...args)),
    h: $data.isLoading
  } : {
    i: common_vendor.o((...args) => $options.enterApp && $options.enterApp(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
