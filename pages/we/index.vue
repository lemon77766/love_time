<template>
  <view class="my-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">我们</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 用户信息区 -->
    <view class="profile-card">
      <view class="profile-bg"></view>
      <!-- 已绑定时显示双人头像 -->
      <view v-if="isBound && partnerInfo" class="couple-avatars">
        <image class="avatar" :src="userInfo.displayAvatar" mode="aspectFill" />
        <image class="partner-avatar" :src="partnerInfo.displayAvatar || partnerInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" mode="aspectFill" />
      </view>
      <!-- 未绑定时显示单人头像 -->
      <image v-else class="avatar" :src="userInfo.displayAvatar" mode="aspectFill" />
      <view class="profile-texts">
        <text class="hello">Hi, {{ userInfo.displayName }}</text>
        <text v-if="isBound && partnerInfo" class="sub">与 {{ partnerInfo.displayName || partnerInfo.nickName || 'TA' }} 一起走过 {{ daysTogether }} 天</text>
        <text v-else class="sub">甜蜜时光 一起陪伴你走过 111 天</text>
      </view>
    </view>

    <!-- 数据统计区 -->
    <view class="stats-card">
      <view class="stat-item" v-for="(s, i) in stats" :key="i">
        <text class="stat-num">{{ s.num }}</text>
        <view class="stat-row">
          <text class="stat-icon">{{ s.icon }}</text>
          <text class="stat-label">{{ s.label }}</text>
        </view>
      </view>
      <view class="stats-footer">
        <text class="update">更新数据 {{ lastUpdate }}</text>
      </view>
    </view>

    <!-- 功能菜单区 -->
    <view class="menu-list">
      <view class="menu-item" v-for="(m, i) in menus" :key="i" @click="openMenu(m.key)">
        <view class="menu-left">
          <view class="menu-icon">{{ m.icon }}</view>
          <text class="menu-text">{{ m.text }}</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>
    </view>
  </view>
</template>

<script>
import { getCoupleInfo, getPartnerInfo, isBound as checkIsBound } from '../../utils/couple.js';
import { getCoupleStatus } from '../../api/couple.js';
import { saveCoupleInfo } from '../../utils/couple.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      userInfo: {
        displayName: '',
        displayAvatar: '',
        nickName: ''
      },
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: '',
      stats: [
        { num: 30, label: 'Moment', icon: '◐' },
        { num: 78, label: '图片', icon: '🖼️' },
        { num: 6, label: '视频', icon: '🎬' },
        { num: 590, label: '文字', icon: '✎' }
      ],
      lastUpdate: '15:24',
      menus: [
        { key: 'invite', text: '邀请另一半', icon: '👫' },
        { key: 'memory', text: '恋爱记忆', icon: '💕' },
        { key: 'profile', text: '我的资料', icon: '◎' },
        { key: 'settings', text: '设置', icon: '⚙' },
        { key: 'about', text: '关于应用', icon: 'ℹ' }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      // 将px转换为rpx: rpx = px * 750 / screenWidth
      // 添加20rpx额外间距
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
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
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    // 每次页面显示时重新加载用户信息（从个人资料页面返回时更新）
    this.loadUserInfo();
    // 重新加载情侣信息（从邀请页面返回时更新）
    this.loadCoupleInfo();
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
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          
          // 如果没有设置显示名称，使用微信昵称
          if (!this.userInfo.displayName) {
            this.userInfo.displayName = this.userInfo.nickName || '用户';
          }
          
          // 如果没有设置显示头像，使用微信头像
          if (!this.userInfo.displayAvatar) {
            this.userInfo.displayAvatar = this.userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png';
          }
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
        // 设置默认值
        this.userInfo.displayName = '用户';
        this.userInfo.displayAvatar = '/static/zhuye/lanmei_boy.png';
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
    
    openMenu(key) {
      const map = {
        memory: '恋爱记忆',
        profile: '我的资料',
        settings: '设置',
        about: '关于应用'
      };
      
      // 处理不同的菜单项点击
      if (key === 'invite') {
        // 跳转到邀请页面
        uni.navigateTo({
          url: '/pages/invite/index'
        });
      } else if (key === 'memory') {
        // 跳转到恋爱记忆页面
        uni.navigateTo({
          url: '/pages/jiyi/index'
        });
      } else if (key === 'profile') {
        // 跳转到个人资料页面
        uni.navigateTo({
          url: '/pages/profile/index'
        });
      } else {
        uni.showToast({ title: map[key] + '（待开发）', icon: 'none' });
      }
    }
  }
};
</script>

