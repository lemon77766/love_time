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
        <text class="app-name">恋与时光册</text>
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
          :class="{ 'disabled': !agreedToPrivacy }"
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
          :class="{ 'disabled': !agreedToPrivacy }"
        >
          <view class="btn-content">
            <text class="btn-icon">✨</text>
            <text class="btn-text">游客登录</text>
          </view>
        </button>

        <!-- 浏览功能提示 -->
        <view class="browse-tip" @click="browseFeatures">
          <text class="tip-icon">👀</text>
          <text class="tip-text">先浏览功能</text>
        </view>

        <!-- 隐私协议复选框 -->
        <view class="privacy-section">
          <label class="checkbox-wrapper" @click="togglePrivacyAgreement">
            <view class="custom-checkbox" :class="{ checked: agreedToPrivacy }">
              <view class="checkmark" v-if="agreedToPrivacy"></view>
            </view>
            <text class="privacy-text">我已阅读并同意</text>
          </label>
          <text class="link-text" @click="showUserAgreement">《用户协议》</text>
          <text class="privacy-text">和</text>
          <text class="link-text" @click="showPrivacyPolicy">《隐私政策》</text>
        </view>
      </view>
      
      <!-- 底部提示 -->
      <view class="footer">
        <text class="footer-text">登录后可享受完整功能并保存数据</text>
      </view>
    </view>
      <!-- 用户协议弹窗 -->
    <view class="modal-overlay" v-if="showUserAgreementModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">用户协议</text>
          <text class="modal-close" @click="closeUserAgreementModal">✕</text>
        </view>
        <scroll-view class="modal-body" scroll-y="true">
          <view class="agreement-content">
            <rich-text :nodes="userAgreementContent"></rich-text>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-confirm" @click="closeUserAgreementModal">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 隐私政策弹窗 -->
    <view class="modal-overlay" v-if="showPrivacyPolicyModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">隐私政策</text>
          <text class="modal-close" @click="closePrivacyPolicyModal">✕</text>
        </view>
        <scroll-view class="modal-body" scroll-y="true">
          <view class="agreement-content">
            <rich-text :nodes="privacyPolicyContent"></rich-text>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-confirm" @click="closePrivacyPolicyModal">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';
import { isGuestUser } from '../../utils/auth.js';

