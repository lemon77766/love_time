"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_user = require("../../../../api/user.js");
const utils_auth = require("../../../../utils/auth.js");
const utils_config = require("../../../../utils/config.js");
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
      tempNickname: "",
      tempAvatar: "",
      isSaving: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + "rpx";
    },
    nicknameCharCount() {
      return this.tempNickname.length;
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
        const userInfoData = utils_auth.getUserInfo();
        if (userInfoData) {
          this.userInfo = { ...userInfoData };
          this.tempNickname = this.userInfo.displayName || this.userInfo.nickName || "";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:150", "加载用户信息失败", error);
      }
    },
    onNicknameInput(e) {
      this.tempNickname = e.detail.value;
    },
    chooseAvatar() {
      common_vendor.wx$1.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:168", "选择图片失败", err);
          this.chooseImageFallback();
        }
      });
    },
    chooseImageFallback() {
      common_vendor.index.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:188", "选择图片失败", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      });
    },
    async uploadAvatar(filePath) {
      common_vendor.index.showLoading({
        title: "上传中..."
      });
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          common_vendor.index.uploadFile({
            url: utils_config.config.baseURL + utils_config.config.API.USER.AVATAR_UPLOAD,
            filePath,
            name: "file",
            header: {
              "Authorization": common_vendor.index.getStorageSync("token") || ""
            },
            success: (uploadRes) => {
              resolve(uploadRes);
            },
            fail: (uploadErr) => {
              reject(uploadErr);
            }
          });
        });
        const data = JSON.parse(uploadResult.data);
        if (data.code === 200 && data.data) {
          this.tempAvatar = data.data;
          common_vendor.index.showToast({
            title: "上传成功",
            icon: "success"
          });
        } else {
          throw new Error(data.message || "上传失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:232", "上传头像失败", error);
        common_vendor.index.showToast({
          title: error.message || "上传失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    async saveProfile() {
      if (this.isSaving)
        return;
      if (!this.tempNickname.trim()) {
        common_vendor.index.showToast({
          title: "昵称不能为空",
          icon: "none"
        });
        return;
      }
      this.isSaving = true;
      try {
        const response = await api_user.updateUserProfile(
          this.tempNickname,
          this.tempAvatar || this.userInfo.displayAvatar || this.userInfo.avatarUrl
        );
        if (response && response.code === 200) {
          const updatedUserInfo = {
            ...this.userInfo,
            displayName: this.tempNickname,
            displayAvatar: this.tempAvatar || this.userInfo.displayAvatar || this.userInfo.avatarUrl
          };
          utils_auth.saveLoginInfo(updatedUserInfo);
          this.userInfo = updatedUserInfo;
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1e3);
        } else {
          throw new Error((response == null ? void 0 : response.message) || "保存失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:289", "保存用户资料失败", error);
        common_vendor.index.showToast({
          title: error.message || "保存失败",
          icon: "none"
        });
      } finally {
        this.isSaving = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.tempAvatar || $data.userInfo.displayAvatar || $data.userInfo.avatarUrl || "/static/login/love.jpg",
    e: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    f: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    g: common_vendor.o([($event) => $data.tempNickname = $event.detail.value, (...args) => $options.onNicknameInput && $options.onNicknameInput(...args)]),
    h: $data.tempNickname,
    i: common_vendor.t($options.nicknameCharCount),
    j: common_vendor.t($data.isSaving ? "保存中..." : "保存"),
    k: $data.isSaving,
    l: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args)),
    m: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-22637ce8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/profile/edit.js.map
