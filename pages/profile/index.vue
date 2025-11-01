<template>
  <view class="profile-page">
    <!-- 内容区域 -->
    <view class="content">
      <!-- 头像设置 -->
      <view class="section">
        <text class="section-title">头像设置</text>
        <view class="avatar-section">
          <view class="current-avatar">
            <image class="avatar" :src="userInfo.displayAvatar || userInfo.avatarUrl" mode="aspectFill" />
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
      <view class="section">
        <text class="section-title">昵称设置</text>
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
        <button class="save-btn" @click="saveProfile">
          <text class="save-icon">💾</text>
          <text class="save-text">保存设置</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import http from '@/utils/http.js';
import config from '@/utils/config.js';

export default {
  data() {
    return {
      userInfo: {
        nickName: '',
        avatarUrl: '',
        displayName: '',
        displayAvatar: ''
      },
      useWechatNickname: true,
      customNickname: '',
      isLoading: false
    };
  },
  
  onLoad() {
    this.loadUserInfo();
  },
  
  methods: {
    // 加载用户信息
    loadUserInfo() {
      try {
        const loginInfo = uni.getStorageSync('login_info');
        if (loginInfo && loginInfo.userInfo) {
          this.userInfo = { ...loginInfo.userInfo };
          this.useWechatNickname = !this.userInfo.displayName || 
            this.userInfo.displayName === this.userInfo.nickName;
          this.customNickname = this.useWechatNickname ? '' : this.userInfo.displayName;
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    },
    
    // 返回上一页（使用系统导航栏的返回按钮）
    
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
          const tempFilePath = res.tempFilePaths[0];
          
          try {
            uni.showLoading({
              title: '处理头像中...',
              mask: true
            });
            
            // 压缩图片
            const compressedImage = await this.compressImage(tempFilePath);
            
            // 尝试上传到服务器
            try {
              const uploadResult = await http.upload({
                url: config.API.USER.AVATAR_UPLOAD,
                filePath: compressedImage,
                name: 'avatar',
                formData: { type: 'avatar' }
              });
              this.userInfo.displayAvatar = uploadResult.url || tempFilePath;
            } catch (uploadError) {
              // 上传失败，使用本地图片
              console.warn('头像上传失败，使用本地图片', uploadError);
              this.userInfo.displayAvatar = tempFilePath;
            }
            
            uni.showToast({
              title: '头像上传成功',
              icon: 'success',
              duration: 1500
            });
            
          } catch (error) {
            console.error('处理头像失败', error);
            uni.showToast({
              title: '头像处理失败',
              icon: 'none'
            });
          } finally {
            uni.hideLoading();
          }
        },
        fail: (err) => {
          console.error('选择图片失败', err);
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
    saveProfile() {
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
        
        // 更新本地存储
        const loginInfo = uni.getStorageSync('login_info') || {};
        loginInfo.userInfo = {
          ...loginInfo.userInfo,
          displayName,
          displayAvatar,
          originalNickName: this.userInfo.nickName,
          originalAvatarUrl: this.userInfo.avatarUrl
        };
        
        uni.setStorageSync('login_info', loginInfo);
        
        uni.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });
        
        // 延迟返回
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
        
      } catch (error) {
        console.error('保存失败', error);
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 内容区域 */
.content {
  padding: 30rpx;
  margin-top: 20rpx; /* 为系统导航栏留出空间 */
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
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 6rpx;
  margin-right: 12rpx;
  position: relative;
}

.checkbox.checked {
  background: #ff8fb3;
  border-color: #ff8fb3;
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
}

.char-count {
  display: block;
  font-size: 22rpx;
  color: #999;
  text-align: right;
}

/* 保存按钮 */
.save-section {
  margin-top: 40rpx;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  border-radius: 48rpx;
  border: none;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(255, 143, 179, 0.35);
}

.save-btn:active {
  opacity: 0.85;
}

.save-icon {
  font-size: 32rpx;
}

.save-text {
  font-size: 30rpx;
}
</style>