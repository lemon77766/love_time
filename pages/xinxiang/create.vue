<template>
  <view class="create-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">写信</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 步骤指示器 -->
    <view class="steps">
      <view class="step" :class="{ active: currentStep === 1 }">
        <view class="step-number">1</view>
        <text class="step-text">选择样式</text>
      </view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: currentStep === 2 }">
        <view class="step-number">2</view>
        <text class="step-text">填写信息</text>
      </view>
    </view>

    <!-- 第一步：选择信件样式 -->
    <view v-if="currentStep === 1" class="step-content">
      <text class="section-title">选择信件样式</text>
      
      <!-- 预设样式网格 -->
      <view class="style-grid">
        <view 
          v-for="i in [1, 2, 3]" 
          :key="i" 
          class="style-item"
          :class="{ selected: selectedStyle === i && !isCustomStyle }"
          @click="selectPresetStyle(i)"
        >
          <image class="style-image" :src="`/static/xinxiang/xin${i}.jpg`" mode="aspectFill"></image>
          <view v-if="selectedStyle === i && !isCustomStyle" class="check-mark">✓</view>
        </view>
      </view>

      <!-- 自定义样式 -->
      <view class="custom-section">
        <button class="custom-btn" @click="uploadCustom">
          <text class="btn-icon">📷</text>
          <text>自定义信件底图</text>
        </button>
        
        <view v-if="customImage" class="custom-preview">
          <view class="preview-wrapper">
            <image class="preview-bg" :src="customImage" mode="aspectFill"></image>
          </view>
        </view>
      </view>

      <button class="next-btn" @click="nextStep">下一步</button>
    </view>


    <!-- 第二步：填写信息 -->
    <view v-if="currentStep === 2" class="step-content">
      <text class="section-title">填写信件信息</text>
      
      <view class="form">
        <!-- 信件主题 -->
        <view class="form-item">
          <text class="form-label">信件主题</text>
          <input 
            class="form-input" 
            v-model="form.title" 
            placeholder="例如：给未来的你"
            maxlength="50"
          />
        </view>

        <!-- 预计送达时间 -->
        <view class="form-item">
          <text class="form-label">预计送达时间</text>
          <picker 
            mode="date" 
            :value="form.deliveryDate" 
            @change="onDateChange"
            :start="minDate"
          >
            <view class="picker-display">
              {{ form.deliveryDate || '请选择日期' }}
            </view>
          </picker>
        </view>

        <!-- 信件内容 -->
        <view class="form-item">
          <text class="form-label">信件内容</text>
          <textarea 
            class="form-textarea" 
            v-model="form.content" 
            placeholder="写下你想说的话..."
            maxlength="1000"
          />
          <text class="char-count">{{ form.content.length }}/1000</text>
        </view>
      </view>

      <view class="action-btns">
        <button class="back-btn" @click="prevStep">上一步</button>
        <button class="preview-btn" @click="openPreview">👁️ 预览</button>
        <button class="submit-btn" @click="submitLetter">提交信件</button>
      </view>
    </view>

    <!-- 预览弹窗 -->
    <view v-if="showLivePreviewModal" class="preview-modal-overlay" @click="showLivePreviewModal = false">
      <view class="preview-modal-content" @click.stop>
        <text class="preview-modal-title">信件预览</text>
        
        <!-- 信件融合预览 -->
        <view class="letter-preview">
          <view class="letter-wrapper">
            <!-- 底图层 -->
            <image 
              class="letter-bg" 
              :src="letterBackground" 
              mode="aspectFill"
            ></image>
            
            <!-- 信件内容层 -->
            <view class="letter-content">
              <view class="letter-header">
                <text class="letter-title">{{ form.title || '信件主题' }}</text>
                <text class="letter-date">送达时间：{{ form.deliveryDate || '未选择' }}</text>
              </view>
              
              <view class="letter-body">
                <text class="letter-text">{{ form.content || '信件内容...' }}</text>
              </view>
              
              <view class="letter-footer">
                <text class="letter-sign">—— 给未来的你</text>
              </view>
            </view>
          </view>
        </view>

        <view class="preview-modal-actions">
          <button class="preview-modal-btn close" @click="showLivePreviewModal = false">关闭</button>
        </view>
      </view>
    </view>


    <!-- 信件预览弹窗 -->
    <view v-if="showPreviewModal" class="preview-modal-overlay">
      <view class="preview-modal-content" @click.stop>
        <text class="preview-modal-title">信件预览</text>
        
        <!-- 信件融合预览 -->
        <view class="letter-preview">
          <view class="letter-wrapper">
            <!-- 底图层 -->
            <image 
              class="letter-bg" 
              :src="letterBackground" 
              mode="aspectFill"
            ></image>
            
            <!-- 信件内容层 -->
            <view class="letter-content">
              <view class="letter-header">
                <text class="letter-title">{{ form.title }}</text>
                <text class="letter-date">送达时间：{{ form.deliveryDate }}</text>
              </view>
              
              <view class="letter-body">
                <text class="letter-text">{{ form.content }}</text>
              </view>
              
              <view class="letter-footer">
                <text class="letter-sign">—— 给未来的你</text>
              </view>
            </view>
          </view>
        </view>

        <view class="preview-modal-actions">
          <button class="preview-modal-btn confirm" @click="closePreviewAndBack">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { createFutureLetter, sendFutureLetter } from '@/api/futureLetter.js';
