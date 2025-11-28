"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_heartwall = require("../../../../api/heartwall.js");
const utils_http = require("../../../../utils/http.js");
const utils_config = require("../../../../utils/config.js");
function processImageUrl(url) {
  if (!url || url === "") {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    if (url.startsWith("/pages/")) {
      const stripped = url.replace(/^\/pages/, "");
      const uploadsIndex = stripped.indexOf("/uploads/");
      if (uploadsIndex !== -1) {
        url = stripped.slice(uploadsIndex);
      } else {
        url = stripped.startsWith("/") ? stripped : "/" + stripped;
      }
    }
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
      photoMap: {},
      // 存储positionIndex到photoId的映射 { positionIndex: photoId }
      canvasWidth: 0,
      canvasHeight: 0
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      return totalHeightPx * pxToRpx + "rpx";
    },
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
    this.getSystemInfo();
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
      common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:150", "加载项目数据失败:", e);
    }
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 导出为图片功能
    async exportAsImage() {
      if (this.filledCount === 0) {
        common_vendor.index.showToast({
          title: "请先添加照片再导出",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({ title: "正在生成图片...", mask: true });
      try {
        const canvasWidth = 750;
        const canvasHeight = 1e3;
        const cellSize = (canvasWidth - 40) / 9;
        const ctx = common_vendor.index.createCanvasContext("exportCanvas", this);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.setFillStyle("#FFFAF4");
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.setFontSize(20);
        ctx.setFillStyle("#FFB5C2");
        ctx.setTextAlign("center");
        ctx.fillText("♥", canvasWidth / 2, 30);
        ctx.setFontSize(24);
        ctx.setFillStyle("#4A4A4A");
        ctx.setTextAlign("center");
        ctx.fillText("爱心照片墙", canvasWidth / 2, 60);
        ctx.setFontSize(16);
        ctx.setFillStyle("#666666");
        ctx.setTextAlign("center");
        ctx.fillText(`共 ${this.filledCount} 张照片`, canvasWidth / 2, 90);
        const startX = 20;
        const startY = 110;
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const idx = row * 9 + col;
            if (this.heartMask[idx]) {
              const x = startX + col * cellSize;
              const y = startY + row * cellSize;
              this.drawRoundedRect(ctx, x, y, cellSize, cellSize, 6);
              ctx.setStrokeStyle("#FFB5C2");
              ctx.stroke();
              if (this.images[idx]) {
                await this.drawImageOnCanvas(ctx, this.images[idx], x, y, cellSize, cellSize);
              }
            }
          }
        }
        ctx.setFontSize(14);
        ctx.setFillStyle("#999999");
        ctx.setTextAlign("center");
        ctx.fillText("Created with Love Time", canvasWidth / 2, canvasHeight - 30);
        ctx.fillText((/* @__PURE__ */ new Date()).toLocaleDateString(), canvasWidth / 2, canvasHeight - 10);
        ctx.draw(true, () => {
          setTimeout(() => {
            common_vendor.index.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: canvasWidth,
              height: canvasHeight,
              destWidth: canvasWidth,
              destHeight: canvasHeight,
              canvasId: "exportCanvas",
              fileType: "png",
              quality: 1,
              success: (res) => {
                if (!res.tempFilePath) {
                  common_vendor.index.hideLoading();
                  common_vendor.index.showToast({
                    title: "导出失败：无法生成图片",
                    icon: "none"
                  });
                  return;
                }
                common_vendor.index.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: () => {
                    common_vendor.index.hideLoading();
                    common_vendor.index.showToast({
                      title: "图片已保存到相册",
                      icon: "success"
                    });
                  },
                  fail: (err) => {
                    common_vendor.index.hideLoading();
                    common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:277", "保存图片失败:", err);
                    if (err.errMsg && err.errMsg.includes("auth deny")) {
                      common_vendor.index.showModal({
                        title: "权限申请",
                        content: "需要相册权限才能保存图片，请在设置中开启相册权限",
                        showCancel: true,
                        confirmText: "去设置",
                        success: (modalRes) => {
                          if (modalRes.confirm) {
                            common_vendor.index.openSetting({
                              success: (settingRes) => {
                                if (settingRes.authSetting["scope.writePhotosAlbum"]) {
                                  common_vendor.index.showToast({
                                    title: "权限已开启，请重新导出",
                                    icon: "none"
                                  });
                                }
                              },
                              fail: (settingErr) => {
                                common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:298", "打开设置失败:", settingErr);
                                common_vendor.index.showToast({
                                  title: "打开设置失败",
                                  icon: "none"
                                });
                              }
                            });
                          }
                        },
                        fail: (modalErr) => {
                          common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:309", "显示模态框失败:", modalErr);
                          common_vendor.index.showToast({
                            title: "操作失败",
                            icon: "none"
                          });
                        }
                      });
                    } else {
                      common_vendor.index.showToast({
                        title: "保存失败，请重试",
                        icon: "none"
                      });
                    }
                  }
                });
              },
              fail: (err) => {
                common_vendor.index.hideLoading();
                common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:327", "导出图片失败:", err);
                common_vendor.index.showToast({
                  title: "导出失败: " + (err.errMsg || "无法生成图片"),
                  icon: "none"
                });
              }
            }, this);
          }, 1500);
        });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:338", "导出图片失败:", error);
        common_vendor.index.showToast({
          title: "导出失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    },
    // 在Canvas上绘制图片的异步方法
    drawImageOnCanvas(ctx, imageUrl, x, y, width, height) {
      return new Promise((resolve) => {
        if (!imageUrl || typeof imageUrl !== "string") {
          common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:351", "无效的图片URL:", imageUrl);
          this.drawPlaceholder(ctx, x, y, width, height);
          resolve();
          return;
        }
        common_vendor.index.getImageInfo({
          src: imageUrl,
          success: (info) => {
            if (info && info.path) {
              try {
                ctx.drawImage(info.path, x, y, width, height);
              } catch (drawErr) {
                common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:368", "绘制图片失败:", drawErr);
                this.drawPlaceholder(ctx, x, y, width, height);
              }
            } else {
              this.drawPlaceholder(ctx, x, y, width, height);
            }
            resolve();
          },
          fail: (err) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:378", "图片加载失败:", imageUrl, err);
            this.drawPlaceholder(ctx, x, y, width, height);
            resolve();
          }
        });
      });
    },
    // 绘制占位符（当图片加载失败时）
    drawPlaceholder(ctx, x, y, width, height) {
      ctx.setFillStyle("#f0f0f0");
      ctx.fillRect(x, y, width, height);
      ctx.setStrokeStyle("#cccccc");
      ctx.setLineWidth(2);
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + width - 10, y + height - 10);
      ctx.moveTo(x + width - 10, y + 10);
      ctx.lineTo(x + 10, y + height - 10);
      ctx.stroke();
    },
    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.setFillStyle("#ffffff");
      ctx.fill();
    },
    getSystemInfo() {
      try {
        const windowInfo = common_vendor.wx$1.getWindowInfo && common_vendor.wx$1.getWindowInfo();
        if (windowInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sys = common_vendor.index.getSystemInfoSync();
          this.statusBarHeight = sys.statusBarHeight || 0;
          this.screenWidth = sys.windowWidth || 375;
        }
      } catch (e) {
        const sys = common_vendor.index.getSystemInfoSync();
        this.statusBarHeight = sys.statusBarHeight || 0;
        this.screenWidth = sys.windowWidth || 375;
      }
      this.navBarHeight = 44;
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:527", "批量上传失败:", e);
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
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:553", "🗑️ [爱心墙创建页] 开始清空项目照片，项目ID:", this.editingProjectId);
                await api_heartwall.clearProjectPhotos(this.editingProjectId);
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:557", "✅ [爱心墙创建页] 项目照片清空成功");
                common_vendor.index.hideLoading();
              }
              this.images = [];
              this.photoMap = {};
              this.persist();
              common_vendor.index.showToast({ title: "已清空", icon: "success" });
            } catch (error) {
              common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:568", "❌ [爱心墙创建页] 清空项目照片失败:", error);
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
    // 上传图片到服务器的函数
    async uploadImageToServer(imagePath, projectId, positionIndex) {
      return new Promise((resolve, reject) => {
        const loginInfo = common_vendor.index.getStorageSync("login_info");
        const token = loginInfo == null ? void 0 : loginInfo.token;
        if (!token) {
          reject(new Error("未登录，无法上传图片"));
          return;
        }
        utils_http.http.upload({
          url: "/api/heart-wall/photos/upload",
          filePath: imagePath,
          name: "file",
          header: {
            "Authorization": `Bearer ${token}`
          },
          formData: {
            projectId: projectId.toString(),
            positionIndex: positionIndex.toString()
          }
        }).then((response) => {
          var _a, _b, _c, _d, _e;
          let photoUrl = null;
          if (response.photos && Array.isArray(response.photos) && response.photos.length > 0) {
            photoUrl = response.photos[0].photoUrl || response.photos[0].thumbnailUrl;
          } else if (((_a = response.data) == null ? void 0 : _a.photos) && Array.isArray(response.data.photos) && response.data.photos.length > 0) {
            photoUrl = response.data.photos[0].photoUrl || response.data.photos[0].thumbnailUrl;
          } else if (((_c = (_b = response.data) == null ? void 0 : _b.data) == null ? void 0 : _c.photos) && Array.isArray(response.data.data.photos) && response.data.data.photos.length > 0) {
            photoUrl = response.data.data.photos[0].photoUrl || response.data.data.photos[0].thumbnailUrl;
          } else if ((_d = response.data) == null ? void 0 : _d.photoUrl) {
            photoUrl = response.data.photoUrl;
          } else if ((_e = response.data) == null ? void 0 : _e.url) {
            photoUrl = response.data.url;
          } else if (response.photoUrl) {
            photoUrl = response.photoUrl;
          } else if (response.url) {
            photoUrl = response.url;
          }
          if (photoUrl) {
            resolve(photoUrl);
          } else {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:634", "⚠️ [爱心墙创建页] 上传响应结构:", response);
            reject(new Error("上传成功但未返回图片URL"));
          }
        }).catch((error) => {
          common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:638", "❌ [爱心墙创建页] 上传图片到服务器失败:", error);
          reject(new Error("上传失败: " + (error.message || error.errMsg || "未知错误")));
        });
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
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:668", `🔄 [爱心墙创建页] 开始替换位置 ${idx} 的照片，photoId: ${photoId}`);
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:671", "📤 [爱心墙创建页] 上传新图片到服务器...");
            const photoUrl = await this.uploadImageToServer(newImagePath, this.editingProjectId, idx);
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:673", "✅ [爱心墙创建页] 新图片上传成功，URL:", photoUrl);
            const updateData = {
              photoUrl,
              thumbnailUrl: photoUrl,
              positionIndex: idx
            };
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:682", "📝 [爱心墙创建页] 更新后端照片信息...");
            await api_heartwall.updatePhoto(photoId, updateData);
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:684", "✅ [爱心墙创建页] 后端照片更新成功");
            this.$set(this.images, idx, photoUrl);
            this.persist();
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "替换成功",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:697", "❌ [爱心墙创建页] 替换照片失败:", error);
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:718", "❌ [爱心墙创建页] 选择图片失败:", e);
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
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:732", "📡 [爱心墙创建页] 开始从后端加载项目详情 ID:", projectId);
        const projectResponse = await api_heartwall.getProjectDetail(projectId);
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:736", "📡 [爱心墙创建页] 项目详情:", projectResponse);
        const photosResponse = await api_heartwall.getProjectPhotos(projectId, { page: 1, pageSize: 100 });
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:740", "📡 [爱心墙创建页] 项目照片:", photosResponse);
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
            const rawUrl = photo.photoUrl || photo.photo_url || photo.thumbnailUrl || photo.thumbnail_url || "";
            const processedUrl = processImageUrl(rawUrl);
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:763", `🖼️ [爱心墙创建页] 位置 ${positionIndex} 原始URL: ${rawUrl}, 处理后URL: ${processedUrl}`);
            this.$set(this.images, positionIndex, processedUrl);
            if (photoId) {
              this.$set(this.photoMap, positionIndex, photoId);
            }
          }
        });
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:772", `✅ [爱心墙创建页] 成功加载 ${photosData.length} 张照片`);
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:773", "📷 [爱心墙创建页] 照片ID映射:", this.photoMap);
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:774", "🖼️ [爱心墙创建页] 照片URL列表:", this.images.filter((url) => url));
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:776", "❌ [爱心墙创建页] 加载项目数据失败:", error);
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
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:792", "✅ [爱心墙创建页] 图片压缩成功，新路径:", res.tempFilePath);
            resolve(res.tempFilePath);
          },
          fail: (error) => {
            common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:796", "⚠️ [爱心墙创建页] 图片压缩失败，使用原图", error);
            resolve(tempFilePath);
          }
        });
      });
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
        editable: true,
        placeholderText: "请输入项目名称",
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
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:836", "💾 [爱心墙创建页] 开始保存项目到后端");
        const projectData = {
          projectName,
          description: `共${this.filledCount}张照片`,
          isPublic: false,
          maxPhotos: this.totalSlots
        };
        let projectId;
        let createResponse = null;
        if (this.editingProjectId) {
          common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:852", "🔄 [爱心墙创建页] 更新项目 ID:", this.editingProjectId);
          await api_heartwall.updateProject(this.editingProjectId, projectData);
          projectId = this.editingProjectId;
        } else {
          common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:857", "✨ [爱心墙创建页] 创建新项目");
          createResponse = await api_heartwall.createProject(projectData);
          common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:859", "✅ [爱心墙创建页] 项目创建成功:", createResponse);
          if (createResponse && createResponse.data) {
            projectId = createResponse.data.projectId || createResponse.data.id;
          } else if (createResponse && createResponse.project) {
            projectId = createResponse.project.projectId || createResponse.project.id;
          } else if (createResponse && (createResponse.projectId || createResponse.id)) {
            projectId = createResponse.projectId || createResponse.id;
          }
          common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:873", "🔍 [爱心墙创建页] 提取的项目ID:", projectId);
          if (!projectId) {
            common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:877", "❌ [爱心墙创建页] 无法获取项目ID");
            common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:878", "📦 [响应数据结构]:", JSON.stringify(createResponse, null, 2));
            throw new Error("无法获取项目ID，请检查后端返回的数据格式");
          }
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:883", "📝 [爱心墙创建页] 项目ID:", projectId);
        const photoTasks = [];
        for (let i = 0; i < this.heartMask.length; i++) {
          if (this.heartMask[i] && this.images[i]) {
            photoTasks.push({
              positionIndex: i,
              imagePath: this.images[i]
            });
          }
        }
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:896", `📋 [爱心墙创建页] 准备上传 ${photoTasks.length} 张照片`);
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:899", "📤 [爱心墙创建页] 使用直接上传方式（multipart/form-data）");
        const savePromises = photoTasks.map(async (task) => {
          const { positionIndex, imagePath } = task;
          const isTmpPath = imagePath && (imagePath.startsWith("http://tmp/") || imagePath.startsWith("https://tmp/"));
          const isRealUrl = imagePath && (imagePath.startsWith("http://") || imagePath.startsWith("https://")) && !isTmpPath;
          const isLocalPath = !isRealUrl && !imagePath.startsWith("data:");
          const existingPhotoId = this.photoMap[positionIndex];
          if (isLocalPath || isTmpPath) {
            try {
              if (existingPhotoId) {
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:921", `🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
                const photoData = {
                  positionIndex
                };
                return api_heartwall.updatePhoto(existingPhotoId, photoData).catch((error) => {
                  common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:928", `❌ [爱心墙创建页] 照片 ${positionIndex} 更新失败:`, error);
                  return null;
                });
              } else {
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:933", `📤 [爱心墙创建页] 直接上传照片 ${positionIndex}（文件+元数据）...`);
                const result = await api_heartwall.uploadPhotoWithFile({
                  filePath: imagePath,
                  projectId,
                  positionIndex
                });
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:939", `✅ [爱心墙创建页] 照片 ${positionIndex} 上传成功`);
                return result;
              }
            } catch (uploadError) {
              common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:943", `❌ [爱心墙创建页] 照片 ${positionIndex} 上传失败:`, uploadError);
              return null;
            }
          } else {
            common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:948", `🔄 [爱心墙创建页] 位置 ${positionIndex} 已经是URL，不支持上传，只能更新位置信息`);
            const photoData = {
              positionIndex
            };
            if (existingPhotoId) {
              common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:956", `🔄 [爱心墙创建页] 位置 ${positionIndex} 已有照片(photoId: ${existingPhotoId})，使用更新接口`);
              return api_heartwall.updatePhoto(existingPhotoId, photoData).catch((error) => {
                common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:958", `❌ [爱心墙创建页] 照片 ${positionIndex} 更新失败:`, error);
                return null;
              });
            } else {
              common_vendor.index.__f__("warn", "at subPackages/record/pages/heartwall/create.vue:963", `⚠️ [爱心墙创建页] 位置 ${positionIndex} 是新照片但已经是URL，不支持上传`);
              common_vendor.index.showToast({
                title: "不支持上传已存在的图片URL",
                icon: "none",
                duration: 2e3
              });
              return null;
            }
          }
        });
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:975", `💾 [爱心墙创建页] 开始保存 ${savePromises.length} 张照片信息`);
        const saveResults = await Promise.all(savePromises);
        const savedCount = saveResults.filter((r) => r !== null).length;
        common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:979", `✅ [爱心墙创建页] 成功保存 ${savedCount}/${photoTasks.length} 张照片`);
        saveResults.forEach((result, index) => {
          if (result && result.data) {
            const photoId = result.data.photoId || result.data.photo_id || result.data.id;
            const photo = photoTasks[index];
            if (photoId && photo) {
              const positionIndex = photo.positionIndex || photo.index;
              if (positionIndex !== void 0 && !this.photoMap[positionIndex]) {
                this.$set(this.photoMap, positionIndex, photoId);
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:992", `📷 [爱心墙创建页] 更新照片映射: positionIndex=${positionIndex}, photoId=${photoId}`);
              } else if (positionIndex !== void 0) {
                common_vendor.index.__f__("log", "at subPackages/record/pages/heartwall/create.vue:994", `📷 [爱心墙创建页] 位置 ${positionIndex} 照片已存在(photoId: ${photoId})，无需更新映射`);
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
        common_vendor.index.__f__("error", "at subPackages/record/pages/heartwall/create.vue:1016", "❌ [爱心墙创建页] 保存项目失败:", error);
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
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_vendor.f($data.heartMask, (cell, idx, i0) => {
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
    e: common_vendor.t($options.filledCount),
    f: common_vendor.t($options.totalSlots),
    g: $options.filledCount > 0
  }, $options.filledCount > 0 ? {
    h: common_vendor.o((...args) => $options.clearAllImages && $options.clearAllImages(...args))
  } : {}, {
    i: common_vendor.t($options.remainingSlots > 0 ? `还可添加${Math.min(9, $options.remainingSlots)}张` : "已满"),
    j: common_vendor.o((...args) => $options.onBatchUpload && $options.onBatchUpload(...args)),
    k: common_vendor.o((...args) => $options.onSaveProject && $options.onSaveProject(...args)),
    l: $options.filledCount > 0
  }, $options.filledCount > 0 ? {
    m: common_vendor.o((...args) => $options.exportAsImage && $options.exportAsImage(...args))
  } : {}, {
    n: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/record/pages/heartwall/create.js.map
