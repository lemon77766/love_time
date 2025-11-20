"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const api_user = require("../../api/user.js");
const CustomTabbar = () => "../../components/custom-tabbar/index.js";
const _sfc_main = {
  components: {
    CustomTabbar
  },
  data() {
    return {
      // 导航栏相关
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      userInfo: {
        nickName: "",
        avatarUrl: "",
        displayName: "",
        displayAvatar: ""
      },
      // 个人资料设置相关
      showProfileSettings: false,
      useWechatNickname: true,
      customNickname: "",
      isLoading: false,
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: "",
      // 成就数据
      achievements: [
        { icon: "🧁", name: "美食家", bgColor: "rgba(255, 217, 61, 0.2)" },
        { icon: "✈️", name: "旅行者", bgColor: "rgba(255, 158, 188, 0.2)" },
        { icon: "📅", name: "纪念日", bgColor: "rgba(217, 172, 255, 0.2)" }
      ]
    };
  },
  computed: {
    // 计算在一起的天数
    daysTogether() {
      if (!this.bindTime)
        return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = /* @__PURE__ */ new Date();
        const diffTime = now - bindDate;
        const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
      } catch (e) {
        return 0;
      }
    },
    // 计算容器顶部内边距
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  methods: {
    // 获取系统信息
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
      this.navBarHeight = 54;
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          this.useWechatNickname = !this.userInfo.displayName || this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? "" : this.userInfo.displayName;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:313", "加载用户信息失败", error);
      }
    },
    // 切换个人资料设置展开/收起
    toggleProfileSettings() {
      this.showProfileSettings = !this.showProfileSettings;
    },
    // 加载情侣信息
    async loadCoupleInfo() {
      var _a, _b;
      try {
        const localCoupleInfo = utils_couple.getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || null;
          this.bindTime = localCoupleInfo.bindTime || "";
          try {
            const response = await api_couple.getCoupleStatus();
            if (response && response.data && response.data.isBound) {
              utils_couple.saveCoupleInfo({
                isBound: true,
                coupleId: response.data.coupleId,
                partnerId: ((_a = response.data.partnerInfo) == null ? void 0 : _a.userId) || "",
                partnerInfo: response.data.partnerInfo || {},
                bindTime: response.data.bindTime || "",
                role: response.data.role || ""
              });
              this.partnerInfo = response.data.partnerInfo || {};
              this.bindTime = response.data.bindTime || "";
            } else {
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = "";
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/we/index.vue:353", "同步绑定状态失败", e);
          }
          return;
        }
        this.isBound = false;
        this.partnerInfo = null;
        try {
          const response = await api_couple.getCoupleStatus();
          if (response && response.data && response.data.isBound) {
            this.isBound = true;
            this.partnerInfo = response.data.partnerInfo || {};
            this.bindTime = response.data.bindTime || "";
            utils_couple.saveCoupleInfo({
              isBound: true,
              coupleId: response.data.coupleId,
              partnerId: ((_b = response.data.partnerInfo) == null ? void 0 : _b.userId) || "",
              partnerInfo: response.data.partnerInfo || {},
              bindTime: response.data.bindTime || "",
              role: response.data.role || ""
            });
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:380", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:390", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    // 跳转到编辑页面（个人资料）
    goToEdit() {
      this.showProfileSettings = true;
      setTimeout(() => {
        common_vendor.index.pageScrollTo({
          selector: ".account-section",
          duration: 300
        });
      }, 100);
    },
    // 使用微信头像
    selectWechatAvatar() {
      this.userInfo.displayAvatar = this.userInfo.avatarUrl;
      common_vendor.index.showToast({
        title: "已切换为微信头像",
        icon: "success",
        duration: 1500
      });
    },
    // 上传自定义头像
    uploadCustomAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          var _a;
          const originalFilePath = res.tempFilePaths[0];
          if (!originalFilePath) {
            common_vendor.index.__f__("error", "at pages/we/index.vue:430", "❌ [头像选择] 未获取到图片路径");
            common_vendor.index.showToast({
              title: "选择图片失败",
              icon: "none"
            });
            return;
          }
          common_vendor.index.__f__("log", "at pages/we/index.vue:438", "📸 [头像选择] 原始路径:", originalFilePath);
          let loadingShown = false;
          try {
            common_vendor.index.showLoading({
              title: "处理头像中...",
              mask: true
            });
            loadingShown = true;
            let imagePath = originalFilePath;
            try {
              common_vendor.index.__f__("log", "at pages/we/index.vue:451", "🔄 [头像选择] 开始压缩图片，路径:", originalFilePath);
              const compressedPath = await this.compressImage(originalFilePath);
              if (compressedPath && compressedPath.trim() !== "" && compressedPath !== originalFilePath) {
                common_vendor.index.__f__("log", "at pages/we/index.vue:456", "✅ [头像选择] 压缩成功，新路径:", compressedPath);
                imagePath = compressedPath;
              } else {
                common_vendor.index.__f__("log", "at pages/we/index.vue:459", "ℹ️ [头像选择] 压缩后路径相同或无效，使用原图");
                imagePath = originalFilePath;
              }
            } catch (compressError) {
              common_vendor.index.__f__("warn", "at pages/we/index.vue:463", "⚠️ [头像选择] 图片压缩失败，使用原图", compressError);
              imagePath = originalFilePath;
            }
            let avatarUrl = originalFilePath;
            try {
              common_vendor.index.__f__("log", "at pages/we/index.vue:470", "📤 [头像选择] 开始上传，路径:", imagePath);
              const uploadResult = await utils_http.http.upload({
                url: utils_config.config.API.USER.AVATAR_UPLOAD,
                filePath: imagePath,
                name: "avatar",
                formData: { type: "avatar" }
              });
              avatarUrl = uploadResult.url || ((_a = uploadResult.data) == null ? void 0 : _a.url) || originalFilePath;
              common_vendor.index.__f__("log", "at pages/we/index.vue:480", "✅ [头像选择] 上传成功，服务器URL:", avatarUrl);
              this.userInfo.displayAvatar = avatarUrl;
              try {
                const currentNickName = this.useWechatNickname ? this.userInfo.nickName : this.customNickname || this.userInfo.displayName || this.userInfo.nickName;
                await api_user.updateUserProfile(currentNickName, avatarUrl);
                common_vendor.index.__f__("log", "at pages/we/index.vue:490", "✅ [头像选择] 头像已更新到后端数据库");
              } catch (updateError) {
                common_vendor.index.__f__("error", "at pages/we/index.vue:492", "❌ [头像选择] 更新头像到后端数据库失败:", updateError);
              }
              const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
              if (loginInfo.userInfo) {
                loginInfo.userInfo.displayAvatar = avatarUrl;
                loginInfo.userInfo.avatarUrl = avatarUrl;
                common_vendor.index.setStorageSync("login_info", loginInfo);
              }
              common_vendor.index.showToast({
                title: "头像上传成功",
                icon: "success",
                duration: 1500
              });
            } catch (uploadError) {
              common_vendor.index.__f__("warn", "at pages/we/index.vue:512", "⚠️ [头像选择] 头像上传失败，使用本地图片", uploadError);
              this.userInfo.displayAvatar = originalFilePath;
              const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
              if (loginInfo.userInfo) {
                loginInfo.userInfo.displayAvatar = originalFilePath;
                common_vendor.index.setStorageSync("login_info", loginInfo);
              }
              common_vendor.index.showToast({
                title: "头像已选择（未上传）",
                icon: "none",
                duration: 1500
              });
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/we/index.vue:530", "❌ [头像选择] 处理头像失败", error);
            common_vendor.index.showToast({
              title: "头像处理失败",
              icon: "none"
            });
          } finally {
            if (loadingShown) {
              common_vendor.index.hideLoading();
            }
          }
        },
        fail: (err) => {
          if (err && err.errMsg && !err.errMsg.includes("cancel")) {
            common_vendor.index.__f__("error", "at pages/we/index.vue:543", "选择图片失败", err);
            common_vendor.index.showToast({
              title: "选择图片失败",
              icon: "none"
            });
          }
        }
      });
    },
    // 压缩图片
    compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        common_vendor.index.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at pages/we/index.vue:563", "图片压缩失败，使用原图", error);
            resolve(tempFilePath);
          }
        });
      });
    },
    // 切换是否使用微信昵称
    toggleUseWechatNickname() {
      this.useWechatNickname = !this.useWechatNickname;
      if (this.useWechatNickname) {
        this.customNickname = "";
      }
    },
    // 保存个人资料
    async saveProfile() {
      if (!this.useWechatNickname && !this.customNickname.trim()) {
        common_vendor.index.showToast({
          title: "请输入自定义昵称",
          icon: "none"
        });
        return;
      }
      this.isLoading = true;
      try {
        const displayName = this.useWechatNickname ? this.userInfo.nickName : this.customNickname.trim();
        const displayAvatar = this.userInfo.displayAvatar || this.userInfo.avatarUrl;
        try {
          await api_user.updateUserProfile(displayName, displayAvatar);
          common_vendor.index.__f__("log", "at pages/we/index.vue:602", "✅ 用户资料已更新到后端");
        } catch (apiError) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:604", "❌ 更新用户资料到后端失败:", apiError);
          common_vendor.index.showToast({
            title: "后端更新失败，已保存到本地",
            icon: "none",
            duration: 2e3
          });
        }
        const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
        loginInfo.userInfo = {
          ...loginInfo.userInfo,
          displayName,
          displayAvatar,
          nickName: displayName,
          // 同时更新nickName字段，确保后端和本地一致
          avatarUrl: displayAvatar,
          // 同时更新avatarUrl字段
          originalNickName: this.userInfo.nickName,
          originalAvatarUrl: this.userInfo.avatarUrl
        };
        common_vendor.index.setStorageSync("login_info", loginInfo);
        this.userInfo = { ...loginInfo.userInfo };
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:637", "保存失败", error);
        common_vendor.index.showToast({
          title: "保存失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 处理设置项点击
    handleSetting(key) {
      const settingMap = {
        notification: "通知设置",
        privacy: "隐私设置",
        sync: "云同步"
      };
      common_vendor.index.showToast({
        title: settingMap[key] + "（待开发）",
        icon: "none"
      });
    },
    // 解绑关系
    async handleUnbind() {
      common_vendor.index.showModal({
        title: "确认解绑",
        content: "解除关系后，双方将无法共享数据。确定要解除吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "解绑中..." });
              await api_couple.unbindCouple();
              common_vendor.index.hideLoading();
              utils_couple.clearCoupleInfo();
              common_vendor.index.showToast({
                title: "已解除关系",
                icon: "success"
              });
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = "";
              setTimeout(() => {
                this.loadCoupleInfo();
              }, 1500);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/we/index.vue:691", "解绑失败", error);
              common_vendor.index.showToast({
                title: error.message || "解绑失败，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_custom_tabbar = common_vendor.resolveComponent("custom-tabbar");
  _component_custom_tabbar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    d: common_vendor.t($data.userInfo.displayName || $data.userInfo.nickName || "用户"),
    e: $data.isBound && $data.bindTime
  }, $data.isBound && $data.bindTime ? {
    f: common_vendor.t($options.daysTogether)
  } : $data.isBound ? {} : {}, {
    g: $data.isBound,
    h: common_vendor.o((...args) => $options.goToEdit && $options.goToEdit(...args)),
    i: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    j: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    k: common_vendor.t($data.userInfo.displayName || $data.userInfo.nickName || "我"),
    l: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/login/love.jpg",
    m: common_vendor.t($data.partnerInfo.displayName || $data.partnerInfo.nickName || "另一半")
  } : {}, {
    n: common_vendor.f($data.achievements, (achievement, index, i0) => {
      return {
        a: common_vendor.t(achievement.icon),
        b: achievement.bgColor,
        c: common_vendor.t(achievement.name),
        d: index
      };
    }),
    o: common_vendor.o(($event) => $options.handleSetting("notification")),
    p: common_vendor.o(($event) => $options.handleSetting("privacy")),
    q: common_vendor.o(($event) => $options.handleSetting("sync")),
    r: $data.isBound && $data.partnerInfo
  }, $data.isBound && $data.partnerInfo ? {
    s: common_vendor.o((...args) => $options.handleUnbind && $options.handleUnbind(...args))
  } : {}, {
    t: $data.showProfileSettings ? 1 : "",
    v: common_vendor.o((...args) => $options.toggleProfileSettings && $options.toggleProfileSettings(...args)),
    w: $data.showProfileSettings
  }, $data.showProfileSettings ? common_vendor.e({
    x: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    y: common_vendor.o((...args) => $options.selectWechatAvatar && $options.selectWechatAvatar(...args)),
    z: common_vendor.o((...args) => $options.uploadCustomAvatar && $options.uploadCustomAvatar(...args)),
    A: $data.useWechatNickname ? 1 : "",
    B: common_vendor.t($data.userInfo.nickName),
    C: common_vendor.o((...args) => $options.toggleUseWechatNickname && $options.toggleUseWechatNickname(...args)),
    D: !$data.useWechatNickname
  }, !$data.useWechatNickname ? {
    E: $data.customNickname,
    F: common_vendor.o(($event) => $data.customNickname = $event.detail.value),
    G: common_vendor.t($data.customNickname.length)
  } : {}, {
    H: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args)),
    I: $data.isLoading
  }) : {}, {
    J: common_vendor.p({
      current: 2
    }),
    K: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-5f4b3cd0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/we/index.js.map
