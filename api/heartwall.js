/**
 * 心形墙 API
 * 对接后端接口文档：心形墙API接口文档
 * 基础URL前缀：/api/heart-wall
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 创建心形墙项目
 * @param {Object} projectData - 项目数据
 * @param {string} projectData.projectName - 项目名称
 * @param {string} projectData.description - 项目描述
 * @param {boolean} projectData.isPublic - 是否公开
 * @param {number} projectData.maxPhotos - 最大照片数量
 * @returns {Promise<Object>} 返回创建结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/heart-wall/projects
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     "projectName": "我们的回忆",
 *     "description": "记录我们的美好时光",
 *     "isPublic": false,
 *     "maxPhotos": 40
 *   }
 */
export function createProject(projectData) {
  const url = config.API.HEART_WALL.PROJECTS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始创建项目');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', projectData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, projectData).then(response => {
    console.log('✅ [心形墙API] 创建项目成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 项目ID: ${response.data.projectId || response.data.id || '未知'}`);
      console.log(`📝 项目名称: ${response.data.projectName || '未知'}`);
      return response;
    } else if (response && (response.projectId || response.id)) {
      // 兼容直接返回项目信息的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 创建项目失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取用户所有心形墙项目
 * @returns {Promise<Object>} 返回项目列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/heart-wall/projects
 * - 请求头：需携带 Authorization token
 */
export function getProjects() {
  const url = config.API.HEART_WALL.PROJECTS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始获取项目列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [心形墙API] 获取项目列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const projects = Array.isArray(response.data) ? response.data : (response.data.projects || []);
      console.log(`📊 项目数量: ${projects.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 项目数量: ${response.length}`);
      return { success: true, data: response };
    } else if (response && response.projects) {
      // 兼容直接返回对象包含projects字段的情况
      console.log(`📊 项目数量: ${response.projects.length}`);
      return { success: true, data: response.projects };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 获取项目列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取心形墙项目详情
 * @param {number|string} projectId - 项目ID
 * @returns {Promise<Object>} 返回项目详情
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/heart-wall/projects/{projectId}
 * - 请求头：需携带 Authorization token
 */
export function getProjectDetail(projectId) {
  const url = `${config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始获取项目详情');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📝 项目ID:', projectId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [心形墙API] 获取项目详情成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 项目名称: ${response.data.projectName || '未知'}`);
      return response;
    } else if (response && (response.projectId || response.id)) {
      // 兼容直接返回项目详情的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 获取项目详情失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 更新心形墙项目
 * @param {number|string} projectId - 项目ID
 * @param {Object} projectData - 项目数据
 * @param {string} [projectData.projectName] - 项目名称
 * @param {string} [projectData.description] - 项目描述
 * @param {boolean} [projectData.isPublic] - 是否公开
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/heart-wall/projects/{projectId}
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     "projectName": "我们的甜蜜回忆",
 *     "description": "记录我们的甜蜜时光",
 *     "isPublic": true
 *   }
 */
export function updateProject(projectId, projectData) {
  const url = `${config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始更新项目');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📝 项目ID:', projectId);
  console.log('📤 请求参数:', projectData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.put(url, projectData).then(response => {
    console.log('✅ [心形墙API] 更新项目成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [心形墙API] 更新项目失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 删除心形墙项目
 * @param {number|string} projectId - 项目ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：DELETE
 * - 请求地址：/api/heart-wall/projects/{projectId}
 * - 请求头：需携带 Authorization token
 */
export function deleteProject(projectId) {
  const url = `${config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始删除项目');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: DELETE');
  console.log('📝 项目ID:', projectId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.delete(url).then(response => {
    console.log('✅ [心形墙API] 删除项目成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [心形墙API] 删除项目失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 上传照片到心形墙（使用JSON格式，需要先上传文件获取URL）
 * @param {Object} photoData - 照片数据
 * @param {number|string} photoData.projectId - 项目ID
 * @param {string} photoData.photoUrl - 照片URL
 * @param {string} photoData.thumbnailUrl - 缩略图URL
 * @param {number} photoData.positionIndex - 位置索引
 * @param {string} [photoData.caption] - 照片说明
 * @param {string} [photoData.takenDate] - 拍摄日期 (格式: YYYY-MM-DD)
 * @returns {Promise<Object>} 返回上传结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/heart-wall/photos
 * - 请求头：需携带 Authorization token
 * - 请求参数（JSON格式）：
 *   {
 *     "projectId": 1,
 *     "photoUrl": "https://example.com/photo.jpg",
 *     "thumbnailUrl": "https://example.com/thumb.jpg",
 *     "positionIndex": 1,
 *     "caption": "这是我们第一次约会",
 *     "takenDate": "2025-11-01"
 *   }
 */
export function uploadPhoto(photoData) {
  const url = config.API.HEART_WALL.PHOTOS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始上传照片（JSON格式）');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', photoData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, photoData).then(response => {
    console.log('✅ [心形墙API] 上传照片成功');
    console.log('📦 响应数据:', response);
    
    // 处理多种响应格式
    if (response && response.data) {
      // 格式1: { data: { photoId: ..., ... } }
      console.log(`📷 照片ID: ${response.data.photoId || response.data.id || '未知'}`);
      return response;
    } else if (response && response.photo) {
      // 格式2: { success: true, photo: { id: ..., ... }, ... }
      const photo = response.photo;
      console.log(`📷 照片ID: ${photo.id || photo.photoId || '未知'}`);
      return { 
        success: true, 
        data: photo,
        message: response.message,
        photoCount: response.photoCount,
        nextPosition: response.nextPosition
      };
    } else if (response && (response.photoId || response.id)) {
      // 格式3: 直接返回照片信息 { photoId: ..., ... }
      return { success: true, data: response };
    } else {
      // 其他格式，直接返回
      return response;
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 上传照片失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 直接上传照片文件到心形墙（使用multipart/form-data格式）
 * 这种方式一步完成，无需先上传文件获取URL
 * @param {Object} options - 上传选项
 * @param {string} options.filePath - 本地文件路径（必需）
 * @param {number|string} options.projectId - 项目ID（必需）
 * @param {number} [options.positionIndex] - 位置索引（可选）
 * @param {string} [options.caption] - 照片说明（可选）
 * @param {string} [options.takenDate] - 拍摄日期，格式: YYYY-MM-DD（可选）
 * @returns {Promise<Object>} 返回上传结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/heart-wall/photos
 * - 请求头：需携带 Authorization token
 * - 请求格式：multipart/form-data
 * - 请求参数：
 *   - file: 文件字段（必需）
 *   - projectId: 项目ID（必需）
 *   - positionIndex: 位置索引（可选）
 *   - caption: 照片说明（可选）
 *   - takenDate: 拍摄日期（可选）
 */
export function uploadPhotoWithFile(options) {
  const { filePath, projectId, positionIndex, caption, takenDate } = options;
  
  // 验证必需参数
  if (!filePath) {
    return Promise.reject(new Error('文件路径不能为空'));
  }
  if (!projectId) {
    return Promise.reject(new Error('项目ID不能为空'));
  }
  
  const url = config.API.HEART_WALL.PHOTOS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始直接上传照片文件');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST (multipart/form-data)');
  console.log('📁 文件路径:', filePath);
  console.log('📝 项目ID:', projectId);
  console.log('📍 位置索引:', positionIndex);
  console.log('💬 照片说明:', caption);
  console.log('📅 拍摄日期:', takenDate);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  // 构建formData
  const formData = {
    projectId: String(projectId)
  };
  
  if (positionIndex !== undefined && positionIndex !== null) {
    formData.positionIndex = String(positionIndex);
  }
  if (caption) {
    formData.caption = caption;
  }
  if (takenDate) {
    formData.takenDate = takenDate;
  }
  
  return http.upload({
    url: url,
    filePath: filePath,
    name: 'file',  // 后端期望的文件字段名
    formData: formData
  }).then(response => {
    console.log('✅ [心形墙API] 直接上传照片文件成功');
    console.log('📦 响应数据:', response);
    
    // 处理多种响应格式
    if (response && response.data) {
      // 格式1: { data: { photoId: ..., ... } }
      console.log(`📷 照片ID: ${response.data.photoId || response.data.id || '未知'}`);
      return response;
    } else if (response && response.photo) {
      // 格式2: { success: true, photo: { id: ..., ... }, ... }
      const photo = response.photo;
      console.log(`📷 照片ID: ${photo.id || photo.photoId || '未知'}`);
      return { 
        success: true, 
        data: photo,
        message: response.message,
        photoCount: response.photoCount,
        nextPosition: response.nextPosition
      };
    } else if (response && (response.photoId || response.id)) {
      // 格式3: 直接返回照片信息 { photoId: ..., ... }
      return { success: true, data: response };
    } else {
      // 其他格式，直接返回
      return response;
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 直接上传照片文件失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取心形墙项目中的所有照片
 * @param {number|string} projectId - 项目ID
 * @param {Object} [options] - 查询选项
 * @param {number} [options.page] - 页码，默认1
 * @param {number} [options.pageSize] - 每页数量，默认20
 * @returns {Promise<Object>} 返回照片列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/heart-wall/projects/{projectId}?action=photos[&page=1&pageSize=20]
 * - 请求头：需携带 Authorization token
 */
export function getProjectPhotos(projectId, options = {}) {
  const { page = 1, pageSize = 20 } = options;
  let url = `${config.API.HEART_WALL.PROJECT_DETAIL}/${projectId}?action=photos`;
  
  // 添加分页参数
  if (page) {
    url += `&page=${page}`;
  }
  if (pageSize) {
    url += `&pageSize=${pageSize}`;
  }
  
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始获取项目照片列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📝 项目ID:', projectId);
  console.log('📄 分页参数: page=', page, 'pageSize=', pageSize);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [心形墙API] 获取项目照片列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const photos = Array.isArray(response.data) ? response.data : (response.data.photos || []);
      console.log(`📊 照片数量: ${photos.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 照片数量: ${response.length}`);
      return { success: true, data: response };
    } else if (response && response.photos) {
      // 兼容直接返回对象包含photos字段的情况
      console.log(`📊 照片数量: ${response.photos.length}`);
      return { success: true, data: response.photos };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 获取项目照片列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取下一个可用位置
 * @param {number|string} projectId - 项目ID
 * @returns {Promise<Object>} 返回下一个可用位置索引
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/heart-wall/next-position?projectId=1
 * - 请求头：需携带 Authorization token
 */
export function getNextPosition(projectId) {
  const url = `${config.API.HEART_WALL.NEXT_POSITION}?projectId=${projectId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始获取下一个可用位置');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📝 项目ID:', projectId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [心形墙API] 获取下一个可用位置成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📍 下一个位置索引: ${response.data.positionIndex || response.data.nextPosition || '未知'}`);
      return response;
    } else if (response && (response.positionIndex !== undefined || response.nextPosition !== undefined)) {
      // 兼容直接返回位置信息的情况
      const positionIndex = response.positionIndex || response.nextPosition;
      console.log(`📍 下一个位置索引: ${positionIndex}`);
      return { success: true, data: { positionIndex } };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [心形墙API] 获取下一个可用位置失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 更新照片信息
 * @param {number|string} photoId - 照片ID
 * @param {Object} photoData - 照片数据
 * @param {string} [photoData.photoUrl] - 照片URL
 * @param {string} [photoData.thumbnailUrl] - 缩略图URL
 * @param {number} [photoData.positionIndex] - 位置索引
 * @param {string} [photoData.caption] - 照片说明
 * @param {string} [photoData.takenDate] - 拍摄日期 (格式: YYYY-MM-DD)
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/heart-wall/photos/{photoId}
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     "photoUrl": "https://example.com/new-photo.jpg",
 *     "thumbnailUrl": "https://example.com/new-thumb.jpg",
 *     "positionIndex": 2,
 *     "caption": "这是我们第一次约会的更新版",
 *     "takenDate": "2025-11-01"
 *   }
 */
export function updatePhoto(photoId, photoData) {
  const url = `${config.API.HEART_WALL.PHOTOS}/${photoId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始更新照片');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📷 照片ID:', photoId);
  console.log('📤 请求参数:', photoData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.put(url, photoData).then(response => {
    console.log('✅ [心形墙API] 更新照片成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [心形墙API] 更新照片失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 删除照片
 * @param {number|string} photoId - 照片ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：DELETE
 * - 请求地址：/api/heart-wall/photos/{photoId}
 * - 请求头：需携带 Authorization token
 */
export function deletePhoto(photoId) {
  const url = `${config.API.HEART_WALL.PHOTOS}/${photoId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始删除照片');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: DELETE');
  console.log('📷 照片ID:', photoId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.delete(url).then(response => {
    console.log('✅ [心形墙API] 删除照片成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [心形墙API] 删除照片失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 清空心形墙项目中的所有照片
 * @param {number|string} projectId - 项目ID
 * @returns {Promise<Object>} 返回清空结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/heart-wall/clear-photos
 * - 请求头：需携带 Authorization token
 * - 请求参数（URL参数）：projectId
 */
export function clearProjectPhotos(projectId) {
  // 确保projectId是正确的类型
  const projectIdValue = typeof projectId === 'string' ? parseInt(projectId, 10) : Number(projectId);
  
  // 检查projectId是否有效
  if (isNaN(projectIdValue) || projectIdValue <= 0) {
    const error = new Error(`无效的项目ID: ${projectId}`);
    console.error('❌ [心形墙API] 项目ID验证失败:', error);
    return Promise.reject(error);
  }
  
  // 将projectId作为URL参数传递
  const url = `/api/heart-wall/clear-photos?projectId=${projectIdValue}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [心形墙API] 开始清空项目照片');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📝 项目ID:', projectId, '→', projectIdValue, '(类型: number)');
  console.log('📤 URL参数: projectId=' + projectIdValue);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  // PUT请求，不传递body数据（参数已在URL中）
  return http.put(url, {}).then(response => {
    console.log('✅ [心形墙API] 清空项目照片成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [心形墙API] 清空项目照片失败');
    console.error('🔴 HTTP状态码:', error.statusCode || '未知');
    console.error('🔴 错误消息:', error.message || error.data?.message || '未知错误');
    console.error('🔴 完整错误对象:', error);
    throw error;
  });
}

