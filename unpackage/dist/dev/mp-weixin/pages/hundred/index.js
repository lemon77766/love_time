"use strict";
const common_vendor = require("../../common/vendor.js");
const api_hundred = require("../../api/hundred.js");
const utils_config = require("../../utils/config.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      items: [],
      showAdd: false,
      showEdit: false,
      form: { text: "" },
      editForm: null,
      filterMode: "all",
      // 'all', 'done', 'todo', 'favorite'
      showDropdown: false,
      loading: false,
      // 加载状态
      filterOptions: [
        { label: "全部", value: "all" },
        { label: "待完成", value: "todo" },
        { label: "已完成", value: "done" },
        { label: "已收藏", value: "favorite" }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + "rpx";
    },
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
    this.getSystemInfo();
    this.loadItemsFromBackend();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
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
      this.navBarHeight = 44;
    },
    /**
     * 从后端加载任务列表
     * 包含详细的前后端连接日志
     */
    async loadItemsFromBackend() {
      var _a;
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:214", "🚀 [一百件事] ========== 开始加载任务列表 ==========");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:215", "📱 [前端] 页面初始化，准备从后端获取数据");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:216", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
      this.loading = true;
      try {
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:221", "📡 [前端] 调用 getTasks() API");
        const response = await api_hundred.getTasks();
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:224", "✅ [前端] 收到后端响应");
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:225", "📦 [响应] 原始数据:", JSON.stringify(response, null, 2));
        let tasks = [];
        if (response && response.tasks) {
          tasks = response.tasks;
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:231", `📊 [数据统计] 后端返回 ${tasks.length} 个任务`);
        } else if (Array.isArray(response)) {
          tasks = response;
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:234", `📊 [数据统计] 后端返回数组格式，共 ${tasks.length} 个任务`);
        } else {
          common_vendor.index.__f__("warn", "at pages/hundred/index.vue:236", "⚠️ [警告] 后端返回数据格式异常，使用空数组");
          tasks = [];
        }
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:241", "🔄 [数据转换] 开始转换数据格式...");
        this.items = tasks.map((task) => this.convertBackendToFrontend(task));
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:243", `✅ [数据转换] 转换完成，共 ${this.items.length} 个任务`);
        this.saveItemsToLocal();
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:248", "✅ [一百件事] ========== 任务列表加载完成 ==========");
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:249", `📊 [最终结果] 显示 ${this.items.length} 个任务`);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:250", `   - 已完成: ${this.items.filter((i) => i.done).length} 个`);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:251", `   - 待完成: ${this.items.filter((i) => !i.done).length} 个`);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:252", `   - 已收藏: ${this.items.filter((i) => i.favorite).length} 个`);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:255", "❌ [一百件事] ========== 加载任务列表失败 ==========");
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:256", "🔴 [错误] 详细信息:", error);
        const statusCode = error.statusCode || ((_a = error.data) == null ? void 0 : _a.statusCode);
        const errorMsg = error.message || error.errMsg || "";
        const errorData = error.data || {};
        const isHtmlError = typeof errorData === "string" && errorData.includes("<!doctype html>");
        if (statusCode === 404 || errorMsg.includes("404") || isHtmlError) {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:267", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:268", "❌ [错误类型] 接口不存在 (404)");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:269", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:270", "📍 [请求URL]", `${utils_config.config.baseURL}${utils_config.config.API.CHALLENGE.LIST}`);
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:271", "💡 [解决方案]");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:272", "    1. 检查后端是否已实现此接口");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:273", "    2. 确认接口路径是否正确（当前: /api/challenge/tasks）");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:274", "    3. 联系后端开发确认接口是否已部署");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:275", "    4. 如果是路径问题，可能需要修改 utils/config.js 中的配置");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:276", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else if (statusCode === 401 || errorMsg.includes("401")) {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:278", "🔐 [错误类型] 未授权 (401)");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:279", "💡 [解决方案] Token可能已过期，请重新登录");
        } else if (errorMsg.includes("timeout")) {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:281", "⏱️ [错误类型] 请求超时");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:282", "💡 [解决方案] 检查网络连接或后端服务是否正常");
        } else {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:284", "📋 [错误] 错误消息:", errorMsg || "未知错误");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:285", "📍 [错误] 可能原因:");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:286", "   1. 后端服务未启动");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:287", "   2. 网络连接问题");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:288", "   3. Token已过期");
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:289", "   4. 接口路径错误");
        }
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:293", "🔄 [降级] 尝试从本地缓存加载数据...");
        this.loadItemsFromLocal();
        common_vendor.index.showToast({
          title: "加载失败，已使用本地数据",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.loading = false;
      }
    },
    /**
     * 数据格式转换：后端格式 -> 前端格式
     * 后端: { id, taskName, status, photoUrl, isFavorited, ... }
     * 前端: { id, text, done, image, favorite, ... }
     */
    convertBackendToFrontend(task) {
      return {
        id: task.id,
        text: task.taskName || task.taskDescription || "",
        done: task.status === "completed",
        image: task.photoUrl || "",
        favorite: task.isFavorited || false,
        category: task.category || "preset",
        note: task.note || "",
        completedAt: task.completedAt || null
      };
    },
    /**
     * 数据格式转换：前端格式 -> 后端格式
     */
    convertFrontendToBackend(item) {
      return {
        taskId: item.id,
        taskName: item.text,
        completed: item.done,
        photoUrl: item.image || null,
        favorited: item.favorite
      };
    },
    /**
     * 从本地缓存加载（降级方案）
     */
    loadItemsFromLocal() {
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:341", "💾 [本地缓存] 从本地存储加载数据...");
      try {
        const data = common_vendor.index.getStorageSync("hundred_items");
        this.items = Array.isArray(data) ? data : [];
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:345", `✅ [本地缓存] 加载了 ${this.items.length} 个任务`);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:347", "❌ [本地缓存] 加载失败:", e);
        this.items = [];
      }
    },
    /**
     * 保存到本地缓存（作为备份）
     */
    saveItemsToLocal() {
      try {
        common_vendor.index.setStorageSync("hundred_items", this.items);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:358", "💾 [本地缓存] 已保存到本地存储");
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:360", "❌ [本地缓存] 保存失败:", e);
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
    /**
     * 上传图片
     * 选择图片后，更新任务完成状态并同步到后端
     */
    uploadImage(item) {
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:388", "📸 [一百件事] ========== 开始上传图片 ==========");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:389", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:397", "✅ [图片选择] 成功，临时路径:", tempFilePath);
          item.image = tempFilePath;
          try {
            common_vendor.index.__f__("log", "at pages/hundred/index.vue:404", "📡 [后端] 同步图片到服务器...");
            await this.syncTaskComplete(item, true, tempFilePath);
            common_vendor.index.__f__("log", "at pages/hundred/index.vue:406", "✅ [后端] 图片同步成功");
            common_vendor.index.showToast({ title: "图片已上传", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/hundred/index.vue:409", "❌ [后端] 图片同步失败:", error);
            common_vendor.index.showToast({ title: "图片已保存（未同步）", icon: "none" });
          }
          this.saveItemsToLocal();
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.includes("cancel")) {
            common_vendor.index.__f__("log", "at pages/hundred/index.vue:420", "ℹ️ [图片选择] 用户取消操作");
            return;
          }
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:424", "❌ [图片选择] 失败:", err);
          common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        }
      });
    },
    /**
     * 切换收藏状态
     * 同步到后端
     */
    async toggleFavorite(item) {
      const newFavoriteState = !item.favorite;
      const action = newFavoriteState ? "收藏" : "取消收藏";
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:437", `⭐ [一百件事] ========== ${action}任务 ==========`);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:438", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:439", "🔄 [状态] 当前:", item.favorite ? "已收藏" : "未收藏", "→ 新状态:", newFavoriteState ? "已收藏" : "未收藏");
      item.favorite = newFavoriteState;
      this.saveItemsToLocal();
      try {
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:446", "📡 [前端] 调用 favoriteTask() API");
        await api_hundred.favoriteTask({
          taskId: item.id,
          favorited: newFavoriteState
        });
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:452", `✅ [后端] ${action}任务成功`);
        common_vendor.index.showToast({
          title: newFavoriteState ? "已收藏" : "取消收藏",
          icon: "none",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:459", `❌ [后端] ${action}任务失败:`, error);
        item.favorite = !newFavoriteState;
        this.saveItemsToLocal();
        common_vendor.index.showToast({
          title: `${action}失败，请重试`,
          icon: "none",
          duration: 2e3
        });
      }
    },
    openEdit(item) {
      this.editForm = { ...item };
      this.showEdit = true;
    },
    closeEdit() {
      this.showEdit = false;
      this.editForm = null;
    },
    /**
     * 保存编辑
     * 注意：后端可能不支持编辑预设任务，只支持自定义任务
     */
    async saveEdit() {
      var _a;
      if (!this.editForm.text) {
        common_vendor.index.showToast({ title: "请输入内容", icon: "none" });
        return;
      }
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:489", "✏️ [一百件事] ========== 保存编辑 ==========");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:490", "📋 [任务] ID:", this.editForm.id);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:491", "📝 [内容] 旧:", (_a = this.items.find((i) => i.id === this.editForm.id)) == null ? void 0 : _a.text);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:492", "📝 [内容] 新:", this.editForm.text);
      const index = this.items.findIndex((item) => item.id === this.editForm.id);
      if (index !== -1) {
        const oldText = this.items[index].text;
        this.items[index].text = this.editForm.text;
        this.saveItemsToLocal();
        this.closeEdit();
        const item = this.items[index];
        if (item.category === "custom") {
          try {
            common_vendor.index.__f__("log", "at pages/hundred/index.vue:507", "📡 [前端] 自定义任务，尝试同步到后端...");
            common_vendor.index.__f__("log", "at pages/hundred/index.vue:510", "ℹ️ [提示] 当前后端可能不支持编辑接口，仅保存到本地");
            common_vendor.index.showToast({ title: "已保存（仅本地）", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/hundred/index.vue:513", "❌ [后端] 同步失败:", error);
            this.items[index].text = oldText;
            this.saveItemsToLocal();
            common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
          }
        } else {
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:520", "ℹ️ [提示] 预设任务仅保存到本地");
          common_vendor.index.showToast({ title: "已保存", icon: "success" });
        }
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
    /**
     * 删除任务
     * 同步到后端（仅自定义任务可删除）
     */
    async deleteItem(item) {
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:539", "🗑️ [一百件事] ========== 删除任务 ==========");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:540", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:541", "📂 [类型]", item.category || "未知");
      if (item.category === "custom") {
        try {
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:546", "📡 [前端] 调用 deleteTask() API");
          await api_hundred.deleteTask(item.id);
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:549", "✅ [后端] 删除任务成功");
          this.items = this.items.filter((it) => it.id !== item.id);
          this.saveItemsToLocal();
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/hundred/index.vue:557", "❌ [后端] 删除任务失败:", error);
          common_vendor.index.showToast({
            title: "删除失败，请重试",
            icon: "none",
            duration: 2e3
          });
        }
      } else {
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:565", "⚠️ [警告] 预设任务不能删除");
        common_vendor.index.showToast({
          title: "预设任务不能删除",
          icon: "none",
          duration: 2e3
        });
      }
    },
    /**
     * 切换完成状态
     * 同步到后端
     */
    async toggleDone(item) {
      const newDoneState = !item.done;
      const action = newDoneState ? "标记完成" : "取消完成";
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:581", `✅ [一百件事] ========== ${action}任务 ==========`);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:582", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:583", "🔄 [状态] 当前:", item.done ? "已完成" : "未完成", "→ 新状态:", newDoneState ? "已完成" : "未完成");
      item.done = newDoneState;
      this.saveItemsToLocal();
      try {
        await this.syncTaskComplete(item, newDoneState, item.image);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:591", `✅ [后端] ${action}任务成功`);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:593", `❌ [后端] ${action}任务失败:`, error);
        item.done = !newDoneState;
        this.saveItemsToLocal();
        common_vendor.index.showToast({
          title: `${action}失败，请重试`,
          icon: "none",
          duration: 2e3
        });
      }
    },
    /**
     * 同步任务完成状态到后端
     */
    async syncTaskComplete(item, completed, photoUrl = null) {
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:610", "📡 [前端] 调用 completeTask() API");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:611", "📤 [参数] taskId:", item.id, "completed:", completed, "photoUrl:", photoUrl || "无");
      await api_hundred.completeTask({
        taskId: item.id,
        completed,
        photoUrl: photoUrl || null,
        note: item.note || null
      });
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
    /**
     * 保存新任务
     * 同步到后端
     */
    async saveItem() {
      if (!this.form.text) {
        common_vendor.index.showToast({ title: "请输入内容", icon: "none" });
        return;
      }
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:634", "➕ [一百件事] ========== 添加新任务 ==========");
      common_vendor.index.__f__("log", "at pages/hundred/index.vue:635", "📝 [内容]", this.form.text);
      const taskData = {
        taskName: this.form.text,
        taskDescription: ""
      };
      try {
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:643", "📡 [前端] 调用 addTask() API");
        const response = await api_hundred.addTask(taskData);
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:646", "✅ [后端] 添加任务成功");
        common_vendor.index.__f__("log", "at pages/hundred/index.vue:647", "📦 [响应]", response);
        if (response && response.task) {
          const newTask = this.convertBackendToFrontend(response.task);
          this.items.unshift(newTask);
          common_vendor.index.__f__("log", "at pages/hundred/index.vue:653", "✅ [前端] 新任务已添加到列表，ID:", newTask.id);
        } else {
          common_vendor.index.__f__("warn", "at pages/hundred/index.vue:656", "⚠️ [警告] 后端未返回完整任务对象，创建临时对象");
          const maxId = this.items.reduce((m, it) => Math.max(m, it.id || 0), 0);
          const tempTask = {
            id: maxId + 1,
            text: this.form.text,
            done: false,
            favorite: false,
            image: "",
            category: "custom"
          };
          this.items.unshift(tempTask);
        }
        this.saveItemsToLocal();
        this.closeAdd();
        common_vendor.index.showToast({ title: "已添加", icon: "success" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/hundred/index.vue:674", "❌ [后端] 添加任务失败:", error);
        common_vendor.index.showToast({
          title: "添加失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_assets._imports_0$3,
    e: $options.progressPercent + "%",
    f: common_vendor.t($options.doneCount),
    g: common_vendor.t($options.filterText),
    h: common_vendor.t($data.showDropdown ? "▲" : "▼"),
    i: common_vendor.o((...args) => $options.toggleDropdown && $options.toggleDropdown(...args)),
    j: $data.showDropdown
  }, $data.showDropdown ? {
    k: common_vendor.f($data.filterOptions, (option, k0, i0) => {
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
    l: common_vendor.f($options.displayItems, (item, i, i0) => {
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
    m: common_vendor.o((...args) => $options.openAdd && $options.openAdd(...args)),
    n: $data.showAdd
  }, $data.showAdd ? {
    o: $data.form.text,
    p: common_vendor.o(($event) => $data.form.text = $event.detail.value),
    q: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args)),
    r: common_vendor.o((...args) => $options.saveItem && $options.saveItem(...args)),
    s: common_vendor.o(() => {
    }),
    t: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args))
  } : {}, {
    v: $data.showEdit
  }, $data.showEdit ? {
    w: $data.editForm.text,
    x: common_vendor.o(($event) => $data.editForm.text = $event.detail.value),
    y: common_vendor.o(($event) => $options.confirmDelete($data.editForm)),
    z: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args)),
    A: common_vendor.o((...args) => $options.saveEdit && $options.saveEdit(...args)),
    B: common_vendor.o(() => {
    }),
    C: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args))
  } : {}, {
    D: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/hundred/index.js.map
