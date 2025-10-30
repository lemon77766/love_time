"use strict";
const common_vendor = require("../../common/vendor.js");
const api_login = require("../../api/login.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      isLoading: false,
      showProfileModal: false,
      // 控制丢丢丢是否显示
      needAvatar: false,
      // 新增：是否需要获取头像
      userInfo: {
        nickName: "",
        avatarUrl: ""
      },
      profileData: {
        avatarType: "wechat",
        // 'wechat' 或 'custom'
        useWechatNickname: true,
        // 是否使用微信昵称
        customNickname: "",
        // 自定义昵称
        customAvatarUrl: ""
        // 自定义头像 URL
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
          common_vendor.index.__f__("log", "at pages/login/index.vue:166", "检测到已登录，自动跳转到首页");
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }, 300);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:177", "检查登录状态失败", e);
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
        const userProfile = await common_vendor.index.getUserProfile({
          desc: "用于完善用户资料"
        });
        this.needAvatar = true;
        const loginCode = await this.getWxLoginCode();
        this.userInfo = {
          nickName: userProfile.userInfo.nickName,
          avatarUrl: ""
          // 头像URL将在用户选择后更新
        };
        common_vendor.index.showToast({
          title: "请选择您的头像",
          icon: "none",
          duration: 2e3
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:219", "登录失败", e);
        common_vendor.index.showToast({
          title: e.errMsg || "登录失败，请重试",
          icon: "none"
        });
        this.isLoading = false;
      }
    },
    // 新增：处理头像选择回调
    async onChooseAvatar(e) {
      try {
        const { avatarUrl } = e.detail;
        this.userInfo.avatarUrl = avatarUrl;
        this.needAvatar = false;
        const loginCode = await this.getWxLoginCode();
        const loginResult = await this.sendLoginToBackend(loginCode, this.userInfo);
        const loginInfo = {
          isLoggedIn: true,
          userInfo: this.userInfo,
          token: loginResult.token || "",
          openid: loginResult.openid || "",
          sessionKey: loginResult.session_key || "",
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
          this.showProfileModal = true;
        }, 1500);
      } catch (e2) {
        common_vendor.index.__f__("error", "at pages/login/index.vue:267", "处理头像选择失败", e2);
        common_vendor.index.showToast({
          title: "头像设置失败，请重试",
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
    },
    // ========== 资料确认相关方法 ==========
    // 选择微信头像
    selectWechatAvatar() {
      this.profileData.avatarType = "wechat";
    },
    // 上传自定义头像
    uploadCustomAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.profileData.customAvatarUrl = tempFilePath;
          this.profileData.avatarType = "custom";
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/login/index.vue:377", "选择图片失败", err);
        }
      });
    },
    // 切换是否使用微信昵称
    toggleUseWechatNickname() {
      this.profileData.useWechatNickname = !this.profileData.useWechatNickname;
    },
    // 抽屼设置
    skipSetup() {
      this.showProfileModal = false;
      this.enterApp();
    },
    // 完成设置
    confirmProfile() {
      if (!this.profileData.useWechatNickname && !this.profileData.customNickname.trim()) {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      const displayName = this.profileData.useWechatNickname ? this.userInfo.nickName : this.profileData.customNickname;
      const displayAvatar = this.profileData.avatarType === "wechat" ? this.userInfo.avatarUrl : this.profileData.customAvatarUrl;
      const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
      loginInfo.userInfo = {
        ...loginInfo.userInfo,
        displayName,
        // 小程序中使用的昵称
        displayAvatar,
        // 小程序中使用的头像
        originalNickName: this.userInfo.nickName,
        // 原始微信昵称
        originalAvatarUrl: this.userInfo.avatarUrl
        // 原始微信头像
      };
      common_vendor.index.setStorageSync("login_info", loginInfo);
      this.showProfileModal = false;
      this.enterApp();
    },
    // 关闭modal
    closeModal() {
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
    i: $data.needAvatar
  }, $data.needAvatar ? {
    j: common_vendor.o((...args) => $options.onChooseAvatar && $options.onChooseAvatar(...args))
  } : {}, {
    k: $data.showProfileModal
  }, $data.showProfileModal ? common_vendor.e({
    l: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args)),
    m: $data.userInfo.avatarUrl,
    n: $data.profileData.avatarType === "wechat" ? 1 : "",
    o: common_vendor.o((...args) => $options.selectWechatAvatar && $options.selectWechatAvatar(...args)),
    p: $data.profileData.avatarType === "custom" ? 1 : "",
    q: common_vendor.o((...args) => $options.uploadCustomAvatar && $options.uploadCustomAvatar(...args)),
    r: $data.profileData.useWechatNickname ? 1 : "",
    s: common_vendor.t($data.userInfo.nickName),
    t: common_vendor.o((...args) => $options.toggleUseWechatNickname && $options.toggleUseWechatNickname(...args)),
    v: !$data.profileData.useWechatNickname
  }, !$data.profileData.useWechatNickname ? {
    w: $data.profileData.customNickname,
    x: common_vendor.o(($event) => $data.profileData.customNickname = $event.detail.value),
    y: common_vendor.t($data.profileData.customNickname.length)
  } : {}, {
    z: common_vendor.o((...args) => $options.skipSetup && $options.skipSetup(...args)),
    A: common_vendor.o((...args) => $options.confirmProfile && $options.confirmProfile(...args)),
    B: common_vendor.o(() => {
    }),
    C: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d08ef7d4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/index.js.map
