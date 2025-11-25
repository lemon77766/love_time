"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
const api_user = require("../../api/user.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      userInfo: {
        nickName: "",
        avatarUrl: "",
        displayName: "",
        displayAvatar: ""
      },
      useWechatNickname: true,
      customNickname: "",
      isLoading: false
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
    this.loadUserInfo();
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
    loadUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          this.useWechatNickname = !this.userInfo.displayName || this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? "" : this.userInfo.displayName;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/index.vue:161", "加载用户信息失败", error);
      }
    },
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
          common_vendor.index.__f__("error", "at pages/profile/index.vue:176", "选择图片失败", err);
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
        common_vendor.index.__f__("error", "at pages/profile/index.vue:195", "选择微信头像失败", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
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
          common_vendor.index.__f__("error", "at pages/profile/index.vue:216", "选择图片失败", err);
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
        common_vendor.index.__f__("error", "at pages/profile/index.vue:235", "上传自定义头像失败", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
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
          common_vendor.index.__f__("error", "at pages/profile/index.vue:256", "上传头像失败", uploadErr);
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
          common_vendor.index.__f__("error", "at pages/profile/index.vue:272", "上传头像失败", data);
          common_vendor.index.showToast({
            title: data.message || "上传失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/index.vue:279", "上传头像异常", error);
        common_vendor.index.showToast({
          title: "上传异常",
          icon: "none"
        });
      }
    },
    toggleUseWechatNickname() {
      this.useWechatNickname = !this.useWechatNickname;
      if (this.useWechatNickname) {
        this.customNickname = "";
      }
    },
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
          common_vendor.index.__f__("error", "at pages/profile/index.vue:338", "保存个人资料失败", response);
          common_vendor.index.showToast({
            title: (response == null ? void 0 : response.message) || "保存失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/index.vue:345", "保存个人资料异常", error);
        common_vendor.index.showToast({
          title: "保存异常，请重试",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    e: common_vendor.o((...args) => $options.selectWechatAvatar && $options.selectWechatAvatar(...args)),
    f: common_vendor.o((...args) => $options.uploadCustomAvatar && $options.uploadCustomAvatar(...args)),
    g: $data.useWechatNickname ? 1 : "",
    h: common_vendor.t($data.userInfo.nickName),
    i: common_vendor.o((...args) => $options.toggleUseWechatNickname && $options.toggleUseWechatNickname(...args)),
    j: !$data.useWechatNickname
  }, !$data.useWechatNickname ? {
    k: $data.customNickname,
    l: common_vendor.o(($event) => $data.customNickname = $event.detail.value),
    m: common_vendor.t($data.customNickname.length)
  } : {}, {
    n: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args)),
    o: $data.isLoading
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-201c0da5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/index.js.map
