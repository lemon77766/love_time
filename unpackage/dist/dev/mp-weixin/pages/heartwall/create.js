"use strict";
const common_vendor = require("../../common/vendor.js");
const api_heartwall = require("../../api/heartwall.js");
const utils_http = require("../../utils/http.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      // 9x9 心形掩码（1 表示可填充，0 表示空位）；可按需调整
      heartMask: [
        0,
        1,
        1,
        0,
        0,
        1,
        1,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      images: [],
      editingProjectId: null,
      // 正在编辑的项目ID，null 表示创建新项目
      saving: false,
      // 保存中状态
      photoMap: {}
      // 存储positionIndex到photoId的映射 { positionIndex: photoId }
    };
  },
  computed: {
    // 总共可填充的位置数
    totalSlots() {
      return this.heartMask.filter((cell) => cell === 1).length;
    },
    // 已填充的照片数
    filledCount() {
      let count = 0;
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && this.images[i]) {
          count++;
        }
      }
      return count;
    },
    // 剩余可添加的照片数
    remainingSlots() {
      return this.totalSlots - this.filledCount;
    }
  },
  async mounted() {
    try {
      const editingProjectId = common_vendor.index.getStorageSync("heartwall_editing_projectId");
      if (editingProjectId) {
        this.editingProjectId = editingProjectId;
        await this.loadProjectFromBackend(editingProjectId);
      } else {
        const cached = common_vendor.index.getStorageSync("heartwall_grid_images");
        if (Array.isArray(cached)) {
          this.images = cached;
        }
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at pages/heartwall/create.vue:89", "加载项目数据失败:", e);
    }
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async onBatchUpload() {
      const emptySlots = this.getEmptySlots();
      if (emptySlots.length === 0) {
        common_vendor.index.showToast({ title: "照片墙已满", icon: "none" });
        return;
      }
      try {
        const maxCount = Math.min(9, emptySlots.length);
        const res = await common_vendor.index.chooseImage({
          count: maxCount,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (!res || !res.tempFilePaths || res.tempFilePaths.length === 0)
          return;
        const files = res.tempFilePaths;
        for (let i = 0; i < files.length && i < emptySlots.length; i++) {
          const idx = emptySlots[i];
          this.$set(this.images, idx, files[i]);
        }
        this.persist();
        const remainingSlots = emptySlots.length - files.length;
        if (remainingSlots > 0) {
          common_vendor.index.showToast({
            title: `已添加${files.length}张，还可添加${remainingSlots}张`,
            icon: "none",
            duration: 2e3
          });
        } else {
          common_vendor.index.showToast({
            title: `已添加${files.length}张照片`,
            icon: "success"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:140", "批量上传失败:", e);
      }
    },
    // 获取所有空位的索引
    getEmptySlots() {
      const slots = [];
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && !this.images[i]) {
          slots.push(i);
        }
      }
      return slots;
    },
    // 清空所有照片
    async clearAllImages() {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有照片吗？清空后无法恢复。",
        success: async (res) => {
          if (res.confirm) {
            try {
              if (this.editingProjectId) {
                common_vendor.index.showLoading({ title: "清空中...", mask: true });
                common_vendor.index.__f__("log", "at pages/heartwall/create.vue:166", "🗑️ [爱心墙创建页] 开始清空项目照片，项目ID:", this.editingProjectId);
                await api_heartwall.clearProjectPhotos(this.editingProjectId);
                common_vendor.index.__f__("log", "at pages/heartwall/create.vue:170", "✅ [爱心墙创建页] 项目照片清空成功");
                common_vendor.index.hideLoading();
              }
              this.images = [];
              this.photoMap = {};
              this.persist();
              common_vendor.index.showToast({ title: "已清空", icon: "success" });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/heartwall/create.vue:181", "❌ [爱心墙创建页] 清空项目照片失败:", error);
              common_vendor.index.hideLoading();
              this.images = [];
              this.persist();
              common_vendor.index.showToast({
                title: error.message || "清空失败，已清空本地数据",
                icon: "none",
                duration: 2e3
              });
            }
          }
        }
      });
    },
    async onPickSingle(idx) {
      if (!this.heartMask[idx])
        return;
      try {
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (!res || !res.tempFilePaths || !res.tempFilePaths[0]) {
          return;
        }
        const newImagePath = res.tempFilePaths[0];
        const isExistingPhoto = this.images[idx] && this.editingProjectId;
        const photoId = this.photoMap[idx];
        if (isExistingPhoto && photoId) {
          common_vendor.index.showLoading({ title: "替换中...", mask: true });
          try {
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:222", `🔄 [爱心墙创建页] 开始替换位置 ${idx} 的照片，photoId: ${photoId}`);
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:225", "📤 [爱心墙创建页] 上传新图片到服务器...");
            const photoUrl = await this.uploadImageToServer(newImagePath);
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:227", "✅ [爱心墙创建页] 新图片上传成功，URL:", photoUrl);
            const updateData = {
              photoUrl,
              thumbnailUrl: photoUrl,
              positionIndex: idx
            };
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:236", "📝 [爱心墙创建页] 更新后端照片信息...");
            await api_heartwall.updatePhoto(photoId, updateData);
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:238", "✅ [爱心墙创建页] 后端照片更新成功");
            this.$set(this.images, idx, photoUrl);
            this.persist();
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "替换成功",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/heartwall/create.vue:251", "❌ [爱心墙创建页] 替换照片失败:", error);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: error.message || "替换失败，请重试",
              icon: "none",
              duration: 2e3
            });
          }
        } else {
          this.$set(this.images, idx, newImagePath);
          this.persist();
          common_vendor.index.showToast({
            title: "已添加照片",
            icon: "success",
            duration: 1e3
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:272", "❌ [爱心墙创建页] 选择图片失败:", e);
        common_vendor.index.showToast({
          title: "选择图片失败",
          icon: "none"
        });
      }
    },
    onInvite() {
      common_vendor.index.showToast({ title: "邀请功能待接入后端", icon: "none" });
    },
    // 加载项目数据（从后端）
    async loadProjectFromBackend(projectId) {
      try {
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:286", "📡 [爱心墙创建页] 开始从后端加载项目详情 ID:", projectId);
        const projectResponse = await api_heartwall.getProjectDetail(projectId);
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:290", "📡 [爱心墙创建页] 项目详情:", projectResponse);
        const photosResponse = await api_heartwall.getProjectPhotos(projectId, { page: 1, pageSize: 100 });
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:294", "📡 [爱心墙创建页] 项目照片:", photosResponse);
        let photosData = [];
        if (photosResponse && photosResponse.data) {
          photosData = Array.isArray(photosResponse.data) ? photosResponse.data : photosResponse.data.photos || [];
        } else if (Array.isArray(photosResponse)) {
          photosData = photosResponse;
        } else if (photosResponse && photosResponse.photos) {
          photosData = photosResponse.photos;
        }
        this.images = [];
        this.photoMap = {};
        photosData.forEach((photo) => {
          const positionIndex = photo.positionIndex || photo.position_index || 0;
          const photoId = photo.photoId || photo.photo_id || photo.id;
          if (positionIndex >= 0 && positionIndex < this.heartMask.length) {
            this.$set(this.images, positionIndex, photo.photoUrl || photo.photo_url || photo.thumbnailUrl || photo.thumbnail_url || "");
            if (photoId) {
              this.$set(this.photoMap, positionIndex, photoId);
            }
          }
        });
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:322", `✅ [爱心墙创建页] 成功加载 ${photosData.length} 张照片`);
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:323", "📷 [爱心墙创建页] 照片ID映射:", this.photoMap);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:325", "❌ [爱心墙创建页] 加载项目数据失败:", error);
        common_vendor.index.showToast({
          title: "加载项目失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 压缩图片
    compressImage(tempFilePath) {
      return new Promise((resolve, reject) => {
        common_vendor.index.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:341", "✅ [爱心墙创建页] 图片压缩成功，新路径:", res.tempFilePath);
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at pages/heartwall/create.vue:345", "⚠️ [爱心墙创建页] 图片压缩失败，使用原图", error);
            resolve(tempFilePath);
          }
        });
      });
    },
    // 上传单张图片到服务器获取URL
    async uploadImageToServer(filePath) {
      var _a;
      try {
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:355", "📤 [爱心墙创建页] 开始上传图片到服务器，原始路径:", filePath);
        if (filePath && (filePath.startsWith("http://") || filePath.startsWith("https://"))) {
          common_vendor.index.__f__("warn", "at pages/heartwall/create.vue:359", "⚠️ [爱心墙创建页] 文件路径已经是URL格式，跳过上传:", filePath);
          return filePath;
        }
        let validFilePath = filePath;
        if (filePath && filePath.startsWith("http://tmp/")) {
          validFilePath = filePath.replace("http://tmp/", "/tmp/");
          common_vendor.index.__f__("log", "at pages/heartwall/create.vue:367", "🔧 [爱心墙创建页] 修复路径格式:", filePath, "->", validFilePath);
        }
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:371", "🔄 [爱心墙创建页] 压缩图片中...");
        const compressedPath = await this.compressImage(validFilePath);
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:373", "✅ [爱心墙创建页] 图片压缩完成，使用路径:", compressedPath);
        const uploadUrl = utils_config.config.API.USER.AVATAR_UPLOAD;
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:379", "📤 [爱心墙创建页] 开始上传文件，路径:", compressedPath);
        const result = await utils_http.http.upload({
          url: uploadUrl,
          filePath: compressedPath,
          name: "avatar",
          // 头像上传接口期望的字段名
          formData: { type: "heart-wall-photo" }
        });
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:387", "✅ [爱心墙创建页] 图片上传成功，返回URL:", result);
        const imageUrl = result.url || result.photoUrl || result.photo_url || ((_a = result.data) == null ? void 0 : _a.url) || filePath;
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:391", "🖼️ [爱心墙创建页] 获取到图片URL:", imageUrl);
        return imageUrl;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:394", "❌ [爱心墙创建页] 图片上传失败:", error);
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:395", "🔴 错误详情:", {
          message: error.message,
          filePath,
          stack: error.stack
        });
        throw error;
      }
    },
    // 保存项目到列表页
    onSaveProject() {
      if (this.filledCount === 0) {
        common_vendor.index.showToast({ title: "请至少添加一张照片", icon: "none" });
        return;
      }
      if (this.saving) {
        common_vendor.index.showToast({ title: "保存中，请稍候...", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: this.editingProjectId ? "保存修改" : "保存项目",
        content: "请输入项目名称",
        editable: true,
        placeholderText: "输入项目名称",
        success: async (res) => {
          if (res.confirm) {
            const projectName = res.content || "我的爱心墙";
            await this.saveProjectData(projectName);
          }
        }
      });
    },
    // 保存项目数据（调用后端API）
    async saveProjectData(projectName) {
      this.saving = true;
      try {
        common_vendor.index.showLoading({ title: "保存中...", mask: true });
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:440", "💾 [爱心墙创建页] 开始保存项目到后端");
        const projectData = {
          projectName,
          description: `共${this.filledCount}张照片`,
          isPublic: false,
          maxPhotos: this.totalSlots
        };
        let projectId;
        let createResponse = null;
        if (this.editingProjectId) {
          common_vendor.index.__f__("log", "at pages/heartwall/create.vue:456", "🔄 [爱心墙创建页] 更新项目 ID:", this.editingProjectId);
          await api_heartwall.updateProject(this.editingProjectId, projectData);
          projectId = this.editingProjectId;
        } else {
          common_vendor.index.__f__("log", "at pages/heartwall/create.vue:461", "✨ [爱心墙创建页] 创建新项目");
          createResponse = await api_heartwall.createProject(projectData);
          common_vendor.index.__f__("log", "at pages/heartwall/create.vue:463", "✅ [爱心墙创建页] 项目创建成功:", createResponse);
          if (createResponse && createResponse.data) {
            projectId = createResponse.data.projectId || createResponse.data.id;
          } else if (createResponse && createResponse.project) {
            projectId = createResponse.project.projectId || createResponse.project.id;
          } else if (createResponse && (createResponse.projectId || createResponse.id)) {
            projectId = createResponse.projectId || createResponse.id;
          }
          common_vendor.index.__f__("log", "at pages/heartwall/create.vue:477", "🔍 [爱心墙创建页] 提取的项目ID:", projectId);
          if (!projectId) {
            common_vendor.index.__f__("error", "at pages/heartwall/create.vue:481", "❌ [爱心墙创建页] 无法获取项目ID");
            common_vendor.index.__f__("error", "at pages/heartwall/create.vue:482", "📦 [响应数据结构]:", JSON.stringify(createResponse, null, 2));
            throw new Error("无法获取项目ID，请检查后端返回的数据格式");
          }
        }
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:487", "📝 [爱心墙创建页] 项目ID:", projectId);
        const photoTasks = [];
        for (let i = 0; i < this.heartMask.length; i++) {
          if (this.heartMask[i] && this.images[i]) {
            photoTasks.push({
              positionIndex: i,
              imagePath: this.images[i]
            });
          }
        }
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:500", `📋 [爱心墙创建页] 准备上传 ${photoTasks.length} 张照片`);
        const photoUploadPromises = photoTasks.map(async (task) => {
          const { positionIndex, imagePath } = task;
          const isLocalPath = !imagePath.startsWith("http://") && !imagePath.startsWith("https://") && !imagePath.startsWith("data:");
          if (isLocalPath) {
            try {
              common_vendor.index.__f__("log", "at pages/heartwall/create.vue:513", `📤 [爱心墙创建页] 上传图片 ${positionIndex} 到服务器...`);
              const photoUrl = await this.uploadImageToServer(imagePath);
              common_vendor.index.__f__("log", "at pages/heartwall/create.vue:515", `✅ [爱心墙创建页] 图片 ${positionIndex} 上传成功`);
              return {
                positionIndex,
                photoUrl,
                thumbnailUrl: photoUrl
              };
            } catch (uploadError) {
              common_vendor.index.__f__("error", "at pages/heartwall/create.vue:522", `❌ [爱心墙创建页] 图片 ${positionIndex} 上传失败:`, uploadError);
              return null;
            }
          } else {
            return {
              positionIndex,
              photoUrl: imagePath,
              thumbnailUrl: imagePath
            };
          }
        });
        const photoUrls = await Promise.all(photoUploadPromises);
        const validPhotos = photoUrls.filter((photo) => photo !== null);
        const failedCount = photoUrls.length - validPhotos.length;
        if (failedCount > 0) {
          common_vendor.index.__f__("warn", "at pages/heartwall/create.vue:544", `⚠️ [爱心墙创建页] ${failedCount} 张图片上传失败`);
          common_vendor.index.showToast({
            title: `${failedCount} 张照片上传失败，其余照片将继续保存`,
            icon: "none",
            duration: 3e3
          });
        }
        const savePromises = validPhotos.map((photo) => {
          const photoData = {
            photoUrl: photo.photoUrl,
            thumbnailUrl: photo.thumbnailUrl,
            positionIndex: photo.positionIndex
          };
          const existingPhotoId = this.photoMap[photo.positionIndex];
          if (existingPhotoId) {
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:566", `🔄 [爱心墙创建页] 位置 ${photo.positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
            return api_heartwall.updatePhoto(existingPhotoId, photoData).catch((error) => {
              common_vendor.index.__f__("error", "at pages/heartwall/create.vue:568", `❌ [爱心墙创建页] 照片 ${photo.positionIndex} 更新失败:`, error);
              return null;
            });
          } else {
            common_vendor.index.__f__("log", "at pages/heartwall/create.vue:573", `➕ [爱心墙创建页] 位置 ${photo.positionIndex} 为新照片，使用新增接口`);
            const createData = {
              ...photoData,
              projectId
            };
            return api_heartwall.uploadPhoto(createData).catch((error) => {
              common_vendor.index.__f__("error", "at pages/heartwall/create.vue:579", `❌ [爱心墙创建页] 照片 ${photo.positionIndex} 保存失败:`, error);
              return null;
            });
          }
        });
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:586", `💾 [爱心墙创建页] 开始保存 ${savePromises.length} 张照片信息`);
        const saveResults = await Promise.all(savePromises);
        const savedCount = saveResults.filter((r) => r !== null).length;
        common_vendor.index.__f__("log", "at pages/heartwall/create.vue:590", `✅ [爱心墙创建页] 成功保存 ${savedCount}/${validPhotos.length} 张照片`);
        saveResults.forEach((result, index) => {
          if (result && result.data) {
            const photoId = result.data.photoId || result.data.photo_id || result.data.id;
            const photo = validPhotos[index];
            if (photoId && photo) {
              if (!this.photoMap[photo.positionIndex]) {
                this.$set(this.photoMap, photo.positionIndex, photoId);
                common_vendor.index.__f__("log", "at pages/heartwall/create.vue:601", `📷 [爱心墙创建页] 更新照片映射: positionIndex=${photo.positionIndex}, photoId=${photoId}`);
              } else {
                common_vendor.index.__f__("log", "at pages/heartwall/create.vue:603", `📷 [爱心墙创建页] 位置 ${photo.positionIndex} 照片已存在(photoId: ${photoId})，无需更新映射`);
              }
            }
          }
        });
        this.editingProjectId = projectId;
        common_vendor.index.setStorageSync("heartwall_editing_projectId", projectId);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: this.editingProjectId ? "修改成功" : "保存成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:625", "❌ [爱心墙创建页] 保存项目失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: error.message || "保存失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.saving = false;
      }
    },
    async onSaveImage() {
      common_vendor.index.showToast({ title: "请在 H5 端使用保存图片功能", icon: "none" });
    },
    persist() {
      try {
        common_vendor.index.setStorageSync("heartwall_grid_images", this.images);
      } catch (e) {
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.heartMask, (cell, idx, i0) => {
      return common_vendor.e({
        a: $data.images[idx]
      }, $data.images[idx] ? {
        b: $data.images[idx]
      } : {}, {
        c: idx,
        d: !cell ? 1 : "",
        e: cell && $data.images[idx] ? 1 : "",
        f: common_vendor.o(($event) => $options.onPickSingle(idx), idx)
      });
    }),
    b: common_vendor.t($options.filledCount),
    c: common_vendor.t($options.totalSlots),
    d: $options.filledCount > 0
  }, $options.filledCount > 0 ? {
    e: common_vendor.o((...args) => $options.clearAllImages && $options.clearAllImages(...args))
  } : {}, {
    f: common_vendor.t($options.remainingSlots > 0 ? `还可添加${Math.min(9, $options.remainingSlots)}张` : "已满"),
    g: common_vendor.o((...args) => $options.onBatchUpload && $options.onBatchUpload(...args)),
    h: common_vendor.o((...args) => $options.onSaveProject && $options.onSaveProject(...args)),
    i: common_vendor.o((...args) => $options.onSaveImage && $options.onSaveImage(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/heartwall/create.js.map
