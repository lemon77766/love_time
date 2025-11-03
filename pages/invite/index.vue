<template>
  <view class="invite-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">{{ isInviteMode ? '接受邀请' : '邀请另一半' }}</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 接受邀请模式：显示邀请方信息 -->
      <view v-if="isInviteMode" class="invite-container">
        <view class="invite-header">
          <text class="invite-title">💕 收到邀请</text>
          <text class="invite-subtitle">{{ creatorInfo.nickName || '好友' }} 邀请你成为情侣</text>
        </view>

        <!-- 邀请方信息卡片 -->
        <view class="creator-card">
          <image class="creator-avatar" :src="creatorInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" mode="aspectFill" />
          <text class="creator-name">{{ creatorInfo.nickName || '好友' }}</text>
          <text class="creator-tip">想要和你建立情侣关系</text>
        </view>

        <!-- 接受按钮 -->
        <view class="action-buttons">
          <button class="btn accept-btn" @click="handleAccept" :disabled="isAccepting">
            {{ isAccepting ? '接受中...' : '接受邀请' }}
          </button>
          <button class="btn cancel-btn" @click="goBack">拒绝</button>
        </view>

        <!-- 加载状态 -->
        <view v-if="isAccepting" class="loading-tip">
          <text>正在建立关系...</text>
        </view>
      </view>

      <!-- 发起邀请模式：生成邀请码并分享 -->
      <view v-else class="create-container">
        <!-- 已绑定状态 -->
        <view v-if="isBound" class="bound-status">
          <view class="bound-header">
            <text class="bound-icon">💑</text>
            <text class="bound-title">已绑定</text>
          </view>
          <view class="partner-card">
            <image class="partner-avatar" :src="partnerInfo.displayAvatar || partnerInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" mode="aspectFill" />
            <text class="partner-name">{{ partnerInfo.displayName || partnerInfo.nickName || '对方' }}</text>
            <text class="bound-time">绑定于 {{ bindTimeText }}</text>
          </view>
          <button class="btn unbind-btn" @click="handleUnbind">解除关系</button>
        </view>

        <!-- 未绑定状态：生成邀请 -->
        <view v-else class="invite-content">
          <view class="invite-header">
            <text class="invite-title">💕 邀请另一半</text>
            <text class="invite-subtitle">分享邀请给TA，一起记录美好时光</text>
          </view>

          <!-- 邀请码显示 -->
          <view v-if="inviteCode" class="invite-code-card">
            <text class="code-label">邀请码</text>
            <view class="code-display">
              <text class="code-text">{{ inviteCode }}</text>
              <button class="copy-btn" @click="copyInviteCode">复制</button>
            </view>
            <text class="code-tip">有效期：{{ expireTimeText }}</text>
          </view>

          <!-- 分享按钮 -->
          <view class="action-buttons">
            <button v-if="!inviteCode" class="btn primary-btn" @click="generateInviteCode" :disabled="isGenerating">
              {{ isGenerating ? '生成中...' : '生成邀请码' }}
            </button>
            <button v-else class="btn primary-btn" @click="shareInvite" :disabled="isSharing">
              {{ isSharing ? '分享中...' : '分享给TA' }}
            </button>
            <button v-if="inviteCode" class="btn secondary-btn" @click="regenerateInviteCode" :disabled="isGenerating">
              重新生成
            </button>
          </view>

          <!-- 分享提示 -->
          <view v-if="inviteCode" class="share-tip">
            <text class="tip-text">💡 点击右上角"..."按钮，选择"转发"分享给好友</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { createInviteCode, validateInviteCode, acceptInvite, getCoupleStatus, unbindCouple } from '../../api/couple.js';
