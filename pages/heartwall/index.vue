<template>
  <view class="heartwall-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">爱心照片墙</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 项目列表 -->
    <view v-if="projects.length > 0" class="projects-list">
      <view v-for="(project, index) in projects" :key="index" class="card" @click="editProject(index)">
        <view class="cover" :class="{ 'no-image': !project.cover }">
          <image v-if="project.cover" class="cover-img" :src="project.cover" mode="aspectFill" />
          <text v-else class="cover-placeholder">♥</text>
        </view>
        <view class="meta">
          <view class="row"><text class="label">项目名称：</text><text class="value">{{ project.projectName || '未设置' }}</text></view>
          <view class="row"><text class="label">进度：</text><text class="value bold">{{ project.progress }}/{{ project.total }}</text></view>
          <view class="row"><text class="label">创建时间：</text><text class="value">{{ project.createdAt || '-' }}</text></view>
        </view>
        <view class="actions-cell">
          <text class="delete-btn" @click.stop="deleteProject(index)">删除</text>
        </view>
      </view>
    </view>

    <view class="content-tip" v-else>
      🎨 暂无项目，点击下方按钮创建新项目
    </view>

    <view class="bottom">
      <button class="start-btn" @click="startCreate">+ 创建新项目</button>
    </view>
  </view>
</template>

