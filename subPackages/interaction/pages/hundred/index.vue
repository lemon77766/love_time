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
        <!-- 操作按钮组 -->
        <view class="action-buttons">
          <!-- 删除按钮 -->
          <view class="delete-icon" @click.stop="deleteEvent(item)">
            <text>🗑️</text>
          </view>
          <!-- 收藏标记 -->
          <view class="favorite-icon" @click.stop="toggleFavorite(item)">
            <text :class="{ 'favorite-active': item.favorite }">{{ item.favorite ? '★' : '☆' }}</text>
          </view>
        </view>
        
        <!-- 图片区域 -->
        <view class="event-image" @click="handleEventClick(item)">
          <image v-if="item.image" :src="item.image" mode="aspectFill" @error="onImageError"
			@load="onImageLoad" ></image>
          <view v-else class="placeholder-icon">📸+</view>
        </view>
        
        <!-- 标题区域 -->
        <view class="event-title-wrapper" @click="handleEventClick(item)" @longpress="openEdit(item)">
          <text class="event-title" :class="{ done: item.done }">{{ item.text }}</text>
          <!-- 完成记录指示器 -->
          <view v-if="item.done && item.hasRecord" class="record-indicator" @click.stop="openRecordDetail(item)">
            <text class="record-icon">📝</text>
          </view>
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

    <!-- 完成记录弹窗 -->
    <view v-if="showRecordModal" class="modal-mask" @click="closeRecordModal">
      <view class="record-modal" @click.stop>
        <text class="modal-title">{{ recordModal.mode === 'add' ? '记录完成时刻' : '查看记录' }}</text>
        
        <scroll-view class="record-form" scroll-y="true">
          <!-- 照片区域 -->
          <view class="record-section">
            <text class="section-title">照片记录</text>
            <view class="photo-section" @click="uploadRecordImage">
              <image v-if="recordModal.photoUrl" :src="recordModal.photoUrl" mode="aspectFill" class="record-photo" />
              <view v-else class="photo-placeholder">
                <text class="placeholder-icon">📸</text>
                <text class="placeholder-text">点击上传照片</text>
              </view>
            </view>
          </view>

          <!-- 时间地点 -->
          <view class="record-section">
            <text class="section-title">时间地点</text>
            <view class="form-row">
              <view class="form-item half">
                <text class="form-label">完成日期</text>
                <picker mode="date" :value="recordModal.completedDate" @change="onRecordDateChange">
                  <view class="form-input">{{ recordModal.completedDate || '选择日期' }}</view>
                </picker>
              </view>
              <view class="form-item half">
                <text class="form-label">完成时间</text>
                <picker mode="time" :value="recordModal.completedTime" @change="onRecordTimeChange">
                  <view class="form-input">{{ recordModal.completedTime || '选择时间' }}</view>
                </picker>
              </view>
            </view>
            <view class="form-item">
              <text class="form-label">完成地点</text>
              <input class="form-input" v-model="recordModal.location" placeholder="记录美好的发生地" />
            </view>
            <view class="form-item">
              <text class="form-label">天气状况</text>
              <picker :range="weatherOptions" @change="onWeatherChange">
                <view class="form-input">{{ recordModal.weather || '选择天气' }}</view>
              </picker>
            </view>
          </view>

          <!-- 感受评分 -->
          <view class="record-section">
            <text class="section-title">感受评价</text>
            <view class="form-item">
              <text class="form-label">心情感受</text>
              <textarea class="form-textarea" v-model="recordModal.feeling" 
                placeholder="记录当时的心情和感受..." 
                maxlength="200" />
              <text class="char-count">{{ (recordModal.feeling || '').length }}/200</text>
            </view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="btn secondary" @click="closeRecordModal">取消</button>
          <button v-if="recordModal.mode === 'add'" class="btn primary" @click="saveRecord">保存记录</button>
          <button v-else class="btn primary" @click="editRecord">编辑记录</button>
        </view>
      </view>
    </view>

    <!-- 记录详情弹窗 -->
    <view v-if="showDetailModal" class="modal-mask" @click="closeDetailModal">
      <view class="detail-modal" @click.stop>
        <text class="modal-title">完成记录详情</text>
        
        <scroll-view class="detail-content" scroll-y="true">
          <!-- 照片展示 -->
          <view v-if="detailModal.photoUrl" class="detail-section">
            <image :src="detailModal.photoUrl" mode="aspectFill" class="detail-photo" @click="previewImage(detailModal.photoUrl)" />
          </view>

          <!-- 基本信息 -->
          <view class="detail-section">
            <view class="detail-info">
              <text class="info-label">完成时间：</text>
              <text class="info-value">{{ detailModal.completedDate }} {{ detailModal.completedTime }}</text>
            </view>
            <view v-if="detailModal.location" class="detail-info">
              <text class="info-label">地点：</text>
              <text class="info-value">{{ detailModal.location }}</text>
            </view>
            <view v-if="detailModal.weather" class="detail-info">
              <text class="info-label">天气：</text>
              <text class="info-value">{{ detailModal.weather }}</text>
            </view>
          </view>

          <!-- 感受描述 -->
          <view v-if="detailModal.feeling" class="detail-section">
            <view class="detail-info">
              <text class="info-label">感受：</text>
              <text class="info-value">{{ detailModal.feeling }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="btn secondary" @click="editExistingRecord">编辑记录</button>
          <button class="btn primary" @click="closeDetailModal">关闭</button>
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
      ],
      // 记录弹窗相关
      showRecordModal: false,
      recordModal: {
        mode: 'add', // 'add' | 'edit'
        taskId: null,
        photoUrl: '',
        completedDate: '',
        completedTime: '',
        location: '',
        weather: '',
        feeling: ''
      },
      // 详情弹窗相关
      showDetailModal: false,
      detailModal: {},
      // 预设选项
      weatherOptions: ['晴天', '多云', '阴天', '小雨', '中雨', '大雨', '雪天', '雾天', '大风', '其他']
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
    },
	onImageError(e) {
	    console.log('------图片加载失败:', e)
	  },
  },
  mounted() {
    this.getSystemInfo();
    // 不再强制要求登录，允许用户先浏览页面
    // 在用户尝试执行需要登录的操作时再检查登录状态
    
    // 检查是否为游客用户
    const loginInfo = uni.getStorageSync('login_info');
    const isGuest = !loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn;
    
    if (isGuest) {
      // 游客模式：使用默认数据，不调用API
      console.log('👤 游客模式：使用默认事件列表');
      this.useGuestMode();
    } else {
      // 登录用户：从后端加载数据
      try {
        this.loadItemsFromBackend();
      } catch (error) {
        console.error('加载服务器数据失败:', error);
        // 如果加载失败，回退到游客模式
        this.useGuestMode();
      }
    }
  },
  methods: {
    // 游客模式：使用默认数据
    useGuestMode() {
      // 设置默认事件列表
      this.items = [
        { id: 1, text: '一起看日出', completed: false, image: '', favorite: false },
        { id: 2, text: '一起做一顿饭', completed: false, image: '', favorite: false },
        { id: 3, text: '一起看电影', completed: false, image: '', favorite: false },
        { id: 4, text: '一起逛公园', completed: false, image: '', favorite: false },
        { id: 5, text: '一起旅行', completed: false, image: '', favorite: false },
        { id: 6, text: '一起拍合照', completed: false, image: '', favorite: false }
      ];
      
      console.log('✅ 游客模式初始化完成');
    },

    // 检查是否需要登录
    checkLoginRequired() {
      const loginInfo = uni.getStorageSync('login_info');
      // 如果是游客用户，提示需要登录
      if (!loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn) {
        uni.showModal({
          title: '需要登录',
          content: '该功能需要登录后才能使用，是否前往登录？\n\n您仍然可以继续浏览页面功能。',
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
     onImageLoad(e) {
        console.log('✅ 图片加载成功:', e.detail)
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

      // 检查是否有详细的完成记录
      const hasDetailedRecord = record && (
        record.location || record.completedDate || record.completedTime || 
        record.feeling || record.weather || record.rating || 
        (record.tags && record.tags.length > 0)
      );

      return {
        id: task.id,
        text: task.taskName || task.taskDescription || '',
        done: completedFlag || record?.completed === true || task.completed === true,
        image: this.normalizePhotoUrl(rawPhoto),
        favorite: record?.isFavorited ?? record?.favorited ?? task.isFavorited ?? false,
        category: task.category || 'preset',
        note: record?.note || task.note || '',
        completedAt: record?.completedAt || task.completedAt || null,
        hasRecord: hasDetailedRecord || Boolean(record?.note), // 是否有详细记录
        // 详细记录字段
        location: record?.location || '',
        completedDate: record?.completedDate || '',
        completedTime: record?.completedTime || '',
        feeling: record?.feeling || '',
        weather: record?.weather || '',
        tags: record?.tags || [],
        rating: record?.rating || 0
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
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
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
            console.log('📤 [上传参数] 文件路径:', tempFilePath);
            
            const uploadResult = await uploadChallengePhoto(tempFilePath);
            
            console.log('📥 [上传结果] 完整响应:', uploadResult);
            console.log('📥 [上传结果] 数据类型:', typeof uploadResult);
            
            const uploadedPhotoUrl = uploadResult?.photoUrl;
            const successMessage = uploadResult?.message || '图片已上传';
            
            console.log('🖼️ [图片URL] 提取结果:', uploadedPhotoUrl);
            console.log('💬 [成功消息] 提取结果:', successMessage);
            
            if (uploadedPhotoUrl) {
              console.log('💾 [本地更新] 更新图片URL:', uploadedPhotoUrl);
              item.image = uploadedPhotoUrl;
            } else {
              console.warn('⚠️ [警告] 未获取到图片URL，使用临时路径');
            }
            
            item.done = true;
            this.saveItemsToLocal();
            
            console.log('🔄 [同步] 开始同步任务完成状态到后端');
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
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
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

    /**
     * 删除事件
     */
    async deleteEvent(item) {
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      
      console.log('🗑️ [一百件事] ========== 删除事件 ==========');
      console.log('📋 [任务] ID:', item.id, '名称:', item.text);
      
      // 确认删除
      const confirmResult = await new Promise((resolve) => {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除"${item.text}"吗？\n\n删除后将无法恢复，包括相关的照片和记录。`,
          confirmText: '确定删除',
          cancelText: '取消',
          success: (res) => {
            resolve(res.confirm);
          }
        });
      });
      
      if (!confirmResult) {
        console.log('❌ [用户] 取消删除');
        return;
      }
      
      try {
        // 显示加载状态
        uni.showLoading({
          title: '删除中...',
          mask: true
        });
        
        console.log('📡 [前端] 调用 deleteTask() API');
        await deleteTask(item.id);
        
        // 从本地数组中移除
        const index = this.items.findIndex(i => i.id === item.id);
        if (index > -1) {
          this.items.splice(index, 1);
        }
        
        // 保存到本地存储
        this.saveItemsToLocal();
        
        uni.hideLoading();
        console.log('✅ [后端] 删除事件成功');
        uni.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500
        });
        
      } catch (error) {
        uni.hideLoading();
        console.error('❌ [后端] 删除事件失败:', error);
        uni.showToast({
          title: '删除失败，请重试',
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
     * 处理事件点击 - 统一的点击处理方法
     * 点击事件任何地方都会触发时间记录弹窗
     */
    handleEventClick(item) {
      console.log('🖱️ [事件点击] 点击了事件:', item.text, '状态:', item.done ? '已完成' : '未完成');
      
      if (item.done) {
        // 已完成的任务，查看记录详情
        if (item.hasRecord) {
          this.openRecordDetail(item);
        } else {
          // 已完成但没有详细记录，打开记录弹窗补充信息
          this.openRecordModal(item);
        }
      } else {
        // 未完成的任务，打开记录弹窗
        this.openRecordModal(item);
      }
    },

    /**
     * 切换完成状态
     * 如果标记为完成，打开记录弹窗；如果取消完成，直接更新状态
     */
    async toggleDone(item) {
      const newDoneState = !item.done;
      
      if (newDoneState) {
        // 标记为完成，打开记录弹窗
        this.openRecordModal(item);
      } else {
        // 取消完成状态，直接更新
        const action = '取消完成';
        
        console.log(`✅ [一百件事] ========== ${action}任务 ==========`);
        console.log('📋 [任务] ID:', item.id, '名称:', item.text);
        
        // 先更新本地状态（乐观更新）
        item.done = false;
        item.hasRecord = false; // 清除记录标记
        this.saveItemsToLocal();
        
        try {
          await this.syncTaskComplete(item, false, item.image);
          console.log(`✅ [后端] ${action}任务成功`);
          uni.showToast({ title: '已取消完成', icon: 'success' });
        } catch (error) {
          console.error(`❌ [后端] ${action}任务失败:`, error);
          // 回滚状态
          item.done = true;
          this.saveItemsToLocal();
          
          uni.showToast({
            title: `${action}失败，请重试`,
            icon: 'none',
            duration: 2000
          });
        }
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
    openAdd() { 
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
        return;
      }
      this.showAdd = true; 
    },
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
      
      // 检查是否需要登录
      if (!this.checkLoginRequired()) {
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
    },

    // ===== 记录弹窗相关方法 =====
    
    /**
     * 打开记录弹窗（添加模式）
     */
    openRecordModal(item) {
      console.log('📝 [记录] 打开完成记录弹窗:', item.text);
      
      // 设置默认时间
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().slice(0, 5);
      
      this.recordModal = {
        mode: 'add',
        taskId: item.id,
        photoUrl: item.image || '',
        completedDate: item.completedDate || date,
        completedTime: item.completedTime || time,
        location: item.location || '',
        weather: item.weather || '',
        feeling: item.feeling || ''
      };
      
      this.showRecordModal = true;
    },
    
    /**
     * 关闭记录弹窗
     */
    closeRecordModal() {
      this.showRecordModal = false;
      this.recordModal = {
        mode: 'add',
        taskId: null,
        photoUrl: '',
        completedDate: '',
        completedTime: '',
        location: '',
        weather: '',
        feeling: '',
        note: '',
        tags: [],
        rating: 0
      };
    },
    
    /**
     * 打开记录详情
     */
    openRecordDetail(item) {
      console.log('📖 [记录] 查看记录详情:', item.text);
      
      this.detailModal = {
        taskId: item.id,
        taskName: item.text,
        photoUrl: item.image || '',
        completedDate: item.completedDate || '',
        completedTime: item.completedTime || '',
        location: item.location || '',
        weather: item.weather || '',
        feeling: item.feeling || ''
      };
      
      this.showDetailModal = true;
    },
    
    /**
     * 关闭详情弹窗
     */
    closeDetailModal() {
      this.showDetailModal = false;
      this.detailModal = {};
    },
    
    /**
     * 上传记录图片
     */
    uploadRecordImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          console.log('📸 [记录] 选择图片:', tempFilePath);
          
          // 先显示临时图片
          this.recordModal.photoUrl = tempFilePath;
          
          try {
            uni.showLoading({
              title: '上传中...',
              mask: true
            });
            
            const uploadResult = await uploadChallengePhoto(tempFilePath);
            this.recordModal.photoUrl = uploadResult.photoUrl;
            
            uni.hideLoading();
            uni.showToast({ title: '图片上传成功', icon: 'success' });
          } catch (error) {
            uni.hideLoading();
            this.recordModal.photoUrl = '';
            uni.showToast({ title: '图片上传失败', icon: 'none' });
            console.error('图片上传失败:', error);
          }
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.includes('cancel')) {
            console.log('用户取消选择图片');
            return;
          }
          console.error('选择图片失败:', err);
          uni.showToast({ title: '选择图片失败', icon: 'none' });
        }
      });
    },
    
    /**
     * 记录日期变化
     */
    onRecordDateChange(e) {
      this.recordModal.completedDate = e.detail.value;
    },
    
    /**
     * 记录时间变化
     */
    onRecordTimeChange(e) {
      this.recordModal.completedTime = e.detail.value;
    },
    
    /**
     * 天气选择变化
     */
    onWeatherChange(e) {
      this.recordModal.weather = this.weatherOptions[e.detail.value];
    },
    

    
    /**
     * 保存记录
     */
    async saveRecord() {
      console.log('💾 [记录] 保存完成记录');
      
      // 基本验证
      if (!this.recordModal.completedDate) {
        uni.showToast({ title: '请选择完成日期', icon: 'none' });
        return;
      }
      
      try {
        uni.showLoading({
          title: '保存中...',
          mask: true
        });
        
        // 更新本地数据
        const item = this.items.find(i => i.id === this.recordModal.taskId);
        if (item) {
          item.done = true;
          item.hasRecord = true;
          item.image = this.recordModal.photoUrl;
          item.completedDate = this.recordModal.completedDate;
          item.completedTime = this.recordModal.completedTime;
          item.location = this.recordModal.location;
          item.weather = this.recordModal.weather;
          item.feeling = this.recordModal.feeling;
          item.completedAt = new Date().toISOString();
        }
        
        // 同步到后端
        await this.syncTaskCompleteWithDetails(item);
        
        this.saveItemsToLocal();
        this.closeRecordModal();
        
        uni.hideLoading();
        uni.showToast({ title: '记录保存成功', icon: 'success' });
        
      } catch (error) {
        uni.hideLoading();
        console.error('保存记录失败:', error);
        uni.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    },
    
    /**
     * 编辑现有记录
     */
    editExistingRecord() {
      const item = this.items.find(i => i.id === this.detailModal.taskId);
      if (item) {
        this.openRecordModal(item);
        this.recordModal.mode = 'edit';
        this.closeDetailModal();
      }
    },
    
    /**
     * 编辑记录
     */
    async editRecord() {
      console.log('✏️ [记录] 编辑记录');
      
      try {
        uni.showLoading({
          title: '更新中...',
          mask: true
        });
        
        // 更新本地数据
        const item = this.items.find(i => i.id === this.recordModal.taskId);
        if (item) {
          item.image = this.recordModal.photoUrl;
          item.completedDate = this.recordModal.completedDate;
          item.completedTime = this.recordModal.completedTime;
          item.location = this.recordModal.location;
          item.weather = this.recordModal.weather;
          item.feeling = this.recordModal.feeling;
          item.note = this.recordModal.note;
        }
        
        // 同步到后端
        await this.syncTaskCompleteWithDetails(item);
        
        this.saveItemsToLocal();
        this.closeRecordModal();
        
        uni.hideLoading();
        uni.showToast({ title: '记录更新成功', icon: 'success' });
        
      } catch (error) {
        uni.hideLoading();
        console.error('编辑记录失败:', error);
        uni.showToast({ title: '更新失败，请重试', icon: 'none' });
      }
    },
    
    /**
     * 预览图片
     */
    previewImage(url) {
      uni.previewImage({
        urls: [url],
        current: url
      });
    },
    
    /**
     * 同步任务完成详情到后端
     */
    async syncTaskCompleteWithDetails(item) {
      console.log('🔄 [同步] 发送详细记录到后端');
      
      await completeTask({
        taskId: item.id,
        completed: item.done,
        photoUrl: this.stripBaseFromPhotoUrl(item.image) || null,
        note: item.note || null,
        location: item.location || null,
        completedDate: item.completedDate || null,
        completedTime: item.completedTime || null,
        feeling: item.feeling || null,
        weather: item.weather || null
      });
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

/* 标题区域 */
.header-section {
  padding: 60rpx 32rpx 24rpx 32rpx;
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

/* 操作按钮组 */
.action-buttons {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  z-index: 5;
}

/* 删除图标 */
.delete-icon {
  font-size: 28rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.1));
}

.delete-icon:active {
  transform: scale(0.9);
}

.delete-icon text {
  color: #ff4757;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.delete-icon:hover text {
  opacity: 1;
  transform: scale(1.1);
}

/* 收藏图标 */
.favorite-icon {
  font-size: 32rpx;
  cursor: pointer;
  transition: all 0.3s ease;
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
  margin-top: 32rpx; 
  display: flex; 
  justify-content: center; 
  gap: 20rpx; 
  padding: 0 32rpx;
  position: relative;
  z-index: 1;
}

.btn { 
  padding: 18rpx 36rpx; 
  border-radius: 24rpx; 
  font-size: 28rpx; 
  border: none;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160rpx;
  text-align: center;
}

.btn.primary { 
  background: linear-gradient(135deg, #FFCC66 0%, #FFD699 100%);
  color: #8B6914; 
  box-shadow: 0 8rpx 24rpx rgba(255, 204, 102, 0.3);
  border: 1.5rpx solid rgba(255, 204, 102, 0.2);
}

.btn.primary:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(255, 204, 102, 0.4);
}

.btn.secondary { 
  background: rgba(255, 255, 255, 0.8);
  color: #8B6914; 
  border: 1.5rpx solid rgba(139, 105, 20, 0.3);
  backdrop-filter: blur(10px);
}

.btn.secondary:active {
  background: rgba(255, 244, 224, 0.8);
  transform: translateY(2rpx);
}

.btn.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.3);
}

.btn.danger:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

/* 记录指示器 */
.record-indicator {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  background: #FFCC66;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(255, 204, 102, 0.3);
  z-index: 10;
}

.record-icon {
  font-size: 20rpx;
  line-height: 1;
}

/* 记录弹窗样式 */
.record-modal {
  width: 90%;
  max-width: 680rpx;
  max-height: 85vh;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFFEF9 100%);
  border-radius: 32rpx;
  padding: 32rpx 0;
  position: relative;
  box-shadow: 0 20rpx 60rpx rgba(255, 204, 102, 0.15);
  border: 1.5rpx solid rgba(255, 204, 102, 0.1);
  overflow: hidden;
}

.record-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: linear-gradient(135deg, rgba(255, 224, 179, 0.1) 0%, rgba(255, 204, 102, 0.05) 100%);
  border-radius: 32rpx 32rpx 0 0;
  z-index: 0;
}

.record-form {
  max-height: 60vh;
  padding: 0 32rpx;
  position: relative;
  z-index: 1;
}

.record-section {
  margin-bottom: 36rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20rpx;
  padding: 24rpx;
  backdrop-filter: blur(10px);
  border: 1rpx solid rgba(255, 224, 179, 0.2);
  transition: all 0.3s ease;
}

.record-section:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 224, 179, 0.3);
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(255, 204, 102, 0.08);
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #8B6914;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.section-title::before {
  content: '';
  width: 6rpx;
  height: 24rpx;
  background: linear-gradient(135deg, #FFCC66 0%, #FFD699 100%);
  border-radius: 3rpx;
  margin-right: 12rpx;
}

/* 照片区域 */
.photo-section {
  width: 240rpx;
  height: 240rpx;
  border-radius: 20rpx;
  border: 3rpx dashed rgba(255, 204, 102, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s ease;
  margin: 0 auto;
  position: relative;
  background: linear-gradient(135deg, rgba(255, 248, 240, 0.8) 0%, rgba(255, 238, 212, 0.6) 100%);
  backdrop-filter: blur(5px);
}

.photo-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 224, 179, 0.1) 0%, transparent 70%);
  border-radius: 17rpx;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-section:hover::before {
  opacity: 1;
}

.photo-section:active {
  border-color: #FFCC66;
  background: linear-gradient(135deg, #FFFEF9 0%, #FFF9F0 100%);
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 204, 102, 0.2);
}

.record-photo {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.placeholder-icon {
  font-size: 56rpx;
  color: #FFCC66;
  filter: drop-shadow(0 4rpx 8rpx rgba(255, 204, 102, 0.3));
  animation: float 3s ease-in-out infinite;
}

.placeholder-text {
  font-size: 24rpx;
  color: #8B6914;
  font-weight: 500;
  margin-top: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6rpx);
  }
}



/* 表单样式 */
.form-row {
  display: flex;
  gap: 16rpx;
}

.form-item {
  margin-bottom: 28rpx;
}

.form-item.half {
  flex: 1;
}

.form-label {
  font-size: 26rpx;
  color: #8B6914;
  margin-bottom: 14rpx;
  display: block;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid rgba(255, 224, 179, 0.3);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #4A4A4A;
  line-height: 80rpx;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-input:focus {
  border-color: #FFCC66;
  background: #ffffff;
  box-shadow: 0 0 0 6rpx rgba(255, 204, 102, 0.1);
  transform: translateY(-2rpx);
}

.form-textarea {
  width: 100%;
  min-height: 140rpx;
  border: 2rpx solid rgba(255, 224, 179, 0.3);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #4A4A4A;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  line-height: 1.6;
}

.form-textarea:focus {
  border-color: #FFCC66;
  background: #ffffff;
  box-shadow: 0 0 0 6rpx rgba(255, 204, 102, 0.1);
  transform: translateY(-2rpx);
}

.char-count {
  font-size: 22rpx;
  color: #FFCC66;
  text-align: right;
  margin-top: 8rpx;
  display: block;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 评分容器 */
.rating-container {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}





/* 详情弹窗 */
.detail-modal {
  width: 86%;
  max-width: 600rpx;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.detail-content {
  max-height: 60vh;
  margin-top: 20rpx;
}

.detail-section {
  margin-bottom: 24rpx;
}

.detail-photo {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  cursor: pointer;
}

.detail-info {
  margin-bottom: 16rpx;
}

.info-label {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  margin-left: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}


</style>