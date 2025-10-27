<template>
  <view class="heartwall-page">
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
export default {
  data() {
    return {
      projects: []
    };
  },
  mounted() {
    this.loadProjects();
  },
  onShow() {
    // 每次页面显示时重新加载项目数据
    this.loadProjects();
  },
  methods: {
    loadProjects() {
      try {
        const data = uni.getStorageSync('heartwall_projects');
        this.projects = Array.isArray(data) ? data : [];
      } catch (e) {
        this.projects = [];
      }
    },
    saveProjects() {
      try { 
        uni.setStorageSync('heartwall_projects', this.projects); 
      } catch (e) {}
    },
    startCreate() {
      // 清除当前编辑索引，表示创建新项目
      uni.removeStorageSync('heartwall_editing_index');
      uni.removeStorageSync('heartwall_grid_images');
      uni.navigateTo({ url: '/pages/heartwall/create' });
    },
    editProject(index) {
      // 保存正在编辑的项目索引
      uni.setStorageSync('heartwall_editing_index', index);
      uni.setStorageSync('heartwall_grid_images', this.projects[index].images || []);
      uni.navigateTo({ url: '/pages/heartwall/create' });
    },
    deleteProject(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个项目吗？删除后无法恢复。',
        success: (res) => {
          if (res.confirm) {
            this.projects.splice(index, 1);
            this.saveProjects();
            uni.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    }
  }
};
</script>

<style>
.heartwall-page { min-height: 100vh; background: #f0f0f0; padding-bottom: 120rpx; }
.projects-list { padding: 24rpx 24rpx 0 24rpx; }
.card { margin-bottom: 24rpx; padding: 20rpx; background: #f7f7f7; border-radius: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); border: 1rpx solid #e5e5e5; display: flex; gap: 20rpx; position: relative; }
.card:active { opacity: 0.8; }
.cover { width: 160rpx; height: 160rpx; border-radius: 24rpx; background: #ffe4eb; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.cover-img { width: 100%; height: 100%; }
.no-image { background: linear-gradient(135deg, #ffe4eb 0%, #ffc1d1 100%); }
.cover-placeholder { font-size: 60rpx; color: #ff8fb3; }
.meta { flex: 1; display: flex; flex-direction: column; gap: 12rpx; justify-content: center; }
.row { display: flex; align-items: baseline; gap: 8rpx; }
.label { color: #4e3c3c; font-size: 26rpx; }
.value { color: #333; font-size: 26rpx; }
.bold { font-weight: 700; }
.actions-cell { position: absolute; top: 20rpx; right: 20rpx; }
.delete-btn { font-size: 24rpx; color: #ff4d4f; background: rgba(255,77,79,0.1); padding: 8rpx 16rpx; border-radius: 20rpx; }
.content-tip { margin: 32rpx 24rpx; color: #7a7a7a; font-size: 26rpx; text-align: center; }
.bottom { position: fixed; left: 0; right: 0; bottom: 24rpx; display: flex; justify-content: center; }
.start-btn { width: 80%; border-radius: 999rpx; padding: 18rpx 0; background: #ff8fb3; color: #ffffff; font-size: 28rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.12); }
</style>
