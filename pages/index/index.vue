<template>
  <view class="container">

    <view class="profile">
      <image class="avatar" src="/static/logo.png"></image>
      <text class="names">小明 & 小红</text>
    </view>
    <view class="timeline">
      <view class="timeline-item" v-for="(item, index) in events" :key="index">
        <view class="dot"></view>
        <view class="item-content">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-date">{{ item.date }}</text>
          <view class="tags">
            <text class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</text>
          </view>
        </view>
      </view>
    </view>
    <view class="fab" @click="onFabClick">⭐</view>


  </view>
</template>

<script>
export default {
  data() {
    return {
      events: [
        { title: '初识', date: '2023-01-15', tags: ['第一次聊天', '互相加微信'] },
        { title: '暖昧期', date: '2023-02-20', tags: ['第一次约会', '一起看电影'] },
        { title: '告白', date: '2023-04-10', tags: ['公园告白成功', '第一次牵手'] },
        { title: '确定关系', date: '2023-05-01', tags: ['正式成为情侣', '第一次拥抱'] }
      ]
    };
  },
  methods: {
    onFabClick() {
      uni.showToast({ title: '许愿灯', icon: 'none' });
    }
  }
};
</script>

<style>
.container {
  position: relative;
  background-color: #fff5f7;
  min-height: 100vh;
  padding-bottom: 120rpx;
}
.header {
  padding-top: 40rpx;
  padding-bottom: 20rpx;
  background-color: #fff5f7;
  display: flex;
  justify-content: center;
}
.header-title {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}
.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30rpx;
}
.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 75rpx;
  border: 4rpx solid #fff;
}
.names {
  font-size: 32rpx;
  color: #FF78A6;
  margin-top: 20rpx;
}
.timeline {
  margin: 40rpx 30rpx;
}
.timeline-item {
  display: flex;
  margin-bottom: 40rpx;
}
.dot {
  width: 20rpx;
  height: 20rpx;
  background-color: #FF78A6;
  border-radius: 10rpx;
  margin-right: 20rpx;
  margin-top: 5rpx;
}
.item-content {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  flex: 1;
}
.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}
.item-date {
  font-size: 24rpx;
  color: #8f8f94;
  margin-top: 10rpx;
}
.tags {
  display: flex;
  margin-top: 20rpx;
}
.tag {
  font-size: 24rpx;
  color: #666;
  background-color: #f8f8f8;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  margin-right: 20rpx;
}
.fab {
  position: fixed;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #FF78A6;
  color: #fff;
  font-size: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  bottom: 200rpx;
  right: 40rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.2);
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120rpx;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1rpx solid #e5e5e5;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.nav-icon {
  width: 36rpx;
  height: 36rpx;
  font-size: 36rpx;
  color: #8f8f94;
  object-fit: contain;
}
.nav-text {
  font-size: 24rpx;
  color: #8f8f94;
  margin-top: 10rpx;
}
</style>