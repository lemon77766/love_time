<template>
  <view class="notification-settings-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 背景渐变 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">通知设置</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <view class="content">
      <!-- 消息通知 -->
      <view class="section message-notification-section">
        <text class="section-title">消息通知</text>
        <view class="settings-list">
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">接收新消息通知</text>
            </view>
            <switch :checked="messageNotification" @change="toggleMessageNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">声音提醒</text>
            </view>
            <switch :checked="soundNotification" @change="toggleSoundNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">震动提醒</text>
            </view>
            <switch :checked="vibrateNotification" @change="toggleVibrateNotification" color="#FFB6C1" />
          </view>
        </view>
      </view>

      <!-- 互动通知 -->
      <view class="section interaction-notification-section">
        <text class="section-title">互动通知</text>
        <view class="settings-list">
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">点赞通知</text>
            </view>
            <switch :checked="likeNotification" @change="toggleLikeNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">评论通知</text>
            </view>
            <switch :checked="commentNotification" @change="toggleCommentNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">关注通知</text>
            </view>
            <switch :checked="followNotification" @change="toggleFollowNotification" color="#FFB6C1" />
          </view>
        </view>
      </view>

      <!-- 系统通知 -->
      <view class="section system-notification-section">
        <text class="section-title">系统通知</text>
        <view class="settings-list">
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">活动通知</text>
            </view>
            <switch :checked="activityNotification" @change="toggleActivityNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">系统公告</text>
            </view>
            <switch :checked="announcementNotification" @change="toggleAnnouncementNotification" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">版本更新提醒</text>
            </view>
            <switch :checked="updateNotification" @change="toggleUpdateNotification" color="#FFB6C1" />
          </view>
        </view>
      </view>

      <!-- 免打扰设置 -->
      <view class="section dnd-section">
        <text class="section-title">免打扰设置</text>
        <view class="settings-list">
          <view class="setting-item" @click="setDNDTime">
            <view class="setting-left">
              <text class="setting-text">免打扰时段</text>
            </view>
            <text class="setting-status">{{ dndTime || '未设置' }}</text>
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">夜间免打扰</text>
            </view>
            <switch :checked="nightDND" @change="toggleNightDND" color="#FFB6C1" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
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
      dndTime: '',
      nightDND: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    }
  },
  onLoad() {
    this.getSystemInfo();
    // 初始化设置状态（实际项目中应从服务器获取）
    this.messageNotification = true;
    this.soundNotification = true;
    this.vibrateNotification = true;
    this.likeNotification = true;
    this.commentNotification = true;
    this.followNotification = true;
    this.activityNotification = true;
    this.announcementNotification = true;
    this.updateNotification = true;
    this.dndTime = '';
    this.nightDND = false;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      // #ifdef MP-WEIXIN
      try {
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
    },
    toggleMessageNotification(e) {
      this.messageNotification = e.target.value;
      uni.showToast({
        title: this.messageNotification ? '已开启消息通知' : '已关闭消息通知',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleSoundNotification(e) {
      this.soundNotification = e.target.value;
      uni.showToast({
        title: this.soundNotification ? '已开启声音提醒' : '已关闭声音提醒',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleVibrateNotification(e) {
      this.vibrateNotification = e.target.value;
      uni.showToast({
        title: this.vibrateNotification ? '已开启震动提醒' : '已关闭震动提醒',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleLikeNotification(e) {
      this.likeNotification = e.target.value;
      uni.showToast({
        title: this.likeNotification ? '已开启点赞通知' : '已关闭点赞通知',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleCommentNotification(e) {
      this.commentNotification = e.target.value;
      uni.showToast({
        title: this.commentNotification ? '已开启评论通知' : '已关闭评论通知',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleFollowNotification(e) {
      this.followNotification = e.target.value;
      uni.showToast({
        title: this.followNotification ? '已开启关注通知' : '已关闭关注通知',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleActivityNotification(e) {
      this.activityNotification = e.target.value;
      uni.showToast({
        title: this.activityNotification ? '已开启活动通知' : '已关闭活动通知',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleAnnouncementNotification(e) {
      this.announcementNotification = e.target.value;
      uni.showToast({
        title: this.announcementNotification ? '已开启系统公告' : '已关闭系统公告',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleUpdateNotification(e) {
      this.updateNotification = e.target.value;
      uni.showToast({
        title: this.updateNotification ? '已开启版本更新提醒' : '已关闭版本更新提醒',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    setDNDTime() {
      uni.showToast({
        title: '免打扰时段设置功能待开发',
        icon: 'none'
      });
    },
    toggleNightDND(e) {
      this.nightDND = e.target.value;
      uni.showToast({
        title: this.nightDND ? '已开启夜间免打扰' : '已关闭夜间免打扰',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    }
  }
};
</script>

<style lang="scss" scoped>
.notification-settings-page {
  background-color: #FFFAF4;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #FFFAF4;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

.status-bar {
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.title-text {
  font-size: 40rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 50rpx;
  font-weight: 600;
  color: #4A4A4A;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.3s;
}

.back-icon:active {
  opacity: 0.6;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内容区域 */
.content {
  padding: 15rpx;
  padding-top: calc(15rpx + 44px);
}

/* 区块样式 */
.section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #eee;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #eee;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.setting-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.setting-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.setting-status {
  font-size: 24rpx;
  color: #999;
}
</style>