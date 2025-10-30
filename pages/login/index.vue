<template>
  <view class="login-page">
    <!-- 背景图片 -->
    <image class="bg-image" src="/static/login/beijing.jpg" mode="aspectFill" />
    
    <!-- 背景蒙版（增加可读性） -->
    <view class="bg-overlay"></view>

    <!-- 内容层 -->
    <view class="content-wrapper">

    <!-- Logo 和标题 -->
    <view class="logo-section">
      <image class="logo" src="/static/zhuye/yellow_love.png" mode="aspectFit" />
      <text class="app-name">甜蜜时光</text>
      <text class="app-slogan">记录每一个爱的瞬间</text>
    </view>

    <!-- 登录区域（无卡片） -->
    <view class="login-area">
      <!-- 用户信息预览（授权后显示） -->
      <view v-if="userInfo.nickName" class="user-preview">
        <image class="avatar" :src="userInfo.avatarUrl" mode="aspectFill" />
        <text class="nickname">{{ userInfo.nickName }}</text>
      </view>

      <!-- 登录按钮 -->
      <button 
        v-if="!isLoggedIn" 
        class="login-btn" 
        @click="handleWxLogin"
        :loading="isLoading"
      >
        <text class="btn-icon">📱</text>
        <text class="btn-text">微信授权登录</text>
      </button>

      <!-- 头像获取按钮（新增） -->
      <button
        v-if="needAvatar"
        class="avatar-btn"
        open-type="chooseAvatar"
        @chooseavatar="onChooseAvatar"
      >
        选择头像
      </button>


      <!-- 提示信息 -->
      <view class="tips">
        <text class="tip-text">登录即表示同意</text>
        <text class="link-text">《用户协议》</text>
        <text class="tip-text">和</text>
        <text class="link-text">《隐私政策》</text>
      </view>
    </view>
    </view>

    <!-- 用户资料确认弹窗 -->
    <view v-if="showProfileModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <!-- 关闭按钮 -->
        <view class="modal-close" @click="closeModal">✕</view>

        <!-- 标题 -->
        <text class="modal-title">确认您的资料</text>
        <text class="modal-subtitle">选择要在小程序中显示的头像和昵称</text>

        <!-- 头像选择区域 -->
        <view class="avatar-section">
          <text class="section-label">头像选择</text>
          
          <!-- 微信头像选项 -->
          <view class="option-item" @click="selectWechatAvatar">
            <view class="option-avatar">
              <image :src="userInfo.avatarUrl" mode="aspectFill" />
            </view>
            <view class="option-info">
              <text class="option-title">使用微信头像</text>
              <text class="option-desc">您的微信头像</text>
            </view>
            <view class="option-radio" :class="{ active: profileData.avatarType === 'wechat' }"></view>
          </view>

          <!-- 自定义头像选项 -->
          <view class="option-item" @click="uploadCustomAvatar">
            <view class="option-avatar placeholder">
              <text>+</text>
            </view>
            <view class="option-info">
              <text class="option-title">上传自定义头像</text>
              <text class="option-desc">选择本地图片</text>
            </view>
            <view class="option-radio" :class="{ active: profileData.avatarType === 'custom' }"></view>
          </view>
        </view>

        <!-- 昵称编辑区域 -->
        <view class="nickname-section">
          <text class="section-label">昵称设置</text>
          
          <!-- 使用微信昵称 -->
          <view class="checkbox-item" @click="toggleUseWechatNickname">
            <view class="checkbox" :class="{ checked: profileData.useWechatNickname }"></view>
            <text class="checkbox-text">使用微信昵称</text>
            <text class="nickname-display">{{ userInfo.nickName }}</text>
          </view>

          <!-- 自定义昵称 -->
          <view class="custom-nickname-box" v-if="!profileData.useWechatNickname">
            <text class="input-label">自定义昵称</text>
            <input 
              v-model="profileData.customNickname" 
              type="text" 
              maxlength="20"
              placeholder="请输入昵称（最多20个字）"
              class="nickname-input"
            />
            <text class="char-count">{{ profileData.customNickname.length }}/20</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="modal-actions">
          <button class="btn-cancel" @click="skipSetup">暂时跳过</button>
          <button class="btn-confirm" @click="confirmProfile">完成设置</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { wxLogin } from '@/api/login.js';
import config from '@/utils/config.js';

