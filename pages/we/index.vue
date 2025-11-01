<template>
  <view class="my-page">
    <!-- 用户信息区 -->
    <view class="profile-card">
      <view class="profile-bg"></view>
      <image class="avatar" :src="userInfo.displayAvatar" mode="aspectFill" />
      <view class="profile-texts">
        <text class="hello">Hi, {{ userInfo.displayName }}</text>
        <text class="sub">甜蜜时光 一起陪伴你走过 111 天</text>
      </view>
      <!-- 功能按钮 -->
      <view class="profile-actions">
        <button class="icon-btn" @click="onMenu">⋯</button>
        <button class="icon-btn" @click="onScan">📷</button>
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
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        displayName: '',
        displayAvatar: '',
        nickName: ''
      },
      stats: [
        { num: 30, label: 'Moment', icon: '◐' },
        { num: 78, label: '图片', icon: '🖼️' },
        { num: 6, label: '视频', icon: '🎬' },
        { num: 590, label: '文字', icon: '✎' }
      ],
      lastUpdate: '15:24',
      menus: [
        { key: 'memory', text: '恋爱记忆', icon: '💕' },
        { key: 'profile', text: '我的资料', icon: '◎' },
        { key: 'settings', text: '设置', icon: '⚙' },
        { key: 'about', text: '关于应用', icon: 'ℹ' }
      ]
    };
  },
  
  onLoad() {
    this.loadUserInfo();
  },
  
  onShow() {
    // 每次页面显示时重新加载用户信息（从个人资料页面返回时更新）
    this.loadUserInfo();
  },
  methods: {
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
    
    onMenu() {
      uni.showActionSheet({
        itemList: ['设置', '主题', '关于'],
        success: () => {}
      });
    },
    
    onScan() {
      uni.showToast({ title: '打开相机/扫描（示例）', icon: 'none' });
    },
    
    openMenu(key) {
      const map = {
        memory: '恋爱记忆',
        profile: '我的资料',
        settings: '设置',
        about: '关于应用'
      };
      
      // 处理不同的菜单项点击
      if (key === 'memory') {
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
  background: #f5f6f7;
  padding-bottom: 32rpx;
}

/* 功能按钮 */
.profile-actions {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 16rpx;
}
.icon-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: #fdf2f8;
  color: #ff8fb3;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 用户信息卡片 */
.profile-card {
  margin: 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.profile-bg {
  position: absolute;
  right: -60rpx;
  top: -40rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 120rpx;
  background: rgba(255,143,179,0.12);
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  background: #f7f9f8;
}
.profile-texts { margin-left: 20rpx; }
.hello { font-size: 32rpx; color: #ff8fb3; font-weight: 700; }
.sub { margin-top: 6rpx; font-size: 24rpx; color: #7a7a7a; }

/* 数据统计卡片 */
.stats-card {
  margin: 0 24rpx 24rpx 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 20rpx 24rpx 10rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}
.stat-item {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  width: 25%;
  padding: 16rpx 8rpx;
}
.stat-num { font-size: 36rpx; font-weight: 700; color: #2b2b2b; }
.stat-row { display: flex; align-items: center; gap: 8rpx; margin-top: 6rpx; }
.stat-icon { font-size: 24rpx; color: #ff8fb3; }
.stat-label { font-size: 24rpx; color: #666; }
.stats-footer { margin-top: 8rpx; }
.update { font-size: 22rpx; color: #9aa0a6; }

/* 菜单列表 */
.menu-list {
  margin: 0 24rpx 24rpx 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.menu-item:last-child { border-bottom: none; }
.menu-left { display: flex; align-items: center; gap: 16rpx; }
.menu-icon {
  width: 40rpx; height: 40rpx; border-radius: 20rpx;
  background: #fdf2f8; color: #ff8fb3; font-size: 24rpx;
  display: flex; align-items: center; justify-content: center;
}
.menu-text { font-size: 28rpx; color: #333; }
.menu-arrow { font-size: 34rpx; color: #b6b6b6; }
</style>
