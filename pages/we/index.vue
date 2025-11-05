<template>
  <view class="profile-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">个人中心</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- 用户信息卡片 -->
      <view class="user-info-card">
        <image 
          class="user-avatar-large" 
          :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
          mode="aspectFill"
        />
        <view class="user-info-text">
          <text class="user-name">{{ userInfo.displayName || userInfo.nickName || '用户' }}</text>
          <text class="user-days" v-if="isBound && bindTime">在恋爱中 {{ daysTogether }} 天</text>
          <text class="user-days" v-else>等待另一半</text>
        </view>
        <view class="edit-icon" @click="goToEdit">
          <text>✏️</text>
        </view>
      </view>

      <!-- 情侣信息卡片（显示双方头像和昵称） -->
      <view class="couple-info-card" v-if="isBound && partnerInfo">
        <text class="section-title">我们的信息</text>
        <view class="couple-avatars-section">
          <view class="couple-avatar-item">
            <image 
              class="couple-avatar" 
              :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
              mode="aspectFill"
            />
            <text class="couple-name">{{ userInfo.displayName || userInfo.nickName || '我' }}</text>
          </view>
          <view class="heart-connector">
            <text class="heart-icon">❤️</text>
          </view>
          <view class="couple-avatar-item">
            <image 
              class="couple-avatar" 
              :src="partnerInfo.displayAvatar || partnerInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" 
              mode="aspectFill"
            />
            <text class="couple-name">{{ partnerInfo.displayName || partnerInfo.nickName || '另一半' }}</text>
          </view>
        </view>
      </view>

      <!-- 我的成就 -->
      <view class="section achievements-section">
        <text class="section-title">我的成就</text>
        <view class="achievements-grid">
          <view class="achievement-item" v-for="(achievement, index) in achievements" :key="index">
            <view class="achievement-icon" :style="{ background: achievement.bgColor }">
              <text class="achievement-emoji">{{ achievement.icon }}</text>
            </view>
            <text class="achievement-name">{{ achievement.name }}</text>
          </view>
        </view>
      </view>

      <!-- 设置 -->
      <view class="section settings-section">
        <text class="section-title">设置</text>
        <view class="settings-list">
          <view class="setting-item" @click="handleSetting('notification')">
            <view class="setting-left">
              <text class="setting-icon">🔔</text>
              <text class="setting-text">通知设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="handleSetting('privacy')">
            <view class="setting-left">
              <text class="setting-icon">🛡️</text>
              <text class="setting-text">隐私设置</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
          <view class="setting-item" @click="handleSetting('sync')">
            <view class="setting-left">
              <text class="setting-icon">☁️</text>
              <text class="setting-text">云同步</text>
            </view>
            <text class="setting-arrow">›</text>
      </view>
      </view>
    </view>

      <!-- 账号与安全 -->
      <view class="section account-section">
        <view class="setting-item" @click="toggleProfileSettings">
          <view class="setting-left">
            <text class="setting-icon">🔒</text>
            <text class="setting-text">账号与安全</text>
          </view>
          <text class="setting-arrow" :class="{ expanded: showProfileSettings }">›</text>
        </view>
        
        <!-- 个人资料设置内容 -->
        <view v-if="showProfileSettings" class="profile-settings-content">
          <!-- 头像设置 -->
          <view class="profile-setting-block">
            <text class="profile-setting-title">头像设置</text>
            <view class="avatar-section">
              <view class="current-avatar">
                <image class="avatar" :src="userInfo.displayAvatar || userInfo.avatarUrl || '/static/zhuye/lanmei_boy.png'" mode="aspectFill" />
                <text class="avatar-label">当前头像</text>
              </view>
              
              <view class="avatar-options">
                <button class="avatar-btn" @click="selectWechatAvatar">
                  <text class="btn-icon">📱</text>
                  <text class="btn-text">使用微信头像</text>
                </button>
                
                <button class="avatar-btn" @click="uploadCustomAvatar">
                  <text class="btn-icon">🖼️</text>
                  <text class="btn-text">上传自定义头像</text>
                </button>
              </view>
        </view>
      </view>

          <!-- 昵称设置 -->
          <view class="profile-setting-block">
            <text class="profile-setting-title">昵称设置</text>
            <view class="nickname-section">
              <view class="nickname-option" @click="toggleUseWechatNickname">
                <view class="checkbox" :class="{ checked: useWechatNickname }"></view>
                <text class="option-text">使用微信昵称</text>
                <text class="current-nickname">{{ userInfo.nickName }}</text>
              </view>
              
              <view v-if="!useWechatNickname" class="custom-nickname">
                <input 
                  v-model="customNickname" 
                  class="nickname-input" 
                  placeholder="请输入自定义昵称"
                  maxlength="20"
                />
                <text class="char-count">{{ customNickname.length }}/20</text>
              </view>
      </view>
    </view>

          <!-- 保存按钮 -->
          <view class="save-section">
            <button class="save-btn" @click="saveProfile" :disabled="isLoading">
              <text class="save-icon">💾</text>
              <text class="save-text">保存设置</text>
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';
import { getCoupleInfo, getPartnerInfo, isBound as checkIsBound } from '../../utils/couple.js';
import { getCoupleStatus } from '../../api/couple.js';
import { saveCoupleInfo } from '../../utils/couple.js';
import { updateUserProfile } from '../../api/user.js';

