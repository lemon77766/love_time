<template>
  <view class="hundred-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">一百件小事</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>
    
    <!-- 顶部背景图（从项目根 static 目录加载，避免分包相对路径问题） -->
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
import { getTasks, addTask, deleteTask, completeTask, favoriteTask, uploadChallengePhoto } from '@/api/hundred.js';
import config from '@/utils/config.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      items: [],
      showAdd: false,
      showEdit: false,
      form: { text: '' },
      editForm: null,
      filterMode: 'all', // 'all', 'done', 'todo', 'favorite'
      showDropdown: false,
      loading: false, // 加载状态
      filterOptions: [
        { label: '全部', value: 'all' },
        { label: '待完成', value: 'todo' },
        { label: '已完成', value: 'done' },
        { label: '已收藏', value: 'favorite' }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    },
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
    this.getSystemInfo();
    this.loadItemsFromBackend();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      // 使用新的 API 替代已弃用的 getSystemInfoSync
      // #ifdef MP-WEIXIN
      try {
        // 尝试使用新 API
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          // 降级到旧 API
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        // 如果新 API 不支持，降级到旧 API
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
    },
    /**
     * 从后端加载任务列表
     * 包含详细的前后端连接日志
     */
    async loadItemsFromBackend() {
      console.log('🚀 [一百件事] ========== 开始加载任务列表 ==========');
      console.log('📱 [前端] 页面初始化，准备从后端获取数据');
      console.log('⏰ [时间]', new Date().toLocaleString());
      
      this.loading = true;
      
      try {
        console.log('📡 [前端] 调用 getTasks() API');
        const response = await getTasks();
        
        console.log('✅ [前端] 收到后端响应');
        console.log('📦 [响应] 原始数据:', JSON.stringify(response, null, 2));
        
        // 处理响应数据
        let tasks = [];
        if (response && response.tasks) {
          tasks = response.tasks;
          console.log(`📊 [数据统计] 后端返回 ${tasks.length} 个任务`);
        } else if (Array.isArray(response)) {
          tasks = response;
          console.log(`📊 [数据统计] 后端返回数组格式，共 ${tasks.length} 个任务`);
        } else {
          console.warn('⚠️ [警告] 后端返回数据格式异常，使用空数组');
          tasks = [];
        }
        
        // 转换数据格式：后端格式 -> 前端格式
        console.log('🔄 [数据转换] 开始转换数据格式...');
        this.items = tasks.map(task => this.convertBackendToFrontend(task));
        console.log(`✅ [数据转换] 转换完成，共 ${this.items.length} 个任务`);
        
        // 保存到本地缓存（作为备份）
        this.saveItemsToLocal();
        
        console.log('✅ [一百件事] ========== 任务列表加载完成 ==========');
        console.log(`📊 [最终结果] 显示 ${this.items.length} 个任务`);
        console.log(`   - 已完成: ${this.items.filter(i => i.done).length} 个`);
        console.log(`   - 待完成: ${this.items.filter(i => !i.done).length} 个`);
        console.log(`   - 已收藏: ${this.items.filter(i => i.favorite).length} 个`);
        
      } catch (error) {
        console.error('❌ [一百件事] ========== 加载任务列表失败 ==========');
        console.error('🔴 [错误] 详细信息:', error);
        
        // 分析错误类型并给出针对性提示
        const statusCode = error.statusCode || error.data?.statusCode;
        const errorMsg = error.message || error.errMsg || '';
        const errorData = error.data || {};
        
        // 检查是否是HTML错误页面（通常是404）
        const isHtmlError = typeof errorData === 'string' && errorData.includes('<!doctype html>');
        
        // 检查是否是"用户不存在"错误（可能是接口不存在导致的误判）
        const isUserNotFoundError = errorMsg.includes('用户不存在');
        
        if (statusCode === 404 || errorMsg.includes('404') || isHtmlError) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          if (isUserNotFoundError) {
            console.error('❌ [错误类型] 接口不存在 (404) - 后端返回"用户不存在"');
            console.error('⚠️ 注意：这可能是后端接口未实现导致的通用错误消息');
          } else {
            console.error('❌ [错误类型] 接口不存在 (404)');
          }
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('📍 [请求URL]', `${config.baseURL}${config.API.CHALLENGE.LIST}`);
          console.error('💡 [解决方案]');
          console.error('    1. 检查后端是否已实现此接口');
          console.error('    2. 确认接口路径是否正确（当前: /api/challenge/tasks）');
          console.error('    3. 联系后端开发确认接口是否已部署');
          console.error('    4. 如果是路径问题，可能需要修改 utils/config.js 中的配置');
          if (isUserNotFoundError) {
            console.error('    5. 如果后端已实现接口但仍返回"用户不存在"，请检查：');
            console.error('       - Token是否有效');
            console.error('       - 后端用户认证逻辑是否正确');
          }
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else if (statusCode === 401 || errorMsg.includes('401')) {
          console.error('🔐 [错误类型] 未授权 (401)');
          console.error('💡 [解决方案] Token可能已过期，请重新登录');
        } else if (errorMsg.includes('timeout')) {
          console.error('⏱️ [错误类型] 请求超时');
          console.error('💡 [解决方案] 检查网络连接或后端服务是否正常');
        } else if (isUserNotFoundError && statusCode !== 404) {
          // 非404的"用户不存在"错误
          console.error('🔐 [错误类型] 用户不存在');
          console.error('💡 [解决方案] 用户信息可能已失效，请重新登录');
        } else {
          console.error('📋 [错误] 错误消息:', errorMsg || '未知错误');
          console.error('📍 [错误] 可能原因:');
          console.error('   1. 后端服务未启动');
          console.error('   2. 网络连接问题');
          console.error('   3. Token已过期');
          console.error('   4. 接口路径错误');
        }
        
        // 尝试从本地缓存加载
        console.log('🔄 [降级] 尝试从本地缓存加载数据...');
        this.loadItemsFromLocal();
        
        uni.showToast({
          title: '加载失败，已使用本地数据',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 数据格式转换：后端格式 -> 前端格式
     * 后端: { id, taskName, status, photoUrl, isFavorited, ... }
     * 前端: { id, text, done, image, favorite, ... }
     */
    convertBackendToFrontend(task) {
      const record = task.userRecord || task.user_record || task.record || task.taskRecord || task.task_record || null;

      const rawPhoto =
        record?.photoUrl ||
        record?.photo_url ||
        record?.photo ||
        record?.photoPath ||
        record?.photo_path ||
        task.photoUrl ||
        task.photo_url ||
        task.photo ||
        task.photoPath ||
        task.photo_path ||
        (typeof record?.photo === 'object'
          ? record.photo.url || record.photo.fullUrl || record.photo.path
          : typeof task.photo === 'object'
            ? task.photo.url || task.photo.fullUrl || task.photo.path
            : null);

      const status = record?.status || task.status || task.completedStatus || '';
      const completedFlag = typeof status === 'string'
        ? status.toLowerCase() === 'completed' || status.toLowerCase() === 'done'
        : Boolean(status);

      return {
        id: task.id,
        text: task.taskName || task.taskDescription || '',
        done: completedFlag || record?.completed === true || task.completed === true,
        image: this.normalizePhotoUrl(rawPhoto),
        favorite: record?.isFavorited ?? record?.favorited ?? task.isFavorited ?? false,
        category: task.category || 'preset',
        note: record?.note || task.note || '',
        completedAt: record?.completedAt || task.completedAt || null
      };
    },
    
    /**
     * 数据格式转换：前端格式 -> 后端格式
     */
    convertFrontendToBackend(item) {
      return {
        taskId: item.id,
        taskName: item.text,
        completed: item.done,
        photoUrl: this.stripBaseFromPhotoUrl(item.image),
        favorited: item.favorite
      };
    },

    normalizePhotoUrl(url) {
      if (!url) return '';

      if (Array.isArray(url)) {
        url = url[0];
      }

      if (typeof url === 'object') {
        url = url.url || url.fullUrl || url.path || url.previewUrl || '';
      }

      if (!url) return '';

      if (/^https?:\/\//i.test(url)) {
        return url;
      }

      const base = (config.baseURL || '').replace(/\/$/, '');
      if (!base) {
        return url;
      }

      if (url.startsWith('/')) {
        return `${base}${url}`;
      }

      return `${base}/${url}`;
    },

    stripBaseFromPhotoUrl(url) {
      if (!url) return null;

      const base = (config.baseURL || '').replace(/\/$/, '');
      if (base && url.startsWith(base)) {
        const stripped = url.slice(base.length);
        return stripped.startsWith('/') ? stripped : `/${stripped}`;
      }

      return url;
    },
    
    /**
     * 从本地缓存加载（降级方案）
     */
    loadItemsFromLocal() {
      console.log('💾 [本地缓存] 从本地存储加载数据...');
      try {
        const data = uni.getStorageSync('hundred_items');
        this.items = Array.isArray(data) ? data : [];
        console.log(`✅ [本地缓存] 加载了 ${this.items.length} 个任务`);
      } catch (e) {
        console.error('❌ [本地缓存] 加载失败:', e);
        this.items = [];
      }
    },
    
    /**
     * 保存到本地缓存（作为备份）
     */
    saveItemsToLocal() {
      try {
        uni.setStorageSync('hundred_items', this.items);
        console.log('💾 [本地缓存] 已保存到本地存储');
      } catch (e) {
        console.error('❌ [本地缓存] 保存失败:', e);
      }
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
    /**
     * 上传图片
     * 选择图片后，更新任务完成状态并同步到后端
     */
    uploadImage(item) {
      console.log('📸 [一百件事] ========== 开始上传图片 ==========');
      console.log('📋 [任务] ID:', item.id, '名称:', item.text);
      
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          console.log('✅ [图片选择] 成功，临时路径:', tempFilePath);
          
          // 更新本地显示
          const previousImage = item.image;
          const previousDoneState = item.done;
          item.image = tempFilePath;
          this.saveItemsToLocal();
          
          let loadingShown = false;
          
          try {
            uni.showLoading({
              title: '上传中...',
              mask: true
            });
            loadingShown = true;
            
            console.log('📡 [后端] 上传图片到服务器...');
            const uploadResult = await uploadChallengePhoto(tempFilePath);
            const uploadedPhotoUrl = uploadResult?.photoUrl;
            const successMessage = uploadResult?.message || '图片已上传';
            
            if (uploadedPhotoUrl) {
              item.image = uploadedPhotoUrl;
            }
            item.done = true;
            this.saveItemsToLocal();
            
            await this.syncTaskComplete(item, true, uploadedPhotoUrl);
            console.log('✅ [后端] 图片同步成功');
            
            if (loadingShown) {
              uni.hideLoading();
              loadingShown = false;
            }
            
            const toastTitle = successMessage && successMessage.length <= 7 ? successMessage : '图片已上传';
            uni.showToast({ title: toastTitle, icon: 'success' });
          } catch (error) {
            console.error('❌ [后端] 图片上传或同步失败:', error);
            
            // 回滚完成状态和图片，提示用户重新尝试
            item.image = previousImage;
            item.done = previousDoneState;
            this.saveItemsToLocal();
            
            if (loadingShown) {
              uni.hideLoading();
              loadingShown = false;
            }
            
            const statusCode = error?.statusCode || error?.data?.statusCode;
            const errorMsg = error?.message || error?.errMsg || '';
            const isHtmlError = typeof error?.data === 'string' && error?.data?.includes('<!doctype html>');
            
            let toastTitle = '图片上传失败，请稍后重试';
            
            if (statusCode === 404 || errorMsg.includes('404') || isHtmlError) {
              toastTitle = '上传接口不存在，请联系管理员';
            } else if (statusCode === 401 || errorMsg.includes('401')) {
              toastTitle = '登录信息已过期，请重新登录';
            } else if (errorMsg.includes('timeout')) {
              toastTitle = '上传超时，请检查网络';
            } else if (errorMsg) {
              toastTitle = errorMsg.length <= 10 ? errorMsg : '图片上传失败';
            }
            
            uni.showToast({ title: toastTitle, icon: 'none' });
          } finally {
            if (loadingShown) {
              uni.hideLoading();
            }
          }
          
        },
        fail: (err) => {
          // 如果是用户取消操作，不显示错误提示
          if (err && err.errMsg && err.errMsg.includes('cancel')) {
            console.log('ℹ️ [图片选择] 用户取消操作');
            return;
          }
          // 其他错误才显示提示
          console.error('❌ [图片选择] 失败:', err);
          uni.showToast({ title: '上传失败', icon: 'none' });
        }
      });
    },
    /**
     * 切换收藏状态
     * 同步到后端
     */
    async toggleFavorite(item) {
      const newFavoriteState = !item.favorite;
      const action = newFavoriteState ? '收藏' : '取消收藏';
      
      console.log(`⭐ [一百件事] ========== ${action}任务 ==========`);
      console.log('📋 [任务] ID:', item.id, '名称:', item.text);
      console.log('🔄 [状态] 当前:', item.favorite ? '已收藏' : '未收藏', '→ 新状态:', newFavoriteState ? '已收藏' : '未收藏');
      
      // 先更新本地状态（乐观更新）
      item.favorite = newFavoriteState;
      this.saveItemsToLocal();
      
      try {
        console.log('📡 [前端] 调用 favoriteTask() API');
        await favoriteTask({
          taskId: item.id,
          favorited: newFavoriteState
        });
        
        console.log(`✅ [后端] ${action}任务成功`);
      uni.showToast({ 
          title: newFavoriteState ? '已收藏' : '取消收藏', 
        icon: 'none',
        duration: 1500
      });
      } catch (error) {
        console.error(`❌ [后端] ${action}任务失败:`, error);
        // 回滚状态
        item.favorite = !newFavoriteState;
        this.saveItemsToLocal();
        
        uni.showToast({
          title: `${action}失败，请重试`,
          icon: 'none',
          duration: 2000
        });
      }
    },
    openEdit(item) {
      this.editForm = { ...item };
      this.showEdit = true;
    },
    closeEdit() {
      this.showEdit = false;
      this.editForm = null;
    },
    /**
     * 保存编辑
     * 注意：后端可能不支持编辑预设任务，只支持自定义任务
     */
    async saveEdit() {
      if (!this.editForm.text) {
        uni.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      
      console.log('✏️ [一百件事] ========== 保存编辑 ==========');
      console.log('📋 [任务] ID:', this.editForm.id);
      console.log('📝 [内容] 旧:', this.items.find(i => i.id === this.editForm.id)?.text);
      console.log('📝 [内容] 新:', this.editForm.text);
      
      const index = this.items.findIndex(item => item.id === this.editForm.id);
      if (index !== -1) {
        const oldText = this.items[index].text;
        
        // 先更新本地
        this.items[index].text = this.editForm.text;
        this.saveItemsToLocal();
        this.closeEdit();
        
        // 如果是自定义任务，同步到后端（预设任务可能不支持编辑）
        const item = this.items[index];
        if (item.category === 'custom') {
          try {
            console.log('📡 [前端] 自定义任务，尝试同步到后端...');
            // 注意：后端可能没有编辑接口，这里先只保存本地
            // 如果需要后端支持，可以添加编辑接口
            console.log('ℹ️ [提示] 当前后端可能不支持编辑接口，仅保存到本地');
            uni.showToast({ title: '已保存（仅本地）', icon: 'success' });
          } catch (error) {
            console.error('❌ [后端] 同步失败:', error);
            // 回滚
            this.items[index].text = oldText;
            this.saveItemsToLocal();
            uni.showToast({ title: '保存失败，请重试', icon: 'none' });
          }
        } else {
          console.log('ℹ️ [提示] 预设任务仅保存到本地');
        uni.showToast({ title: '已保存', icon: 'success' });
        }
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
    /**
     * 删除任务
     * 同步到后端（仅自定义任务可删除）
     */
    async deleteItem(item) {
      console.log('🗑️ [一百件事] ========== 删除任务 ==========');
      console.log('📋 [任务] ID:', item.id, '名称:', item.text);
      console.log('📂 [类型]', item.category || '未知');
      
      // 只有自定义任务可以删除
      if (item.category === 'custom') {
        try {
          console.log('📡 [前端] 调用 deleteTask() API');
          await deleteTask(item.id);
          
          console.log('✅ [后端] 删除任务成功');
          
          // 从列表中移除
      this.items = this.items.filter(it => it.id !== item.id);
          this.saveItemsToLocal();
          
          uni.showToast({ title: '已删除', icon: 'success' });
        } catch (error) {
          console.error('❌ [后端] 删除任务失败:', error);
          uni.showToast({
            title: '删除失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        console.log('⚠️ [警告] 预设任务不能删除');
        uni.showToast({
          title: '预设任务不能删除',
          icon: 'none',
          duration: 2000
        });
      }
    },
    /**
     * 切换完成状态
     * 同步到后端
     */
    async toggleDone(item) {
      const newDoneState = !item.done;
      const action = newDoneState ? '标记完成' : '取消完成';
      
      console.log(`✅ [一百件事] ========== ${action}任务 ==========`);
      console.log('📋 [任务] ID:', item.id, '名称:', item.text);
      console.log('🔄 [状态] 当前:', item.done ? '已完成' : '未完成', '→ 新状态:', newDoneState ? '已完成' : '未完成');
      
      // 先更新本地状态（乐观更新）
      item.done = newDoneState;
      this.saveItemsToLocal();
      
      try {
        await this.syncTaskComplete(item, newDoneState, item.image);
        console.log(`✅ [后端] ${action}任务成功`);
      } catch (error) {
        console.error(`❌ [后端] ${action}任务失败:`, error);
        // 回滚状态
        item.done = !newDoneState;
        this.saveItemsToLocal();
        
        uni.showToast({
          title: `${action}失败，请重试`,
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    /**
     * 同步任务完成状态到后端
     */
    async syncTaskComplete(item, completed, photoUrl = null) {
      console.log('📡 [前端] 调用 completeTask() API');
      console.log('📤 [参数] taskId:', item.id, 'completed:', completed, 'photoUrl:', photoUrl || '无');
      
      await completeTask({
        taskId: item.id,
        completed: completed,
        photoUrl: photoUrl || null,
        note: item.note || null
      });
    },
    openCatalog() { this.showCatalog = true; },
    closeCatalog() { this.showCatalog = false; },
    openAdd() { this.showAdd = true; },
    closeAdd() { this.showAdd = false; this.form.text = ''; },
    /**
     * 保存新任务
     * 同步到后端
     */
    async saveItem() {
      if (!this.form.text) {
        uni.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      
      console.log('➕ [一百件事] ========== 添加新任务 ==========');
      console.log('📝 [内容]', this.form.text);
      
      const taskData = {
        taskName: this.form.text,
        taskDescription: ''
      };
      
      try {
        console.log('📡 [前端] 调用 addTask() API');
        const response = await addTask(taskData);
        
        console.log('✅ [后端] 添加任务成功');
        console.log('📦 [响应]', response);
        
        // 添加新任务到列表
        if (response && response.task) {
          const newTask = this.convertBackendToFrontend(response.task);
          this.items.unshift(newTask);
          console.log('✅ [前端] 新任务已添加到列表，ID:', newTask.id);
        } else {
          // 如果后端没有返回完整任务对象，创建一个临时对象
          console.warn('⚠️ [警告] 后端未返回完整任务对象，创建临时对象');
          const maxId = this.items.reduce((m, it) => Math.max(m, it.id || 0), 0);
          const tempTask = {
            id: maxId + 1,
            text: this.form.text,
            done: false,
            favorite: false,
            image: '',
            category: 'custom'
          };
          this.items.unshift(tempTask);
        }
        
        this.saveItemsToLocal();
      this.closeAdd();
        uni.showToast({ title: '已添加', icon: 'success' });
        
      } catch (error) {
        console.error('❌ [后端] 添加任务失败:', error);
        uni.showToast({
          title: '添加失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  }
};
</script>

<style>
.hundred-page { 
  min-height: 100vh; 
  background: #FFFAF4;
  padding-bottom: 120rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

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
  font-size: 32rpx;
  font-weight: 500;
  color: #4A4A4A;
  display: block;
  margin-bottom: 20rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  background: #FFCC66;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 26rpx;
  color: #4A4A4A;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.filter-dropdown {
  padding: 8rpx 16rpx;
  background: #ffffff;
  border: 2rpx solid #FFEED4;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #4A4A4A;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(255, 204, 102, 0.2);
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.filter-label {
  font-size: 24rpx;
  color: #4A4A4A;
}

.dropdown-icon {
  font-size: 20rpx;
  color: #FFCC66;
  transition: transform 0.3s ease;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  right: 32rpx;
  top: 130rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  overflow: hidden;
  z-index: 10;
  min-width: 160rpx;
  border: 2rpx solid #FFEED4;
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
  background: #F8F0FC;
}

.item-label {
  font-size: 26rpx;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.dropdown-item.active .item-label {
  color: #FFCC66;
  font-weight: 600;
}

.check-icon {
  font-size: 28rpx;
  color: #FFCC66;
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
  background: #ffffff;
  border-radius: 16rpx;
  padding: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  border: 1rpx solid #FFEED4;
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
  color: #FFCC66;
  transform: scale(1.1);
}

.event-image {
  width: 100%;
  height: 160rpx;
  border-radius: 12rpx;
  background: #ffffff;
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
  color: #FFCC66;
}

.event-title-wrapper {
  width: 100%;
  padding: 8rpx 0;
}

.event-title {
  font-size: 24rpx;
  color: #4A4A4A;
  text-align: center;
  line-height: 1.4;
  display: block;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  background: #FFCC66;
  box-shadow: 0 10rpx 24rpx rgba(255, 204, 102, 0.35);
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
  font-size: 34rpx; 
  font-weight: 500; 
  color: #4A4A4A; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.form { 
  margin-top: 20rpx; 
}

.input { 
  border: 1rpx solid #FFEED4; 
  border-radius: 12rpx; 
  padding: 16rpx; 
  font-size: 26rpx; 
  background: #ffffff; 
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.btn.primary { 
  background: #FFCC66;
  color: #8B6914; 
}

.btn.secondary { 
  background: #FFF4E0; 
  color: #8B6914; 
}

.btn.danger {
  background: #ff6b6b;
  color: #fff;
}
</style>