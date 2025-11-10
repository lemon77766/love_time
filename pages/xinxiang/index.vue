<template>
  <view class="xinxiang-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">未来情书</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>
    
    <!-- 背景图片铺满整个屏幕 -->
    <image class="background-image" src="/static/xinxiang/1.jpg" mode="aspectFill"></image>
    
    <!-- 内容层 -->
    <view class="content-layer">
      <!-- 顶部菜单 -->
      <view class="top-menu-container">
        <view class="top-menu" @click="openHistory">
          <text class="menu-icon">📋</text>
          <text class="menu-text">写信记录</text>
        </view>
        <view class="top-menu" @click="openReceived" style="margin-top: 20rpx;">
          <text class="menu-icon">📬</text>
          <text class="menu-text">收信记录</text>
        </view>
      </view>

      <!-- 文字描述 -->
      <view class="text-container">
        <text class="text-line">把你想对他说的话</text>
        <text class="text-line">写成一封信</text>
        <text class="text-line">在未来的某天寄给他吧</text>
      </view>

      <!-- 底部前进按钮 -->
      <view class="bottom-action">
        <view class="action-content" @click="createLetter">
          <text class="action-text">下一步</text>
          <view class="arrow-button">
            <text class="arrow-icon">→</text>
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
      screenWidth: 375
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
  mounted() {
    this.getSystemInfo();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      // #ifdef MP-WEIXIN
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      this.navBarHeight = 44;
      // #endif
    },
    openHistory() {
      uni.navigateTo({ url: '/pages/xinxiang/history' });
    },
    openReceived() {
      uni.navigateTo({ url: '/pages/xinxiang/received' });
    },
    createLetter() {
      uni.navigateTo({ url: '/pages/xinxiang/create' });
    }
  }
};
</script>

<style>
.xinxiang-page {
  height: 100vh;
  position: relative;
  overflow: hidden;
  touch-action: none;
  background-color: #FFFAF4;
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
  font-size: 36rpx;
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

/* 背景图片铺满屏幕 */
.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

/* 内容层 */
.content-layer {
  position: relative;
  z-index: 1;
  height: 100vh;
  overflow: hidden;
}

/* 顶部菜单容器 */
.top-menu-container {
  position: absolute;
  top: 40rpx;
  left: 40rpx;
  z-index: 10;
}

/* 顶部菜单项 */
.top-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.menu-icon {
  font-size: 48rpx;
  color: #ffffff;
  filter: drop-shadow(0 4rpx 12rpx rgba(0,0,0,0.8));
}

.menu-text {
  font-size: 24rpx;
  color: #ffffff;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.8);
  font-weight: 600;
}

/* 删除信封容器相关样式 */

/* 文字描述 */
.text-container {
  position: absolute;
  bottom: 480rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 60rpx;
  gap: 16rpx;
}

.text-line {
  font-size: 36rpx;
  color: #ffffff;
  letter-spacing: 2rpx;
  line-height: 1.6;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.8);
  font-weight: 500;
}

/* 底部前进按钮 */
.bottom-action {
  position: absolute;
  bottom: 280rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: #ffffff;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.8);
  font-weight: 500;
}

.arrow-button {
  width: 120rpx;
  height: 120rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.6),
              0 4rpx 12rpx rgba(0, 0, 0, 0.4),
              inset 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
}

.arrow-button:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.8),
              0 2rpx 8rpx rgba(0, 0, 0, 0.5);
}

.action-content:active .arrow-button {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.8),
              0 2rpx 8rpx rgba(0, 0, 0, 0.5);
}

.arrow-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
  filter: drop-shadow(0 4rpx 12rpx rgba(0,0,0,0.8));
}
</style>
