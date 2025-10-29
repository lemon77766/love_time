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


      <!-- 提示信息 -->
      <view class="tips">
        <text class="tip-text">登录即表示同意</text>
        <text class="link-text">《用户协议》</text>
        <text class="tip-text">和</text>
        <text class="link-text">《隐私政策》</text>
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
      userInfo: {
        nickName: '',
        avatarUrl: ''
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
        // 步骤1：先获取用户信息（必须由用户点击直接触发，不能延迟）
        const userProfile = await this.getUserProfile();
        console.log('获取到用户信息:', userProfile);

        // 步骤2：获取登录凭证code（可以在任何时机调用）
        const loginCode = await this.getWxLoginCode();
        console.log('获取到登录凭证 code:', loginCode);
        
        // 步骤3：将 code 和用户信息发送到后端
        const loginResult = await this.sendLoginToBackend(loginCode, userProfile);
        console.log('后端验证结果:', loginResult);

        // 步骤4：保存用户信息和登录状态
        this.userInfo = {
          nickName: userProfile.nickName,
          avatarUrl: userProfile.avatarUrl
        };

        // 保存登录信息到本地存储
        const loginInfo = {
          isLoggedIn: true,
          userInfo: this.userInfo,
          token: loginResult.token || '',  // 后端返回的 token
          openid: loginResult.openid || '',  // 后端返回的 openid
          sessionKey: loginResult.session_key || '',  // 后端返回的 session_key
          loginTime: new Date().toISOString()
        };
        uni.setStorageSync('login_info', loginInfo);

        this.isLoggedIn = true;

        // 步骤5：提示登录成功
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 步骤6：延迟进入首页
        setTimeout(() => {
          this.enterApp();
        }, 1500);
        
      } catch (e) {
        console.error('登录失败', e);
        uni.showToast({
          title: e.errMsg || '登录失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },

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
    }
  }
};
</script>

<style scoped>
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
</style>
