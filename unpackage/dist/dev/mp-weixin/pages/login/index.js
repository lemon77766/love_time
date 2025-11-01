"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
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
          common_vendor.index.__f__("log", "at pages/login/index.vue:88", "检测到已登录，自动跳转到首页");
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 300);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:99", "检查登录状态失败", e);
      }
    },
    /**
     * 游客登录处理
     * 无需授权，直接使用默认用户信息进入应用
     */
    handleGuestLogin() {
      const guestUserInfo = {
        nickName: "游客用户",
        avatarUrl: "/static/zhuye/smile.png",
        displayName: "游客用户",
        displayAvatar: "/static/zhuye/smile.png",
        isGuest: true
      };
      const loginInfo = {
        isLoggedIn: true,
        userInfo: guestUserInfo,
        isGuest: true,
        // 标记为游客登录
        loginTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        common_vendor.index.setStorageSync("login_info", loginInfo);
        common_vendor.index.showToast({
          title: "游客登录成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          this.enterApp();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:141", "游客登录失败", error);
        common_vendor.index.showToast({
          title: "登录失败，请重试",
          icon: "none"
        });
      }
    },
    /**
     * 微信授权登录主流程
     * 流程说明：
     * 1. 调用 uni.getUserProfile 获取用户信息（昵称、头像）- 必须由用户点击直接触发
     * 2. 调用 wx.login 获取临时登录凭证 code
     * 3. 尝试调用后端登录API，如果失败则使用模拟登录
     * 4. 前端保存登录状态和用户信息
     * 5. 直接跳转到首页
     */
    async handleWxLogin() {
      this.isLoading = true;
      try {
        const userProfile = await common_vendor.index.getUserProfile({
          desc: "用于完善用户资料"
        });
        const code = await this.getWxLoginCode();
        let loginResult;
        try {
          loginResult = await utils_http.http.post(utils_config.config.API.LOGIN.WECHAT, {
            code,
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl
          });
        } catch (apiError) {
          common_vendor.index.__f__("warn", "at pages/login/index.vue:178", "后端API调用失败，使用模拟登录", apiError);
          loginResult = {
            token: "mock_token_" + Date.now(),
            openid: "mock_openid_" + Date.now(),
            session_key: "mock_session_" + Date.now(),
            success: true
          };
          common_vendor.index.showToast({
            title: "后端服务未就绪，使用模拟登录",
            icon: "none",
            duration: 2e3
          });
        }
        const responseData = loginResult.data || loginResult;
        const token = responseData.token || loginResult.token || "";
        const openid = responseData.openid || loginResult.openid || "";
        const sessionKey = responseData.session_key || loginResult.session_key || "";
        const isSuccess = loginResult.success !== false;
        const loginInfo = {
          isLoggedIn: true,
          token,
          openid,
          sessionKey,
          userInfo: {
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl,
            displayName: userProfile.userInfo.nickName,
            displayAvatar: userProfile.userInfo.avatarUrl
          },
          loginTime: (/* @__PURE__ */ new Date()).toISOString(),
          isMock: !isSuccess
          // 标记是否为模拟登录
        };
        if (true) {
          common_vendor.index.__f__("log", "at pages/login/index.vue:220", "登录响应数据:", loginResult);
          common_vendor.index.__f__("log", "at pages/login/index.vue:221", "提取的Token:", token ? `已找到，长度: ${token.length}` : "未找到");
          if (!token) {
            common_vendor.index.__f__("error", "at pages/login/index.vue:223", "❌ Token提取失败！响应结构:", JSON.stringify(loginResult, null, 2));
          }
        }
        common_vendor.index.setStorageSync("login_info", loginInfo);
        this.userInfo = loginInfo.userInfo;
        this.isLoggedIn = true;
        const savedLoginInfo = common_vendor.index.getStorageSync("login_info");
        if (true) {
          common_vendor.index.__f__("log", "at pages/login/index.vue:234", "保存后的登录信息:", savedLoginInfo);
          common_vendor.index.__f__("log", "at pages/login/index.vue:235", "保存后的Token:", (savedLoginInfo == null ? void 0 : savedLoginInfo.token) ? `✅ 已保存，长度: ${savedLoginInfo.token.length}` : "❌ 未保存");
        }
        if (!token || !token.trim()) {
          common_vendor.index.__f__("error", "at pages/login/index.vue:240", "⚠️ 警告：Token为空，登录可能失败！");
          common_vendor.index.showModal({
            title: "登录警告",
            content: "未获取到有效的登录凭证，部分功能可能无法使用。请检查后端服务是否正常。",
            showCancel: false
          });
        }
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          this.enterApp();
        }, 1500);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:261", "微信登录失败", e);
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
        const result = await wxLogin(code, userInfo);
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
  } : {}, {
    i: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    j: common_vendor.o((...args) => $options.handleGuestLogin && $options.handleGuestLogin(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
