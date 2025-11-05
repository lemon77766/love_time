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
      var _a;
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        const hasToken = loginInfo && (loginInfo.token && loginInfo.token.trim() || ((_a = loginInfo.data) == null ? void 0 : _a.token) && loginInfo.data.token.trim() || loginInfo.accessToken && loginInfo.accessToken.trim());
        if (loginInfo && loginInfo.isLoggedIn && hasToken) {
          common_vendor.index.__f__("log", "at pages/login/index.vue:97", "检测到本地登录信息，自动跳转到首页");
          common_vendor.index.__f__("log", "at pages/login/index.vue:98", "⚠️ 提示：如果token已过期，将在后续请求时自动处理");
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 300);
        } else if (loginInfo && loginInfo.isLoggedIn && !hasToken) {
          common_vendor.index.__f__("warn", "at pages/login/index.vue:110", "⚠️ 检测到无效的登录信息（缺少token），正在清除...");
          common_vendor.index.removeStorageSync("login_info");
          this.isLoggedIn = false;
          this.userInfo = {};
          common_vendor.index.__f__("warn", "at pages/login/index.vue:114", "✅ 已清除无效的登录信息，请重新登录");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:117", "检查登录状态失败", e);
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
        common_vendor.index.__f__("error", "at pages/login/index.vue:159", "游客登录失败", error);
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
      var _a, _b, _c, _d;
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
          common_vendor.index.__f__("warn", "at pages/login/index.vue:196", "后端API调用失败，使用模拟登录", apiError);
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
        let responseData = loginResult;
        if (loginResult.data && typeof loginResult.data === "object") {
          responseData = loginResult.data;
        }
        const token = responseData.token || loginResult.token || ((_a = loginResult.data) == null ? void 0 : _a.token) || responseData.data && responseData.data.token || "";
        const openid = responseData.openid || loginResult.openid || ((_b = loginResult.data) == null ? void 0 : _b.openid) || responseData.data && responseData.data.openid || "";
        const sessionKey = responseData.session_key || loginResult.session_key || ((_c = loginResult.data) == null ? void 0 : _c.session_key) || responseData.data && responseData.data.session_key || "";
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
          common_vendor.index.__f__("log", "at pages/login/index.vue:266", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:267", "🔍 [登录响应分析]");
          common_vendor.index.__f__("log", "at pages/login/index.vue:268", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:269", "📦 原始响应数据:", loginResult);
          common_vendor.index.__f__("log", "at pages/login/index.vue:270", "📦 响应数据类型:", typeof loginResult);
          common_vendor.index.__f__("log", "at pages/login/index.vue:271", "📦 responseData:", responseData);
          common_vendor.index.__f__("log", "at pages/login/index.vue:272", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:273", "🔑 Token提取结果:");
          common_vendor.index.__f__("log", "at pages/login/index.vue:274", "   - responseData.token:", responseData.token || "未找到");
          common_vendor.index.__f__("log", "at pages/login/index.vue:275", "   - loginResult.token:", loginResult.token || "未找到");
          common_vendor.index.__f__("log", "at pages/login/index.vue:276", "   - loginResult.data?.token:", ((_d = loginResult.data) == null ? void 0 : _d.token) || "未找到");
          common_vendor.index.__f__("log", "at pages/login/index.vue:277", "   - 最终提取的Token:", token ? `✅ 已找到，长度: ${token.length}` : "❌ 未找到");
          common_vendor.index.__f__("log", "at pages/login/index.vue:278", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:279", "👤 OpenID提取结果:");
          common_vendor.index.__f__("log", "at pages/login/index.vue:280", "   - 最终提取的OpenID:", openid ? `✅ 已找到: ${openid}` : "❌ 未找到");
          common_vendor.index.__f__("log", "at pages/login/index.vue:281", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          if (!token) {
            common_vendor.index.__f__("error", "at pages/login/index.vue:283", "❌ Token提取失败！");
            common_vendor.index.__f__("error", "at pages/login/index.vue:284", "📋 完整响应结构:", JSON.stringify(loginResult, null, 2));
            common_vendor.index.__f__("error", "at pages/login/index.vue:285", "💡 提示: 请检查后端返回的数据结构是否符合预期");
          }
        }
        common_vendor.index.setStorageSync("login_info", loginInfo);
        this.userInfo = loginInfo.userInfo;
        this.isLoggedIn = true;
        const savedLoginInfo = common_vendor.index.getStorageSync("login_info");
        if (true) {
          common_vendor.index.__f__("log", "at pages/login/index.vue:296", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:297", "💾 [存储验证]");
          common_vendor.index.__f__("log", "at pages/login/index.vue:298", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/login/index.vue:299", "📦 保存后的登录信息:", savedLoginInfo);
          common_vendor.index.__f__("log", "at pages/login/index.vue:300", "🔑 保存后的Token:", (savedLoginInfo == null ? void 0 : savedLoginInfo.token) ? `✅ 已保存，长度: ${savedLoginInfo.token.length}` : "❌ 未保存");
          common_vendor.index.__f__("log", "at pages/login/index.vue:301", "👤 保存后的OpenID:", (savedLoginInfo == null ? void 0 : savedLoginInfo.openid) ? `✅ 已保存: ${savedLoginInfo.openid}` : "❌ 未保存");
          common_vendor.index.__f__("log", "at pages/login/index.vue:302", "🔐 保存后的SessionKey:", (savedLoginInfo == null ? void 0 : savedLoginInfo.sessionKey) ? `✅ 已保存，长度: ${savedLoginInfo.sessionKey.length}` : "❌ 未保存");
          common_vendor.index.__f__("log", "at pages/login/index.vue:303", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
        if (!token || !token.trim()) {
          common_vendor.index.__f__("error", "at pages/login/index.vue:308", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at pages/login/index.vue:309", "⚠️ [警告] Token为空！");
          common_vendor.index.__f__("error", "at pages/login/index.vue:310", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at pages/login/index.vue:311", "🔍 可能的原因:");
          common_vendor.index.__f__("error", "at pages/login/index.vue:312", "   1. 后端返回的数据结构中不包含token字段");
          common_vendor.index.__f__("error", "at pages/login/index.vue:313", "   2. 后端返回的token字段名为空字符串");
          common_vendor.index.__f__("error", "at pages/login/index.vue:314", "   3. 后端返回的数据结构不符合预期");
          common_vendor.index.__f__("error", "at pages/login/index.vue:315", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
        common_vendor.index.__f__("error", "at pages/login/index.vue:336", "微信登录失败", e);
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
