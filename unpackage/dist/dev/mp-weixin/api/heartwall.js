"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function createProject(projectData) {
  const url = utils_config.config.API.HEART_WALL.PROJECTS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:35", "🔗 [心形墙API] 开始创建项目");
  common_vendor.index.__f__("log", "at api/heartwall.js:36", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:37", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/heartwall.js:38", "📤 请求参数:", projectData);
  common_vendor.index.__f__("log", "at api/heartwall.js:39", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, projectData).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:42", "✅ [心形墙API] 创建项目成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:43", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/heartwall.js:46", `📝 项目ID: ${response.data.projectId || response.data.id || "未知"}`);
      common_vendor.index.__f__("log", "at api/heartwall.js:47", `📝 项目名称: ${response.data.projectName || "未知"}`);
      return response;
    } else if (response && (response.projectId || response.id)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/heartwall.js:53", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:57", "❌ [心形墙API] 创建项目失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:58", "🔴 错误信息:", error);
    throw error;
  });
}
function getProjects() {
  const url = utils_config.config.API.HEART_WALL.PROJECTS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:76", "🔗 [心形墙API] 开始获取项目列表");
  common_vendor.index.__f__("log", "at api/heartwall.js:77", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:78", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/heartwall.js:79", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:82", "✅ [心形墙API] 获取项目列表成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:83", "📦 响应数据:", response);
    if (response && response.data) {
      const projects = Array.isArray(response.data) ? response.data : response.data.projects || [];
      common_vendor.index.__f__("log", "at api/heartwall.js:87", `📊 项目数量: ${projects.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/heartwall.js:91", `📊 项目数量: ${response.length}`);
      return { success: true, data: response };
    } else if (response && response.projects) {
      common_vendor.index.__f__("log", "at api/heartwall.js:95", `📊 项目数量: ${response.projects.length}`);
      return { success: true, data: response.projects };
    } else {
      common_vendor.index.__f__("warn", "at api/heartwall.js:98", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:102", "❌ [心形墙API] 获取项目列表失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:103", "🔴 错误信息:", error);
    throw error;
  });
}
function getProjectDetail(projectId) {
  const url = `${utils_config.config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:122", "🔗 [心形墙API] 开始获取项目详情");
  common_vendor.index.__f__("log", "at api/heartwall.js:123", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:124", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/heartwall.js:125", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:126", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:129", "✅ [心形墙API] 获取项目详情成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:130", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/heartwall.js:133", `📝 项目名称: ${response.data.projectName || "未知"}`);
      return response;
    } else if (response && (response.projectId || response.id)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/heartwall.js:139", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:143", "❌ [心形墙API] 获取项目详情失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:144", "🔴 错误信息:", error);
    throw error;
  });
}
function updateProject(projectId, projectData) {
  const url = `${utils_config.config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:173", "🔗 [心形墙API] 开始更新项目");
  common_vendor.index.__f__("log", "at api/heartwall.js:174", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:175", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/heartwall.js:176", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:177", "📤 请求参数:", projectData);
  common_vendor.index.__f__("log", "at api/heartwall.js:178", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, projectData).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:181", "✅ [心形墙API] 更新项目成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:182", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:185", "❌ [心形墙API] 更新项目失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:186", "🔴 错误信息:", error);
    throw error;
  });
}
function deleteProject(projectId) {
  const url = `${utils_config.config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:205", "🔗 [心形墙API] 开始删除项目");
  common_vendor.index.__f__("log", "at api/heartwall.js:206", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:207", "📋 请求方法: DELETE");
  common_vendor.index.__f__("log", "at api/heartwall.js:208", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:209", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.delete(url).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:212", "✅ [心形墙API] 删除项目成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:213", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:216", "❌ [心形墙API] 删除项目失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:217", "🔴 错误信息:", error);
    throw error;
  });
}
function uploadPhoto(photoData) {
  const url = utils_config.config.API.HEART_WALL.PHOTOS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:251", "🔗 [心形墙API] 开始上传照片");
  common_vendor.index.__f__("log", "at api/heartwall.js:252", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:253", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/heartwall.js:254", "📤 请求参数:", photoData);
  common_vendor.index.__f__("log", "at api/heartwall.js:255", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, photoData).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:258", "✅ [心形墙API] 上传照片成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:259", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/heartwall.js:264", `📷 照片ID: ${response.data.photoId || response.data.id || "未知"}`);
      return response;
    } else if (response && response.photo) {
      const photo = response.photo;
      common_vendor.index.__f__("log", "at api/heartwall.js:269", `📷 照片ID: ${photo.id || photo.photoId || "未知"}`);
      return {
        success: true,
        data: photo,
        message: response.message,
        photoCount: response.photoCount,
        nextPosition: response.nextPosition
      };
    } else if (response && (response.photoId || response.id)) {
      return { success: true, data: response };
    } else {
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:285", "❌ [心形墙API] 上传照片失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:286", "🔴 错误信息:", error);
    throw error;
  });
}
function getProjectPhotos(projectId, options = {}) {
  const { page = 1, pageSize = 20 } = options;
  let url = `${utils_config.config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}?action=photos`;
  if (page) {
    url += `&page=${page}`;
  }
  if (pageSize) {
    url += `&pageSize=${pageSize}`;
  }
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:318", "🔗 [心形墙API] 开始获取项目照片列表");
  common_vendor.index.__f__("log", "at api/heartwall.js:319", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:320", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/heartwall.js:321", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:322", "📄 分页参数: page=", page, "pageSize=", pageSize);
  common_vendor.index.__f__("log", "at api/heartwall.js:323", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:326", "✅ [心形墙API] 获取项目照片列表成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:327", "📦 响应数据:", response);
    if (response && response.data) {
      const photos = Array.isArray(response.data) ? response.data : response.data.photos || [];
      common_vendor.index.__f__("log", "at api/heartwall.js:331", `📊 照片数量: ${photos.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/heartwall.js:335", `📊 照片数量: ${response.length}`);
      return { success: true, data: response };
    } else if (response && response.photos) {
      common_vendor.index.__f__("log", "at api/heartwall.js:339", `📊 照片数量: ${response.photos.length}`);
      return { success: true, data: response.photos };
    } else {
      common_vendor.index.__f__("warn", "at api/heartwall.js:342", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:346", "❌ [心形墙API] 获取项目照片列表失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:347", "🔴 错误信息:", error);
    throw error;
  });
}
function updatePhoto(photoId, photoData) {
  const url = `${utils_config.config.API.HEART_WALL.PHOTOS}/${photoId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:423", "🔗 [心形墙API] 开始更新照片");
  common_vendor.index.__f__("log", "at api/heartwall.js:424", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:425", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/heartwall.js:426", "📷 照片ID:", photoId);
  common_vendor.index.__f__("log", "at api/heartwall.js:427", "📤 请求参数:", photoData);
  common_vendor.index.__f__("log", "at api/heartwall.js:428", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, photoData).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:431", "✅ [心形墙API] 更新照片成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:432", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:435", "❌ [心形墙API] 更新照片失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:436", "🔴 错误信息:", error);
    throw error;
  });
}
function clearProjectPhotos(projectId) {
  const projectIdValue = typeof projectId === "string" ? parseInt(projectId, 10) : Number(projectId);
  if (isNaN(projectIdValue) || projectIdValue <= 0) {
    const error = new Error(`无效的项目ID: ${projectId}`);
    common_vendor.index.__f__("error", "at api/heartwall.js:490", "❌ [心形墙API] 项目ID验证失败:", error);
    return Promise.reject(error);
  }
  const url = `/api/heart-wall/clear-photos?projectId=${projectIdValue}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:498", "🔗 [心形墙API] 开始清空项目照片");
  common_vendor.index.__f__("log", "at api/heartwall.js:499", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:500", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/heartwall.js:501", "📝 项目ID:", projectId, "→", projectIdValue, "(类型: number)");
  common_vendor.index.__f__("log", "at api/heartwall.js:502", "📤 URL参数: projectId=" + projectIdValue);
  common_vendor.index.__f__("log", "at api/heartwall.js:503", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, {}).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:507", "✅ [心形墙API] 清空项目照片成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:508", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    var _a;
    common_vendor.index.__f__("error", "at api/heartwall.js:511", "❌ [心形墙API] 清空项目照片失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:512", "🔴 HTTP状态码:", error.statusCode || "未知");
    common_vendor.index.__f__("error", "at api/heartwall.js:513", "🔴 错误消息:", error.message || ((_a = error.data) == null ? void 0 : _a.message) || "未知错误");
    common_vendor.index.__f__("error", "at api/heartwall.js:514", "🔴 完整错误对象:", error);
    throw error;
  });
}
exports.clearProjectPhotos = clearProjectPhotos;
exports.createProject = createProject;
exports.deleteProject = deleteProject;
exports.getProjectDetail = getProjectDetail;
exports.getProjectPhotos = getProjectPhotos;
exports.getProjects = getProjects;
exports.updatePhoto = updatePhoto;
exports.updateProject = updateProject;
exports.uploadPhoto = uploadPhoto;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/heartwall.js.map
