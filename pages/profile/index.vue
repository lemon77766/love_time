﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <view class="profile-settings-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">账号与安全</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <view class="content">
      <!-- 账号安全设置 -->
      <view class="section account-security-section">
        <text class="section-title">账号安全</text>
        <view class="settings-list">
          <view class="setting-item" @click="changePassword">
            <view class="setting-left">
              <text class="setting-icon">🔑</text>
              <text class="setting-text">修改密码</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="bindPhone">
            <view class="setting-left">
              <text class="setting-icon">📱</text>
              <text class="setting-text">绑定手机</text>
            </view>
            <text class="setting-status">未绑定</text>
          </view>
          <view class="setting-item" @click="bindEmail">
            <view class="setting-left">
              <text class="setting-icon">📧</text>
              <text class="setting-text">绑定邮箱</text>
            </view>
            <text class="setting-status">未绑定</text>
          </view>
        </view>
      </view>

      <!-- 隐私与通知设置 -->
      <view class="section privacy-notification-section">
        <text class="section-title">隐私与通知</text>
        <view class="settings-list">
          <view class="setting-item" @click="goToPrivacySettings">
            <view class="setting-left">
              <text class="setting-icon">🔒</text>
              <text class="setting-text">隐私设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="goToNotificationSettings">
            <view class="setting-left">
              <text class="setting-icon">🔔</text>
              <text class="setting-text">通知设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <!-- 用于测试的临时跳转 -->
          <view class="setting-item" @click="goToHeartwall">
            <view class="setting-left">
              <text class="setting-text">测试跳转到心墙</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="section logout-section">
        <view class="setting-item" @click="logout">
          <view class="setting-left">
            <text class="setting-icon">🚪</text>
            <text class="setting-text">退出登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';
import { isGuestUser } from '@/utils/auth.js';

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
  onLoad() {
    this.getSystemInfo();
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
    // 修改密码
    changePassword() {
      uni.showToast({
        title: '修改密码功能暂未开放',
        icon: 'none'
      });
    },
    
    // 绑定手机
    bindPhone() {
      uni.showToast({
        title: '绑定手机功能暂未开放',
        icon: 'none'
      });
    },
    
    // 绑定邮箱
    bindEmail() {
      uni.showToast({
        title: '绑定邮箱功能暂未开放',
        icon: 'none'
      });
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确认要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除登录信息
            try {
              uni.removeStorageSync('login_info');
              uni.removeStorageSync('token');
            } catch (error) {
              console.error('清除登录信息出错', error);
            }
            
            // 跳转到登录页面
            uni.redirectTo({
              url: '/pages/login/index'
            });
          }
        }
      });
    },
    goToPrivacySettings() {
      console.log('Attempting to navigate to privacy settings page');
      uni.navigateTo({
        url: '/subPackages/record/pages/privacy/index',
        success: () => {
          console.log('Successfully navigated to privacy settings page');
        },
        fail: (err) => {
          console.error('Failed to navigate to privacy settings page', err);
          uni.showToast({
            title: '跳转失败，请检查网络',
            icon: 'none'
          });
        }
      });
    },
    goToNotificationSettings() {
      console.log('Attempting to navigate to notification settings page');
      uni.navigateTo({
        url: '/subPackages/record/pages/notification/index',
        success: () => {
          console.log('Successfully navigated to notification settings page');
        },
        fail: (err) => {
          console.error('Failed to navigate to notification settings page', err);
          uni.showToast({
            title: '跳转失败，请检查网络',
            icon: 'none'
          });
        }
      });
    },
    goToHeartwall() {
      console.log('Attempting to navigate to heartwall page');
      uni.navigateTo({
        url: '/subPackages/record/pages/heartwall/index',
        success: () => {
          console.log('Successfully navigated to heartwall page');
        },
        fail: (err) => {
          console.error('Failed to navigate to heartwall page', err);
          uni.showToast({
            title: '跳转失败，请检查网络',
            icon: 'none'
          });
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-settings-page {
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
  font-size: 40rpx; /* 增大字体 */
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
  padding: 15rpx; /* 减少顶部留白 */
  padding-top: calc(15rpx + 44px); /* 减少导航栏下方留白 */
}

/* 区块样式 */
.section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 20rpx; /* 减少内边距 */
  margin-bottom: 10rpx; /* 减少区块间距 */
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.section-title {
  display: block;
  font-size: 34rpx; /* 增大标题字体 */
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx; /* 减少标题下方留白 */
  padding-bottom: 10rpx; /* 减少标题下方内边距 */
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
  padding: 12rpx 0; /* 减少设置项内边距 */
  border-bottom: 1rpx solid #eee;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12rpx; /* 减少图标和文字间距 */
}

.setting-icon {
  font-size: 36rpx; /* 增大图标 */
}

.setting-text {
  font-size: 28rpx; /* 增大文字 */
  color: #333;
  font-weight: 500;
}

.setting-arrow {
  font-size: 36rpx; /* 增大箭头 */
  color: #ccc;
}

.setting-status {
  font-size: 24rpx; /* 增大状态文字 */
  color: #999;
}

/* 退出登录区域特殊样式 */
.logout-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 0;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.logout-section .setting-item {
  padding: 20rpx; /* 减少退出登录项内边距 */
  border-bottom: none;
}

.logout-section .setting-text {
  color: #FF6B6B;
  font-weight: 600;
  font-size: 30rpx; /* 增大退出登录文字 */
}
</style>
