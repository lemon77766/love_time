<template>
  <view class="create-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏（与首页一致） -->
    <view class="custom-navbar">
      <view class="navbar-gradient-bg"></view>
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">爱心照片墙</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>
    <view class="center">
      <view id="heartArea" class="heart-grid">
        <view v-for="(cell, idx) in heartMask" :key="idx" class="cell" :class="{ hole: !cell, filled: cell && images[idx] }" @tap="onPickSingle(idx)">
          <image v-if="images[idx]" :src="images[idx]" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- 照片数量提示 -->
    <view class="photo-count">
      <text class="count-text">已添加 {{ filledCount }}/{{ totalSlots }} 张照片</text>
      <text v-if="filledCount > 0" class="clear-btn" @click="clearAllImages">清空</text>
    </view>

    <view class="actions">
      <button class="btn yellow" @click="onBatchUpload">
        批量上传照片 ({{ remainingSlots > 0 ? `还可添加${Math.min(9, remainingSlots)}张` : '已满' }})
      </button>
      <button class="btn green" @click="onSaveProject">保存项目</button>
      <button class="btn pink" @click="exportAsImage" v-if="filledCount > 0">导出为图片</button>
    </view>
    
    <!-- 隐藏的 Canvas 用于导出图片 -->
    <canvas canvas-id="exportCanvas" id="exportCanvas" style="width: 750px; height: 1000px; position: fixed; top: -10000px; left: -10000px; background: #FFFAF4;"></canvas>
  </view>
</template>

<script>
import { createProject, updateProject, uploadPhoto, uploadPhotoWithFile, getProjectDetail, getProjectPhotos, clearProjectPhotos, updatePhoto } from '@/api/heartwall.js';
import http from '@/utils/http.js';
import config from '@/utils/config.js';

