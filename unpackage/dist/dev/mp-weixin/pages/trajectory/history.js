"use strict";
const common_vendor = require("../../common/vendor.js");
const api_trajectory = require("../../api/trajectory.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      // 历史轨迹相关
      startDate: "",
      // 开始日期
      endDate: "",
      // 结束日期
      historyPoints: [],
      // 历史轨迹点列表
      isLoadingHistory: false,
      // 是否正在加载历史轨迹
      hasSearched: false,
      // 是否已搜索过
      showDetail: false,
      currentPoint: {},
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
      try {
        const windowInfo = common_vendor.wx$1.getWindowInfo && common_vendor.wx$1.getWindowInfo();
        const deviceInfo = common_vendor.wx$1.getDeviceInfo && common_vendor.wx$1.getDeviceInfo();
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = common_vendor.index.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 54;
    },
    goBack() {
      common_vendor.index.navigateBack();
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
      this.hasSearched = true;
      try {
        const params = this.startDate && this.endDate ? {
          start_date: this.startDate,
          end_date: this.endDate,
          showPartnerOnly: true,
          limit: 1e3
          // 获取更多轨迹点
        } : {
          period: "30days",
          showPartnerOnly: true,
          limit: 1e3
          // 获取更多轨迹点
        };
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:357", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:358", "📅 [历史轨迹查询] 开始查询");
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:359", "选择的日期范围:", this.startDate, "至", this.endDate);
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:360", "请求参数:", JSON.stringify(params, null, 2));
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:361", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        const res = await api_trajectory.getTrajectoryList(params);
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:365", "轨迹点查询响应:", res);
        common_vendor.index.__f__("log", "at pages/trajectory/history.vue:366", "选择的日期范围:", this.startDate, "至", this.endDate);
        if (res.success && res.data) {
          let points = [];
          if (res.data.partnerTrajectories && Array.isArray(res.data.partnerTrajectories)) {
            points = res.data.partnerTrajectories;
          } else if (Array.isArray(res.data)) {
            points = res.data;
          } else if (res.data.points && Array.isArray(res.data.points)) {
            points = res.data.points;
          }
          points = points.map((point) => {
            if (point.visitTime && !point.visit_time) {
              point.visit_time = point.visitTime;
            }
            if (point.visit_time && !point.visitTime) {
              point.visitTime = point.visit_time;
            }
            if (!point.location_name && !point.locationName) {
              point.location_name = point.address || point.description || "未知地点";
              point.locationName = point.location_name;
            } else if (point.locationName && !point.location_name) {
              point.location_name = point.locationName;
            } else if (point.location_name && !point.locationName) {
              point.locationName = point.location_name;
            }
            return point;
          });
          common_vendor.index.__f__("log", "at pages/trajectory/history.vue:408", "解析后的轨迹点数量:", points.length);
          common_vendor.index.__f__("log", "at pages/trajectory/history.vue:409", "轨迹点数据示例:", points[0]);
          if (this.startDate && this.endDate) {
            const startDateObj = /* @__PURE__ */ new Date(this.startDate + " 00:00:00");
            const endDateObj = /* @__PURE__ */ new Date(this.endDate + " 23:59:59");
            const filteredPoints = points.filter((point) => {
              const visitTime = this.parseTimeString(point.visit_time || point.visitTime);
              if (!visitTime)
                return false;
              return visitTime >= startDateObj && visitTime <= endDateObj;
            });
            common_vendor.index.__f__("log", "at pages/trajectory/history.vue:424", `前端时间过滤: 原始 ${points.length} 个点，过滤后 ${filteredPoints.length} 个点`);
            common_vendor.index.__f__("log", "at pages/trajectory/history.vue:425", `时间范围: ${this.startDate} 00:00:00 至 ${this.endDate} 23:59:59`);
            this.historyPoints = filteredPoints;
          } else {
            this.historyPoints = points;
          }
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
            this.mapMarkers = [];
            this.mapPolyline = [];
            this.mapCenter = {
              latitude: 39.9042,
              longitude: 116.4074
            };
            this.mapScale = 13;
          }
        } else {
          throw new Error(res.message || "加载失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trajectory/history.vue:458", "加载历史轨迹失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载历史轨迹失败",
          icon: "none",
          duration: 2e3
        });
        this.historyPoints = [];
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
      this.startDate = "";
      this.endDate = "";
      this.hasSearched = false;
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
      const sortedPoints = [...this.historyPoints].sort((a, b) => {
        const timeA = this.parseTimeString(a.visit_time || a.visitTime);
        const timeB = this.parseTimeString(b.visit_time || b.visitTime);
        if (!timeA && !timeB)
          return 0;
        if (!timeA)
          return 1;
        if (!timeB)
          return -1;
        return timeA.getTime() - timeB.getTime();
      });
      const markers = sortedPoints.map((point, index) => {
        const latitude = point.latitude;
        const longitude = point.longitude;
        const locationName = point.location_name || point.locationName || point.address || "未知地点";
        const visitTime = point.visit_time || point.visitTime;
        return {
          id: index + 100,
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
            color: "#FF6B9D",
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
     * 地图标记点点击事件
     */
    onMarkerTap(e) {
      common_vendor.index.__f__("log", "at pages/trajectory/history.vue:597", "标记点点击:", e);
      if (e.detail) {
        const markerId = e.detail.markerId;
        const marker = this.mapMarkers.find((m) => m.id === markerId);
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
      if (!timeStr)
        return null;
      if (timeStr instanceof Date) {
        return timeStr;
      }
      let date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      const englishFormat = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i;
      const match = timeStr.match(englishFormat);
      if (match) {
        const monthNames = {
          "Jan": 0,
          "Feb": 1,
          "Mar": 2,
          "Apr": 3,
          "May": 4,
          "Jun": 5,
          "Jul": 6,
          "Aug": 7,
          "Sep": 8,
          "Oct": 9,
          "Nov": 10,
          "Dec": 11
        };
        const month = monthNames[match[1]];
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        let hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const second = parseInt(match[6], 10);
        const ampm = match[7].toUpperCase();
        if (ampm === "PM" && hour !== 12) {
          hour += 12;
        } else if (ampm === "AM" && hour === 12) {
          hour = 0;
        }
        date = new Date(year, month, day, hour, minute, second);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      const normalized = timeStr.replace(/,\s*(\d{1,2}:\d{2}:\d{2})/, " $1");
      date = new Date(normalized);
      if (!isNaN(date.getTime())) {
        return date;
      }
      common_vendor.index.__f__("warn", "at pages/trajectory/history.vue:671", "无法解析时间字符串:", timeStr);
      return null;
    },
    /**
     * 格式化访问时间
     */
    formatVisitTime(timeStr) {
      if (!timeStr)
        return "";
      const date = this.parseTimeString(timeStr);
      if (!date)
        return timeStr;
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
        const date = this.parseTimeString(point.visit_time || point.visitTime);
        if (!date)
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
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_vendor.t($data.startDate || "请选择开始日期"),
    e: !$data.startDate ? 1 : "",
    f: $data.startDate,
    g: $options.startDateMin,
    h: $options.startDateMax,
    i: common_vendor.o((...args) => $options.onStartDateChange && $options.onStartDateChange(...args)),
    j: common_vendor.t($data.endDate || "请选择结束日期"),
    k: !$data.endDate ? 1 : "",
    l: $data.endDate,
    m: $options.endDateMin,
    n: $options.endDateMax,
    o: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args)),
    p: !$data.isLoadingHistory
  }, !$data.isLoadingHistory ? {} : {}, {
    q: common_vendor.o((...args) => $options.loadHistoryTrajectory && $options.loadHistoryTrajectory(...args)),
    r: !$data.startDate || !$data.endDate || $data.isLoadingHistory,
    s: $data.isLoadingHistory ? 1 : "",
    t: $data.historyPoints.length > 0
  }, $data.historyPoints.length > 0 ? {
    v: common_vendor.o((...args) => $options.clearHistory && $options.clearHistory(...args))
  } : {}, {
    w: $data.historyPoints.length > 0
  }, $data.historyPoints.length > 0 ? {
    x: common_vendor.t($data.historyPoints.length),
    y: common_vendor.t($data.startDate),
    z: common_vendor.t($data.endDate)
  } : {}, {
    A: $data.mapCenter.latitude,
    B: $data.mapCenter.longitude,
    C: $data.mapScale,
    D: $data.mapMarkers,
    E: $data.mapPolyline,
    F: common_vendor.o((...args) => $options.onMarkerTap && $options.onMarkerTap(...args)),
    G: !$data.isLoadingHistory && $data.historyPoints.length === 0 && $data.hasSearched
  }, !$data.isLoadingHistory && $data.historyPoints.length === 0 && $data.hasSearched ? {} : {}, {
    H: $data.isLoadingHistory
  }, $data.isLoadingHistory ? {} : {}, {
    I: $data.showDetail
  }, $data.showDetail ? common_vendor.e({
    J: common_vendor.t($data.currentPoint.location_name || $data.currentPoint.locationName || $data.currentPoint.title || "未知地点"),
    K: common_vendor.t($options.formatPointDate($data.currentPoint)),
    L: $data.currentPoint.address
  }, $data.currentPoint.address ? {
    M: common_vendor.t($data.currentPoint.address)
  } : {}, {
    N: $data.currentPoint.photos && $data.currentPoint.photos.length > 0
  }, $data.currentPoint.photos && $data.currentPoint.photos.length > 0 ? {
    O: $data.currentPoint.photos[0]
  } : $data.currentPoint.image ? {
    Q: $data.currentPoint.image
  } : {}, {
    P: $data.currentPoint.image,
    R: common_vendor.t($data.currentPoint.description || "暂无描述"),
    S: $data.currentPoint.visit_count || $data.currentPoint.stay_duration
  }, $data.currentPoint.visit_count || $data.currentPoint.stay_duration ? common_vendor.e({
    T: $data.currentPoint.visit_count
  }, $data.currentPoint.visit_count ? {
    U: common_vendor.t($data.currentPoint.visit_count)
  } : {}, {
    V: $data.currentPoint.stay_duration
  }, $data.currentPoint.stay_duration ? {
    W: common_vendor.t($options.formatDuration($data.currentPoint.stay_duration))
  } : {}) : {}, {
    X: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args)),
    Y: common_vendor.o(() => {
    }),
    Z: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args))
  }) : {}, {
    aa: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-3f8fde69"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trajectory/history.js.map
