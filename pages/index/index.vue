<template>
  <view class="container">
    <!-- 日期和头像区域 -->
    <view class="date-section">
      <!-- 时间样式容器 -->
      <view class="time-container">
        <!-- 日期数字 -->
        <text class="date-number">{{ currentDay }}</text>
        <!-- 日期文字 -->
        <view class="date-info">
          <text class="date-text">{{ currentYearMonth }}</text>
          <text class="week-text">{{ currentWeek }}</text>
        </view>
        <!-- 右侧笑脸图标 -->
        <image class="emoji" src="/static/zhuye/smile.png" />
      </view>
    </view>

    <!-- 情侣信息区域 -->
    <view class="couple-section">
      <view class="couple-content">
        <view class="boy">
          <!-- 显示静态头像 -->
          <image class="boy-avatar" src="/static/zhuye/lanmei_boy.png" mode="aspectFill" />
          <!-- 显示静态昵称 -->
          <text class="boy-name">蓝梅</text>
        </view>
        <view class="anniversary">
          <text class="anniversary-text">结婚十周年 还有2年10月...</text>
          <view class="progress-bar">
            <view class="progress-fill"></view>
          </view>
        </view>
        <view class="girl">
          <image class="girl-avatar" src="/static/zhuye/orange_smile.png" />
          <text class="girl-name">甜蜜</text>
        </view>
      </view>
    </view>

    <!-- 九宫格功能区 -->
    <view class="grid-section">
      <view class="grid-container">
        <view class="grid-item" v-for="(item, index) in gridItems" :key="index" @click="openGrid(item)">
          <image class="grid-icon" :src="item.icon" />
          <text class="grid-text">{{ item.text }}</text>
        </view>
      </view>
    </view>


  </view>
</template>

<script>
import { logout } from '@/utils/auth.js';

export default {
  data() {
    return {
      currentTab: 'home',
      currentDay: '',
      currentYearMonth: '',
      currentWeek: '',
      timer: null,
      gridItems: [
        { icon: '/static/zhuye/question1.png', text: '甜蜜问答' },
        { icon: '/static/zhuye/100.png', text: '一百事' },
        { icon: '/static/zhuye/yellow_love.png', text: '心形墙' },
        { icon: '/static/zhuye/letter.png', text: '未来情书' }
      ]
    };
  },
  onLoad() {
    this.updateDateTime();
    // 每分钟更新一次时间
    this.timer = setInterval(() => {
      this.updateDateTime();
    }, 60000);
  },
  onUnload() {
    // 页面卸载时清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    updateDateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = now.getDate();
      const weekDay = now.getDay();
      
      const weekNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      
      this.currentDay = day;
      this.currentYearMonth = `${year}年${month}月`;
      this.currentWeek = weekNames[weekDay];
    },
    switchTab(tab) {
      this.currentTab = tab;
    },
    openGrid(item) {
      if (item.text === '甜蜜问答') {
        uni.navigateTo({ url: '/pages/qna/index' });
      } else if (item.text === '一百事') {
        uni.navigateTo({ url: '/pages/hundred/index' });
      } else if (item.text === '心形墙') {
        uni.navigateTo({ url: '/pages/heartwall/index' });
      } else if (item.text === '未来情书') {
        uni.navigateTo({ url: '/pages/xinxiang/index' });
      } else {
        uni.showToast({ title: item.text + '（待开发）', icon: 'none' });
      }
    },
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            logout();
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 1500
            });
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/index'
              });
            }, 1500);
          }
        }
      });
    }
  }
};
</script>

<style>
.container {
  background-color: #f0f0f0;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 日期区域背景样式 */
.date-section {
  background-color: #f0f0f0;
  padding: 3rpx;
  border-radius: 15rpx;
}

/* 时间样式容器 */
.time-container {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-family: "Microsoft YaHei", sans-serif;
  background-color: #f0f0f0;
  padding: 3rpx;
  border-radius: 15rpx;
  margin-left: 20rpx;
}

/* 日期数字：大号字体、绿色、加粗 */
.date-number {
  font-size: 96rpx;
  font-weight: bold;
  color: #2ecc71;
}

/* 日期文字与表情的容器：纵向排列 */
.date-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 日期文字：调小字体 */
.date-text {
  font-size: 5rpx;
  color: #333;
  line-height: 1.5;
}

/* 星期文字：更大更粗 */
.week-text {
  font-size: 40rpx;
  color: #333;
  line-height: 1.5;
  font-weight: 700;
}

/* 表情图标：调大 */
.emoji {
  width: 250rpx;
  height: 250rpx;
  margin-top: 10rpx;
}

/* 通知栏样式 */
.notification {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #f8f9fa;
  border-bottom: 1rpx solid #e5e5e5;
}

.sun-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
}

.notification-text {
  font-size: 28rpx;
  color: #666;
}

/* 日期和头像区域 */
.date-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3rpx;
  background-color: #f0f0f0;
}

.date-text {
  font-size: 36rpx;
  color: #333;
}

.green-date {
  font-size: 48rpx;
  color: #2bad81;
  font-weight: bold;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #ffd700;
}

/* 情侣信息区域 */
.couple-section {
  margin: 30rpx 16rpx;    /* 增大外边距 */
  padding: 40rpx 30rpx;   /* 增大内边距 */
  background-color: #ffffff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06);
}

.couple-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;    /* 增大内边距 */
}

.boy, .girl {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.boy-avatar, .girl-avatar {
  width: 140rpx;    /* 从100rpx增大到140rpx */
  height: 140rpx;
  border-radius: 70rpx;
  margin-bottom: 16rpx;    /* 增大间距 */
}

.boy-name, .girl-name {
  font-size: 24rpx;
  color: #333;
}

.anniversary {
  text-align: center;
  flex: 1;
}

.anniversary-text {
  font-size: 28rpx;    /* 从24rpx增大到28rpx */
  color: #333;
  margin-bottom: 16rpx;    /* 增大间距 */
  display: block;
  font-weight: 600;
}

.progress-bar {
  width: 220rpx;    /* 从180rpx增大到220rpx */
  height: 8rpx;    /* 从6rpx增大到8rpx */
  background-color: #e5e5e5;
  border-radius: 4rpx;
  overflow: hidden;
  margin: 0 auto;
}

.progress-fill {
  width: 70%;
  height: 100%;
  background-color: #2bad81;
  border-radius: 4rpx;
}

/* 九宫格功能区 */
.grid-section {
  padding: 30rpx 20rpx;
  background-color: #f0f0f0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  max-width: 600rpx;
  margin: 0 auto;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 24rpx;
  border: 1rpx solid #e8e8e8;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.grid-item:active {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.grid-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
  transition: transform 0.3s ease;
}

.grid-item:active .grid-icon {
  transform: scale(1.1);
}

.grid-text {
  font-size: 28rpx;
  color: #333;
  text-align: center;
  font-weight: 600;
}


</style>