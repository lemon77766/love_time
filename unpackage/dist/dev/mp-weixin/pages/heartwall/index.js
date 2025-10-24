"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      projects: []
    };
  },
  mounted() {
    this.loadProjects();
  },
  onShow() {
    this.loadProjects();
  },
  methods: {
    loadProjects() {
      try {
        const data = common_vendor.index.getStorageSync("heartwall_projects");
        this.projects = Array.isArray(data) ? data : [];
      } catch (e) {
        this.projects = [];
      }
    },
    saveProjects() {
      try {
        common_vendor.index.setStorageSync("heartwall_projects", this.projects);
      } catch (e) {
      }
    },
    startCreate() {
      common_vendor.index.removeStorageSync("heartwall_editing_index");
      common_vendor.index.removeStorageSync("heartwall_grid_images");
      common_vendor.index.navigateTo({ url: "/pages/heartwall/create" });
    },
    editProject(index) {
      common_vendor.index.setStorageSync("heartwall_editing_index", index);
      common_vendor.index.setStorageSync("heartwall_grid_images", this.projects[index].images || []);
      common_vendor.index.navigateTo({ url: "/pages/heartwall/create" });
    },
    deleteProject(index) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个项目吗？删除后无法恢复。",
        success: (res) => {
          if (res.confirm) {
            this.projects.splice(index, 1);
            this.saveProjects();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.projects.length > 0
  }, $data.projects.length > 0 ? {
    b: common_vendor.f($data.projects, (project, index, i0) => {
      return common_vendor.e({
        a: project.cover
      }, project.cover ? {
        b: project.cover
      } : {}, {
        c: !project.cover ? 1 : "",
        d: common_vendor.t(project.creator || "未设置"),
        e: common_vendor.t(project.progress),
        f: common_vendor.t(project.total),
        g: common_vendor.t(project.createdAt || "-"),
        h: common_vendor.o(($event) => $options.deleteProject(index), index),
        i: index,
        j: common_vendor.o(($event) => $options.editProject(index), index)
      });
    })
  } : {}, {
    c: common_vendor.o((...args) => $options.startCreate && $options.startCreate(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/heartwall/index.js.map
