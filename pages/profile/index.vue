<template>
  <view class="profile-settings-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">账号与安全</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <view class="container">
      <!-- 个人资料设置内容 -->
      <view class="profile-setting-block">
        <text class="profile-setting-title">头像设置</text>
        <view class="avatar-section">
          <view class="current-avatar">
            <image class="avatar" :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/login/love.jpg'" mode="aspectFill" />
            <text class="avatar-label">当前头像</text>
          </view>
          
          <view class="avatar-options">
            <button class="avatar-btn" @click="selectWechatAvatar">
              <text class="btn-icon">📱</text>
              <text class="btn-text">使用微信头像</text>
            </button>
            
            <button class="avatar-btn" @click="uploadCustomAvatar">
              <text class="btn-icon">🖼️</text>
              <text class="btn-text">上传自定义头像</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 昵称设置 -->
      <view class="profile-setting-block">
        <text class="profile-setting-title">昵称设置</text>
        <view class="nickname-section">
          <view class="nickname-option" @click="toggleUseWechatNickname">
            <view class="checkbox" :class="{ checked: useWechatNickname }"></view>
            <text class="option-text">使用微信昵称</text>
            <text class="current-nickname">{{ userInfo.nickName }}</text>
          </view>
          
          <view v-if="!useWechatNickname" class="custom-nickname">
            <input 
              v-model="customNickname" 
              class="nickname-input" 
              placeholder="请输入自定义昵称"
              maxlength="20"
            />
            <text class="char-count">{{ customNickname.length }}/20</text>
          </view>
        </view>
      </view>

      <!-- 账号安全设置 -->
      <view class="profile-setting-block">
        <text class="profile-setting-title">账号安全</text>
        <view class="security-section">
          <view class="security-item">
            <view class="security-left">
              <text class="security-icon">🔑</text>
              <text class="security-text">修改密码</text>
            </view>
            <text class="security-arrow">›</text>
          </view>
          <view class="security-item">
            <view class="security-left">
              <text class="security-icon">📱</text>
              <text class="security-text">绑定手机</text>
            </view>
            <text class="security-status">未绑定</text>
          </view>
          <view class="security-item">
            <view class="security-left">
              <text class="security-icon">📧</text>
              <text class="security-text">绑定邮箱</text>
            </view>
            <text class="security-status">未绑定</text>
          </view>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="save-section">
        <button class="save-btn" @click="saveProfile" :disabled="isLoading">
          <text class="save-text">保存设置</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';
