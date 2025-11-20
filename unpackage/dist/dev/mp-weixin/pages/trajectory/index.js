"use strict";
const common_vendor = require("../../common/vendor.js");
const api_trajectory = require("../../api/trajectory.js");
const common_assets = require("../../common/assets.js");
const CustomTabbar = () => "../../components/custom-tabbar/index.js";
const _sfc_main = {
  components: {
    CustomTabbar
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      trajectoryPoints: [],
      // 静态轨迹点（已废弃，保留兼容性）
      showDetail: false,
      currentPoint: {},
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
      mapPolyline: []
      // 地图路线
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + "rpx";
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
    /**
     * 跳转到历史轨迹页面
     */
    goToHistoryPage() {
      common_vendor.index.navigateTo({
        url: "/subPackages/record/pages/trajectory/history"
      });
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
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:264", "初始化定位失败:", error);
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
          common_vendor.index.__f__("log", "at pages/trajectory/index.vue:365", "位置上传成功");
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/trajectory/index.vue:367", "位置上传失败:", error);
          if (error.message && error.message.includes("用户不存在")) {
            common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:370", "⚠️ 位置上传失败：用户信息已失效，请重新登录");
          }
        }
        try {
          await this.loadCurrentLocations();
        } catch (error) {
          if (error.message && error.message.includes("用户不存在")) {
            common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:383", "⚠️ 加载双方位置失败：用户信息已失效");
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:388", "获取位置失败:", error);
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
        const isSuccess = (res == null ? void 0 : res.success) === true || (res == null ? void 0 : res.code) === 200 || (res == null ? void 0 : res.status) === 0;
        const responseData = (res == null ? void 0 : res.data) || (res == null ? void 0 : res.result) || null;
        if (!isSuccess || !responseData) {
          common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:413", "⚠️ 双方位置接口返回数据格式不符合预期", res);
          return;
        }
        const normalizeLocation = (locationData = {}) => {
          if (!locationData || !locationData.latitude && !locationData.longitude) {
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
            updateTime: locationData.update_time || locationData.updatedAt || locationData.updateTime || locationData.createdAt || locationData.timestamp || /* @__PURE__ */ new Date()
          };
        };
        const myLocationData = responseData.myLocation || responseData.my_location || responseData.self || responseData.mine;
        const partnerLocationData = responseData.partnerLocation || responseData.partner_location || responseData.partner || responseData.lover;
        const distanceText = responseData.distance_text || responseData.distanceText || responseData.distanceFormatted;
        const normalizedMyLocation = normalizeLocation(myLocationData);
        if (normalizedMyLocation) {
          this.myLocation = normalizedMyLocation;
          if (!this.myLocation.address && !this.myLocation.location_name) {
            await this.reverseGeocode(this.myLocation.latitude, this.myLocation.longitude, "my");
          }
        }
        const normalizedPartnerLocation = normalizeLocation(partnerLocationData);
        if (normalizedPartnerLocation) {
          this.partnerLocation = normalizedPartnerLocation;
          if (!this.partnerLocation.address && !this.partnerLocation.location_name) {
            await this.reverseGeocode(this.partnerLocation.latitude, this.partnerLocation.longitude, "partner");
          }
        } else {
          this.partnerLocation = null;
        }
        let distance = responseData.distance;
        if ((distance === null || distance === void 0) && typeof responseData.distanceMeters === "number") {
          distance = responseData.distanceMeters / 1e3;
        }
        this.distance = distance;
        if ((this.distance === null || this.distance === void 0) && this.myLocation && this.partnerLocation) {
          this.distance = this.calculateDistance(
            this.myLocation.latitude,
            this.myLocation.longitude,
            this.partnerLocation.latitude,
            this.partnerLocation.longitude
          );
        }
        common_vendor.index.__f__("log", "at pages/trajectory/index.vue:475", "双方位置加载成功", {
          myLocation: this.myLocation,
          partnerLocation: this.partnerLocation,
          distance: distanceText || this.formatDistance(this.distance),
          rawData: responseData
        });
        this.updateMap();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:485", "加载双方位置失败:", error);
        if (error.message && error.message.includes("用户不存在")) {
          common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:488", "⚠️ 加载双方位置失败：用户信息已失效");
          return;
        }
        {
          common_vendor.index.__f__("warn", "at pages/trajectory/index.vue:495", "⚠️ 后端接口可能未实现，跳过加载双方位置");
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
          address: "定位中…",
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
        common_vendor.index.__f__("error", "at pages/trajectory/index.vue:661", "地址反解析失败:", error);
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
      common_vendor.index.__f__("log", "at pages/trajectory/index.vue:798", "地图点击:", e);
    },
    /**
     * 地图标记点点击事件
     */
    onMarkerTap(e) {
      common_vendor.index.__f__("log", "at pages/trajectory/index.vue:805", "标记点点击:", e);
    },
    /**
     * 格式化轨迹点日期
     */
    formatPointDate(point) {
      if (point.visit_time || point.visitTime) {
        const date = new Date(point.visit_time || point.visitTime);
        if (isNaN(date.getTime()))
          return "";
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
if (!Array) {
  const _component_custom_tabbar = common_vendor.resolveComponent("custom-tabbar");
  _component_custom_tabbar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: $data.myLocation || $data.partnerLocation
  }, $data.myLocation || $data.partnerLocation ? common_vendor.e({
    d: common_vendor.o((...args) => $options.refreshLocation && $options.refreshLocation(...args)),
    e: common_vendor.t($data.isLocationTracking ? "追踪中" : "开启追踪"),
    f: $data.isLocationTracking ? 1 : "",
    g: common_vendor.o((...args) => $options.toggleLocationTracking && $options.toggleLocationTracking(...args)),
    h: $data.myLocation
  }, $data.myLocation ? common_vendor.e({
    i: common_vendor.t($data.myLocation.address || $data.myLocation.location_name || "定位中..."),
    j: $data.myLocation.updateTime
  }, $data.myLocation.updateTime ? {
    k: common_vendor.t($options.formatTime($data.myLocation.updateTime))
  } : {}) : {}, {
    l: $data.partnerLocation
  }, $data.partnerLocation ? common_vendor.e({
    m: common_vendor.t($data.partnerLocation.address || $data.partnerLocation.location_name || "定位中..."),
    n: $data.partnerLocation.updateTime
  }, $data.partnerLocation.updateTime ? {
    o: common_vendor.t($options.formatTime($data.partnerLocation.updateTime))
  } : {}) : {}, {
    p: $data.distance !== null
  }, $data.distance !== null ? {
    q: common_vendor.t($options.formatDistance($data.distance))
  } : {}, {
    r: $data.locationError
  }, $data.locationError ? {
    s: common_vendor.t($data.locationError)
  } : {}) : {}, {
    t: $data.mapCenter.latitude,
    v: $data.mapCenter.longitude,
    w: $data.mapScale,
    x: $data.mapMarkers,
    y: $data.mapPolyline,
    z: common_vendor.o((...args) => $options.onMapTap && $options.onMapTap(...args)),
    A: common_vendor.o((...args) => $options.onMarkerTap && $options.onMarkerTap(...args)),
    B: !$data.myLocation && !$data.partnerLocation
  }, !$data.myLocation && !$data.partnerLocation ? common_vendor.e({
    C: common_assets._imports_0$1,
    D: common_vendor.f($data.trajectoryPoints, (point, index, i0) => {
      return {
        a: common_vendor.t(point.title),
        b: index,
        c: point.top + "%",
        d: point.left + "%",
        e: common_vendor.o(($event) => $options.showPointDetail(point), index)
      };
    }),
    E: $data.trajectoryPoints.length > 1
  }, $data.trajectoryPoints.length > 1 ? {} : {}) : {}, {
    F: $data.showDetail
  }, $data.showDetail ? common_vendor.e({
    G: common_vendor.t($data.currentPoint.location_name || $data.currentPoint.locationName || $data.currentPoint.title || "未知地点"),
    H: common_vendor.t($options.formatPointDate($data.currentPoint)),
    I: $data.currentPoint.address
  }, $data.currentPoint.address ? {
    J: common_vendor.t($data.currentPoint.address)
  } : {}, {
    K: $data.currentPoint.photos && $data.currentPoint.photos.length > 0
  }, $data.currentPoint.photos && $data.currentPoint.photos.length > 0 ? {
    L: $data.currentPoint.photos[0]
  } : $data.currentPoint.image ? {
    N: $data.currentPoint.image
  } : {}, {
    M: $data.currentPoint.image,
    O: common_vendor.t($data.currentPoint.description || "暂无描述"),
    P: $data.currentPoint.visit_count
  }, $data.currentPoint.visit_count ? common_vendor.e({
    Q: common_vendor.t($data.currentPoint.visit_count),
    R: $data.currentPoint.stay_duration
  }, $data.currentPoint.stay_duration ? {
    S: common_vendor.t($options.formatDuration($data.currentPoint.stay_duration))
  } : {}) : {}, {
    T: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args)),
    U: common_vendor.o(() => {
    }),
    V: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args))
  }) : {}, {
    W: common_vendor.o((...args) => $options.goToHistoryPage && $options.goToHistoryPage(...args)),
    X: common_vendor.p({
      current: 1
    }),
    Y: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-bfa9c4cc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trajectory/index.js.map
