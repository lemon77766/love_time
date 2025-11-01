<template>
  <view class="history-page">
    <!-- 信件列表 -->
    <view v-if="letters.length > 0" class="letter-list">
      <view 
        v-for="(letter, index) in letters" 
        :key="index"
        class="letter-card"
        @click="viewLetter(letter, index)"
      >
        <!-- 缩略图预览 -->
        <view class="card-preview">
          <image 
            class="preview-bg" 
            :src="getLetterBackground(letter)" 
            mode="aspectFill"
          ></image>
          <view class="preview-overlay" :style="{ opacity: 1 - letter.opacity / 100 }"></view>
          <view class="preview-badge">
            <text class="badge-text">{{ letter.style === 'custom' ? '自定义' : '样式' + letter.style }}</text>
          </view>
        </view>

        <!-- 信件信息 -->
        <view class="card-info">
          <text class="card-title">{{ letter.title }}</text>
          <view class="card-meta">
            <text class="meta-item">📅 送达: {{ letter.deliveryDate }}</text>
            <text class="meta-item">📝 {{ letter.createTime }}</text>
          </view>
          <view class="card-preview-content">
            <text class="preview-text">{{ letter.content.slice(0, 50) }}{{ letter.content.length > 50 ? '...' : '' }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="card-actions">
          <view class="action-btn view" @click.stop="viewLetter(letter, index)">
            <text>👁️ 查看</text>
          </view>
          <view class="action-btn delete" @click.stop="confirmDelete(index)">
            <text>🗑️ 删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">✉️</text>
      <text class="empty-text">还没有写过信件</text>
      <button class="write-btn" @click="goWrite">写第一封信</button>
    </view>

    <!-- 信件详情弹窗 -->
    <view v-if="showDetailModal" class="detail-modal-overlay" @click="closeDetail">
      <view class="detail-modal-content" @click.stop>
        <text class="detail-modal-title">信件详情</text>
        
        <!-- 信件融合预览 -->
        <view class="letter-detail">
          <view class="letter-wrapper">
            <!-- 底图层 -->
            <image 
              class="letter-bg" 
              :src="getLetterBackground(currentLetter)" 
              mode="aspectFill"
            ></image>
            
            <!-- 透明度遮罩 -->
            <view class="letter-overlay" :style="{ opacity: 1 - currentLetter.opacity / 100 }"></view>
            
            <!-- 信件内容层 -->
            <view class="letter-content">
              <view class="letter-header">
                <text class="letter-title">{{ currentLetter.title }}</text>
                <text class="letter-date">送达时间：{{ currentLetter.deliveryDate }}</text>
              </view>
              
              <view class="letter-body">
                <text class="letter-text">{{ currentLetter.content }}</text>
              </view>
              
              <view class="letter-footer">
                <text class="letter-info">收件人：{{ currentLetter.phone.slice(0, 3) }}****{{ currentLetter.phone.slice(-4) }}</text>
                <text class="letter-info" v-if="currentLetter.wechat">微信：{{ currentLetter.wechat }}</text>
                <text class="letter-time">创建于 {{ currentLetter.createTime }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="detail-modal-actions">
          <button class="detail-modal-btn close" @click="closeDetail">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      letters: [],
      showDetailModal: false,
      currentLetter: null,
      currentIndex: -1
    };
  },
  onLoad() {
    this.loadLetters();
  },
  onShow() {
    this.loadLetters();
  },
  methods: {
    // 加载信件列表
    loadLetters() {
      try {
        const letters = uni.getStorageSync('xinxiang_letters') || [];
        this.letters = letters;
      } catch (e) {
        console.error('加载信件失败', e);
        this.letters = [];
      }
    },
    
    // 获取信件背景图
    getLetterBackground(letter) {
      if (letter.style === 'custom') {
        return letter.customImage;
      }
      return `/static/xinxiang/xin${letter.style}.jpg`;
    },
    
    // 查看信件详情
    viewLetter(letter, index) {
      this.currentLetter = letter;
      this.currentIndex = index;
      this.showDetailModal = true;
    },
    
    // 关闭详情弹窗
    closeDetail() {
      this.showDetailModal = false;
      this.currentLetter = null;
      this.currentIndex = -1;
    },
    
    // 确认删除
    confirmDelete(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这封信件吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteLetter(index);
          }
        }
      });
    },
    
    // 删除信件
    deleteLetter(index) {
      try {
        this.letters.splice(index, 1);
        uni.setStorageSync('xinxiang_letters', this.letters);
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' });
      }
    },
    
    // 去写信
    goWrite() {
      uni.navigateTo({ url: '/pages/xinxiang/create' });
    }
  }
};
</script>

<style>
.history-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

/* 信件列表 */
.letter-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.letter-card {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

/* 缩略图预览 */
.card-preview {
  position: relative;
  width: 100%;
  height: 240rpx;
  overflow: hidden;
}

.preview-bg {
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.preview-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: rgba(255, 143, 179, 0.9);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.badge-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

/* 卡片信息 */
.card-info {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #666;
}

.card-preview-content {
  margin-top: 8rpx;
  padding: 16rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.preview-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  transition: background 0.3s;
}

.action-btn.view {
  color: #ff8fb3;
  border-right: 1rpx solid #f0f0f0;
}

.action-btn.delete {
  color: #ff4444;
}

.action-btn:active {
  background: #f5f5f5;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.write-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 600;
}

/* 详情弹窗 */
.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.detail-modal-content {
  width: 90%;
  max-width: 650rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.detail-modal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.letter-detail {
  flex: 1;
  overflow: hidden;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.letter-wrapper {
  position: relative;
  width: 100%;
  height: 800rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.letter-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.letter-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
  z-index: 1;
}

.letter-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  z-index: 2;
  box-sizing: border-box;
}

.letter-header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 40rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.1);
}

.letter-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.letter-date {
  font-size: 24rpx;
  color: #666;
}

.letter-body {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 32rpx;
}

.letter-text {
  font-size: 28rpx;
  line-height: 2;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.letter-footer {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid rgba(0, 0, 0, 0.1);
}

.letter-info {
  font-size: 24rpx;
  color: #666;
}

.letter-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.detail-modal-actions {
  display: flex;
  gap: 16rpx;
}

.detail-modal-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.detail-modal-btn.close {
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  color: #ffffff;
}
</style>
