"use strict";
const common_vendor = require("../../common/vendor.js");
const api_heartwall = require("../../api/heartwall.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      projects: [],
      loading: false
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
  mounted() {
    this.loadProjects();
  },
  onShow() {
    this.loadProjects();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 44;
    },
    async loadProjects() {
      if (this.loading)
        return;
      this.loading = true;
      try {
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:100", "📡 [爱心墙页面] 开始从后端加载项目列表");
        const response = await api_heartwall.getProjects();
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:105", "📡 [爱心墙页面] 后端返回数据:", response);
        let projectsData = [];
        if (response && response.data) {
          projectsData = Array.isArray(response.data) ? response.data : response.data.projects || [];
        } else if (Array.isArray(response)) {
          projectsData = response;
        } else if (response && response.projects) {
          projectsData = response.projects;
        }
        this.projects = projectsData.map((project) => ({
          projectId: project.projectId || project.id,
          cover: project.cover || project.coverImage || "",
          creator: project.creator || project.creatorName || "未设置",
          progress: project.progress || project.photoCount || 0,
          total: project.total || project.maxPhotos || 40,
          createdAt: project.createdAt || project.createTime || project.created_time || "-",
          // 保留后端原始数据用于编辑时使用
          _original: project
        }));
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:132", `✅ [爱心墙页面] 成功加载 ${this.projects.length} 个项目`);
        try {
          common_vendor.index.setStorageSync("heartwall_projects", this.projects);
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:138", "⚠️ [爱心墙页面] 更新本地缓存失败:", e);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/index.vue:141", "❌ [爱心墙页面] 加载项目列表失败:", error);
        try {
          const cached = common_vendor.index.getStorageSync("heartwall_projects");
          if (Array.isArray(cached) && cached.length > 0) {
            common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:147", "⚠️ [爱心墙页面] 使用本地缓存数据作为降级方案");
            this.projects = cached;
            common_vendor.index.showToast({
              title: "网络异常，已加载本地数据",
              icon: "none",
              duration: 2e3
            });
          } else {
            this.projects = [];
          }
        } catch (e) {
          this.projects = [];
        }
        common_vendor.index.showToast({
          title: "加载失败，请检查网络",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.loading = false;
      }
    },
    startCreate() {
      common_vendor.index.removeStorageSync("heartwall_editing_projectId");
      common_vendor.index.removeStorageSync("heartwall_grid_images");
      common_vendor.index.navigateTo({ url: "/pages/heartwall/create" });
    },
    editProject(index) {
      const project = this.projects[index];
      if (project && project.projectId) {
        common_vendor.index.setStorageSync("heartwall_editing_projectId", project.projectId);
        if (project._original) {
          common_vendor.index.setStorageSync("heartwall_editing_project", JSON.stringify(project._original));
        }
      }
      common_vendor.index.navigateTo({ url: "/pages/heartwall/create" });
    },
    async deleteProject(index) {
      const project = this.projects[index];
      const projectId = (project == null ? void 0 : project.projectId) || (project == null ? void 0 : project.id);
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个项目吗？删除后无法恢复。",
        success: async (res) => {
          if (res.confirm) {
            try {
              if (projectId) {
                common_vendor.index.__f__("log", "at pages/heartwall/index.vue:201", `🗑️ [爱心墙页面] 开始删除项目 ID: ${projectId}`);
                await api_heartwall.deleteProject(projectId);
                common_vendor.index.__f__("log", "at pages/heartwall/index.vue:203", `✅ [爱心墙页面] 项目删除成功 ID: ${projectId}`);
              }
              this.projects.splice(index, 1);
              try {
                common_vendor.index.setStorageSync("heartwall_projects", this.projects);
              } catch (e) {
              }
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/heartwall/index.vue:216", "❌ [爱心墙页面] 删除项目失败:", error);
              common_vendor.index.showToast({
                title: error.message || "删除失败，请重试",
                icon: "none"
              });
            }
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $data.projects.length > 0
  }, $data.projects.length > 0 ? {
    e: common_vendor.f($data.projects, (project, index, i0) => {
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
    f: common_vendor.o((...args) => $options.startCreate && $options.startCreate(...args)),
    g: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/heartwall/index.js.map
