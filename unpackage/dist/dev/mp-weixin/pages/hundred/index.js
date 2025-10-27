"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      items: [],
      showAdd: false,
      showEdit: false,
      form: { text: "" },
      editForm: null,
      filterMode: "all",
      // 'all', 'done', 'todo', 'favorite'
      showDropdown: false,
      filterOptions: [
        { label: "全部", value: "all" },
        { label: "待完成", value: "todo" },
        { label: "已完成", value: "done" },
        { label: "已收藏", value: "favorite" }
      ]
    };
  },
  computed: {
    doneCount() {
      return this.items.filter((item) => item.done).length;
    },
    progressPercent() {
      return this.items.length > 0 ? this.doneCount / 100 * 100 : 0;
    },
    displayItems() {
      if (this.filterMode === "done")
        return this.items.filter((item) => item.done);
      if (this.filterMode === "todo")
        return this.items.filter((item) => !item.done);
      if (this.filterMode === "favorite")
        return this.items.filter((item) => item.favorite);
      return this.items;
    },
    filterText() {
      if (this.filterMode === "all")
        return "全部";
      if (this.filterMode === "done")
        return "已完成";
      if (this.filterMode === "todo")
        return "待完成";
      if (this.filterMode === "favorite")
        return "已收藏";
      return "全部";
    }
  },
  mounted() {
    this.loadItems();
    if (this.items.length === 0) {
      this.items = [
        { id: 1, text: "一起看日出", image: "", done: false, favorite: false },
        { id: 2, text: "一起看日落", image: "", done: false, favorite: false },
        { id: 3, text: "一起去教堂", image: "", done: false, favorite: false },
        { id: 4, text: "一起看星星", image: "", done: false, favorite: false },
        { id: 5, text: "一起看电影", image: "", done: false, favorite: false },
        { id: 6, text: "一起牵手逛街", image: "", done: false, favorite: false },
        { id: 7, text: "一起做饭", image: "", done: false, favorite: false },
        { id: 8, text: "一起逛超市", image: "", done: false, favorite: false },
        { id: 9, text: "一起逛家", image: "", done: false, favorite: false },
        { id: 10, text: "一起看相声", image: "", done: false, favorite: false },
        { id: 11, text: "一起打黑", image: "", done: false, favorite: false },
        { id: 12, text: "一起躺雨", image: "", done: false, favorite: false }
      ];
      this.saveItems();
    }
  },
  methods: {
    loadItems() {
      try {
        const data = common_vendor.index.getStorageSync("hundred_items");
        this.items = Array.isArray(data) ? data : [];
      } catch (e) {
        this.items = [];
      }
    },
    saveItems() {
      try {
        common_vendor.index.setStorageSync("hundred_items", this.items);
      } catch (e) {
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    selectFilter(value) {
      this.filterMode = value;
      this.showDropdown = false;
      const tips = {
        "all": "显示全部事件",
        "todo": "显示待完成事件",
        "done": "显示已完成事件",
        "favorite": "显示已收藏事件"
      };
      common_vendor.index.showToast({
        title: tips[value],
        icon: "none",
        duration: 1500
      });
    },
    uploadImage(item) {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          item.image = tempFilePath;
          this.saveItems();
          common_vendor.index.showToast({ title: "图片已上传", icon: "success" });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:195", "选择图片失败:", err);
          common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        }
      });
    },
    toggleFavorite(item) {
      item.favorite = !item.favorite;
      this.saveItems();
      common_vendor.index.showToast({
        title: item.favorite ? "已收藏" : "取消收藏",
        icon: "none",
        duration: 1500
      });
    },
    openEdit(item) {
      this.editForm = { ...item };
      this.showEdit = true;
    },
    closeEdit() {
      this.showEdit = false;
      this.editForm = null;
    },
    saveEdit() {
      if (!this.editForm.text) {
        common_vendor.index.showToast({ title: "请输入内容", icon: "none" });
        return;
      }
      const index = this.items.findIndex((item) => item.id === this.editForm.id);
      if (index !== -1) {
        this.items[index].text = this.editForm.text;
        this.saveItems();
        this.closeEdit();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      }
    },
    confirmDelete(item) {
      common_vendor.index.showModal({
        title: "删除确认",
        content: `确定删除“${item.text}”吗？`,
        confirmText: "删除",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm)
            this.deleteItem(item);
        }
      });
    },
    deleteItem(item) {
      this.items = this.items.filter((it) => it.id !== item.id);
      this.saveItems();
      common_vendor.index.showToast({ title: "已删除", icon: "none" });
    },
    toggleDone(item) {
      item.done = !item.done;
      this.saveItems();
    },
    openCatalog() {
      this.showCatalog = true;
    },
    closeCatalog() {
      this.showCatalog = false;
    },
    openAdd() {
      this.showAdd = true;
    },
    closeAdd() {
      this.showAdd = false;
      this.form.text = "";
    },
    saveItem() {
      if (!this.form.text) {
        common_vendor.index.showToast({ title: "请输入内容", icon: "none" });
        return;
      }
      const id = this.items.reduce((m, it) => Math.max(m, it.id || 0), 0) + 1;
      this.items.unshift({ id, text: this.form.text, icon: "", done: false, favorite: false });
      this.saveItems();
      this.closeAdd();
      common_vendor.index.showToast({ title: "已添加", icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$4,
    b: $options.progressPercent + "%",
    c: common_vendor.t($options.doneCount),
    d: common_vendor.t($options.filterText),
    e: common_vendor.t($data.showDropdown ? "▲" : "▼"),
    f: common_vendor.o((...args) => $options.toggleDropdown && $options.toggleDropdown(...args)),
    g: $data.showDropdown
  }, $data.showDropdown ? {
    h: common_vendor.f($data.filterOptions, (option, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option.label),
        b: $data.filterMode === option.value
      }, $data.filterMode === option.value ? {} : {}, {
        c: option.value,
        d: $data.filterMode === option.value ? 1 : "",
        e: common_vendor.o(($event) => $options.selectFilter(option.value), option.value)
      });
    })
  } : {}, {
    i: common_vendor.f($options.displayItems, (item, i, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.favorite ? "★" : "☆"),
        b: item.favorite ? 1 : "",
        c: common_vendor.o(($event) => $options.toggleFavorite(item), item.id),
        d: item.image
      }, item.image ? {
        e: item.image
      } : {}, {
        f: common_vendor.o(($event) => $options.uploadImage(item), item.id),
        g: common_vendor.t(item.text),
        h: item.done ? 1 : "",
        i: common_vendor.o(($event) => $options.toggleDone(item), item.id),
        j: common_vendor.o(($event) => $options.openEdit(item), item.id),
        k: item.id
      });
    }),
    j: common_vendor.o((...args) => $options.openAdd && $options.openAdd(...args)),
    k: $data.showAdd
  }, $data.showAdd ? {
    l: $data.form.text,
    m: common_vendor.o(($event) => $data.form.text = $event.detail.value),
    n: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args)),
    o: common_vendor.o((...args) => $options.saveItem && $options.saveItem(...args)),
    p: common_vendor.o(() => {
    }),
    q: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args))
  } : {}, {
    r: $data.showEdit
  }, $data.showEdit ? {
    s: $data.editForm.text,
    t: common_vendor.o(($event) => $data.editForm.text = $event.detail.value),
    v: common_vendor.o(($event) => $options.confirmDelete($data.editForm)),
    w: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args)),
    x: common_vendor.o((...args) => $options.saveEdit && $options.saveEdit(...args)),
    y: common_vendor.o(() => {
    }),
    z: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hundred/index.js.map
