"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
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
  onLoad() {
    this.loadUserInfo();
  },
  methods: {
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
        common_vendor.index.__f__("error", "at pages/profile/index.vue:96", "加载用户信息失败", error);
      }
    },
    // 返回上一页（使用系统导航栏的返回按钮）
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
          const tempFilePath = res.tempFilePaths[0];
          try {
            common_vendor.index.showLoading({
              title: "处理头像中...",
              mask: true
            });
            const compressedImage = await this.compressImage(tempFilePath);
            try {
              const uploadResult = await utils_http.http.upload({
                url: utils_config.config.API.USER.AVATAR_UPLOAD,
                filePath: compressedImage,
                name: "avatar",
                formData: { type: "avatar" }
              });
              this.userInfo.displayAvatar = uploadResult.url || tempFilePath;
            } catch (uploadError) {
              common_vendor.index.__f__("warn", "at pages/profile/index.vue:141", "头像上传失败，使用本地图片", uploadError);
              this.userInfo.displayAvatar = tempFilePath;
            }
            common_vendor.index.showToast({
              title: "头像上传成功",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/profile/index.vue:152", "处理头像失败", error);
            common_vendor.index.showToast({
              title: "头像处理失败",
              icon: "none"
            });
          } finally {
            common_vendor.index.hideLoading();
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/profile/index.vue:162", "选择图片失败", err);
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
            common_vendor.index.__f__("warn", "at pages/profile/index.vue:177", "图片压缩失败，使用原图", error);
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
    saveProfile() {
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
        const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
        loginInfo.userInfo = {
          ...loginInfo.userInfo,
          displayName,
          displayAvatar,
          originalNickName: this.userInfo.nickName,
          originalAvatarUrl: this.userInfo.avatarUrl
        };
        common_vendor.index.setStorageSync("login_info", loginInfo);
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/profile/index.vue:237", "保存失败", error);
        common_vendor.index.showToast({
          title: "保存失败，请重试",
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
    a: $data.userInfo.displayAvatar || $data.userInfo.avatarUrl,
    b: common_vendor.o((...args) => $options.selectWechatAvatar && $options.selectWechatAvatar(...args)),
    c: common_vendor.o((...args) => $options.uploadCustomAvatar && $options.uploadCustomAvatar(...args)),
    d: $data.useWechatNickname ? 1 : "",
    e: common_vendor.t($data.userInfo.nickName),
    f: common_vendor.o((...args) => $options.toggleUseWechatNickname && $options.toggleUseWechatNickname(...args)),
    g: !$data.useWechatNickname
  }, !$data.useWechatNickname ? {
    h: $data.customNickname,
    i: common_vendor.o(($event) => $data.customNickname = $event.detail.value),
    j: common_vendor.t($data.customNickname.length)
  } : {}, {
    k: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-201c0da5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/index.js.map