export default {
  data() {
    return {
      isLoggedIn: false,
      isLoading: false,
      showProfileModal: false,  // 控制丢丢丢是否显示
      needAvatar: false,  // 新增：是否需要获取头像
      userInfo: {
        nickName: '',
        avatarUrl: ''
      },
      profileData: {
        avatarType: 'wechat',      // 'wechat' 或 'custom'
        useWechatNickname: true,   // 是否使用微信昵称
        customNickname: '',        // 自定义昵称
        customAvatarUrl: ''        // 自定义头像 URL
      }
    };
  },
  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus();
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.isLoggedIn) {
          console.log('检测到已登录，自动跳转到首页');
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          // ✅ 立即跳转到首页，不显示登录页面
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            });
          }, 300);
        }
      } catch (e) {
        console.error('检查登录状态失败', e);
      }
    },

    /**
     * 微信授权登录主流程
     * 流程说明：
     * 1. 调用 uni.getUserProfile 获取用户信息（昵称、头像）- 必须由用户点击直接触发
     * 2. 调用 wx.login 获取临时登录凭证 code
     * 3. 将 code 和用户信息发送到后端服务器
     * 4. 后端验证后返回 session_key 和 openid
     * 5. 前端保存登录状态和用户信息
     */
    async handleWxLogin() {
      this.isLoading = true;

      try {
        // 步骤1：获取用户信息（不包含头像）
        const userProfile = await uni.getUserProfile({
          desc: '用于完善用户资料'
        });
        
        // 步骤2：显示头像选择按钮
        this.needAvatar = true;
        
        // 步骤3：获取登录凭证code
        const loginCode = await this.getWxLoginCode();
        
        // 保存基本用户信息
        this.userInfo = {
          nickName: userProfile.userInfo.nickName,
          avatarUrl: '' // 头像URL将在用户选择后更新
        };
        
        // 等待用户选择头像
        uni.showToast({
          title: '请选择您的头像',
          icon: 'none',
          duration: 2000
        });
        
      } catch (e) {
        console.error('登录失败', e);
        uni.showToast({
          title: e.errMsg || '登录失败，请重试',
          icon: 'none'
        });
        this.isLoading = false;
      }
    },

    // 新增：处理头像选择回调
    async onChooseAvatar(e) {
      try {
        const { avatarUrl } = e.detail;
        
        // 显示上传中提示
        uni.showLoading({
          title: '处理头像中...',
          mask: true
        });
        
        // 压缩图片
        const compressedImage = await this.compressImage(avatarUrl);
        
        // 上传头像
        const uploadResult = await http.upload({
          url: config.API.USER.AVATAR_UPLOAD,
          filePath: compressedImage,
          name: 'avatar',
          formData: {
            type: 'avatar'
          }
        });
        
        // 更新头像URL
        this.userInfo.avatarUrl = uploadResult.url || avatarUrl;
        this.needAvatar = false;
        
        // 继续登录流程
        await this.continueLogin();
        
      } catch (error) {
        console.error('处理头像选择失败', error);
        
        // 如果是网络错误，使用本地头像URL继续
        if (error.errMsg && error.errMsg.includes('fail')) {
          console.warn('上传失败，使用本地头像继续');
          this.userInfo.avatarUrl = e.detail.avatarUrl;
          this.needAvatar = false;
          
          // 继续登录流程
          await this.continueLogin();
        } else {
          uni.showToast({
            title: '头像处理失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      } finally {
        uni.hideLoading();
      }
    },
    
    // 压缩图片方法
    async compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        uni.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            console.warn('图片压缩失败，使用原图', error);
            resolve(tempFilePath);
          }
        });
      });
    },
    
    // 继续登录流程方法
    async continueLogin() {
      try {
        // 获取登录凭证code（如果还没有获取）
        const loginCode = await this.getWxLoginCode();
        
        // 发送登录请求到后端（添加重试次数）
        const loginResult = await http.post(config.API.LOGIN.WECHAT, {
          code: loginCode,
          nickName: this.userInfo.nickName,
          avatarUrl: this.userInfo.avatarUrl
        }, { retryCount: 3 });  // 设置3次重试
        
        // 保存登录信息
        const loginInfo = {
          isLoggedIn: true,
          userInfo: this.userInfo,
          token: loginResult.token || '',
          openid: loginResult.openid || '',
          sessionKey: loginResult.session_key || '',
          loginTime: new Date().toISOString()
        };
        uni.setStorageSync('login_info', loginInfo);

        this.isLoggedIn = true;

        // 提示登录成功
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 显示资料确认弹窗
        setTimeout(() => {
          this.showProfileModal = true;
        }, 1500);
        
      } catch (error) {
        console.error('登录失败', error);
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }

    /**
     * 调用微信 wx.login 接口获取临时登录凭证 code
     * @returns {Promise<string>} 返回 code字符串
     */
    getWxLoginCode() {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.login({
          provider: 'weixin',
          success: (res) => {
            if (res.code) {
              resolve(res.code);
            } else {
              reject(new Error('获取code失败'));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
        // #endif

        // #ifndef MP-WEIXIN
        // H5 或其他平台返回模拟 code
        resolve('mock_code_' + Date.now());
        // #endif
      });
    },

    /**
     * 获取用户信息（微信小程序）
     * @returns {Promise<Object>} 返回用户信息对象
     */
    getUserProfile() {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.getUserProfile({
          desc: '用于完善用户资料',
          success: (res) => {
            resolve(res.userInfo);
          },
          fail: (err) => {
            reject(err);
          }
        });
        // #endif

        // #ifndef MP-WEIXIN
        // H5 或其他平台使用模拟数据
        resolve({
          nickName: '游客用户',
          avatarUrl: '/static/zhuye/smile.png'
        });
        // #endif
      });
    },

    /**
     * 将登录信息发送到后端服务器（使用封装好的API）
     * @param {string} code - 微信登录凭证
     * @param {Object} userInfo - 用户信息
     * @returns {Promise<Object>} 返回后端响应数据
     */
    async sendLoginToBackend(code, userInfo) {
      try {
        // 调用封装好的登录API
        const result = await wxLogin(code, userInfo);
        return result;
      } catch (error) {
        // 直接抛出错误，不返回模拟数据
        throw error;
      }
    },

    // 进入应用
    enterApp() {
      uni.reLaunch({
        url: '/pages/index/index'
      });
    },

    // ========== 资料确认相关方法 ==========

    // 选择微信头像
    selectWechatAvatar() {
      this.profileData.avatarType = 'wechat';
    },

    // 上传自定义头像
    uploadCustomAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.profileData.customAvatarUrl = tempFilePath;
          this.profileData.avatarType = 'custom';
        },
        fail: (err) => {
          console.error('选择图片失败', err);
        }
      });
    },

    // 切换是否使用微信昵称
    toggleUseWechatNickname() {
      this.profileData.useWechatNickname = !this.profileData.useWechatNickname;
    },

    // 抽屼设置
    skipSetup() {
      // 空会会也要保存第一获得的微信信息
      this.showProfileModal = false;
      this.enterApp();
    },

    // 完成设置
    confirmProfile() {
      // 验证自定义昵称
      if (!this.profileData.useWechatNickname && !this.profileData.customNickname.trim()) {
        uni.showToast({
          title: '请输入昵称',
          icon: 'none'
        });
        return;
      }

      // 构建最终要保存的业个丢丢信息
      const displayName = this.profileData.useWechatNickname 
        ? this.userInfo.nickName 
        : this.profileData.customNickname;

      const displayAvatar = this.profileData.avatarType === 'wechat' 
        ? this.userInfo.avatarUrl 
        : this.profileData.customAvatarUrl;

      // 更新本地存储的登录信息
      const loginInfo = uni.getStorageSync('login_info') || {};
      loginInfo.userInfo = {
        ...loginInfo.userInfo,
        displayName,        // 小程序中使用的昵称
        displayAvatar,      // 小程序中使用的头像
        originalNickName: this.userInfo.nickName,    // 原始微信昵称
        originalAvatarUrl: this.userInfo.avatarUrl   // 原始微信头像
      };
      uni.setStorageSync('login_info', loginInfo);

      // 关闭modal并跳转首页
      this.showProfileModal = false;
      this.enterApp();
    },

    // 关闭modal
    closeModal() {
      // 点击标顎体外仞fal关闭
    }
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景图片 */
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 背景蒙版（让文字更清晰） */
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  z-index: 1;
}

