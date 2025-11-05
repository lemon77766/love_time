<template>
  <view class="container" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">甜蜜小屋</text>
        </view>
        <view class="navbar-right" @click="goToProfile">
          <text class="navbar-icon">👤</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 情侣状态卡片 -->
      <view class="card couple-status-card" v-if="isBound && partnerInfo">
        <view class="couple-avatars-section">
          <image 
            class="couple-avatar" 
            :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
            mode="aspectFill"
          />
          <view class="heart-connector">
            <text class="heart-icon">❤️</text>
          </view>
          <image 
            class="couple-avatar" 
            :src="partnerInfo.displayAvatar || partnerInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
            mode="aspectFill"
          />
        </view>
        <view class="couple-status-info">
          <text class="days-together">相爱第 {{ daysTogether }} 天</text>
        </view>
        <view class="couple-stats">
          <view class="stat-item">
            <text class="stat-icon">💬</text>
            <text class="stat-text">昨日聊天</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">🎁</text>
            <text class="stat-text">纪念礼物</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">📅</text>
            <text class="stat-text">{{ nextAnniversaryDays }}天后周年</text>
          </view>
        </view>
        <view class="unbind-section">
          <button class="unbind-btn" @click="handleUnbind">解除关系</button>
        </view>
      </view>

      <!-- 未绑定时的提示卡片 -->
      <view class="card couple-status-card" v-else>
        <view class="couple-avatars-section">
          <image 
            class="couple-avatar" 
            :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
            mode="aspectFill"
          />
          <view class="heart-connector">
            <text class="heart-icon">💕</text>
          </view>
          <view class="couple-avatar-placeholder">
            <text class="placeholder-text">?</text>
          </view>
        </view>
        <view class="couple-status-info">
          <text class="days-together">等待另一半</text>
        </view>
        <view class="invite-hint" @click="goToInvite">
          <text class="hint-text">点击邀请另一半</text>
        </view>
      </view>

      <!-- 功能卡片网格 -->
      <view class="card grid-card">
        <view class="card-header">
          <text class="card-title">功能入口</text>
        </view>
        <view class="card-body grid-body">
          <view class="grid-container">
            <view class="grid-item" @click="goToSweetQA">
              <view class="grid-icon-wrapper">
                <image class="grid-icon-image" src="/static/zhuye/qna.png" mode="aspectFit"></image>
              </view>
              <text class="grid-text">甜蜜问答</text>
            </view>
            <view class="grid-item" @click="goToHundredThings">
              <view class="grid-icon-wrapper">
                <view class="grid-icon list-icon">
                  <view class="list-item-small"></view>
                  <view class="list-item-large"></view>
                </view>
              </view>
              <text class="grid-text">一百件事</text>
            </view>
            <view class="grid-item" @click="goToHeartWall">
              <view class="grid-icon-wrapper">
                <view class="grid-icon paper-icon">
                  <view class="paper-body"></view>
                  <view class="paper-fold"></view>
                </view>
              </view>
              <text class="grid-text">心形墙</text>
            </view>
            <view class="grid-item" @click="goToFutureLetter">
              <view class="grid-icon-wrapper">
                <view class="grid-icon envelope-icon">✉️</view>
              </view>
              <text class="grid-text">未来情书</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 心语心愿卡片 -->
      <view class="card wish-card">
        <view class="card-header">
          <text class="card-title">心语心愿</text>
        </view>
        <view class="card-body wish-body">
          <text class="wish-text">{{ wishText }}</text>
        </view>
      </view>

      <!-- 近期动态 -->
      <view class="card recent-activities-card" v-if="recentActivities.length > 0">
        <view class="card-header">
          <text class="card-title">近期动态</text>
        </view>
        <view class="card-body">
          <view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
            <view class="activity-icon-wrapper">
              <text class="activity-icon">{{ activity.icon }}</text>
            </view>
            <text class="activity-text">{{ activity.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getCoupleInfo, getPartnerInfo, isBound as checkIsBound, clearCoupleInfo } from '../../utils/couple.js';
import { getCoupleStatus, unbindCouple } from '../../api/couple.js';
import { saveCoupleInfo } from '../../utils/couple.js';
import { getUserInfo } from '../../utils/auth.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      wishText: '这一刻的幸福足以支撑以后的漫长岁月',
      screenWidth: 375,
      // 用户信息
      userInfo: {
        displayName: '',
        displayAvatar: '',
        avatarUrl: '',
        nickName: ''
      },
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: '',
      // 近期动态
      recentActivities: []
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
    // 计算下一个周年纪念日
    nextAnniversaryDays() {
      if (!this.bindTime) return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextAnniversary = new Date(currentYear, bindDate.getMonth(), bindDate.getDate());
        
        // 如果今年的纪念日已过，计算明年的
        if (nextAnniversary < now) {
          nextAnniversary.setFullYear(currentYear + 1);
        }
        
        const diffTime = nextAnniversary - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      } catch (e) {
        return 0;
      }
    },
    containerPaddingTop() {
      // 将px转换为rpx: rpx = px * 750 / screenWidth
      // 添加20rpx额外间距
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
    this.loadRecentActivities();
  },
  onShow() {
    // 每次页面显示时重新加载用户信息和情侣信息
    this.loadUserInfo();
    this.loadCoupleInfo();
    this.loadRecentActivities();
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
    goToSweetQA() {
      // 跳转到甜蜜问答页面
      uni.navigateTo({
        url: '/pages/qna/index'
      });
    },
    goToHundredThings() {
      // 跳转到一百件事页面
      uni.navigateTo({
        url: '/pages/hundred/index'
      });
    },
    goToHeartWall() {
      // 跳转到心形墙页面
      uni.navigateTo({
        url: '/pages/heartwall/index'
      });
    },
    goToFutureLetter() {
      // 跳转到未来情书页面
      uni.navigateTo({
        url: '/pages/xinxiang/index'
      });
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const userInfoData = getUserInfo();
        if (userInfoData) {
          this.userInfo = { ...userInfoData };
          
          // 如果没有设置显示名称，使用微信昵称
          if (!this.userInfo.displayName) {
            this.userInfo.displayName = this.userInfo.nickName || '用户';
          }
          
          // 如果没有设置显示头像，使用微信头像
          if (!this.userInfo.displayAvatar) {
            this.userInfo.displayAvatar = this.userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png';
          }
        } else {
          // 从登录信息中获取
          const loginInfo = uni.getStorageSync('login_info');
          if (loginInfo && loginInfo.userInfo) {
            this.userInfo = { ...loginInfo.userInfo };
          }
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    // 加载情侣信息
    async loadCoupleInfo() {
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
            if (response && response.data) {
              if (response.data.isBound) {
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
                // 服务器返回未绑定，清除本地状态
                console.log('⚠️ 服务器返回未绑定，清除本地状态');
                clearCoupleInfo();
                this.isBound = false;
                this.partnerInfo = null;
                this.bindTime = '';
              }
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
          if (response && response.data) {
            if (response.data.isBound) {
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
          }
        } catch (e) {
          console.error('查询绑定状态失败', e);
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
    // 加载近期动态
    loadRecentActivities() {
      // 模拟动态数据，实际应该从API获取
      this.recentActivities = [
        {
          icon: '📸',
          text: '共同创建了"2024旅行记忆"相册'
        },
        {
          icon: '🏆',
          text: '达成成就"美食探险家"'
        },
        {
          icon: '📅',
          text: '2025年11月10日 纪念日即将到来'
        }
      ];
    },
    // 跳转到邀请页面
    goToInvite() {
      uni.navigateTo({
        url: '/pages/invite/index'
      });
    },
    // 跳转到个人中心
    goToProfile() {
      uni.navigateTo({
        url: '/pages/we/index'
      });
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
              this.partnerInfo = null;
              this.bindTime = '';
              
              // 延迟刷新页面
              setTimeout(() => {
                this.loadCoupleInfo();
              }, 1500);
            } catch (error) {
              uni.hideLoading();
              console.error('解绑失败', error);
              uni.showToast({ 
                title: error.message || '解绑失败，请重试', 
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

<style>
/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #FFF8E7;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: #FFF8E7;
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
  font-size: 32rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.navbar-icon {
  font-size: 44rpx;
  color: #666;
}

.navbar-right:active {
  opacity: 0.6;
}

.container {
  background-color: #FFF8E7;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.content-area {
  padding: 30rpx 24rpx;
}

/* 卡片通用样式 */
.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.story-card {
  cursor: pointer;
}

.story-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 32rpx 30rpx 24rpx;
}

.card-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-body {
  padding: 0 30rpx 32rpx;
}

/* 心语心愿卡片 */
.wish-body {
  padding-top: 8rpx;
}

.wish-text {
  font-size: 26rpx;
  color: #9B8FB8;
  line-height: 1.9;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 功能卡片网格 */
.grid-body {
  padding: 20rpx 30rpx 32rpx;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 20rpx 32rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  border: 1rpx solid #F3E8FF;
  transition: all 0.2s ease;
  cursor: pointer;
}

.grid-item:active {
  transform: scale(0.96);
  background-color: #F5F5F5;
}

.grid-icon-wrapper {
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  position: relative;
}

/* 心形图标 */
.heart-icon-purple {
  color: #DCC7E1;
  font-size: 52rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(220, 199, 225, 0.3));
}

/* 图片图标 */
.grid-icon-image {
  width: 80rpx;
  height: 80rpx;
  display: block;
}

/* 列表图标（两个重叠矩形） */
.list-icon {
  position: relative;
  width: 64rpx;
  height: 64rpx;
}

.list-item-small {
  position: absolute;
  top: 6rpx;
  left: 10rpx;
  width: 48rpx;
  height: 34rpx;
  background: #DCC7E1;
  border-radius: 4rpx;
  box-shadow: 0 2rpx 4rpx rgba(220, 199, 225, 0.25);
  z-index: 2;
}

.list-item-large {
  position: absolute;
  top: 18rpx;
  left: 0;
  width: 54rpx;
  height: 38rpx;
  background: #D8B4FE;
  border-radius: 4rpx;
  box-shadow: 0 2rpx 4rpx rgba(216, 180, 254, 0.25);
  z-index: 1;
}

/* 纸张图标（右上角折叠） */
.paper-icon {
  position: relative;
  width: 64rpx;
  height: 64rpx;
}

.paper-body {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 54rpx;
  height: 56rpx;
  background: #D8B4FE;
  border-radius: 2rpx;
  box-shadow: 0 2rpx 4rpx rgba(216, 180, 254, 0.25);
}

.paper-fold {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 18rpx;
  height: 18rpx;
  background: #DCC7E1;
  border-radius: 0 2rpx 0 12rpx;
  box-shadow: -1rpx 1rpx 3rpx rgba(220, 199, 225, 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}

/* 信封图标 */
.envelope-icon {
  color: #DCC7E1;
  font-size: 52rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(220, 199, 225, 0.3));
}

.grid-text {
  font-size: 26rpx;
  color: #9B8FB8;
  font-weight: 400;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 情侣状态卡片 */
.couple-status-card {
  padding: 32rpx 30rpx;
}

.couple-avatars-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.couple-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 64rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.couple-avatar-placeholder {
  width: 128rpx;
  height: 128rpx;
  border-radius: 64rpx;
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  border: 4rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.placeholder-text {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 600;
}

.heart-connector {
  margin: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon {
  font-size: 40rpx;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.couple-status-info {
  text-align: center;
  margin-bottom: 24rpx;
}

.days-together {
  font-size: 36rpx;
  font-weight: 600;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.couple-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 24rpx;
  border-top: 1rpx solid #F0F0F0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-icon {
  font-size: 32rpx;
}

.stat-text {
  font-size: 24rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.unbind-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #F0F0F0;
  display: flex;
  justify-content: center;
}

.unbind-btn {
  background: #f5f5f5;
  color: #999;
  border: none;
  border-radius: 12rpx;
  padding: 16rpx 48rpx;
  font-size: 26rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.unbind-btn:active {
  opacity: 0.7;
  background: #e8e8e8;
}

.invite-hint {
  text-align: center;
  padding: 16rpx;
  margin-top: 16rpx;
  background: linear-gradient(to right, #FF9EBC, #D9ACFF);
  border-radius: 22rpx;
  cursor: pointer;
}

.invite-hint:active {
  opacity: 0.8;
}

.hint-text {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 500;
}

/* 近期动态 */
.recent-activities-card {
  padding-bottom: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon-wrapper {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.activity-icon {
  font-size: 32rpx;
}

.activity-text {
  flex: 1;
  font-size: 26rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}


</style>
