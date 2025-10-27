<template>
  <view class="history-page">
    <!-- 顶部栏（系统风格简洁） -->

    <!-- 分隔与徽标 -->
    <view class="divider-row">
      <view class="divider"></view>
      <text class="heart">💚</text>
      <view class="divider"></view>
    </view>

    <!-- 历史列表 -->
    <view class="list">
      <view v-for="(item, i) in history" :key="i" class="list-item" @click="openItem(item)">
        <view class="left">
          <text class="index">{{ pad2(i + 1) }}</text>
        </view>
        <view class="center">
          <text class="question">{{ item.question }}</text>
        </view>
        <view class="right">
          <view class="status" :class="item.myAnswer ? 'done' : 'todo'"></view>
        </view>
      </view>
      <view v-if="history.length === 0" class="empty">
        <text class="empty-text">暂无历史记录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return { history: [] };
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    loadHistory() {
      try {
        const data = uni.getStorageSync('qna_history');
        const list = Array.isArray(data) ? data : [];
        // 从新到旧排序（顶部最新）
        this.history = list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      } catch (e) { this.history = []; }
    },
    pad2(n) { return String(n).padStart(2, '0'); },
    openItem(item) {
      const qid = encodeURIComponent(item.questionId);
      const time = encodeURIComponent(item.time || '');
      uni.navigateTo({ url: `/pages/qna/index?qid=${qid}&time=${time}` });
    }
  }
};
</script>

<style>
.history-page { min-height: 100vh; background: #ffffff; }
.topbar { position: relative; height: 96rpx; display: flex; align-items: center; justify-content: center; background: #ffffff; }
.topbar-title { font-size: 32rpx; color: #2b2b2b; font-weight: 600; }
.topbar-actions { position: absolute; right: 24rpx; top: 50%; transform: translateY(-50%); display: flex; gap: 12rpx; }
.icon-btn { width: 64rpx; height: 64rpx; border-radius: 32rpx; background: #f7f7f7; color: #2bad81; font-size: 28rpx; display: flex; align-items: center; justify-content: center; }

.divider-row { margin: 12rpx 24rpx; display: flex; align-items: center; gap: 16rpx; }
.divider { flex: 1; height: 2rpx; background: #e8f5f1; }
.heart { color: #2bad81; font-size: 26rpx; }

.list { padding: 12rpx 24rpx; }
.list-item { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.list-item:last-child { border-bottom: none; }
.left { width: 64rpx; }
.index { font-size: 30rpx; color: #2bad81; font-weight: 700; }
.center { flex: 1; }
.question { font-size: 28rpx; color: #2b2b2b; }
.right { width: 60rpx; display: flex; justify-content: flex-end; }
.status { width: 32rpx; height: 32rpx; border-radius: 16rpx; border: 3rpx solid #2bad81; }
.status.done { background: #2bad81; }
.status.todo { background: #ffffff; }

.empty { padding: 40rpx; display: flex; justify-content: center; }
.empty-text { color: #9aa0a6; font-size: 26rpx; }
</style>
