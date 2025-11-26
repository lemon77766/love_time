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
      agreedToPrivacy: false,
      // 是否同意隐私协议
      showUserAgreementModal: false,
      // 显示用户协议弹窗
      showPrivacyPolicyModal: false,
      // 显示隐私政策弹窗
      userInfo: {
        nickName: "",
        avatarUrl: ""
      },
      userAgreementContent: `
        <h3>用户服务协议</h3>
        <p>欢迎使用"恋与时光册"小程序（以下简称"本应用"）。在您使用本应用之前，请仔细阅读以下条款。</p>
        
        <h4>一、服务条款的确认和接纳</h4>
        <p>本应用各项服务的所有权和运作权归开发者所有。用户在使用本应用时，必须遵守以下服务条款。</p>
        
        <h4>二、服务说明</h4>
        <p>本应用为情侣用户提供记录和分享美好时光的服务，包括但不限于：</p>
        <ul>
          <li>记录恋爱轨迹</li>
          <li>恋与问答互动</li>
          <li>未来情书功能</li>
          <li>爱心照片墙</li>
          <li>一百件小事挑战</li>
        </ul>
        
        <h4>三、用户行为规范</h4>
        <p>用户在使用本服务时，应遵守相关法律法规，不得：</p>
        <ul>
          <li>上传违法内容</li>
          <li>侵犯他人合法权益</li>
          <li>进行任何危害网络安全的行为</li>
        </ul>
        
        <h4>四、知识产权</h4>
        <p>本应用的所有内容，包括但不限于文字、图片、音频、视频等，均受知识产权法律法规保护。</p>
        
        <h4>五、免责声明</h4>
        <p>本应用仅提供平台服务，不对用户间的行为承担责任。</p>
        
        <h4>六、协议修改</h4>
        <p>开发者有权在必要时修改服务条款，修改后的条款一经公布即生效。</p>
        
        <h4>七、其他</h4>
        <p>本协议的解释权归开发者所有。</p>
      `,
      privacyPolicyContent: `
        <h3>隐私政策</h3>
        <p>本应用尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更有个性化的服务，"恋与时光册"小程序（以下简称"本应用"）会按照本隐私权政策的规定使用和披露您的个人信息。</p>
        
        <h4>一、收集的信息</h4>
        <p>为提供服务，我们可能收集以下信息：</p>
        <ul>
          <li>您提供的昵称、头像等基本信息</li>
          <li>您在使用过程中产生的位置信息</li>
          <li>您上传的照片、文字等内容</li>
          <li>设备信息（如设备型号、操作系统版本等）</li>
        </ul>
        
        <h4>二、信息的使用</h4>
        <p>我们收集的信息将用于：</p>
        <ul>
          <li>提供、维护和改善我们的服务</li>
          <li>开发新的服务</li>
          <li>向您发送相关通知</li>
        </ul>
        
        <h4>三、信息的保护</h4>
        <p>我们采取合理的安全措施保护您的个人信息，防止数据丢失、误用、未经授权的访问。</p>
        
        <h4>四、信息的共享</h4>
        <p>未经您同意，我们不会与任何无关第三方共享您的个人信息，除非：</p>
        <ul>
          <li>获得您的明确同意</li>
          <li>根据法律法规或政府主管部门的要求</li>
          <li>为维护社会公共利益</li>
        </ul>
        
        <h4>五、Cookie的使用</h4>
        <p>为提供更好的服务，我们可能使用Cookie来记录您的偏好设置。</p>
        
        <h4>六、未成年人隐私保护</h4>
        <p>我们非常重视对未成年人个人信息的保护。若您是18周岁以下的未成年人，在使用我们的产品和服务前，应请您的监护人仔细阅读本隐私政策。</p>
        
        <h4>七、隐私政策的更新</h4>
        <p>我们可能会适时对本隐私政策进行更新，更新后的隐私政策一旦公布即生效。</p>
        
        <h4>八、联系我们</h4>
        <p>如果您对本隐私政策有任何疑问，可通过小程序内的反馈功能与我们联系。</p>
      `
    };
  },
  onLoad() {
    this.checkLoginStatus();
    this.loadUserInfo();
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:236", "加载用户信息失败", e);
      }
    },
    // 切换隐私协议同意状态
    togglePrivacyAgreement() {
      this.agreedToPrivacy = !this.agreedToPrivacy;
    },
    // 显示用户协议弹窗
    showUserAgreement() {
      this.showUserAgreementModal = true;
    },
    // 关闭用户协议弹窗
    closeUserAgreementModal() {
      this.showUserAgreementModal = false;
    },
    // 显示隐私政策弹窗
    showPrivacyPolicy() {
      this.showPrivacyPolicyModal = true;
    },
    // 关闭隐私政策弹窗
    closePrivacyPolicyModal() {
      this.showPrivacyPolicyModal = false;
    },
    // 浏览功能
    browseFeatures() {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    },
    // 检查登录状态
    checkLoginStatus() {
      var _a;
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        const hasToken = loginInfo && (loginInfo.token && loginInfo.token.trim() || ((_a = loginInfo.data) == null ? void 0 : _a.token) && loginInfo.data.token.trim() || loginInfo.accessToken && loginInfo.accessToken.trim());
        if (loginInfo && loginInfo.isLoggedIn && hasToken && !loginInfo.isGuest) {
          common_vendor.index.__f__("log", "at pages/login/index.vue:287", "检测到本地登录信息，自动跳转到首页");
          common_vendor.index.__f__("log", "at pages/login/index.vue:288", "⚠️ 提示：如果token已过期，将在后续请求时自动处理");
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 300);
        } else if (loginInfo && loginInfo.isLoggedIn && !hasToken) {
          common_vendor.index.__f__("warn", "at pages/login/index.vue:300", "⚠️ 检测到无效的登录信息（缺少token），正在清除...");
          common_vendor.index.removeStorageSync("login_info");
          this.isLoggedIn = false;
          this.userInfo = {};
          common_vendor.index.__f__("warn", "at pages/login/index.vue:304", "✅ 已清除无效的登录信息，请重新登录");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:307", "检查登录状态失败", e);
      }
    },
    /**
     * 游客登录处理
     * 无需授权，直接使用默认用户信息进入应用
     */
    handleGuestLogin() {
      if (!this.agreedToPrivacy) {
        common_vendor.index.showToast({
          title: "请先阅读并同意用户协议和隐私政策",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const guestUserInfo = {
        nickName: "游客用户",
        avatarUrl: "/static/zhuye/smile.png",
        displayName: "游客用户",
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
        common_vendor.index.__f__("error", "at pages/login/index.vue:358", "游客登录失败", error);
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
      if (!this.agreedToPrivacy) {
        common_vendor.index.showToast({
          title: "请先阅读并同意用户协议和隐私政策",
          icon: "none",
          duration: 2e3
        });
        return;
      }
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
            userInfo: userProfile.userInfo
          });
        } catch (apiError) {
          common_vendor.index.__f__("error", "at pages/login/index.vue:404", "调用登录API失败", apiError);
          loginResult = this.createMockLoginResult(code, userProfile.userInfo);
        }
        if (loginResult && (loginResult.code === 200 || loginResult.success)) {
          const userData = loginResult.data || loginResult.result || {};
          const userInfo = {
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl,
            displayName: userData.displayName || userProfile.userInfo.nickName,
            displayAvatar: userData.displayAvatar || userProfile.userInfo.avatarUrl,
            ...userData
          };
          const loginInfo = {
            isLoggedIn: true,
            userInfo,
            token: userData.token || userData.accessToken || "",
            loginTime: (/* @__PURE__ */ new Date()).toISOString(),
            isGuest: false
          };
          common_vendor.index.setStorageSync("login_info", loginInfo);
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success",
            duration: 1500
          });
          setTimeout(() => {
            this.enterApp();
          }, 1500);
        } else {
          common_vendor.index.__f__("error", "at pages/login/index.vue:447", "登录失败", loginResult);
          common_vendor.index.showToast({
            title: (loginResult == null ? void 0 : loginResult.message) || "登录失败，请重试",
            icon: "none",
            duration: 2e3
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:455", "微信登录失败", error);
        common_vendor.index.showToast({
          title: "登录异常，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 获取微信登录code
    getWxLoginCode() {
      return new Promise((resolve, reject) => {
        common_vendor.wx$1.login({
          success: (res) => {
            if (res.code) {
              resolve(res.code);
            } else {
              reject(new Error("获取微信登录code失败"));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    // 创建模拟登录结果（用于API调用失败时）
    createMockLoginResult(code, userInfo) {
      return {
        code: 200,
        success: true,
        message: "登录成功",
        data: {
          userId: "mock_" + Date.now(),
          token: "mock_token_" + Date.now(),
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          displayName: userInfo.nickName,
          displayAvatar: userInfo.avatarUrl
        }
      };
    },
    // 进入应用（跳转到首页）
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
    h: $data.isLoading,
    i: !$data.agreedToPrivacy ? 1 : ""
  } : {}, {
    j: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    k: common_vendor.o((...args) => $options.handleGuestLogin && $options.handleGuestLogin(...args)),
    l: !$data.agreedToPrivacy ? 1 : ""
  } : {}, {
    m: common_vendor.o((...args) => $options.browseFeatures && $options.browseFeatures(...args)),
    n: $data.agreedToPrivacy
  }, $data.agreedToPrivacy ? {} : {}, {
    o: $data.agreedToPrivacy ? 1 : "",
    p: common_vendor.o((...args) => $options.togglePrivacyAgreement && $options.togglePrivacyAgreement(...args)),
    q: common_vendor.o((...args) => $options.showUserAgreement && $options.showUserAgreement(...args)),
    r: common_vendor.o((...args) => $options.showPrivacyPolicy && $options.showPrivacyPolicy(...args)),
    s: $data.showUserAgreementModal
  }, $data.showUserAgreementModal ? {
    t: common_vendor.o((...args) => $options.closeUserAgreementModal && $options.closeUserAgreementModal(...args)),
    v: $data.userAgreementContent,
    w: common_vendor.o((...args) => $options.closeUserAgreementModal && $options.closeUserAgreementModal(...args))
  } : {}, {
    x: $data.showPrivacyPolicyModal
  }, $data.showPrivacyPolicyModal ? {
    y: common_vendor.o((...args) => $options.closePrivacyPolicyModal && $options.closePrivacyPolicyModal(...args)),
    z: $data.privacyPolicyContent,
    A: common_vendor.o((...args) => $options.closePrivacyPolicyModal && $options.closePrivacyPolicyModal(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
