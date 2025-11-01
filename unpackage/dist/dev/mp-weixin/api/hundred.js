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
    if (response && response.tasks) {
      common_vendor.index.__f__("log", "at api/hundred.js:53", `📊 任务总数: ${response.tasks.length}`);
      const presetCount = response.tasks.filter((t) => t.category === "preset").length;
      const customCount = response.tasks.filter((t) => t.category === "custom").length;
      const completedCount = response.tasks.filter((t) => t.status === "completed").length;
      common_vendor.index.__f__("log", "at api/hundred.js:57", `   - 预设任务: ${presetCount} 个`);
      common_vendor.index.__f__("log", "at api/hundred.js:58", `   - 自定义任务: ${customCount} 个`);
      common_vendor.index.__f__("log", "at api/hundred.js:59", `   - 已完成: ${completedCount} 个`);
      return response;
    } else if (response && Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/hundred.js:64", "📊 任务总数:", response.length);
      return { success: true, tasks: response };
    } else {
      common_vendor.index.__f__("warn", "at api/hundred.js:67", "⚠️ 响应数据格式异常:", response);
      return { success: true, tasks: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:71", "❌ [一百件事API] 获取任务列表失败");
    common_vendor.index.__f__("error", "at api/hundred.js:72", "🔴 错误信息:", error);
    throw error;
  });
}
function getProgress() {
  const url = utils_config.config.API.CHALLENGE.PROGRESS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:102", "🔗 [一百件事API] 开始请求用户进度");
  common_vendor.index.__f__("log", "at api/hundred.js:103", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:104", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/hundred.js:105", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:108", "✅ [一百件事API] 获取用户进度成功");
    common_vendor.index.__f__("log", "at api/hundred.js:109", "📦 响应数据:", response);
    if (response && response.progress) {
      const progress = response.progress;
      common_vendor.index.__f__("log", "at api/hundred.js:113", "📊 进度统计:");
      common_vendor.index.__f__("log", "at api/hundred.js:114", `   - 总任务数: ${progress.totalTasks}`);
      common_vendor.index.__f__("log", "at api/hundred.js:115", `   - 已完成: ${progress.completedCount}`);
      common_vendor.index.__f__("log", "at api/hundred.js:116", `   - 已收藏: ${progress.favoritedCount}`);
      common_vendor.index.__f__("log", "at api/hundred.js:117", `   - 完成率: ${progress.completionRate}%`);
      common_vendor.index.__f__("log", "at api/hundred.js:118", `   - 最后活跃: ${progress.lastActiveAt || "未知"}`);
    }
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:123", "❌ [一百件事API] 获取用户进度失败");
    common_vendor.index.__f__("error", "at api/hundred.js:124", "🔴 错误信息:", error);
    throw error;
  });
}
function addTask(taskData) {
  const url = utils_config.config.API.CHALLENGE.ADD;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:150", "🔗 [一百件事API] 开始添加自定义任务");
  common_vendor.index.__f__("log", "at api/hundred.js:151", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:152", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:153", "📤 请求参数:", taskData);
  common_vendor.index.__f__("log", "at api/hundred.js:154", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskName: taskData.taskName,
    taskDescription: taskData.taskDescription || ""
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:160", "✅ [一百件事API] 添加任务成功");
    common_vendor.index.__f__("log", "at api/hundred.js:161", "📦 响应数据:", response);
    if (response && response.task) {
      common_vendor.index.__f__("log", "at api/hundred.js:164", `📝 新任务ID: ${response.task.id}`);
      common_vendor.index.__f__("log", "at api/hundred.js:165", `📝 任务名称: ${response.task.taskName}`);
    }
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:170", "❌ [一百件事API] 添加任务失败");
    common_vendor.index.__f__("error", "at api/hundred.js:171", "🔴 错误信息:", error);
    throw error;
  });
}
function deleteTask(taskId) {
  const url = utils_config.config.API.CHALLENGE.DELETE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/hundred.js:194", "🔗 [一百件事API] 开始删除任务");
  common_vendor.index.__f__("log", "at api/hundred.js:195", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:196", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:197", "📤 请求参数: { taskId:", taskId, "}");
  common_vendor.index.__f__("log", "at api/hundred.js:198", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, { taskId }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:201", "✅ [一百件事API] 删除任务成功");
    common_vendor.index.__f__("log", "at api/hundred.js:202", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:203", `🗑️ 已删除任务ID: ${taskId}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:207", "❌ [一百件事API] 删除任务失败");
    common_vendor.index.__f__("error", "at api/hundred.js:208", "🔴 错误信息:", error);
    throw error;
  });
}
function completeTask(completeData) {
  const url = utils_config.config.API.CHALLENGE.COMPLETE;
  const fullUrl = utils_config.config.baseURL + url;
  const action = completeData.completed ? "标记完成" : "取消完成";
  common_vendor.index.__f__("log", "at api/hundred.js:239", `🔗 [一百件事API] 开始${action}任务`);
  common_vendor.index.__f__("log", "at api/hundred.js:240", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:241", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:242", "📤 请求参数:", completeData);
  common_vendor.index.__f__("log", "at api/hundred.js:243", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskId: completeData.taskId,
    completed: completeData.completed,
    photoUrl: completeData.photoUrl || null,
    note: completeData.note || null
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:251", `✅ [一百件事API] ${action}任务成功`);
    common_vendor.index.__f__("log", "at api/hundred.js:252", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:253", `📝 任务ID: ${completeData.taskId}, 状态: ${completeData.completed ? "已完成" : "未完成"}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:257", `❌ [一百件事API] ${action}任务失败`);
    common_vendor.index.__f__("error", "at api/hundred.js:258", "🔴 错误信息:", error);
    throw error;
  });
}
function favoriteTask(favoriteData) {
  const url = utils_config.config.API.CHALLENGE.FAVORITE;
  const fullUrl = utils_config.config.baseURL + url;
  const action = favoriteData.favorited ? "收藏" : "取消收藏";
  common_vendor.index.__f__("log", "at api/hundred.js:285", `🔗 [一百件事API] 开始${action}任务`);
  common_vendor.index.__f__("log", "at api/hundred.js:286", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/hundred.js:287", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/hundred.js:288", "📤 请求参数:", favoriteData);
  common_vendor.index.__f__("log", "at api/hundred.js:289", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {
    taskId: favoriteData.taskId,
    favorited: favoriteData.favorited
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/hundred.js:295", `✅ [一百件事API] ${action}任务成功`);
    common_vendor.index.__f__("log", "at api/hundred.js:296", "📦 响应数据:", response);
    common_vendor.index.__f__("log", "at api/hundred.js:297", `⭐ 任务ID: ${favoriteData.taskId}, 收藏状态: ${favoriteData.favorited ? "已收藏" : "未收藏"}`);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/hundred.js:301", `❌ [一百件事API] ${action}任务失败`);
    common_vendor.index.__f__("error", "at api/hundred.js:302", "🔴 错误信息:", error);
    throw error;
  });
}
exports.addTask = addTask;
exports.completeTask = completeTask;
exports.deleteTask = deleteTask;
exports.favoriteTask = favoriteTask;
exports.getProgress = getProgress;
exports.getTasks = getTasks;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/hundred.js.map
