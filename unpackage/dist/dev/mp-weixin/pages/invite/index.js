"use strict";
const common_vendor = require("../../common/vendor.js");
const api_couple = require("../../api/couple.js");
const utils_couple = require("../../utils/couple.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      // 邀请码相关
      inviteCode: "",
      expireAt: "",
      isGenerating: false,
      isSharing: false,
      // 接受邀请相关
      isInviteMode: false,
      // 是否为接受邀请模式
      creatorInfo: {},
      // 邀请方信息
      isAccepting: false,
      // 绑定状态
      isBound: false,
      partnerInfo: {},
      bindTime: ""
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    },
    expireTimeText() {
      if (!this.expireAt)
        return "";
      try {
        const date = new Date(this.expireAt);
        return date.toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (e) {
        return "";
      }
    },
    bindTimeText() {
      if (!this.bindTime)
        return "";
      try {
        const date = new Date(this.bindTime);
        return date.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      } catch (e) {
        return "";
      }
    }
  },
  onLoad(options) {
    this.getSystemInfo();
    if (options.code) {
      this.handleInviteCode(options.code);
    } else {
      this.checkCoupleStatus();
    }
  },
  onShow() {
    if (!this.isInviteMode) {
      this.checkCoupleStatus();
    }
  },
  // 微信分享配置
  onShareAppMessage() {
    if (!this.inviteCode) {
      return {
        title: "邀请你成为情侣",
        path: "/pages/invite/index"
      };
    }
    const userInfo = this.getCurrentUserInfo();
    return {
      title: `${userInfo.nickName || "我"} 邀请你成为情侣`,
      path: `/pages/invite/index?code=${this.inviteCode}`,
      imageUrl: "/static/invite-share.png"
      // 可以添加一个分享图片
    };
  },
  methods: {
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 54;
    },
    getCurrentUserInfo() {
      try {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        return loginInfo && loginInfo.userInfo ? loginInfo.userInfo : {};
      } catch (e) {
        return {};
      }
    },
    // 检查绑定状态
    async checkCoupleStatus() {
      var _a, _b;
      try {
        const localCoupleInfo = utils_couple.getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || {};
          this.bindTime = localCoupleInfo.bindTime || "";
          if (localCoupleInfo.inviteCode) {
            this.inviteCode = localCoupleInfo.inviteCode;
            this.expireAt = localCoupleInfo.inviteCodeExpire || "";
          }
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
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/invite/index.vue:255", "同步绑定状态失败", e);
          }
          return;
        }
        this.isBound = false;
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
          common_vendor.index.__f__("error", "at pages/invite/index.vue:280", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo() || {};
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/invite/index.vue:288", "检查绑定状态失败", e);
        this.isBound = utils_couple.isBound();
        if (this.isBound) {
          this.partnerInfo = utils_couple.getPartnerInfo() || {};
        }
      }
    },
    // 处理邀请码（从分享进入）
    async handleInviteCode(code) {
      this.isInviteMode = true;
      this.isAccepting = false;
      try {
        common_vendor.index.showLoading({ title: "验证中..." });
        const response = await api_couple.validateInviteCode(code);
        common_vendor.index.hideLoading();
        if (response && response.success && response.data) {
          this.creatorInfo = response.data.creator || {};
          this.inviteCode = code;
          this.expireAt = response.data.expireAt || "";
        } else {
          common_vendor.index.showModal({
            title: "提示",
            content: response.message || "邀请码无效或已过期",
            showCancel: false,
            success: () => {
              this.goBack();
            }
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/invite/index.vue:323", "验证邀请码失败", error);
        common_vendor.index.showModal({
          title: "错误",
          content: "验证邀请码失败，请检查网络连接",
          showCancel: false,
          success: () => {
            this.goBack();
          }
        });
      }
    },
    // 生成邀请码
    async generateInviteCode() {
      if (this.isBound) {
        common_vendor.index.showToast({ title: "您已经绑定了情侣关系", icon: "none" });
        return;
      }
      this.isGenerating = true;
      try {
        const response = await api_couple.createInviteCode();
        if (response && response.success && response.data) {
          this.inviteCode = response.data.inviteCode || "";
          this.expireAt = response.data.expireAt || "";
          utils_couple.saveCoupleInfo({
            isBound: false,
            coupleId: "",
            partnerId: "",
            partnerInfo: null,
            bindTime: "",
            role: "initiator",
            inviteCode: this.inviteCode,
            inviteCodeExpire: this.expireAt
          });
          common_vendor.index.showToast({ title: "邀请码生成成功", icon: "success" });
        } else {
          common_vendor.index.showToast({ title: response.message || "生成失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/invite/index.vue:368", "生成邀请码失败", error);
        common_vendor.index.showToast({ title: "生成失败，请重试", icon: "none" });
      } finally {
        this.isGenerating = false;
      }
    },
    // 重新生成邀请码
    async regenerateInviteCode() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要重新生成邀请码吗？旧的邀请码将失效。",
        success: (res) => {
          if (res.confirm) {
            this.generateInviteCode();
          }
        }
      });
    },
    // 复制邀请码
    copyInviteCode() {
      if (!this.inviteCode)
        return;
      common_vendor.index.setClipboardData({
        data: this.inviteCode,
        success: () => {
          common_vendor.index.showToast({ title: "已复制到剪贴板", icon: "success" });
        }
      });
    },
    // 分享邀请
    shareInvite() {
      common_vendor.index.showModal({
        title: "分享邀请",
        content: '请点击右上角"..."按钮，选择"转发"分享给好友',
        showCancel: false
      });
    },
    // 接受邀请
    async handleAccept() {
      var _a;
      if (!this.inviteCode) {
        common_vendor.index.showToast({ title: "邀请码无效", icon: "none" });
        return;
      }
      if (this.isBound) {
        common_vendor.index.showModal({
          title: "提示",
          content: "您已经绑定了情侣关系，无法接受新的邀请",
          showCancel: false
        });
        return;
      }
      this.isAccepting = true;
      try {
        const response = await api_couple.acceptInvite(this.inviteCode);
        if (response && response.success && response.data) {
          const coupleData = {
            isBound: true,
            coupleId: response.data.coupleId || "",
            partnerId: ((_a = response.data.partnerInfo) == null ? void 0 : _a.userId) || "",
            partnerInfo: response.data.partnerInfo || {},
            bindTime: response.data.bindTime || "",
            role: "accepter"
          };
          utils_couple.saveCoupleInfo(coupleData);
          common_vendor.index.showToast({
            title: "绑定成功！",
            icon: "success",
            duration: 2e3
          });
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/we/index"
            });
          }, 2e3);
        } else {
          common_vendor.index.showToast({
            title: response.message || "接受失败",
            icon: "none"
          });
          this.isAccepting = false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/invite/index.vue:475", "接受邀请失败", error);
        common_vendor.index.showToast({
          title: error.message || "接受失败，请重试",
          icon: "none"
        });
        this.isAccepting = false;
      }
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
              this.partnerInfo = {};
              this.bindTime = "";
              setTimeout(() => {
                this.checkCoupleStatus();
              }, 1500);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/invite/index.vue:515", "解绑失败", error);
              common_vendor.index.showToast({
                title: "解绑失败，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    },
    goBack() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.isInviteMode ? "接受邀请" : "邀请另一半"),
    d: $data.navBarHeight + "px",
    e: $data.isInviteMode
  }, $data.isInviteMode ? common_vendor.e({
    f: common_vendor.t($data.creatorInfo.nickName || "好友"),
    g: $data.creatorInfo.avatarUrl || "/static/zhuye/lanmei_boy.png",
    h: common_vendor.t($data.creatorInfo.nickName || "好友"),
    i: common_vendor.t($data.isAccepting ? "接受中..." : "接受邀请"),
    j: common_vendor.o((...args) => $options.handleAccept && $options.handleAccept(...args)),
    k: $data.isAccepting,
    l: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    m: $data.isAccepting
  }, $data.isAccepting ? {} : {}) : common_vendor.e({
    n: $data.isBound
  }, $data.isBound ? {
    o: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/zhuye/lanmei_boy.png",
    p: common_vendor.t($data.partnerInfo.displayName || $data.partnerInfo.nickName || "对方"),
    q: common_vendor.t($options.bindTimeText),
    r: common_vendor.o((...args) => $options.handleUnbind && $options.handleUnbind(...args))
  } : common_vendor.e({
    s: $data.inviteCode
  }, $data.inviteCode ? {
    t: common_vendor.t($data.inviteCode),
    v: common_vendor.o((...args) => $options.copyInviteCode && $options.copyInviteCode(...args)),
    w: common_vendor.t($options.expireTimeText)
  } : {}, {
    x: !$data.inviteCode
  }, !$data.inviteCode ? {
    y: common_vendor.t($data.isGenerating ? "生成中..." : "生成邀请码"),
    z: common_vendor.o((...args) => $options.generateInviteCode && $options.generateInviteCode(...args)),
    A: $data.isGenerating
  } : {
    B: common_vendor.t($data.isSharing ? "分享中..." : "分享给TA"),
    C: common_vendor.o((...args) => $options.shareInvite && $options.shareInvite(...args)),
    D: $data.isSharing
  }, {
    E: $data.inviteCode
  }, $data.inviteCode ? {
    F: common_vendor.o((...args) => $options.regenerateInviteCode && $options.regenerateInviteCode(...args)),
    G: $data.isGenerating
  } : {}, {
    H: $data.inviteCode
  }, $data.inviteCode ? {} : {})), {
    I: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/invite/index.js.map
