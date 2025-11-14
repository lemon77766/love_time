<template>
  <view class="login-page">
    <!-- 背景图片 -->
    <image class="bg-image" src="/static/login/beijing.jpg" mode="aspectFill"></image>
    
    <!-- 装饰性圆形 -->
    <view class="decoration-circle circle-1"></view>
    <view class="decoration-circle circle-2"></view>
    <view class="decoration-circle circle-3"></view>

    <!-- 内容层 -->
    <view class="content-wrapper">
      <!-- Logo 和标题 -->
      <view class="logo-section">
        <view class="logo-container">
          <image class="logo" src="/static/login/logo.png" mode="aspectFit" />
          <view class="logo-glow"></view>
        </view>
        <text class="app-name">甜蜜时光</text>
        <text class="app-slogan">记录每一个爱的瞬间</text>
      </view>

      <!-- 登录卡片 -->
      <view class="login-card">
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
          <view class="btn-content">
            <text class="btn-icon">💕</text>
            <text class="btn-text">微信授权登录</text>
          </view>
        </button>

        <!-- 游客登录按钮 -->
        <button 
          v-if="!isLoggedIn" 
          class="guest-btn" 
          @click="handleGuestLogin"
        >
          <view class="btn-content">
            <text class="btn-icon">✨</text>
            <text class="btn-text">游客登录</text>
          </view>
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
import http from '@/utils/http.js';
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
        // 检查登录信息是否存在，且包含有效的token
        const hasToken = loginInfo && (
          (loginInfo.token && loginInfo.token.trim()) ||
          (loginInfo.data?.token && loginInfo.data.token.trim()) ||
          (loginInfo.accessToken && loginInfo.accessToken.trim())
        );
        
        if (loginInfo && loginInfo.isLoggedIn && hasToken) {
          // 注意：这里只检查本地是否有token，不验证token是否有效
          // 如果token已过期，会在后续API请求时被后端返回401，然后由handleUnauthorized处理
          console.log('检测到本地登录信息，自动跳转到首页');
          console.log('⚠️ 提示：如果token已过期，将在后续请求时自动处理');
          this.isLoggedIn = true;
          this.userInfo = loginInfo.userInfo || {};
          // ✅ 立即跳转到首页，不显示登录页面
          // 如果token已过期，会在首页的API请求时被检测到并处理
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            });
          }, 300);
        } else if (loginInfo && loginInfo.isLoggedIn && !hasToken) {
          // 登录状态为true但token缺失，清除无效的登录信息
          console.warn('⚠️ 检测到无效的登录信息（缺少token），正在清除...');
          uni.removeStorageSync('login_info');
          this.isLoggedIn = false;
          this.userInfo = {};
          console.warn('✅ 已清除无效的登录信息，请重新登录');
        }
      } catch (e) {
        console.error('检查登录状态失败', e);
      }
    },

    /**
     * 游客登录处理
     * 无需授权，直接使用默认用户信息进入应用
     */
    handleGuestLogin() {
      // 创建游客用户信息
      const guestUserInfo = {
        nickName: '游客用户',
        avatarUrl: '/static/zhuye/smile.png',
        displayName: '游客用户',
        displayAvatar: '/static/zhuye/smile.png',
        isGuest: true
      };

      // 保存游客登录信息
      const loginInfo = {
        isLoggedIn: true,
        userInfo: guestUserInfo,
        isGuest: true, // 标记为游客登录
        loginTime: new Date().toISOString()
      };
      
      try {
        uni.setStorageSync('login_info', loginInfo);
        
        // 提示登录成功
        uni.showToast({
          title: '游客登录成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟跳转到首页
        setTimeout(() => {
          this.enterApp();
        }, 1500);
        
      } catch (error) {
        console.error('游客登录失败', error);
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    },

    /**
     * 微信授权登录主流程
     * 流程说明：
     * 1. 调用 uni.getUserProfile 获取用户信息（昵称、头像）- 必须由用户点击直接触发
     * 2. 调用 wx.login 获取临时登录凭证 code
     * 3. 尝试调用后端登录API，如果失败则使用模拟登录
     * 4. 前端保存登录状态和用户信息
     * 5. 直接跳转到首页
     */
    async handleWxLogin() {
      this.isLoading = true;
      try {
        // 1. 获取微信用户基础资料
        const userProfile = await uni.getUserProfile({
          desc: '用于完善用户资料'
        });
        
        // 2. 获取微信登录code
        const code = await this.getWxLoginCode();

        // 3. 尝试调用后端登录API，如果失败则使用模拟登录
        let loginResult;
        try {
          loginResult = await http.post(config.API.LOGIN.WECHAT, {
            code,
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl
          });
        } catch (apiError) {
          console.warn('后端API调用失败，使用模拟登录', apiError);
          // 使用模拟登录数据
          loginResult = {
            token: 'mock_token_' + Date.now(),
            openid: 'mock_openid_' + Date.now(),
            session_key: 'mock_session_' + Date.now(),
            success: true
          };
          
          // 提示用户使用模拟登录
          uni.showToast({
            title: '后端服务未就绪，使用模拟登录',
            icon: 'none',
            duration: 2000
          });
        }

        // 4. 保存登录信息到本地
        // 处理后端响应格式：支持多种格式以兼容不同情况
        // 标准格式: {success: true, message: "登录成功", data: {token: ..., openid: ..., session_key: ...}}
        // 兼容格式1: {token: ..., openid: ..., session_key: ...}
        // 兼容格式2: {success: true, token: ..., openid: ..., session_key: ...}
        // 兼容格式3: {data: {success: true, data: {token: ...}}}
        // 统一处理响应数据，兼容多种返回结构
        let responseData = loginResult;
        if (loginResult.data && typeof loginResult.data === 'object') {
          responseData = loginResult.data;
        }

        // 规范化可能的token字段（排除纯数字的状态码）
        const normalizeTokenCandidate = (candidate) => {
          if (typeof candidate !== 'string') {
            return '';
          }
          const trimmed = candidate.trim();
          if (!trimmed) {
            return '';
          }
          if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
            // 像 200 / 401 这样的状态码不视为token
            return '';
          }
          return trimmed;
        };

        const tokenCandidates = [];
        const pushTokenCandidate = (candidate) => {
          const normalized = normalizeTokenCandidate(candidate);
          if (normalized) {
            tokenCandidates.push(normalized);
          }
        };

        if (responseData && typeof responseData === 'object') {
          pushTokenCandidate(responseData.token);
          pushTokenCandidate(responseData.data?.token);
        }
        pushTokenCandidate(loginResult.token);
        pushTokenCandidate(loginResult.data?.token);

        // 兼容后端直接把token放在 data 字符串或 code 字段里的情况
        if (typeof loginResult.data === 'string') {
          pushTokenCandidate(loginResult.data);
        }
        if (responseData && typeof responseData === 'string') {
          pushTokenCandidate(responseData);
        }
        pushTokenCandidate(loginResult.code);
        if (responseData && typeof responseData === 'object') {
          pushTokenCandidate(responseData.code);
        }

        const token = tokenCandidates.length > 0 ? tokenCandidates[0] : '';
        
        // 尝试从多个可能的路径获取openid
        const openid = responseData.openid || 
                      responseData.user?.openid ||
                      loginResult.openid || 
                      loginResult.data?.openid || 
                      loginResult.data?.user?.openid ||
                      (responseData.data && responseData.data.openid) || 
                      '';
        
        // 尝试从多个可能的路径获取session_key（可选字段，后端通常不返回给前端）
        // 注意：session_key 主要用于后端解密敏感数据，前端通常不需要
        const sessionKey = responseData.session_key || 
                           responseData.sessionKey ||
                           responseData.user?.session_key ||
                           responseData.user?.sessionKey ||
                           loginResult.session_key || 
                           loginResult.sessionKey ||
                           loginResult.data?.session_key || 
                           loginResult.data?.sessionKey ||
                           loginResult.data?.user?.session_key ||
                           loginResult.data?.user?.sessionKey ||
                           (responseData.data && responseData.data.session_key) || 
                           (responseData.data && responseData.data.sessionKey) || 
                           undefined; // 使用 undefined 而不是空字符串，表示未提供
        
        const isSuccess = loginResult.success !== false; // 如果没有success字段，默认为成功
        
        const loginInfo = {
          isLoggedIn: true,
          token: token,
          openid: openid,
          sessionKey: sessionKey,
          userInfo: {
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl,
            displayName: userProfile.userInfo.nickName,
            displayAvatar: userProfile.userInfo.avatarUrl
          },
          loginTime: new Date().toISOString(),
          isMock: !isSuccess // 标记是否为模拟登录
        };
        
        // 调试信息：检查token是否正确提取
        if (process.env.NODE_ENV === 'development') {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔍 [登录响应分析]');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📦 原始响应数据:', loginResult);
          console.log('📦 响应数据类型:', typeof loginResult);
          console.log('📦 responseData:', responseData);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔑 Token提取结果:');
          console.log('   - responseData.token:', responseData.token || '未找到');
          console.log('   - loginResult.token:', loginResult.token || '未找到');
          console.log('   - loginResult.data?.token:', loginResult.data?.token || '未找到');
          console.log('   - 最终提取的Token:', token ? `✅ 已找到，长度: ${token.length}` : '❌ 未找到');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('👤 OpenID提取结果:');
          console.log('   - responseData.openid:', responseData.openid || '未找到');
          console.log('   - responseData.user?.openid:', responseData.user?.openid || '未找到');
          console.log('   - loginResult.openid:', loginResult.openid || '未找到');
          console.log('   - loginResult.data?.openid:', loginResult.data?.openid || '未找到');
          console.log('   - loginResult.data?.user?.openid:', loginResult.data?.user?.openid || '未找到');
          console.log('   - 最终提取的OpenID:', openid ? `✅ 已找到: ${openid}` : '❌ 未找到');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔐 SessionKey提取结果:');
          console.log('   - 最终提取的SessionKey:', sessionKey ? `✅ 已找到，长度: ${sessionKey.length}` : 'ℹ️ 未提供（这是正常的）');
          console.log('   - 💡 说明: session_key 主要用于后端解密敏感数据，前端通常不需要');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          if (!token) {
            console.error('❌ Token提取失败！');
            console.error('📋 完整响应结构:', JSON.stringify(loginResult, null, 2));
            console.error('💡 提示: 请检查后端返回的数据结构是否符合预期');
          }
          if (!openid) {
            console.error('❌ OpenID提取失败！');
            console.error('💡 提示: OpenID 是必需的，请检查后端是否返回了 openid');
          }
        }
        
        uni.setStorageSync('login_info', loginInfo);
        this.userInfo = loginInfo.userInfo;
        this.isLoggedIn = true;
        
        // 验证token是否保存成功
        const savedLoginInfo = uni.getStorageSync('login_info');
        if (process.env.NODE_ENV === 'development') {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('💾 [存储验证]');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📦 保存后的登录信息:', savedLoginInfo);
          console.log('🔑 保存后的Token:', savedLoginInfo?.token ? `✅ 已保存，长度: ${savedLoginInfo.token.length}` : '❌ 未保存');
          console.log('👤 保存后的OpenID:', savedLoginInfo?.openid ? `✅ 已保存: ${savedLoginInfo.openid}` : '❌ 未保存');
          console.log('🔐 保存后的SessionKey:', savedLoginInfo?.sessionKey ? `✅ 已保存，长度: ${savedLoginInfo.sessionKey.length}` : 'ℹ️ 未保存（这是正常的，前端通常不需要）');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        
        // 如果token为空，给出警告
        if (!token || !token.trim()) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('⚠️ [警告] Token为空！');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('🔍 可能的原因:');
          console.error('   1. 后端返回的数据结构中不包含token字段');
          console.error('   2. 后端返回的token字段名为空字符串');
          console.error('   3. 后端返回的数据结构不符合预期');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          uni.showModal({
            title: '登录警告',
            content: '未获取到有效的登录凭证，部分功能可能无法使用。请检查后端服务是否正常。',
            showCancel: false
          });
        }

        // 5. 提示登录成功
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 6. 延迟跳转到首页（头像修改功能将在个人资料页面提供）
        setTimeout(() => {
          this.enterApp();
        }, 1500);
        
      } catch (e) {
        console.error('微信登录失败', e);
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
    },


  }
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景图片层 */
.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 装饰性圆形 */
.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  z-index: 1;
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300rpx;
  height: 300rpx;
  top: -100rpx;
  right: -50rpx;
  animation-delay: 0s;
}

