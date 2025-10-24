"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      items: [],
      showCatalog: false,
      showAdd: false,
      form: { text: "" }
    };
  },
  mounted() {
    this.loadItems();
    if (this.items.length === 0) {
      this.items = [
        { id: 1, text: "用对方照片做壁纸", icon: "/static/hundred/wallpaper.png", done: false },
        { id: 2, text: "给对方点下午茶", icon: "/static/hundred/tea.png", done: true },
        { id: 3, text: "互相发动态宣言", icon: "/static/hundred/post.png", done: false },
        { id: 4, text: "视频时截屏记录", icon: "/static/hundred/screenshot.png", done: true },
        { id: 5, text: "一起戴头饰过圣诞", icon: "/static/hundred/christmas.png", done: false }
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
      this.items.unshift({ id, text: this.form.text, icon: "", done: false });
      this.saveItems();
      this.closeAdd();
      common_vendor.index.showToast({ title: "已添加", icon: "none" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$4,
    b: common_vendor.f($data.items, (item, i, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.done ? "已完成" : "待完成"),
        b: common_vendor.n(item.done ? "stamp-done" : "stamp-todo"),
        c: common_vendor.o(($event) => $options.confirmDelete(item), item.id),
        d: item.icon
      }, item.icon ? {
        e: item.icon
      } : {}, {
        f: common_vendor.t(item.text),
        g: item.id,
        h: item.done ? 1 : "",
        i: common_vendor.o(($event) => $options.toggleDone(item), item.id),
        j: common_vendor.o(($event) => $options.confirmDelete(item), item.id)
      });
    }),
    c: $data.items.length === 0
  }, $data.items.length === 0 ? {} : {}, {
    d: common_vendor.o((...args) => $options.openCatalog && $options.openCatalog(...args)),
    e: common_vendor.o((...args) => $options.openAdd && $options.openAdd(...args)),
    f: $data.showCatalog
  }, $data.showCatalog ? {
    g: common_vendor.f($data.items.filter((x) => x.done), (it, k0, i0) => {
      return {
        a: common_vendor.t(it.text),
        b: it.id
      };
    }),
    h: common_vendor.f($data.items.filter((x) => !x.done), (it, k0, i0) => {
      return {
        a: common_vendor.t(it.text),
        b: it.id
      };
    }),
    i: common_vendor.o((...args) => $options.closeCatalog && $options.closeCatalog(...args)),
    j: common_vendor.o(() => {
    }),
    k: common_vendor.o((...args) => $options.closeCatalog && $options.closeCatalog(...args))
  } : {}, {
    l: $data.showAdd
  }, $data.showAdd ? {
    m: $data.form.text,
    n: common_vendor.o(($event) => $data.form.text = $event.detail.value),
    o: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args)),
    p: common_vendor.o((...args) => $options.saveItem && $options.saveItem(...args)),
    q: common_vendor.o(() => {
    }),
    r: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hundred/index.js.map
