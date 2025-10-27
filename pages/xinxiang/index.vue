<template>
  <view class="xinxiang-page">
    <!-- 背景图片铺满整个屏幕 -->
    <image class="background-image" src="/static/xinxiang/1.jpg" mode="aspectFill"></image>
    
    <!-- 内容层 -->
    <view class="content-layer">
      <!-- 顶部订单记录按钮 -->
      <view class="top-menu" @click="openHistory">
        <text class="menu-icon">📋</text>
        <text class="menu-text">订单记录</text>
      </view>

      <!-- 文字描述 -->
      <view class="text-container">
        <text class="text-line">把你想对他说的话</text>
        <text class="text-line">写成一封信</text>
        <text class="text-line">在未来的某天寄给他吧</text>
      </view>

      <!-- 底部前进按钮 -->
      <view class="bottom-action">
        <view class="arrow-button" @click="createLetter">
          <text class="arrow-icon">→</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    openHistory() {
      uni.showToast({ title: '订单记录功能开发中', icon: 'none' });
      // 后续可以导航到历史记录页面
      // uni.navigateTo({ url: '/pages/xinxiang/history' });
    },
    createLetter() {
      uni.showToast({ title: '写信功能开发中', icon: 'none' });
      // 后续可以导航到写信页面
      // uni.navigateTo({ url: '/pages/xinxiang/create' });
    }
  }
};
</script>

<style>
.xinxiang-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
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
  min-height: 100vh;
}

/* 顶部订单记录 */
.top-menu {
  position: absolute;
  top: 40rpx;
  left: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  z-index: 10;
}

.menu-icon {
  font-size: 48rpx;
  color: #ffffff;
  filter: drop-shadow(0 2rpx 8rpx rgba(0,0,0,0.5));
}

.menu-text {
  font-size: 24rpx;
  color: #ffffff;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
}

/* 删除信封容器相关样式 */

/* 文字描述 */
.text-container {
  position: absolute;
  bottom: 280rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 60rpx;
  gap: 16rpx;
}

.text-line {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2rpx;
  line-height: 1.6;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
}

/* 底部前进按钮 */
.bottom-action {
  position: absolute;
  bottom: 100rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}

.arrow-button {
  width: 120rpx;
  height: 120rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.arrow-button:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

.arrow-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
  filter: drop-shadow(0 2rpx 8rpx rgba(0,0,0,0.3));
}
</style>
