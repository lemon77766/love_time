<template>
  <view class="hundred-page">
    <!-- 顶部背景图 -->
    <image class="top-bg" src="/static/hundred/shangmian.jpg" mode="aspectFill"></image>
    
    <!-- 标题和进度 -->
    <view class="header-section">
      <text class="main-title">情侣100件小事挑战</text>
      <view class="progress-area">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">{{ doneCount }}/100</text>
        <view class="filter-dropdown" @click="toggleDropdown">
          <text class="filter-label">{{ filterText }}</text>
          <text class="dropdown-icon">{{ showDropdown ? '▲' : '▼' }}</text>
        </view>
      </view>
      
      <!-- 下拉菜单 -->
      <view v-if="showDropdown" class="dropdown-menu">
        <view 
          v-for="option in filterOptions" 
          :key="option.value" 
          class="dropdown-item"
          :class="{ active: filterMode === option.value }"
          @click="selectFilter(option.value)"
        >
          <text class="item-label">{{ option.label }}</text>
          <text v-if="filterMode === option.value" class="check-icon">✓</text>
        </view>
      </view>
    </view>

    <!-- 事件网格 -->
    <view class="event-grid">
      <view v-for="(item, i) in displayItems" :key="item.id" class="event-card">
        <!-- 收藏标记 -->
        <view class="favorite-icon" @click.stop="toggleFavorite(item)">
          <text :class="{ 'favorite-active': item.favorite }">{{ item.favorite ? '★' : '☆' }}</text>
        </view>
        
        <!-- 图片区域 -->
        <view class="event-image" @click="uploadImage(item)">
          <image v-if="item.image" :src="item.image" mode="aspectFill"></image>
          <view v-else class="placeholder-icon">📸+</view>
        </view>
        
        <!-- 标题区域 -->
        <view class="event-title-wrapper" @click="toggleDone(item)" @longpress="openEdit(item)">
          <text class="event-title" :class="{ done: item.done }">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <!-- 右下添加按钮 -->
    <view class="fab-add" @click="openAdd">
      <text class="fab-icon">+</text>
    </view>

    <!-- 添加弹窗 -->
    <view v-if="showAdd" class="modal-mask" @click="closeAdd">
      <view class="modal" @click.stop>
        <text class="modal-title">添加小事</text>
        <view class="form">
          <input class="input" v-model="form.text" placeholder="例如：一起看日出" />
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="closeAdd">取消</button>
          <button class="btn primary" @click="saveItem">保存</button>
        </view>
      </view>
    </view>

    <!-- 编辑弹窗 -->
    <view v-if="showEdit" class="modal-mask" @click="closeEdit">
      <view class="modal" @click.stop>
        <text class="modal-title">编辑小事</text>
        <view class="form">
          <input class="input" v-model="editForm.text" placeholder="修改事件名称" />
        </view>
        <view class="modal-actions">
          <button class="btn danger" @click="confirmDelete(editForm)">删除</button>
          <button class="btn secondary" @click="closeEdit">取消</button>
          <button class="btn primary" @click="saveEdit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      items: [],
      showAdd: false,
      showEdit: false,
      form: { text: '' },
      editForm: null,
      filterMode: 'all', // 'all', 'done', 'todo', 'favorite'
      showDropdown: false,
      filterOptions: [
        { label: '全部', value: 'all' },
        { label: '待完成', value: 'todo' },
        { label: '已完成', value: 'done' },
        { label: '已收藏', value: 'favorite' }
      ]
    };
  },
  computed: {
    doneCount() {
      return this.items.filter(item => item.done).length;
    },
    progressPercent() {
      return this.items.length > 0 ? (this.doneCount / 100) * 100 : 0;
    },
    displayItems() {
      if (this.filterMode === 'done') return this.items.filter(item => item.done);
      if (this.filterMode === 'todo') return this.items.filter(item => !item.done);
      if (this.filterMode === 'favorite') return this.items.filter(item => item.favorite);
      return this.items;
    },
    filterText() {
      if (this.filterMode === 'all') return '全部';
      if (this.filterMode === 'done') return '已完成';
      if (this.filterMode === 'todo') return '待完成';
      if (this.filterMode === 'favorite') return '已收藏';
      return '全部';
    }
  },
  mounted() {
    this.loadItems();
    if (this.items.length === 0) {
      // 预置示例
      this.items = [
        { id: 1, text: '一起看日出', image: '', done: false, favorite: false },
        { id: 2, text: '一起看日落', image: '', done: false, favorite: false },
        { id: 3, text: '一起去教堂', image: '', done: false, favorite: false },
        { id: 4, text: '一起看星星', image: '', done: false, favorite: false },
        { id: 5, text: '一起看电影', image: '', done: false, favorite: false },
        { id: 6, text: '一起牵手逛街', image: '', done: false, favorite: false },
        { id: 7, text: '一起做饭', image: '', done: false, favorite: false },
        { id: 8, text: '一起逛超市', image: '', done: false, favorite: false },
        { id: 9, text: '一起逛家', image: '', done: false, favorite: false },
        { id: 10, text: '一起看相声', image: '', done: false, favorite: false },
        { id: 11, text: '一起打黑', image: '', done: false, favorite: false },
        { id: 12, text: '一起躺雨', image: '', done: false, favorite: false }
      ];
      this.saveItems();
    }
  },
  methods: {
    loadItems() {
      try {
        const data = uni.getStorageSync('hundred_items');
        this.items = Array.isArray(data) ? data : [];
      } catch (e) { this.items = []; }
    },
    saveItems() {
      try { uni.setStorageSync('hundred_items', this.items); } catch (e) {}
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    selectFilter(value) {
      this.filterMode = value;
      this.showDropdown = false;
      
      // 显示提示
      const tips = {
        'all': '显示全部事件',
        'todo': '显示待完成事件',
        'done': '显示已完成事件',
        'favorite': '显示已收藏事件'
      };
      uni.showToast({ 
        title: tips[value], 
        icon: 'none',
        duration: 1500
      });
    },
    uploadImage(item) {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          item.image = tempFilePath;
          this.saveItems();
          uni.showToast({ title: '图片已上传', icon: 'success' });
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          uni.showToast({ title: '上传失败', icon: 'none' });
        }
      });
    },
    toggleFavorite(item) {
      item.favorite = !item.favorite;
      this.saveItems();
      uni.showToast({ 
        title: item.favorite ? '已收藏' : '取消收藏', 
        icon: 'none',
        duration: 1500
      });
    },
    openEdit(item) {
      this.editForm = { ...item };
      this.showEdit = true;
    },
    closeEdit() {
      this.showEdit = false;
      this.editForm = null;
    },
    saveEdit() {
      if (!this.editForm.text) {
        uni.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      const index = this.items.findIndex(item => item.id === this.editForm.id);
      if (index !== -1) {
        this.items[index].text = this.editForm.text;
        this.saveItems();
        this.closeEdit();
        uni.showToast({ title: '已保存', icon: 'success' });
      }
    },
    confirmDelete(item) {
      uni.showModal({
        title: '删除确认',
        content: `确定删除“${item.text}”吗？`,
        confirmText: '删除',
        cancelText: '取消',
        success: (res) => { if (res.confirm) this.deleteItem(item); }
      });
    },
    deleteItem(item) {
      this.items = this.items.filter(it => it.id !== item.id);
      this.saveItems();
      uni.showToast({ title: '已删除', icon: 'none' });
    },
    toggleDone(item) {
      item.done = !item.done;
      this.saveItems();
    },
    openCatalog() { this.showCatalog = true; },
    closeCatalog() { this.showCatalog = false; },
    openAdd() { this.showAdd = true; },
    closeAdd() { this.showAdd = false; this.form.text = ''; },
    saveItem() {
      if (!this.form.text) { uni.showToast({ title: '请输入内容', icon: 'none' }); return; }
      const id = (this.items.reduce((m, it)=>Math.max(m, it.id||0), 0) + 1);
      this.items.unshift({ id, text: this.form.text, icon: '', done: false, favorite: false });
      this.saveItems();
      this.closeAdd();
      uni.showToast({ title: '已添加', icon: 'none' });
    }
  }
};
</script>

