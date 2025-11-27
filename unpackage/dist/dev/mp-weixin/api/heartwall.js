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
function uploadPhotoWithFile(options) {
  const { filePath, projectId, positionIndex, caption, takenDate } = options;
  if (!filePath) {
    return Promise.reject(new Error("文件路径不能为空"));
  }
  if (!projectId) {
    return Promise.reject(new Error("项目ID不能为空"));
  }
  const url = `/api/heart-wall/photos/upload`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:329", "🔗 [心形墙API] 开始直接上传照片文件");
  common_vendor.index.__f__("log", "at api/heartwall.js:330", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:331", "📋 请求方法: POST (multipart/form-data)");
  common_vendor.index.__f__("log", "at api/heartwall.js:332", "📁 文件路径:", filePath);
  common_vendor.index.__f__("log", "at api/heartwall.js:333", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:334", "📍 位置索引:", positionIndex);
  common_vendor.index.__f__("log", "at api/heartwall.js:335", "💬 照片说明:", caption);
  common_vendor.index.__f__("log", "at api/heartwall.js:336", "📅 拍摄日期:", takenDate);
  common_vendor.index.__f__("log", "at api/heartwall.js:337", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  const formData = {
    projectId: String(projectId)
  };
  if (positionIndex !== void 0 && positionIndex !== null) {
    formData.positionIndex = String(positionIndex);
  }
  if (caption) {
    formData.caption = caption;
  }
  if (takenDate) {
    formData.takenDate = takenDate;
  }
  return utils_http.http.upload({
    url,
    filePath,
    name: "file",
    // 后端期望的文件字段名
    formData
  }).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:360", "✅ [心形墙API] 直接上传照片文件成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:361", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/heartwall.js:366", `📷 照片ID: ${response.data.photoId || response.data.id || "未知"}`);
      return response;
    } else if (response && response.photo) {
      const photo = response.photo;
      common_vendor.index.__f__("log", "at api/heartwall.js:371", `📷 照片ID: ${photo.id || photo.photoId || "未知"}`);
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
    common_vendor.index.__f__("error", "at api/heartwall.js:387", "❌ [心形墙API] 直接上传照片文件失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:388", "🔴 错误信息:", error);
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
  common_vendor.index.__f__("log", "at api/heartwall.js:420", "🔗 [心形墙API] 开始获取项目照片列表");
  common_vendor.index.__f__("log", "at api/heartwall.js:421", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:422", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/heartwall.js:423", "📝 项目ID:", projectId);
  common_vendor.index.__f__("log", "at api/heartwall.js:424", "📄 分页参数: page=", page, "pageSize=", pageSize);
  common_vendor.index.__f__("log", "at api/heartwall.js:425", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:428", "✅ [心形墙API] 获取项目照片列表成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:429", "📦 响应数据:", response);
    if (response && response.data) {
      const photos = Array.isArray(response.data) ? response.data : response.data.photos || [];
      common_vendor.index.__f__("log", "at api/heartwall.js:433", `📊 照片数量: ${photos.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/heartwall.js:437", `📊 照片数量: ${response.length}`);
      return { success: true, data: response };
    } else if (response && response.photos) {
      common_vendor.index.__f__("log", "at api/heartwall.js:441", `📊 照片数量: ${response.photos.length}`);
      return { success: true, data: response.photos };
    } else {
      common_vendor.index.__f__("warn", "at api/heartwall.js:444", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:448", "❌ [心形墙API] 获取项目照片列表失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:449", "🔴 错误信息:", error);
    throw error;
  });
}
function updatePhoto(photoId, photoData) {
  const url = `/api/heart-wall/photos/${photoId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:525", "🔗 [心形墙API] 开始更新照片");
  common_vendor.index.__f__("log", "at api/heartwall.js:526", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:527", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/heartwall.js:528", "📷 照片ID:", photoId);
  common_vendor.index.__f__("log", "at api/heartwall.js:529", "📤 请求参数:", photoData);
  common_vendor.index.__f__("log", "at api/heartwall.js:530", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, photoData).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:533", "✅ [心形墙API] 更新照片成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:534", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/heartwall.js:537", "❌ [心形墙API] 更新照片失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:538", "🔴 错误信息:", error);
    throw error;
  });
}
function clearProjectPhotos(projectId) {
  const projectIdValue = typeof projectId === "string" ? parseInt(projectId, 10) : Number(projectId);
  if (isNaN(projectIdValue) || projectIdValue <= 0) {
    const error = new Error(`无效的项目ID: ${projectId}`);
    common_vendor.index.__f__("error", "at api/heartwall.js:592", "❌ [心形墙API] 项目ID验证失败:", error);
    return Promise.reject(error);
  }
  const url = `/api/heart-wall/clear-photos?projectId=${projectIdValue}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/heartwall.js:600", "🔗 [心形墙API] 开始清空项目照片");
  common_vendor.index.__f__("log", "at api/heartwall.js:601", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/heartwall.js:602", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/heartwall.js:603", "📝 项目ID:", projectId, "→", projectIdValue, "(类型: number)");
  common_vendor.index.__f__("log", "at api/heartwall.js:604", "📤 URL参数: projectId=" + projectIdValue);
  common_vendor.index.__f__("log", "at api/heartwall.js:605", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, {}).then((response) => {
    common_vendor.index.__f__("log", "at api/heartwall.js:609", "✅ [心形墙API] 清空项目照片成功");
    common_vendor.index.__f__("log", "at api/heartwall.js:610", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    var _a;
    common_vendor.index.__f__("error", "at api/heartwall.js:613", "❌ [心形墙API] 清空项目照片失败");
    common_vendor.index.__f__("error", "at api/heartwall.js:614", "🔴 HTTP状态码:", error.statusCode || "未知");
    common_vendor.index.__f__("error", "at api/heartwall.js:615", "🔴 错误消息:", error.message || ((_a = error.data) == null ? void 0 : _a.message) || "未知错误");
    common_vendor.index.__f__("error", "at api/heartwall.js:616", "🔴 完整错误对象:", error);
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
exports.uploadPhotoWithFile = uploadPhotoWithFile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/heartwall.js.map