<script>
import { getProjects, deleteProject, getProjectPhotos } from '@/api/heartwall.js';
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
      projects: [],
      loading: false
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    }
  },
  onLoad() {
    this.getSystemInfo();
  },
  mounted() {
    this.loadProjects();
  },
  onShow() {
    // 每次页面显示时重新加载项目数据（从后端获取）
    // 清除可能的旧缓存，确保使用最新数据
    try {
      uni.removeStorageSync('heartwall_projects');
    } catch (e) {
      console.warn('⚠️ [爱心墙页面] 清除缓存失败:', e);
    }
    this.loadProjects();
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
    async loadProjects() {
      if (this.loading) return;
      this.loading = true;
      
      try {
        console.log('📡 [爱心墙页面] 开始从后端加载项目列表');
        
        // 调用后端API获取项目列表
        const response = await getProjects();
        
        console.log('📡 [爱心墙页面] 后端返回数据:', response);
        console.log('📡 [爱心墙页面] response.data:', response.data);
        console.log('📡 [爱心墙页面] response.projects:', response.projects);
        console.log('📡 [爱心墙页面] response.data[0]:', response.data && response.data[0]);
        
        // 处理响应数据
        let projectsData = [];
        if (response && response.data) {
          // 如果响应是 { data: [...] }
          projectsData = Array.isArray(response.data) ? response.data : (response.data.projects || []);
        } else if (Array.isArray(response)) {
          // 如果响应直接是数组
          projectsData = response;
        } else if (response && response.projects) {
          // 如果响应是 { projects: [...] }
          projectsData = response.projects;
        }
        
        // 转换后端数据格式为前端显示格式
        console.log('🔍 [爱心墙页面] 原始项目数据:', projectsData);
        console.log('🔍 [爱心墙页面] 原始项目数据长度:', projectsData.length);
        if (projectsData.length > 0) {
          console.log('🔍 [爱心墙页面] 第一个项目的所有字段:', Object.keys(projectsData[0]));
          console.log('🔍 [爱心墙页面] 第一个项目的完整数据:', JSON.stringify(projectsData[0], null, 2));
        }
        
        this.projects = projectsData.map((project, index) => {
          // 确保正确提取 projectName
          const projectName = project.projectName !== undefined && project.projectName !== null 
            ? String(project.projectName).trim() 
            : (project.name || '未设置');
          
          console.log(`🔍 [爱心墙页面] 项目 ${index} 原始数据:`, project);
          console.log(`🔍 [爱心墙页面] 项目 ${index} projectName 原始值:`, project.projectName);
          console.log(`🔍 [爱心墙页面] 项目 ${index} 提取的 projectName:`, projectName);
          
          const mappedProject = {
            projectId: project.projectId || project.id,
            cover: project.cover || project.coverImage || project.coverPhotoUrl || '',
            projectName: projectName || '未设置',
            progress: project.progress || project.photoCount || 0,
            total: project.total || project.maxPhotos || 40,
            createdAt: project.createdAt || project.createTime || project.created_time || '-',
            // 保留后端原始数据用于编辑时使用
            _original: project
          };
          console.log(`🔍 [爱心墙页面] 项目 ${index} 映射后的数据:`, mappedProject);
          return mappedProject;
        });
        
        console.log(`✅ [爱心墙页面] 成功加载 ${this.projects.length} 个项目`);
        console.log('🔍 [爱心墙页面] 最终项目列表:', this.projects);
        
        // 为没有封面图的项目获取第一张照片作为封面图
        await this.loadProjectCovers();
        
        // 同时更新本地缓存（作为备份）
        try {
          uni.setStorageSync('heartwall_projects', this.projects);
        } catch (e) {
          console.warn('⚠️ [爱心墙页面] 更新本地缓存失败:', e);
        }
      } catch (error) {
        console.error('❌ [爱心墙页面] 加载项目列表失败:', error);
        
        // 如果API调用失败，尝试从本地缓存读取（降级处理）
        try {
          const cached = uni.getStorageSync('heartwall_projects');
          if (Array.isArray(cached) && cached.length > 0) {
            console.warn('⚠️ [爱心墙页面] 使用本地缓存数据作为降级方案');
            this.projects = cached;
            uni.showToast({ 
              title: '网络异常，已加载本地数据', 
              icon: 'none',
              duration: 2000
            });
          } else {
            this.projects = [];
          }
        } catch (e) {
          this.projects = [];
        }
        
        // 显示错误提示
        uni.showToast({ 
          title: '加载失败，请检查网络', 
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loading = false;
      }
    },
    // 为没有封面图的项目获取第一张照片作为封面图
    async loadProjectCovers() {
      try {
        console.log('🖼️ [爱心墙页面] 开始加载项目封面图');
        
        // 找出所有没有封面图的项目
        const projectsWithoutCover = this.projects
          .map((project, index) => ({ project, index }))
          .filter(({ project }) => !project.cover || project.cover === '');
        
        console.log(`🖼️ [爱心墙页面] 需要加载封面图的项目数量: ${projectsWithoutCover.length}`);
        
        if (projectsWithoutCover.length === 0) {
          console.log('✅ [爱心墙页面] 所有项目都有封面图，无需加载');
          return;
        }
        
        // 并行获取所有项目的第一张照片
        const coverPromises = projectsWithoutCover.map(async ({ project, index }) => {
          try {
            const projectId = project.projectId || project.id;
            if (!projectId) {
              console.warn(`⚠️ [爱心墙页面] 项目 ${index} 没有 projectId，跳过加载封面图`);
              return { index, cover: null };
            }
            
            console.log(`📷 [爱心墙页面] 获取项目 ${index} (ID: ${projectId}) 的第一张照片`);
            
            // 只获取第一张照片（pageSize=1）
            const photosResponse = await getProjectPhotos(projectId, { page: 1, pageSize: 1 });
            
            // 处理照片数据
            let photosData = [];
            if (photosResponse && photosResponse.data) {
              photosData = Array.isArray(photosResponse.data) ? photosResponse.data : (photosResponse.data.photos || []);
            } else if (Array.isArray(photosResponse)) {
              photosData = photosResponse;
            } else if (photosResponse && photosResponse.photos) {
              photosData = photosResponse.photos;
            }
            
            // 获取第一张照片的URL
            let coverUrl = '';
            if (photosData.length > 0) {
              const firstPhoto = photosData[0];
              const rawUrl = firstPhoto.photoUrl || firstPhoto.photo_url || firstPhoto.thumbnailUrl || firstPhoto.thumbnail_url || '';
              // 处理URL：如果是相对路径，拼接baseURL
              coverUrl = processImageUrl(rawUrl);
              console.log(`✅ [爱心墙页面] 项目 ${index} 找到封面图 - 原始URL: ${rawUrl}, 处理后URL: ${coverUrl}`);
            } else {
              console.log(`⚠️ [爱心墙页面] 项目 ${index} 没有照片，无法设置封面图`);
            }
            
            return { index, cover: coverUrl };
          } catch (error) {
            console.error(`❌ [爱心墙页面] 获取项目 ${index} 封面图失败:`, error);
            return { index, cover: null };
          }
        });
        
        // 等待所有封面图加载完成
        const coverResults = await Promise.all(coverPromises);
        
        // 更新项目的封面图
        coverResults.forEach(({ index, cover }) => {
          if (cover) {
            // 使用 Vue.set 确保响应式更新
            this.$set(this.projects[index], 'cover', cover);
            console.log(`✅ [爱心墙页面] 项目 ${index} 封面图已更新:`, cover);
          }
        });
        
        // 更新本地缓存
        try {
          uni.setStorageSync('heartwall_projects', this.projects);
        } catch (e) {
          console.warn('⚠️ [爱心墙页面] 更新本地缓存失败:', e);
        }
        
        console.log('✅ [爱心墙页面] 封面图加载完成');
      } catch (error) {
        console.error('❌ [爱心墙页面] 加载封面图失败:', error);
        // 不影响主流程，只记录错误
      }
    },
    startCreate() {
      // 清除当前编辑索引，表示创建新项目
      uni.removeStorageSync('heartwall_editing_projectId');
      uni.removeStorageSync('heartwall_grid_images');
      uni.navigateTo({ url: '/pages/heartwall/create' });
    },
    editProject(index) {
      // 保存正在编辑的项目ID
      const project = this.projects[index];
      if (project && project.projectId) {
        uni.setStorageSync('heartwall_editing_projectId', project.projectId);
        // 如果有原始数据，也保存一份
        if (project._original) {
          uni.setStorageSync('heartwall_editing_project', JSON.stringify(project._original));
        }
      }
      uni.navigateTo({ url: '/pages/heartwall/create' });
    },
    async deleteProject(index) {
      const project = this.projects[index];
      const projectId = project?.projectId || project?.id;
      
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个项目吗？删除后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 如果有projectId，调用后端API删除
              if (projectId) {
                console.log(`🗑️ [爱心墙页面] 开始删除项目 ID: ${projectId}`);
                await deleteProject(projectId);
                console.log(`✅ [爱心墙页面] 项目删除成功 ID: ${projectId}`);
              }
              
              // 从列表中移除
              this.projects.splice(index, 1);
              
              // 更新本地缓存
              try {
                uni.setStorageSync('heartwall_projects', this.projects);
              } catch (e) {}
              
              uni.showToast({ title: '已删除', icon: 'success' });
            } catch (error) {
              console.error('❌ [爱心墙页面] 删除项目失败:', error);
              uni.showToast({ 
                title: error.message || '删除失败，请重试', 
                icon: 'none' 
              });
            }
          }
        }
      });
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