import { saveCoupleInfo, getCoupleInfo, clearCoupleInfo, isBound as checkIsBound, getPartnerInfo } from '../../utils/couple.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      // 邀请码相关
      inviteCode: '',
      expireAt: '',
      isGenerating: false,
      isSharing: false,
      // 接受邀请相关
      isInviteMode: false, // 是否为接受邀请模式
      creatorInfo: {}, // 邀请方信息
      isAccepting: false,
      // 绑定状态
      isBound: false,
      partnerInfo: {},
      bindTime: ''
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
    expireTimeText() {
      if (!this.expireAt) return '';
      try {
        const date = new Date(this.expireAt);
        return date.toLocaleString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch (e) {
        return '';
      }
    },
    bindTimeText() {
      if (!this.bindTime) return '';
      try {
        const date = new Date(this.bindTime);
        return date.toLocaleString('zh-CN', { 
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit'
        });
      } catch (e) {
        return '';
      }
    }
  },
  onLoad(options) {
    this.getSystemInfo();
    
    // 检查是否有邀请码参数（从分享进入）
    if (options.code) {
      this.handleInviteCode(options.code);
    } else {
      // 正常进入，检查绑定状态
      this.checkCoupleStatus();
    }
  },
  onShow() {
    // 每次显示页面时检查绑定状态（从其他页面返回时）
    if (!this.isInviteMode) {
      this.checkCoupleStatus();
    }
  },
  // 微信分享配置
  onShareAppMessage() {
    if (!this.inviteCode) {
      return {
        title: '邀请你成为情侣',
        path: '/pages/invite/index'
      };
    }
    
    const userInfo = this.getCurrentUserInfo();
    return {
      title: `${userInfo.nickName || '我'} 邀请你成为情侣`,
      path: `/pages/invite/index?code=${this.inviteCode}`,
      imageUrl: '/static/invite-share.png' // 可以添加一个分享图片
    };
  },
  methods: {
    getSystemInfo() {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      // #ifdef MP-WEIXIN
      this.navBarHeight = 54;
      // #endif
      // #ifdef H5
      this.navBarHeight = 54;
      // #endif
    },
    
    getCurrentUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        return loginInfo && loginInfo.userInfo ? loginInfo.userInfo : {};
      } catch (e) {
        return {};
      }
    },
    
    // 检查绑定状态
    async checkCoupleStatus() {
      try {
        // 先检查本地
        const localCoupleInfo = getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || {};
          this.bindTime = localCoupleInfo.bindTime || '';
          
          // 同时更新本地邀请码（如果有）
          if (localCoupleInfo.inviteCode) {
            this.inviteCode = localCoupleInfo.inviteCode;
            this.expireAt = localCoupleInfo.inviteCodeExpire || '';
          }
          
          // 再从服务器同步一次状态
          try {
            const response = await getCoupleStatus();
            if (response && response.data && response.data.isBound) {
              // 更新本地信息
              saveCoupleInfo({
                isBound: true,
                coupleId: response.data.coupleId,
                partnerId: response.data.partnerInfo?.userId || '',
                partnerInfo: response.data.partnerInfo || {},
                bindTime: response.data.bindTime || '',
                role: response.data.role || ''
              });
              this.partnerInfo = response.data.partnerInfo || {};
              this.bindTime = response.data.bindTime || '';
            }
          } catch (e) {
            console.error('同步绑定状态失败', e);
          }
          return;
        }
        
        // 本地没有，查询服务器
        this.isBound = false;
        try {
          const response = await getCoupleStatus();
          if (response && response.data && response.data.isBound) {
            this.isBound = true;
            this.partnerInfo = response.data.partnerInfo || {};
            this.bindTime = response.data.bindTime || '';
            
            // 保存到本地
            saveCoupleInfo({
              isBound: true,
              coupleId: response.data.coupleId,
              partnerId: response.data.partnerInfo?.userId || '',
              partnerInfo: response.data.partnerInfo || {},
              bindTime: response.data.bindTime || '',
              role: response.data.role || ''
            });
          }
        } catch (e) {
          console.error('查询绑定状态失败', e);
          // 如果查询失败，使用本地状态
          this.isBound = checkIsBound();
          if (this.isBound) {
            this.partnerInfo = getPartnerInfo() || {};
          }
        }
      } catch (e) {
        console.error('检查绑定状态失败', e);
        this.isBound = checkIsBound();
        if (this.isBound) {
          this.partnerInfo = getPartnerInfo() || {};
        }
      }
    },
    
    // 处理邀请码（从分享进入）
    async handleInviteCode(code) {
      this.isInviteMode = true;
      this.isAccepting = false;
      
      try {
        uni.showLoading({ title: '验证中...' });
        
        const response = await validateInviteCode(code);
        uni.hideLoading();
        
        if (response && response.success && response.data) {
          this.creatorInfo = response.data.creator || {};
          this.inviteCode = code;
          this.expireAt = response.data.expireAt || '';
        } else {
          uni.showModal({
            title: '提示',
            content: response.message || '邀请码无效或已过期',
            showCancel: false,
            success: () => {
              this.goBack();
            }
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('验证邀请码失败', error);
        uni.showModal({
          title: '错误',
          content: '验证邀请码失败，请检查网络连接',
          showCancel: false,
          success: () => {
            this.goBack();
          }
        });
      }
    },
    
    // 生成邀请码
    async generateInviteCode() {
      // 先检查是否已绑定
      if (this.isBound) {
        uni.showToast({ title: '您已经绑定了情侣关系', icon: 'none' });
        return;
      }
      
      this.isGenerating = true;
      try {
        const response = await createInviteCode();
        
        if (response && response.success && response.data) {
          this.inviteCode = response.data.inviteCode || '';
          this.expireAt = response.data.expireAt || '';
          
          // 保存到本地（未绑定状态也保存邀请码）
          saveCoupleInfo({
            isBound: false,
            coupleId: '',
            partnerId: '',
            partnerInfo: null,
            bindTime: '',
            role: 'initiator',
            inviteCode: this.inviteCode,
            inviteCodeExpire: this.expireAt
          });
          
          uni.showToast({ title: '邀请码生成成功', icon: 'success' });
        } else {
          uni.showToast({ title: response.message || '生成失败', icon: 'none' });
        }
      } catch (error) {
        console.error('生成邀请码失败', error);
        uni.showToast({ title: '生成失败，请重试', icon: 'none' });
      } finally {
        this.isGenerating = false;
      }
    },
    
    // 重新生成邀请码
    async regenerateInviteCode() {
      uni.showModal({
        title: '提示',
        content: '确定要重新生成邀请码吗？旧的邀请码将失效。',
        success: (res) => {
          if (res.confirm) {
            this.generateInviteCode();
          }
        }
      });
    },
    
    // 复制邀请码
    copyInviteCode() {
      if (!this.inviteCode) return;
      
      // #ifdef MP-WEIXIN
      uni.setClipboardData({
        data: this.inviteCode,
        success: () => {
          uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
      });
      // #endif
      
      // #ifdef H5
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.inviteCode).then(() => {
          uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
        });
      }
      // #endif
    },
    
    // 分享邀请
    shareInvite() {
      // 小程序分享通过右上角菜单触发 onShareAppMessage
      // 这里可以提示用户如何使用分享功能
      uni.showModal({
        title: '分享邀请',
        content: '请点击右上角"..."按钮，选择"转发"分享给好友',
        showCancel: false
      });
    },
    
    // 接受邀请
    async handleAccept() {
      if (!this.inviteCode) {
        uni.showToast({ title: '邀请码无效', icon: 'none' });
        return;
      }
      
      // 检查是否已绑定
      if (this.isBound) {
        uni.showModal({
          title: '提示',
          content: '您已经绑定了情侣关系，无法接受新的邀请',
          showCancel: false
        });
        return;
      }
      
      this.isAccepting = true;
      try {
        const response = await acceptInvite(this.inviteCode);
        
        if (response && response.success && response.data) {
          // 保存绑定信息
          const coupleData = {
            isBound: true,
            coupleId: response.data.coupleId || '',
            partnerId: response.data.partnerInfo?.userId || '',
            partnerInfo: response.data.partnerInfo || {},
            bindTime: response.data.bindTime || '',
            role: 'accepter'
          };
          
          saveCoupleInfo(coupleData);
          
          uni.showToast({ 
            title: '绑定成功！', 
            icon: 'success',
            duration: 2000
          });
          
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/we/index'
            });
          }, 2000);
        } else {
          uni.showToast({ 
            title: response.message || '接受失败', 
            icon: 'none' 
          });
          this.isAccepting = false;
        }
      } catch (error) {
        console.error('接受邀请失败', error);
        uni.showToast({ 
          title: error.message || '接受失败，请重试', 
          icon: 'none' 
        });
        this.isAccepting = false;
      }
    },
    
    // 解绑关系
    async handleUnbind() {
      uni.showModal({
        title: '确认解绑',
        content: '解除关系后，双方将无法共享数据。确定要解除吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '解绑中...' });
              await unbindCouple();
              uni.hideLoading();
              
              // 清除本地信息
              clearCoupleInfo();
              
              uni.showToast({ 
                title: '已解除关系', 
                icon: 'success' 
              });
              
              // 更新页面状态
              this.isBound = false;
              this.partnerInfo = {};
              this.bindTime = '';
              
              // 延迟刷新页面
              setTimeout(() => {
                this.checkCoupleStatus();
              }, 1500);
            } catch (error) {
              uni.hideLoading();
              console.error('解绑失败', error);
              uni.showToast({ 
                title: '解绑失败，请重试', 
                icon: 'none' 
              });
            }
          }
        }
      });
    },
    
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.invite-page {
  min-height: 100vh;
  background: #F8F0FC;
  padding-bottom: 40rpx;
}

