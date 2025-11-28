<template>
  <view class="profile-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">个人中心</text>
        </view>
        <view class="navbar-right">
          <text class="navbar-icon">···</text>
          <text class="navbar-icon">◎</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- 用户信息卡片 -->
      <view class="user-info-card">
        <image 
          class="user-avatar-large" 
          :src="userInfo.displayAvatar || userInfo.avatarUrl" 
          mode="aspectFill"
        />
        <view class="user-info-text">
          <text class="user-name">{{ userInfo.displayName || userInfo.nickName || '用户' }}</text>
          <text class="user-days" v-if="isBound && bindTime">在恋爱中 {{ daysTogether }} 天</text>
          <text class="user-days" v-else-if="isBound">已有爱人</text>
          <text class="user-days" v-else>等待另一半</text>
        </view>
        <view class="edit-icon" @click="goToEdit">
          <text>✏️</text>
        </view>
      </view>

      <!-- 情侣信息卡片（显示双方头像和昵称） -->
      <view class="couple-info-card" v-if="isBound && partnerInfo">
        <text class="section-title">我们的信息</text>
        <view class="couple-avatars-section">
          <view class="couple-avatar-item">
            <image 
              class="couple-avatar" 
              :src="userInfo.displayAvatar || userInfo.avatarUrl" 
              mode="aspectFill"
            />
            <text class="couple-name">{{ userInfo.displayName || userInfo.nickName || '我' }}</text>
          </view>
          <view class="heart-connector">
            <text class="heart-icon">❤️</text>
          </view>
          <view class="couple-avatar-item">
            <image 
              class="couple-avatar" 
              :src="partnerInfo.displayAvatar || partnerInfo.avatarUrl || '/static/login/love.jpg'" 
              mode="aspectFill"
            />
            <text class="couple-name">{{ partnerInfo.displayName || partnerInfo.nickName || '另一半' }}</text>
          </view>
        </view>
      </view>

      <!-- 我的成就 -->
      <view class="section achievements-section">
        <text class="section-title">我的成就</text>
        <view class="achievements-grid">
          <view class="achievement-item" v-for="(achievement, index) in achievements" :key="index">
            <view class="achievement-icon" :style="{ background: achievement.bgColor }">
              <text class="achievement-emoji">{{ achievement.icon }}</text>
            </view>
            <text class="achievement-name">{{ achievement.name }}</text>
          </view>
        </view>
      </view>

      <!-- 设置 -->
      <view class="section settings-section">
        <text class="section-title">设置</text>
        <view class="settings-list">
          <view class="setting-item" @click="handleSetting('notification')">
            <view class="setting-left">
              <text class="setting-icon">🔔</text>
              <text class="setting-text">通知设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="handleSetting('privacy')">
            <view class="setting-left">
              <text class="setting-icon">🛡️</text>
              <text class="setting-text">隐私设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="handleSetting('sync')">
            <view class="setting-left">
              <text class="setting-icon">☁️</text>
              <text class="setting-text">纪念日</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
        </view>
        
        <!-- 解除关系区域（仅在已绑定时显示） -->
        <view class="unbind-section" v-if="isBound && partnerInfo">
          <view class="unbind-content" @click="handleUnbind">
            <text class="unbind-icon">🔗</text>
            <text class="unbind-text">解除关系</text>
      </view>
      </view>
    </view>

      <!-- 账号与安全 -->
      <view class="section account-section">
        <view class="setting-item" @click="goToProfileSettings">
          <view class="setting-left">
            <text class="setting-icon">🔒</text>
            <text class="setting-text">账号与安全</text>
          </view>
          <text class="setting-arrow" :class="{ expanded: showProfileSettings }">›</text>
        </view>
        
      </view>
    </view>
    
    <!-- 自定义 TabBar -->
    <custom-tabbar :current="2"></custom-tabbar>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';
