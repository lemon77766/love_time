<template>
  <view class="container" :style="{ paddingTop: containerPaddingTop + 'px' }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <iconify-icon icon="mdi:arrow-left" :size="24" color="#666" />
        </view>
        <view class="navbar-title">
          <text class="title-text">虚拟助手</text>
        </view>
        <view class="navbar-right">
          <!-- 右侧可放置其他功能 -->
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 虚拟助手头像 -->
      <view class="virtual-avatar-container">
        <image 
          class="virtual-avatar" 
          src="/static/login/love.jpg" 
          mode="aspectFill"
        />
      </view>

      <!-- 虚拟助手介绍 -->
      <view class="virtual-intro">
        <text class="intro-title">你好，我是你的虚拟恋爱助手</text>
        <text class="intro-content">我可以帮助你记录恋爱点滴、提醒重要日期、提供建议等。有任何问题都可以问我哦~</text>
      </view>

      <!-- 功能选项 -->
      <view class="card features-card">
        <view class="card-header">
          <text class="card-title">功能服务</text>
        </view>
        <view class="card-body">
          <view class="feature-item" @click="handleFeature('chat')">
            <view class="feature-icon">
              <iconify-icon icon="mdi:chat" :size="32" color="#4A90E2" />
            </view>
            <text class="feature-text">智能聊天</text>
          </view>
          <view class="feature-item" @click="handleFeature('remind')">
            <view class="feature-icon">
              <iconify-icon icon="mdi:bell" :size="32" color="#FF6B6B" />
            </view>
            <text class="feature-text">纪念日提醒</text>
          </view>
          <view class="feature-item" @click="handleFeature('record')">
            <view class="feature-icon">
              <iconify-icon icon="mdi:notebook" :size="32" color="#50C878" />
            </view>
            <text class="feature-text">恋爱记录</text>
          </view>
          <view class="feature-item" @click="handleFeature('advice')">
            <view class="feature-icon">
              <iconify-icon icon="mdi:lightbulb" :size="32" color="#FFD700" />
            </view>
            <text class="feature-text">恋爱建议</text>
          </view>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="action-section">
        <button class="action-btn primary-btn" @click="startChat">
          <text class="btn-text">开始聊天</text>
        </button>
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
      // 将px转换为rpx: rpx = px * 750 / screenWidth
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx;
    }
  },
  onLoad() {
    this.getSystemInfo();
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
    goBack() {
      uni.navigateBack();
    },
    handleFeature(featureType) {
      switch(featureType) {
        case 'chat':
          uni.showToast({
            title: '启动智能聊天',
            icon: 'none'
          });
          break;
        case 'remind':
          uni.showToast({
            title: '设置纪念日提醒',
            icon: 'none'
          });
          break;
        case 'record':
          uni.showToast({
            title: '记录恋爱点滴',
            icon: 'none'
          });
          break;
        case 'advice':
          uni.showToast({
            title: '获取恋爱建议',
            icon: 'none'
          });
          break;
      }
    },
    startChat() {
      uni.showToast({
        title: '正在启动聊天功能...',
        icon: 'none'
      });
    }
  }
};
</script>

<style lang="scss">
@import '@/styles/common.scss';

.container {
  background: linear-gradient(135deg, #FFFAF4 0%, #FDF6E3 100%);
  min-height: 100vh;
}

.content-area {
  padding: 30rpx 24rpx;
  padding-top: 0;
}

/* 虚拟助手头像 */
.virtual-avatar-container {
  display: flex;
  justify-content: center;
  margin: 40rpx 0;
}

.virtual-avatar {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  border: 6rpx solid #FFFFFF;
  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.1);
}

/* 虚拟助手介绍 */
.virtual-intro {
  text-align: center;
  margin-bottom: 50rpx;
}

.intro-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #4A4A4A;
  margin-bottom: 20rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.intro-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 功能卡片 */
.features-card {
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.features-card .card-header {
  margin-bottom: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-item:active {
  transform: scale(0.98);
  background: #F8F8F8;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-icon {
  margin-right: 24rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
}

.feature-text {
  font-size: 30rpx;
  color: #4A4A4A;
  flex: 1;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 底部操作 */
.action-section {
  padding: 0 20rpx;
  margin-top: 40rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.96);
}

.primary-btn {
  background: linear-gradient(135deg, #FF9EBC 0%, #FF6B6B 100%);
  color: white;
}

.btn-text {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--status-bar-height, 0px) + 44px);
  background: linear-gradient(135deg, rgba(255, 158, 188, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%);
}

.status-bar {
  width: 100%;
}

.navbar-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
}

.navbar-left, .navbar-right {
  width: 60rpx;
  display: flex;
  align-items: center;
}

.navbar-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>