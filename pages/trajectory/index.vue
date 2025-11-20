<template>
  <view class="trajectory-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-title">
          <text class="title-text">恋爱轨迹</text>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
    <view class="header">
      <text class="subtitle">记录你们一起走过的点点滴滴</text>
    </view>

      <!-- 实时位置卡片 -->
      <view class="location-card" v-if="myLocation || partnerLocation">
        <view class="location-card-header">
          <text class="location-title">实时位置</text>
          <view class="location-actions">
            <view class="refresh-btn" @click="refreshLocation">
              <text class="refresh-icon">🔄</text>
            </view>
            <view class="toggle-btn" :class="{ active: isLocationTracking }" @click="toggleLocationTracking">
              <text class="toggle-text">{{ isLocationTracking ? '追踪中' : '开启追踪' }}</text>
            </view>
          </view>
        </view>
        
        <!-- 我的位置 -->
        <view class="location-item" v-if="myLocation">
          <view class="location-label">
            <text class="location-icon">📍</text>
            <text class="location-name">我的位置</text>
          </view>
          <view class="location-info">
            <text class="location-address">{{ myLocation.address || myLocation.location_name || '定位中...' }}</text>
            <text class="location-time" v-if="myLocation.updateTime">
              {{ formatTime(myLocation.updateTime) }}
            </text>
          </view>
        </view>

        <!-- 对方位置 -->
        <view class="location-item" v-if="partnerLocation">
          <view class="location-label">
            <text class="location-icon">💕</text>
            <text class="location-name">对方位置</text>
          </view>
          <view class="location-info">
            <text class="location-address">{{ partnerLocation.address || partnerLocation.location_name || '定位中...' }}</text>
            <text class="location-time" v-if="partnerLocation.updateTime">
              {{ formatTime(partnerLocation.updateTime) }}
            </text>
          </view>
        </view>

        <!-- 距离显示 -->
        <view class="distance-info" v-if="distance !== null">
          <text class="distance-label">双方距离</text>
          <text class="distance-value">{{ formatDistance(distance) }}</text>
        </view>

        <!-- 错误提示 -->
        <view class="location-error" v-if="locationError">
          <text class="error-text">{{ locationError }}</text>
        </view>
      </view>

      <!-- 地图容器 -->
    <view class="map-container">
        <!-- 真实地图组件 -->
        <map
          class="map"
          :latitude="mapCenter.latitude"
          :longitude="mapCenter.longitude"
          :scale="mapScale"
          :markers="mapMarkers"
          :polyline="mapPolyline"
          :show-location="true"
          :enable-zoom="true"
          :enable-scroll="true"
          @tap="onMapTap"
          @markertap="onMarkerTap"
        />
        
        <!-- 备用：如果没有位置信息，显示静态地图和轨迹点 -->
        <view v-if="!myLocation && !partnerLocation" class="map-placeholder">
          <image class="map-bg" src="/static/trajectory/map.jpg" mode="aspectFill" />
      
      <!-- 轨迹点 -->
      <view 
        v-for="(point, index) in trajectoryPoints" 
        :key="index"
        class="trajectory-point"
        :style="{ top: point.top + '%', left: point.left + '%' }"
        @click="showPointDetail(point)"
      >
        <view class="point-marker">
          <text class="point-icon">📍</text>
        </view>
        <view class="point-label">{{ point.title }}</view>
      </view>

      <!-- 轨迹连线 -->
          <view v-if="trajectoryPoints.length > 1" class="trajectory-line"></view>
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
          <view v-if="currentPoint.visit_count" class="point-meta">
            <text class="meta-text">到访次数：{{ currentPoint.visit_count }}</text>
            <text v-if="currentPoint.stay_duration" class="meta-text">停留时长：{{ formatDuration(currentPoint.stay_duration) }}</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="hidePointDetail">关闭</button>
        </view>
      </view>
    </view>

    <!-- 历史轨迹浮动按钮 -->
    <view class="history-float-btn" @click="goToHistoryPage">
      <text class="history-btn-icon">📜</text>
      <text class="history-btn-text">历史轨迹</text>
    </view>
    
    <!-- 自定义 TabBar -->
    <custom-tabbar :current="1"></custom-tabbar>
  </view>
