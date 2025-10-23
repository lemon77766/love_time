<template>
  <view class="hudong-container">


    <!-- Menu Icons -->
    <view class="menu-list">
      <view class="menu-item" v-for="(m, i) in menuItems" :key="i">
        <image class="menu-icon" :src="m.icon" />
        <text class="menu-text">{{ m.text }}</text>
      </view>
    </view>
    <!-- Card Section -->
    <view class="card-list">
      <view class="card" v-for="(c, i) in cards" :key="i">
        <view class="card-info">
          <text class="card-title">{{ c.title }}</text>
          <text class="card-desc">{{ c.desc }}</text>
          <view class="card-btn" @click="onCardClick(c)">{{ c.btnText }} ▶</view>
        </view>
        <image class="card-img" :src="c.img" />
      </view>
    </view>
    <!-- 共用底部导航 -->

  </view>
</template>

<script>
export default {
  data() {
    return {
      menuItems: [
        { icon: '/static/menu1.png', text: '甜蜜问答' },
        { icon: '/static/menu2.png', text: '恋爱一百件小事' },
        { icon: '/static/menu3.png', text: '心形墙' },
        { icon: '/static/menu4.png', text: '未来情书' }
      ],
      cards: [
        {
          title: '纪念日记录',
          desc: '辅助信息示例文本技术，好处和科学的方法',
          btnText: '立即观看',
          img: '/static/card1.png'
        },
        {
          title: '纪念日查看',
          desc: '科学有效的专业人士的增强效果',
          btnText: '未来情书',
          img: '/static/card2.png'
        }
      ],
      navItems: [
        { icon: '/static/logo.png' },
        { icon: '/static/music.png' },
        { icon: '/static/avatar.png' }
      ]
    };
  },
  methods: {
    onCardClick(card) {
      uni.showToast({ title: card.btnText, icon: 'none' });
    }
  }
};
</script>

<style>
.hudong-container {
  padding: 20rpx;
  background-color: #fff5f7;
  background-color: #fff5f7;
  min-height: 100vh;
  position: relative;
}
.hudong-header { display: none;
  background-color: #fff;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
}
.left-btn .icon-menu {
  font-size: 32rpx;
  color: #333;
}
.header-logo {
  width: 60rpx;
  height: 60rpx;
}
.header-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
}
.welcome-area {
  padding: 20rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
}
.welcome-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}
.welcome-subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}
.menu-list {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background-color: #FF78A6;
  padding: 20rpx;
}
.menu-text {
  font-size: 24rpx;
  color: #333;
  margin-top: 10rpx;
}
.card-list {
  padding: 20rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
  padding: 20rpx;
}
.card {
  background-color: #f7fafb;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
  background-color: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
}
.card-info {
  flex: 1;
}
.card-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.card-desc {
  font-size: 24rpx;
  color: #666;
  margin: 10rpx 0;
}
.card-btn {
  font-size: 24rpx;
  color: #fff;
  background-color: #FF78A6;
  padding: 10rpx 30rpx;
  border-radius: 20rpx;
  display: inline-block;
}
.card-img {
  width: 120rpx;
  height: 120rpx;
  margin-left: 20rpx;
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}
.nav-item .nav-icon {
  width: 60rpx;
  height: 60rpx;
}
</style>