import { updateUserProfile } from '@/api/user.js';
import { isGuestUser } from '@/utils/auth.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      userInfo: {
        nickName: '',
        avatarUrl: '',
        displayName: '',
        displayAvatar: ''
      },
      useWechatNickname: true,
      customNickname: '',
      isLoading: false
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
    this.loadUserInfo();
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
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          this.useWechatNickname = !this.userInfo.displayName || 
            this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? '' : this.userInfo.displayName;
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    async selectWechatAvatar() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      try {
        const [err, res] = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        if (err) {
          console.error('选择图片失败', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
          return;
        }
        
        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) {
          uni.showToast({
            title: '未选择图片',
            icon: 'none'
          });
          return;
        }
        
        await this.uploadAvatar(tempFilePath);
      } catch (error) {
        console.error('选择微信头像失败', error);
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    async uploadCustomAvatar() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      try {
        const [err, res] = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album']
        });
        
        if (err) {
          console.error('选择图片失败', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
          return;
        }
        
        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) {
          uni.showToast({
            title: '未选择图片',
            icon: 'none'
          });
          return;
        }
        
        await this.uploadAvatar(tempFilePath);
      } catch (error) {
        console.error('上传自定义头像失败', error);
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    async uploadAvatar(filePath) {
      try {
        const [uploadErr, uploadRes] = await uni.uploadFile({
          url: config.API.USER.UPLOAD_AVATAR,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': http.getAuthToken()
          }
        });
        
        if (uploadErr) {
          console.error('上传头像失败', uploadErr);
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          });
          return;
        }
        
        const data = JSON.parse(uploadRes.data);
        if (data.code === 200 && data.data) {
          this.userInfo.displayAvatar = data.data.url;
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } else {
          console.error('上传头像失败', data);
          uni.showToast({
            title: data.message || '上传失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('上传头像异常', error);
        uni.showToast({
          title: '上传异常',
          icon: 'none'
        });
      }
    },
    toggleUseWechatNickname() {
      this.useWechatNickname = !this.useWechatNickname;
      if (this.useWechatNickname) {
        this.customNickname = '';
      }
    },
    async saveProfile() {
      if (this.isLoading) return;
      
      if (!this.useWechatNickname && !this.customNickname.trim()) {
        uni.showToast({
          title: '请输入昵称',
          icon: 'none'
        });
        return;
      }
      
      this.isLoading = true;
      try {
        const updateData = {};
        if (this.useWechatNickname) {
          updateData.displayName = this.userInfo.nickName;
        } else {
          updateData.displayName = this.customNickname.trim();
        }
        
        if (this.userInfo.displayAvatar && this.userInfo.displayAvatar !== this.userInfo.avatarUrl) {
          updateData.displayAvatar = this.userInfo.displayAvatar;
        }
        
        const response = await updateUserProfile(updateData);
        
        if (response && response.code === 200) {
          const loginInfo = uni.getStorageSync('login_info');
          if (loginInfo && loginInfo.userInfo) {
            loginInfo.userInfo.displayName = updateData.displayName;
            if (updateData.displayAvatar) {
              loginInfo.userInfo.displayAvatar = updateData.displayAvatar;
            }
            uni.setStorageSync('login_info', loginInfo);
          }
          
          this.userInfo.displayName = updateData.displayName;
          if (updateData.displayAvatar) {
            this.userInfo.displayAvatar = updateData.displayAvatar;
          }
          
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
        } else {
          console.error('保存个人资料失败', response);
          uni.showToast({
            title: response?.message || '保存失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('保存个人资料异常', error);
        uni.showToast({
          title: '保存异常，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
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

.container {
  padding: 30rpx;
  padding-top: calc(30rpx + 44px); /* 导航栏高度 + padding */
}

.profile-setting-block {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.profile-setting-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 30rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.current-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  border: 4rpx solid #e5e5e5;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.avatar-label {
  font-size: 28rpx;
  color: #666666;
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 25rpx;
  background: #f0f0f0;
  border-radius: 16rpx;
  border: none;
  font-size: 30rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}

.avatar-btn:active {
  background: #e0e0e0;
}

.btn-icon {
  font-size: 36rpx;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 500;
}

.nickname-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.nickname-option {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  cursor: pointer;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #cccccc;
  border-radius: 8rpx;
  margin-right: 15rpx;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #FFCC66;
  border-color: #FFCC66;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  width: 14rpx;
  height: 22rpx;
  border: solid #fff;
  border-width: 0 3rpx 3rpx 0;
  transform: rotate(45deg);
  top: 50%;
  left: 50%;
  margin-top: -12rpx;
  margin-left: -7rpx;
}

.option-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.current-nickname {
  font-size: 28rpx;
  color: #999999;
}

.custom-nickname {
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx;
}

.nickname-input {
  width: 100%;
  padding: 18rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 30rpx;
  background: #ffffff;
  margin-bottom: 15rpx;
  box-sizing: border-box;
}

.char-count {
  display: block;
  font-size: 24rpx;
  color: #999999;
  text-align: right;
}

.security-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.security-item:last-child {
  border-bottom: none;
}

.security-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.security-icon {
  font-size: 36rpx;
}

.security-text {
  font-size: 30rpx;
  color: #333;
}

.security-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.security-status {
  font-size: 28rpx;
  color: #999;
}

.save-section {
  margin-top: 50rpx;
  padding: 0 30rpx;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #FFCC66, #FF9EBC);
  border-radius: 50rpx;
  border: none;
  color: #8B6914;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(255, 204, 102, 0.3);
  transition: all 0.3s ease;
}

.save-btn:active {
  opacity: 0.8;
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 10rpx rgba(255, 204, 102, 0.2);
}

.save-btn[disabled] {
  background: #cccccc;
  box-shadow: none;
  opacity: 0.7;
}

.save-text {
  font-size: 32rpx;
}
</style>