export default {
  data() {
    return {
      // 导航栏相关
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      userInfo: {
        nickName: '',
        avatarUrl: '',
        displayName: '',
        displayAvatar: ''
      },
      // 个人资料设置相关
      showProfileSettings: false,
      useWechatNickname: true,
      customNickname: '',
      isLoading: false,
      // 情侣关系相关
      isBound: false,
      partnerInfo: null,
      bindTime: '',
      // 成就数据
      achievements: [
        { icon: '🧁', name: '美食家', bgColor: 'rgba(255, 217, 61, 0.2)' },
        { icon: '✈️', name: '旅行者', bgColor: 'rgba(255, 158, 188, 0.2)' },
        { icon: '📅', name: '纪念日', bgColor: 'rgba(217, 172, 255, 0.2)' }
      ]
    };
  },
  computed: {
    // 计算在一起的天数
    daysTogether() {
      if (!this.bindTime) return 0;
      try {
        const bindDate = new Date(this.bindTime);
        const now = new Date();
        const diffTime = now - bindDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1; // 至少显示1天
      } catch (e) {
        return 0;
      }
    },
    // 计算容器顶部内边距
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    }
  },
  
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  onShow() {
    // 每次页面显示时重新加载用户信息和情侣信息
    this.loadUserInfo();
    this.loadCoupleInfo();
  },
  
  methods: {
    // 获取系统信息
    getSystemInfo() {
      // #ifdef MP-WEIXIN
      try {
        // 尝试使用新 API
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          // 降级到旧 API
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        // 如果新 API 不支持，降级到旧 API
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 54;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
    },
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          // 初始化昵称设置状态
          this.useWechatNickname = !this.userInfo.displayName || 
            this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? '' : this.userInfo.displayName;
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    
    // 切换个人资料设置展开/收起
    toggleProfileSettings() {
      this.showProfileSettings = !this.showProfileSettings;
    },
    // 加载情侣信息
    async loadCoupleInfo() {
      try {
        // 先检查本地
        const localCoupleInfo = getCoupleInfo();
        if (localCoupleInfo && localCoupleInfo.isBound) {
          this.isBound = true;
          this.partnerInfo = localCoupleInfo.partnerInfo || null;
          this.bindTime = localCoupleInfo.bindTime || '';
          
          // 同时从服务器同步一次状态
          try {
            const response = await getCoupleStatus();
            if (response && response.data && response.data.isBound) {
              // 更新本地信息
              saveCoupleInfo({
                isBound: true,
                coupleId: response.data.coupleId,
                partnerId: response.data.partnerInfo?.userId || '',
                partnerInfo: response.data.partnerInfo || {},
                bindTime: response.data.bindTime || '',
                role: response.data.role || ''
              });
              this.partnerInfo = response.data.partnerInfo || {};
              this.bindTime = response.data.bindTime || '';
            } else {
              // 服务器返回未绑定，清除本地
              this.isBound = false;
              this.partnerInfo = null;
              this.bindTime = '';
            }
          } catch (e) {
            console.error('同步绑定状态失败', e);
            // 同步失败时保持本地状态
          }
          return;
        }
        
        // 本地没有，查询服务器
        this.isBound = false;
        this.partnerInfo = null;
        try {
          const response = await getCoupleStatus();
          if (response && response.data && response.data.isBound) {
            this.isBound = true;
            this.partnerInfo = response.data.partnerInfo || {};
            this.bindTime = response.data.bindTime || '';
            
            // 保存到本地
            saveCoupleInfo({
              isBound: true,
              coupleId: response.data.coupleId,
              partnerId: response.data.partnerInfo?.userId || '',
              partnerInfo: response.data.partnerInfo || {},
              bindTime: response.data.bindTime || '',
              role: response.data.role || ''
            });
          }
        } catch (e) {
          console.error('查询绑定状态失败', e);
          // 查询失败时使用本地状态
          this.isBound = checkIsBound();
          if (this.isBound) {
            this.partnerInfo = getPartnerInfo();
            const coupleInfo = getCoupleInfo();
            this.bindTime = coupleInfo ? coupleInfo.bindTime : '';
          }
        }
      } catch (e) {
        console.error('加载情侣信息失败', e);
        this.isBound = checkIsBound();
        if (this.isBound) {
          this.partnerInfo = getPartnerInfo();
        }
      }
    },
    // 跳转到编辑页面（个人资料）
    goToEdit() {
      this.showProfileSettings = true;
      // 滚动到账号与安全区域
      setTimeout(() => {
        uni.pageScrollTo({
          selector: '.account-section',
          duration: 300
        });
      }, 100);
    },
    
    // 使用微信头像
    selectWechatAvatar() {
      this.userInfo.displayAvatar = this.userInfo.avatarUrl;
      uni.showToast({
        title: '已切换为微信头像',
        icon: 'success',
        duration: 1500
      });
    },
    
    // 上传自定义头像
    uploadCustomAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          // 保存原始路径，不进行任何修改
          const originalFilePath = res.tempFilePaths[0];
          
          if (!originalFilePath) {
            console.error('❌ [头像选择] 未获取到图片路径');
            uni.showToast({
              title: '选择图片失败',
              icon: 'none'
            });
            return;
          }
          
          console.log('📸 [头像选择] 原始路径:', originalFilePath);
          
          let loadingShown = false;
          try {
            uni.showLoading({
              title: '处理头像中...',
              mask: true
            });
            loadingShown = true;
            
            // 先尝试压缩图片，使用原始路径
            let imagePath = originalFilePath;
            try {
              console.log('🔄 [头像选择] 开始压缩图片，路径:', originalFilePath);
              const compressedPath = await this.compressImage(originalFilePath);
              
              // 如果压缩成功且返回了新路径，使用压缩后的路径
              if (compressedPath && compressedPath.trim() !== '' && compressedPath !== originalFilePath) {
                console.log('✅ [头像选择] 压缩成功，新路径:', compressedPath);
                imagePath = compressedPath;
              } else {
                console.log('ℹ️ [头像选择] 压缩后路径相同或无效，使用原图');
                imagePath = originalFilePath;
              }
            } catch (compressError) {
              console.warn('⚠️ [头像选择] 图片压缩失败，使用原图', compressError);
              imagePath = originalFilePath;
            }
            
            // 尝试上传到服务器
            let avatarUrl = originalFilePath; // 默认使用本地图片
            try {
              console.log('📤 [头像选择] 开始上传，路径:', imagePath);
              
              const uploadResult = await http.upload({
                url: config.API.USER.AVATAR_UPLOAD,
                filePath: imagePath,
                name: 'avatar',
                formData: { type: 'avatar' }
              });
              
              avatarUrl = uploadResult.url || uploadResult.data?.url || originalFilePath;
              console.log('✅ [头像选择] 上传成功，服务器URL:', avatarUrl);
              
              this.userInfo.displayAvatar = avatarUrl;
              
              // 上传成功后，立即调用更新接口保存到数据库
              try {
                const currentNickName = this.useWechatNickname 
                  ? this.userInfo.nickName 
                  : (this.customNickname || this.userInfo.displayName || this.userInfo.nickName);
                await updateUserProfile(currentNickName, avatarUrl);
                console.log('✅ [头像选择] 头像已更新到后端数据库');
              } catch (updateError) {
                console.error('❌ [头像选择] 更新头像到后端数据库失败:', updateError);
                // 即使更新失败，也更新本地存储
              }
              
              // 更新本地存储
              const loginInfo = uni.getStorageSync('login_info') || {};
              if (loginInfo.userInfo) {
                loginInfo.userInfo.displayAvatar = avatarUrl;
                loginInfo.userInfo.avatarUrl = avatarUrl;
                uni.setStorageSync('login_info', loginInfo);
              }
              
              uni.showToast({
                title: '头像上传成功',
                icon: 'success',
                duration: 1500
              });
              
            } catch (uploadError) {
              // 上传失败，使用本地图片
              console.warn('⚠️ [头像选择] 头像上传失败，使用本地图片', uploadError);
              this.userInfo.displayAvatar = originalFilePath;
              
              // 更新本地存储（即使上传失败，也保存本地图片路径）
              const loginInfo = uni.getStorageSync('login_info') || {};
              if (loginInfo.userInfo) {
                loginInfo.userInfo.displayAvatar = originalFilePath;
                uni.setStorageSync('login_info', loginInfo);
              }
              
              uni.showToast({
                title: '头像已选择（未上传）',
                icon: 'none',
                duration: 1500
              });
            }
            
          } catch (error) {
            console.error('❌ [头像选择] 处理头像失败', error);
            uni.showToast({
              title: '头像处理失败',
              icon: 'none'
            });
          } finally {
            if (loadingShown) {
              uni.hideLoading();
            }
          }
        },
        fail: (err) => {
          if (err && err.errMsg && !err.errMsg.includes('cancel')) {
            console.error('选择图片失败', err);
            uni.showToast({
              title: '选择图片失败',
              icon: 'none'
            });
          }
        }
      });
    },
    
    // 压缩图片
    compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        uni.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            console.warn('图片压缩失败，使用原图', error);
            resolve(tempFilePath);
          }
        });
      });
    },
    
    // 切换是否使用微信昵称
    toggleUseWechatNickname() {
      this.useWechatNickname = !this.useWechatNickname;
      if (this.useWechatNickname) {
        this.customNickname = '';
      }
    },
    
    // 保存个人资料
    async saveProfile() {
      // 验证自定义昵称
      if (!this.useWechatNickname && !this.customNickname.trim()) {
        uni.showToast({
          title: '请输入自定义昵称',
          icon: 'none'
        });
        return;
      }
      
      this.isLoading = true;
      
      try {
        // 构建最终用户信息
        const displayName = this.useWechatNickname 
          ? this.userInfo.nickName 
          : this.customNickname.trim();
          
        const displayAvatar = this.userInfo.displayAvatar || this.userInfo.avatarUrl;
        
        // 调用后端API更新用户资料
        try {
          await updateUserProfile(displayName, displayAvatar);
          console.log('✅ 用户资料已更新到后端');
        } catch (apiError) {
          console.error('❌ 更新用户资料到后端失败:', apiError);
          // 即使后端更新失败，也更新本地存储（降级处理）
          uni.showToast({
            title: '后端更新失败，已保存到本地',
            icon: 'none',
            duration: 2000
          });
        }
        
        // 更新本地存储
        const loginInfo = uni.getStorageSync('login_info') || {};
        loginInfo.userInfo = {
          ...loginInfo.userInfo,
          displayName,
          displayAvatar,
          nickName: displayName, // 同时更新nickName字段，确保后端和本地一致
          avatarUrl: displayAvatar, // 同时更新avatarUrl字段
          originalNickName: this.userInfo.nickName,
          originalAvatarUrl: this.userInfo.avatarUrl
        };
        
        uni.setStorageSync('login_info', loginInfo);
        
        // 更新当前用户信息
        this.userInfo = { ...loginInfo.userInfo };
        
        uni.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });
        
      } catch (error) {
        console.error('保存失败', error);
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    // 处理设置项点击
    handleSetting(key) {
      const settingMap = {
        notification: '通知设置',
        privacy: '隐私设置',
        sync: '云同步'
      };
      uni.showToast({
        title: settingMap[key] + '（待开发）',
        icon: 'none'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #F8F0FC;
  padding-bottom: 120rpx;
}

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

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内容区域 */
.content {
  padding: 30rpx;
}

/* 用户信息卡片 */
.user-info-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.user-avatar-large {
  width: 128rpx;
  height: 128rpx;
  border-radius: 64rpx;
  border: 4rpx solid #e5e5e5;
  flex-shrink: 0;
}

.user-info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx; 
  font-weight: 600;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.user-days {
  font-size: 24rpx;
  color: #999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.edit-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #999;
  cursor: pointer;
}

.edit-icon:active {
  opacity: 0.6;
}

/* 情侣信息卡片 */
.couple-info-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.couple-info-card .section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #6B5B95;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.couple-avatars-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.couple-avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.couple-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.couple-name {
  font-size: 24rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.heart-connector {
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon {
  font-size: 36rpx;
}

/* 成就展示 */
.achievements-section {
  padding-bottom: 20rpx;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  margin-top: 20rpx;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.achievement-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.achievement-emoji {
  font-size: 48rpx;
}

.achievement-name {
  font-size: 22rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 设置列表 */
.settings-section {
  padding-bottom: 0;
}

.settings-list {
  margin-top: 20rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none; 
}

.setting-item:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.setting-icon {
  font-size: 32rpx;
}

.setting-text {
  font-size: 28rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.setting-arrow {
  font-size: 36rpx; 
  color: #999;
  font-weight: 300;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.setting-arrow.expanded {
  transform: rotate(90deg);
}

.account-section {
  padding-bottom: 0;
}

/* 个人资料设置内容 */
.profile-settings-content {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.profile-setting-block {
  margin-bottom: 30rpx;
}

.profile-setting-block:last-child {
  margin-bottom: 0;
}

.profile-setting-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

/* 头像设置 */
.avatar-section {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.current-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #e5e5e5;
}

.avatar-label {
  font-size: 24rpx;
  color: #999;
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  color: #333;
}

.avatar-btn:active {
  background: #f0f0f0;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 28rpx;
}

/* 昵称设置 */
.nickname-option {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  cursor: pointer;
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 6rpx;
  margin-right: 12rpx;
  position: relative;
  flex-shrink: 0;
}

.checkbox.checked {
  background: #2bad81;
  border-color: #2bad81;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  width: 12rpx;
  height: 20rpx;
  border: solid #fff;
  border-width: 0 2rpx 2rpx 0;
  transform: rotate(45deg);
  top: 50%;
  left: 50%;
  margin-top: -10rpx;
  margin-left: -8rpx;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.current-nickname {
  font-size: 24rpx;
  color: #999;
}

.custom-nickname {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
}

.nickname-input {
  width: 100%;
  padding: 16rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  font-size: 28rpx;
  background: #ffffff;
  margin-bottom: 8rpx;
  box-sizing: border-box;
}

.char-count {
  display: block;
  font-size: 22rpx;
  color: #999;
  text-align: right;
}

/* 保存按钮 */
.save-section {
  margin-top: 30rpx;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  background: #2bad81;
  border-radius: 48rpx;
  border: none;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(43, 173, 129, 0.25);
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn[disabled] {
  opacity: 0.6;
}

.save-icon {
  font-size: 32rpx;
}

.save-text {
  font-size: 30rpx;
}

/* 区块样式 */
.section {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

</style>
