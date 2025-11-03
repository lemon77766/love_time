"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      trajectoryPoints: [
        {
          title: "初遇",
          date: "2023-03-15",
          description: "第一次见面的咖啡厅",
          top: 30,
          left: 40,
          image: "/static/trajectory/meet.jpg"
        },
        {
          title: "表白",
          date: "2023-05-20",
          description: "在公园的樱花树下表白",
          top: 50,
          left: 60,
          image: "/static/trajectory/confess.jpg"
        },
        {
          title: "旅行",
          date: "2023-08-10",
          description: "第一次一起旅行",
          top: 70,
          left: 30,
          image: "/static/trajectory/travel.jpg"
        }
      ],
      showDetail: false,
      currentPoint: {},
      showAddModal: false,
      newPoint: {
        title: "",
        date: "",
        description: "",
        top: null,
        left: null,
        image: ""
      }
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
  onLoad() {
    this.getSystemInfo();
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
    showAddModal() {
      this.showAddModal = true;
    },
    hideAddModal() {
      this.showAddModal = false;
      this.newPoint = {
        title: "",
        date: "",
        description: "",
        top: null,
        left: null,
        image: ""
      };
    },
    selectPosition() {
      this.newPoint.top = Math.random() * 70 + 15;
      this.newPoint.left = Math.random() * 70 + 15;
      common_vendor.index.showToast({ title: "位置已选择", icon: "none" });
    },
    addTrajectoryPoint() {
      if (!this.newPoint.title || !this.newPoint.date) {
        common_vendor.index.showToast({ title: "请填写地点名称和日期", icon: "none" });
        return;
      }
      if (this.newPoint.top === null || this.newPoint.left === null) {
        common_vendor.index.showToast({ title: "请选择位置", icon: "none" });
        return;
      }
      this.trajectoryPoints.push({
        ...this.newPoint
      });
      this.hideAddModal();
      common_vendor.index.showToast({ title: "轨迹点添加成功", icon: "success" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: $data.navBarHeight + "px",
    c: common_assets._imports_0$5,
    d: common_vendor.f($data.trajectoryPoints, (point, index, i0) => {
      return {
        a: common_vendor.t(point.title),
        b: index,
        c: point.top + "%",
        d: point.left + "%",
        e: common_vendor.o(($event) => $options.showPointDetail(point), index)
      };
    }),
    e: $data.trajectoryPoints.length > 1
  }, $data.trajectoryPoints.length > 1 ? {} : {}, {
    f: common_vendor.o((...args) => $options.showAddModal && $options.showAddModal(...args)),
    g: $data.showDetail
  }, $data.showDetail ? common_vendor.e({
    h: common_vendor.t($data.currentPoint.title),
    i: common_vendor.t($data.currentPoint.date),
    j: $data.currentPoint.image
  }, $data.currentPoint.image ? {
    k: $data.currentPoint.image
  } : {}, {
    l: common_vendor.t($data.currentPoint.description || "暂无描述"),
    m: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args)),
    n: common_vendor.o(() => {
    }),
    o: common_vendor.o((...args) => $options.hidePointDetail && $options.hidePointDetail(...args))
  }) : {}, {
    p: $options.showAddModal
  }, $options.showAddModal ? common_vendor.e({
    q: $data.newPoint.title,
    r: common_vendor.o(($event) => $data.newPoint.title = $event.detail.value),
    s: $data.newPoint.date,
    t: common_vendor.o(($event) => $data.newPoint.date = $event.detail.value),
    v: $data.newPoint.description,
    w: common_vendor.o(($event) => $data.newPoint.description = $event.detail.value),
    x: common_vendor.o((...args) => $options.selectPosition && $options.selectPosition(...args)),
    y: $data.newPoint.top !== null
  }, $data.newPoint.top !== null ? {} : {}, {
    z: common_vendor.o((...args) => $options.hideAddModal && $options.hideAddModal(...args)),
    A: common_vendor.o((...args) => $options.addTrajectoryPoint && $options.addTrajectoryPoint(...args)),
    B: common_vendor.o(() => {
    }),
    C: common_vendor.o((...args) => $options.hideAddModal && $options.hideAddModal(...args))
  }) : {}, {
    D: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trajectory/index.js.map
