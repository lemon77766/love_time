<template>
  <view class="create-page">
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
      <button class="btn pink" @click="onSaveImage">保存为图片</button>
    </view>
  </view>
</template>

<script>
import { createProject, updateProject, uploadPhoto, getProjectDetail, getProjectPhotos, clearProjectPhotos, updatePhoto } from '@/api/heartwall.js';
import http from '@/utils/http.js';
import config from '@/utils/config.js';

export default {
  data() {
    return {
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
            this.$set(this.images, positionIndex, photo.photoUrl || photo.photo_url || photo.thumbnailUrl || photo.thumbnail_url || '');
            // 保存photoId映射
            if (photoId) {
              this.$set(this.photoMap, positionIndex, photoId);
            }
          }
        });
        
        console.log(`✅ [爱心墙创建页] 成功加载 ${photosData.length} 张照片`);
        console.log('📷 [爱心墙创建页] 照片ID映射:', this.photoMap);
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
        content: '请输入项目名称',
        editable: true,
        placeholderText: '输入项目名称',
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
        
        // 第二步：并行上传所有图片到服务器获取URL
        const photoUploadPromises = photoTasks.map(async (task) => {
          const { positionIndex, imagePath } = task;
          
          // 判断是否是本地临时路径（需要上传）
          const isLocalPath = !imagePath.startsWith('http://') && 
                            !imagePath.startsWith('https://') &&
                            !imagePath.startsWith('data:');
          
          if (isLocalPath) {
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
              // 返回null表示上传失败，后续会跳过
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
        const validPhotos = photoUrls.filter(photo => photo !== null);
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
        // 需要区分：如果该位置已有photoId，使用updatePhoto更新；否则使用uploadPhoto新增
        const savePromises = validPhotos.map(photo => {
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
              return null; // 继续保存其他照片
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
              return null; // 继续保存其他照片
            });
          }
        });
        
        // 等待所有照片保存完成
        console.log(`💾 [爱心墙创建页] 开始保存 ${savePromises.length} 张照片信息`);
        const saveResults = await Promise.all(savePromises);
        const savedCount = saveResults.filter(r => r !== null).length;
        
        console.log(`✅ [爱心墙创建页] 成功保存 ${savedCount}/${validPhotos.length} 张照片`);
        
        // 更新photoMap，保存新上传照片的photoId映射
        saveResults.forEach((result, index) => {
          if (result && result.data) {
            const photoId = result.data.photoId || result.data.photo_id || result.data.id;
            const photo = validPhotos[index];
            if (photoId && photo) {
              // 只有新增的照片才需要更新photoMap（已有的照片photoMap已经存在）
              if (!this.photoMap[photo.positionIndex]) {
                this.$set(this.photoMap, photo.positionIndex, photoId);
                console.log(`📷 [爱心墙创建页] 更新照片映射: positionIndex=${photo.positionIndex}, photoId=${photoId}`);
              } else {
                console.log(`📷 [爱心墙创建页] 位置 ${photo.positionIndex} 照片已存在(photoId: ${photoId})，无需更新映射`);
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
    async onSaveImage() {
      // H5 环境下使用 html2canvas
      // #ifdef H5
      try {
        const mod = await import('html2canvas');
        const html2canvas = mod.default || mod;
        const el = document.getElementById('heartArea');
        const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl; a.download = 'heartwall.png'; a.click();
        uni.showToast({ title: '已保存为图片', icon: 'none' });
      } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' });
      }
      // #endif
      // #ifndef H5
      uni.showToast({ title: '请在 H5 端使用保存图片功能', icon: 'none' });
      // #endif
    },
    persist() {
      try { uni.setStorageSync('heartwall_grid_images', this.images); } catch (e) {}
    }
  }
};
</script>

<style>
.create-page { min-height: 100vh; background: #ffe4eb; display: flex; flex-direction: column; overflow: hidden; }

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
  color: #ff507f; 
  padding: 8rpx 20rpx; 
  background: rgba(255, 80, 127, 0.1); 
  border-radius: 20rpx; 
}

.actions { margin-top: 24rpx; padding-bottom: 24rpx; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.btn { width: 70%; border-radius: 999rpx; padding: 18rpx 0; font-size: 26rpx; box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.12); }
.btn.yellow { background: linear-gradient(90deg, #ffc1d1 0%, #ffaac0 100%); color: #ffffff; }
.btn.green { background: linear-gradient(90deg, #ff8fb3 0%, #ff7aa0 100%); color: #ffffff; }
.btn.pink { background: linear-gradient(90deg, #ffb3c6 0%, #ff9eb8 100%); color: #ffffff; }
</style>