// 处理图片URL：如果是相对路径，拼接baseURL
function processImageUrl(url) {
  if (!url || url === '') {
    return '';
  }
  
  // 如果已经是完整的URL（http:// 或 https://），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果是相对路径（以 / 开头），拼接baseURL
  if (url.startsWith('/')) {
    // 兼容错误返回的前端路径，如 /pages/heartwall/uploads/... -> 归一化为 /uploads/... 或去掉 /pages 前缀
    if (url.startsWith('/pages/')) {
      const stripped = url.replace(/^\/pages/, '');
      const uploadsIndex = stripped.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        url = stripped.slice(uploadsIndex);
      } else {
        url = stripped.startsWith('/') ? stripped : '/' + stripped;
      }
    }
    // 移除baseURL末尾可能存在的斜杠，避免双斜杠
    const baseUrl = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
    return baseUrl + url;
  }
  
  // 其他情况（可能是相对路径但不以/开头），也尝试拼接
  const baseUrl = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
  return baseUrl + '/' + url;
}

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      // 9x9 心形掩码（1 表示可填充，0 表示空位）；可按需调整
      heartMask: [
        0,1,1,0,0,1,1,0,0,
        1,1,1,1,1,1,1,1,0,
        1,1,1,1,1,1,1,1,0,
        1,1,1,1,1,1,1,1,0,
        0,1,1,1,1,1,1,0,0,
        0,0,1,1,1,1,0,0,0,
        0,0,0,1,1,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0
      ],
      images: [],
      editingProjectId: null,  // 正在编辑的项目ID，null 表示创建新项目
      saving: false,  // 保存中状态
      photoMap: {},  // 存储positionIndex到photoId的映射 { positionIndex: photoId }
      canvasWidth: 0,
      canvasHeight: 0
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      return totalHeightPx * pxToRpx + 'rpx';
    },
    // 总共可填充的位置数
    totalSlots() {
      return this.heartMask.filter(cell => cell === 1).length;
    },
    // 已填充的照片数
    filledCount() {
      let count = 0;
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && this.images[i]) {
          count++;
        }
      }
      return count;
    },
    // 剩余可添加的照片数
    remainingSlots() {
      return this.totalSlots - this.filledCount;
    }
  },
  async mounted() {
    this.getSystemInfo();
    // 检查是否在编辑现有项目
    try {
      const editingProjectId = uni.getStorageSync('heartwall_editing_projectId');
      if (editingProjectId) {
        this.editingProjectId = editingProjectId;
        // 从后端加载项目数据
        await this.loadProjectFromBackend(editingProjectId);
      } else {
        // 如果没有项目ID，尝试从本地缓存加载（兼容旧数据）
      const cached = uni.getStorageSync('heartwall_grid_images');
      if (Array.isArray(cached)) {
        this.images = cached;
      }
      }
    } catch (e) {
      console.error('加载项目数据失败:', e);
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    // 导出为图片功能
    async exportAsImage() {
      // 检查是否有照片
      if (this.filledCount === 0) {
        uni.showToast({
          title: '请先添加照片再导出',
          icon: 'none'
        });
        return;
      }
      
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
      uni.showLoading({ title: '正在生成精美图片...', mask: true });
      
      try {
        // 使用固定的画布尺寸
        const canvasWidth = 750; // 与Canvas元素宽度一致
        const canvasHeight = 1000; // 与Canvas元素高度一致
        const cellSize = 70; // 固定格子大小
        const gridWidth = cellSize * 9;
        const gridHeight = cellSize * 9;
        const startX = (canvasWidth - gridWidth) / 2; // 居中显示
        const startY = 180; // 从顶部180px开始绘制
        
        // 创建画布上下文
        const ctx = uni.createCanvasContext('exportCanvas', this);
        
        // 清空画布
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 设置画布背景 - 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#FFF0F5'); // 浅粉色
        gradient.addColorStop(1, '#FFE4E1'); // 浅玫瑰色
        ctx.setFillStyle(gradient);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制顶部装饰线条
        ctx.setStrokeStyle('#FFB6C1');
        ctx.setLineWidth(2);
        ctx.beginPath();
        ctx.moveTo(startX, startY - 30);
        ctx.lineTo(startX + gridWidth, startY - 30);
        ctx.stroke();
        
        // 绘制底部装饰线条
        ctx.beginPath();
        ctx.moveTo(startX, startY + gridHeight + 30);
        ctx.lineTo(startX + gridWidth, startY + gridHeight + 30);
        ctx.stroke();
        
        // 绘制装饰性心形图标
        ctx.setFontSize(36);
        ctx.setFillStyle('#FF69B4');
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText('♥', canvasWidth / 2, 60);
        
        // 绘制标题
        ctx.setFontSize(28);
        ctx.setFillStyle('#8B4513'); // 棕色
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText('爱心照片墙', canvasWidth / 2, 100);
        
        // 绘制统计信息
        ctx.setFontSize(18);
        ctx.setFillStyle('#8B4513');
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(`共 ${this.filledCount} 张珍贵照片`, canvasWidth / 2, 140);
        
        // 绘制心形图案
        // 绘制每个格子
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const idx = row * 9 + col;
            
            // 如果是心形区域
            if (this.heartMask[idx]) {
              const x = startX + col * cellSize;
              const y = startY + row * cellSize;
              
              // 绘制圆角矩形背景
              this.drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
              ctx.setFillStyle('rgba(255, 255, 255, 0.9)');
              ctx.fill();
              ctx.setStrokeStyle('#FFB6C1');
              ctx.setLineWidth(1);
              ctx.stroke();
              
              // 如果有图片，则绘制图片
              if (this.images[idx]) {
                // 等待图片加载完成后再绘制
                await this.drawImageOnCanvas(ctx, this.images[idx], x + 2, y + 2, cellSize - 4, cellSize - 4);
              } else {
                // 绘制空格子的提示
                ctx.setFontSize(12);
                ctx.setFillStyle('#FFB6C1');
                ctx.setTextAlign('center');
                ctx.setTextBaseline('middle');
                ctx.fillText('+', x + cellSize / 2, y + cellSize / 2);
              }
            }
          }
        }
        
        // 绘制底部信息
        ctx.setFontSize(16);
        ctx.setFillStyle('#8B4513');
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText('Created with Love Time', canvasWidth / 2, canvasHeight - 50);
        ctx.fillText(new Date().toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }), canvasWidth / 2, canvasHeight - 20);
        
        // 绘制底部装饰心形
        ctx.setFontSize(20);
        ctx.setFillStyle('#FF69B4');
        ctx.fillText('♥ ♡ ♥ ♡ ♥', canvasWidth / 2, canvasHeight - 80);
        
        // 绘制完成，保存到相册
        ctx.draw(true, () => {  // 使用同步绘制
          // 延迟一会儿确保绘制完成
          setTimeout(() => {
            uni.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: canvasWidth,
              height: canvasHeight,
              destWidth: canvasWidth * 2, // 提高分辨率
              destHeight: canvasHeight * 2,
              canvasId: 'exportCanvas',
              fileType: 'png',
              quality: 1,
              success: (res) => {
                // 检查返回的临时文件路径
                if (!res.tempFilePath) {
                  uni.hideLoading();
                  uni.showToast({
                    title: '导出失败：无法生成图片',
                    icon: 'none'
                  });
                  return;
                }
                
                // 保存到相册
                uni.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: () => {
                    uni.hideLoading();
                    
                    // 保存成功后，提供分享选项
                    this.showShareOptions(res.tempFilePath);
                  },
                  fail: (err) => {
                    uni.hideLoading();
                    console.error('保存图片失败:', err);
                    // 检查是否是因为权限问题
                    if (err.errMsg && err.errMsg.includes('auth deny')) {
                      uni.showModal({
                        title: '权限申请',
                        content: '需要相册权限才能保存图片，请在设置中开启相册权限',
                        showCancel: true,
                        confirmText: '去设置',
                        success: (modalRes) => {
                          if (modalRes.confirm) {
                            // #ifdef MP-WEIXIN
                            uni.openSetting({
                              success: (settingRes) => {
                                if (settingRes.authSetting['scope.writePhotosAlbum']) {
                                  uni.showToast({
                                    title: '权限已开启，请重新导出',
                                    icon: 'none'
                                  });
                                }
                              },
                              fail: (settingErr) => {
                                console.error('打开设置失败:', settingErr);
                                uni.showToast({
                                  title: '打开设置失败',
                                  icon: 'none'
                                });
                              }
                            });
                            // #endif
                          }
                        },
                        fail: (modalErr) => {
                          console.error('显示模态框失败:', modalErr);
                          uni.showToast({
                            title: '操作失败',
                            icon: 'none'
                          });
                        }
                      });
                    } else {
                      uni.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                      });
                    }
                  }
                });
              },
              fail: (err) => {
                uni.hideLoading();
                console.error('导出图片失败:', err);
                uni.showToast({
                  title: '导出失败: ' + (err.errMsg || '无法生成图片'),
                  icon: 'none'
                });
              }
            }, this);
          }, 1500); // 增加延迟时间确保绘制完成
        });
      } catch (error) {
        uni.hideLoading();
        console.error('导出图片失败:', error);
        uni.showToast({
          title: '导出失败: ' + (error.message || '未知错误'),
          icon: 'none'
        });
      }
    },

    // 显示分享选项
    showShareOptions(imagePath) {
      uni.showActionSheet({
        itemList: ['预览并分享', '保存到相册', '取消'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 预览并分享
            this.previewAndShare(imagePath);
          } else if (res.tapIndex === 1) {
            // 仅保存到相册
            uni.showToast({
              title: '已保存到相册',
              icon: 'success',
              duration: 1500
            });
          }
          // tapIndex === 2 是取消，不做任何操作
        },
        fail: (err) => {
          console.error('显示分享选项失败:', err);
        }
      });
    },

    // 预览并分享
    previewAndShare(imagePath) {
      // 先预览图片
      uni.previewImage({
        current: imagePath,
        urls: [imagePath],
        success: () => {
          console.log('图片预览成功');
          
          // 延迟显示分享菜单，让用户先看到预览效果
          setTimeout(() => {
            // #ifdef MP-WEIXIN
            // 微信小程序环境下显示分享菜单
            this.showWechatShareMenu(imagePath);
            // #endif
            
            // #ifndef MP-WEIXIN
            // 非微信环境使用通用分享
            this.showUniversalShare(imagePath);
            // #endif
          }, 800);
        },
        fail: (error) => {
          console.error('图片预览失败:', error);
          uni.showToast({
            title: '图片预览失败',
            icon: 'none',
            duration: 1500
          });
        }
      });
    },

    // 微信分享菜单
    showWechatShareMenu(imagePath) {
      // 在微信小程序中，通过显示提示引导用户使用右上角菜单分享
      uni.showModal({
        title: '分享提示',
        content: '请点击右上角"..."按钮，选择"转发"来分享这张爱心照片墙',
        confirmText: '我知道了',
        showCancel: false,
        success: () => {
          console.log('已提示用户使用右上角菜单分享');
        }
      });
    },
            content: '可以直接点击右上角「...」按钮进行分享',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });
    },

    // 通用分享
    showUniversalShare(imagePath) {
      try {
        // 检查是否支持系统分享
        if (typeof uni.shareWithSystem === 'function') {
          uni.shareWithSystem({
            type: 'image',
            imageUrl: imagePath,
            success: () => {
              uni.showToast({
                title: '分享成功',
                icon: 'success',
                duration: 1500
              });
            },
            fail: (error) => {
              console.error('系统分享失败:', error);
              this.showShareFallback(imagePath);
            }
          });
        } else {
          // 不支持系统分享，使用降级方案
          this.showShareFallback(imagePath);
        }
      } catch (error) {
        console.error('分享功能异常:', error);
        this.showShareFallback(imagePath);
      }
    },

    // 分享功能降级方案
    showShareFallback(imagePath) {
      uni.showModal({
        title: '分享提示',
        content: '图片已保存到相册，您可以打开相册进行分享',
        confirmText: '知道了',
        showCancel: false,
        success: () => {
          console.log('已提示用户通过相册分享');
        }
      });
    },
    
    // 在Canvas上绘制图片的异步方法
    drawImageOnCanvas(ctx, imageUrl, x, y, width, height) {
      return new Promise((resolve) => {
        // 检查图片URL是否有效
        if (!imageUrl || typeof imageUrl !== 'string') {
          console.warn('无效的图片URL:', imageUrl);
          this.drawPlaceholder(ctx, x, y, width, height);
          resolve();
          return;
        }
        
        // 在不同平台使用不同的图片加载方式
        // #ifdef MP-WEIXIN
        // 微信小程序环境下使用 getImageInfo
        uni.getImageInfo({
          src: imageUrl,
          success: (info) => {
            // 确保图片有效再绘制
            if (info && info.path) {
              try {
                ctx.drawImage(info.path, x, y, width, height);
              } catch (drawErr) {
                console.warn('绘制图片失败:', drawErr);
                this.drawPlaceholder(ctx, x, y, width, height);
              }
            } else {
              // 图片无效时绘制占位符
              this.drawPlaceholder(ctx, x, y, width, height);
            }
            resolve();
          },
          fail: (err) => {
            console.warn('图片加载失败:', imageUrl, err);
            // 图片加载失败时绘制占位符
            this.drawPlaceholder(ctx, x, y, width, height);
            resolve();
          }
        });
        // #endif
        
        // #ifndef MP-WEIXIN
        // 其他环境使用传统方式
        const img = new Image();
        img.onload = () => {
          // 确保图片有效再绘制
          if (img.complete && img.naturalWidth !== 0) {
            try {
              ctx.drawImage(img, x, y, width, height);
            } catch (drawErr) {
              console.warn('绘制图片失败:', drawErr);
              this.drawPlaceholder(ctx, x, y, width, height);
            }
          } else {
            // 图片无效时绘制占位符
            this.drawPlaceholder(ctx, x, y, width, height);
          }
          resolve();
        };
        img.onerror = () => {
          console.warn('图片加载失败:', imageUrl);
          // 图片加载失败时绘制占位符
          this.drawPlaceholder(ctx, x, y, width, height);
          resolve();
        };
        img.src = imageUrl;
        // #endif
      });
    },
    
    // 绘制占位符（当图片加载失败时）
    drawPlaceholder(ctx, x, y, width, height) {
      // 绘制浅色背景
      ctx.setFillStyle('rgba(255, 255, 255, 0.7)');
      this.drawRoundedRect(ctx, x, y, width, height, 8);
      ctx.fill();
      
      // 绘制边框
      ctx.setStrokeStyle('#FFB6C1');
      ctx.setLineWidth(1);
      ctx.stroke();
      
      // 绘制占位符图标
      ctx.setFontSize(20);
      ctx.setFillStyle('#FFB6C1');
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText('♥', x + width / 2, y + height / 2);
    },

    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.setFillStyle('#ffffff');
      ctx.fill();
    },

    getSystemInfo() {
      // #ifdef MP-WEIXIN
      try {
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        if (windowInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sys = uni.getSystemInfoSync();
          this.statusBarHeight = sys.statusBarHeight || 0;
          this.screenWidth = sys.windowWidth || 375;
        }
      } catch (e) {
        const sys = uni.getSystemInfoSync();
        this.statusBarHeight = sys.statusBarHeight || 0;
        this.screenWidth = sys.windowWidth || 375;
      }
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      const sysH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysH5.statusBarHeight || 0;
      this.screenWidth = sysH5.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysOther.statusBarHeight || 0;
      this.screenWidth = sysOther.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
    },
    async onBatchUpload() {
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
      // 计算空位数量
      const emptySlots = this.getEmptySlots();
      if (emptySlots.length === 0) {
        uni.showToast({ title: '照片墙已满', icon: 'none' });
        return;
      }

      try {
        // uni-app 一次最多选择 9 张图片（微信小程序限制）
        const maxCount = Math.min(9, emptySlots.length);
        const res = await uni.chooseImage({ 
          count: maxCount, 
          sizeType: ['compressed'], 
          sourceType: ['album', 'camera'] 
        });
        
        if (!res || !res.tempFilePaths || res.tempFilePaths.length === 0) return;
        
        const files = res.tempFilePaths;
        
        // 按顺序填充空位
        for (let i = 0; i < files.length && i < emptySlots.length; i++) {
          const idx = emptySlots[i];
          this.$set(this.images, idx, files[i]);
        }
        
        this.persist();
        
        // 提示用户
        const remainingSlots = emptySlots.length - files.length;
        if (remainingSlots > 0) {
          uni.showToast({ 
            title: `已添加${files.length}张，还可添加${remainingSlots}张`, 
            icon: 'none',
            duration: 2000
          });
        } else {
          uni.showToast({ 
            title: `已添加${files.length}张照片`, 
            icon: 'success' 
          });
        }
      } catch (e) {
        console.error('批量上传失败:', e);
      }
    },
    
    // 获取所有空位的索引
    getEmptySlots() {
      const slots = [];
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && !this.images[i]) {
          slots.push(i);
        }
      }
      return slots;
    },
    
    // 清空所有照片
    async clearAllImages() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有照片吗？清空后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 如果有项目ID，调用后端接口清空
              if (this.editingProjectId) {
                uni.showLoading({ title: '清空中...', mask: true });
                console.log('🗑️ [爱心墙创建页] 开始清空项目照片，项目ID:', this.editingProjectId);
                
                await clearProjectPhotos(this.editingProjectId);
                
                console.log('✅ [爱心墙创建页] 项目照片清空成功');
                uni.hideLoading();
              }
              
              // 清空前端数据
              this.images = [];
              this.photoMap = {};
              this.persist();
              
            uni.showToast({ title: '已清空', icon: 'success' });
            } catch (error) {
              console.error('❌ [爱心墙创建页] 清空项目照片失败:', error);
              uni.hideLoading();
              
              // 即使后端清空失败，也清空前端数据
              this.images = [];
              this.persist();
              
              uni.showToast({ 
                title: error.message || '清空失败，已清空本地数据', 
                icon: 'none',
                duration: 2000
              });
            }
          }
        }
      });
    },
    // 上传图片到服务器的函数
    async uploadImageToServer(imagePath, projectId, positionIndex) {
      return new Promise((resolve, reject) => {
        // 使用uni.uploadFile上传图片
        const loginInfo = uni.getStorageSync('login_info');
        const token = loginInfo?.token;
        
        if (!token) {
          reject(new Error('未登录，无法上传图片'));
          return;
        }
        
        // 使用项目中已有的http工具进行上传，确保与项目其他上传功能保持一致
        // 传递projectId和positionIndex参数
        http.upload({
          url: '/api/heart-wall/photos/upload',
          filePath: imagePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          formData: {
            projectId: projectId.toString(),
            positionIndex: positionIndex.toString()
          }
        }).then(response => {
          // 从响应中提取图片URL
          // 根据实际响应结构解析：{photos: [{photoUrl: '...'}]}
          let photoUrl = null;
          // 检查photos数组
          if (response.photos && Array.isArray(response.photos) && response.photos.length > 0) {
            photoUrl = response.photos[0].photoUrl || response.photos[0].thumbnailUrl;
          } else if (response.data?.photos && Array.isArray(response.data.photos) && response.data.photos.length > 0) {
            photoUrl = response.data.photos[0].photoUrl || response.data.photos[0].thumbnailUrl;
          } else if (response.data?.data?.photos && Array.isArray(response.data.data.photos) && response.data.data.photos.length > 0) {
            photoUrl = response.data.data.photos[0].photoUrl || response.data.data.photos[0].thumbnailUrl;
          } else if (response.data?.photoUrl) {
            photoUrl = response.data.photoUrl;
          } else if (response.data?.url) {
            photoUrl = response.data.url;
          } else if (response.photoUrl) {
            photoUrl = response.photoUrl;
          } else if (response.url) {
            photoUrl = response.url;
          }
          
          if (photoUrl) {
            resolve(photoUrl);
          } else {
            console.warn('⚠️ [爱心墙创建页] 上传响应结构:', response);
            reject(new Error('上传成功但未返回图片URL'));
          }
        }).catch(error => {
          console.error('❌ [爱心墙创建页] 上传图片到服务器失败:', error);
          reject(new Error('上传失败: ' + (error.message || error.errMsg || '未知错误')));
        });
      });
    },
    
    async onPickSingle(idx) {
      if (!this.heartMask[idx]) return;
      
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
      try {
        // 选择新图片
        const res = await uni.chooseImage({ 
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        if (!res || !res.tempFilePaths || !res.tempFilePaths[0]) {
          return;
        }
        
        const newImagePath = res.tempFilePaths[0];
        const isExistingPhoto = this.images[idx] && this.editingProjectId;
        const photoId = this.photoMap[idx];
        
        console.log(`🔄 [爱心墙创建页] 检查替换条件: isExistingPhoto=${isExistingPhoto}, photoId=${photoId}, images[idx]=${!!this.images[idx]}, editingProjectId=${this.editingProjectId}`);
        
        // 如果已有项目且有photoId，说明是替换已有照片
        if (isExistingPhoto && photoId) {
          uni.showLoading({ title: '替换中...', mask: true });
          
          try {
            console.log(`🔄 [爱心墙创建页] 开始替换位置 ${idx} 的照片，photoId: ${photoId}`);
            
            // 1. 上传新图片到服务器
            console.log('📤 [爱心墙创建页] 上传新图片到服务器...');
            const photoUrl = await this.uploadImageToServer(newImagePath, this.editingProjectId, idx);
            console.log('✅ [爱心墙创建页] 新图片上传成功，URL:', photoUrl);
            
            // 2. 更新后端照片信息
            const updateData = {
              photoUrl: photoUrl,
              thumbnailUrl: photoUrl,
              positionIndex: idx
            };
            
            console.log('📝 [爱心墙创建页] 更新后端照片信息...');
            console.log(`📝 [爱心墙创建页] 更新参数: photoId=${photoId}, updateData=`, updateData);
            const updateResult = await updatePhoto(photoId, updateData);
            console.log('✅ [爱心墙创建页] 后端照片更新成功', updateResult);
            
            // 3. 更新前端显示
            this.$set(this.images, idx, photoUrl);
            this.persist();
            
            uni.hideLoading();
            
            // 通知项目列表页面需要刷新封面图
            uni.$emit('heartwallPhotoUpdated', {
              projectId: this.editingProjectId,
              positionIndex: idx,
              photoUrl: photoUrl
            });
            
            uni.showToast({ 
              title: '替换成功', 
              icon: 'success',
              duration: 1500
            });
          } catch (error) {
            console.error('❌ [爱心墙创建页] 替换照片失败:', error);
            uni.hideLoading();
            
            // 提供更详细的错误信息
            let errorMsg = error.message || '替换失败，请重试';
            if (error.message && error.message.includes('照片不存在')) {
              errorMsg = '照片不存在，请刷新页面后重试';
            } else if (error.statusCode === 500) {
              errorMsg = '服务器错误，请稍后重试';
            }
            
            uni.showToast({ 
              title: errorMsg,
              icon: 'none',
              duration: 3000
            });
          }
        } else {
          // 新添加照片（项目未创建或该位置没有照片）
          // 暂时只更新前端显示，保存项目时会统一上传
          this.$set(this.images, idx, newImagePath);
          this.persist();
          
          uni.showToast({ 
            title: '已添加照片', 
            icon: 'success',
            duration: 1000
          });
        }
      } catch (e) {
        console.error('❌ [爱心墙创建页] 选择图片失败:', e);
        uni.showToast({ 
          title: '选择图片失败', 
          icon: 'none'
        });
      }
    },
    onInvite() {
      uni.showToast({ title: '邀请功能待接入后端', icon: 'none' });
    },
    
    // 加载项目数据（从后端）
    async loadProjectFromBackend(projectId) {
      try {
        console.log('📡 [爱心墙创建页] 开始从后端加载项目详情 ID:', projectId);
        
        // 获取项目详情
        const projectResponse = await getProjectDetail(projectId);
        console.log('📡 [爱心墙创建页] 项目详情:', projectResponse);
        
        // 获取项目照片列表
        const photosResponse = await getProjectPhotos(projectId, { page: 1, pageSize: 100 });
        console.log('📡 [爱心墙创建页] 项目照片:', photosResponse);
        
        // 处理照片数据
        let photosData = [];
        if (photosResponse && photosResponse.data) {
          photosData = Array.isArray(photosResponse.data) ? photosResponse.data : (photosResponse.data.photos || []);
        } else if (Array.isArray(photosResponse)) {
          photosData = photosResponse;
        } else if (photosResponse && photosResponse.photos) {
          photosData = photosResponse.photos;
        }
        
        // 将照片按位置索引填充到images数组，同时保存photoId映射
        this.images = [];
        this.photoMap = {};
        photosData.forEach(photo => {
          const positionIndex = photo.positionIndex || photo.position_index || 0;
          // 更完善的photoId提取逻辑
          const photoId = photo.id || photo.photoId || photo.photo_id;
          if (positionIndex >= 0 && positionIndex < this.heartMask.length) {
            // 优先使用photoUrl，如果没有则使用thumbnailUrl
            const rawUrl = photo.photoUrl || photo.photo_url || photo.thumbnailUrl || photo.thumbnail_url || '';
            // 处理URL：如果是相对路径，拼接baseURL
            const processedUrl = processImageUrl(rawUrl);
            console.log(`🖼️ [爱心墙创建页] 位置 ${positionIndex} 原始URL: ${rawUrl}, 处理后URL: ${processedUrl}`);
            this.$set(this.images, positionIndex, processedUrl);
            // 保存photoId映射
            if (photoId) {
              this.$set(this.photoMap, positionIndex, photoId);
              console.log(`📷 [爱心墙创建页] 保存照片映射: positionIndex=${positionIndex}, photoId=${photoId}`);
            } else {
              console.warn(`⚠️ [爱心墙创建页] 位置 ${positionIndex} 的照片缺少ID字段`);
            }
          }
        });
        
        console.log(`✅ [爱心墙创建页] 成功加载 ${photosData.length} 张照片`);
        console.log('📷 [爱心墙创建页] 照片ID映射:', this.photoMap);
        console.log('🖼️ [爱心墙创建页] 照片URL列表:', this.images.filter(url => url));
      } catch (error) {
        console.error('❌ [爱心墙创建页] 加载项目数据失败:', error);
        uni.showToast({ 
          title: '加载项目失败', 
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 压缩图片
    compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        uni.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            console.log('✅ [爱心墙创建页] 图片压缩成功，新路径:', res.tempFilePath);
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            console.warn('⚠️ [爱心墙创建页] 图片压缩失败，使用原图', error);
            resolve(tempFilePath);
          }
        });
      });
    },
    
    // 检查是否需要登录
    checkLoginRequired() {
      const loginInfo = uni.getStorageSync('login_info');
      // 如果是游客用户，提示需要登录
      if (!loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn) {
        uni.showModal({
          title: '需要登录',
          content: '保存项目需要登录后才能使用，是否前往登录？\n\n您仍然可以继续浏览页面功能。',
          confirmText: '去登录',
          cancelText: '继续浏览',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/index'
              });
            }
          }
        });
        return false;
      }
      return true;
    },
    
    // 保存项目到列表页
    onSaveProject() {
      if (this.filledCount === 0) {
        uni.showToast({ title: '请至少添加一张照片', icon: 'none' });
        return;
      }
      
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }

      if (this.saving) {
        uni.showToast({ title: '保存中，请稍候...', icon: 'none' });
        return;
      }

      // 弹出输入框，让用户输入项目名称和描述
      uni.showModal({
        title: this.editingProjectId ? '保存修改' : '保存项目',
        editable: true,
        placeholderText: '请输入项目名称',
        success: async (res) => {
          if (res.confirm) {
            const projectName = res.content || '我的爱心墙';
            await this.saveProjectData(projectName);
          }
        }
      });
    },
    
    // 保存项目数据（调用后端API）
    async saveProjectData(projectName) {
      this.saving = true;
      
      try {
        uni.showLoading({ title: '保存中...', mask: true });
        
        console.log('💾 [爱心墙创建页] 开始保存项目到后端');

      // 构建项目数据
      const projectData = {
          projectName: projectName,
          description: `共${this.filledCount}张照片`,
          isPublic: false,
          maxPhotos: this.totalSlots
        };
        
        let projectId;
        let createResponse = null; // 用于错误调试
        
        // 创建或更新项目
        if (this.editingProjectId) {
          // 更新现有项目
          console.log('🔄 [爱心墙创建页] 更新项目 ID:', this.editingProjectId);
          await updateProject(this.editingProjectId, projectData);
          projectId = this.editingProjectId;
        } else {
          // 创建新项目
          console.log('✨ [爱心墙创建页] 创建新项目');
          createResponse = await createProject(projectData);
          console.log('✅ [爱心墙创建页] 项目创建成功:', createResponse);
          
          // 获取项目ID - 支持多种响应格式
          if (createResponse && createResponse.data) {
            // 格式: { data: { projectId: ..., id: ... } }
            projectId = createResponse.data.projectId || createResponse.data.id;
          } else if (createResponse && createResponse.project) {
            // 格式: { project: { projectId: ..., id: ... } }
            projectId = createResponse.project.projectId || createResponse.project.id;
          } else if (createResponse && (createResponse.projectId || createResponse.id)) {
            // 格式: { projectId: ..., id: ... }
            projectId = createResponse.projectId || createResponse.id;
          }
          
          console.log('🔍 [爱心墙创建页] 提取的项目ID:', projectId);
          
          // 如果创建项目后仍无法获取ID，抛出详细错误
          if (!projectId) {
            console.error('❌ [爱心墙创建页] 无法获取项目ID');
            console.error('📦 [响应数据结构]:', JSON.stringify(createResponse, null, 2));
            throw new Error('无法获取项目ID，请检查后端返回的数据格式');
          }
        }
        
        console.log('📝 [爱心墙创建页] 项目ID:', projectId);
        
        // 第一步：收集所有需要上传的照片信息
        const photoTasks = [];
        for (let i = 0; i < this.heartMask.length; i++) {
          if (this.heartMask[i] && this.images[i]) {
            photoTasks.push({
              positionIndex: i,
              imagePath: this.images[i]
            });
          }
        }
        
        console.log(`📋 [爱心墙创建页] 准备上传 ${photoTasks.length} 张照片`);
        
        // 使用直接上传方式（multipart/form-data，一步完成，推荐）
        console.log('📤 [爱心墙创建页] 使用直接上传方式（multipart/form-data）');
        
        const savePromises = photoTasks.map(async (task) => {
          const { positionIndex, imagePath } = task;
          
          // 判断是否是本地临时路径（需要上传）
          const isTmpPath = imagePath && (imagePath.startsWith('http://tmp/') || imagePath.startsWith('https://tmp/'));
          // 判断是否是真正的HTTP/HTTPS URL（排除临时路径）
          const isRealUrl = imagePath && 
                           (imagePath.startsWith('http://') || imagePath.startsWith('https://')) &&
                           !isTmpPath;
          // 判断是否是本地路径（需要上传）
          const isLocalPath = !isRealUrl && !imagePath.startsWith('data:');
          
          // 检查该位置是否已有photoId（已存在的照片）
          const existingPhotoId = this.photoMap[positionIndex];
          
          if (isLocalPath || isTmpPath) {
            // 本地文件，使用直接上传方式
            try {
              if (existingPhotoId) {
                // 已有照片，使用updatePhoto更新其他信息
                console.log(`🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
                // 对于已存在的照片，我们不支持直接更新文件，只能更新其他信息
                // 如果需要更新文件，用户应该先删除再重新上传
                const photoData = {
                  positionIndex: positionIndex
                };
                return updatePhoto(existingPhotoId, photoData).catch(error => {
                  console.error(`❌ [爱心墙创建页] 照片 ${positionIndex} 更新失败:`, error);
                  return null;
                });
              } else {
                // 新照片，直接上传文件+元数据
                console.log(`📤 [爱心墙创建页] 直接上传照片 ${positionIndex}（文件+元数据）...`);
                const result = await uploadPhotoWithFile({
                  filePath: imagePath,
                  projectId: projectId,
                  positionIndex: positionIndex
                });
                console.log(`✅ [爱心墙创建页] 照片 ${positionIndex} 上传成功`);
                return result;
              }
            } catch (uploadError) {
              console.error(`❌ [爱心墙创建页] 照片 ${positionIndex} 上传失败:`, uploadError);
              return null;
            }
          } else {
            // 已经是URL，不支持上传，只能更新位置信息
            console.log(`🔄 [爱心墙创建页] 位置 ${positionIndex} 已经是URL，不支持上传，只能更新位置信息`);
            // 对于已存在的照片，我们不支持直接更新文件，只能更新其他信息
            // 如果需要更新文件，用户应该先删除再重新上传
            const photoData = {
              positionIndex: positionIndex
            };
            
            if (existingPhotoId) {
              console.log(`🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
              return updatePhoto(existingPhotoId, photoData).catch(error => {
                console.error(`❌ [爱心墙创建页] 照片 ${positionIndex} 更新失败:`, error);
                return null;
              });
            } else {
              // 对于新照片，如果已经是URL则不支持上传
              console.warn(`⚠️ [爱心墙创建页] 位置 ${positionIndex} 是新照片但已经是URL，不支持上传`);
              uni.showToast({ 
                title: '不支持上传已存在的图片URL', 
                icon: 'none',
                duration: 2000
              });
              return null;
            }
          }
        });
        
        // 等待所有照片保存完成
        console.log(`💾 [爱心墙创建页] 开始保存 ${savePromises.length} 张照片信息`);
        const saveResults = await Promise.all(savePromises);
        const savedCount = saveResults.filter(r => r !== null).length;
        
        console.log(`✅ [爱心墙创建页] 成功保存 ${savedCount}/${photoTasks.length} 张照片`);
        
        // 更新photoMap，保存新上传照片的photoId映射
        saveResults.forEach((result, index) => {
          if (result && result.data) {
            const photoId = result.data.photoId || result.data.photo_id || result.data.id;
            const photo = photoTasks[index];
            
            if (photoId && photo) {
              const positionIndex = photo.positionIndex || photo.index;
              // 只有新增的照片才需要更新photoMap（已有的照片photoMap已经存在）
              if (positionIndex !== undefined && !this.photoMap[positionIndex]) {
                this.$set(this.photoMap, positionIndex, photoId);
                console.log(`📷 [爱心墙创建页] 更新照片映射: positionIndex=${positionIndex}, photoId=${photoId}`);
              } else if (positionIndex !== undefined) {
                console.log(`📷 [爱心墙创建页] 位置 ${positionIndex} 照片已存在(photoId: ${photoId})，无需更新映射`);
              }
            }
          }
        });
        
        // 保存项目ID，以便后续可以继续编辑
        this.editingProjectId = projectId;
        uni.setStorageSync('heartwall_editing_projectId', projectId);
        
        uni.hideLoading();
        uni.showToast({ 
          title: this.editingProjectId ? '修改成功' : '保存成功', 
          icon: 'success',
          duration: 1500
        });
        
        // 延迟跳转到列表页
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } catch (error) {
        console.error('❌ [爱心墙创建页] 保存项目失败:', error);
        uni.hideLoading();
        uni.showToast({ 
          title: error.message || '保存失败，请重试', 
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.saving = false;
      }
    },
    persist() {
      try { uni.setStorageSync('heartwall_grid_images', this.images); } catch (e) {}
    }
  }
};
</script>

<style>
.create-page { min-height: 100vh; background: #FFFAF4; display: flex; flex-direction: column; overflow: hidden; }

/* 自定义导航栏（与首页一致） */
.custom-navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background-color: #FFFAF4; overflow: hidden; }
.navbar-gradient-bg { position: absolute; top: 0; left: 0; right: 0; height: 200%; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); }
.status-bar { width: 100%; background: transparent; position: relative; z-index: 1; }
.navbar-content { display: flex; align-items: center; justify-content: space-between; padding: 0 30rpx; box-sizing: border-box; position: relative; z-index: 1; }
.navbar-left, .navbar-right { width: 80rpx; display: flex; align-items: center; justify-content: center; }
.navbar-title { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; }
.title-text { font-size: 36rpx; font-weight: 500; color: #4A4A4A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
.back-icon { font-size: 50rpx; font-weight: 600; color: #4A4A4A; line-height: 1; }

.center { display: flex; align-items: flex-start; justify-content: center; padding: 80rpx 0 0 60rpx; }
.heart-grid { width: 640rpx; margin: 0 auto; display: grid; grid-template-columns: repeat(9, 1fr); grid-gap: 10rpx; }
.cell { position: relative; width: 1fr; padding-bottom: 100%; background: rgba(255,255,255,0.7); border-radius: 12rpx; overflow: hidden; }
.cell.hole { background: transparent; }
.cell image { position: absolute; inset: 0; width: 100%; height: 100%; }
.cell.filled { background: #ffffff; }

.photo-count { 
  margin-top: 32rpx; 
  padding: 0 60rpx; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}
.count-text { 
  font-size: 26rpx; 
  color: #666; 
  font-weight: 500; 
}
.clear-btn { 
  font-size: 24rpx; 
  color: #D48806; 
  padding: 8rpx 20rpx; 
  background: rgba(255, 201, 77, 0.15); 
  border-radius: 20rpx; 
}

.actions { margin-top: 24rpx; padding-bottom: 24rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.btn { width: 70%; border-radius: 999rpx; padding: 18rpx 0; font-size: 26rpx; box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.12); }
.btn.yellow { background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%); color: #3d2a00; }
.btn.green { background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%); color: #3d2a00; }
.btn.pink { background: linear-gradient(90deg, #FFB5C2 0%, #FFD4A3 100%); color: #3d2a00; }
</style>