.heartwall-page { 
  min-height: 100vh; 
  background: #FFFAF4; 
  padding-bottom: 120rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.projects-list { padding: 24rpx 24rpx 0 24rpx; }
.card { 
  margin-bottom: 24rpx; 
  padding: 20rpx; 
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx; 
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
  display: flex; 
  gap: 20rpx; 
  position: relative; 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:active { 
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
.cover { 
  width: 160rpx; 
  height: 160rpx; 
  border-radius: 16rpx; 
  background: rgba(255, 255, 255, 0.5); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden; 
  flex-shrink: 0; 
}
.cover-img { width: 100%; height: 100%; }
.no-image { 
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%); 
}
.cover-placeholder { 
  font-size: 60rpx; 
  color: rgba(255, 255, 255, 0.8); 
}
.meta { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 12rpx; 
  justify-content: center; 
}
.row { 
  display: flex; 
  align-items: baseline; 
  gap: 8rpx; 
}
.label { 
  color: #4A4A4A; 
  font-size: 26rpx; 
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.value { 
  color: #666; 
  font-size: 26rpx; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.bold { 
  font-weight: 600; 
  color: #4A4A4A;
}
.actions-cell { 
  position: absolute; 
  top: 20rpx; 
  right: 20rpx; 
}
.delete-btn { 
  font-size: 24rpx; 
  color: #ff6b6b; 
  background: rgba(255,107,107,0.1); 
  padding: 8rpx 16rpx; 
  border-radius: 20rpx; 
}
.content-tip { 
  margin: 32rpx 24rpx; 
  color: #666; 
  font-size: 26rpx; 
  text-align: center; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.bottom { 
  position: fixed; 
  left: 0; 
  right: 0; 
  bottom: 24rpx; 
  display: flex; 
  justify-content: center; 
}
.start-btn { 
  width: 80%; 
  border-radius: 999rpx; 
  padding: 18rpx 0; 
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #ffffff; 
  font-size: 28rpx; 
  box-shadow: 0 8rpx 24rpx rgba(255, 181, 194, 0.4); 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
