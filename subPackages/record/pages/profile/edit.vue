<template>
  <view class="edit-profile-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">编辑资料</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- 头像编辑区域 -->
      <view class="section avatar-section">
        <text class="section-title">头像</text>
        <view class="avatar-edit-container">
          <image 
            class="current-avatar" 
            :src="tempAvatar || userInfo.displayAvatar || userInfo.avatarUrl || '/static/login/love.jpg'" 
            mode="aspectFill"
            @click="chooseAvatar"
          />
          <view class="avatar-mask" @click="chooseAvatar">
            <text class="camera-icon">📷</text>
          </view>
        </view>
      </view>

      <!-- 昵称编辑区域 -->
      <view class="section nickname-section">
        <text class="section-title">昵称</text>
        <input 
          class="nickname-input" 
          v-model="tempNickname" 
          placeholder="请输入昵称"
          maxlength="20"
          @input="onNicknameInput"
        />
        <text class="char-count">{{ nicknameCharCount }}/20</text>
      </view>

      <!-- 保存按钮 -->
      <view class="save-section">
        <button 
          class="save-btn" 
          :disabled="isSaving" 
          @click="saveProfile"
        >
          <text class="save-text">{{ isSaving ? '保存中...' : '保存' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { updateUserProfile } from '@/api/user.js';
import { getUserInfo, saveLoginInfo } from '@/utils/auth.js';
import config from '@/utils/config.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      userInfo: {
        nickName: '',
        avatarUrl: '',
        displayName: '',
        displayAvatar: ''
      },
      tempNickname: '',
      tempAvatar: '',
      isSaving: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    },
    nicknameCharCount() {
      return this.tempNickname.length;
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.loadUserInfo();
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
    loadUserInfo() {
      try {
        const userInfoData = getUserInfo();
        if (userInfoData) {
          this.userInfo = { ...userInfoData };
          // 初始化临时昵称为当前显示昵称
          this.tempNickname = this.userInfo.displayName || this.userInfo.nickName || '';
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    onNicknameInput(e) {
      this.tempNickname = e.detail.value;
    },
    chooseAvatar() {
      // 使用微信小程序的 chooseMedia API 选择图片
      // #ifdef MP-WEIXIN
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          console.error('选择图片失败', err);
          // 降级到 chooseImage
          this.chooseImageFallback();
        }
      });
      // #endif
      
      // #ifndef MP-WEIXIN
      this.chooseImageFallback();
      // #endif
    },
    chooseImageFallback() {
      uni.chooseImage({
        count: 1,
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          console.error('选择图片失败', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },
    async uploadAvatar(filePath) {
      uni.showLoading({
        title: '上传中...'
      });
      
      try {
        // 使用 uni.uploadFile 上传图片
        const uploadResult = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: config.baseURL + config.API.USER.AVATAR_UPLOAD,
            filePath: filePath,
            name: 'file',
            header: {
              'Authorization': uni.getStorageSync('token') || ''
            },
            success: (uploadRes) => {
              resolve(uploadRes);
            },
            fail: (uploadErr) => {
              reject(uploadErr);
            }
          });
        });
        
        // 解析上传结果
        const data = JSON.parse(uploadResult.data);
        if (data.code === 200 && data.data) {
          this.tempAvatar = data.data; // 保存新头像URL
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } else {
          throw new Error(data.message || '上传失败');
        }
      } catch (error) {
        console.error('上传头像失败', error);
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    async saveProfile() {
      if (this.isSaving) return;
      
      // 检查昵称是否为空
      if (!this.tempNickname.trim()) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      
      this.isSaving = true;
      
      try {
        // 调用API更新用户资料
        const response = await updateUserProfile(
          this.tempNickname, 
          this.tempAvatar || this.userInfo.displayAvatar || this.userInfo.avatarUrl
        );
        
        if (response && response.code === 200) {
          // 更新本地用户信息
          const updatedUserInfo = {
            ...this.userInfo,
            displayName: this.tempNickname,
            displayAvatar: this.tempAvatar || this.userInfo.displayAvatar || this.userInfo.avatarUrl
          };
          
          // 保存到本地存储
          saveLoginInfo(updatedUserInfo);
          
          // 更新全局用户信息
          this.userInfo = updatedUserInfo;
          
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1000);
        } else {
          throw new Error(response?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存用户资料失败', error);
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      } finally {
        this.isSaving = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.edit-profile-page {
  min-height: 100vh;
  background-color: #FFFAF4;
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
  font-size: 36rpx;
  font-weight: 500;
  color: #4A4A4A;
}

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 40rpx;
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
  padding: 30rpx;
  padding-top: calc(30rpx + 44px);
}

/* 区块样式 */
.section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

/* 头像编辑区域 */
.avatar-edit-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.current-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.avatar-mask {
  position: absolute;
  bottom: 0;
  right: 30%;
  width: 50rpx;
  height: 50rpx;
  border-radius: 25rpx;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.camera-icon {
  font-size: 24rpx;
  color: #ffffff;
}

/* 昵称编辑区域 */
.nickname-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.char-count {
  display: block;
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 10rpx;
}

/* 保存按钮 */
.save-section {
  margin-top: 50rpx;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  background: #2bad81;
  border-radius: 48rpx;
  border: none;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(43, 173, 129, 0.25);
  cursor: pointer;
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-text {
  font-size: 32rpx;
}
</style>