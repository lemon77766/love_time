<template>
  <view class="create-page">
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
          v-for="i in [1, 2, 4, 5, 6, 7]" 
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
        
        <view v-if="customImage" class="custom-preview" @click="showOpacityModal = true">
          <view class="preview-wrapper">
            <image class="preview-bg" :src="customImage" mode="aspectFill"></image>
            <view class="preview-overlay" :style="{ opacity: 1 - opacity / 100 }"></view>
            <!-- 遮罩层：使未选中区域变暗 -->
            <view class="mask-layer">
              <!-- 上部遮罩 -->
              <view class="mask-top" :style="{ height: cropArea.top + '%' }"></view>
              <!-- 中间部分 -->
              <view class="mask-middle" :style="{ top: cropArea.top + '%', height: cropArea.height + '%' }">
                <!-- 左边遮罩 -->
                <view class="mask-left" :style="{ width: cropArea.left + '%' }"></view>
                <!-- 选中区域（透明） -->
                <view class="mask-center" :style="{ width: cropArea.width + '%' }"></view>
                <!-- 右边遮罩 -->
                <view class="mask-right" :style="{ width: (100 - cropArea.left - cropArea.width) + '%' }"></view>
              </view>
              <!-- 下部遮罩 -->
              <view class="mask-bottom" :style="{ top: (cropArea.top + cropArea.height) + '%', height: (100 - cropArea.top - cropArea.height) + '%' }"></view>
            </view>
            <!-- 裁剪框边框 -->
            <view class="crop-preview" :style="{
              left: cropArea.left + '%',
              top: cropArea.top + '%',
              width: cropArea.width + '%',
              height: cropArea.height + '%'
            }"></view>
          </view>
          <text class="preview-tip">点击调整透明度和选定区域</text>
        </view>
      </view>

      <button class="next-btn" @click="nextStep">下一步</button>
    </view>

    <!-- 透明度调整弹窗 -->
    <view v-if="showOpacityModal" class="modal-overlay" @click="showOpacityModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">调整图片</text>
        
        <view class="modal-preview">
          <view 
            class="preview-wrapper"
            @touchmove="onDrag"
            @touchend="endDrag"
          >
            <image 
              class="preview-bg" 
              :src="customImage" 
              mode="aspectFill"
              :style="{
                transform: 'scale(' + (imageScale / 100) + ')',
                transformOrigin: 'center center'
              }"
            ></image>
            <view class="preview-overlay" :style="{ opacity: 1 - opacity / 100 }"></view>
            
            <!-- 遮罩层：使未选中区域变暗 -->
            <view class="mask-layer">
              <!-- 上部遮罩 -->
              <view class="mask-top" :style="{ height: cropArea.top + '%' }"></view>
              <!-- 中间部分 -->
              <view class="mask-middle" :style="{ top: cropArea.top + '%', height: cropArea.height + '%' }">
                <!-- 左边遮罩 -->
                <view class="mask-left" :style="{ width: cropArea.left + '%' }"></view>
                <!-- 选中区域（透明） -->
                <view class="mask-center" :style="{ width: cropArea.width + '%' }"></view>
                <!-- 右边遮罩 -->
                <view class="mask-right" :style="{ width: (100 - cropArea.left - cropArea.width) + '%' }"></view>
              </view>
              <!-- 下部遮罩 -->
              <view class="mask-bottom" :style="{ top: (cropArea.top + cropArea.height) + '%', height: (100 - cropArea.top - cropArea.height) + '%' }"></view>
            </view>
            
            <!-- 可拖动的裁剪框 -->
            <view 
              class="crop-box"
              :style="{
                left: cropArea.left + '%',
                top: cropArea.top + '%',
                width: cropArea.width + '%',
                height: cropArea.height + '%'
              }"
              @touchstart="startDrag"
              @touchmove.stop="onDrag"
              @touchend="endDrag"
            >
              <view class="crop-border"></view>
              <view class="crop-corner corner-tl"></view>
              <view class="crop-corner corner-tr"></view>
              <view class="crop-corner corner-bl"></view>
              <view 
                class="crop-corner corner-br"
                @touchstart.stop="startResize"
                @touchmove.stop="onResize"
                @touchend="endDrag"
              ></view>
              <text class="crop-hint">拖动移动，右下角调整大小</text>
            </view>
          </view>
        </view>

        <view class="opacity-control">
          <text class="control-label">透明度</text>
          <slider 
            class="slider"
            :value="opacity" 
            @change="onOpacityChange" 
            @changing="onOpacityChanging"
            min="0" 
            max="100"
            activeColor="#2bad81"
            block-size="20"
          />
          <text class="control-value">{{ opacity }}%</text>
        </view>

        <!-- 新增：图片缩放控制 -->
        <view class="opacity-control">
          <text class="control-label">底图大小</text>
          <slider 
            class="slider"
            :value="imageScale" 
            @change="onScaleChange" 
            @changing="onScaleChanging"
            min="50" 
            max="200"
            activeColor="#2bad81"
            block-size="20"
          />
          <text class="control-value">{{ imageScale }}%</text>
        </view>

        <view class="modal-actions">
          <button class="modal-btn cancel" @click="finishAdjust">完成</button>
        </view>
      </view>
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

        <!-- 对方手机号 -->
        <view class="form-item">
          <text class="form-label">对方手机号</text>
          <input 
            class="form-input" 
            v-model="form.phone" 
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
          />
        </view>

        <!-- 对方微信号 -->
        <view class="form-item">
          <text class="form-label">对方微信号</text>
          <input 
            class="form-input" 
            v-model="form.wechat" 
            placeholder="请输入微信号（选填）"
          />
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
              :style="{
                transform: 'scale(' + (imageScale / 100) + ')',
                transformOrigin: 'center center'
              }"
            ></image>
            
            <!-- 透明度遮罩 -->
            <view class="letter-overlay" :style="{ opacity: 1 - opacity / 100 }"></view>
            
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
                <text class="letter-sign" v-if="form.phone">—— 给 {{ form.phone.slice(0, 3) }}****{{ form.phone.slice(-4) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 调整控制区域 -->
        <view class="preview-controls">
          <view class="opacity-control">
            <text class="control-label">透明度</text>
            <slider 
              class="slider"
              :value="opacity" 
              @change="onOpacityChange" 
              @changing="onOpacityChanging"
              min="0" 
              max="100"
              activeColor="#2bad81"
              block-size="20"
            />
            <text class="control-value">{{ opacity }}%</text>
          </view>

          <view class="opacity-control">
            <text class="control-label">底图大小</text>
            <slider 
              class="slider"
              :value="imageScale" 
              @change="onScaleChange" 
              @changing="onScaleChanging"
              min="50" 
              max="200"
              activeColor="#2bad81"
              block-size="20"
            />
            <text class="control-value">{{ imageScale }}%</text>
          </view>
        </view>

        <view class="preview-modal-actions">
          <button class="preview-modal-btn adjust" @click="openAdjustFromPreview">调整底图</button>
          <button class="preview-modal-btn close" @click="showLivePreviewModal = false">关闭</button>
        </view>
      </view>
    </view>

    <!-- 调整弹窗（透明度+裁剪） -->
    <view v-if="showOpacityModal" class="modal-overlay" @click="showOpacityModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">调整底图</text>
        
        <view class="modal-preview">
          <view 
            class="preview-wrapper"
            @touchmove="onDrag"
            @touchend="endDrag"
          >
            <image 
              class="preview-bg" 
              :src="letterBackground" 
              mode="aspectFill"
              :style="{
                transform: 'scale(' + (imageScale / 100) + ')',
                transformOrigin: 'center center'
              }"
            ></image>
            <view class="preview-overlay" :style="{ opacity: 1 - opacity / 100 }"></view>
            
            <!-- 遮罩层：使未选中区域变暗 -->
            <view class="mask-layer" v-if="isCustomStyle">
              <view class="mask-top" :style="{ height: cropArea.top + '%' }"></view>
              <view class="mask-middle" :style="{ top: cropArea.top + '%', height: cropArea.height + '%' }">
                <view class="mask-left" :style="{ width: cropArea.left + '%' }"></view>
                <view class="mask-center" :style="{ width: cropArea.width + '%' }"></view>
                <view class="mask-right" :style="{ width: (100 - cropArea.left - cropArea.width) + '%' }"></view>
              </view>
              <view class="mask-bottom" :style="{ top: (cropArea.top + cropArea.height) + '%', height: (100 - cropArea.top - cropArea.height) + '%' }"></view>
            </view>
            
            <!-- 可拖动的裁剪框 -->
            <view 
              v-if="isCustomStyle"
              class="crop-box"
              :style="{
                left: cropArea.left + '%',
                top: cropArea.top + '%',
                width: cropArea.width + '%',
                height: cropArea.height + '%'
              }"
              @touchstart="startDrag"
              @touchmove.stop="onDrag"
              @touchend="endDrag"
            >
              <view class="crop-border"></view>
              <view class="crop-corner corner-tl"></view>
              <view class="crop-corner corner-tr"></view>
              <view class="crop-corner corner-bl"></view>
              <view 
                class="crop-corner corner-br"
                @touchstart.stop="startResize"
                @touchmove.stop="onResize"
                @touchend="endDrag"
              ></view>
              <text class="crop-hint">拖动移动，右下角调整大小</text>
            </view>
          </view>
        </view>

        <view class="opacity-control">
          <text class="control-label">透明度</text>
          <slider 
            class="slider"
            :value="opacity" 
            @change="onOpacityChange" 
            @changing="onOpacityChanging"
            min="0" 
            max="100"
            activeColor="#2bad81"
            block-size="20"
          />
          <text class="control-value">{{ opacity }}%</text>
        </view>

        <!-- 新增：图片缩放控制 -->
        <view class="opacity-control">
          <text class="control-label">底图大小</text>
          <slider 
            class="slider"
            :value="imageScale" 
            @change="onScaleChange" 
            @changing="onScaleChanging"
            min="50" 
            max="200"
            activeColor="#2bad81"
            block-size="20"
          />
          <text class="control-value">{{ imageScale }}%</text>
        </view>

        <view class="modal-actions">
          <button class="modal-btn cancel" @click="finishAdjust">完成</button>
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
              :style="{
                clipPath: isCustomStyle ? `inset(${cropArea.top}% ${100-cropArea.left-cropArea.width}% ${100-cropArea.top-cropArea.height}% ${cropArea.left}%)` : 'none'
              }"
            ></image>
            
            <!-- 透明度遮罩 -->
            <view class="letter-overlay" :style="{ opacity: 1 - opacity / 100 }"></view>
            
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
                <text class="letter-sign">—— 给 {{ form.phone.slice(0, 3) }}****{{ form.phone.slice(-4) }}</text>
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
export default {
  data() {
    return {
      currentStep: 1,
      selectedStyle: 1,
      isCustomStyle: false,
      customImage: '',
      opacity: 100,
      showOpacityModal: false,
      showPreviewModal: false,
      showLivePreviewModal: false,
      // 裁剪区域相关
      cropArea: {
        left: 0,
        top: 0,
        width: 100,
        height: 100
      },
      // 底图缩放比例（100% 为原始大小）
      imageScale: 100,
      // 是否从预览打开的调整弹窗
      fromPreview: false,
      isDragging: false,
      isResizing: false,
      dragStart: { x: 0, y: 0 },
      imageInfo: { width: 0, height: 0 },
      form: {
        title: '',
        deliveryDate: '',
        phone: '',
        wechat: '',
        content: ''
      }
    };
  },
  computed: {
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
  methods: {
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
          this.opacity = 100;
          // 重置裁剪区域
          this.cropArea = {
            left: 10,
            top: 10,
            width: 80,
            height: 80
          };
          // 获取图片信息
          uni.getImageInfo({
            src: res.tempFilePaths[0],
            success: (info) => {
              this.imageInfo = {
                width: info.width,
                height: info.height
              };
            }
          });
          this.showOpacityModal = true;
          uni.showToast({ title: '自定义底图已选择', icon: 'success' });
        }
      });
    },
    
    // 调整透明度（滑动中）
    onOpacityChanging(e) {
      this.opacity = e.detail.value;
    },
    
    // 调整透明度（松开）
    onOpacityChange(e) {
      this.opacity = e.detail.value;
    },
    
    // 调整图片缩放（滑动中）
    onScaleChanging(e) {
      this.imageScale = e.detail.value;
    },
    
    // 调整图片缩放（松开）
    onScaleChange(e) {
      this.imageScale = e.detail.value;
    },
    
    // 开始拖动裁剪框
    startDrag(e) {
      this.isDragging = true;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    
    // 拖动裁剪框
    onDrag(e) {
      if (!this.isDragging) return;
      
      const deltaX = e.touches[0].clientX - this.dragStart.x;
      const deltaY = e.touches[0].clientY - this.dragStart.y;
      
      // 转换为百分比（假设预览区域宽度为 600rpx）
      const percentX = (deltaX / 600) * 100;
      const percentY = (deltaY / 600) * 100;
      
      let newLeft = this.cropArea.left + percentX;
      let newTop = this.cropArea.top + percentY;
      
      // 边界限制
      newLeft = Math.max(0, Math.min(100 - this.cropArea.width, newLeft));
      newTop = Math.max(0, Math.min(100 - this.cropArea.height, newTop));
      
      this.cropArea.left = newLeft;
      this.cropArea.top = newTop;
      
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },
    
    // 结束拖动
    endDrag() {
      this.isDragging = false;
      this.isResizing = false;
    },
    
    // 开始调整大小
    startResize(e) {
      this.isResizing = true;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      e.stopPropagation();
    },
    
    // 调整大小
    onResize(e) {
      if (!this.isResizing) return;
      
      const deltaX = e.touches[0].clientX - this.dragStart.x;
      const deltaY = e.touches[0].clientY - this.dragStart.y;
      
      const percentX = (deltaX / 600) * 100;
      const percentY = (deltaY / 600) * 100;
      
      let newWidth = this.cropArea.width + percentX;
      let newHeight = this.cropArea.height + percentY;
      
      // 边界限制
      newWidth = Math.max(20, Math.min(100 - this.cropArea.left, newWidth));
      newHeight = Math.max(20, Math.min(100 - this.cropArea.top, newHeight));
      
      this.cropArea.width = newWidth;
      this.cropArea.height = newHeight;
      
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      e.stopPropagation();
    },
    
    // 打开预览弹窗
    openPreview() {
      this.showLivePreviewModal = true;
    },
    
    // 完成调整（智能判断是否需要返回预览）
    finishAdjust() {
      this.showOpacityModal = false;
      // 如果是从预览打开的，返回预览；否则关闭modal
      if (this.fromPreview) {
        this.showLivePreviewModal = true;
        this.fromPreview = false;
      }
    },
    
    // 从预览打开调整弹窗
    openAdjustFromPreview() {
      this.fromPreview = true;
      this.showLivePreviewModal = false;
      this.showOpacityModal = true;
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
    submitLetter() {
      // 验证必填项
      if (!this.form.title) {
        uni.showToast({ title: '请填写信件主题', icon: 'none' });
        return;
      }
      if (!this.form.deliveryDate) {
        uni.showToast({ title: '请选择送达时间', icon: 'none' });
        return;
      }
      if (!this.form.phone) {
        uni.showToast({ title: '请填写手机号', icon: 'none' });
        return;
      }
      if (this.form.phone.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return;
      }
      if (!this.form.content) {
        uni.showToast({ title: '请填写信件内容', icon: 'none' });
        return;
      }

      // 构建信件数据
      const letterData = {
        style: this.isCustomStyle ? 'custom' : this.selectedStyle,
        customImage: this.customImage,
        opacity: this.opacity,
        cropArea: this.cropArea,
        title: this.form.title,
        deliveryDate: this.form.deliveryDate,
        phone: this.form.phone,
        wechat: this.form.wechat,
        content: this.form.content,
        createTime: new Date().toLocaleString()
      };

      // 保存到本地存储
      try {
        const letters = uni.getStorageSync('xinxiang_letters') || [];
        letters.unshift(letterData);
        uni.setStorageSync('xinxiang_letters', letters);
        
        // 显示预览弹窗
        this.showPreviewModal = true;
      } catch (e) {
        uni.showToast({ title: '提交失败，请重试', icon: 'none' });
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
.create-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
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
  background: #e5e5e5;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.step.active .step-number {
  background: #2bad81;
  color: #ffffff;
}

.step-text {
  font-size: 24rpx;
  color: #999;
}

.step.active .step-text {
  color: #2bad81;
  font-weight: 600;
}

.step-line {
  width: 120rpx;
  height: 2rpx;
  background: #e5e5e5;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
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
  border-color: #2bad81;
  box-shadow: 0 4rpx 12rpx rgba(43, 173, 129, 0.3);
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
  background: #2bad81;
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
  background: linear-gradient(135deg, #f0f0f0 0%, #e5e5e5 100%);
  border-radius: 16rpx;
  border: 2rpx dashed #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.btn-icon {
  font-size: 36rpx;
}

.custom-preview {
  margin-top: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  border: 2rpx solid #2bad81;
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
  border: 2rpx solid #2bad81;
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
  background: #f5f5f5;
  color: #2bad81;
  font-size: 24rpx;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
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
  border: 3rpx solid #2bad81;
  box-sizing: border-box;
  background: rgba(43, 173, 129, 0.1);
}

.crop-corner {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: #2bad81;
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
  background: #2bad81;
  cursor: se-resize;
}

.crop-hint {
  position: absolute;
  bottom: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 22rpx;
  color: #2bad81;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.opacity-control .control-label {
  font-size: 26rpx;
  color: #666;
  width: 100rpx;
}

.opacity-control .slider {
  flex: 1;
}

.opacity-control .control-value {
  font-size: 28rpx;
  color: #2bad81;
  font-weight: 700;
  width: 80rpx;
  text-align: right;
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
  background: #2bad81;
  color: #ffffff;
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
  color: #333;
  font-weight: 600;
}

.form-input,
.picker-display {
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: 1rpx solid #e5e5e5;
}

.picker-display {
  color: #333;
}

.form-textarea {
  min-height: 300rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: 1rpx solid #e5e5e5;
}

.char-count {
  font-size: 22rpx;
  color: #999;
  text-align: right;
}

/* 按钮 */
.next-btn {
  width: 100%;
  padding: 24rpx;
  background: #2bad81;
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  margin-top: 40rpx;
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
  background: #f0f0f0;
  color: #666;
}

.preview-btn {
  background: linear-gradient(135deg, #2bad81 0%, #25a172 100%);
  color: #ffffff;
}

.submit-btn {
  background: #2bad81;
  color: #ffffff;
}

.preview-modal-btn.adjust {
  background: #f0f0f0;
  color: #666;
}

.preview-modal-btn.close {
  background: #2bad81;
  color: #ffffff;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
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
  justify-content: flex-end;
  padding-top: 24rpx;
  border-top: 2rpx solid rgba(0, 0, 0, 0.1);
}

.letter-sign {
  font-size: 26rpx;
  color: #666;
  font-style: italic;
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
  background: #2bad81;
  color: #ffffff;
}
</style>
