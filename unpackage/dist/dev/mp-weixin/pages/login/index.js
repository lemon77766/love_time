"use strict";
const common_vendor = require("../../common/vendor.js");
const api_login = require("../../api/login.js");
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
          common_vendor.index.__f__("log", "at pages/login/index.vue:76", "检测到已登录，自动跳转到首页");
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 300);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:87", "检查登录状态失败", e);
      }
    },
    /**
     * 微信授权登录主流程
     * 流程说明：
     * 1. 调用 uni.getUserProfile 获取用户信息（昵称、头像）- 必须由用户点击直接触发
     * 2. 调用 wx.login 获取临时登录凭证 code
     * 3. 将 code 和用户信息发送到后端服务器
     * 4. 后端验证后返回 session_key 和 openid
     * 5. 前端保存登录状态和用户信息
     */
    async handleWxLogin() {
      this.isLoading = true;
      try {
        const userProfile = await this.getUserProfile();
        common_vendor.index.__f__("log", "at pages/login/index.vue:106", "获取到用户信息:", userProfile);
        const loginCode = await this.getWxLoginCode();
        common_vendor.index.__f__("log", "at pages/login/index.vue:110", "获取到登录凭证 code:", loginCode);
        const loginResult = await this.sendLoginToBackend(loginCode, userProfile);
        common_vendor.index.__f__("log", "at pages/login/index.vue:114", "后端验证结果:", loginResult);
        this.userInfo = {
          nickName: userProfile.nickName,
          avatarUrl: userProfile.avatarUrl
        };
        const loginInfo = {
          isLoggedIn: true,
          userInfo: this.userInfo,
          token: loginResult.token || "",
          // 后端返回的 token
          openid: loginResult.openid || "",
          // 后端返回的 openid
          sessionKey: loginResult.session_key || "",
          // 后端返回的 session_key
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
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:148", "登录失败", e);
        common_vendor.index.showToast({
          title: e.errMsg || "登录失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * 调用微信 wx.login 接口获取临时登录凭证 code
     * @returns {Promise<string>} 返回 code字符串
     */
    getWxLoginCode() {
      return new Promise((resolve, reject) => {
        common_vendor.index.login({
          provider: "weixin",
          success: (res) => {
            if (res.code) {
              resolve(res.code);
            } else {
              reject(new Error("获取code失败"));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    /**
     * 获取用户信息（微信小程序）
     * @returns {Promise<Object>} 返回用户信息对象
     */
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
    /**
     * 将登录信息发送到后端服务器（使用封装好的API）
     * @param {string} code - 微信登录凭证
     * @param {Object} userInfo - 用户信息
     * @returns {Promise<Object>} 返回后端响应数据
     */
    async sendLoginToBackend(code, userInfo) {
      try {
        const result = await api_login.wxLogin(code, userInfo);
        return result;
      } catch (error) {
        throw error;
      }
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
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