import { getCoupleInfo, getPartnerInfo, isBound as checkIsBound, clearCoupleInfo } from '../../utils/couple.js';
import { getCoupleStatus, unbindCouple } from '../../api/couple.js';
import { saveCoupleInfo } from '../../utils/couple.js';
import { updateUserProfile } from '../../api/user.js';
import { isGuestUser } from '../../utils/auth.js';
import CustomTabbar from '@/components/custom-tabbar/index.vue';

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      userInfo: {
        nickName: '',
        avatarUrl: '',
        displayName: '',
        displayAvatar: ''
      },

      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: '',
      // 成就数据
      achievements: [
        { icon: '🧁', name: '美食家', bgColor: 'rgba(255, 217, 61, 0.2)' },
        { icon: '✈️', name: '旅行者', bgColor: 'rgba(255, 158, 188, 0.2)' },
        { icon: '📅', name: '纪念日', bgColor: 'rgba(217, 172, 255, 0.2)' }
      ]
    };
  },
  computed: {
    // 计算在一起的天数
    daysTogether() {
      if (!this.bindTime) return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = new Date();
        const diffTime = now - bindDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1; // 至少显示1天
      } catch (e) {
        return 0;
      }
    },
    // 计算容器顶部内边距
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    }
  },
  
  onLoad() {
    this.getSystemInfo();
    // 检查是否为游客用户，如果是则跳转到登录页面
    if (isGuestUser()) {
      this.goToLogin();
      return;
    }
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    // 每次页面显示时检查是否为游客用户
    if (isGuestUser()) {
      this.goToLogin();
      return;
    }
    // 每次页面显示时重新加载用户信息和情侣信息
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  
  methods: {
    // 跳转到登录页面
    goToLogin() {
      uni.redirectTo({
        url: '/pages/login/index'
      });
    },

    // 跳转到账号与安全页面
    goToProfileSettings() {
      uni.navigateTo({
        url: '/pages/profile/index'
      });
    },
    
    // 跳转到编辑资料页面
    goToEdit() {
      console.log('跳转到编辑资料页面');
      uni.navigateTo({
        url: '/subPackages/record/pages/profile/edit',
        success: () => {
          console.log('成功跳转到编辑资料页面');
        },
        fail: (err) => {
          console.error('跳转到编辑资料页面失败', err);
          uni.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 获取系统信息
    getSystemInfo() {
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
      this.navBarHeight = 54;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          // 初始化昵称设置状态
          this.useWechatNickname = !this.userInfo.displayName || 
            this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? '' : this.userInfo.displayName;
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    

    // 加载情侣信息
    async loadCoupleInfo() {
      // 游客用户不加载情侣信息
      if (isGuestUser()) {
        console.log('游客用户，跳过加载情侣信息');
        this.isBound = false;
        this.partnerInfo = null;
        this.bindTime = '';
        return;
      }
      
      try {
        // 先检查本地
        const localCoupleInfo = getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || null;
          this.bindTime = localCoupleInfo.bindTime || '';
          
          // 同时从服务器同步一次状态
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
            } else {
              // 服务器返回未绑定，清除本地
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = '';
            }
          } catch (e) {
            console.error('同步绑定状态失败', e);
            // 同步失败时保持本地状态
          }
          return;
        }
        
        // 本地没有，查询服务器
        this.isBound = false;
        this.partnerInfo = null;
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
          } else {
            // 服务器返回未绑定，确保本地也是未绑定状态
            this.isBound = false;
            this.partnerInfo = null;
            this.bindTime = '';
            clearCoupleInfo();
          }
        } catch (e) {
          console.error('查询情侣状态失败', e);
          // 查询失败时使用本地状态
          this.isBound = checkIsBound();
          if (this.isBound) {
            this.partnerInfo = getPartnerInfo();
            const coupleInfo = getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : '';
          }
        }
      } catch (e) {
        console.error('加载情侣信息失败', e);
        this.isBound = checkIsBound();
        if (this.isBound) {
          this.partnerInfo = getPartnerInfo();
        }
      }
    },
    

    

    

    

    
    // 处理设置项点击
    handleSetting(type) {
      switch (type) {
        case 'notification':
          uni.navigateTo({
            url: '/subPackages/record/pages/notification/index'
          });
          break;
        case 'privacy':
          uni.navigateTo({
            url: '/subPackages/record/pages/privacy/index'
          });
          break;
        case 'sync':
          uni.navigateTo({
            url: '/subPackages/record/pages/anniversary/index'
          });
          break;
        default:
          console.warn('未知设置项:', type);
      }
    },
    
    // 解除关系
    async handleUnbind() {
      uni.showModal({
        title: '确认解除关系',
        content: '解除关系后，你们将不再是情侣关系，相关数据也会被删除。是否确认解除？',
        confirmColor: '#FF6B6B',
        success: async (res) => {
          if (res.confirm) {
            try {
              const response = await unbindCouple();
              if (response && response.code === 200) {
                // 清除本地情侣信息
                clearCoupleInfo();
                
                // 更新页面状态
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = '';
                
                uni.showToast({
                  title: '解除成功',
                  icon: 'success'
                });
                
                // 延迟跳转到首页
                setTimeout(() => {
                  uni.switchTab({
                    url: '/pages/index/index'
                  });
                }, 1500);
              } else {
                console.error('解除关系失败', response);
                uni.showToast({
                  title: response?.message || '解除失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('解除关系异常', error);
              uni.showToast({
                title: '操作异常，请重试',
                icon: 'none'
              });
            }
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: #FFFAF4;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  position: relative;
  overflow-x: hidden;
}

/* 自定义导航栏 */
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
  background: #f0f0f0;
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
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.navbar-right:active {
  opacity: 0.7;
}


/* 内容区域 */
.content {
  padding: 30rpx;
  padding-top: 40rpx;
}

/* 用户信息卡片 */
.user-info-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%); /* 更柔和的渐变 */
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none; /* 移除阴影 */
  position: relative;
  overflow: hidden;
}

.user-avatar-large {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 6rpx solid #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  margin-right: 30rpx;
}

.user-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #000000;
}

.user-days {
  font-size: 26rpx;
  color: #666666;
}

.edit-icon {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 30rpx;
  font-size: 28rpx;
  cursor: pointer;
}

.edit-icon:active {
  background: #f0f0f0;
}

/* 情侣信息卡片 */
.couple-info-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none;
}

  .couple-avatars-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin-top: 20rpx;
  }

.couple-avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.couple-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
}

.couple-name {
  font-size: 24rpx;
  color: #000000;
  max-width: 120rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heart-connector {
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon {
  font-size: 48rpx;
  color: #666666;
}

/* 成就区域 */
.achievements-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.achievement-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.achievement-name {
  font-size: 24rpx;
  color: #000000;
  text-align: center;
}

/* 设置区域 */
.settings-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: #ffffff; /* 保持白色背景 */
  border-radius: 16rpx; /* 统一圆角 */
  box-shadow: none; /* 移除阴影 */
  cursor: pointer;
}

.setting-item:active {
  background: #f0f0f0;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.setting-icon {
  font-size: 32rpx;
}

.setting-text {
  font-size: 28rpx;
  color: #000000;
  font-weight: 500;
}

.setting-arrow {
  font-size: 28rpx;
  color: #999999;
  transition: transform 0.3s ease;
}

.setting-arrow.expanded {
  transform: rotate(90deg);
}

/* 解除关系区域 */
.unbind-section {
  margin-top: 30rpx;
  padding-top: 30rpx;

}

.unbind-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 0;
  background: transparent;
  border-radius: 0;
  cursor: pointer;
}

.unbind-content:active {
  background: #f0f0f0;
}

.unbind-icon {
  font-size: 32rpx;
  color: #666666;
}

.unbind-text {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
}

/* 账号与安全区域 */
.account-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none;
}

.profile-settings-content {
  margin-top: 20rpx;
  padding-top: 20rpx;

}

.profile-setting-block {
  margin-bottom: 30rpx;
}

.profile-setting-block:last-child {
  margin-bottom: 0;
}

.profile-setting-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 20rpx;
}

/* 头像设置 */
.avatar-section {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.current-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #e5e5e5;
}

.avatar-label {
  font-size: 24rpx;
  color: #000000;
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  color: #333;
}

.avatar-btn:active {
  background: #f0f0f0;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 28rpx;
}

/* 昵称设置 */
.nickname-option {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 6rpx;
  margin-right: 12rpx;
  position: relative;
  flex-shrink: 0;
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

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #000000;
  font-weight: 500;
}

.current-nickname {
  font-size: 24rpx;
  color: #000000;
}

.custom-nickname {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
}

.nickname-input {
  width: 100%;
  padding: 16rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  font-size: 28rpx;
  background: #ffffff;
  margin-bottom: 8rpx;
  box-sizing: border-box;
}

.char-count {
  display: block;
  font-size: 22rpx;
  color: #000000;
  text-align: right;
}

/* 保存按钮 */
.save-section {
  margin-top: 30rpx;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  background: #2bad81;
  border-radius: 48rpx;
  border: none;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(43, 173, 129, 0.25);
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn[disabled] {
  opacity: 0.6;
}

.save-icon {
  font-size: 32rpx;
}

.save-text {
  font-size: 30rpx;
}

/* 区块样式 */
.section {
  background: #ffffff;
  border-radius: 20rpx; /* 统一圆角 */
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: none; /* 移除阴影 */
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 20rpx;
}
</style>