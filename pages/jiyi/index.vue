<template>
  <view class="memory-page">
    <!-- 顶部问候 -->
    <view class="header">
      <text class="greeting">上午好</text>
      <text class="subtext">早晨喝一杯牛奶，保持元气满满</text>
    </view>

    <!-- 背景/插画 -->
    <image class="hero-img" src="/static/logo.png" mode="aspectFill" />

    <!-- 主功能卡片：情侣轨迹 -->
    <view class="feature-card" @click="goFeature('trail')">
      <view class="feature-icon">
        <text class="feature-icon-text">❤</text>
      </view>
      <view class="feature-info">
        <text class="feature-title">情侣轨迹</text>
        <text class="feature-desc">记录你们的足迹与回忆</text>
      </view>
      <view class="feature-arrow">▶</view>
    </view>

    <!-- 底部功能快捷入口 -->
    <view class="shortcuts">
      <view class="shortcut" @click="goFeature('trail')">
        <image class="shortcut-icon" src="/static/love.png" />
        <text class="shortcut-text">情侣轨迹</text>
      </view>
      <view class="shortcut" @click="goFeature('hotel')">
        <image class="shortcut-icon" src="/static/hudong.png" />
        <text class="shortcut-text">情侣酒店</text>
      </view>
      <view class="shortcut" @click="goFeature('album')">
        <image class="shortcut-icon" src="/static/remerber.png" />
        <text class="shortcut-text">相册</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goFeature(type) {
      const map = {
        trail: '情侣轨迹',
        hotel: '情侣酒店',
        album: '相册'
      }
      uni.showToast({ title: map[type] + '（待开发）', icon: 'none' })
    }
  }
}
</script>

<style>
.memory-page {
  min-height: 100vh;
  background: #fff5f7;
  padding-bottom: 40rpx;
}

.header {
  padding: 40rpx 30rpx 10rpx 30rpx;
}
.greeting {
  font-size: 44rpx;
  color: #2b2b2b;
  font-weight: 700;
}
.subtext {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #7a7a7a;
}

.hero-img {
  width: 690rpx;
  height: 300rpx;
  margin: 20rpx auto 30rpx auto;
  border-radius: 24rpx;
  background-color: #ffffff;
}

.feature-card {
  margin: 0 30rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}
.feature-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: linear-gradient(135deg, #FF78A6 0%, #ffd1df 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.feature-icon-text {
  color: #ffffff;
  font-size: 40rpx;
}
.feature-info {
  flex: 1;
  margin: 0 20rpx;
}
.feature-title {
  font-size: 32rpx;
  color: #2b2b2b;
  font-weight: 700;
}
.feature-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #7a7a7a;
}
.feature-arrow {
  font-size: 30rpx;
  color: #b6b6b6;
}

.shortcuts {
  margin: 30rpx 20rpx 0 20rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx 10rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-around;
}
.shortcut {
  width: 180rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.shortcut-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #f7fafb;
}
.shortcut-text {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #4a4a4a;
}
</style>
