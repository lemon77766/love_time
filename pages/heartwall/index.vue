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
          <view class="row"><text class="label">创建人：</text><text class="value">{{ project.creator || '未设置' }}</text></view>
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
import { getProjects, deleteProject } from '@/api/heartwall.js';

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
        this.projects = projectsData.map(project => ({
          projectId: project.projectId || project.id,
          cover: project.cover || project.coverImage || '',
          creator: project.creator || project.creatorName || '未设置',
          progress: project.progress || project.photoCount || 0,
          total: project.total || project.maxPhotos || 40,
          createdAt: project.createdAt || project.createTime || project.created_time || '-',
          // 保留后端原始数据用于编辑时使用
          _original: project
        }));
        
        console.log(`✅ [爱心墙页面] 成功加载 ${this.projects.length} 个项目`);
        
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

.heartwall-page { 
  min-height: 100vh; 
  background: #F8F0FC; 
  padding-bottom: 120rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.projects-list { padding: 24rpx 24rpx 0 24rpx; }
.card { 
  margin-bottom: 24rpx; 
  padding: 20rpx; 
  background: #ffffff; 
  border-radius: 24rpx; 
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); 
  border: 1rpx solid #F3E8FF; 
  display: flex; 
  gap: 20rpx; 
  position: relative; 
}
.card:active { opacity: 0.8; }
.cover { 
  width: 160rpx; 
  height: 160rpx; 
  border-radius: 24rpx; 
  background: #F3E8FF; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden; 
  flex-shrink: 0; 
}
.cover-img { width: 100%; height: 100%; }
.no-image { 
  background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); 
}
.cover-placeholder { 
  font-size: 60rpx; 
  color: #DCC7E1; 
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
  color: #6B5B95; 
  font-size: 26rpx; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.value { 
  color: #9B8FB8; 
  font-size: 26rpx; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.bold { 
  font-weight: 600; 
  color: #6B5B95;
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
  color: #9B8FB8; 
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
  background: #DCC7E1; 
  color: #ffffff; 
  font-size: 28rpx; 
  box-shadow: 0 10rpx 24rpx rgba(220, 199, 225, 0.35); 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
