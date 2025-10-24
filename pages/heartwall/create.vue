<template>
  <view class="create-page">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">爱心照片墙</text>
      <view class="nav-right">
        <text class="menu-icon">⋯</text>
        <text class="scan-icon">○</text>
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
      <button class="btn pink" @click="onSaveImage">保存为图片</button>
    </view>
  </view>
</template>

<script>
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
      editingIndex: null  // 正在编辑的项目索引，null 表示创建新项目
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
  mounted() {
    // 检查是否在编辑现有项目
    try {
      const editingIndex = uni.getStorageSync('heartwall_editing_index');
      if (editingIndex !== null && editingIndex !== undefined && editingIndex !== '') {
        this.editingIndex = Number(editingIndex);
      }
      
      // 加载图片数据
      const cached = uni.getStorageSync('heartwall_grid_images');
      if (Array.isArray(cached)) {
        this.images = cached;
      }
    } catch (e) {}
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
    clearAllImages() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有照片吗？',
        success: (res) => {
          if (res.confirm) {
            this.images = [];
            this.persist();
            uni.showToast({ title: '已清空', icon: 'success' });
          }
        }
      });
    },
    async onPickSingle(idx) {
      if (!this.heartMask[idx]) return;
      try {
        const res = await uni.chooseImage({ count: 1 });
        if (res && res.tempFilePaths && res.tempFilePaths[0]) {
          this.$set(this.images, idx, res.tempFilePaths[0]);
          this.persist();
        }
      } catch (e) {}
    },
    onInvite() {
      uni.showToast({ title: '邀请功能待接入后端', icon: 'none' });
    },
    
    // 保存项目到列表页
    onSaveProject() {
      if (this.filledCount === 0) {
        uni.showToast({ title: '请至少添加一张照片', icon: 'none' });
        return;
      }

      // 弹出输入框，让用户输入创建人名称
      uni.showModal({
        title: this.editingIndex !== null ? '保存修改' : '保存项目',
        content: '请输入创建人名称',
        editable: true,
        placeholderText: '输入你的名字',
        success: (res) => {
          if (res.confirm) {
            const creator = res.content || '匿名用户';
            this.saveProjectData(creator);
          }
        }
      });
    },
    
    // 保存项目数据
    saveProjectData(creator) {
      // 获取第一张照片作为封面
      let cover = '';
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && this.images[i]) {
          cover = this.images[i];
          break;
        }
      }

      // 构建项目数据
      const projectData = {
        cover: cover,
        creator: creator,
        progress: this.filledCount,
        total: this.totalSlots,
        createdAt: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-'),
        images: this.images,
        heartMask: this.heartMask
      };

      // 加载现有项目列表
      try {
        const projects = uni.getStorageSync('heartwall_projects') || [];
        const projectsList = Array.isArray(projects) ? projects : [];
        
        if (this.editingIndex !== null && this.editingIndex >= 0) {
          // 编辑现有项目
          projectsList[this.editingIndex] = projectData;
        } else {
          // 添加新项目
          projectsList.unshift(projectData);  // 添加到列表首位
        }
        
        // 保存到本地存储
        uni.setStorageSync('heartwall_projects', projectsList);
        
        // 清除编辑状态和缓存
        uni.removeStorageSync('heartwall_editing_index');
        uni.removeStorageSync('heartwall_grid_images');
        
        uni.showToast({ 
          title: this.editingIndex !== null ? '修改成功' : '保存成功', 
          icon: 'success',
          duration: 1500
        });
        
        // 延迟跳转到列表页
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } catch (e) {
        uni.showToast({ title: '保存失败，请重试', icon: 'none' });
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
    },
    
    goBack() {
      // 返回前清除编辑状态
      uni.removeStorageSync('heartwall_editing_index');
      uni.navigateBack();
    }
  }
};
</script>

<style>
.create-page { min-height: 100vh; background: #ffe4eb; display: flex; flex-direction: column; overflow: hidden; }

/* 自定义导航栏 */
.custom-nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding-top: env(safe-area-inset-top);
  background: #f8f8f8;
  border-bottom: 0.5px solid #d8d8d8;
}
.nav-left {
  position: absolute;
  left: 16px;
  top: calc(env(safe-area-inset-top) + 50%);
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.back-icon {
  font-size: 34px;
  color: #000000;
  font-weight: 400;
  line-height: 1;
}
.nav-title {
  font-size: 17px;
  color: #000000;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.nav-right {
  position: absolute;
  right: 16px;
  top: calc(env(safe-area-inset-top) + 50%);
  transform: translateY(-50%);
  display: flex;
  gap: 16px;
  align-items: center;
}
.menu-icon {
  font-size: 24px;
  color: #000000;
  line-height: 1;
  font-weight: 600;
}
.scan-icon {
  font-size: 24px;
  color: #000000;
  width: 24px;
  height: 24px;
  border: 2px solid #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.center { display: flex; align-items: flex-start; justify-content: center; padding: 80rpx 0 0 0; }
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
.btn.yellow { background: linear-gradient(90deg, #ffd36b, #ffb300); color: #333; }
.btn.green { background: linear-gradient(90deg, #2bad81, #1a9966); color: #ffffff; }
.btn.pink { background: linear-gradient(90deg, #ff8fb3, #ff507f); color: #ffffff; }
</style>
