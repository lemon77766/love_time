"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_hundred = require("../../../../api/hundred.js");
const utils_config = require("../../../../utils/config.js");
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
      ],
      // 记录弹窗相关
      showRecordModal: false,
      recordModal: {
        mode: "add",
        // 'add' | 'edit'
        taskId: null,
        photoUrl: "",
        completedDate: "",
        completedTime: "",
        location: "",
        weather: "",
        feeling: ""
      },
      // 详情弹窗相关
      showDetailModal: false,
      detailModal: {},
      // 预设选项
      weatherOptions: ["晴天", "多云", "阴天", "小雨", "中雨", "大雨", "雪天", "雾天", "大风", "其他"]
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
    },
    onImageError(e) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:300", "------图片加载失败:", e);
    }
  },
  mounted() {
    this.getSystemInfo();
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    const isGuest = !loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn;
    if (isGuest) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:314", "👤 游客模式：使用默认事件列表");
      this.useGuestMode();
    } else {
      try {
        this.loadItemsFromBackend();
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:321", "加载服务器数据失败:", error);
        this.useGuestMode();
      }
    }
  },
  methods: {
    // 游客模式：使用默认数据
    useGuestMode() {
      this.items = [
        { id: 1, text: "一起看日出", completed: false, image: "", favorite: false },
        { id: 2, text: "一起做一顿饭", completed: false, image: "", favorite: false },
        { id: 3, text: "一起看电影", completed: false, image: "", favorite: false },
        { id: 4, text: "一起逛公园", completed: false, image: "", favorite: false },
        { id: 5, text: "一起旅行", completed: false, image: "", favorite: false },
        { id: 6, text: "一起拍合照", completed: false, image: "", favorite: false }
      ];
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:340", "✅ 游客模式初始化完成");
    },
    // 检查是否需要登录
    checkLoginRequired() {
      const loginInfo = common_vendor.index.getStorageSync("login_info");
      if (!loginInfo || loginInfo.isGuest || !loginInfo.isLoggedIn) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "该功能需要登录后才能使用，是否前往登录？\n\n您仍然可以继续浏览页面功能。",
          confirmText: "去登录",
          cancelText: "继续浏览",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateTo({
                url: "/pages/login/index"
              });
            }
          }
        });
        return false;
      }
      return true;
    },
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
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:412", "🚀 [一百件事] ========== 开始加载任务列表 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:413", "📱 [前端] 页面初始化，准备从后端获取数据");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:414", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
      this.loading = true;
      try {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:419", "📡 [前端] 调用 getTasks() API");
        const response = await api_hundred.getTasks();
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:422", "✅ [前端] 收到后端响应");
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:423", "📦 [响应] 原始数据:", JSON.stringify(response, null, 2));
        let tasks = [];
        if (response && response.tasks) {
          tasks = response.tasks;
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:429", `📊 [数据统计] 后端返回 ${tasks.length} 个任务`);
        } else if (Array.isArray(response)) {
          tasks = response;
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:432", `📊 [数据统计] 后端返回数组格式，共 ${tasks.length} 个任务`);
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/hundred/index.vue:434", "⚠️ [警告] 后端返回数据格式异常，使用空数组");
          tasks = [];
        }
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:439", "🔄 [数据转换] 开始转换数据格式...");
        this.items = tasks.map((task) => this.convertBackendToFrontend(task));
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:441", `✅ [数据转换] 转换完成，共 ${this.items.length} 个任务`);
        this.saveItemsToLocal();
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:446", "✅ [一百件事] ========== 任务列表加载完成 ==========");
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:447", `📊 [最终结果] 显示 ${this.items.length} 个任务`);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:448", `   - 已完成: ${this.items.filter((i) => i.done).length} 个`);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:449", `   - 待完成: ${this.items.filter((i) => !i.done).length} 个`);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:450", `   - 已收藏: ${this.items.filter((i) => i.favorite).length} 个`);
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:453", "❌ [一百件事] ========== 加载任务列表失败 ==========");
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:454", "🔴 [错误] 详细信息:", error);
        const statusCode = error.statusCode || ((_a = error.data) == null ? void 0 : _a.statusCode);
        const errorMsg = error.message || error.errMsg || "";
        const errorData = error.data || {};
        const isHtmlError = typeof errorData === "string" && errorData.includes("<!doctype html>");
        const isUserNotFoundError = errorMsg.includes("用户不存在");
        if (statusCode === 404 || errorMsg.includes("404") || isHtmlError) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:468", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          if (isUserNotFoundError) {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:470", '❌ [错误类型] 接口不存在 (404) - 后端返回"用户不存在"');
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:471", "⚠️ 注意：这可能是后端接口未实现导致的通用错误消息");
          } else {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:473", "❌ [错误类型] 接口不存在 (404)");
          }
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:475", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:476", "📍 [请求URL]", `${utils_config.config.baseURL}${utils_config.config.API.CHALLENGE.LIST}`);
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:477", "💡 [解决方案]");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:478", "    1. 检查后端是否已实现此接口");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:479", "    2. 确认接口路径是否正确（当前: /api/challenge/tasks）");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:480", "    3. 联系后端开发确认接口是否已部署");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:481", "    4. 如果是路径问题，可能需要修改 utils/config.js 中的配置");
          if (isUserNotFoundError) {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:483", '    5. 如果后端已实现接口但仍返回"用户不存在"，请检查：');
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:484", "       - Token是否有效");
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:485", "       - 后端用户认证逻辑是否正确");
          }
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:487", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else if (statusCode === 401 || errorMsg.includes("401")) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:489", "🔐 [错误类型] 未授权 (401)");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:490", "💡 [解决方案] Token可能已过期，请重新登录");
        } else if (errorMsg.includes("timeout")) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:492", "⏱️ [错误类型] 请求超时");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:493", "💡 [解决方案] 检查网络连接或后端服务是否正常");
        } else if (isUserNotFoundError && statusCode !== 404) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:496", "🔐 [错误类型] 用户不存在");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:497", "💡 [解决方案] 用户信息可能已失效，请重新登录");
        } else {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:499", "📋 [错误] 错误消息:", errorMsg || "未知错误");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:500", "📍 [错误] 可能原因:");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:501", "   1. 后端服务未启动");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:502", "   2. 网络连接问题");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:503", "   3. Token已过期");
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:504", "   4. 接口路径错误");
        }
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:508", "🔄 [降级] 尝试从本地缓存加载数据...");
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
    onImageLoad(e) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:521", "✅ 图片加载成功:", e.detail);
    },
    /**
     * 数据格式转换：后端格式 -> 前端格式
     * 后端: { id, taskName, status, photoUrl, isFavorited, ... }
     * 前端: { id, text, done, image, favorite, ... }
     */
    convertBackendToFrontend(task) {
      const record = task.userRecord || task.user_record || task.record || task.taskRecord || task.task_record || null;
      const rawPhoto = (record == null ? void 0 : record.photoUrl) || (record == null ? void 0 : record.photo_url) || (record == null ? void 0 : record.photo) || (record == null ? void 0 : record.photoPath) || (record == null ? void 0 : record.photo_path) || task.photoUrl || task.photo_url || task.photo || task.photoPath || task.photo_path || (typeof (record == null ? void 0 : record.photo) === "object" ? record.photo.url || record.photo.fullUrl || record.photo.path : typeof task.photo === "object" ? task.photo.url || task.photo.fullUrl || task.photo.path : null);
      const status = (record == null ? void 0 : record.status) || task.status || task.completedStatus || "";
      const completedFlag = typeof status === "string" ? status.toLowerCase() === "completed" || status.toLowerCase() === "done" : Boolean(status);
      const hasDetailedRecord = record && (record.location || record.completedDate || record.completedTime || record.feeling || record.weather || record.rating || record.tags && record.tags.length > 0);
      return {
        id: task.id,
        text: task.taskName || task.taskDescription || "",
        done: completedFlag || (record == null ? void 0 : record.completed) === true || task.completed === true,
        image: this.normalizePhotoUrl(rawPhoto),
        favorite: (record == null ? void 0 : record.isFavorited) ?? (record == null ? void 0 : record.favorited) ?? task.isFavorited ?? false,
        category: task.category || "preset",
        note: (record == null ? void 0 : record.note) || task.note || "",
        completedAt: (record == null ? void 0 : record.completedAt) || task.completedAt || null,
        hasRecord: hasDetailedRecord || Boolean(record == null ? void 0 : record.note),
        // 是否有详细记录
        // 详细记录字段
        location: (record == null ? void 0 : record.location) || "",
        completedDate: (record == null ? void 0 : record.completedDate) || "",
        completedTime: (record == null ? void 0 : record.completedTime) || "",
        feeling: (record == null ? void 0 : record.feeling) || "",
        weather: (record == null ? void 0 : record.weather) || "",
        tags: (record == null ? void 0 : record.tags) || [],
        rating: (record == null ? void 0 : record.rating) || 0
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
        photoUrl: this.stripBaseFromPhotoUrl(item.image),
        favorited: item.favorite
      };
    },
    normalizePhotoUrl(url) {
      if (!url)
        return "";
      if (Array.isArray(url)) {
        url = url[0];
      }
      if (typeof url === "object") {
        url = url.url || url.fullUrl || url.path || url.previewUrl || "";
      }
      if (!url)
        return "";
      if (/^https?:\/\//i.test(url)) {
        return url;
      }
      const base = utils_config.config.baseURL.replace(/\/$/, "");
      if (!base) {
        return url;
      }
      if (url.startsWith("/")) {
        return `${base}${url}`;
      }
      return `${base}/${url}`;
    },
    stripBaseFromPhotoUrl(url) {
      if (!url)
        return null;
      const base = utils_config.config.baseURL.replace(/\/$/, "");
      if (base && url.startsWith(base)) {
        const stripped = url.slice(base.length);
        return stripped.startsWith("/") ? stripped : `/${stripped}`;
      }
      return url;
    },
    /**
     * 从本地缓存加载（降级方案）
     */
    loadItemsFromLocal() {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:639", "💾 [本地缓存] 从本地存储加载数据...");
      try {
        const data = common_vendor.index.getStorageSync("hundred_items");
        this.items = Array.isArray(data) ? data : [];
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:643", `✅ [本地缓存] 加载了 ${this.items.length} 个任务`);
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:645", "❌ [本地缓存] 加载失败:", e);
        this.items = [];
      }
    },
    /**
     * 保存到本地缓存（作为备份）
     */
    saveItemsToLocal() {
      try {
        common_vendor.index.setStorageSync("hundred_items", this.items);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:656", "💾 [本地缓存] 已保存到本地存储");
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:658", "❌ [本地缓存] 保存失败:", e);
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
      if (!this.checkLoginRequired()) {
        return;
      }
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:691", "📸 [一百件事] ========== 开始上传图片 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:692", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          var _a, _b;
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:700", "✅ [图片选择] 成功，临时路径:", tempFilePath);
          const previousImage = item.image;
          const previousDoneState = item.done;
          item.image = tempFilePath;
          this.saveItemsToLocal();
          let loadingShown = false;
          try {
            common_vendor.index.showLoading({
              title: "上传中...",
              mask: true
            });
            loadingShown = true;
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:717", "📡 [后端] 上传图片到服务器...");
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:718", "📤 [上传参数] 文件路径:", tempFilePath);
            const uploadResult = await api_hundred.uploadChallengePhoto(tempFilePath);
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:722", "📥 [上传结果] 完整响应:", uploadResult);
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:723", "📥 [上传结果] 数据类型:", typeof uploadResult);
            const uploadedPhotoUrl = uploadResult == null ? void 0 : uploadResult.photoUrl;
            const successMessage = (uploadResult == null ? void 0 : uploadResult.message) || "图片已上传";
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:728", "🖼️ [图片URL] 提取结果:", uploadedPhotoUrl);
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:729", "💬 [成功消息] 提取结果:", successMessage);
            if (uploadedPhotoUrl) {
              common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:732", "💾 [本地更新] 更新图片URL:", uploadedPhotoUrl);
              item.image = uploadedPhotoUrl;
            } else {
              common_vendor.index.__f__("warn", "at subPackages/interaction/pages/hundred/index.vue:735", "⚠️ [警告] 未获取到图片URL，使用临时路径");
            }
            item.done = true;
            this.saveItemsToLocal();
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:741", "🔄 [同步] 开始同步任务完成状态到后端");
            await this.syncTaskComplete(item, true, uploadedPhotoUrl);
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:743", "✅ [后端] 图片同步成功");
            if (loadingShown) {
              common_vendor.index.hideLoading();
              loadingShown = false;
            }
            const toastTitle = successMessage && successMessage.length <= 7 ? successMessage : "图片已上传";
            common_vendor.index.showToast({ title: toastTitle, icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:753", "❌ [后端] 图片上传或同步失败:", error);
            item.image = previousImage;
            item.done = previousDoneState;
            this.saveItemsToLocal();
            if (loadingShown) {
              common_vendor.index.hideLoading();
              loadingShown = false;
            }
            const statusCode = (error == null ? void 0 : error.statusCode) || ((_a = error == null ? void 0 : error.data) == null ? void 0 : _a.statusCode);
            const errorMsg = (error == null ? void 0 : error.message) || (error == null ? void 0 : error.errMsg) || "";
            const isHtmlError = typeof (error == null ? void 0 : error.data) === "string" && ((_b = error == null ? void 0 : error.data) == null ? void 0 : _b.includes("<!doctype html>"));
            let toastTitle = "图片上传失败，请稍后重试";
            if (statusCode === 404 || errorMsg.includes("404") || isHtmlError) {
              toastTitle = "上传接口不存在，请联系管理员";
            } else if (statusCode === 401 || errorMsg.includes("401")) {
              toastTitle = "登录信息已过期，请重新登录";
            } else if (errorMsg.includes("timeout")) {
              toastTitle = "上传超时，请检查网络";
            } else if (errorMsg) {
              toastTitle = errorMsg.length <= 10 ? errorMsg : "图片上传失败";
            }
            common_vendor.index.showToast({ title: toastTitle, icon: "none" });
          } finally {
            if (loadingShown) {
              common_vendor.index.hideLoading();
            }
          }
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.includes("cancel")) {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:792", "ℹ️ [图片选择] 用户取消操作");
            return;
          }
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:796", "❌ [图片选择] 失败:", err);
          common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        }
      });
    },
    /**
     * 切换收藏状态
     * 同步到后端
     */
    async toggleFavorite(item) {
      if (!this.checkLoginRequired()) {
        return;
      }
      const newFavoriteState = !item.favorite;
      const action = newFavoriteState ? "收藏" : "取消收藏";
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:814", `⭐ [一百件事] ========== ${action}任务 ==========`);
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:815", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:816", "🔄 [状态] 当前:", item.favorite ? "已收藏" : "未收藏", "→ 新状态:", newFavoriteState ? "已收藏" : "未收藏");
      item.favorite = newFavoriteState;
      this.saveItemsToLocal();
      try {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:823", "📡 [前端] 调用 favoriteTask() API");
        await api_hundred.favoriteTask({
          taskId: item.id,
          favorited: newFavoriteState
        });
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:829", `✅ [后端] ${action}任务成功`);
        common_vendor.index.showToast({
          title: newFavoriteState ? "已收藏" : "取消收藏",
          icon: "none",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:836", `❌ [后端] ${action}任务失败:`, error);
        item.favorite = !newFavoriteState;
        this.saveItemsToLocal();
        common_vendor.index.showToast({
          title: `${action}失败，请重试`,
          icon: "none",
          duration: 2e3
        });
      }
    },
    /**
     * 删除事件
     */
    async deleteEvent(item) {
      if (!this.checkLoginRequired()) {
        return;
      }
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:858", "🗑️ [一百件事] ========== 删除事件 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:859", "📋 [任务] ID:", item.id, "名称:", item.text);
      const confirmResult = await new Promise((resolve) => {
        common_vendor.index.showModal({
          title: "确认删除",
          content: `确定要删除"${item.text}"吗？

删除后将无法恢复，包括相关的照片和记录。`,
          confirmText: "确定删除",
          cancelText: "取消",
          success: (res) => {
            resolve(res.confirm);
          }
        });
      });
      if (!confirmResult) {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:875", "❌ [用户] 取消删除");
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "删除中...",
          mask: true
        });
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:886", "📡 [前端] 调用 deleteTask() API");
        await api_hundred.deleteTask(item.id);
        const index = this.items.findIndex((i) => i.id === item.id);
        if (index > -1) {
          this.items.splice(index, 1);
        }
        this.saveItemsToLocal();
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:899", "✅ [后端] 删除事件成功");
        common_vendor.index.showToast({
          title: "删除成功",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:908", "❌ [后端] 删除事件失败:", error);
        common_vendor.index.showToast({
          title: "删除失败，请重试",
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
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:935", "✏️ [一百件事] ========== 保存编辑 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:936", "📋 [任务] ID:", this.editForm.id);
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:937", "📝 [内容] 旧:", (_a = this.items.find((i) => i.id === this.editForm.id)) == null ? void 0 : _a.text);
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:938", "📝 [内容] 新:", this.editForm.text);
      const index = this.items.findIndex((item) => item.id === this.editForm.id);
      if (index !== -1) {
        const oldText = this.items[index].text;
        this.items[index].text = this.editForm.text;
        this.saveItemsToLocal();
        this.closeEdit();
        const item = this.items[index];
        if (item.category === "custom") {
          try {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:953", "📡 [前端] 自定义任务，尝试同步到后端...");
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:956", "ℹ️ [提示] 当前后端可能不支持编辑接口，仅保存到本地");
            common_vendor.index.showToast({ title: "已保存（仅本地）", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:959", "❌ [后端] 同步失败:", error);
            this.items[index].text = oldText;
            this.saveItemsToLocal();
            common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
          }
        } else {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:966", "ℹ️ [提示] 预设任务仅保存到本地");
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
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:985", "🗑️ [一百件事] ========== 删除任务 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:986", "📋 [任务] ID:", item.id, "名称:", item.text);
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:987", "📂 [类型]", item.category || "未知");
      if (item.category === "custom") {
        try {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:992", "📡 [前端] 调用 deleteTask() API");
          await api_hundred.deleteTask(item.id);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:995", "✅ [后端] 删除任务成功");
          this.items = this.items.filter((it) => it.id !== item.id);
          this.saveItemsToLocal();
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1003", "❌ [后端] 删除任务失败:", error);
          common_vendor.index.showToast({
            title: "删除失败，请重试",
            icon: "none",
            duration: 2e3
          });
        }
      } else {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1011", "⚠️ [警告] 预设任务不能删除");
        common_vendor.index.showToast({
          title: "预设任务不能删除",
          icon: "none",
          duration: 2e3
        });
      }
    },
    /**
     * 处理事件点击 - 统一的点击处理方法
     * 点击事件任何地方都会触发时间记录弹窗
     */
    handleEventClick(item) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1024", "🖱️ [事件点击] 点击了事件:", item.text, "状态:", item.done ? "已完成" : "未完成");
      if (item.done) {
        if (item.hasRecord) {
          this.openRecordDetail(item);
        } else {
          this.openRecordModal(item);
        }
      } else {
        this.openRecordModal(item);
      }
    },
    /**
     * 切换完成状态
     * 如果标记为完成，打开记录弹窗；如果取消完成，直接更新状态
     */
    async toggleDone(item) {
      const newDoneState = !item.done;
      if (newDoneState) {
        this.openRecordModal(item);
      } else {
        const action = "取消完成";
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1054", `✅ [一百件事] ========== ${action}任务 ==========`);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1055", "📋 [任务] ID:", item.id, "名称:", item.text);
        item.done = false;
        item.hasRecord = false;
        this.saveItemsToLocal();
        try {
          await this.syncTaskComplete(item, false, item.image);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1064", `✅ [后端] ${action}任务成功`);
          common_vendor.index.showToast({ title: "已取消完成", icon: "success" });
        } catch (error) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1067", `❌ [后端] ${action}任务失败:`, error);
          item.done = true;
          this.saveItemsToLocal();
          common_vendor.index.showToast({
            title: `${action}失败，请重试`,
            icon: "none",
            duration: 2e3
          });
        }
      }
    },
    /**
     * 同步任务完成状态到后端
     */
    async syncTaskComplete(item, completed, photoUrl = null) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1085", "📡 [前端] 调用 completeTask() API");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1086", "📤 [参数] taskId:", item.id, "completed:", completed, "photoUrl:", photoUrl || "无");
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
      if (!this.checkLoginRequired()) {
        return;
      }
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
      if (!this.checkLoginRequired()) {
        return;
      }
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1120", "➕ [一百件事] ========== 添加新任务 ==========");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1121", "📝 [内容]", this.form.text);
      const taskData = {
        taskName: this.form.text,
        taskDescription: ""
      };
      try {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1129", "📡 [前端] 调用 addTask() API");
        const response = await api_hundred.addTask(taskData);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1132", "✅ [后端] 添加任务成功");
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1133", "📦 [响应]", response);
        if (response && response.task) {
          const newTask = this.convertBackendToFrontend(response.task);
          this.items.unshift(newTask);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1139", "✅ [前端] 新任务已添加到列表，ID:", newTask.id);
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/hundred/index.vue:1142", "⚠️ [警告] 后端未返回完整任务对象，创建临时对象");
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
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1160", "❌ [后端] 添加任务失败:", error);
        common_vendor.index.showToast({
          title: "添加失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // ===== 记录弹窗相关方法 =====
    /**
     * 打开记录弹窗（添加模式）
     */
    openRecordModal(item) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1175", "📝 [记录] 打开完成记录弹窗:", item.text);
      const now = /* @__PURE__ */ new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);
      this.recordModal = {
        mode: "add",
        taskId: item.id,
        photoUrl: item.image || "",
        completedDate: item.completedDate || date,
        completedTime: item.completedTime || time,
        location: item.location || "",
        weather: item.weather || "",
        feeling: item.feeling || ""
      };
      this.showRecordModal = true;
    },
    /**
     * 关闭记录弹窗
     */
    closeRecordModal() {
      this.showRecordModal = false;
      this.recordModal = {
        mode: "add",
        taskId: null,
        photoUrl: "",
        completedDate: "",
        completedTime: "",
        location: "",
        weather: "",
        feeling: "",
        note: "",
        tags: [],
        rating: 0
      };
    },
    /**
     * 打开记录详情
     */
    openRecordDetail(item) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1220", "📖 [记录] 查看记录详情:", item.text);
      this.detailModal = {
        taskId: item.id,
        taskName: item.text,
        photoUrl: item.image || "",
        completedDate: item.completedDate || "",
        completedTime: item.completedTime || "",
        location: item.location || "",
        weather: item.weather || "",
        feeling: item.feeling || ""
      };
      this.showDetailModal = true;
    },
    /**
     * 关闭详情弹窗
     */
    closeDetailModal() {
      this.showDetailModal = false;
      this.detailModal = {};
    },
    /**
     * 上传记录图片
     */
    uploadRecordImage() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1254", "📸 [记录] 选择图片:", tempFilePath);
          this.recordModal.photoUrl = tempFilePath;
          try {
            common_vendor.index.showLoading({
              title: "上传中...",
              mask: true
            });
            const uploadResult = await api_hundred.uploadChallengePhoto(tempFilePath);
            this.recordModal.photoUrl = uploadResult.photoUrl;
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "图片上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.hideLoading();
            this.recordModal.photoUrl = "";
            common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1274", "图片上传失败:", error);
          }
        },
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.includes("cancel")) {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1279", "用户取消选择图片");
            return;
          }
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1282", "选择图片失败:", err);
          common_vendor.index.showToast({ title: "选择图片失败", icon: "none" });
        }
      });
    },
    /**
     * 记录日期变化
     */
    onRecordDateChange(e) {
      this.recordModal.completedDate = e.detail.value;
    },
    /**
     * 记录时间变化
     */
    onRecordTimeChange(e) {
      this.recordModal.completedTime = e.detail.value;
    },
    /**
     * 天气选择变化
     */
    onWeatherChange(e) {
      this.recordModal.weather = this.weatherOptions[e.detail.value];
    },
    /**
     * 保存记录
     */
    async saveRecord() {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1315", "💾 [记录] 保存完成记录");
      if (!this.recordModal.completedDate) {
        common_vendor.index.showToast({ title: "请选择完成日期", icon: "none" });
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: true
        });
        const item = this.items.find((i) => i.id === this.recordModal.taskId);
        if (item) {
          item.done = true;
          item.hasRecord = true;
          item.image = this.recordModal.photoUrl;
          item.completedDate = this.recordModal.completedDate;
          item.completedTime = this.recordModal.completedTime;
          item.location = this.recordModal.location;
          item.weather = this.recordModal.weather;
          item.feeling = this.recordModal.feeling;
          item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        await this.syncTaskCompleteWithDetails(item);
        this.saveItemsToLocal();
        this.closeRecordModal();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "记录保存成功", icon: "success" });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1354", "保存记录失败:", error);
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
      }
    },
    /**
     * 编辑现有记录
     */
    editExistingRecord() {
      const item = this.items.find((i) => i.id === this.detailModal.taskId);
      if (item) {
        this.openRecordModal(item);
        this.recordModal.mode = "edit";
        this.closeDetailModal();
      }
    },
    /**
     * 编辑记录
     */
    async editRecord() {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1375", "✏️ [记录] 编辑记录");
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        const item = this.items.find((i) => i.id === this.recordModal.taskId);
        if (item) {
          item.image = this.recordModal.photoUrl;
          item.completedDate = this.recordModal.completedDate;
          item.completedTime = this.recordModal.completedTime;
          item.location = this.recordModal.location;
          item.weather = this.recordModal.weather;
          item.feeling = this.recordModal.feeling;
          item.note = this.recordModal.note;
        }
        await this.syncTaskCompleteWithDetails(item);
        this.saveItemsToLocal();
        this.closeRecordModal();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "记录更新成功", icon: "success" });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/hundred/index.vue:1406", "编辑记录失败:", error);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      }
    },
    /**
     * 预览图片
     */
    previewImage(url) {
      common_vendor.index.previewImage({
        urls: [url],
        current: url
      });
    },
    /**
     * 同步任务完成详情到后端
     */
    async syncTaskCompleteWithDetails(item) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/hundred/index.vue:1425", "🔄 [同步] 发送详细记录到后端");
      await api_hundred.completeTask({
        taskId: item.id,
        completed: item.done,
        photoUrl: this.stripBaseFromPhotoUrl(item.image) || null,
        note: item.note || null,
        location: item.location || null,
        completedDate: item.completedDate || null,
        completedTime: item.completedTime || null,
        feeling: item.feeling || null,
        weather: item.weather || null
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: $options.progressPercent + "%",
    e: common_vendor.t($options.doneCount),
    f: common_vendor.t($options.filterText),
    g: common_vendor.t($data.showDropdown ? "▲" : "▼"),
    h: common_vendor.o((...args) => $options.toggleDropdown && $options.toggleDropdown(...args)),
    i: $data.showDropdown
  }, $data.showDropdown ? {
    j: common_vendor.f($data.filterOptions, (option, k0, i0) => {
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
    k: common_vendor.f($options.displayItems, (item, i, i0) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => $options.deleteEvent(item), item.id),
        b: common_vendor.t(item.favorite ? "★" : "☆"),
        c: item.favorite ? 1 : "",
        d: common_vendor.o(($event) => $options.toggleFavorite(item), item.id),
        e: item.image
      }, item.image ? {
        f: item.image,
        g: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item.id),
        h: common_vendor.o((...args) => $options.onImageLoad && $options.onImageLoad(...args), item.id)
      } : {}, {
        i: common_vendor.o(($event) => $options.handleEventClick(item), item.id),
        j: common_vendor.t(item.text),
        k: item.done ? 1 : "",
        l: item.done && item.hasRecord
      }, item.done && item.hasRecord ? {
        m: common_vendor.o(($event) => $options.openRecordDetail(item), item.id)
      } : {}, {
        n: common_vendor.o(($event) => $options.handleEventClick(item), item.id),
        o: common_vendor.o(($event) => $options.openEdit(item), item.id),
        p: item.id
      });
    }),
    l: common_vendor.o((...args) => $options.openAdd && $options.openAdd(...args)),
    m: $data.showAdd
  }, $data.showAdd ? {
    n: $data.form.text,
    o: common_vendor.o(($event) => $data.form.text = $event.detail.value),
    p: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args)),
    q: common_vendor.o((...args) => $options.saveItem && $options.saveItem(...args)),
    r: common_vendor.o(() => {
    }),
    s: common_vendor.o((...args) => $options.closeAdd && $options.closeAdd(...args))
  } : {}, {
    t: $data.showEdit
  }, $data.showEdit ? {
    v: $data.editForm.text,
    w: common_vendor.o(($event) => $data.editForm.text = $event.detail.value),
    x: common_vendor.o(($event) => $options.confirmDelete($data.editForm)),
    y: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args)),
    z: common_vendor.o((...args) => $options.saveEdit && $options.saveEdit(...args)),
    A: common_vendor.o(() => {
    }),
    B: common_vendor.o((...args) => $options.closeEdit && $options.closeEdit(...args))
  } : {}, {
    C: $data.showRecordModal
  }, $data.showRecordModal ? common_vendor.e({
    D: common_vendor.t($data.recordModal.mode === "add" ? "记录完成时刻" : "查看记录"),
    E: $data.recordModal.photoUrl
  }, $data.recordModal.photoUrl ? {
    F: $data.recordModal.photoUrl
  } : {}, {
    G: common_vendor.o((...args) => $options.uploadRecordImage && $options.uploadRecordImage(...args)),
    H: common_vendor.t($data.recordModal.completedDate || "选择日期"),
    I: $data.recordModal.completedDate,
    J: common_vendor.o((...args) => $options.onRecordDateChange && $options.onRecordDateChange(...args)),
    K: common_vendor.t($data.recordModal.completedTime || "选择时间"),
    L: $data.recordModal.completedTime,
    M: common_vendor.o((...args) => $options.onRecordTimeChange && $options.onRecordTimeChange(...args)),
    N: $data.recordModal.location,
    O: common_vendor.o(($event) => $data.recordModal.location = $event.detail.value),
    P: common_vendor.t($data.recordModal.weather || "选择天气"),
    Q: $data.weatherOptions,
    R: common_vendor.o((...args) => $options.onWeatherChange && $options.onWeatherChange(...args)),
    S: $data.recordModal.feeling,
    T: common_vendor.o(($event) => $data.recordModal.feeling = $event.detail.value),
    U: common_vendor.t(($data.recordModal.feeling || "").length),
    V: common_vendor.o((...args) => $options.closeRecordModal && $options.closeRecordModal(...args)),
    W: $data.recordModal.mode === "add"
  }, $data.recordModal.mode === "add" ? {
    X: common_vendor.o((...args) => $options.saveRecord && $options.saveRecord(...args))
  } : {
    Y: common_vendor.o((...args) => $options.editRecord && $options.editRecord(...args))
  }, {
    Z: common_vendor.o(() => {
    }),
    aa: common_vendor.o((...args) => $options.closeRecordModal && $options.closeRecordModal(...args))
  }) : {}, {
    ab: $data.showDetailModal
  }, $data.showDetailModal ? common_vendor.e({
    ac: $data.detailModal.photoUrl
  }, $data.detailModal.photoUrl ? {
    ad: $data.detailModal.photoUrl,
    ae: common_vendor.o(($event) => $options.previewImage($data.detailModal.photoUrl))
  } : {}, {
    af: common_vendor.t($data.detailModal.completedDate),
    ag: common_vendor.t($data.detailModal.completedTime),
    ah: $data.detailModal.location
  }, $data.detailModal.location ? {
    ai: common_vendor.t($data.detailModal.location)
  } : {}, {
    aj: $data.detailModal.weather
  }, $data.detailModal.weather ? {
    ak: common_vendor.t($data.detailModal.weather)
  } : {}, {
    al: $data.detailModal.feeling
  }, $data.detailModal.feeling ? {
    am: common_vendor.t($data.detailModal.feeling)
  } : {}, {
    an: common_vendor.o((...args) => $options.editExistingRecord && $options.editExistingRecord(...args)),
    ao: common_vendor.o((...args) => $options.closeDetailModal && $options.closeDetailModal(...args)),
    ap: common_vendor.o(() => {
    }),
    aq: common_vendor.o((...args) => $options.closeDetailModal && $options.closeDetailModal(...args))
  }) : {}, {
    ar: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/interaction/pages/hundred/index.js.map
