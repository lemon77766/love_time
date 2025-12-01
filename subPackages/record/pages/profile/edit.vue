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
        <view class="avatar-container">
          <view class="current-avatar-wrapper">
            <image 
              class="current-avatar" 
              :src="tempAvatar || userInfo.displayAvatar || userInfo.avatarUrl || '/static/login/love.jpg'" 
              mode="aspectFill"
            />
          </view>
          <view class="avatar-actions">
            <button class="avatar-btn" @click="chooseAvatar">
              <text class="btn-icon">📷</text>
              <text class="btn-text">更换头像</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 昵称编辑区域 -->
      <view class="section nickname-section">
        <text class="section-title">昵称</text>
        <view class="nickname-container">
          <view class="input-wrapper">
            <input 
              class="nickname-input" 
              v-model="tempNickname" 
              placeholder="请输入昵称"
              maxlength="20"
              @input="onNicknameInput"
            />
            <text class="char-count">{{ nicknameCharCount }}/20</text>
          </view>
          <view class="nickname-tips">
            <text class="tips-text">支持中英文、数字，2-20个字符</text>
          </view>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="save-section">
        <button 
          class="save-btn" 
          :disabled="isSaving" 
          @click="saveProfile"
        >
          <text class="save-icon">💾</text>
          <text class="save-text">{{ isSaving ? '保存中...' : '保存资料' }}</text>
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
        console.log('📤 [上传头像] 开始上传，文件路径:', filePath);
        
        // 验证文件路径
        if (!filePath) {
          throw new Error('未选择文件');
        }
        
        // 获取token（改进的token获取方式）
        let token = uni.getStorageSync('token');
        if (!token) {
          // 如果没有直接存储的token，尝试从login_info中获取
          const loginInfo = uni.getStorageSync('login_info');
          if (loginInfo && loginInfo.token) {
            token = loginInfo.token;
          } else if (loginInfo && loginInfo.data && loginInfo.data.token) {
            token = loginInfo.data.token;
          }
        }
        
        console.log('🔑 [上传头像] Token:', token ? `${token.substring(0, 20)}...` : '未找到');
        
        // 验证token是否存在
        if (!token) {
          throw new Error('未找到登录凭证，请重新登录');
        }
        
        // 使用 uni.uploadFile 上传图片
        const uploadResult = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: config.baseURL + config.API.USER.AVATAR_UPLOAD,
            filePath: filePath,
            name: 'file',
            header: {
              'Authorization': `Bearer ${token}`  // 确保使用Bearer前缀
            },
            success: (uploadRes) => {
              console.log('📥 [上传头像] 上传成功，响应:', uploadRes);
              resolve(uploadRes);
            },
            fail: (uploadErr) => {
              console.error('❌ [上传头像] 上传失败，错误:', uploadErr);
              reject(uploadErr);
            }
          });
        });
        
        // 检查响应状态
        if (uploadResult.statusCode !== 200) {
          throw new Error(`上传失败，服务器返回状态码: ${uploadResult.statusCode}`);
        }
        
        // 解析上传结果
        let data;
        try {
          data = JSON.parse(uploadResult.data);
          console.log('📥 [上传头像] 解析后的数据:', data);
        } catch (parseError) {
          // 如果JSON解析失败，直接使用原始数据
          console.error('❌ [上传头像] JSON解析失败，使用原始数据:', uploadResult.data);
          data = uploadResult.data;
        }
        
        // 检查响应数据结构并提取图片URL
        let photoUrl = null;
        
        // 根据不同的响应格式提取图片URL
        if (data && typeof data === 'object') {
          // 格式1: { code: 200, imgUrl: "..." }
          if (data.code === 200 && data.imgUrl) {
            photoUrl = data.imgUrl;
          }
          // 格式2: { code: 200, data: { imgUrl: "..." } }
          else if (data.code === 200 && data.data && typeof data.data === 'object' && data.data.imgUrl) {
            photoUrl = data.data.imgUrl;
          }
          // 格式3: { code: 200, data: "..." } (data直接是URL)
          else if (data.code === 200 && data.data && typeof data.data === 'string' && data.data.includes('http')) {
            photoUrl = data.data;
          }
          // 格式4: { photoUrl: "..." }
          else if (data.photoUrl) {
            photoUrl = data.photoUrl;
          }
          // 格式5: { url: "..." }
          else if (data.url) {
            photoUrl = data.url;
          }
          // 格式6: { data: { photoUrl: "..." } }
          else if (data.data && typeof data.data === 'object' && data.data.photoUrl) {
            photoUrl = data.data.photoUrl;
          }
          // 格式7: { data: { url: "..." } }
          else if (data.data && typeof data.data === 'object' && data.data.url) {
            photoUrl = data.data.url;
          }
        } else if (typeof data === 'string' && data.includes('http')) {
          // 格式8: 直接返回URL字符串
          photoUrl = data;
        }
        
        if (photoUrl) {
          this.tempAvatar = photoUrl; // 保存新头像URL
          console.log('✅ [上传头像] 上传成功，图片URL:', photoUrl);
          
          // 强制刷新图片显示
          this.$forceUpdate();
          
          // 添加时间戳防止缓存
          const timestamp = new Date().getTime();
          this.tempAvatar = photoUrl + '?t=' + timestamp;
          
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } else {
          // 从响应中提取错误消息
          const errorMsg = (data && typeof data === 'object') ? 
            (data.message || data.msg || data.errorMessage || '上传失败') : 
            '上传失败';
          throw new Error(errorMsg || '上传失败');
        }
      } catch (error) {
        console.error('上传头像失败', error);
        // 显示更详细的错误信息
        const errorMessage = error.message || '上传失败';
        uni.showToast({
          title: errorMessage,
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
          
          // 保存到本地存储（保留token）
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
  font-size: 40rpx; /* 增大字体 */
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
  font-size: 50rpx; /* 增大字体 */
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
  padding: 15rpx; /* 减少留白 */
  padding-top: calc(15rpx + 44px); /* 减少导航栏下方留白 */
}

/* 区块样式 */
.section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  padding: 20rpx; /* 减少内边距 */
  margin-bottom: 10rpx; /* 减少区块间距 */
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}

.section-title {
  display: block;
  font-size: 34rpx; /* 增大标题字体 */
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx; /* 减少标题下方留白 */
}

/* 头像编辑区域 */
.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.current-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.current-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.avatar-actions {
  width: 100%;
}

.avatar-btn {
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ffd166 0%, #ff9ebc 100%);
  border-radius: 20rpx;
  border: none;
  font-size: 20rpx;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(255, 158, 188, 0.25);
  white-space: nowrap;
}

.avatar-btn:active {
  opacity: 0.85;
}

.btn-icon {
  font-size: 20rpx;
}

.btn-text {
  font-size: 20rpx;
}

/* 昵称编辑区域 */
.nickname-container {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.input-wrapper {
  position: relative;
}

.nickname-input {
  width: 100%;
  padding: 28rpx; /* 增大内边距，使输入框更高 */
  padding-right: 80rpx; /* 为字符计数留出空间 */
  border: 1rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 32rpx; /* 增大字体 */
  background: #ffffff;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28rpx; /* 增大字体，与输入框匹配 */
  color: #999;
}

.nickname-tips {
  margin-top: 8rpx;
}

.tips-text {
  font-size: 24rpx; /* 增大提示文字 */
  color: #999;
}

/* 保存按钮 */
.save-section {
  margin-top: 30rpx; /* 减少顶部间距 */
}

.save-btn {
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #ffd166 0%, #ff9ebc 100%);
  border-radius: 20rpx;
  border: none;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(255, 158, 188, 0.25);
  cursor: pointer;
  white-space: nowrap;
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-icon {
  font-size: 20rpx;
}

.save-text {
  font-size: 20rpx;
}
</style>