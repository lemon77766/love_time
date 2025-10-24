<template>
  <view class="container">
    <!-- 自定义标题栏 -->
    <view class="custom-title-bar">
      <image class="title-icon" src="/static/zhuye/sun.png" />
      <text class="title-text">记得喝杯水补充能量</text>
      <view class="logout-btn" @click="handleLogout">
        <text class="logout-text">退出</text>
      </view>
    </view>
    <!-- 日期和头像区域 -->
    <view class="date-section">
      <!-- 时间样式容器 -->
      <view class="time-container">
        <!-- 日期数字 -->
        <text class="date-number">23</text>
        <!-- 日期文字 -->
        <view class="date-info">
          <text class="date-text">2025年04月</text>
          <text class="week-text">星期三</text>
        </view>
        <!-- 右侧笑脸图标 -->
        <image class="emoji" src="/static/zhuye/smile.png" />
      </view>
    </view>

    <!-- 情侣信息区域 -->
    <view class="couple-section">
      <view class="couple-content">
        <view class="boy">
          <image class="boy-avatar" src="/static/zhuye/lanmei_boy.png" />
          

        </view>
        <view class="anniversary">
          <text class="anniversary-text">结婚十周年 还有2年10月...</text>
          <view class="progress-bar">
            <view class="progress-fill"></view>
          </view>
        </view>
        <view class="girl">
          <image class="girl-avatar" src="/static/zhuye/orange_smile.png" />

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
      gridItems: [
        { icon: '/static/zhuye/question1.png', text: '甜蜜问答' },
        { icon: '/static/zhuye/100.png', text: '一百事' },
        { icon: '/static/zhuye/yellow_love.png', text: '心形墙' },
        { icon: '/static/zhuye/letter.png', text: '未来情书' },
        { icon: '/static/zhuye/jinian.png', text: '纪念日' },
        { icon: '/static/zhuye/guiji.png', text: '情侣轨迹' },
        { icon: '/static/zhuye/jiudian.png', text: '情侣酒店' },
        { icon: '/static/zhuye/xiangce.png', text: '相册' },
        { icon: '/static/zhuye/xuyuandeng.png', text: '许愿灯' }
      ]
    };
  },
  methods: {
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

/* 自定义标题栏 */
.custom-title-bar {
  display: flex;
  align-items: center;
  padding: 30rpx 30rpx;
  background-color: #f0f0f0;
  border-bottom: 1rpx solid #e5e5e5;
  position: relative;
}

.title-icon {
  width: 90rpx;
  height: 90rpx;
  margin-right: 30rpx;
}

.title-text {
  flex: 1;
  font-size: 35rpx;
  color: #4e3c3c;
  font-weight: 600;
}

.logout-btn {
  padding: 10rpx 24rpx;
  background: rgba(255, 80, 127, 0.1);
  border-radius: 20rpx;
}

.logout-text {
  font-size: 24rpx;
  color: #ff507f;
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
  margin: 20rpx 24rpx;    /* 外边距，让卡片与周围更均衡 */
  padding: 30rpx 40rpx;   /* 内边距更大一些 */
  background-color: #ffffff;
  border-radius: 32rpx;   /* 更明显的圆角 */
  overflow: hidden;       /* 裁剪子元素，确保圆角生效 */
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.06); /* 轻微阴影增加层次 */
}

.couple-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.boy, .girl {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.boy-avatar, .girl-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  margin-bottom: 12rpx;
}

.boy-name, .girl-name {
  font-size: 24rpx;
  color: #333;
}

.anniversary {
  text-align: center;
}

.anniversary-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.progress-bar {
  width: 200rpx;
  height: 8rpx;
  background-color: #e5e5e5;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  width: 70%;
  height: 100%;
  background-color: #2bad81;
  border-radius: 4rpx;
}

/* 九宫格功能区 */
.grid-section {
  padding: 30rpx;
  background-color: #f0f0f0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50rpx 30rpx;
  background-color: #ffffff;
  border-radius: 30rpx;
  border: 1rpx solid #e5e5e5;
}

.grid-icon {
  width: 50rpx;
  height: 50rpx;
  margin-bottom: 15rpx;
}

.grid-text {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}


</style>