import { getPartnerInfo, isBound } from '@/utils/couple.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      currentStep: 1,
      selectedStyle: 1,
      isCustomStyle: false,
      customImage: '',
      showPreviewModal: false,
      showLivePreviewModal: false,
      form: {
        title: '',
        deliveryDate: '',
        content: ''
      }
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
    minDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    // 获取信件底图路径
    letterBackground() {
      if (this.isCustomStyle) {
        return this.customImage;
      }
      return `/static/xinxiang/xin${this.selectedStyle}.jpg`;
    }
  },
  onLoad() {
    this.getSystemInfo();
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
    // 选择预设样式
    selectPresetStyle(index) {
      this.selectedStyle = index;
      this.isCustomStyle = false;
      this.customImage = '';
    },
    
    // 上传自定义图片
    uploadCustom() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.customImage = res.tempFilePaths[0];
          this.isCustomStyle = true;
          uni.showToast({ title: '自定义底图已选择', icon: 'success' });
        }
      });
    },
    
    // 打开预览弹窗
    openPreview() {
      this.showLivePreviewModal = true;
    },
    
    // 日期选择
    onDateChange(e) {
      this.form.deliveryDate = e.detail.value;
    },
    
    // 下一步
    nextStep() {
      if (!this.selectedStyle && !this.isCustomStyle) {
        uni.showToast({ title: '请选择信件样式', icon: 'none' });
        return;
      }
      this.currentStep = 2;
    },
    
    // 上一步
    prevStep() {
      this.currentStep = 1;
    },
    
    // 提交信件
    async submitLetter() {
      // 验证必填项
      if (!this.form.title) {
        uni.showToast({ title: '请填写信件主题', icon: 'none' });
        return;
      }
      if (!this.form.deliveryDate) {
        uni.showToast({ title: '请选择送达时间', icon: 'none' });
        return;
      }
      if (!this.form.content) {
        uni.showToast({ title: '请填写信件内容', icon: 'none' });
        return;
      }

      // 显示加载提示
      uni.showLoading({ title: '正在创建...' });

      try {
        // 获取对方ID（如果已绑定）
        let receiverId = null;
        if (isBound()) {
          try {
            const coupleInfo = uni.getStorageSync('couple_info');
            console.log('👫 [情侣信息]', coupleInfo);
            
            // 优先使用 partnerId（如果存在）
            if (coupleInfo && coupleInfo.partnerId) {
              receiverId = coupleInfo.partnerId;
              console.log('✅ [获取对方ID] 从 partnerId 获取:', receiverId);
            } else {
              // 否则从 partnerInfo.userId 获取
              const partnerInfo = getPartnerInfo();
              if (partnerInfo && partnerInfo.userId) {
                receiverId = partnerInfo.userId;
                console.log('✅ [获取对方ID] 从 partnerInfo.userId 获取:', receiverId);
              }
            }
          } catch (e) {
            console.warn('⚠️ 获取对方ID失败:', e);
          }
        } else {
          console.log('⚠️ 未绑定情侣关系，跳过 receiverId');
        }

        // 构建背景图片URL（如果是自定义图片，需要先上传）
        let backgroundImage = null;
        if (this.isCustomStyle && this.customImage) {
          // 如果是自定义图片，这里需要上传到服务器获取URL
          // 暂时使用本地路径，后续可以集成图片上传功能
          backgroundImage = this.customImage;
        } else {
          // 预设样式可以转换为完整URL或使用样式ID
          backgroundImage = `/static/xinxiang/xin${this.selectedStyle}.jpg`;
        }

        // 验证日期格式
        if (!this.form.deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(this.form.deliveryDate)) {
          uni.hideLoading();
          uni.showToast({ title: '日期格式错误，请重新选择', icon: 'none' });
          return;
        }

        // 构建后端API请求数据
        const letterData = {
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          deliveryMethod: 'PARTNER', // 目前只支持PARTNER
          scheduledDate: this.form.deliveryDate, // 格式：YYYY-MM-DD
          scheduledTime: '00:00:00', // 默认时间
          status: 'DRAFT' // 草稿状态
        };

        // 如果已绑定且获取到对方ID，添加receiverId（确保是数字类型）
        if (receiverId) {
          letterData.receiverId = Number(receiverId);
          if (isNaN(letterData.receiverId)) {
            console.warn('receiverId 不是有效数字:', receiverId);
            delete letterData.receiverId;
          }
        }

        // 只有当背景图片存在时才添加（避免null值导致后端错误）
        if (backgroundImage && backgroundImage.trim()) {
          letterData.backgroundImage = backgroundImage.trim();
        }

        console.log('📤 [创建情书] 最终请求参数:', JSON.stringify(letterData, null, 2));

        // 调用后端API创建情书
        const response = await createFutureLetter(letterData);

        if (response && response.success !== false && response.data?.id) {
          const letterId = response.data.id;
          
          // 创建成功后立即发送信件
          uni.showLoading({ title: '正在发送...' });
          
          try {
            // 调用发送接口
            const sendResponse = await sendFutureLetter(letterId);
            
            uni.hideLoading();
            
            if (sendResponse && sendResponse.success !== false) {
              // 保存本地预览数据（用于预览显示）
              const localData = {
                id: letterId,
                style: this.isCustomStyle ? 'custom' : this.selectedStyle,
                customImage: this.customImage,
                title: this.form.title,
                deliveryDate: this.form.deliveryDate,
                content: this.form.content,
                createTime: new Date().toLocaleString(),
                status: 'SENT' // 标记为已发送
              };

              // 保存到本地存储（用于预览）
              try {
                const letters = uni.getStorageSync('xinxiang_letters') || [];
                letters.unshift(localData);
                uni.setStorageSync('xinxiang_letters', letters);
              } catch (e) {
                console.warn('保存本地预览数据失败', e);
              }

              uni.showToast({ title: '发送成功', icon: 'success' });
              
              // 显示预览弹窗
              this.showPreviewModal = true;
            } else {
              // 发送失败，但创建成功
              uni.showToast({ 
                title: sendResponse.message || '创建成功，但发送失败', 
                icon: 'none',
                duration: 2000
              });
              
              // 即使发送失败也显示预览弹窗
              this.showPreviewModal = true;
            }
          } catch (sendError) {
            uni.hideLoading();
            console.error('发送未来情书失败:', sendError);
            
            // 发送失败，但创建成功，仍然保存数据
            const localData = {
              id: letterId,
              style: this.isCustomStyle ? 'custom' : this.selectedStyle,
              customImage: this.customImage,
              title: this.form.title,
              deliveryDate: this.form.deliveryDate,
              content: this.form.content,
              createTime: new Date().toLocaleString(),
              status: 'DRAFT' // 标记为草稿（发送失败）
            };

            // 保存到本地存储（用于预览）
            try {
              const letters = uni.getStorageSync('xinxiang_letters') || [];
              letters.unshift(localData);
              uni.setStorageSync('xinxiang_letters', letters);
            } catch (e) {
              console.warn('保存本地预览数据失败', e);
            }
            
            uni.showToast({ 
              title: sendError.message || '创建成功，但发送失败，请稍后重试', 
              icon: 'none',
              duration: 2000
            });
            
            // 即使发送失败也显示预览弹窗
            this.showPreviewModal = true;
          }
        } else {
          uni.showToast({ 
            title: response.message || '创建失败，请重试', 
            icon: 'none' 
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('创建未来情书失败:', error);
        uni.showToast({ 
          title: error.message || '创建失败，请重试', 
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 关闭预览弹窗并返回
    closePreviewAndBack() {
      this.showPreviewModal = false;
      setTimeout(() => {
        uni.navigateBack();
      }, 300);
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

.create-page {
  min-height: 100vh;
  background: #F8F0FC;
  padding: 24rpx;
  padding-bottom: 120rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 步骤指示器 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  margin-bottom: 24rpx;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #F3E8FF;
  color: #9B8FB8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.step.active .step-number {
  background: #DCC7E1;
  color: #ffffff;
}

.step-text {
  font-size: 24rpx;
  color: #9B8FB8;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.step.active .step-text {
  color: #DCC7E1;
  font-weight: 600;
}

.step-line {
  width: 120rpx;
  height: 2rpx;
  background: #F3E8FF;
  margin: 0 20rpx;
  margin-bottom: 28rpx;
}

/* 内容区域 */
.step-content {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  display: block;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 样式网格 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.style-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16rpx;
  overflow: hidden;
  border: 3rpx solid transparent;
  transition: all 0.3s ease;
}

.style-item.selected {
  border-color: #DCC7E1;
  box-shadow: 0 4rpx 12rpx rgba(220, 199, 225, 0.3);
}

.style-image {
  width: 100%;
  height: 100%;
}

.check-mark {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #DCC7E1;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

/* 自定义样式 */
.custom-section {
  margin-bottom: 32rpx;
}

.custom-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #F8F0FC 0%, #F3E8FF 100%);
  border-radius: 16rpx;
  border: 2rpx dashed #D8B4FE;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #6B5B95;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.btn-icon {
  font-size: 36rpx;
}

.custom-preview {
  margin-top: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  border: 2rpx solid #DCC7E1;
  cursor: pointer;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 400rpx;
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
  pointer-events: none;
}

/* 裁剪框预览 */
.crop-preview {
  position: absolute;
  border: 2rpx solid #DCC7E1;
  box-sizing: border-box;
  pointer-events: none;
}

/* 遮罩层 - 让未选中区域变暗 */
.mask-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mask-top,
.mask-bottom {
  position: absolute;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.mask-top {
  top: 0;
}

.mask-middle {
  position: absolute;
  left: 0;
  width: 100%;
  display: flex;
}

.mask-left,
.mask-right {
  background: rgba(0, 0, 0, 0.5);
  height: 100%;
}

.mask-center {
  height: 100%;
  /* 透明，显示选中区域 */
}

.preview-tip {
  display: block;
  text-align: center;
  padding: 16rpx;
  background: #F8F0FC;
  color: #DCC7E1;
  font-size: 24rpx;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 透明度调整弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.modal-preview {
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.modal-preview .preview-wrapper {
  height: 400rpx;
  position: relative;
}

/* 可拖动裁剪框 */
.crop-box {
  position: absolute;
  touch-action: none;
  cursor: move;
}

.crop-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3rpx solid #DCC7E1;
  box-sizing: border-box;
  background: rgba(220, 199, 225, 0.1);
}

.crop-corner {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: #DCC7E1;
  border: 2rpx solid #ffffff;
  border-radius: 50%;
}

.corner-tl {
  top: -10rpx;
  left: -10rpx;
}

.corner-tr {
  top: -10rpx;
  right: -10rpx;
}

.corner-bl {
  bottom: -10rpx;
  left: -10rpx;
}

.corner-br {
  bottom: -10rpx;
  right: -10rpx;
  width: 30rpx;
  height: 30rpx;
  background: #DCC7E1;
  cursor: se-resize;
}

.crop-hint {
  position: absolute;
  bottom: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 22rpx;
  color: #DCC7E1;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #F8F0FC;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #F3E8FF;
}

.opacity-control .control-label {
  font-size: 26rpx;
  color: #6B5B95;
  width: 100rpx;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.opacity-control .slider {
  flex: 1;
}

.opacity-control .control-value {
  font-size: 28rpx;
  color: #DCC7E1;
  font-weight: 600;
  width: 80rpx;
  text-align: right;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
}

.modal-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.modal-btn.cancel {
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 表单 */
.form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 28rpx;
  color: #6B5B95;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.form-input,
.picker-display {
  padding: 20rpx;
  background: #ffffff;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: 1rpx solid #F3E8FF;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.picker-display {
  color: #333;
}

.form-textarea {
  min-height: 300rpx;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: 1rpx solid #F3E8FF;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.char-count {
  font-size: 22rpx;
  color: #9B8FB8;
  text-align: right;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 按钮 */
.next-btn {
  width: 100%;
  padding: 24rpx;
  background: #DCC7E1;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  margin-top: 40rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.action-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
}

.back-btn,
.preview-btn,
.submit-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.back-btn {
  background: #F3E8FF;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.preview-btn {
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.submit-btn {
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.preview-modal-btn.adjust {
  background: #F3E8FF;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.preview-modal-btn.close {
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 信件预览弹窗 */
.preview-modal-overlay {
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

.preview-modal-content {
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

.preview-modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #6B5B95;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.letter-preview {
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
  justify-content: flex-end;
  padding-top: 24rpx;
  border-top: 2rpx solid rgba(0, 0, 0, 0.1);
}

.letter-sign {
  font-size: 26rpx;
  color: #9B8FB8;
  font-style: italic;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.preview-modal-actions {
  display: flex;
  gap: 16rpx;
}

.preview-modal-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.preview-modal-btn.confirm {
  background: #DCC7E1;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
