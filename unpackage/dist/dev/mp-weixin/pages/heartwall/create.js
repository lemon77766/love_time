"use strict";
const common_vendor = require("../../common/vendor.js");
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
      editingIndex: null
      // 正在编辑的项目索引，null 表示创建新项目
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
  mounted() {
    try {
      const editingIndex = common_vendor.index.getStorageSync("heartwall_editing_index");
      if (editingIndex !== null && editingIndex !== void 0 && editingIndex !== "") {
        this.editingIndex = Number(editingIndex);
      }
      const cached = common_vendor.index.getStorageSync("heartwall_grid_images");
      if (Array.isArray(cached)) {
        this.images = cached;
      }
    } catch (e) {
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
        common_vendor.index.__f__("error", "at pages/heartwall/create.vue:142", "批量上传失败:", e);
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
    clearAllImages() {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有照片吗？",
        success: (res) => {
          if (res.confirm) {
            this.images = [];
            this.persist();
            common_vendor.index.showToast({ title: "已清空", icon: "success" });
          }
        }
      });
    },
    async onPickSingle(idx) {
      if (!this.heartMask[idx])
        return;
      try {
        const res = await common_vendor.index.chooseImage({ count: 1 });
        if (res && res.tempFilePaths && res.tempFilePaths[0]) {
          this.$set(this.images, idx, res.tempFilePaths[0]);
          this.persist();
        }
      } catch (e) {
      }
    },
    onInvite() {
      common_vendor.index.showToast({ title: "邀请功能待接入后端", icon: "none" });
    },
    // 保存项目到列表页
    onSaveProject() {
      if (this.filledCount === 0) {
        common_vendor.index.showToast({ title: "请至少添加一张照片", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: this.editingIndex !== null ? "保存修改" : "保存项目",
        content: "请输入创建人名称",
        editable: true,
        placeholderText: "输入你的名字",
        success: (res) => {
          if (res.confirm) {
            const creator = res.content || "匿名用户";
            this.saveProjectData(creator);
          }
        }
      });
    },
    // 保存项目数据
    saveProjectData(creator) {
      let cover = "";
      for (let i = 0; i < this.heartMask.length; i++) {
        if (this.heartMask[i] && this.images[i]) {
          cover = this.images[i];
          break;
        }
      }
      const projectData = {
        cover,
        creator,
        progress: this.filledCount,
        total: this.totalSlots,
        createdAt: (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).replace(/\//g, "-"),
        images: this.images,
        heartMask: this.heartMask
      };
      try {
        const projects = common_vendor.index.getStorageSync("heartwall_projects") || [];
        const projectsList = Array.isArray(projects) ? projects : [];
        if (this.editingIndex !== null && this.editingIndex >= 0) {
          projectsList[this.editingIndex] = projectData;
        } else {
          projectsList.unshift(projectData);
        }
        common_vendor.index.setStorageSync("heartwall_projects", projectsList);
        common_vendor.index.removeStorageSync("heartwall_editing_index");
        common_vendor.index.removeStorageSync("heartwall_grid_images");
        common_vendor.index.showToast({
          title: this.editingIndex !== null ? "修改成功" : "保存成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (e) {
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
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
    },
    goBack() {
      common_vendor.index.removeStorageSync("heartwall_editing_index");
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_vendor.f($data.heartMask, (cell, idx, i0) => {
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
    c: common_vendor.t($options.filledCount),
    d: common_vendor.t($options.totalSlots),
    e: $options.filledCount > 0
  }, $options.filledCount > 0 ? {
    f: common_vendor.o((...args) => $options.clearAllImages && $options.clearAllImages(...args))
  } : {}, {
    g: common_vendor.t($options.remainingSlots > 0 ? `还可添加${Math.min(9, $options.remainingSlots)}张` : "已满"),
    h: common_vendor.o((...args) => $options.onBatchUpload && $options.onBatchUpload(...args)),
    i: common_vendor.o((...args) => $options.onSaveProject && $options.onSaveProject(...args)),
    j: common_vendor.o((...args) => $options.onSaveImage && $options.onSaveImage(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/heartwall/create.js.map