</template>

<script>
import { updateLocation, getCurrentLocations } from '@/api/trajectory.js';
import CustomTabbar from '@/components/custom-tabbar/index.vue';

export default {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      trajectoryPoints: [],  // 静态轨迹点（已废弃，保留兼容性）
      showDetail: false,
      currentPoint: {},
      // 定位相关
      isLocationTracking: false,  // 是否开启定位追踪
      locationTimer: null,         // 定时器ID
      myLocation: null,            // 我的位置
      partnerLocation: null,        // 对方位置
      distance: null,               // 双方距离（公里）
      isRequestingLocation: false,  // 是否正在请求位置
      locationError: null,           // 定位错误信息
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
    }
  },
  watch: {
    // 监听位置变化，更新地图
    myLocation: {
      handler() {
        this.updateMap();
      },
      deep: true
    },
    partnerLocation: {
      handler() {
        this.updateMap();
      },
      deep: true
    }
  },
  onLoad() {
    this.getSystemInfo();
    // 检查定位权限并初始化
    this.initLocation();
  },
  onUnload() {
    // 页面卸载时停止定位追踪
    this.stopLocationTracking();
  },
  methods: {
    getSystemInfo() {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 54;
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
     * 跳转到历史轨迹页面
     */
    goToHistoryPage() {
      uni.navigateTo({
        url: '/subPackages/record/pages/trajectory/history'
      });
    },
    
    // ========== 定位相关方法 ==========
    
    /**
     * 初始化定位功能
     */
    async initLocation() {
      try {
        // 检查定位权限
        const setting = await this.checkLocationPermission();
        if (setting) {
          // 首次获取位置
          await this.getCurrentLocation();
          // 加载双方位置
          await this.loadCurrentLocations();
        }
      } catch (error) {
        console.error('初始化定位失败:', error);
      }
    },
    
    /**
     * 检查定位权限
     */
    checkLocationPermission() {
      return new Promise((resolve) => {
        uni.getSetting({
          success: (res) => {
            if (res.authSetting['scope.userLocation']) {
              // 已授权
              resolve(true);
            } else if (res.authSetting['scope.userLocation'] === false) {
              // 已拒绝，提示用户手动开启
              uni.showModal({
                title: '需要定位权限',
                content: '为了展示双方位置，需要获取您的位置信息。请在设置中开启定位权限。',
                showCancel: true,
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    uni.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.userLocation']) {
                          resolve(true);
                        } else {
                          resolve(false);
                        }
                      }
                    });
                  } else {
                    resolve(false);
                  }
                }
              });
            } else {
              // 未授权，请求授权
              uni.authorize({
                scope: 'scope.userLocation',
                success: () => {
                  resolve(true);
                },
                fail: () => {
                  uni.showToast({
                    title: '需要定位权限才能使用此功能',
                    icon: 'none',
                    duration: 2000
                  });
                  resolve(false);
                }
              });
            }
          },
          fail: () => {
            resolve(false);
          }
        });
      });
    },
    
    /**
     * 获取当前位置并上传
     */
    async getCurrentLocation() {
      if (this.isRequestingLocation) {
        return;
      }
      
      this.isRequestingLocation = true;
      this.locationError = null;
      
      try {
        // 获取当前位置
        const locationRes = await new Promise((resolve, reject) => {
          uni.getLocation({
            type: 'gcj02',  // 腾讯地图坐标系
            altitude: false,
            success: resolve,
            fail: reject
          });
        });
        
        const { latitude, longitude } = locationRes;
        
        // 保存我的位置
        this.myLocation = {
          latitude,
          longitude,
          updateTime: new Date()
        };
        
        // 上传到后端
        try {
          await updateLocation({
            latitude,
            longitude
          });
          
          console.log('位置上传成功');
        } catch (error) {
          console.error('位置上传失败:', error);
          // 如果是"用户不存在"错误，提示用户但不要跳转登录
          if (error.message && error.message.includes('用户不存在')) {
            console.warn('⚠️ 位置上传失败：用户信息已失效，请重新登录');
            // 不显示错误提示，避免打扰用户
            // 位置上传失败不影响本地显示和页面使用
          }
          // 上传失败不影响本地显示
        }
        
        // 重新加载双方位置
        try {
          await this.loadCurrentLocations();
        } catch (error) {
          // 加载失败不影响其他功能
          if (error.message && error.message.includes('用户不存在')) {
            console.warn('⚠️ 加载双方位置失败：用户信息已失效');
          }
        }
        
      } catch (error) {
        console.error('获取位置失败:', error); 
        this.locationError = error.errMsg || '获取位置失败';
        
        if (error.errMsg && error.errMsg.includes('auth deny')) {
          uni.showToast({
            title: '定位权限被拒绝',
            icon: 'none',
            duration: 2000
          });
        }
      } finally {
        this.isRequestingLocation = false;
      }
    },
    
    /**
     * 加载双方实时位置
     */
    async loadCurrentLocations() {
      try {
        const res = await getCurrentLocations();
        const isSuccess = res?.success === true || res?.code === 200 || res?.status === 0;
        const responseData = res?.data || res?.result || null;

        if (!isSuccess || !responseData) {
          console.warn('⚠️ 双方位置接口返回数据格式不符合预期', res);
          return;
        }

        const normalizeLocation = (locationData = {}) => {
          if (!locationData || (!locationData.latitude && !locationData.longitude)) {
            return null;
          }
          const latitude = Number(locationData.latitude || locationData.lat || locationData.latitudeDecimal);
          const longitude = Number(locationData.longitude || locationData.lng || locationData.longitudeDecimal);
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
          }
          return {
            latitude,
            longitude,
            address: locationData.address || locationData.description || locationData.detail || null,
            location_name: locationData.location_name || locationData.locationName || locationData.name || null,
            updateTime: locationData.update_time || locationData.updatedAt || locationData.updateTime || locationData.createdAt || locationData.timestamp || new Date()
          };
        };

        // 兼容不同字段命名
        const myLocationData = responseData.myLocation || responseData.my_location || responseData.self || responseData.mine;
        const partnerLocationData = responseData.partnerLocation || responseData.partner_location || responseData.partner || responseData.lover;
        const distanceText = responseData.distance_text || responseData.distanceText || responseData.distanceFormatted;

        // 更新我的位置
        const normalizedMyLocation = normalizeLocation(myLocationData);
        if (normalizedMyLocation) {
          this.myLocation = normalizedMyLocation;
          if (!this.myLocation.address && !this.myLocation.location_name) {
            await this.reverseGeocode(this.myLocation.latitude, this.myLocation.longitude, 'my');
          }
        }

        // 更新对方位置
        const normalizedPartnerLocation = normalizeLocation(partnerLocationData);
        if (normalizedPartnerLocation) {
          this.partnerLocation = normalizedPartnerLocation;
          if (!this.partnerLocation.address && !this.partnerLocation.location_name) {
            await this.reverseGeocode(this.partnerLocation.latitude, this.partnerLocation.longitude, 'partner');
          }
        } else {
          this.partnerLocation = null;
        }

        // 更新距离（默认接口返回公里；如果提供的是米，转换成公里）
        let distance = responseData.distance;
        if ((distance === null || distance === undefined) && typeof responseData.distanceMeters === 'number') {
          distance = responseData.distanceMeters / 1000;
        }
        this.distance = distance;

        // 如果双方都有位置，但后端没有返回距离，前端计算距离
        if ((this.distance === null || this.distance === undefined) && this.myLocation && this.partnerLocation) {
          this.distance = this.calculateDistance(
            this.myLocation.latitude, this.myLocation.longitude,
            this.partnerLocation.latitude, this.partnerLocation.longitude
          );
        }

        console.log('双方位置加载成功', {
          myLocation: this.myLocation,
          partnerLocation: this.partnerLocation,
          distance: distanceText || this.formatDistance(this.distance),
          rawData: responseData
        });

        // 更新地图显示
        this.updateMap();
      } catch (error) {
        console.error('加载双方位置失败:', error);
        // 如果是"用户不存在"错误，优雅处理，不触发全局登录跳转
        if (error.message && error.message.includes('用户不存在')) {
          console.warn('⚠️ 加载双方位置失败：用户信息已失效');
          // 不显示错误提示，避免打扰用户
          // 位置加载失败不影响页面其他功能
          return;
        }
        // 如果后端接口未实现，不显示错误（开发阶段）
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ 后端接口可能未实现，跳过加载双方位置');
        }
      }
    },
    
    /**
     * 开启定位追踪（定时上传位置）
     */
    startLocationTracking() {
      if (this.isLocationTracking) {
        return;
      }
      
      // 检查权限
      this.checkLocationPermission().then((hasPermission) => {
        if (!hasPermission) {
        return;
      }
      
        this.isLocationTracking = true;
        
        // 立即获取一次位置
        this.getCurrentLocation();
        
        // 每5分钟上传一次位置
        this.locationTimer = setInterval(() => {
          this.getCurrentLocation();
        }, 5 * 60 * 1000);  // 5分钟
        
        uni.showToast({
          title: '定位追踪已开启',
          icon: 'success',
          duration: 2000
        });
      });
    },
    
    /**
     * 停止定位追踪
     */
    stopLocationTracking() {
      if (this.locationTimer) {
        clearInterval(this.locationTimer);
        this.locationTimer = null;
      }
      this.isLocationTracking = false;
      
      uni.showToast({
        title: '定位追踪已关闭',
        icon: 'none',
        duration: 2000
      });
    },
    
    /**
     * 切换定位追踪状态
     */
    toggleLocationTracking() {
      if (this.isLocationTracking) {
        this.stopLocationTracking();
      } else {
        this.startLocationTracking();
      }
    },
    
    /**
     * 手动刷新位置
     */
    async refreshLocation() {
      uni.showLoading({ title: '获取位置中...' });
      try {
        await this.getCurrentLocation();
        uni.showToast({
          title: '位置已更新',
          icon: 'success',
          duration: 1500
        });
      } catch (error) {
        uni.showToast({
          title: '获取位置失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    /**
     * 格式化时间
     */
    formatTime(time) {
      if (!time) return '';
      
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) {
        return '刚刚';
      } else if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours}小时前`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        return `${month}-${day} ${hour}:${minute.toString().padStart(2, '0')}`;
      }
    },
    
    /**
     * 格式化距离
     */
    formatDistance(distance) {
      if (distance === null || distance === undefined) {
        return '--';
      }
      
      if (distance < 1) {
        // 小于1公里，显示米
        const meters = Math.round(distance * 1000);
        return `${meters}米`;
      } else if (distance < 100) {
        // 1-100公里，显示公里（保留1位小数）
        return `${distance.toFixed(1)}公里`;
      } else {
        // 大于100公里，显示公里（整数）
        return `${Math.round(distance)}公里`;
      }
    },
    
    /**
     * 根据经纬度反解析地址（使用腾讯地图API）
     */
    async reverseGeocode(latitude, longitude, type = 'my') {
      try {
        // 使用uni.getLocation的反向地理编码功能
        // 注意：uni.getLocation在微信小程序中不支持逆地址解析
        // 这里使用腾讯地图API（需要配置key）
        // 或者使用后端接口进行地址解析
        
        // 临时方案：使用简单的描述
        const location = {
          latitude,
          longitude,
          address: '定位中…',
          location_name: '当前位置'
        };
        
        // 更新位置信息
        if (type === 'my' && this.myLocation) {
          this.myLocation.address = this.myLocation.address || location.address;
          this.myLocation.location_name = this.myLocation.location_name || location.location_name;
        } else if (type === 'partner' && this.partnerLocation) {
          this.partnerLocation.address = this.partnerLocation.address || location.address;
          this.partnerLocation.location_name = this.partnerLocation.location_name || location.location_name;
        }
        
        // TODO: 集成腾讯地图API或后端地址解析接口
        // 如果需要详细地址，可以调用后端接口或第三方地图API
      } catch (error) {
        console.error('地址反解析失败:', error);
      }
    },
    
    /**
     * 计算两点间距离（使用Haversine公式，单位：公里）
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 地球半径（公里）
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    },
    
    /**
     * 更新地图显示
     */
    updateMap() {
      const markers = [];
      
      // 添加我的位置标记
      if (this.myLocation && this.myLocation.latitude && this.myLocation.longitude) {
        const marker = {
          id: 1,
          latitude: this.myLocation.latitude,
          longitude: this.myLocation.longitude,
          width: 30,
          height: 30,
          title: '我的位置',
          callout: {
            content: this.myLocation.address || this.myLocation.location_name || '我的位置',
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'BYCLICK'
          }
        };
        // 如果有自定义图标，使用自定义图标；否则使用默认样式
        // marker.iconPath = '/static/trajectory/my-location.png';
        markers.push(marker);
      }
      
      // 添加对方位置标记
      if (this.partnerLocation && this.partnerLocation.latitude && this.partnerLocation.longitude) {
        const marker = {
          id: 2,
          latitude: this.partnerLocation.latitude,
          longitude: this.partnerLocation.longitude,
          width: 30,
          height: 30,
          title: '对方位置',
          callout: {
            content: this.partnerLocation.address || this.partnerLocation.location_name || '对方位置',
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'BYCLICK'
          }
        };
        // 如果有自定义图标，使用自定义图标；否则使用默认样式
        // marker.iconPath = '/static/trajectory/partner-location.png';
        markers.push(marker);
      }
      
      this.mapMarkers = markers;
      
      // 计算地图中心点
      if (markers.length > 0) {
        if (markers.length === 1) {
          // 只有一个位置，以该位置为中心
          this.mapCenter = {
            latitude: markers[0].latitude,
            longitude: markers[0].longitude
          };
          this.mapScale = 15;
        } else {
          // 两个位置，计算中心点
          const avgLat = (markers[0].latitude + markers[1].latitude) / 2;
          const avgLon = (markers[0].longitude + markers[1].longitude) / 2;
          this.mapCenter = {
            latitude: avgLat,
            longitude: avgLon
          };
          
          // 根据距离调整缩放级别
          const dist = this.calculateDistance(
            markers[0].latitude, markers[0].longitude,
            markers[1].latitude, markers[1].longitude
          );
          if (dist < 1) {
            this.mapScale = 16; // 1公里内，放大
          } else if (dist < 10) {
            this.mapScale = 14; // 10公里内
          } else if (dist < 100) {
            this.mapScale = 12; // 100公里内
          } else {
            this.mapScale = 10; // 更远距离
          }
          
          // 添加连线
          this.mapPolyline = [{
            points: [
              { latitude: markers[0].latitude, longitude: markers[0].longitude },
              { latitude: markers[1].latitude, longitude: markers[1].longitude }
            ],
            color: '#FF69B4',
            width: 3,
            borderColor: '#fff',
            borderWidth: 1,
            arrowLine: true
          }];
        }
      } else {
        // 没有位置信息，使用默认中心点
        this.mapCenter = {
          latitude: 39.9042,
          longitude: 116.4074
        };
        this.mapScale = 13;
        this.mapPolyline = [];
      }
    },
    
    /**
     * 地图点击事件
     */
    onMapTap(e) {
      console.log('地图点击:', e);
    },
    
    /**
     * 地图标记点点击事件
     */
    onMarkerTap(e) {
      console.log('标记点点击:', e);
    },
    
    /**
     * 格式化轨迹点日期
     */
    formatPointDate(point) {
      if (point.visit_time || point.visitTime) {
        const date = new Date(point.visit_time || point.visitTime);
        if (isNaN(date.getTime())) return '';
        
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
.trajectory-page {
  min-height: 100vh;
  background-color: #FFFAF4;
  padding-bottom: 120rpx; /* 为自定义 TabBar 预留空间 */
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
  font-size: 32rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.content-area {
  padding: 30rpx 24rpx;
}
.header {
  padding: 0 0 20rpx 0;
}
.subtitle {
  font-size: 26rpx;
  color: #9B8FB8;
  display: block;
}

/* 实时位置卡片 */
.location-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.location-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.location-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2b2b2b;
}
.location-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.refresh-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  border-radius: 30rpx;
}
.refresh-icon {
  font-size: 28rpx;
}
.toggle-btn {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}
.toggle-btn.active {
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  color: #ffffff;
}
.toggle-text {
  font-size: 24rpx;
}
.location-item {
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.location-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.location-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.location-icon {
  font-size: 28rpx;
}
.location-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}
.location-info {
  margin-left: 40rpx;
}
.location-address {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.location-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}
.distance-info {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.distance-label {
  font-size: 28rpx;
  color: #666;
}
.distance-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #FF9EBC;
}
.location-error {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #fff3cd;
  border-radius: 12rpx;
}
.error-text {
  font-size: 24rpx;
  color: #856404;
}

/* 地图容器 */
.map-container {
  position: relative;
  margin: 20rpx;
  height: 600rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}
.map {
  width: 100%;
  height: 100%;
}
.map-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.map-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 轨迹点 */
.trajectory-point {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}
.point-marker {
  width: 60rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}
.point-icon {
  font-size: 32rpx;
}
.point-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #2b2b2b;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  white-space: nowrap;
}

/* 轨迹连线 */
.trajectory-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.modal {
  width: 86%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(0,0,0,0.15);
}
.modal-header {
  margin-bottom: 24rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2b2b2b;
  display: block;
}
.modal-date {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7a7a7a;
  display: block;
}
.modal-content {
  margin-bottom: 24rpx;
}
.point-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}
.point-description {
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
  margin-top: 16rpx;
}
.point-address {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
  padding: 12rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}
.address-label {
  font-size: 24rpx;
}
.address-text {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}
.point-meta {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.meta-text {
  font-size: 24rpx;
  color: #999;
}

/* 表单样式 */
.form {
  margin-top: 24rpx;
}
.form-item {
  margin-bottom: 24rpx;
}
.label {
  font-size: 26rpx;
  color: #4a4a4a;
  display: block;
  margin-bottom: 8rpx;
}
.input {
  width: 100%;
  border: 1rpx solid #e6e6e6;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 26rpx;
}
.textarea {
  width: 100%;
  border: 1rpx solid #e6e6e6;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 26rpx;
  min-height: 120rpx;
}
.position-info {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #2bad81;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}
.btn {
  padding: 16rpx 26rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
}
.btn.primary {
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  color: #ffffff;
}
.btn.secondary {
  background: #f0f0f0;
  color: #333;
}

/* 历史轨迹浮动按钮 */
.history-float-btn {
  position: fixed;
  right: 30rpx;
  bottom: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #FF9EBC 0%, #D9ACFF 100%);
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 158, 188, 0.3);
  z-index: 999;
  transition: all 0.3s ease;
}

.history-float-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(255, 158, 188, 0.2);
}

.history-btn-icon {
  font-size: 32rpx;
  line-height: 1;
}

.history-btn-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #ffffff;
  line-height: 1;
}
</style>
