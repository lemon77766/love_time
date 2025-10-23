<template>
  <view class="bottom-nav">
    <navigator
      class="nav-item"
      v-for="(item, idx) in items"
      :key="idx"
      :url="item.url"
    >
      <image class="nav-icon" :src="item.icon" />
      <text class="nav-text">{{ item.text }}</text>
    </navigator>
  </view>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { icon: '/static/love.png', text: '恋爱时光轴', url: '/pages/index/index' },
        { icon: '/static/hudong.png', text: '情侣互动', url: '/pages/hudong/index' },
        { icon: '/static/remerber.png', text: '共同记忆', url: '/pages/jiyi/index' },
        { icon: '/static/we.png', text: '我们', url: '/pages/we/index' }
      ]
    };
  }
};
</script>

<style>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.nav-icon {
  width: 36rpx;
  height: 36rpx;
  object-fit: contain;
}
.nav-text {
  font-size: 24rpx;
  color: #8f8f94;
  margin-top: 10rpx;
}
</style>