<template>
  <view class="privacy-settings-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 背景渐变 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">隐私设置</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <view class="content">
      <!-- 隐私权限设置 -->
      <view class="section privacy-permission-section">
        <text class="section-title">隐私权限</text>
        <view class="settings-list">
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">允许陌生人查看我的资料</text>
            </view>
            <switch :checked="strangerProfileVisible" @change="toggleStrangerProfile" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">允许搜索到我</text>
            </view>
            <switch :checked="searchable" @change="toggleSearchable" color="#FFB6C1" />
          </view>
          <view class="setting-item">
            <view class="setting-left">
              <text class="setting-text">隐藏在线状态</text>
            </view>
            <switch :checked="hideOnlineStatus" @change="toggleOnlineStatus" color="#FFB6C1" />
          </view>
        </view>
      </view>

      <!-- 数据管理 -->
      <view class="section data-management-section">
        <text class="section-title">数据管理</text>
        <view class="settings-list">
          <view class="setting-item" @click="viewDataPolicy">
            <view class="setting-left">
              <text class="setting-text">数据收集与使用政策</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="requestDataExport">
            <view class="setting-left">
              <text class="setting-text">导出个人数据</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="requestAccountDeletion">
            <view class="setting-left">
              <text class="setting-text">注销账号</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
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
      strangerProfileVisible: false,
      searchable: true,
      hideOnlineStatus: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    }
  },
  onLoad() {
    this.getSystemInfo();
    // 初始化设置状态（实际项目中应从服务器获取）
    this.strangerProfileVisible = false;
    this.searchable = true;
    this.hideOnlineStatus = false;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      // #ifdef MP-WEIXIN
      try {
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
    },
    toggleStrangerProfile(e) {
      this.strangerProfileVisible = e.target.value;
      uni.showToast({
        title: this.strangerProfileVisible ? '已允许陌生人查看' : '已禁止陌生人查看',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleSearchable(e) {
      this.searchable = e.target.value;
      uni.showToast({
        title: this.searchable ? '已允许被搜索到' : '已禁止被搜索到',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    toggleOnlineStatus(e) {
      this.hideOnlineStatus = e.target.value;
      uni.showToast({
        title: this.hideOnlineStatus ? '已隐藏在线状态' : '已显示在线状态',
        icon: 'none'
      });
      // 这里应该调用API保存设置
    },
    viewDataPolicy() {
      uni.showToast({
        title: '数据政策页面待开发',
        icon: 'none'
      });
    },
    requestDataExport() {
      uni.showModal({
        title: '导出个人数据',
        content: '我们将把您的个人数据打包发送到您的邮箱，请确认您的邮箱地址。',
        confirmText: '确认导出',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '数据导出请求已提交',
              icon: 'success'
            });
          }
        }
      });
    },
    requestAccountDeletion() {
      uni.showModal({
        title: '注销账号',
        content: '注销账号后，您的所有数据将被永久删除且无法恢复，确定要继续吗？',
        confirmText: '确认注销',
        confirmColor: '#FF6B6B',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '账号注销申请已提交',
              icon: 'success'
            });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.privacy-settings-page {
  background-color: #FFFAF4;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

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
  font-size: 40rpx;
  font-weight: 500;
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

/* 内容区域 */
.content {
  padding: 15rpx;
  padding-top: calc(15rpx + 44px);
}

/* 区块样式 */
.section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #eee;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #eee;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.setting-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.setting-arrow {
  font-size: 36rpx;
  color: #ccc;
}
</style>