export default {
  data() {
    return {
      isLoggedIn: false,
      isLoading: false,
      agreedToPrivacy: false, // 是否同意隐私协议
      showUserAgreementModal: false, // 显示用户协议弹窗
      showPrivacyPolicyModal: false, // 显示隐私政策弹窗
      userInfo: {
        nickName: '',
        avatarUrl: ''
      },
      userAgreementContent: `
        <h3>用户服务协议</h3>
        <p>欢迎使用"恋与时光册"小程序（以下简称"本应用"）。在您使用本应用之前，请仔细阅读以下条款。</p>
        
        <h4>一、服务条款的确认和接纳</h4>
        <p>本应用各项服务的所有权和运作权归开发者所有。用户在使用本应用时，必须遵守以下服务条款。</p>
        
        <h4>二、服务说明</h4>
        <p>本应用为情侣用户提供记录和分享美好时光的服务，包括但不限于：</p>
        <ul>
          <li>记录恋爱轨迹</li>
          <li>恋与问答互动</li>
          <li>未来情书功能</li>
          <li>爱心照片墙</li>
          <li>一百件小事挑战</li>
        </ul>
        
        <h4>三、用户行为规范</h4>
        <p>用户在使用本服务时，应遵守相关法律法规，不得：</p>
        <ul>
          <li>上传违法内容</li>
          <li>侵犯他人合法权益</li>
          <li>进行任何危害网络安全的行为</li>
        </ul>
        
        <h4>四、知识产权</h4>
        <p>本应用的所有内容，包括但不限于文字、图片、音频、视频等，均受知识产权法律法规保护。</p>
        
        <h4>五、免责声明</h4>
        <p>本应用仅提供平台服务，不对用户间的行为承担责任。</p>
        
        <h4>六、协议修改</h4>
        <p>开发者有权在必要时修改服务条款，修改后的条款一经公布即生效。</p>
        
        <h4>七、其他</h4>
        <p>本协议的解释权归开发者所有。</p>
      `,
      privacyPolicyContent: `
        <h3>隐私政策</h3>
        <p>本应用尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更有个性化的服务，"恋与时光册"小程序（以下简称"本应用"）会按照本隐私权政策的规定使用和披露您的个人信息。</p>
        
        <h4>一、收集的信息</h4>
        <p>为提供服务，我们可能收集以下信息：</p>
        <ul>
          <li>您提供的昵称、头像等基本信息</li>
          <li>您在使用过程中产生的位置信息</li>
          <li>您上传的照片、文字等内容</li>
          <li>设备信息（如设备型号、操作系统版本等）</li>
        </ul>
        
        <h4>二、信息的使用</h4>
        <p>我们收集的信息将用于：</p>
        <ul>
          <li>提供、维护和改善我们的服务</li>
          <li>开发新的服务</li>
          <li>向您发送相关通知</li>
        </ul>
        
        <h4>三、信息的保护</h4>
        <p>我们采取合理的安全措施保护您的个人信息，防止数据丢失、误用、未经授权的访问。</p>
        
        <h4>四、信息的共享</h4>
        <p>未经您同意，我们不会与任何无关第三方共享您的个人信息，除非：</p>
        <ul>
          <li>获得您的明确同意</li>
          <li>根据法律法规或政府主管部门的要求</li>
          <li>为维护社会公共利益</li>
        </ul>
        
        <h4>五、Cookie的使用</h4>
        <p>为提供更好的服务，我们可能使用Cookie来记录您的偏好设置。</p>
        
        <h4>六、未成年人隐私保护</h4>
        <p>我们非常重视对未成年人个人信息的保护。若您是18周岁以下的未成年人，在使用我们的产品和服务前，应请您的监护人仔细阅读本隐私政策。</p>
        
        <h4>七、隐私政策的更新</h4>
        <p>我们可能会适时对本隐私政策进行更新，更新后的隐私政策一旦公布即生效。</p>
        
        <h4>八、联系我们</h4>
        <p>如果您对本隐私政策有任何疑问，可通过小程序内的反馈功能与我们联系。</p>
      `
    };
  },
  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus();
    // 加载用户信息
    this.loadUserInfo();
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
        }
      } catch (e) {
        console.error('加载用户信息失败', e);
      }
    },
    
    // 切换隐私协议同意状态
    togglePrivacyAgreement() {
      this.agreedToPrivacy = !this.agreedToPrivacy;
    },
    
    // 显示用户协议弹窗
    showUserAgreement() {
      this.showUserAgreementModal = true;
    },
    
    // 关闭用户协议弹窗
    closeUserAgreementModal() {
      this.showUserAgreementModal = false;
    },
    
    // 显示隐私政策弹窗
    showPrivacyPolicy() {
      this.showPrivacyPolicyModal = true;
    },
    
    // 关闭隐私政策弹窗
    closePrivacyPolicyModal() {
      this.showPrivacyPolicyModal = false;
    },
    
    // 浏览功能
    browseFeatures() {
      // 直接跳转到首页，允许用户先浏览功能
      uni.reLaunch({
        url: '/pages/index/index'
      });
    },
    
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
        
        if (loginInfo && loginInfo.isLoggedIn && hasToken && !loginInfo.isGuest) {
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
      // 检查是否同意隐私协议
      if (!this.agreedToPrivacy) {
        uni.showToast({
          title: '请先阅读并同意用户协议和隐私政策',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 创建游客用户信息
      const guestUserInfo = {
        nickName: '游客用户',
        avatarUrl: '/static/zhuye/smile.png',
        displayName: '游客用户',
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
      // 检查是否同意隐私协议
      if (!this.agreedToPrivacy) {
        uni.showToast({
          title: '请先阅读并同意用户协议和隐私政策',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.isLoading = true;
      try {
        // 1. 获取微信用户基础资料
        const userProfile = await uni.getUserProfile({
          desc: '用于完善用户资料'
        });
        
        // 2. 获取微信登录code
        const code = await this.getWxLoginCode();

        // 3. 尝试调用后端登录API，如果超时则重试
        let loginResult;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            loginResult = await http.post(config.API.LOGIN.WECHAT, {
              code: code,
              userInfo: userProfile.userInfo
            });
            // 成功则跳出循环
            break;
          } catch (apiError) {
            console.error(`登录API调用失败 (第${retryCount + 1}次)`, apiError);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              // 最后一次重试失败，使用模拟登录
              console.warn('所有重试都失败，使用模拟登录');
              loginResult = this.createMockLoginResult(code, userProfile.userInfo);
              
              // 提示用户后端连接问题
              uni.showToast({
                title: '后端服务连接失败，使用离线模式',
                icon: 'none',
                duration: 3000
              });
            } else {
              // 等待1秒后重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // 4. 处理登录结果
        if (loginResult && (loginResult.code === 200 || loginResult.success)) {
          // 登录成功
          const userData = loginResult.data || loginResult.result || {};
          
          // 构造用户信息对象
          const userInfo = {
            nickName: userProfile.userInfo.nickName,
            avatarUrl: userProfile.userInfo.avatarUrl,
            displayName: userData.displayName || userProfile.userInfo.nickName,
            displayAvatar: userData.displayAvatar || userProfile.userInfo.avatarUrl,
            ...userData
          };
          
          // 保存登录信息
          const loginInfo = {
            isLoggedIn: true,
            userInfo: userInfo,
            token: userData.token || userData.accessToken || '',
            loginTime: new Date().toISOString(),
            isGuest: false
          };
          
          uni.setStorageSync('login_info', loginInfo);
          
          // 提示登录成功
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });
          
          // 延迟跳转到首页
          setTimeout(() => {
            this.enterApp();
          }, 1500);
        } else {
          // 登录失败
          console.error('登录失败', loginResult);
          uni.showToast({
            title: loginResult?.message || '登录失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('微信登录失败', error);
        uni.showToast({
          title: '登录异常，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    // 获取微信登录code
    getWxLoginCode() {
      return new Promise((resolve, reject) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              resolve(res.code);
            } else {
              reject(new Error('获取微信登录code失败'));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    
    // 创建模拟登录结果（用于API调用失败时）
    createMockLoginResult(code, userInfo) {
      return {
        code: 200,
        success: true,
        message: '登录成功',
        data: {
          userId: 'mock_' + Date.now(),
          token: 'mock_token_' + Date.now(),
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          displayName: userInfo.nickName,
          displayAvatar: userInfo.avatarUrl
        }
      };
    },
    
    // 进入应用（跳转到首页）
    enterApp() {
      // 再次确认token已保存
      const savedInfo = uni.getStorageSync('login_info');
      if (savedInfo && savedInfo.token) {
        uni.reLaunch({
          url: '/pages/index/index'
        });
      } else {
        console.error('Token保存失败，请重试');
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'error'
        });
      }
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

.login-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.guest-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* 浏览功能提示 */
.browse-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx 0;
  margin-bottom: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 24rpx;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.browse-tip:active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(0.98);
}

.tip-icon {
  font-size: 28rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #FFD699;
  font-weight: 500;
}

/* 隐私协议区域 */
.privacy-section {
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

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.custom-checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 6rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  position: relative;
  background: #fff;
}

.custom-checkbox.checked {
  background: #FFD699;
  border-color: #FFD699;
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12rpx;
  height: 20rpx;
  border: solid #fff;
  border-width: 0 2rpx 2rpx 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

.privacy-text {
  font-size: 24rpx;
  color: #666;
}

.link-text {
  font-size: 24rpx;
  color: #FFD699;
  font-weight: 500;
  cursor: pointer;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  position: relative;
}

.modal-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.modal-close {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  font-size: 32rpx;
  color: #999;
  padding: 8rpx;
  border-radius: 50%;
  cursor: pointer;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
}

.agreement-content {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.agreement-content h3 {
  font-size: 30rpx;
  font-weight: 700;
  margin: 20rpx 0;
  text-align: center;
}

.agreement-content h4 {
  font-size: 28rpx;
  font-weight: 600;
  margin: 16rpx 0 8rpx;
}

.agreement-content p {
  margin: 12rpx 0;
}

.agreement-content ul {
  margin: 12rpx 0 12rpx 30rpx;
  padding-left: 0;
}

.agreement-content li {
  margin: 8rpx 0;
}

.modal-footer {
  padding: 30rpx;
  border-top: 1rpx solid #eee;
  text-align: center;
}

.btn-confirm {
  width: 100%;
  padding: 20rpx;
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
