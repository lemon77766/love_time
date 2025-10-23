<template>
  <view class="container">
    <view class="nav-placeholder"></view>
    <view class="content">
      <text class="title">共同记忆</text>
      <!-- 在此添加共同记忆页面内容 -->
    </view>
    
  </view>
</template>

<script>
import BottomNav from '../../components/BottomNav.vue';

export default {
  components: { BottomNav },
  components: { BottomNav }
};
</script>

<style>
.container {
  position: relative;
  min-height: 100vh;
  padding-top: 100rpx;
  background-color: #fff5f7;
}
.nav-placeholder {
  height: 100rpx;
}
.content {
  padding: 20rpx;
}
.title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}
</style>