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
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:162", "加载用户信息失败", error);
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
          common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:180", "选择图片失败", err);
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
          common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:200", "选择图片失败", err);
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
        common_vendor.index.__f__("log", "at subPackages/record/pages/profile/edit.vue:214", "📤 [上传头像] 开始上传，文件路径:", filePath);
        if (!filePath) {
          throw new Error("未选择文件");
        }
        let token = common_vendor.index.getStorageSync("token");
        if (!token) {
          const loginInfo = common_vendor.index.getStorageSync("login_info");
          if (loginInfo && loginInfo.token) {
            token = loginInfo.token;
          } else if (loginInfo && loginInfo.data && loginInfo.data.token) {
            token = loginInfo.data.token;
          }
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/profile/edit.vue:233", "🔑 [上传头像] Token:", token ? `${token.substring(0, 20)}...` : "未找到");
        if (!token) {
          throw new Error("未找到登录凭证，请重新登录");
        }
        const uploadResult = await new Promise((resolve, reject) => {
          common_vendor.index.uploadFile({
            url: utils_config.config.baseURL + utils_config.config.API.USER.AVATAR_UPLOAD,
            filePath,
            name: "file",
            header: {
              "Authorization": `Bearer ${token}`
              // 确保使用Bearer前缀
            },
            success: (uploadRes) => {
              common_vendor.index.__f__("log", "at subPackages/record/pages/profile/edit.vue:250", "📥 [上传头像] 上传成功，响应:", uploadRes);
              resolve(uploadRes);
            },
            fail: (uploadErr) => {
              common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:254", "❌ [上传头像] 上传失败，错误:", uploadErr);
              reject(uploadErr);
            }
          });
        });
        if (uploadResult.statusCode !== 200) {
          throw new Error(`上传失败，服务器返回状态码: ${uploadResult.statusCode}`);
        }
        let data;
        try {
          data = JSON.parse(uploadResult.data);
          common_vendor.index.__f__("log", "at subPackages/record/pages/profile/edit.vue:269", "📥 [上传头像] 解析后的数据:", data);
        } catch (parseError) {
          common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:272", "❌ [上传头像] JSON解析失败，使用原始数据:", uploadResult.data);
          data = uploadResult.data;
        }
        let photoUrl = null;
        if (data && typeof data === "object") {
          if (data.code === 200 && data.imgUrl) {
            photoUrl = data.imgUrl;
          } else if (data.code === 200 && data.data && typeof data.data === "object" && data.data.imgUrl) {
            photoUrl = data.data.imgUrl;
          } else if (data.code === 200 && data.data && typeof data.data === "string" && data.data.includes("http")) {
            photoUrl = data.data;
          } else if (data.photoUrl) {
            photoUrl = data.photoUrl;
          } else if (data.url) {
            photoUrl = data.url;
          } else if (data.data && typeof data.data === "object" && data.data.photoUrl) {
            photoUrl = data.data.photoUrl;
          } else if (data.data && typeof data.data === "object" && data.data.url) {
            photoUrl = data.data.url;
          }
        } else if (typeof data === "string" && data.includes("http")) {
          photoUrl = data;
        }
        if (photoUrl) {
          this.tempAvatar = photoUrl;
          common_vendor.index.__f__("log", "at subPackages/record/pages/profile/edit.vue:316", "✅ [上传头像] 上传成功，图片URL:", photoUrl);
          this.$forceUpdate();
          const timestamp = (/* @__PURE__ */ new Date()).getTime();
          this.tempAvatar = photoUrl + "?t=" + timestamp;
          common_vendor.index.showToast({
            title: "上传成功",
            icon: "success"
          });
        } else {
          const errorMsg = data && typeof data === "object" ? data.message || data.msg || data.errorMessage || "上传失败" : "上传失败";
          throw new Error(errorMsg || "上传失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:337", "上传头像失败", error);
        const errorMessage = error.message || "上传失败";
        common_vendor.index.showToast({
          title: errorMessage,
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/profile/edit.vue:396", "保存用户资料失败", error);
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
    f: common_vendor.o([($event) => $data.tempNickname = $event.detail.value, (...args) => $options.onNicknameInput && $options.onNicknameInput(...args)]),
    g: $data.tempNickname,
    h: common_vendor.t($options.nicknameCharCount),
    i: common_vendor.t($data.isSaving ? "保存中..." : "保存资料"),
    j: $data.isSaving,
    k: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args)),
    l: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-22637ce8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/profile/edit.js.map
