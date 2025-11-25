"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
const utils_couple = require("../../utils/couple.js");
const api_couple = require("../../api/couple.js");
const api_user = require("../../api/user.js");
const utils_auth = require("../../utils/auth.js");
const CustomTabbar = () => "../../components/custom-tabbar/index.js";
const _sfc_main = {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
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
    if (utils_auth.isGuestUser()) {
      this.goToLogin();
      return;
    }
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    if (utils_auth.isGuestUser()) {
      this.goToLogin();
      return;
    }
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  methods: {
    // 跳转到登录页面
    goToLogin() {
      common_vendor.index.redirectTo({
        url: "/pages/login/index"
      });
    },
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
        common_vendor.index.__f__("error", "at pages/we/index.vue:330", "加载用户信息失败", error);
      }
    },
    // 切换个人资料设置展开/收起
    toggleProfileSettings() {
      this.showProfileSettings = !this.showProfileSettings;
    },
    // 加载情侣信息
    async loadCoupleInfo() {
      var _a, _b;
      if (utils_auth.isGuestUser()) {
        common_vendor.index.__f__("log", "at pages/we/index.vue:342", "游客用户，跳过加载情侣信息");
        this.isBound = false;
        this.partnerInfo = null;
        this.bindTime = "";
        return;
      }
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
            common_vendor.index.__f__("error", "at pages/we/index.vue:379", "同步绑定状态失败", e);
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
          } else {
            this.isBound = false;
            this.partnerInfo = null;
            this.bindTime = "";
            utils_couple.clearCoupleInfo();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:412", "查询情侣状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo();
            const coupleInfo = utils_couple.getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : "";
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:422", "加载情侣信息失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo();
        }
      }
    },
    // 选择微信头像
    async selectWechatAvatar() {
      if (this.isLoading)
        return;
      this.isLoading = true;
      try {
        const [err, res] = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (err) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:444", "选择图片失败", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
          return;
        }
        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) {
          common_vendor.index.showToast({
            title: "未选择图片",
            icon: "none"
          });
          return;
        }
        await this.uploadAvatar(tempFilePath);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:464", "选择微信头像失败", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 上传自定义头像
    async uploadCustomAvatar() {
      if (this.isLoading)
        return;
      this.isLoading = true;
      try {
        const [err, res] = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album"]
        });
        if (err) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:488", "选择图片失败", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
          return;
        }
        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) {
          common_vendor.index.showToast({
            title: "未选择图片",
            icon: "none"
          });
          return;
        }
        await this.uploadAvatar(tempFilePath);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:508", "上传自定义头像失败", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 上传头像到服务器
    async uploadAvatar(filePath) {
      try {
        const [uploadErr, uploadRes] = await common_vendor.index.uploadFile({
          url: utils_config.config.API.USER.UPLOAD_AVATAR,
          filePath,
          name: "file",
          header: {
            "Authorization": utils_http.http.getAuthToken()
          }
        });
        if (uploadErr) {
          common_vendor.index.__f__("error", "at pages/we/index.vue:532", "上传头像失败", uploadErr);
          common_vendor.index.showToast({
            title: "上传失败",
            icon: "none"
          });
          return;
        }
        const data = JSON.parse(uploadRes.data);
        if (data.code === 200 && data.data) {
          this.userInfo.displayAvatar = data.data.url;
          common_vendor.index.showToast({
            title: "上传成功",
            icon: "success"
          });
        } else {
          common_vendor.index.__f__("error", "at pages/we/index.vue:549", "上传头像失败", data);
          common_vendor.index.showToast({
            title: data.message || "上传失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:556", "上传头像异常", error);
        common_vendor.index.showToast({
          title: "上传异常",
          icon: "none"
        });
      }
    },
    // 切换使用微信昵称
    toggleUseWechatNickname() {
      this.useWechatNickname = !this.useWechatNickname;
      if (this.useWechatNickname) {
        this.customNickname = "";
      }
    },
    // 保存个人资料
    async saveProfile() {
      if (this.isLoading)
        return;
      if (!this.useWechatNickname && !this.customNickname.trim()) {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      this.isLoading = true;
      try {
        const updateData = {};
        if (this.useWechatNickname) {
          updateData.displayName = this.userInfo.nickName;
        } else {
          updateData.displayName = this.customNickname.trim();
        }
        if (this.userInfo.displayAvatar && this.userInfo.displayAvatar !== this.userInfo.avatarUrl) {
          updateData.displayAvatar = this.userInfo.displayAvatar;
        }
        const response = await api_user.updateUserProfile(updateData);
        if (response && response.code === 200) {
          const loginInfo = common_vendor.index.getStorageSync("login_info");
          if (loginInfo && loginInfo.userInfo) {
            loginInfo.userInfo.displayName = updateData.displayName;
            if (updateData.displayAvatar) {
              loginInfo.userInfo.displayAvatar = updateData.displayAvatar;
            }
            common_vendor.index.setStorageSync("login_info", loginInfo);
          }
          this.userInfo.displayName = updateData.displayName;
          if (updateData.displayAvatar) {
            this.userInfo.displayAvatar = updateData.displayAvatar;
          }
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
        } else {
          common_vendor.index.__f__("error", "at pages/we/index.vue:627", "保存个人资料失败", response);
          common_vendor.index.showToast({
            title: (response == null ? void 0 : response.message) || "保存失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/we/index.vue:634", "保存个人资料异常", error);
        common_vendor.index.showToast({
          title: "保存异常，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 处理设置项点击
    handleSetting(type) {
      switch (type) {
        case "notification":
          common_vendor.index.__f__("log", "at pages/we/index.vue:648", "跳转到通知设置");
          break;
        case "privacy":
          common_vendor.index.__f__("log", "at pages/we/index.vue:651", "跳转到隐私设置");
          break;
        case "sync":
          common_vendor.index.__f__("log", "at pages/we/index.vue:654", "跳转到云同步");
          break;
        default:
          common_vendor.index.__f__("warn", "at pages/we/index.vue:657", "未知设置项:", type);
      }
    },
    // 解除关系
    async handleUnbind() {
      common_vendor.index.showModal({
        title: "确认解除关系",
        content: "解除关系后，你们将不再是情侣关系，相关数据也会被删除。是否确认解除？",
        confirmColor: "#FF6B6B",
        success: async (res) => {
          if (res.confirm) {
            try {
              const response = await api_couple.unbindCouple();
              if (response && response.code === 200) {
                utils_couple.clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = "";
                common_vendor.index.showToast({
                  title: "解除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.switchTab({
                    url: "/pages/index/index"
                  });
                }, 1500);
              } else {
                common_vendor.index.__f__("error", "at pages/we/index.vue:692", "解除关系失败", response);
                common_vendor.index.showToast({
                  title: (response == null ? void 0 : response.message) || "解除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/we/index.vue:699", "解除关系异常", error);
              common_vendor.index.showToast({
                title: "操作异常，请重试",
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
    h: common_vendor.o((...args) => _ctx.goToEdit && _ctx.goToEdit(...args)),
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
