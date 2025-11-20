<template>
  <view class="received-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">收信记录</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 信件列表 -->
    <view v-if="letters.length > 0" class="letter-list">
      <view 
        v-for="(letter, index) in letters" 
        :key="letter.id || index"
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
            <text class="meta-item">📝 {{ letter.sentAt || letter.createTime }}</text>
            <view class="meta-item">
              <text class="status-badge status-sent">已收到</text>
            </view>
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
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">📬</text>
      <text class="empty-text">还没有收到的信件</text>
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
                <text class="letter-title" :class="getFontClass(currentLetter)">{{ currentLetter.title }}</text>
                <text class="letter-date" :class="getFontClass(currentLetter)">送达时间：{{ currentLetter.deliveryDate }}</text>
                <text v-if="currentLetter.sentAt" class="letter-date" :class="getFontClass(currentLetter)">收到时间：{{ currentLetter.sentAt }}</text>
              </view>
              
              <view class="letter-body">
                <text class="letter-text" :class="getFontClass(currentLetter)">{{ currentLetter.content }}</text>
              </view>
              
              <view class="letter-footer">
                <text class="letter-info" :class="getFontClass(currentLetter)">—— 来自对方的信</text>
                <text class="letter-time" :class="getFontClass(currentLetter)">创建于 {{ currentLetter.createTime }}</text>
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
import { 
  getReceivedLetters,
  getFutureLetterDetail
} from '@/api/futureLetter.js';

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
    // 加载收到的信件列表
    async loadLetters() {
      try {
        const response = await getReceivedLetters();
        
        const backendLetters = this.extractLetterArray(response);
        this.letters = backendLetters.map(letter => {
          const opacityValue = Number(letter.backgroundOpacity);
          const normalizedOpacity = isNaN(opacityValue)
            ? 100
            : opacityValue <= 1
              ? opacityValue * 100
              : opacityValue;
          const deliveryDateRaw = letter.scheduledDate || letter.deliveryDate;
          const createTimeRaw = letter.createdAt || letter.createTime;
          const sentAtRaw = letter.sentAt;
              
          return {
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: this.formatToMinute(deliveryDateRaw),
            createTime: this.formatToMinute(createTimeRaw),
            sentAt: this.formatToMinute(sentAtRaw),
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: Math.min(100, Math.max(0, normalizedOpacity)),
            fontStyle: letter.fontStyle || letter.font_style || 'default',
            _backendData: letter
          };
        });
      } catch (error) {
        console.error('加载收到的信件失败', error);
        this.letters = [];
        
        // 显示错误提示（非关键错误，不阻塞用户）
        if (error.statusCode !== 401) {
          // 401错误由http.js统一处理，这里不重复提示
          uni.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
        }
      }
    },
    
    // 兼容多种响应结构
    extractLetterArray(response) {
      if (!response) return [];
      
      const candidates = [
        response,
        response?.data,
        response?.letters,
        response?.records,
        response?.items,
        response?.list,
        response?.result,
        response?.body,
        response?.data?.letters,
        response?.data?.records,
        response?.data?.items,
        response?.data?.list,
        response?.data?.result,
        response?.data?.content,
        response?.data?.rows
      ];
      
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
      
      return [];
    },
    
    // 将时间统一格式化到分钟
    formatToMinute(dateInput) {
      if (!dateInput) return '--';
      
      const dateValue = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (Number.isNaN(dateValue.getTime())) {
        return typeof dateInput === 'string' ? dateInput : '--';
      }
      
      const pad = num => (num < 10 ? `0${num}` : `${num}`);
      const year = dateValue.getFullYear();
      const month = pad(dateValue.getMonth() + 1);
      const day = pad(dateValue.getDate());
      const hours = pad(dateValue.getHours());
      const minutes = pad(dateValue.getMinutes());
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    // 从背景图片URL提取样式ID
    getStyleFromBackground(backgroundImage) {
      if (!backgroundImage) return 1;
      // 如果是自定义图片，返回'custom'
      if (backgroundImage.includes('custom') || backgroundImage.startsWith('http')) {
        return 'custom';
      }
      // 从路径中提取样式编号，如 /static/xinxiang/xin1.jpg -> 1
      const match = backgroundImage.match(/xin(\d+)\.jpg/);
      return match ? parseInt(match[1]) : 1;
    },
    
    // 获取信件背景图
    getLetterBackground(letter) {
      if (letter.style === 'custom') {
        return letter.customImage;
      }
      return `/static/xinxiang/xin${letter.style}.jpg`;
    },
    
    // 查看信件详情
    async viewLetter(letter, index) {
      try {
        // 显示加载提示
        uni.showLoading({ title: '加载中...' });
        
        // 调用详情接口获取完整信息
        const response = await getFutureLetterDetail(letter.id);
        
        uni.hideLoading();
        
        // 处理响应数据
        if (response && response.data) {
          const detailData = response.data;
          const detailDeliveryDate = detailData.scheduledDate || detailData.deliveryDate || letter.deliveryDate;
          const detailCreateTime = detailData.createdAt || detailData.createTime || letter.createTime;
          const detailSentAt = detailData.sentAt || letter.sentAt;
          // 合并详情数据到当前信件对象
          this.currentLetter = {
            ...letter,
            ...detailData,
            // 确保字段映射正确
            id: detailData.id || letter.id,
            title: detailData.title || letter.title,
            content: detailData.content || letter.content,
            deliveryDate: this.formatToMinute(detailDeliveryDate),
            createTime: this.formatToMinute(detailCreateTime),
            sentAt: this.formatToMinute(detailSentAt),
            status: detailData.status || letter.status,
            style: this.getStyleFromBackground(detailData.backgroundImage || letter.backgroundImage),
            customImage: detailData.backgroundImage || letter.customImage,
            opacity: detailData.opacity !== undefined ? detailData.opacity : (letter.opacity || 100),
            fontStyle: detailData.fontStyle || detailData.font_style || letter.fontStyle || 'default',
            _backendData: detailData
          };
        } else {
          // 如果详情接口失败，使用列表数据
          this.currentLetter = letter;
        }
        
        this.currentIndex = index;
        this.showDetailModal = true;
      } catch (error) {
        uni.hideLoading();
        console.error('获取信件详情失败', error);
        
        // 如果详情接口失败，使用列表数据作为降级方案
        this.currentLetter = letter;
        this.currentIndex = index;
        this.showDetailModal = true;
        
        // 显示错误提示（非阻塞）
        uni.showToast({
          title: '加载详情失败，显示基本信息',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 获取字体样式类
    getFontClass(letter) {
      if (!letter) return 'font-style-default';
      const fontStyle = letter.fontStyle || letter.font_style || 'default';
      return `font-style-${fontStyle}`;
    },
    
    // 关闭详情弹窗
    closeDetail() {
      this.showDetailModal = false;
      this.currentLetter = null;
      this.currentIndex = -1;
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
  background-color: #FFFAF4;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
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
  color: #4A4A4A;
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
  color: #4A4A4A;
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

.received-page {
  min-height: 100vh;
  background: #FFFAF4;
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
  border: 1rpx solid #FFE6D0;
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
  background: rgba(255, 181, 194, 0.9);
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
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #888888;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.status-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 600;
  margin-top: 8rpx;
}

.status-sent {
  background: #D4EDDA;
  color: #155724;
}

.card-preview-content {
  margin-top: 8rpx;
  padding: 16rpx;
  background: #FFFAF4;
  border-radius: 12rpx;
  border: 1rpx solid #FFE6D0;
}

.preview-text {
  font-size: 26rpx;
  color: #888888;
  line-height: 1.6;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1rpx solid #FFE6D0;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  transition: background 0.3s;
}

.action-btn.view {
  color: #FFB5C2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.action-btn:active {
  background: #FFFAF4;
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
  color: #888888;
  font-weight: 400;
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
  color: #4A4A4A;
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
  color: #4A4A4A;
}

.letter-date {
  font-size: 24rpx;
  color: #888888;
  font-weight: 400;
}

.letter-body {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 32rpx;
}

.letter-text {
  font-size: 28rpx;
  line-height: 2;
  color: #4A4A4A;
  white-space: pre-wrap;
  word-break: break-all;
  font-weight: 400;
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
  color: #888888;
  font-weight: 400;
}

.letter-time {
  font-size: 22rpx;
  color: #888888;
  margin-top: 8rpx;
  font-weight: 400;
}

/* 字体样式类 */
.font-style-default {
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0;
}

.font-style-mashanzheng {
  font-family: 'MaShanZheng', 'Ma Shan Zheng', 'KaiTi', cursive;
  letter-spacing: 2rpx;
}

.font-style-zcoolkuaile {
  font-family: 'ZCOOLKuaiLe', 'ZCOOL KuaiLe', 'KaiTi', cursive;
  letter-spacing: 1rpx;
}

.font-style-qingsong {
  font-family: 'QingSong', 'KaiTi', 'STKaiti', cursive;
  letter-spacing: 1.5rpx;
}

.font-style-zcoolxiaowei {
  font-family: 'ZCOOLXiaoWei', 'ZCOOL XiaoWei', 'KaiTi', cursive;
  letter-spacing: 1rpx;
}

.font-style-zcoolwenyi {
  font-family: 'ZCOOLWenYi', 'ZCOOL WenYi', 'KaiTi', cursive;
  letter-spacing: 1.5rpx;
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
  background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #3d2a00;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>

