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
      // 输入邀请码相关
      showInputCode: false,
      // 是否显示输入邀请码界面
      inputCode: "",
      // 输入的邀请码
      inputFocus: false,
      // 输入框是否聚焦
      isVerifying: false,
      // 是否正在验证邀请码
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
            if (response && response.data) {
              if (response.data.isBound) {
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
                common_vendor.index.__f__("log", "at pages/invite/index.vue:295", "⚠️ 服务器返回未绑定，清除本地状态");
                utils_couple.clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = {};
                this.bindTime = "";
              }
            }
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/invite/index.vue:303", "同步绑定状态失败", e);
          }
          return;
        }
        this.isBound = false;
        try {
          const response = await api_couple.getCoupleStatus();
          if (response && response.data) {
            if (response.data.isBound) {
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
              this.partnerInfo = {};
              this.bindTime = "";
              utils_couple.clearCoupleInfo();
            }
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/invite/index.vue:336", "查询绑定状态失败", e);
          this.isBound = utils_couple.isBound();
          if (this.isBound) {
            this.partnerInfo = utils_couple.getPartnerInfo() || {};
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/invite/index.vue:344", "检查绑定状态失败", e);
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
          const errorMsg = response.message || "邀请码无效或已过期";
          common_vendor.index.showModal({
            title: "验证失败",
            content: errorMsg + "\n\n可能原因：\n1. 邀请码不存在\n2. 邀请码已过期\n3. 邀请码已被使用\n\n请确认邀请码是否正确",
            showCancel: false,
            success: () => {
              this.goBack();
            }
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/invite/index.vue:381", "验证邀请码失败", error);
        let errorMessage = "验证邀请码失败，请检查网络连接";
        if (error.message) {
          if (error.message.includes("邀请码无效") || error.message.includes("无效")) {
            errorMessage = "邀请码无效\n\n可能原因：\n1. 邀请码不存在\n2. 邀请码已过期\n3. 邀请码已被使用\n\n请确认邀请码是否正确";
          } else {
            errorMessage = error.message || errorMessage;
          }
        }
        common_vendor.index.showModal({
          title: "错误",
          content: errorMessage,
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
        common_vendor.index.__f__("error", "at pages/invite/index.vue:437", "生成邀请码失败", error);
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
    // 显示输入邀请码面板
    showInputCodePanel() {
      this.showInputCode = true;
      this.inputCode = "";
      this.inputFocus = true;
    },
    // 取消输入邀请码
    cancelInputCode() {
      this.showInputCode = false;
      this.inputCode = "";
      this.inputFocus = false;
    },
    // 输入邀请码时的处理
    onInputCode(e) {
      this.inputCode = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    },
    // 验证输入的邀请码
    async verifyInputCode() {
      common_vendor.index.__f__("log", "at pages/invite/index.vue:501", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("log", "at pages/invite/index.vue:502", "🔍 [页面] 开始验证邀请码");
      common_vendor.index.__f__("log", "at pages/invite/index.vue:503", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("log", "at pages/invite/index.vue:504", "📝 [输入码原始值]", this.inputCode);
      common_vendor.index.__f__("log", "at pages/invite/index.vue:505", "📝 [输入码类型]", typeof this.inputCode);
      common_vendor.index.__f__("log", "at pages/invite/index.vue:506", "📝 [输入码长度]", this.inputCode ? this.inputCode.length : 0);
      common_vendor.index.__f__("log", "at pages/invite/index.vue:507", "📝 [输入码是否为空]", !this.inputCode);
      common_vendor.index.__f__("log", "at pages/invite/index.vue:508", "📝 [输入码trim后]", this.inputCode ? this.inputCode.trim() : "");
      common_vendor.index.__f__("log", "at pages/invite/index.vue:509", "📝 [输入码trim后长度]", this.inputCode ? this.inputCode.trim().length : 0);
      if (this.inputCode) {
        common_vendor.index.__f__("log", "at pages/invite/index.vue:511", "📝 [输入码字符编码]", Array.from(this.inputCode).map((c) => c.charCodeAt(0)).join(", "));
        common_vendor.index.__f__("log", "at pages/invite/index.vue:512", "📝 [输入码是否包含空格]", this.inputCode.includes(" "));
        common_vendor.index.__f__("log", "at pages/invite/index.vue:513", "📝 [输入码是否包含换行]", this.inputCode.includes("\n"));
        common_vendor.index.__f__("log", "at pages/invite/index.vue:514", "📝 [输入码是否包含制表符]", this.inputCode.includes("	"));
      }
      common_vendor.index.__f__("log", "at pages/invite/index.vue:516", "🔗 [是否已绑定]", this.isBound);
      common_vendor.index.__f__("log", "at pages/invite/index.vue:517", "⏰ [验证时间]", (/* @__PURE__ */ new Date()).toLocaleString());
      common_vendor.index.__f__("log", "at pages/invite/index.vue:518", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      if (!this.inputCode || this.inputCode.length !== 6) {
        common_vendor.index.__f__("warn", "at pages/invite/index.vue:521", "⚠️ [页面] 邀请码格式验证失败");
        common_vendor.index.__f__("warn", "at pages/invite/index.vue:522", "📝 [输入码]", this.inputCode);
        common_vendor.index.__f__("warn", "at pages/invite/index.vue:523", "📝 [输入码长度]", this.inputCode ? this.inputCode.length : 0);
        common_vendor.index.showToast({ title: "请输入6位邀请码", icon: "none" });
        return;
      }
      if (this.isBound) {
        common_vendor.index.__f__("warn", "at pages/invite/index.vue:530", "⚠️ [页面] 用户已绑定，无法接受新邀请");
        common_vendor.index.showModal({
          title: "提示",
          content: "您已经绑定了情侣关系，无法接受新的邀请",
          showCancel: false
        });
        return;
      }
      this.isVerifying = true;
      try {
        common_vendor.index.showLoading({ title: "验证中..." });
        common_vendor.index.__f__("log", "at pages/invite/index.vue:543", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:544", "📞 [页面] 调用 validateInviteCode API");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:545", "📝 [传递给API的邀请码]", this.inputCode);
        common_vendor.index.__f__("log", "at pages/invite/index.vue:546", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        const response = await api_couple.validateInviteCode(this.inputCode);
        common_vendor.index.__f__("log", "at pages/invite/index.vue:550", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:551", "✅ [页面] API调用成功");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:552", "📦 [API响应]", response);
        common_vendor.index.__f__("log", "at pages/invite/index.vue:553", "📦 [API响应类型]", typeof response);
        if (response && typeof response === "object") {
          common_vendor.index.__f__("log", "at pages/invite/index.vue:555", "📦 [API响应字段]", Object.keys(response).join(", "));
          common_vendor.index.__f__("log", "at pages/invite/index.vue:556", "📦 [success字段]", response.success);
          common_vendor.index.__f__("log", "at pages/invite/index.vue:557", "📦 [data字段]", response.data);
        }
        common_vendor.index.__f__("log", "at pages/invite/index.vue:559", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.hideLoading();
        if (response && response.success && response.data) {
          common_vendor.index.__f__("log", "at pages/invite/index.vue:564", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/invite/index.vue:565", "✅ [页面] 验证成功，处理响应数据");
          common_vendor.index.__f__("log", "at pages/invite/index.vue:566", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("log", "at pages/invite/index.vue:567", "👤 [创建者信息]", response.data.creator);
          common_vendor.index.__f__("log", "at pages/invite/index.vue:568", "📝 [邀请码]", response.data.code || this.inputCode);
          common_vendor.index.__f__("log", "at pages/invite/index.vue:569", "⏰ [过期时间]", response.data.expireAt);
          common_vendor.index.__f__("log", "at pages/invite/index.vue:570", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          this.creatorInfo = response.data.creator || {};
          this.inviteCode = this.inputCode;
          this.expireAt = response.data.expireAt || "";
          this.showInputCode = false;
          this.isInviteMode = true;
          this.inputCode = "";
          this.inputFocus = false;
          common_vendor.index.__f__("log", "at pages/invite/index.vue:581", "✅ [页面] 已切换到接受邀请模式");
        } else {
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:583", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:584", "⚠️ [页面] 验证失败：响应数据不符合预期");
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:585", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:586", "📦 [响应数据]", response);
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:587", "📦 [response是否存在]", !!response);
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:588", "📦 [response.success]", response == null ? void 0 : response.success);
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:589", "📦 [response.data]", response == null ? void 0 : response.data);
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:590", "📦 [response.message]", response == null ? void 0 : response.message);
          if (response && typeof response === "object") {
            common_vendor.index.__f__("warn", "at pages/invite/index.vue:592", "📦 [响应数据字段]", Object.keys(response).join(", "));
          }
          common_vendor.index.__f__("warn", "at pages/invite/index.vue:594", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          const errorMsg = (response == null ? void 0 : response.message) || "邀请码无效或已过期";
          common_vendor.index.showModal({
            title: "验证失败",
            content: errorMsg + "\n\n可能原因：\n1. 邀请码不存在\n2. 邀请码已过期\n3. 邀请码已被使用\n\n请确认邀请码是否正确（6位字母数字）",
            showCancel: false,
            confirmText: "我知道了"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/invite/index.vue:608", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("error", "at pages/invite/index.vue:609", "❌ [页面] 验证邀请码异常");
        common_vendor.index.__f__("error", "at pages/invite/index.vue:610", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("error", "at pages/invite/index.vue:611", "📝 [输入的邀请码]", this.inputCode);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:612", "📝 [邀请码类型]", typeof this.inputCode);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:613", "📝 [邀请码长度]", this.inputCode ? this.inputCode.length : 0);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:614", "🔍 [错误类型]", typeof error);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:615", "🔍 [错误消息]", error == null ? void 0 : error.message);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:616", "🔍 [错误状态码]", error == null ? void 0 : error.statusCode);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:617", "🔍 [错误数据]", error == null ? void 0 : error.data);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:618", "🔍 [错误响应数据]", error == null ? void 0 : error.responseData);
        common_vendor.index.__f__("error", "at pages/invite/index.vue:619", "🔍 [完整错误对象]", error);
        if (error && typeof error === "object") {
          common_vendor.index.__f__("error", "at pages/invite/index.vue:621", "🔍 [错误对象字段]", Object.keys(error).join(", "));
        }
        if (error == null ? void 0 : error.stack) {
          common_vendor.index.__f__("error", "at pages/invite/index.vue:624", "🔍 [错误堆栈]", error.stack);
        }
        common_vendor.index.__f__("error", "at pages/invite/index.vue:626", "⏰ [错误时间]", (/* @__PURE__ */ new Date()).toLocaleString());
        common_vendor.index.__f__("error", "at pages/invite/index.vue:627", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        let errorMessage = "验证失败，请重试";
        if (error && error.message) {
          errorMessage = error.message;
          if (error.message.includes("邀请码无效") || error.message.includes("无效")) {
            errorMessage = "邀请码无效，可能原因：\n1. 邀请码不存在\n2. 邀请码已过期\n3. 邀请码已被使用\n\n请确认邀请码是否正确";
          }
        }
        common_vendor.index.__f__("log", "at pages/invite/index.vue:639", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:640", "🔍 [页面错误处理] 准备显示错误提示");
        common_vendor.index.__f__("log", "at pages/invite/index.vue:641", "📝 [错误提示内容]", errorMessage);
        common_vendor.index.__f__("log", "at pages/invite/index.vue:642", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.showModal({
          title: "验证失败",
          content: errorMessage,
          showCancel: false,
          confirmText: "我知道了",
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/invite/index.vue:651", "✅ [页面错误处理] 错误提示已显示");
            common_vendor.index.__f__("log", "at pages/invite/index.vue:652", "📝 [用户选择]", res.confirm ? "确认" : "取消");
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/invite/index.vue:655", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at pages/invite/index.vue:656", "❌ [页面错误处理] 显示错误提示失败");
            common_vendor.index.__f__("error", "at pages/invite/index.vue:657", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at pages/invite/index.vue:658", "🔴 [失败原因]", err);
            common_vendor.index.__f__("error", "at pages/invite/index.vue:659", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.showToast({
              title: errorMessage.length > 20 ? errorMessage.substring(0, 20) + "..." : errorMessage,
              icon: "none",
              duration: 3e3,
              success: () => {
                common_vendor.index.__f__("log", "at pages/invite/index.vue:666", "✅ [页面错误处理] 已使用Toast显示错误");
              },
              fail: (toastErr) => {
                common_vendor.index.__f__("error", "at pages/invite/index.vue:669", "❌ [页面错误处理] Toast也失败:", toastErr);
              }
            });
          }
        });
      } finally {
        this.isVerifying = false;
      }
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
        common_vendor.index.__f__("error", "at pages/invite/index.vue:744", "接受邀请失败", error);
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
              common_vendor.index.__f__("error", "at pages/invite/index.vue:784", "解绑失败", error);
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
    g: $data.creatorInfo.avatarUrl || "/static/login/love.jpg",
    h: common_vendor.t($data.creatorInfo.nickName || "好友"),
    i: common_vendor.t($data.isAccepting ? "接受中..." : "接受邀请"),
    j: common_vendor.o((...args) => $options.handleAccept && $options.handleAccept(...args)),
    k: $data.isAccepting,
    l: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    m: $data.isAccepting
  }, $data.isAccepting ? {} : {}) : common_vendor.e({
    n: $data.isBound
  }, $data.isBound ? {
    o: $data.partnerInfo.displayAvatar || $data.partnerInfo.avatarUrl || "/static/login/love.jpg",
    p: common_vendor.t($data.partnerInfo.displayName || $data.partnerInfo.nickName || "对方"),
    q: common_vendor.t($options.bindTimeText),
    r: common_vendor.o((...args) => $options.handleUnbind && $options.handleUnbind(...args))
  } : common_vendor.e({
    s: $data.showInputCode
  }, $data.showInputCode ? {
    t: $data.inputFocus,
    v: common_vendor.o([($event) => $data.inputCode = $event.detail.value, (...args) => $options.onInputCode && $options.onInputCode(...args)]),
    w: $data.inputCode,
    x: common_vendor.t($data.isVerifying ? "验证中..." : "验证邀请码"),
    y: common_vendor.o((...args) => $options.verifyInputCode && $options.verifyInputCode(...args)),
    z: !$data.inputCode || $data.inputCode.length !== 6 || $data.isVerifying,
    A: common_vendor.o((...args) => $options.cancelInputCode && $options.cancelInputCode(...args))
  } : common_vendor.e({
    B: $data.inviteCode
  }, $data.inviteCode ? {
    C: common_vendor.t($data.inviteCode),
    D: common_vendor.o((...args) => $options.copyInviteCode && $options.copyInviteCode(...args)),
    E: common_vendor.t($options.expireTimeText)
  } : {}, {
    F: !$data.inviteCode
  }, !$data.inviteCode ? {
    G: common_vendor.t($data.isGenerating ? "生成中..." : "生成邀请码"),
    H: common_vendor.o((...args) => $options.generateInviteCode && $options.generateInviteCode(...args)),
    I: $data.isGenerating
  } : {
    J: common_vendor.t($data.isSharing ? "分享中..." : "分享给TA"),
    K: common_vendor.o((...args) => $options.shareInvite && $options.shareInvite(...args)),
    L: $data.isSharing
  }, {
    M: $data.inviteCode
  }, $data.inviteCode ? {
    N: common_vendor.o((...args) => $options.regenerateInviteCode && $options.regenerateInviteCode(...args)),
    O: $data.isGenerating
  } : {}, {
    P: common_vendor.o((...args) => $options.showInputCodePanel && $options.showInputCodePanel(...args)),
    Q: $data.inviteCode
  }, $data.inviteCode ? {} : {}))), {
    R: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/invite/index.js.map
