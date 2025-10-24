<template>
  <view class="hundred-page">
    <!-- 背景图与标题牌 -->
    <image class="bg" src="/static/hundred/bg.jpg" mode="aspectFill" />
    <view class="title-tag">我们的 100 件小事</view>

    <!-- 卡片瀑布布局 -->
    <view class="cards">
      <view v-for="(item, i) in items" :key="item.id" class="card" :class="{ done: item.done }" @click="toggleDone(item)" @longpress="confirmDelete(item)">
        <view class="stamp" :class="item.done ? 'stamp-done' : 'stamp-todo'">{{ item.done ? '已完成' : '待完成' }}</view>
        <view class="delete-btn" @click.stop="confirmDelete(item)">×</view>
        <image v-if="item.icon" class="card-icon" :src="item.icon" mode="aspectFit" />
        <text class="card-text">{{ item.text }}</text>
      </view>
      <view v-if="items.length === 0" class="empty">暂无小事，点击右下角添加吧～</view>
    </view>

    <!-- 右下悬浮按钮：目录 & 添加 -->
    <view class="fab-group">
      <button class="fab menu" @click="openCatalog">≡ 目录</button>
      <button class="fab add" @click="openAdd">＋ 添加小事</button>
    </view>

    <!-- 目录弹窗：按完成状态分组 -->
    <view v-if="showCatalog" class="modal-mask" @click="closeCatalog">
      <view class="modal" @click.stop>
        <text class="modal-title">目录</text>
        <scroll-view scroll-y class="catalog">
          <text class="section">已完成</text>
          <view v-for="it in items.filter(x=>x.done)" :key="it.id" class="catalog-item">• {{ it.text }}</view>
          <text class="section">待完成</text>
          <view v-for="it in items.filter(x=>!x.done)" :key="it.id" class="catalog-item">• {{ it.text }}</view>
        </scroll-view>
        <view class="modal-actions">
          <button class="btn" @click="closeCatalog">关闭</button>
        </view>
      </view>
    </view>

    <!-- 添加弹窗 -->
    <view v-if="showAdd" class="modal-mask" @click="closeAdd">
      <view class="modal" @click.stop>
        <text class="modal-title">添加小事</text>
        <view class="form">
          <input class="input" v-model="form.text" placeholder="例如：一起戴头饰过圣诞" />
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="closeAdd">取消</button>
          <button class="btn primary" @click="saveItem">保存</button>
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
      showCatalog: false,
      showAdd: false,
      form: { text: '' }
    };
  },
  mounted() {
    this.loadItems();
    if (this.items.length === 0) {
      // 预置示例
      this.items = [
        { id: 1, text: '用对方照片做壁纸', icon: '/static/hundred/wallpaper.png', done: false },
        { id: 2, text: '给对方点下午茶', icon: '/static/hundred/tea.png', done: true },
        { id: 3, text: '互相发动态宣言', icon: '/static/hundred/post.png', done: false },
        { id: 4, text: '视频时截屏记录', icon: '/static/hundred/screenshot.png', done: true },
        { id: 5, text: '一起戴头饰过圣诞', icon: '/static/hundred/christmas.png', done: false }
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
      this.items.unshift({ id, text: this.form.text, icon: '', done: false });
      this.saveItems();
      this.closeAdd();
      uni.showToast({ title: '已添加', icon: 'none' });
    }
  }
};
</script>

<style>
.hundred-page { min-height: 100vh; position: relative; background: #f0f0f0; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.95; }
.title-tag { position: absolute; left: 50%; top: 80rpx; transform: translateX(-50%); background: #ffffff; color: #4e3c3c; padding: 16rpx 28rpx; border-radius: 16rpx; font-size: 30rpx; font-weight: 700; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); border: 1rpx solid #e5e5e5; }

.cards { position: relative; padding: 220rpx 24rpx 120rpx 24rpx; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; }
.card { position: relative; background: #f7f7f7; border-radius: 30rpx; padding: 24rpx; box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.06); border: 1rpx solid #e5e5e5; }
.delete-btn { position: absolute; right: 12rpx; top: 10rpx; width: 40rpx; height: 40rpx; border-radius: 20rpx; background: rgba(0,0,0,0.06); color: #666; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
.delete-btn:active { transform: scale(0.95); }
.card.done { opacity: 0.95; }
.card-icon { width: 88rpx; height: 88rpx; }
.card-text { margin-top: 8rpx; font-size: 28rpx; color: #5a4a4a; }
.stamp { position: absolute; left: -6rpx; top: -10rpx; padding: 10rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; font-weight: 700; }
.stamp-todo { background: #f8f9fa; color: #666; border: 1rpx solid #e5e5e5; }
.stamp-done { background: #e9f6f0; color: #2bad81; border: 1rpx solid #cbe9dc; }
.empty { grid-column: 1 / -1; text-align: center; color: #7a7a7a; padding: 40rpx; }

.fab-group { position: fixed; right: 24rpx; bottom: 60rpx; display: flex; flex-direction: column; gap: 12rpx; z-index: 99; }
.fab { border-radius: 999rpx; padding: 16rpx 24rpx; font-size: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08); }
.fab.menu { background: #ffffff; color: #333; border: 1rpx solid #e5e5e5; }
.fab.add { background: #2bad81; color: #ffffff; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { width: 86%; background: #ffffff; border-radius: 24rpx; padding: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); border: 1rpx solid #e5e5e5; }
.modal-title { font-size: 30rpx; font-weight: 700; color: #2b2b2b; }
.catalog { max-height: 520rpx; margin-top: 10rpx; }
.section { display: block; margin: 10rpx 0; font-size: 26rpx; color: #7a3b52; }
.catalog-item { font-size: 24rpx; color: #5a4a4a; padding: 6rpx 0; }
.form { margin-top: 12rpx; }
.input { border: 1rpx solid #e5e5e5; border-radius: 14rpx; padding: 14rpx; font-size: 26rpx; background: #ffffff; }
.modal-actions { margin-top: 14rpx; display: flex; justify-content: flex-end; gap: 10rpx; }
.btn { padding: 14rpx 20rpx; border-radius: 14rpx; font-size: 26rpx; }
.btn.primary { background: #2bad81; color: #fff; }
.btn.secondary { background: #f0f0f0; color: #333; }
</style>