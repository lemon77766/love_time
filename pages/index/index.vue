<template>
  <view class="container" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">甜蜜小屋</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 我们的纪念日卡片 -->
      <view class="card anniversary-card">
        <view class="card-header">
          <text class="card-title">我们的纪念日</text>
        </view>
        <view class="card-body">
          <view class="anniversary-content">
            <text class="anniversary-name">100天纪念日</text>
            <view class="anniversary-info">
              <view class="clock-icon">🕐</view>
              <text class="countdown-text">距离 {{ remainingDays }}天</text>
            </view>
            <text class="anniversary-date">{{ formattedAnniversaryDate }}</text>
          </view>
        </view>
      </view>

      <!-- 功能卡片网格 -->
      <view class="card grid-card">
        <view class="card-header">
          <text class="card-title">功能入口</text>
        </view>
        <view class="card-body grid-body">
          <view class="grid-container">
            <view class="grid-item" @click="goToSweetQA">
              <view class="grid-icon-wrapper">
                <image class="grid-icon-image" src="/static/zhuye/qna.png" mode="aspectFit"></image>
              </view>
              <text class="grid-text">甜蜜问答</text>
            </view>
            <view class="grid-item" @click="goToHundredThings">
              <view class="grid-icon-wrapper">
                <view class="grid-icon list-icon">
                  <view class="list-item-small"></view>
                  <view class="list-item-large"></view>
                </view>
              </view>
              <text class="grid-text">一百件事</text>
            </view>
            <view class="grid-item" @click="goToHeartWall">
              <view class="grid-icon-wrapper">
                <view class="grid-icon paper-icon">
                  <view class="paper-body"></view>
                  <view class="paper-fold"></view>
                </view>
              </view>
              <text class="grid-text">心形墙</text>
            </view>
            <view class="grid-item" @click="goToFutureLetter">
              <view class="grid-icon-wrapper">
                <view class="grid-icon envelope-icon">✉️</view>
              </view>
              <text class="grid-text">未来情书</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 心语心愿卡片 -->
      <view class="card wish-card">
        <view class="card-header">
          <text class="card-title">心语心愿</text>
        </view>
        <view class="card-body wish-body">
          <text class="wish-text">{{ wishText }}</text>
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
      navBarHeight: 54,
      remainingDays: 5,
      anniversaryDate: '2025-07-22', // 使用标准日期格式，兼容 iOS
      wishText: '这一刻的幸福足以支撑以后的漫长岁月',
      screenWidth: 375
    };
  },
  computed: {
    containerPaddingTop() {
      // 将px转换为rpx: rpx = px * 750 / screenWidth
      // 添加20rpx额外间距
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
    // 格式化日期显示（保持原有格式）
    formattedAnniversaryDate() {
      // 将 "2025-07-22" 格式转换为 "2025.07.22" 显示
      return this.anniversaryDate.replace(/-/g, '.');
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.calculateRemainingDays();
  },
  methods: {
    getSystemInfo() {

      // 使用新的 API 替代已弃用的 getSystemInfoSync
      // #ifdef MP-WEIXIN
      try {
        // 尝试使用新 API
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          // 降级到旧 API
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        // 如果新 API 不支持，降级到旧 API
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 54;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
    },
    calculateRemainingDays() {
      // 计算距离纪念日的天数
      // 确保日期格式兼容 iOS（支持 yyyy-MM-dd 或 yyyy/MM/dd）
      let dateStr = this.anniversaryDate;
      // 如果日期格式包含点号，转换为标准格式
      if (dateStr.includes('.')) {
        dateStr = dateStr.replace(/\./g, '-');
      }
      
      const targetDate = new Date(dateStr);
      // 检查日期是否有效
      if (isNaN(targetDate.getTime())) {
        console.error('日期格式无效:', this.anniversaryDate);
        this.remainingDays = 0;
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        this.remainingDays = diffDays;
      } else {
        this.remainingDays = 0;
      }
    },
    goToSweetQA() {
      // 跳转到甜蜜问答页面
      uni.navigateTo({
        url: '/pages/qna/index'
      });
    },
    goToHundredThings() {
      // 跳转到一百件事页面
      uni.navigateTo({
        url: '/pages/hundred/index'
      });
    },
    goToHeartWall() {
      // 跳转到心形墙页面
      uni.navigateTo({
        url: '/pages/heartwall/index'
      });
    },
    goToFutureLetter() {
      // 跳转到未来情书页面
      uni.navigateTo({
        url: '/pages/xinxiang/index'
      });
    }
  }
};
</script>

<style>
/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #F8F0FC;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: linear-gradient(180deg, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
  background: -webkit-linear-gradient(top, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
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
  font-size: 32rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-icon {
  font-size: 44rpx;
  color: #333333;
}

.container {
  background-color: #F8F0FC;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.content-area {
  padding: 30rpx 24rpx;
}

/* 卡片通用样式 */
.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.story-card {
  cursor: pointer;
}

.story-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 32rpx 30rpx 24rpx;
}

.card-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-body {
  padding: 0 30rpx 32rpx;
}

/* 我们的纪念日卡片 */
.anniversary-content {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.anniversary-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.anniversary-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.clock-icon {
  font-size: 30rpx;
}

.countdown-text {
  font-size: 26rpx;
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.anniversary-date {
  font-size: 24rpx;
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 心语心愿卡片 */
.wish-body {
  padding-top: 8rpx;
}

.wish-text {
  font-size: 26rpx;
  color: #9B8FB8;
  line-height: 1.9;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 功能卡片网格 */
.grid-body {
  padding: 20rpx 30rpx 32rpx;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 20rpx 32rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  border: 1rpx solid #F3E8FF;
  transition: all 0.2s ease;
  cursor: pointer;
}

.grid-item:active {
  transform: scale(0.96);
  background-color: #F8F0FC;
}

.grid-icon-wrapper {
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  position: relative;
}

/* 心形图标 */
.heart-icon-purple {
  color: #DCC7E1;
  font-size: 52rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(220, 199, 225, 0.3));
}

/* 图片图标 */
.grid-icon-image {
  width: 80rpx;
  height: 80rpx;
  display: block;
}

/* 列表图标（两个重叠矩形） */
.list-icon {
  position: relative;
  width: 64rpx;
  height: 64rpx;
}

.list-item-small {
  position: absolute;
  top: 6rpx;
  left: 10rpx;
  width: 48rpx;
  height: 34rpx;
  background: #DCC7E1;
  border-radius: 4rpx;
  box-shadow: 0 2rpx 4rpx rgba(220, 199, 225, 0.25);
  z-index: 2;
}

.list-item-large {
  position: absolute;
  top: 18rpx;
  left: 0;
  width: 54rpx;
  height: 38rpx;
  background: #D8B4FE;
  border-radius: 4rpx;
  box-shadow: 0 2rpx 4rpx rgba(216, 180, 254, 0.25);
  z-index: 1;
}

/* 纸张图标（右上角折叠） */
.paper-icon {
  position: relative;
  width: 64rpx;
  height: 64rpx;
}

.paper-body {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 54rpx;
  height: 56rpx;
  background: #D8B4FE;
  border-radius: 2rpx;
  box-shadow: 0 2rpx 4rpx rgba(216, 180, 254, 0.25);
}

.paper-fold {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 18rpx;
  height: 18rpx;
  background: #DCC7E1;
  border-radius: 0 2rpx 0 12rpx;
  box-shadow: -1rpx 1rpx 3rpx rgba(220, 199, 225, 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}

/* 信封图标 */
.envelope-icon {
  color: #DCC7E1;
  font-size: 52rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(220, 199, 225, 0.3));
}

.grid-text {
  font-size: 26rpx;
  color: #9B8FB8;
  font-weight: 400;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}


</style>
