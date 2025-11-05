"use strict";
const common_vendor = require("../../common/vendor.js");
const api_trajectory = require("../../api/trajectory.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      trajectoryPoints: [],
      // 静态轨迹点（已废弃，保留兼容性）
      showDetail: false,
      currentPoint: {},
      // 历史轨迹相关
      startDate: "",
      // 开始日期
      endDate: "",
      // 结束日期
      historyPoints: [],
      // 历史轨迹点列表
      historySummary: null,
      // 历史轨迹统计信息
      isLoadingHistory: false,
      // 是否正在加载历史轨迹
      // 定位相关
      isLocationTracking: false,
      // 是否开启定位追踪
      locationTimer: null,
      // 定时器ID
      myLocation: null,
      // 我的位置
      partnerLocation: null,
      // 对方位置
      distance: null,
      // 双方距离（公里）
      isRequestingLocation: false,
      // 是否正在请求位置
      locationError: null,
      // 定位错误信息
      // 地图相关
      mapCenter: {
        latitude: 39.9042,
        // 默认北京
        longitude: 116.4074
      },
      mapScale: 13,
      // 地图缩放级别
      mapMarkers: [],
      // 地图标记点
      mapPolyline: [],
      // 地图路线
      showHistoryMode: false
      // 是否显示历史轨迹模式
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
    },
    // 开始日期选择器的最小日期
    startDateMin() {
      return "2020-01-01";
    },
    // 开始日期选择器的最大日期
    startDateMax() {
      return this.endDate || this.formatDate(/* @__PURE__ */ new Date());
    },
    // 结束日期选择器的最小日期
    endDateMin() {
      return this.startDate || "2020-01-01";
    },
    // 结束日期选择器的最大日期
    endDateMax() {
      return this.formatDate(/* @__PURE__ */ new Date());
    }
  },
  watch: {
    // 监听位置变化，更新地图
    myLocation: {
      handler() {
        if (!this.showHistoryMode) {
          this.updateMap();
        }
      },
      deep: true
    },
    partnerLocation: {
      handler() {
        if (!this.showHistoryMode) {
          this.updateMap();
        }
      },
      deep: true
    },
    // 监听历史轨迹点变化，更新地图
    historyPoints: {
      handler() {
        if (this.showHistoryMode && this.historyPoints.length > 0) {
          this.updateHistoryMap();
        }
      },
      deep: true
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.initLocation();
  },
  onUnload() {
    this.stopLocationTracking();
  },
  methods: {
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
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
    // ========== 定位相关方法 ==========
    /**
     * 初始化定位功能
     */
    async initLocation() {
      try {
        const setting = await this.checkLocationPermission();
        if (setting) {
          await this.getCurrentLocation();
          await this.loadCurrentLocations();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:311", "初始化定位失败:", error);
      }
    },
    /**
     * 检查定位权限
     */
    checkLocationPermission() {
      return new Promise((resolve) => {
        common_vendor.index.getSetting({
          success: (res) => {
            if (res.authSetting["scope.userLocation"]) {
              resolve(true);
            } else if (res.authSetting["scope.userLocation"] === false) {
              common_vendor.index.showModal({
                title: "需要定位权限",
                content: "为了展示双方位置，需要获取您的位置信息。请在设置中开启定位权限。",
                showCancel: true,
                confirmText: "去设置",
                cancelText: "取消",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    common_vendor.index.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting["scope.userLocation"]) {
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
              common_vendor.index.authorize({
                scope: "scope.userLocation",
                success: () => {
                  resolve(true);
                },
                fail: () => {
                  common_vendor.index.showToast({
                    title: "需要定位权限才能使用此功能",
                    icon: "none",
                    duration: 2e3
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
        const locationRes = await new Promise((resolve, reject) => {
          common_vendor.index.getLocation({
            type: "gcj02",
            // 腾讯地图坐标系
            altitude: false,
            success: resolve,
            fail: reject
          });
        });
        const { latitude, longitude } = locationRes;
        this.myLocation = {
          latitude,
          longitude,
          updateTime: /* @__PURE__ */ new Date()
        };
        try {
          await api_trajectory.updateLocation({
            latitude,
            longitude
          });
          common_vendor.index.__f__("log", "at pages/trajectory/index.vue:412", "位置上传成功");
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/trajectory/index.vue:414", "位置上传失败:", error);
          if (error.message && error.message.includes("用户不存在")) {
            common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:417", "⚠️ 位置上传失败：用户信息已失效，请重新登录");
          }
        }
        try {
          await this.loadCurrentLocations();
        } catch (error) {
          if (error.message && error.message.includes("用户不存在")) {
            common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:430", "⚠️ 加载双方位置失败：用户信息已失效");
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:435", "获取位置失败:", error);
        this.locationError = error.errMsg || "获取位置失败";
        if (error.errMsg && error.errMsg.includes("auth deny")) {
          common_vendor.index.showToast({
            title: "定位权限被拒绝",
            icon: "none",
            duration: 2e3
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
        const res = await api_trajectory.getCurrentLocations();
        if (res.success && res.data) {
          const myLocationData = res.data.myLocation || res.data.my_location;
          const partnerLocationData = res.data.partnerLocation || res.data.partner_location;
          const distance = res.data.distance;
          const distanceText = res.data.distance_text || res.data.distanceText;
          if (myLocationData) {
            this.myLocation = {
              latitude: myLocationData.latitude,
              longitude: myLocationData.longitude,
              address: myLocationData.address || myLocationData.description || null,
              location_name: myLocationData.location_name || myLocationData.locationName || null,
              updateTime: myLocationData.update_time || myLocationData.updatedAt || myLocationData.createdAt || /* @__PURE__ */ new Date()
            };
            if (!this.myLocation.address && !this.myLocation.location_name) {
              await this.reverseGeocode(this.myLocation.latitude, this.myLocation.longitude, "my");
            }
          }
          if (partnerLocationData) {
            this.partnerLocation = {
              latitude: partnerLocationData.latitude,
              longitude: partnerLocationData.longitude,
              address: partnerLocationData.address || partnerLocationData.description || null,
              location_name: partnerLocationData.location_name || partnerLocationData.locationName || null,
              updateTime: partnerLocationData.update_time || partnerLocationData.updatedAt || partnerLocationData.createdAt || /* @__PURE__ */ new Date()
            };
            if (!this.partnerLocation.address && !this.partnerLocation.location_name) {
              await this.reverseGeocode(this.partnerLocation.latitude, this.partnerLocation.longitude, "partner");
            }
          } else {
            this.partnerLocation = null;
          }
          this.distance = distance;
          if (this.distance === null || this.distance === void 0) {
            if (this.myLocation && this.partnerLocation) {
              this.distance = this.calculateDistance(
                this.myLocation.latitude,
                this.myLocation.longitude,
                this.partnerLocation.latitude,
                this.partnerLocation.longitude
              );
            }
          }
          common_vendor.index.__f__("log", "at pages/trajectory/index.vue:511", "双方位置加载成功", {
            myLocation: this.myLocation,
            partnerLocation: this.partnerLocation,
            distance: distanceText || this.distance,
            rawData: res.data
          });
          this.updateMap();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:522", "加载双方位置失败:", error);
        if (error.message && error.message.includes("用户不存在")) {
          common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:525", "⚠️ 加载双方位置失败：用户信息已失效");
          return;
        }
        {
          common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:532", "⚠️ 后端接口可能未实现，跳过加载双方位置");
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
      this.checkLocationPermission().then((hasPermission) => {
        if (!hasPermission) {
          return;
        }
        this.isLocationTracking = true;
        this.getCurrentLocation();
        this.locationTimer = setInterval(() => {
          this.getCurrentLocation();
        }, 5 * 60 * 1e3);
        common_vendor.index.showToast({
          title: "定位追踪已开启",
          icon: "success",
          duration: 2e3
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
      common_vendor.index.showToast({
        title: "定位追踪已关闭",
        icon: "none",
        duration: 2e3
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
      common_vendor.index.showLoading({ title: "获取位置中..." });
      try {
        await this.getCurrentLocation();
        common_vendor.index.showToast({
          title: "位置已更新",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.showToast({
          title: "获取位置失败",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    /**
     * 格式化时间
     */
    formatTime(time) {
      if (!time)
        return "";
      const date = new Date(time);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 6e4);
      if (minutes < 1) {
        return "刚刚";
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
        return `${month}-${day} ${hour}:${minute.toString().padStart(2, "0")}`;
      }
    },
    /**
     * 格式化距离
     */
    formatDistance(distance) {
      if (distance === null || distance === void 0) {
        return "--";
      }
      if (distance < 1) {
        const meters = Math.round(distance * 1e3);
        return `${meters}米`;
      } else if (distance < 100) {
        return `${distance.toFixed(1)}公里`;
      } else {
        return `${Math.round(distance)}公里`;
      }
    },
    /**
     * 根据经纬度反解析地址（使用腾讯地图API）
     */
    async reverseGeocode(latitude, longitude, type = "my") {
      try {
        const location = {
          latitude,
          longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          location_name: "当前位置"
        };
        if (type === "my" && this.myLocation) {
          this.myLocation.address = this.myLocation.address || location.address;
          this.myLocation.location_name = this.myLocation.location_name || location.location_name;
        } else if (type === "partner" && this.partnerLocation) {
          this.partnerLocation.address = this.partnerLocation.address || location.address;
          this.partnerLocation.location_name = this.partnerLocation.location_name || location.location_name;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:698", "地址反解析失败:", error);
      }
    },
    /**
     * 计算两点间距离（使用Haversine公式，单位：公里）
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    },
    /**
     * 更新地图显示
     */
    updateMap() {
      const markers = [];
      if (this.myLocation && this.myLocation.latitude && this.myLocation.longitude) {
        const marker = {
          id: 1,
          latitude: this.myLocation.latitude,
          longitude: this.myLocation.longitude,
          width: 30,
          height: 30,
          title: "我的位置",
          callout: {
            content: this.myLocation.address || this.myLocation.location_name || "我的位置",
            color: "#333",
            fontSize: 12,
            borderRadius: 4,
            bgColor: "#fff",
            padding: 8,
            display: "BYCLICK"
          }
        };
        markers.push(marker);
      }
      if (this.partnerLocation && this.partnerLocation.latitude && this.partnerLocation.longitude) {
        const marker = {
          id: 2,
          latitude: this.partnerLocation.latitude,
          longitude: this.partnerLocation.longitude,
          width: 30,
          height: 30,
          title: "对方位置",
          callout: {
            content: this.partnerLocation.address || this.partnerLocation.location_name || "对方位置",
            color: "#333",
            fontSize: 12,
            borderRadius: 4,
            bgColor: "#fff",
            padding: 8,
            display: "BYCLICK"
          }
        };
        markers.push(marker);
      }
      this.mapMarkers = markers;
      if (markers.length > 0) {
        if (markers.length === 1) {
          this.mapCenter = {
            latitude: markers[0].latitude,
            longitude: markers[0].longitude
          };
          this.mapScale = 15;
        } else {
          const avgLat = (markers[0].latitude + markers[1].latitude) / 2;
          const avgLon = (markers[0].longitude + markers[1].longitude) / 2;
          this.mapCenter = {
            latitude: avgLat,
            longitude: avgLon
          };
          const dist = this.calculateDistance(
            markers[0].latitude,
            markers[0].longitude,
            markers[1].latitude,
            markers[1].longitude
          );
          if (dist < 1) {
            this.mapScale = 16;
          } else if (dist < 10) {
            this.mapScale = 14;
          } else if (dist < 100) {
            this.mapScale = 12;
          } else {
            this.mapScale = 10;
          }
          this.mapPolyline = [{
            points: [
              { latitude: markers[0].latitude, longitude: markers[0].longitude },
              { latitude: markers[1].latitude, longitude: markers[1].longitude }
            ],
            color: "#FF69B4",
            width: 3,
            borderColor: "#fff",
            borderWidth: 1,
            arrowLine: true
          }];
        }
      } else {
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
      common_vendor.index.__f__("log", "at pages/trajectory/index.vue:835", "地图点击:", e);
      if (this.showHistoryMode && e.detail && e.detail.markerId) {
        const markerId = e.detail.markerId;
        const marker = this.mapMarkers.find((m) => m.id === markerId);
        if (marker && marker.pointData) {
          this.showPointDetail(marker.pointData);
        }
      }
    },
    // ========== 历史轨迹相关方法 ==========
    /**
     * 开始日期改变
     */
    onStartDateChange(e) {
      const selectedDate = e.detail.value;
      if (this.endDate && selectedDate > this.endDate) {
        common_vendor.index.showToast({
          title: "开始日期不能晚于结束日期",
          icon: "none"
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
        common_vendor.index.showToast({
          title: "结束日期不能早于开始日期",
          icon: "none"
        });
        return;
      }
      this.endDate = selectedDate;
    },
    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
      if (typeof date === "string") {
        return date;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    /**
     * 加载历史轨迹点
     */
    async loadHistoryTrajectory() {
      if (!this.startDate || !this.endDate) {
        common_vendor.index.showToast({
          title: "请选择时间区间",
          icon: "none"
        });
        return;
      }
      if (this.startDate > this.endDate) {
        common_vendor.index.showToast({
          title: "开始日期不能晚于结束日期",
          icon: "none"
        });
        return;
      }
      this.isLoadingHistory = true;
      try {
        const res = await api_trajectory.getTrajectoryPoints({
          start_date: this.startDate,
          end_date: this.endDate,
          limit: 1e3
          // 获取更多轨迹点
        });
        if (res.success && res.data) {
          this.historyPoints = res.data.points || [];
          this.historySummary = res.data.summary || null;
          this.showHistoryMode = true;
          if (this.historyPoints.length > 0) {
            this.updateHistoryMap();
            common_vendor.index.showToast({
              title: `加载了 ${this.historyPoints.length} 个轨迹点`,
              icon: "success",
              duration: 2e3
            });
          } else {
            common_vendor.index.showToast({
              title: "该时间段内没有轨迹点",
              icon: "none"
            });
            this.showHistoryMode = false;
          }
        } else {
          throw new Error(res.message || "加载失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:945", "加载历史轨迹失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载历史轨迹失败",
          icon: "none",
          duration: 2e3
        });
        this.showHistoryMode = false;
      } finally {
        this.isLoadingHistory = false;
      }
    },
    /**
     * 清除历史轨迹
     */
    clearHistory() {
      this.historyPoints = [];
      this.historySummary = null;
      this.showHistoryMode = false;
      this.startDate = "";
      this.endDate = "";
      this.updateMap();
    },
    /**
     * 更新历史轨迹地图显示
     */
    updateHistoryMap() {
      if (this.historyPoints.length === 0) {
        return;
      }
      const sortedPoints = [...this.historyPoints].sort((a, b) => {
        const timeA = new Date(a.visit_time || a.visitTime || 0).getTime();
        const timeB = new Date(b.visit_time || b.visitTime || 0).getTime();
        return timeA - timeB;
      });
      const markers = sortedPoints.map((point, index) => {
        const latitude = point.latitude;
        const longitude = point.longitude;
        const locationName = point.location_name || point.locationName || point.address || "未知地点";
        const visitTime = point.visit_time || point.visitTime;
        return {
          id: index + 100,
          // 使用100+避免与实时位置标记冲突
          latitude,
          longitude,
          width: 30,
          height: 30,
          title: locationName,
          callout: {
            content: `${locationName}
${this.formatVisitTime(visitTime)}`,
            color: "#333",
            fontSize: 12,
            borderRadius: 4,
            bgColor: "#fff",
            padding: 8,
            display: "BYCLICK"
          },
          // 添加点击事件数据
          pointData: point
        };
      });
      this.mapMarkers = markers;
      if (markers.length > 0) {
        const latitudes = markers.map((m) => m.latitude);
        const longitudes = markers.map((m) => m.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        this.mapCenter = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2
        };
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
        if (sortedPoints.length > 1) {
          const points = sortedPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude
          }));
          this.mapPolyline = [{
            points,
            color: "#2bad81",
            width: 4,
            borderColor: "#fff",
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
     * 格式化访问时间
     */
    formatVisitTime(timeStr) {
      if (!timeStr)
        return "";
      const date = new Date(timeStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `${month}-${day} ${hour}:${minute.toString().padStart(2, "0")}`;
    },
    /**
     * 格式化轨迹点日期
     */
    formatPointDate(point) {
      if (point.visit_time || point.visitTime) {
        const date = new Date(point.visit_time || point.visitTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
      return point.date || "未知日期";
    },
    /**
     * 格式化停留时长
     */
    formatDuration(minutes) {
      if (!minutes)
        return "";
      if (minutes < 60) {
        return `${minutes}分钟`;
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
      } else {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor(minutes % 1440 / 60);
        return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: common_vendor.t($data.startDate || "请选择"),
    d: !$data.startDate ? 1 : "",
    e: $data.startDate,
    f: $options.startDateMin,
    g: $options.startDateMax,
    h: common_vendor.o((...args) => $options.onStartDateChange && $options.onStartDateChange(...args)),
    i: common_vendor.t($data.endDate || "请选择"),
    j: !$data.endDate ? 1 : "",
    k: $data.endDate,
    l: $options.endDateMin,
    m: $options.endDateMax,
    n: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args)),
    o: common_vendor.t($data.isLoadingHistory ? "加载中..." : "查询轨迹"),
    p: common_vendor.o((...args) => $options.loadHistoryTrajectory && $options.loadHistoryTrajectory(...args)),
    q: !$data.startDate || !$data.endDate || $data.isLoadingHistory,
    r: $data.historyPoints.length > 0
  }, $data.historyPoints.length > 0 ? {
    s: common_vendor.o((...args) => $options.clearHistory && $options.clearHistory(...args))
  } : {}, {
    t: $data.historySummary
  }, $data.historySummary ? {
    v: common_vendor.t($data.historySummary.total_points || 0),
    w: common_vendor.t($options.formatDistance($data.historySummary.total_distance || 0))
  } : {}, {
    x: $data.myLocation || $data.partnerLocation
  }, $data.myLocation || $data.partnerLocation ? common_vendor.e({
    y: common_vendor.o((...args) => $options.refreshLocation && $options.refreshLocation(...args)),
    z: common_vendor.t($data.isLocationTracking ? "追踪中" : "开启追踪"),
    A: $data.isLocationTracking ? 1 : "",
    B: common_vendor.o((...args) => $options.toggleLocationTracking && $options.toggleLocationTracking(...args)),
    C: $data.myLocation
  }, $data.myLocation ? common_vendor.e({
    D: common_vendor.t($data.myLocation.address || $data.myLocation.location_name || "定位中..."),
    E: $data.myLocation.updateTime
  }, $data.myLocation.updateTime ? {
    F: common_vendor.t($options.formatTime($data.myLocation.updateTime))
  } : {}) : {}, {
    G: $data.partnerLocation
  }, $data.partnerLocation ? common_vendor.e({
    H: common_vendor.t($data.partnerLocation.address || $data.partnerLocation.location_name || "定位中..."),
    I: $data.partnerLocation.updateTime
  }, $data.partnerLocation.updateTime ? {
    J: common_vendor.t($options.formatTime($data.partnerLocation.updateTime))
  } : {}) : {}, {
    K: $data.distance !== null
  }, $data.distance !== null ? {
    L: common_vendor.t($options.formatDistance($data.distance))
  } : {}, {
    M: $data.locationError
  }, $data.locationError ? {
    N: common_vendor.t($data.locationError)
  } : {}) : {}, {
    O: $data.mapCenter.latitude,
    P: $data.mapCenter.longitude,
    Q: $data.mapScale,
    R: $data.mapMarkers,
    S: $data.mapPolyline,
    T: common_vendor.o((...args) => $options.onMapTap && $options.onMapTap(...args)),
    U: !$data.myLocation && !$data.partnerLocation
  }, !$data.myLocation && !$data.partnerLocation ? common_vendor.e({
    V: common_assets._imports_0$5,
    W: common_vendor.f($data.trajectoryPoints, (point, index, i0) => {
      return {
        a: common_vendor.t(point.title),
        b: index,
        c: point.top + "%",
        d: point.left + "%",
        e: common_vendor.o(($event) => $options.showPointDetail(point), index)
      };
    }),
    X: $data.trajectoryPoints.length > 1
  }, $data.trajectoryPoints.length > 1 ? {} : {}) : {}, {
    Y: $data.showDetail
  }, $data.showDetail ? common_vendor.e({
    Z: common_vendor.t($data.currentPoint.location_name || $data.currentPoint.locationName || $data.currentPoint.title || "未知地点"),
    aa: common_vendor.t($options.formatPointDate($data.currentPoint)),
    ab: $data.currentPoint.address
  }, $data.currentPoint.address ? {
    ac: common_vendor.t($data.currentPoint.address)
  } : {}, {
    ad: $data.currentPoint.photos && $data.currentPoint.photos.length > 0
  }, $data.currentPoint.photos && $data.currentPoint.photos.length > 0 ? {
    ae: $data.currentPoint.photos[0]
  } : $data.currentPoint.image ? {
    ag: $data.currentPoint.image
  } : {}, {
    af: $data.currentPoint.image,
    ah: common_vendor.t($data.currentPoint.description || "暂无描述"),
    ai: $data.currentPoint.visit_count
  }, $data.currentPoint.visit_count ? common_vendor.e({
    aj: common_vendor.t($data.currentPoint.visit_count),
    ak: $data.currentPoint.stay_duration
  }, $data.currentPoint.stay_duration ? {
    al: common_vendor.t($options.formatDuration($data.currentPoint.stay_duration))
  } : {}) : {}, {
    am: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args)),
    an: common_vendor.o(() => {
    }),
    ao: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args))
  }) : {}, {
    ap: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bfa9c4cc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trajectory/index.js.map
