"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function getTasks() {
  const url = utils_config.config.API.CHALLENGE.LIST;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:42", "🔗 [一百件事API] 开始请求任务列表");
  common_vendor.index.__f__("log", "at api/hundred.js:43", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:44", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/hundred.js:45", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:48", "✅ [一百件事API] 获取任务列表成功");
    common_vendor.index.__f__("log", "at api/hundred.js:49", "📦 响应数据:", response);
    if (response && Array.isArray(response.tasks)) {
      const tasks = response.tasks;
      common_vendor.index.__f__("log", "at api/hundred.js:55", `📊 任务总数: ${tasks.length}`);
      const presetCount = tasks.filter((t) => t.category === "preset").length;
      const customCount = tasks.filter((t) => t.category === "custom").length;
      const completedCount = tasks.filter((t) => t.status === "completed").length;
      common_vendor.index.__f__("log", "at api/hundred.js:59", `   - 预设任务: ${presetCount} 个`);
      common_vendor.index.__f__("log", "at api/hundred.js:60", `   - 自定义任务: ${customCount} 个`);
      common_vendor.index.__f__("log", "at api/hundred.js:61", `   - 已完成: ${completedCount} 个`);
      return {
        success: response.success ?? true,
        msg: response.message || response.msg || "",
        code: response.code ?? 200,
        tasks
      };
    }
    if (response && Array.isArray(response.data)) {
      const tasks = response.data;
      common_vendor.index.__f__("log", "at api/hundred.js:74", `📊 任务总数(从 data 中解析): ${tasks.length}`);
      const presetCount = tasks.filter((t) => t.category === "preset").length;
      const customCount = tasks.filter((t) => t.category === "custom").length;
      common_vendor.index.__f__("log", "at api/hundred.js:77", `   - 预设任务: ${presetCount} 个`);
      common_vendor.index.__f__("log", "at api/hundred.js:78", `   - 自定义任务: ${customCount} 个`);
      return {
        success: response.code === 200,
        msg: response.msg || response.message || "操作成功",
        code: response.code,
        tasks
      };
    }
    if (response && Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/hundred.js:90", "📊 任务总数(数组格式):", response.length);
      return { success: true, tasks: response };
    }
    common_vendor.index.__f__("warn", "at api/hundred.js:95", "⚠️ 响应数据格式异常:", response);
    return { success: false, tasks: [] };
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:98", "❌ [一百件事API] 获取任务列表失败");
    common_vendor.index.__f__("error", "at api/hundred.js:99", "🔴 错误信息:", error);
    throw error;
  });
}
function addTask(taskData) {
  const url = utils_config.config.API.CHALLENGE.ADD;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:177", "🔗 [一百件事API] 开始添加自定义任务");
  common_vendor.index.__f__("log", "at api/hundred.js:178", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:179", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:180", "📤 请求参数:", taskData);
  common_vendor.index.__f__("log", "at api/hundred.js:181", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskName: taskData.taskName,
    taskDescription: taskData.taskDescription || ""
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:187", "✅ [一百件事API] 添加任务成功");
    common_vendor.index.__f__("log", "at api/hundred.js:188", "📦 响应数据:", response);
    if (response && response.task) {
      common_vendor.index.__f__("log", "at api/hundred.js:191", `📝 新任务ID: ${response.task.id}`);
      common_vendor.index.__f__("log", "at api/hundred.js:192", `📝 任务名称: ${response.task.taskName}`);
    }
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:197", "❌ [一百件事API] 添加任务失败");
    common_vendor.index.__f__("error", "at api/hundred.js:198", "🔴 错误信息:", error);
    throw error;
  });
}
function deleteTask(taskId) {
  const url = utils_config.config.API.CHALLENGE.DELETE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:221", "🔗 [一百件事API] 开始删除任务");
  common_vendor.index.__f__("log", "at api/hundred.js:222", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:223", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:224", "📤 请求参数: { taskId:", taskId, "}");
  common_vendor.index.__f__("log", "at api/hundred.js:225", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, { taskId }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:228", "✅ [一百件事API] 删除任务成功");
    common_vendor.index.__f__("log", "at api/hundred.js:229", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:230", `🗑️ 已删除任务ID: ${taskId}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:234", "❌ [一百件事API] 删除任务失败");
    common_vendor.index.__f__("error", "at api/hundred.js:235", "🔴 错误信息:", error);
    throw error;
  });
}
function completeTask(completeData) {
  const url = utils_config.config.API.CHALLENGE.COMPLETE;
  const fullUrl = utils_config.config.baseURL + url;
  const action = completeData.completed ? "标记完成" : "取消完成";
  common_vendor.index.__f__("log", "at api/hundred.js:280", `🔗 [一百件事API] 开始${action}任务`);
  common_vendor.index.__f__("log", "at api/hundred.js:281", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:282", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:283", "📤 请求参数:", completeData);
  common_vendor.index.__f__("log", "at api/hundred.js:284", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskId: completeData.taskId,
    completed: completeData.completed,
    photoUrl: completeData.photoUrl || null,
    note: completeData.note || null,
    location: completeData.location || null,
    completedDate: completeData.completedDate || null,
    completedTime: completeData.completedTime || null,
    feeling: completeData.feeling || null,
    weather: completeData.weather || null,
    tags: completeData.tags || null,
    rating: completeData.rating || null
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:299", `✅ [一百件事API] ${action}任务成功`);
    common_vendor.index.__f__("log", "at api/hundred.js:300", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:301", `📝 任务ID: ${completeData.taskId}, 状态: ${completeData.completed ? "已完成" : "未完成"}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:305", `❌ [一百件事API] ${action}任务失败`);
    common_vendor.index.__f__("error", "at api/hundred.js:306", "🔴 错误信息:", error);
    throw error;
  });
}
function uploadChallengePhoto(filePath) {
  if (!filePath) {
    return Promise.reject(new Error("上传照片失败：filePath 不能为空"));
  }
  const url = utils_config.config.API.CHALLENGE.UPLOAD;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:336", "🔗 [一百件事API] 开始上传任务完成照片");
  common_vendor.index.__f__("log", "at api/hundred.js:337", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:338", "📋 请求方法: POST (multipart/form-data)");
  common_vendor.index.__f__("log", "at api/hundred.js:339", "📁 文件路径:", filePath);
  common_vendor.index.__f__("log", "at api/hundred.js:340", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.upload({
    url,
    filePath,
    name: "file"
  }).then((response) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    common_vendor.index.__f__("log", "at api/hundred.js:347", "✅ [一百件事API] 上传任务完成照片成功");
    common_vendor.index.__f__("log", "at api/hundred.js:348", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:349", "📦 响应数据类型:", typeof response);
    common_vendor.index.__f__("log", "at api/hundred.js:350", "📦 响应数据结构:", Object.keys ? Object.keys(response) : "无法获取键名");
    common_vendor.index.__f__("log", "at api/hundred.js:353", "🔍 [响应分析] 详细字段检查:");
    common_vendor.index.__f__("log", "at api/hundred.js:354", "   - response.photoUrl:", response == null ? void 0 : response.photoUrl);
    common_vendor.index.__f__("log", "at api/hundred.js:355", "   - response.url:", response == null ? void 0 : response.url);
    common_vendor.index.__f__("log", "at api/hundred.js:356", "   - response.data:", response == null ? void 0 : response.data);
    common_vendor.index.__f__("log", "at api/hundred.js:357", "   - response.data?.photoUrl:", (_a = response == null ? void 0 : response.data) == null ? void 0 : _a.photoUrl);
    common_vendor.index.__f__("log", "at api/hundred.js:358", "   - response.data?.url:", (_b = response == null ? void 0 : response.data) == null ? void 0 : _b.url);
    common_vendor.index.__f__("log", "at api/hundred.js:359", "   - response.data?.photo?.url:", (_d = (_c = response == null ? void 0 : response.data) == null ? void 0 : _c.photo) == null ? void 0 : _d.url);
    common_vendor.index.__f__("log", "at api/hundred.js:360", "   - response.message:", response == null ? void 0 : response.message);
    common_vendor.index.__f__("log", "at api/hundred.js:361", "   - response.msg:", response == null ? void 0 : response.msg);
    common_vendor.index.__f__("log", "at api/hundred.js:362", "   - response.success:", response == null ? void 0 : response.success);
    const photoUrl = (response == null ? void 0 : response.photoUrl) || (response == null ? void 0 : response.url) || ((_e = response == null ? void 0 : response.data) == null ? void 0 : _e.photoUrl) || ((_f = response == null ? void 0 : response.data) == null ? void 0 : _f.url) || ((_h = (_g = response == null ? void 0 : response.data) == null ? void 0 : _g.photo) == null ? void 0 : _h.url) || (typeof response === "string" ? response : null);
    common_vendor.index.__f__("log", "at api/hundred.js:372", "🖼️ [图片URL提取] 提取结果:", photoUrl);
    if (!photoUrl) {
      common_vendor.index.__f__("error", "at api/hundred.js:375", "❌ [一百件事API] 上传成功但未返回 photoUrl，响应：", response);
      const error = new Error("上传成功但未返回照片地址");
      error.response = response;
      throw error;
    }
    return {
      success: true,
      photoUrl,
      message: (response == null ? void 0 : response.message) || (response == null ? void 0 : response.msg) || "照片上传成功",
      raw: response
    };
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:388", "❌ [一百件事API] 上传任务完成照片失败");
    common_vendor.index.__f__("error", "at api/hundred.js:389", "🔴 错误信息:", error);
    throw error;
  });
}
function favoriteTask(favoriteData) {
  const url = utils_config.config.API.CHALLENGE.FAVORITE;
  const fullUrl = utils_config.config.baseURL + url;
  const action = favoriteData.favorited ? "收藏" : "取消收藏";
  common_vendor.index.__f__("log", "at api/hundred.js:416", `🔗 [一百件事API] 开始${action}任务`);
  common_vendor.index.__f__("log", "at api/hundred.js:417", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:418", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:419", "📤 请求参数:", favoriteData);
  common_vendor.index.__f__("log", "at api/hundred.js:420", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskId: favoriteData.taskId,
    favorited: favoriteData.favorited
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:426", `✅ [一百件事API] ${action}任务成功`);
    common_vendor.index.__f__("log", "at api/hundred.js:427", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:428", `⭐ 任务ID: ${favoriteData.taskId}, 收藏状态: ${favoriteData.favorited ? "已收藏" : "未收藏"}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:432", `❌ [一百件事API] ${action}任务失败`);
    common_vendor.index.__f__("error", "at api/hundred.js:433", "🔴 错误信息:", error);
    throw error;
  });
}
exports.addTask = addTask;
exports.completeTask = completeTask;
exports.deleteTask = deleteTask;
exports.favoriteTask = favoriteTask;
exports.getTasks = getTasks;
exports.uploadChallengePhoto = uploadChallengePhoto;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/hundred.js.map
