<template>
  <view class="history-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-back" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">历史轨迹</text>
        </view>
        <view class="navbar-placeholder"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 时间选择卡片 -->
      <view class="card date-card">
        <view class="card-header">
          <text class="card-title">选择时间区间</text>
        </view>
        <view class="date-range-selector">
          <view class="date-item-wrapper">
            <text class="date-label-text">开始日期</text>
            <picker mode="date" :value="startDate" :start="startDateMin" :end="startDateMax" @change="onStartDateChange">
              <view class="date-item">
                <text class="date-value" :class="{ placeholder: !startDate }">
                  {{ startDate || '请选择开始日期' }}
                </text>
                <text class="date-icon">📅</text>
              </view>
            </picker>
          </view>
          
          <view class="date-arrow">
            <text class="arrow-icon">→</text>
          </view>
          
          <view class="date-item-wrapper">
            <text class="date-label-text">结束日期</text>
            <picker mode="date" :value="endDate" :start="endDateMin" :end="endDateMax" @change="onEndDateChange">
              <view class="date-item">
                <text class="date-value" :class="{ placeholder: !endDate }">
                  {{ endDate || '请选择结束日期' }}
                </text>
                <text class="date-icon">📅</text>
              </view>
            </picker>
          </view>
        </view>
        
        <view class="date-actions">
          <button 
            class="btn-query" 
            @click="loadHistoryTrajectory" 
            :disabled="!startDate || !endDate || isLoadingHistory"
            :class="{ loading: isLoadingHistory }"
          >
            <text v-if="!isLoadingHistory" class="btn-text">查询轨迹</text>
            <text v-else class="btn-text">加载中...</text>
          </button>
          <button 
            v-if="historyPoints.length > 0" 
            class="btn-clear" 
            @click="clearHistory"
          >
            <text class="btn-text">清除</text>
          </button>
        </view>
      </view>

      <!-- 统计信息卡片 -->
      <view class="card stats-card" v-if="historyPoints.length > 0">
        <view class="stats-item">
          <text class="stats-icon">📍</text>
          <view class="stats-content">
            <text class="stats-label">轨迹点</text>
            <text class="stats-value">{{ historyPoints.length }}</text>
          </view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-icon">🗓️</text>
          <view class="stats-content">
            <text class="stats-label">时间范围</text>
            <text class="stats-value-small">{{ startDate }} 至 {{ endDate }}</text>
          </view>
        </view>
      </view>

      <!-- 地图容器 -->
      <view class="card map-container">
        <map
          class="map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polyline="mapPolyline"
          :show-location="false"
          :enable-zoom="true"
          :enable-scroll="true"
          @markertap="onMarkerTap"
        />
        
        <!-- 空状态 -->
        <view v-if="!isLoadingHistory && historyPoints.length === 0 && hasSearched" class="empty-state">
          <view class="empty-icon">🗺️</view>
          <text class="empty-text">该时间段内没有轨迹点</text>
          <text class="empty-hint">请选择其他时间区间</text>
        </view>
        
        <!-- 加载状态 -->
        <view v-if="isLoadingHistory" class="loading-overlay">
          <view class="loading-spinner"></view>
          <text class="loading-text">正在加载轨迹...</text>
        </view>
      </view>
    </view>

    <!-- 轨迹点详情弹窗 -->
    <view v-if="showDetail" class="modal-mask" @click="hidePointDetail">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentPoint.location_name || currentPoint.locationName || currentPoint.title || '未知地点' }}</text>
          <text class="modal-date">{{ formatPointDate(currentPoint) }}</text>
        </view>
        <view class="modal-content">
          <view v-if="currentPoint.address" class="point-address">
            <text class="address-label">📍</text>
            <text class="address-text">{{ currentPoint.address }}</text>
          </view>
          <image v-if="currentPoint.photos && currentPoint.photos.length > 0" :src="currentPoint.photos[0]" class="point-image" mode="aspectFill" />
          <image v-else-if="currentPoint.image" :src="currentPoint.image" class="point-image" mode="aspectFill" />
          <text class="point-description">{{ currentPoint.description || "暂无描述" }}</text>
          <view v-if="currentPoint.visit_count || currentPoint.stay_duration" class="point-meta">
            <text v-if="currentPoint.visit_count" class="meta-text">到访次数：{{ currentPoint.visit_count }}</text>
            <text v-if="currentPoint.stay_duration" class="meta-text">停留时长：{{ formatDuration(currentPoint.stay_duration) }}</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="hidePointDetail">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getTrajectoryList } from '@/api/trajectory.js';