<style>
.hundred-page { 
  min-height: 100vh; 
  background: linear-gradient(to bottom, #f5e6f0 0%, #fdf2f8 100%);
  padding-bottom: 120rpx;
}

/* 顶部背景图 */
.top-bg {
  width: 100%;
  height: 360rpx;
  display: block;
}

/* 标题区域 */
.header-section {
  padding: 24rpx 32rpx;
  position: relative;
}

.main-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #3a3a3a;
  display: block;
  margin-bottom: 20rpx;
}

/* 进度区域 */
.progress-area {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #e5e5e0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffb3c6 0%, #ff8fb3 100%);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 28rpx;
  color: #5a5a5a;
  font-weight: 600;
}

.filter-dropdown {
  padding: 8rpx 16rpx;
  background: #ffffff;
  border: 2rpx solid #ffb3c6;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #5a5a5a;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(224, 181, 216, 0.2);
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
}

.filter-label {
  font-size: 24rpx;
  color: #5a5a5a;
}

.dropdown-icon {
  font-size: 20rpx;
  color: #ffb3c6;
  transition: transform 0.3s ease;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  right: 32rpx;
  top: 130rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
  overflow: hidden;
  z-index: 10;
  min-width: 160rpx;
  border: 2rpx solid #ffb3c6;
}

