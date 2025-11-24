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
      
    </view>
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
      photoMap: {}  // 存储positionIndex到photoId的映射 { positionIndex: photoId }
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
    async onPickSingle(idx) {
      if (!this.heartMask[idx]) return;
      
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
        
        // 如果已有项目且有photoId，说明是替换已有照片
        if (isExistingPhoto && photoId) {
          uni.showLoading({ title: '替换中...', mask: true });
          
          try {
            console.log(`🔄 [爱心墙创建页] 开始替换位置 ${idx} 的照片，photoId: ${photoId}`);
            
            // 1. 上传新图片到服务器
            console.log('📤 [爱心墙创建页] 上传新图片到服务器...');
            const photoUrl = await this.uploadImageToServer(newImagePath);
            console.log('✅ [爱心墙创建页] 新图片上传成功，URL:', photoUrl);
            
            // 2. 更新后端照片信息
            const updateData = {
              photoUrl: photoUrl,
              thumbnailUrl: photoUrl,
              positionIndex: idx
            };
            
            console.log('📝 [爱心墙创建页] 更新后端照片信息...');
            await updatePhoto(photoId, updateData);
            console.log('✅ [爱心墙创建页] 后端照片更新成功');
            
            // 3. 更新前端显示
            this.$set(this.images, idx, photoUrl);
            this.persist();
            
            uni.hideLoading();
            uni.showToast({ 
              title: '替换成功', 
              icon: 'success',
              duration: 1500
            });
          } catch (error) {
            console.error('❌ [爱心墙创建页] 替换照片失败:', error);
            uni.hideLoading();
            uni.showToast({ 
              title: error.message || '替换失败，请重试', 
              icon: 'none',
              duration: 2000
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
          const photoId = photo.photoId || photo.photo_id || photo.id;
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
    
    // 上传单张图片到服务器获取URL
    async uploadImageToServer(filePath) {
      try {
        console.log('📤 [爱心墙创建页] 开始上传图片到服务器，原始路径:', filePath);
        
        // 验证文件路径：如果已经是URL，不应该上传
        if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
          console.warn('⚠️ [爱心墙创建页] 文件路径已经是URL格式，跳过上传:', filePath);
          return filePath;
        }
        
        // 处理异常路径格式：http://tmp/... 转换为 /tmp/...
        let validFilePath = filePath;
        if (filePath && filePath.startsWith('http://tmp/')) {
          validFilePath = filePath.replace('http://tmp/', '/tmp/');
          console.log('🔧 [爱心墙创建页] 修复路径格式:', filePath, '->', validFilePath);
        }
        
        // 先压缩图片（压缩会返回新的临时文件路径，可能有助于解决路径问题）
        console.log('🔄 [爱心墙创建页] 压缩图片中...');
        const compressedPath = await this.compressImage(validFilePath);
        console.log('✅ [爱心墙创建页] 图片压缩完成，使用路径:', compressedPath);
        
        // 尝试使用用户头像上传接口作为通用图片上传接口
        // 如果后端有专门的爱心墙图片上传接口，可以在这里替换
        const uploadUrl = config.API.USER.AVATAR_UPLOAD;
        
        console.log('📤 [爱心墙创建页] 开始上传文件，路径:', compressedPath);
        const result = await http.upload({
          url: uploadUrl,
          filePath: compressedPath,
          name: 'avatar',  // 头像上传接口期望的字段名
          formData: { type: 'heart-wall-photo' }
        });
        
        console.log('✅ [爱心墙创建页] 图片上传成功，返回URL:', result);
        
        // 返回图片URL，根据后端返回格式调整
        const imageUrl = result.url || result.photoUrl || result.photo_url || result.data?.url || filePath;
        console.log('🖼️ [爱心墙创建页] 获取到图片URL:', imageUrl);
        return imageUrl;
      } catch (error) {
        console.error('❌ [爱心墙创建页] 图片上传失败:', error);
        console.error('🔴 错误详情:', {
          message: error.message,
          filePath: filePath,
          stack: error.stack
        });
        // 上传失败时，如果后端支持直接传文件路径，可以尝试直接使用
        // 否则抛出错误让上层处理
        throw error;
      }
    },
    
    // 保存项目到列表页
    onSaveProject() {
      if (this.filledCount === 0) {
        uni.showToast({ title: '请至少添加一张照片', icon: 'none' });
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
        
        // 第二步：上传照片
        // 方式1：使用直接上传方式（multipart/form-data，一步完成，推荐）
        // 方式2：使用JSON格式（先上传文件获取URL，再发送JSON数据）
        // 这里使用方式1（直接上传），如果需要使用方式2，可以取消注释下面的代码
        
        const USE_DIRECT_UPLOAD = true; // 设置为true使用直接上传，false使用JSON格式
        
        let savePromises;
        let validPhotos;
        
        if (USE_DIRECT_UPLOAD) {
          // 方式1：直接上传文件（multipart/form-data）
          console.log('📤 [爱心墙创建页] 使用直接上传方式（multipart/form-data）');
          
          savePromises = photoTasks.map(async (task) => {
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
                  // 已有照片，先更新URL，然后使用updatePhoto更新其他信息
                  // 注意：如果后端支持在multipart/form-data中更新，可以直接使用
                  // 这里先上传文件获取URL，然后更新
                  console.log(`🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，先上传文件...`);
                  const photoUrl = await this.uploadImageToServer(imagePath);
                  const photoData = {
                    photoUrl: photoUrl,
                    thumbnailUrl: photoUrl,
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
              // 已经是URL，使用JSON格式更新或新增
              const photoData = {
                photoUrl: imagePath,
                thumbnailUrl: imagePath,
                positionIndex: positionIndex
              };
              
              if (existingPhotoId) {
                console.log(`🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
                return updatePhoto(existingPhotoId, photoData).catch(error => {
                  console.error(`❌ [爱心墙创建页] 照片 ${positionIndex} 更新失败:`, error);
                  return null;
                });
              } else {
                console.log(`➕ [爱心墙创建页] 位置 ${positionIndex} 为新照片，使用新增接口`);
                const createData = {
                  ...photoData,
                  projectId: projectId
                };
                return uploadPhoto(createData).catch(error => {
                  console.error(`❌ [爱心墙创建页] 照片 ${positionIndex} 保存失败:`, error);
                  return null;
                });
              }
            }
          });
          
          validPhotos = photoTasks; // 直接上传方式，所有任务都是有效照片
        } else {
          // 方式2：先上传文件获取URL，再发送JSON数据（原有方式）
          console.log('📤 [爱心墙创建页] 使用JSON格式上传方式（两步完成）');
          
          const photoUploadPromises = photoTasks.map(async (task) => {
            const { positionIndex, imagePath } = task;
            
            // 判断是否是本地临时路径（需要上传）
            const isTmpPath = imagePath && (imagePath.startsWith('http://tmp/') || imagePath.startsWith('https://tmp/'));
            // 判断是否是真正的HTTP/HTTPS URL（排除临时路径）
            const isRealUrl = imagePath && 
                             (imagePath.startsWith('http://') || imagePath.startsWith('https://')) &&
                             !isTmpPath;
            // 判断是否是本地路径（需要上传）
            const isLocalPath = !isRealUrl && !imagePath.startsWith('data:');
            
            if (isLocalPath || isTmpPath) {
              try {
                console.log(`📤 [爱心墙创建页] 上传图片 ${positionIndex} 到服务器...`);
                const photoUrl = await this.uploadImageToServer(imagePath);
                console.log(`✅ [爱心墙创建页] 图片 ${positionIndex} 上传成功`);
                return {
                  positionIndex,
                  photoUrl,
                  thumbnailUrl: photoUrl
                };
              } catch (uploadError) {
                console.error(`❌ [爱心墙创建页] 图片 ${positionIndex} 上传失败:`, uploadError);
                return null;
              }
            } else {
              // 已经是URL，直接使用
              return {
                positionIndex,
                photoUrl: imagePath,
                thumbnailUrl: imagePath
              };
            }
          });
          
          // 等待所有图片上传完成
          const photoUrls = await Promise.all(photoUploadPromises);
          
          // 过滤掉上传失败的图片
          validPhotos = photoUrls.filter(photo => photo !== null);
          const failedCount = photoUrls.length - validPhotos.length;
          
          if (failedCount > 0) {
            console.warn(`⚠️ [爱心墙创建页] ${failedCount} 张图片上传失败`);
            uni.showToast({ 
              title: `${failedCount} 张照片上传失败，其余照片将继续保存`, 
              icon: 'none',
              duration: 3000
            });
          }
          
          // 第三步：将所有成功的照片信息保存到后端
          savePromises = validPhotos.map(photo => {
            const photoData = {
              photoUrl: photo.photoUrl,
              thumbnailUrl: photo.thumbnailUrl,
              positionIndex: photo.positionIndex
            };
            
            // 检查该位置是否已有photoId（已存在的照片）
            const existingPhotoId = this.photoMap[photo.positionIndex];
            
            if (existingPhotoId) {
              // 该位置已有照片，使用更新接口
              console.log(`🔄 [爱心墙创建页] 位置 ${photo.positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
              return updatePhoto(existingPhotoId, photoData).catch(error => {
                console.error(`❌ [爱心墙创建页] 照片 ${photo.positionIndex} 更新失败:`, error);
                return null;
              });
            } else {
              // 该位置没有照片，使用新增接口
              console.log(`➕ [爱心墙创建页] 位置 ${photo.positionIndex} 为新照片，使用新增接口`);
              const createData = {
                ...photoData,
                projectId: projectId
              };
              return uploadPhoto(createData).catch(error => {
                console.error(`❌ [爱心墙创建页] 照片 ${photo.positionIndex} 保存失败:`, error);
                return null;
              });
            }
          });
        }
        
        // 等待所有照片保存完成
        console.log(`💾 [爱心墙创建页] 开始保存 ${savePromises.length} 张照片信息`);
        const saveResults = await Promise.all(savePromises);
        const savedCount = saveResults.filter(r => r !== null).length;
        
        const totalPhotos = USE_DIRECT_UPLOAD ? photoTasks.length : validPhotos.length;
        console.log(`✅ [爱心墙创建页] 成功保存 ${savedCount}/${totalPhotos} 张照片`);
        
        // 更新photoMap，保存新上传照片的photoId映射
        saveResults.forEach((result, index) => {
          if (result && result.data) {
            const photoId = result.data.photoId || result.data.photo_id || result.data.id;
            let photo;
            
            if (USE_DIRECT_UPLOAD) {
              // 直接上传方式：从photoTasks获取
              photo = photoTasks[index];
            } else {
              // JSON格式方式：从validPhotos获取
              photo = validPhotos[index];
            }
            
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
