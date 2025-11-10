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
          <text class="title-text">写信记录</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 分类标签 -->
    <view class="category-tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        <text>全部</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'unsent' }"
        @click="switchTab('unsent')"
      >
        <text>未发送</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'sent' }"
        @click="switchTab('sent')"
      >
        <text>已发送</text>
      </view>
    </view>

    <!-- 信件列表 -->
    <view v-if="filteredLetters.length > 0" class="letter-list">
      <view 
        v-for="(letter, index) in filteredLetters" 
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
            <text class="meta-item">📝 {{ letter.createTime }}</text>
            <view class="meta-item">
              <text class="status-badge" :class="getStatusClass(letter.status)">
                {{ getStatusText(letter.status) }}
              </text>
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
          <view class="action-btn delete" @click.stop="confirmDelete(letter, index)">
            <text>🗑️ 删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">✉️</text>
      <text class="empty-text">{{ emptyText }}</text>
      <button v-if="activeTab !== 'sent'" class="write-btn" @click="goWrite">写第一封信</button>
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
                <text class="letter-info">—— 给未来的你</text>
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
import { 
  getFutureLetterList, 
  getSentLetters,
  deleteFutureLetter,
  getFutureLetterDetail
} from '@/api/futureLetter.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      letters: [],
      sentLetters: [],
      activeTab: 'all',
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
    },
    filteredLetters() {
      if (this.activeTab === 'all') {
        return [...this.letters, ...this.sentLetters];
      } else if (this.activeTab === 'unsent') {
        return this.letters;
      } else if (this.activeTab === 'sent') {
        return this.sentLetters;
      }
      return [];
    },
    emptyText() {
      if (this.activeTab === 'sent') {
        return '还没有已发送的信件';
      } else if (this.activeTab === 'unsent') {
        return '还没有未发送的信件';
      }
      return '还没有写过信件';
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
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab;
    },
    
    // 加载信件列表
    async loadLetters() {
      try {
        // 加载未发送的信件（草稿和已安排）
        const response = await getFutureLetterList();
        
        if (response && response.data) {
          // 转换后端数据格式为前端显示格式
          const backendLetters = Array.isArray(response.data) ? response.data : [];
          this.letters = backendLetters
            .filter(letter => letter.status !== 'SENT') // 过滤掉已发送的
            .map(letter => ({
              id: letter.id,
              title: letter.title,
              content: letter.content,
              deliveryDate: letter.scheduledDate, // 后端字段名
              createTime: letter.createdAt || letter.createTime,
              status: letter.status,
              style: this.getStyleFromBackground(letter.backgroundImage),
              customImage: letter.backgroundImage,
              opacity: 100, // 默认透明度
              // 保留后端原始数据
              _backendData: letter
            }));
        } else {
          // 如果后端没有数据，尝试从本地存储加载（兼容旧数据）
          const localLetters = uni.getStorageSync('xinxiang_letters') || [];
          this.letters = localLetters.filter(letter => letter.status !== 'SENT');
        }
      } catch (error) {
        console.error('加载信件失败', error);
        // 如果API调用失败，尝试从本地存储加载（降级方案）
        try {
          const localLetters = uni.getStorageSync('xinxiang_letters') || [];
          this.letters = localLetters.filter(letter => letter.status !== 'SENT');
        } catch (e) {
          console.error('加载本地信件失败', e);
          this.letters = [];
        }
        
        // 显示错误提示（非关键错误，不阻塞用户）
        if (error.statusCode !== 401) {
          // 401错误由http.js统一处理，这里不重复提示
          console.warn('从后端加载信件失败，使用本地数据');
        }
      }
      
      // 加载已发送的信件
      try {
        const sentResponse = await getSentLetters();
        if (sentResponse && sentResponse.data) {
          const backendSentLetters = Array.isArray(sentResponse.data) ? sentResponse.data : [];
          this.sentLetters = backendSentLetters.map(letter => ({
            id: letter.id,
            title: letter.title,
            content: letter.content,
            deliveryDate: letter.scheduledDate,
            createTime: letter.createdAt || letter.createTime,
            sentAt: letter.sentAt,
            status: letter.status,
            style: this.getStyleFromBackground(letter.backgroundImage),
            customImage: letter.backgroundImage,
            opacity: 100,
            _backendData: letter
          }));
        }
      } catch (error) {
        console.error('加载已发送信件失败', error);
        if (error.statusCode !== 401) {
          console.warn('从后端加载已发送信件失败');
        }
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'DRAFT': '草稿',
        'SCHEDULED': '已安排',
        'SENT': '已发送'
      };
      return statusMap[status] || status;
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        'DRAFT': 'status-draft',
        'SCHEDULED': 'status-scheduled',
        'SENT': 'status-sent'
      };
      return classMap[status] || '';
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
          // 合并详情数据到当前信件对象
          this.currentLetter = {
            ...letter,
            ...detailData,
            // 确保字段映射正确
            id: detailData.id || letter.id,
            title: detailData.title || letter.title,
            content: detailData.content || letter.content,
            deliveryDate: detailData.scheduledDate || detailData.deliveryDate || letter.deliveryDate,
            createTime: detailData.createdAt || detailData.createTime || letter.createTime,
            sentAt: detailData.sentAt || letter.sentAt,
            status: detailData.status || letter.status,
            style: this.getStyleFromBackground(detailData.backgroundImage || letter.backgroundImage),
            customImage: detailData.backgroundImage || letter.customImage,
            opacity: detailData.opacity !== undefined ? detailData.opacity : (letter.opacity || 100),
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
    
    // 关闭详情弹窗
    closeDetail() {
      this.showDetailModal = false;
      this.currentLetter = null;
      this.currentIndex = -1;
    },
    
    // 确认删除
    confirmDelete(letter, index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这封信件吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteLetter(letter, index);
          }
        }
      });
    },
    
    // 删除信件
    async deleteLetter(letter, index) {
      const isInSent = this.sentLetters.some(l => l.id === letter.id);
      const sourceList = isInSent ? this.sentLetters : this.letters;
      const sourceIndex = sourceList.findIndex(l => l.id === letter.id);
      
      // 如果有后端ID，调用后端API删除
      if (letter && letter.id) {
        try {
          uni.showLoading({ title: '正在删除...' });
          await deleteFutureLetter(letter.id);
          uni.hideLoading();
          
          // 从列表中移除
          if (sourceIndex !== -1) {
            sourceList.splice(sourceIndex, 1);
          }
          
          // 同时更新本地存储（如果存在）
          try {
            const localLetters = uni.getStorageSync('xinxiang_letters') || [];
            const localIndex = localLetters.findIndex(l => l.id === letter.id);
            if (localIndex !== -1) {
              localLetters.splice(localIndex, 1);
              uni.setStorageSync('xinxiang_letters', localLetters);
            }
          } catch (e) {
            console.warn('更新本地存储失败', e);
          }
          
          uni.showToast({ title: '已删除', icon: 'success' });
        } catch (error) {
          uni.hideLoading();
          console.error('删除信件失败:', error);
          uni.showToast({ 
            title: error.message || '删除失败，请重试', 
            icon: 'none' 
          });
        }
      } else {
        // 没有后端ID，只删除本地数据
        try {
          if (sourceIndex !== -1) {
            sourceList.splice(sourceIndex, 1);
          }
          uni.setStorageSync('xinxiang_letters', [...this.letters, ...this.sentLetters]);
          uni.showToast({ title: '已删除', icon: 'success' });
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
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

.history-page {
  min-height: 100vh;
  background: #FFFAF4;
  padding: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  background: #ffffff;
  padding: 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  padding: 16rpx 24rpx;
  text-align: center;
  border-radius: 12rpx;
  background: #F8F0FC;
  transition: all 0.3s;
  cursor: pointer;
}

.tab-item text {
  font-size: 28rpx;
  color: #888888;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.tab-item.active {
  background: #FFE0CC;
}

.tab-item.active text {
  color: #3d2a00;
  font-weight: 600;
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

.status-draft {
  background: #FFF3CD;
  color: #856404;
}

.status-scheduled {
  background: #D1ECF1;
  color: #0C5460;
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
  border-right: 1rpx solid #F3E8FF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.action-btn.delete {
  color: #ff6b6b;
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
  margin-bottom: 40rpx;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.write-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #3d2a00;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-date {
  font-size: 24rpx;
  color: #888888;
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
  color: #4A4A4A;
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
  color: #888888;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-time {
  font-size: 22rpx;
  color: #888888;
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
  background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #3d2a00;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