.dropdown-item {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:active {
  background: #fdf2f8;
}

.dropdown-item.active {
  background: #f5e6f0;
}

.item-label {
  font-size: 26rpx;
  color: #5a5a5a;
}

.dropdown-item.active .item-label {
  color: #ff8fb3;
  font-weight: 600;
}

.check-icon {
  font-size: 28rpx;
  color: #ff8fb3;
  font-weight: bold;
}

/* 事件网格 */
.event-grid {
  padding: 0 24rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.event-card {
  background: #faf9f5;
  border-radius: 16rpx;
  padding: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
  border: 1rpx solid #e8e8e0;
  position: relative;
}

/* 收藏图标 */
.favorite-icon {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  font-size: 32rpx;
  z-index: 5;
  cursor: pointer;
}

.favorite-icon text {
  color: #d0d0d0;
  filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.1));
  transition: all 0.3s ease;
}

.favorite-icon .favorite-active {
  color: #ff8fb3;
  transform: scale(1.1);
}

.event-image {
  width: 100%;
  height: 160rpx;
  border-radius: 12rpx;
  background: #e8e8e0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.event-image image {
  width: 100%;
  height: 100%;
}

.placeholder-icon {
  font-size: 48rpx;
  color: #b8b8a8;
}

.event-title-wrapper {
  width: 100%;
  padding: 8rpx 0;
}

.event-title {
  font-size: 24rpx;
  color: #5a5a5a;
  text-align: center;
  line-height: 1.4;
  display: block;
}

.event-title.done {
  text-decoration: line-through;
  opacity: 0.6;
}

/* 右下添加按钮 */
.fab-add {
  position: fixed;
  right: 32rpx;
  bottom: 100rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: #3a3a3a;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.fab-icon {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}

/* 弹窗样式 */
.modal-mask { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.35); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 100; 
}

.modal { 
  width: 86%; 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 32rpx; 
}

.modal-title { 
  font-size: 32rpx; 
  font-weight: 700; 
  color: #2b2b2b; 
}

.form { 
  margin-top: 20rpx; 
}

.input { 
  border: 1rpx solid #e5e5e5; 
  border-radius: 12rpx; 
  padding: 16rpx; 
  font-size: 26rpx; 
  background: #ffffff; 
}

.modal-actions { 
  margin-top: 24rpx; 
  display: flex; 
  justify-content: flex-end; 
  gap: 12rpx; 
}

.btn { 
  padding: 14rpx 24rpx; 
  border-radius: 12rpx; 
  font-size: 26rpx; 
  border: none;
}

.btn.primary {
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  color: #fff;
}

.btn.secondary { 
  background: #f0f0f0; 
  color: #333; 
}

.btn.danger {
  background: #ff6b6b;
  color: #fff;
}
</style>