/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #F8F0FC;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: linear-gradient(180deg, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
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

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
}

.back-icon {
  font-size: 44rpx;
  color: #6B5B95;
  font-weight: 600;
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #6B5B95;
}

.navbar-right {
  width: 80rpx;
}

.content-area {
  padding: 30rpx 24rpx;
}

/* 接受邀请容器 */
.invite-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
}

.invite-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.invite-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #6B5B95;
  margin-bottom: 20rpx;
}

.invite-subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
}

/* 邀请方信息卡片 */
.creator-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}

.creator-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin-bottom: 24rpx;
  border: 4rpx solid #fdf2f8;
}

.creator-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.creator-tip {
  font-size: 26rpx;
  color: #999;
}

/* 按钮组 */
.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.accept-btn {
  background: linear-gradient(135deg, #FF8FB3 0%, #FF6B9D 100%);
  color: #ffffff;
}

.accept-btn[disabled] {
  background: #ddd;
  color: #999;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.primary-btn {
  background: linear-gradient(135deg, #FF8FB3 0%, #FF6B9D 100%);
  color: #ffffff;
}

.primary-btn[disabled] {
  background: #ddd;
  color: #999;
}

.secondary-btn {
  background: #ffffff;
  color: #FF8FB3;
  border: 2rpx solid #FF8FB3;
}

.unbind-btn {
  background: #f5f5f5;
  color: #999;
  margin-top: 40rpx;
}

.loading-tip {
  margin-top: 40rpx;
  font-size: 26rpx;
  color: #999;
}

/* 创建邀请容器 */
.create-container {
  padding: 40rpx 0;
}

.bound-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
}

.bound-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.bound-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.bound-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #6B5B95;
}

.partner-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}

.partner-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 20rpx;
  border: 4rpx solid #fdf2f8;
}

.partner-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.bound-time {
  font-size: 24rpx;
  color: #999;
}

.invite-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 邀请码卡片 */
.invite-code-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  width: 100%;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}

.code-label {
  display: block;
  font-size: 26rpx;
  color: #999;
  text-align: center;
  margin-bottom: 24rpx;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.code-text {
  font-size: 56rpx;
  font-weight: 700;
  color: #FF8FB3;
  letter-spacing: 8rpx;
  font-family: 'Courier New', monospace;
}

.copy-btn {
  padding: 12rpx 32rpx;
  background: #fdf2f8;
  color: #FF8FB3;
  border-radius: 20rpx;
  font-size: 24rpx;
  border: none;
}

.code-tip {
  display: block;
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

.share-tip {
  margin-top: 40rpx;
  padding: 24rpx;
  background: #fff9e6;
  border-radius: 16rpx;
  width: 100%;
}

.tip-text {
  font-size: 24rpx;
  color: #ff9500;
  line-height: 1.6;
}
</style>

