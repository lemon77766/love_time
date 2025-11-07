"use strict";
const common_vendor = require("../../common/vendor.js");
const api_heartwall = require("../../api/heartwall.js");
const utils_config = require("../../utils/config.js");
function processImageUrl(url) {
  if (!url || url === "") {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    const baseUrl2 = utils_config.config.baseURL.endsWith("/") ? utils_config.config.baseURL.slice(0, -1) : utils_config.config.baseURL;
    return baseUrl2 + url;
  }
  const baseUrl = utils_config.config.baseURL.endsWith("/") ? utils_config.config.baseURL.slice(0, -1) : utils_config.config.baseURL;
  return baseUrl + "/" + url;
}
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
    try {
      common_vendor.index.removeStorageSync("heartwall_projects");
    } catch (e) {
      common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:106", "⚠️ [爱心墙页面] 清除缓存失败:", e);
    }
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
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:130", "📡 [爱心墙页面] 开始从后端加载项目列表");
        const response = await api_heartwall.getProjects();
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:135", "📡 [爱心墙页面] 后端返回数据:", response);
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:136", "📡 [爱心墙页面] response.data:", response.data);
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:137", "📡 [爱心墙页面] response.projects:", response.projects);
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:138", "📡 [爱心墙页面] response.data[0]:", response.data && response.data[0]);
        let projectsData = [];
        if (response && response.data) {
          projectsData = Array.isArray(response.data) ? response.data : response.data.projects || [];
        } else if (Array.isArray(response)) {
          projectsData = response;
        } else if (response && response.projects) {
          projectsData = response.projects;
        }
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:154", "🔍 [爱心墙页面] 原始项目数据:", projectsData);
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:155", "🔍 [爱心墙页面] 原始项目数据长度:", projectsData.length);
        if (projectsData.length > 0) {
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:157", "🔍 [爱心墙页面] 第一个项目的所有字段:", Object.keys(projectsData[0]));
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:158", "🔍 [爱心墙页面] 第一个项目的完整数据:", JSON.stringify(projectsData[0], null, 2));
        }
        this.projects = projectsData.map((project, index) => {
          const projectName = project.projectName !== void 0 && project.projectName !== null ? String(project.projectName).trim() : project.name || "未设置";
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:167", `🔍 [爱心墙页面] 项目 ${index} 原始数据:`, project);
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:168", `🔍 [爱心墙页面] 项目 ${index} projectName 原始值:`, project.projectName);
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:169", `🔍 [爱心墙页面] 项目 ${index} 提取的 projectName:`, projectName);
          const mappedProject = {
            projectId: project.projectId || project.id,
            cover: project.cover || project.coverImage || project.coverPhotoUrl || "",
            projectName: projectName || "未设置",
            progress: project.progress || project.photoCount || 0,
            total: project.total || project.maxPhotos || 40,
            createdAt: project.createdAt || project.createTime || project.created_time || "-",
            // 保留后端原始数据用于编辑时使用
            _original: project
          };
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:181", `🔍 [爱心墙页面] 项目 ${index} 映射后的数据:`, mappedProject);
          return mappedProject;
        });
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:185", `✅ [爱心墙页面] 成功加载 ${this.projects.length} 个项目`);
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:186", "🔍 [爱心墙页面] 最终项目列表:", this.projects);
        await this.loadProjectCovers();
        try {
          common_vendor.index.setStorageSync("heartwall_projects", this.projects);
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:195", "⚠️ [爱心墙页面] 更新本地缓存失败:", e);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/index.vue:198", "❌ [爱心墙页面] 加载项目列表失败:", error);
        try {
          const cached = common_vendor.index.getStorageSync("heartwall_projects");
          if (Array.isArray(cached) && cached.length > 0) {
            common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:204", "⚠️ [爱心墙页面] 使用本地缓存数据作为降级方案");
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
    // 为没有封面图的项目获取第一张照片作为封面图
    async loadProjectCovers() {
      try {
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:231", "🖼️ [爱心墙页面] 开始加载项目封面图");
        const projectsWithoutCover = this.projects.map((project, index) => ({ project, index })).filter(({ project }) => !project.cover || project.cover === "");
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:238", `🖼️ [爱心墙页面] 需要加载封面图的项目数量: ${projectsWithoutCover.length}`);
        if (projectsWithoutCover.length === 0) {
          common_vendor.index.__f__("log", "at pages/heartwall/index.vue:241", "✅ [爱心墙页面] 所有项目都有封面图，无需加载");
          return;
        }
        const coverPromises = projectsWithoutCover.map(async ({ project, index }) => {
          try {
            const projectId = project.projectId || project.id;
            if (!projectId) {
              common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:250", `⚠️ [爱心墙页面] 项目 ${index} 没有 projectId，跳过加载封面图`);
              return { index, cover: null };
            }
            common_vendor.index.__f__("log", "at pages/heartwall/index.vue:254", `📷 [爱心墙页面] 获取项目 ${index} (ID: ${projectId}) 的第一张照片`);
            const photosResponse = await api_heartwall.getProjectPhotos(projectId, { page: 1, pageSize: 1 });
            let photosData = [];
            if (photosResponse && photosResponse.data) {
              photosData = Array.isArray(photosResponse.data) ? photosResponse.data : photosResponse.data.photos || [];
            } else if (Array.isArray(photosResponse)) {
              photosData = photosResponse;
            } else if (photosResponse && photosResponse.photos) {
              photosData = photosResponse.photos;
            }
            let coverUrl = "";
            if (photosData.length > 0) {
              const firstPhoto = photosData[0];
              const rawUrl = firstPhoto.photoUrl || firstPhoto.photo_url || firstPhoto.thumbnailUrl || firstPhoto.thumbnail_url || "";
              coverUrl = processImageUrl(rawUrl);
              common_vendor.index.__f__("log", "at pages/heartwall/index.vue:276", `✅ [爱心墙页面] 项目 ${index} 找到封面图 - 原始URL: ${rawUrl}, 处理后URL: ${coverUrl}`);
            } else {
              common_vendor.index.__f__("log", "at pages/heartwall/index.vue:278", `⚠️ [爱心墙页面] 项目 ${index} 没有照片，无法设置封面图`);
            }
            return { index, cover: coverUrl };
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/heartwall/index.vue:283", `❌ [爱心墙页面] 获取项目 ${index} 封面图失败:`, error);
            return { index, cover: null };
          }
        });
        const coverResults = await Promise.all(coverPromises);
        coverResults.forEach(({ index, cover }) => {
          if (cover) {
            this.$set(this.projects[index], "cover", cover);
            common_vendor.index.__f__("log", "at pages/heartwall/index.vue:296", `✅ [爱心墙页面] 项目 ${index} 封面图已更新:`, cover);
          }
        });
        try {
          common_vendor.index.setStorageSync("heartwall_projects", this.projects);
        } catch (e) {
          common_vendor.index.__f__("warn", "at pages/heartwall/index.vue:304", "⚠️ [爱心墙页面] 更新本地缓存失败:", e);
        }
        common_vendor.index.__f__("log", "at pages/heartwall/index.vue:307", "✅ [爱心墙页面] 封面图加载完成");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/index.vue:309", "❌ [爱心墙页面] 加载封面图失败:", error);
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
                common_vendor.index.__f__("log", "at pages/heartwall/index.vue:343", `🗑️ [爱心墙页面] 开始删除项目 ID: ${projectId}`);
                await api_heartwall.deleteProject(projectId);
                common_vendor.index.__f__("log", "at pages/heartwall/index.vue:345", `✅ [爱心墙页面] 项目删除成功 ID: ${projectId}`);
              }
              this.projects.splice(index, 1);
              try {
                common_vendor.index.setStorageSync("heartwall_projects", this.projects);
              } catch (e) {
              }
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/heartwall/index.vue:358", "❌ [爱心墙页面] 删除项目失败:", error);
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
        d: common_vendor.t(project.projectName || "未设置"),
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
