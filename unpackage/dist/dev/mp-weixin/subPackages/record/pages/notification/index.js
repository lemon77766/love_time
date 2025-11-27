"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      messageNotification: true,
      soundNotification: true,
      vibrateNotification: true,
      likeNotification: true,
      commentNotification: true,
      followNotification: true,
      activityNotification: true,
      announcementNotification: true,
      updateNotification: true,
      dndTime: "",
      nightDND: false
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
    this.messageNotification = true;
    this.soundNotification = true;
    this.vibrateNotification = true;
    this.likeNotification = true;
    this.commentNotification = true;
    this.followNotification = true;
    this.activityNotification = true;
    this.announcementNotification = true;
    this.updateNotification = true;
    this.dndTime = "";
    this.nightDND = false;
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
    toggleMessageNotification(e) {
      this.messageNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.messageNotification ? "已开启消息通知" : "已关闭消息通知",
        icon: "none"
      });
    },
    toggleSoundNotification(e) {
      this.soundNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.soundNotification ? "已开启声音提醒" : "已关闭声音提醒",
        icon: "none"
      });
    },
    toggleVibrateNotification(e) {
      this.vibrateNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.vibrateNotification ? "已开启震动提醒" : "已关闭震动提醒",
        icon: "none"
      });
    },
    toggleLikeNotification(e) {
      this.likeNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.likeNotification ? "已开启点赞通知" : "已关闭点赞通知",
        icon: "none"
      });
    },
    toggleCommentNotification(e) {
      this.commentNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.commentNotification ? "已开启评论通知" : "已关闭评论通知",
        icon: "none"
      });
    },
    toggleFollowNotification(e) {
      this.followNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.followNotification ? "已开启关注通知" : "已关闭关注通知",
        icon: "none"
      });
    },
    toggleActivityNotification(e) {
      this.activityNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.activityNotification ? "已开启活动通知" : "已关闭活动通知",
        icon: "none"
      });
    },
    toggleAnnouncementNotification(e) {
      this.announcementNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.announcementNotification ? "已开启系统公告" : "已关闭系统公告",
        icon: "none"
      });
    },
    toggleUpdateNotification(e) {
      this.updateNotification = e.target.value;
      common_vendor.index.showToast({
        title: this.updateNotification ? "已开启版本更新提醒" : "已关闭版本更新提醒",
        icon: "none"
      });
    },
    setDNDTime() {
      common_vendor.index.showToast({
        title: "免打扰时段设置功能待开发",
        icon: "none"
      });
    },
    toggleNightDND(e) {
      this.nightDND = e.target.value;
      common_vendor.index.showToast({
        title: this.nightDND ? "已开启夜间免打扰" : "已关闭夜间免打扰",
        icon: "none"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.messageNotification,
    e: common_vendor.o((...args) => $options.toggleMessageNotification && $options.toggleMessageNotification(...args)),
    f: $data.soundNotification,
    g: common_vendor.o((...args) => $options.toggleSoundNotification && $options.toggleSoundNotification(...args)),
    h: $data.vibrateNotification,
    i: common_vendor.o((...args) => $options.toggleVibrateNotification && $options.toggleVibrateNotification(...args)),
    j: $data.likeNotification,
    k: common_vendor.o((...args) => $options.toggleLikeNotification && $options.toggleLikeNotification(...args)),
    l: $data.commentNotification,
    m: common_vendor.o((...args) => $options.toggleCommentNotification && $options.toggleCommentNotification(...args)),
    n: $data.followNotification,
    o: common_vendor.o((...args) => $options.toggleFollowNotification && $options.toggleFollowNotification(...args)),
    p: $data.activityNotification,
    q: common_vendor.o((...args) => $options.toggleActivityNotification && $options.toggleActivityNotification(...args)),
    r: $data.announcementNotification,
    s: common_vendor.o((...args) => $options.toggleAnnouncementNotification && $options.toggleAnnouncementNotification(...args)),
    t: $data.updateNotification,
    v: common_vendor.o((...args) => $options.toggleUpdateNotification && $options.toggleUpdateNotification(...args)),
    w: common_vendor.t($data.dndTime || "未设置"),
    x: common_vendor.o((...args) => $options.setDNDTime && $options.setDNDTime(...args)),
    y: $data.nightDND,
    z: common_vendor.o((...args) => $options.toggleNightDND && $options.toggleNightDND(...args)),
    A: $options.containerPaddingTop
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cb8af9ca"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/notification/index.js.map