.circle-2 {
  width: 200rpx;
  height: 200rpx;
  bottom: 100rpx;
  left: -50rpx;
  animation-delay: 2s;
}

.circle-3 {
  width: 150rpx;
  height: 150rpx;
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-30rpx) scale(1.1);
    opacity: 0.8;
  }
}

/* 内容层 */
.content-wrapper {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100rpx;
  animation: fadeInDown 0.8s ease-out;
}

.logo-container {
  position: relative;
  margin-bottom: 40rpx;
}

.logo {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  z-index: 2;
  box-shadow: 0 20rpx 60rpx rgba(255, 224, 179, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 224, 179, 0.3) 0%, transparent 70%);
  animation: glow 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes glow {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-name {
  font-size: 56rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 20rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  letter-spacing: 2rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  font-weight: 400;
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px);
  animation: fadeInUp 0.8s ease-out 0.2s both;
  border: 1.5rpx solid rgba(255, 255, 255, 0.3);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户信息预览 */
.user-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  border: 4rpx solid #FFD699;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(255, 224, 179, 0.3);
}

.nickname {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
}

/* 登录按钮 */
.login-btn, .guest-btn {
  width: 100%;
  border-radius: 24rpx;
  padding: 0;
  margin-bottom: 20rpx;
  border: none;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.login-btn::after, .guest-btn::after {
  border: none;
}

.btn-content {
  width: 100%;
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  position: relative;
  z-index: 1;
}

.login-btn {
  background: linear-gradient(135deg, #FFE0B3 0%, #FFD699 100%);
  box-shadow: 0 8rpx 24rpx rgba(255, 224, 179, 0.35);
}

.login-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 16rpx rgba(255, 224, 179, 0.3);
}

/* 游客登录按钮样式 */
.guest-btn {
  background: rgba(255, 255, 255, 0.95);
  border: 1.5rpx solid rgba(255, 224, 179, 0.5);
  box-shadow: 0 4rpx 16rpx rgba(255, 224, 179, 0.15);
}

.guest-btn:active {
  transform: scale(0.97);
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 224, 179, 0.6);
}

.btn-icon {
  font-size: 28rpx;
  line-height: 1;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #FFFFFF;
  letter-spacing: 0.5rpx;
}

.guest-btn .btn-text {
  color: #FFD699;
  font-weight: 500;
}

/* 提示信息 */
.tips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 32rpx;
  margin-top: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 24rpx;
  backdrop-filter: blur(10px);
}

.tip-text {
  font-size: 24rpx;
  color: #666;
}

.link-text {
  font-size: 24rpx;
  color: #FFD699;
  font-weight: 500;
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
  border-color: #FFD699;
  background: #FFD699;
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
  background: #FFD699;
  border-color: #FFD699;
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
  background: #FFD699;
  border-radius: 24rpx;
  border: none;
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 224, 179, 0.3);
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