/* 内容层 */
.content-wrapper {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 移除旧的背景装饰 */
.bg-decoration {
  display: none;
}

.heart {
  display: none;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 30rpx;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.app-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #2bad81;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: #4e3c3c;
}

/* 登录区域（无卡片背景） */
.login-area {
  width: 70%;
  max-width: 500rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 移除旧的登录卡片样式 */
.login-card {
  display: none;
}

/* 移除欢迎文字样式 */
.welcome-text {
  display: none;
}

.subtitle {
  display: none;
}

/* 用户信息预览 */
.user-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #e5e5e5;
  margin-bottom: 20rpx;
}

.nickname {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

/* 登录按钮 */
.login-btn, .enter-btn {
  width: 100%;
  background: #2bad81;
  border-radius: 48rpx;
  padding: 28rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 20rpx rgba(43, 173, 129, 0.25);
  margin-bottom: 30rpx;
  border: none;
  color: #ffffff;
}

.login-btn::after, .enter-btn::after {
  border: none;
}

.login-btn:active, .enter-btn:active {
  opacity: 0.85;
}

.enter-btn {
  background: #2bad81;
  box-shadow: 0 8rpx 20rpx rgba(43, 173, 129, 0.25);
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 提示信息 */
.tips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20rpx;
  backdrop-filter: blur(8px);
}

.tip-text {
  font-size: 22rpx;
  color: #666;
}

.link-text {
  font-size: 22rpx;
  color: #2bad81;
}

/* 资料确认伹媗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 30rpx 60rpx 30rpx;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.1);
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 32rpx;
  color: #999;
  padding: 8rpx 16rpx;
  border-radius: 50%;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 12rpx;
  text-align: center;
}

.modal-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
  text-align: center;
  margin-bottom: 40rpx;
}

/* 头像选择区 */
.avatar-section {
  margin-bottom: 40rpx;
}

.section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
}

.option-item:active {
  background: #f0f0f0;
}

.option-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  overflow: hidden;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.option-avatar image {
  width: 100%;
  height: 100%;
}

.option-avatar.placeholder {
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #999;
}

.option-info {
  flex: 1;
}

.option-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.option-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.option-radio {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid #d0d0d0;
  border-radius: 50%;
  margin-left: 20rpx;
  flex-shrink: 0;
  background: #fff;
  position: relative;
}

.option-radio.active {
  border-color: #2bad81;
  background: #2bad81;
}

.option-radio.active::after {
  content: '';
  position: absolute;
  width: 14rpx;
  height: 24rpx;
  border: solid #fff;
  border-width: 0 3rpx 3rpx 0;
  transform: rotate(45deg);
  top: 50%;
  left: 50%;
  margin-top: -14rpx;
  margin-left: -10rpx;
}

/* 昵称设置 */
.nickname-section {
  margin-bottom: 40rpx;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 6rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  position: relative;
}

.checkbox.checked {
  background: #2bad81;
  border-color: #2bad81;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  width: 12rpx;
  height: 20rpx;
  border: solid #fff;
  border-width: 0 2rpx 2rpx 0;
  transform: rotate(45deg);
  top: 50%;
  left: 50%;
  margin-top: -10rpx;
  margin-left: -8rpx;
}

.checkbox-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.nickname-display {
  font-size: 24rpx;
  color: #999;
}

.custom-nickname-box {
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-top: 16rpx;
}

.input-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.nickname-input {
  width: 100%;
  padding: 16rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 26rpx;
  background: #fff;
  margin-bottom: 8rpx;
}

.char-count {
  display: block;
  font-size: 20rpx;
  color: #999;
  text-align: right;
}

/* 操作按钮 */
.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
}

.btn-cancel {
  flex: 1;
  padding: 16rpx;
  background: #f0f0f0;
  border-radius: 24rpx;
  border: none;
  font-size: 28rpx;
  color: #666;
  font-weight: 600;
}

.btn-cancel:active {
  background: #e0e0e0;
}

.btn-confirm {
  flex: 1;
  padding: 16rpx;
  background: #2bad81;
  border-radius: 24rpx;
  border: none;
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(43, 173, 129, 0.3);
}

.btn-confirm:active {
  opacity: 0.9;
}

/* 底部 */
.footer {
  position: relative;
  margin-top: 40rpx;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: #666;
  text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.8);
}

/* 头像选择按钮样式 */
.avatar-btn {
  margin-top: 20rpx;
  width: 80%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333;
  border: 2rpx solid #e5e5e5;
  
  &::after {
    border: none;
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.7);
  }
}
</style>
