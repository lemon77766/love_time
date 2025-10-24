<template>
  <view class="hudong-container">
    <!-- Time Display -->
    <view class="time-section">
      <view class="time-content">
        <view class="time-text">
          <text class="current-date">{{ currentDate }}</text>
          <text class="current-time">{{ currentTime }}</text>
        </view>
        <image class="time-image" src="/static/hudong/smile.webp" />
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

    <!-- Menu Icons -->
    <view class="menu-list">
      <view class="menu-item" v-for="(m, i) in menuItems" :key="i">
        <image class="menu-icon" :src="m.icon" />
        <text class="menu-text">{{ m.text }}</text>
      </view>
    </view>
    <!-- 共用底部导航 -->

  </view>
</template>

<script>
export default {
  data() {
    return {
      currentDate: '',
      currentTime: '',
		cards: [
		  {
		    title: '纪念日记录',
		    desc: '记录我们的每一次特别时刻',
		    btnText: '立即记录',
		    img: '/static/hudong/jinian1.png'
		  }
		],
      menuItems: [
        { icon: '/static/hudong/question.png', text: '甜蜜问答' },
        { icon: '/static/hudong/100.png', text: '恋爱一百件小事' },
        { icon: '/static/hudong/xinqiang.png', text: '心形墙' },
        { icon: '/static/hudong/letter.png', text: '未来情书' }
      ],

      navItems: [
        { icon: '/static/logo.png' },
        { icon: '/static/music.png' },
        { icon: '/static/avatar.png' }
      ]
    };
  },
  mounted() {
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    updateTime() {
      const now = new Date();
      this.currentDate = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.currentTime = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    onCardClick(card) {
      uni.showToast({ title: card.btnText, icon: 'none' });
    }
  }
};
</script>

<style>
.hudong-container {
  padding: 20rpx;
  background-color: #f5f5f7;
  min-height: 100vh;
  position: relative;
}
.time-section {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.time-content {
  display: flex;
  align-items: center;
  justify-content: center;
}
.time-image {
  width: 80rpx;
  height: 80rpx;
  margin-left: 20rpx;
}
.time-text {
  text-align: left;
}
.current-date {
  display: block;
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 10rpx;
}
.current-time {
  display: block;
  font-size: 28rpx;
  color: #2bad81;
}
.hudong-header {
  display: none;
  background-color: #fff;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  justify-content: space-between;
  align-items: center;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 30rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 15rpx;
  background-color: #f8f9fa;
}
.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
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
.card {
  background-color: #f7fafb;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.08);
  min-height: 200rpx;
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
  background-color: #ffffff;
  padding: 10rpx 30rpx;
  border-radius: 20rpx;
  display: inline-block;
}
.card-img {
  width: 120rpx;
  height: 120rpx;
  margin-left: 20rpx;
}
</style>