export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      // 历史轨迹相关
      startDate: '',  // 开始日期
      endDate: '',    // 结束日期
      historyPoints: [],  // 历史轨迹点列表
      isLoadingHistory: false,  // 是否正在加载历史轨迹
      hasSearched: false,  // 是否已搜索过
      showDetail: false,
      currentPoint: {},
      // 地图相关
      mapCenter: {
        latitude: 39.9042,  // 默认北京
        longitude: 116.4074
      },
      mapScale: 13,  // 地图缩放级别
      mapMarkers: [],  // 地图标记点
      mapPolyline: []  // 地图路线
    };
  },
  computed: {
    containerPaddingTop() {
      // 将px转换为rpx: rpx = px * 750 / screenWidth
      // 添加20rpx额外间距
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
    // 开始日期选择器的最小日期
    startDateMin() {
      return '2020-01-01';
    },
    // 开始日期选择器的最大日期
    startDateMax() {
      return this.endDate || this.formatDate(new Date());
    },
    // 结束日期选择器的最小日期
    endDateMin() {
      return this.startDate || '2020-01-01';
    },
    // 结束日期选择器的最大日期
    endDateMax() {
      return this.formatDate(new Date());
    }
  },
  watch: {
    // 监听历史轨迹点变化，更新地图
    historyPoints: {
      handler() {
        if (this.historyPoints.length > 0) {
          this.updateHistoryMap();
        }
      },
      deep: true
    }
  },
  onLoad() {
    this.getSystemInfo();
  },
  methods: {
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
      this.navBarHeight = 54;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 54;
      // #endif
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    showPointDetail(point) {
      this.currentPoint = point;
      this.showDetail = true;
    },
    
    hidePointDetail() {
      this.showDetail = false;
      this.currentPoint = {};
    },
    
    /**
     * 开始日期改变
     */
    onStartDateChange(e) {
      const selectedDate = e.detail.value;
      if (this.endDate && selectedDate > this.endDate) {
        uni.showToast({
          title: '开始日期不能晚于结束日期',
          icon: 'none'
        });
        return;
      }
      this.startDate = selectedDate;
    },
    
    /**
     * 结束日期改变
     */
    onEndDateChange(e) {
      const selectedDate = e.detail.value;
      if (this.startDate && selectedDate < this.startDate) {
        uni.showToast({
          title: '结束日期不能早于开始日期',
          icon: 'none'
        });
        return;
      }
      this.endDate = selectedDate;
    },
    
    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
      if (typeof date === 'string') {
        return date;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    /**
     * 加载历史轨迹点
     */
    async loadHistoryTrajectory() {
      if (!this.startDate || !this.endDate) {
        uni.showToast({
          title: '请选择时间区间',
          icon: 'none'
        });
        return;
      }
      
      if (this.startDate > this.endDate) {
        uni.showToast({
          title: '开始日期不能晚于结束日期',
          icon: 'none'
        });
        return;
      }
      
      this.isLoadingHistory = true;
      this.hasSearched = true;
      
      try {
        // 如果用户选择了时间区间，使用 start_date 和 end_date；否则使用 period=30days
        const params = this.startDate && this.endDate 
          ? {
              start_date: this.startDate,
              end_date: this.endDate,
              showPartnerOnly: true,
              limit: 1000  // 获取更多轨迹点
            }
          : {
              period: '30days',
              showPartnerOnly: true,
              limit: 1000  // 获取更多轨迹点
            };
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📅 [历史轨迹查询] 开始查询');
        console.log('选择的日期范围:', this.startDate, '至', this.endDate);
        console.log('请求参数:', JSON.stringify(params, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const res = await getTrajectoryList(params);
        
        console.log('轨迹点查询响应:', res);
        console.log('选择的日期范围:', this.startDate, '至', this.endDate);
        
        if (res.success && res.data) {
          // 兼容多种数据格式：
          // 1. res.data.partnerTrajectories (只显示对方轨迹，showPartnerOnly=true)
          // 2. res.data.points (标准格式)
          // 3. res.data 直接是数组 (后端返回格式)
          let points = [];
          
          if (res.data.partnerTrajectories && Array.isArray(res.data.partnerTrajectories)) {
            // 优先使用 partnerTrajectories（只显示对方轨迹）
            points = res.data.partnerTrajectories;
          } else if (Array.isArray(res.data)) {
            points = res.data;
          } else if (res.data.points && Array.isArray(res.data.points)) {
            points = res.data.points;
          }
          
          // 处理日期格式和字段映射
          // 后端返回的日期格式可能是 "Nov 5, 2025, 5:01:17 PM"，需要兼容处理
          points = points.map(point => {
            // 确保字段名兼容（同时支持 visitTime 和 visit_time）
            if (point.visitTime && !point.visit_time) {
              point.visit_time = point.visitTime;
            }
            if (point.visit_time && !point.visitTime) {
              point.visitTime = point.visit_time;
            }
            
            // 确保 location_name 字段存在（用于显示）
            if (!point.location_name && !point.locationName) {
              point.location_name = point.address || point.description || '未知地点';
              point.locationName = point.location_name;
            } else if (point.locationName && !point.location_name) {
              point.location_name = point.locationName;
            } else if (point.location_name && !point.locationName) {
              point.locationName = point.location_name;
            }
            
            return point;
          });
          
          console.log('解析后的轨迹点数量:', points.length);
          console.log('轨迹点数据示例:', points[0]);
          
          // 前端二次过滤：确保只显示选择的时间范围内的轨迹点（双重保障）
          if (this.startDate && this.endDate) {
            const startDateObj = new Date(this.startDate + ' 00:00:00');
            const endDateObj = new Date(this.endDate + ' 23:59:59');
            
            const filteredPoints = points.filter(point => {
              const visitTime = this.parseTimeString(point.visit_time || point.visitTime);
              if (!visitTime) return false;
              
              // 检查时间是否在选择的范围内
              return visitTime >= startDateObj && visitTime <= endDateObj;
            });
            
            console.log(`前端时间过滤: 原始 ${points.length} 个点，过滤后 ${filteredPoints.length} 个点`);
            console.log(`时间范围: ${this.startDate} 00:00:00 至 ${this.endDate} 23:59:59`);
            
            this.historyPoints = filteredPoints;
          } else {
            this.historyPoints = points;
          }
          
          // 更新地图显示
          if (this.historyPoints.length > 0) {
            this.updateHistoryMap();
            uni.showToast({
              title: `加载了 ${this.historyPoints.length} 个轨迹点`,
              icon: 'success',
              duration: 2000
            });
          } else {
            uni.showToast({
              title: '该时间段内没有轨迹点',
              icon: 'none'
            });
            // 重置地图
            this.mapMarkers = [];
            this.mapPolyline = [];
            this.mapCenter = {
              latitude: 39.9042,
              longitude: 116.4074
            };
            this.mapScale = 13;
          }
        } else {
          throw new Error(res.message || '加载失败');
        }
      } catch (error) {
        console.error('加载历史轨迹失败:', error);
        uni.showToast({
          title: error.message || '加载历史轨迹失败',
          icon: 'none',
          duration: 2000
        });
        this.historyPoints = [];
        // 重置地图
        this.mapMarkers = [];
        this.mapPolyline = [];
      } finally {
        this.isLoadingHistory = false;
      }
    },
    
    /**
     * 清除历史轨迹
     */
    clearHistory() {
      this.historyPoints = [];
      this.startDate = '';
      this.endDate = '';
      this.hasSearched = false;
      // 重置地图
      this.mapMarkers = [];
      this.mapPolyline = [];
      this.mapCenter = {
        latitude: 39.9042,
        longitude: 116.4074
      };
      this.mapScale = 13;
    },
    
    /**
     * 更新历史轨迹地图显示
     */
    updateHistoryMap() {
      if (this.historyPoints.length === 0) {
        return;
      }
      
      // 按时间排序轨迹点
      const sortedPoints = [...this.historyPoints].sort((a, b) => {
        const timeA = this.parseTimeString(a.visit_time || a.visitTime);
        const timeB = this.parseTimeString(b.visit_time || b.visitTime);
        
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        return timeA.getTime() - timeB.getTime();
      });
      
      // 创建地图标记点
      const markers = sortedPoints.map((point, index) => {
        const latitude = point.latitude;
        const longitude = point.longitude;
        const locationName = point.location_name || point.locationName || point.address || '未知地点';
        const visitTime = point.visit_time || point.visitTime;
        
        return {
          id: index + 100,
          latitude: latitude,
          longitude: longitude,
          width: 30,
          height: 30,
          title: locationName,
          callout: {
            content: `${locationName}\n${this.formatVisitTime(visitTime)}`,
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'BYCLICK'
          },
          pointData: point
        };
      });
      
      this.mapMarkers = markers;
      
      // 计算地图中心点和缩放级别
      if (markers.length > 0) {
        // 计算所有点的边界
        const latitudes = markers.map(m => m.latitude);
        const longitudes = markers.map(m => m.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        
        // 中心点
        this.mapCenter = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2
        };
        
        // 根据覆盖范围调整缩放级别
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        
        if (maxDiff < 0.01) {
          this.mapScale = 16;
        } else if (maxDiff < 0.1) {
          this.mapScale = 14;
        } else if (maxDiff < 1) {
          this.mapScale = 12;
        } else {
          this.mapScale = 10;
        }
        
        // 创建轨迹连线（按时间顺序）
        if (sortedPoints.length > 1) {
          const points = sortedPoints.map(point => ({
            latitude: point.latitude,
            longitude: point.longitude
          }));
          
          this.mapPolyline = [{
            points: points,
            color: '#FF6B9D',
            width: 4,
            borderColor: '#fff',
            borderWidth: 1,
            arrowLine: true,
            dottedLine: false
          }];
        } else {
          this.mapPolyline = [];
        }
      }
    },
    
    /**
     * 地图标记点点击事件
     */
    onMarkerTap(e) {
      console.log('标记点点击:', e);
      if (e.detail) {
        const markerId = e.detail.markerId;
        const marker = this.mapMarkers.find(m => m.id === markerId);
        if (marker && marker.pointData) {
          this.showPointDetail(marker.pointData);
        }
      }
    },
    
    /**
     * 解析时间字符串（兼容多种格式）
     * 支持格式：
     * - ISO 格式: "2025-11-05T17:01:17.000Z"
     * - 标准格式: "2025-11-05 17:01:17"
     * - 英文格式: "Nov 5, 2025, 5:01:17 PM"
     * - 其他标准 Date 可解析格式
     */
    parseTimeString(timeStr) {
      if (!timeStr) return null;
      
      if (timeStr instanceof Date) {
        return timeStr;
      }
      
      // 先尝试直接解析
      let date = new Date(timeStr);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // 处理 "Nov 5, 2025, 5:01:17 PM" 格式
      // 匹配格式: "Nov 5, 2025, 5:01:17 PM" 或 "Nov 5, 2025, 5:01:17 PM"
      const englishFormat = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i;
      const match = timeStr.match(englishFormat);
      
      if (match) {
        const monthNames = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const month = monthNames[match[1]];
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        let hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const second = parseInt(match[6], 10);
        const ampm = match[7].toUpperCase();
        
        // 转换 12 小时制到 24 小时制
        if (ampm === 'PM' && hour !== 12) {
          hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
        
        // 创建日期对象（使用 UTC，然后转换为本地时间）
        date = new Date(year, month, day, hour, minute, second);
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // 尝试其他标准化处理
      const normalized = timeStr.replace(/,\s*(\d{1,2}:\d{2}:\d{2})/, ' $1');
      date = new Date(normalized);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      console.warn('无法解析时间字符串:', timeStr);
      return null;
    },
    
    /**
     * 格式化访问时间
     */
    formatVisitTime(timeStr) {
      if (!timeStr) return '';
      const date = this.parseTimeString(timeStr);
      if (!date) return timeStr;
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `${month}-${day} ${hour}:${minute.toString().padStart(2, '0')}`;
    },
    
    /**
     * 格式化轨迹点日期
     */
    formatPointDate(point) {
      if (point.visit_time || point.visitTime) {
        const date = this.parseTimeString(point.visit_time || point.visitTime);
        if (!date) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
      return point.date || '未知日期';
    },
    
    /**
     * 格式化停留时长
     */
    formatDuration(minutes) {
      if (!minutes) return '';
      if (minutes < 60) {
        return `${minutes}分钟`;
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
      } else {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
      }
    }
  }
};
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #FFFAF4;
  padding-bottom: 40rpx;
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
.navbar-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  cursor: pointer;
}
.navbar-back:active {
  opacity: 0.6;
}
.back-icon {
  font-size: 36rpx;
  color: #4A4A4A;
  font-weight: 600;
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
.navbar-placeholder {
  width: 60rpx;
}

/* 内容区域 */
.content-area {
  padding: 30rpx 24rpx;
}

/* 卡片通用样式 - glass-card风格 */
.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-header {
  padding: 32rpx 30rpx 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.card-body {
  padding: 0 30rpx 32rpx;
}

/* 时间选择卡片 */
.date-card {
  padding: 0;
}
.date-range-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding: 0 30rpx;
}
.date-item-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  align-items: center;
}
.date-label-text {
  font-size: 24rpx;
  color: #666;
  padding-left: 0;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.date-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 24rpx 20rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.04), inset 0 0 0 1rpx rgba(255,255,255,0.5);
  cursor: pointer;
}
.date-item:active {
  transform: scale(0.98);
}
.date-value {
  font-size: 28rpx;
  color: #4A4A4A;
  font-weight: 500;
  flex: none;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.date-value.placeholder {
  color: #999;
}
.date-icon {
  font-size: 28rpx;
  margin-left: 0;
}
.date-arrow {
  padding-bottom: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-icon {
  font-size: 32rpx;
  color: #666;
  font-weight: 600;
}
.date-actions {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx;
  padding-bottom: 32rpx;
  align-items: center;
  justify-content: center;
}
.btn-query {
  flex: 1;
  max-width: 240rpx;
  padding: 12rpx 20rpx;
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  color: #ffffff;
  border-radius: 40rpx;
  font-size: 22rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 6rpx 18rpx rgba(255, 158, 188, 0.3);
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn-query:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(255, 158, 188, 0.2);
}
.btn-query:disabled {
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}
.btn-query.loading {
  opacity: 0.7;
}
.btn-clear {
  padding: 18rpx 32rpx;
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  color: #ffffff;
  border-radius: 14rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 6rpx 18rpx rgba(255, 158, 188, 0.3);
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn-clear:active {
  transform: scale(0.98);
}
.btn-text {
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

/* 统计信息卡片 */
.stats-card {
  padding: 32rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
}
.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}
.stats-icon {
  font-size: 40rpx;
}
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  align-items: center;
  text-align: center;
}
.stats-label {
  font-size: 24rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.stats-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #FF6B6B;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.stats-value-small {
  font-size: 26rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background: #F0F0F0;
}

/* 地图容器 */
.map-container {
  position: relative;
  height: 700rpx;
  padding: 0;
  overflow: hidden;
}
.map {
  width: 100%;
  height: 100%;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 250, 244, 0.95);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  z-index: 10;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}
.empty-text {
  font-size: 30rpx;
  color: #4A4A4A;
  margin-bottom: 12rpx;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.empty-hint {
  font-size: 26rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 250, 244, 0.95);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  z-index: 10;
}
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #FF6B6B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: 26rpx;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}
.modal {
  width: 86%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15), inset 0 0 0 2rpx rgba(255,255,255,0.5);
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
}
.modal-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #4A4A4A;
  display: block;
  margin-bottom: 12rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.modal-date {
  font-size: 26rpx;
  color: #666;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.modal-content {
  margin-bottom: 24rpx;
}
.point-address {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 12rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.04), inset 0 0 0 1rpx rgba(255,255,255,0.5);
}
.address-label {
  font-size: 28rpx;
}
.address-text {
  font-size: 28rpx;
  color: #4A4A4A;
  flex: 1;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.point-image {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  object-fit: cover;
}
.point-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  margin-top: 16rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.point-meta {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.meta-text {
  font-size: 26rpx;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
}
.btn {
  padding: 18rpx 36rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn.secondary {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFD700 100%);
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.4);
  transition: all 0.2s ease;
}
.btn.secondary:active {
  transform: scale(0.98);
}
</style>