<style>
.my-page {
  min-height: 100vh;
  background: #F8F0FC;
  padding-bottom: 32rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  background: -webkit-linear-gradient(top, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
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
}

.navbar-icon {
  font-size: 44rpx;
  color: #6B5B95;
  opacity: 0.8;
}
.navbar-icon:active {
  opacity: 0.5;
}

.content-area {
  padding: 20rpx 0;
}

/* 用户信息卡片 */
.profile-card {
  margin: 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  border: 1rpx solid #F3E8FF;
}
.profile-bg {
  position: absolute;
  right: -60rpx;
  top: -40rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 120rpx;
  background: linear-gradient(135deg, rgba(255,143,179,0.15) 0%, rgba(220,199,225,0.12) 100%);
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  background: #F3E8FF;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
  flex-shrink: 0;
}
/* 双人头像样式 */
.couple-avatars {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.couple-avatars .avatar {
  width: 100rpx;
  height: 100rpx;
  border: 3rpx solid #ffffff;
  z-index: 2;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.partner-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  border: 3rpx solid #ffffff;
  margin-left: -20rpx;
  z-index: 1;
  background: #F3E8FF;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
}
.profile-texts { 
  margin-left: 20rpx; 
  flex: 1;
  min-width: 0;
}
.hello { 
  font-size: 32rpx; 
  color: #FF8FB3; 
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.sub { 
  font-size: 26rpx; 
  color: #9B8FB8; 
  font-weight: 400;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 数据统计卡片 */
.stats-card {
  margin: 0 24rpx 24rpx 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx 24rpx 20rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  border: 1rpx solid #F3E8FF;
}
.stat-item {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  width: 25%;
  padding: 16rpx 8rpx;
  box-sizing: border-box;
}
.stat-num { 
  font-size: 40rpx; 
  font-weight: 600; 
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.stat-row { 
  display: flex; 
  align-items: center; 
  gap: 6rpx; 
  margin-top: 8rpx; 
}
.stat-icon { 
  font-size: 26rpx; 
  opacity: 0.8;
}
.stat-label { 
  font-size: 26rpx; 
  color: #9B8FB8; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.stats-footer { 
  margin-top: 16rpx; 
  padding-top: 16rpx;
  border-top: 1rpx solid #F3E8FF;
}
.update { 
  font-size: 24rpx; 
  color: #9B8FB8; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 菜单列表 */
.menu-list {
  margin: 0 24rpx 24rpx 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  border: 1rpx solid #F3E8FF;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx;
  border-bottom: 1rpx solid #F3E8FF;
  transition: background-color 0.2s;
}
.menu-item:last-child { 
  border-bottom: none; 
}
.menu-item:active {
  background-color: rgba(248, 240, 252, 0.5);
  opacity: 0.8;
}
.menu-left { 
  display: flex; 
  align-items: center; 
  gap: 20rpx; 
  flex: 1;
}
.menu-icon {
  width: 48rpx; 
  height: 48rpx; 
  border-radius: 24rpx;
  background: linear-gradient(135deg, #fdf2f8 0%, #F3E8FF 100%); 
  color: #FF8FB3; 
  font-size: 28rpx;
  display: flex; 
  align-items: center; 
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(255,143,179,0.15);
}
.menu-text { 
  font-size: 28rpx; 
  color: #6B5B95; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.menu-arrow { 
  font-size: 36rpx; 
  color: #DCC7E1; 
  font-weight: 300;
  flex-shrink: 0;
}
</style>
