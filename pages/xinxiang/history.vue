<template>
  <view class="history-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">信件记录</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

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
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      letters: [],
      showDetailModal: false,
      currentLetter: null,
      currentIndex: -1
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadLetters();
  },
  onShow() {
    this.loadLetters();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      // #ifdef MP-WEIXIN
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      this.navBarHeight = 44;
      // #endif
    },
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
/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #F8F0FC;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: linear-gradient(180deg, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
  background: -webkit-linear-gradient(top, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
}

.status-bar {
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 50rpx;
  font-weight: 600;
  color: #6B5B95;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.3s;
}

.back-icon:active {
  opacity: 0.6;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-page {
  min-height: 100vh;
  background: #F8F0FC;
  padding: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #F3E8FF;
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
  background: rgba(220, 199, 225, 0.9);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.badge-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 卡片信息 */
.card-info {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-preview-content {
  margin-top: 8rpx;
  padding: 16rpx;
  background: #F8F0FC;
  border-radius: 12rpx;
  border: 1rpx solid #F3E8FF;
}

.preview-text {
  font-size: 26rpx;
  color: #9B8FB8;
  line-height: 1.6;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1rpx solid #F3E8FF;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  transition: background 0.3s;
}

.action-btn.view {
  color: #DCC7E1;
  border-right: 1rpx solid #F3E8FF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.action-btn.delete {
  color: #ff6b6b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.action-btn:active {
  background: #F8F0FC;
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
  color: #9B8FB8;
  margin-bottom: 40rpx;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.write-btn {
  padding: 20rpx 60rpx;
  background: #DCC7E1;
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-date {
  font-size: 24rpx;
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-body {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 32rpx;
}

.letter-text {
  font-size: 28rpx;
  line-height: 2;
  color: #6B5B95;
  white-space: pre-wrap;
  word-break: break-all;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-time {
  font-size: 22rpx;
  color: #9B8FB8;
  margin-top: 8rpx;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
