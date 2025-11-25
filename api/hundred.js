/**
 * 一百件事挑战 API
 * 对接后端接口文档：前端对接文档 - 一百事挑战API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 获取任务列表
 * @returns {Promise<Object>} 返回任务列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/challenge/tasks
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "获取成功",
 *     tasks: [
 *       {
 *         id: number,
 *         taskName: string,
 *         taskDescription: string,
 *         taskIndex: number | null,
 *         category: "preset" | "custom",
 *         iconUrl: string | null,
 *         status: "pending" | "completed",
 *         photoUrl: string | null,
 *         note: string | null,
 *         isFavorited: boolean,
 *         completedAt: string | null
 *       }
 *     ]
 *   }
 */
export function getTasks() {
  const url = config.API.CHALLENGE.LIST;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [一百件事API] 开始请求任务列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [一百件事API] 获取任务列表成功');
    console.log('📦 响应数据:', response);

    // 统一兼容多种返回格式
    // 1）理想格式：{ success, tasks: [...] }
    if (response && Array.isArray(response.tasks)) {
      const tasks = response.tasks;
      console.log(`📊 任务总数: ${tasks.length}`);
      const presetCount = tasks.filter(t => t.category === 'preset').length;
      const customCount = tasks.filter(t => t.category === 'custom').length;
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      console.log(`   - 预设任务: ${presetCount} 个`);
      console.log(`   - 自定义任务: ${customCount} 个`);
      console.log(`   - 已完成: ${completedCount} 个`);

      return { 
        success: response.success ?? true,
        msg: response.message || response.msg || '',
        code: response.code ?? 200,
        tasks 
      };
    }

    // 2）当前后端实际格式：{ msg, code, data: [...] }
    if (response && Array.isArray(response.data)) {
      const tasks = response.data;
      console.log(`📊 任务总数(从 data 中解析): ${tasks.length}`);
      const presetCount = tasks.filter(t => t.category === 'preset').length;
      const customCount = tasks.filter(t => t.category === 'custom').length;
      console.log(`   - 预设任务: ${presetCount} 个`);
      console.log(`   - 自定义任务: ${customCount} 个`);

      return {
        success: response.code === 200,
        msg: response.msg || response.message || '操作成功',
        code: response.code,
        tasks
      };
    }

    // 3）直接返回数组：[ {...}, {...} ]
    if (response && Array.isArray(response)) {
      console.log('📊 任务总数(数组格式):', response.length);
      return { success: true, tasks: response };
    }

    // 4）其他未知格式
    console.warn('⚠️ 响应数据格式异常:', response);
    return { success: false, tasks: [] };
  }).catch(error => {
    console.error('❌ [一百件事API] 获取任务列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取用户进度
 * @returns {Promise<Object>} 返回进度信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/challenge/progress
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "获取成功",
 *     progress: {
 *       totalTasks: number,
 *       completedCount: number,
 *       favoritedCount: number,
 *       completionRate: number,
 *       lastActiveAt: string
 *     }
 *   }
 */
export function getProgress() {
  const url = config.API.CHALLENGE.PROGRESS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [一百件事API] 开始请求用户进度');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [一百件事API] 获取用户进度成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.progress) {
      const progress = response.progress;
      console.log('📊 进度统计:');
      console.log(`   - 总任务数: ${progress.totalTasks}`);
      console.log(`   - 已完成: ${progress.completedCount}`);
      console.log(`   - 已收藏: ${progress.favoritedCount}`);
      console.log(`   - 完成率: ${progress.completionRate}%`);
      console.log(`   - 最后活跃: ${progress.lastActiveAt || '未知'}`);
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [一百件事API] 获取用户进度失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 添加自定义任务
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.taskName - 任务名称（必填）
 * @param {string} [taskData.taskDescription] - 任务描述（可选）
 * @returns {Promise<Object>} 返回添加结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/challenge/task/add
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     taskName: string,
 *     taskDescription?: string
 *   }
 */
export function addTask(taskData) {
  const url = config.API.CHALLENGE.ADD;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [一百件事API] 开始添加自定义任务');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', taskData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, {
    taskName: taskData.taskName,
    taskDescription: taskData.taskDescription || ''
  }).then(response => {
    console.log('✅ [一百件事API] 添加任务成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.task) {
      console.log(`📝 新任务ID: ${response.task.id}`);
      console.log(`📝 任务名称: ${response.task.taskName}`);
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [一百件事API] 添加任务失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 删除自定义任务
 * @param {number} taskId - 任务ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/challenge/task/delete
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     taskId: number
 *   }
 */
export function deleteTask(taskId) {
  const url = config.API.CHALLENGE.DELETE;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [一百件事API] 开始删除任务');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数: { taskId:', taskId, '}');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, { taskId }).then(response => {
    console.log('✅ [一百件事API] 删除任务成功');
    console.log('📦 响应数据:', response);
    console.log(`🗑️ 已删除任务ID: ${taskId}`);
    
    return response;
  }).catch(error => {
    console.error('❌ [一百件事API] 删除任务失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 标记任务完成/取消完成
 * @param {Object} completeData - 完成数据
 * @param {number} completeData.taskId - 任务ID（必填）
 * @param {boolean} completeData.completed - 是否完成（必填）
 * @param {string} [completeData.photoUrl] - 完成时上传的照片URL（可选）
 * @param {string} [completeData.note] - 完成时的备注说明（可选）
 * @returns {Promise<Object>} 返回操作结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/challenge/complete
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     taskId: number,
 *     completed: boolean,
 *     photoUrl?: string,
 *     note?: string
 *   }
 */
export function completeTask(completeData) {
  const url = config.API.CHALLENGE.COMPLETE;
  const fullUrl = config.baseURL + url;
  
  const action = completeData.completed ? '标记完成' : '取消完成';
  console.log(`🔗 [一百件事API] 开始${action}任务`);
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', completeData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, {
    taskId: completeData.taskId,
    completed: completeData.completed,
    photoUrl: completeData.photoUrl || null,
    note: completeData.note || null
  }).then(response => {
    console.log(`✅ [一百件事API] ${action}任务成功`);
    console.log('📦 响应数据:', response);
    console.log(`📝 任务ID: ${completeData.taskId}, 状态: ${completeData.completed ? '已完成' : '未完成'}`);
    
    return response;
  }).catch(error => {
    console.error(`❌ [一百件事API] ${action}任务失败`);
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 上传任务完成照片
 * @param {string} filePath - 本地文件路径（必填）
 * @returns {Promise<Object>} 返回包含 photoUrl 的结果
 *
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/challenge/upload
 * - 请求格式：multipart/form-data
 * - 请求参数：file（文件字段，必需）
 * - 响应格式：
 *   {
 *     success: true,
 *     message: "照片上传成功",
 *     photoUrl: "http://.../challenge/xxx.jpg"
 *   }
 */
export function uploadChallengePhoto(filePath) {
  if (!filePath) {
    return Promise.reject(new Error('上传照片失败：filePath 不能为空'));
  }

  const url = config.API.CHALLENGE.UPLOAD;
  const fullUrl = config.baseURL + url;

  console.log('🔗 [一百件事API] 开始上传任务完成照片');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST (multipart/form-data)');
  console.log('📁 文件路径:', filePath);
  console.log('⏰ 请求时间:', new Date().toLocaleString());

  return http.upload({
    url: url,
    filePath: filePath,
    name: 'file'
  }).then(response => {
    console.log('✅ [一百件事API] 上传任务完成照片成功');
    console.log('📦 响应数据:', response);
    console.log('📦 响应数据类型:', typeof response);
    console.log('📦 响应数据结构:', Object.keys ? Object.keys(response) : '无法获取键名');

    // 更详细地检查响应数据
    console.log('🔍 [响应分析] 详细字段检查:');
    console.log('   - response.photoUrl:', response?.photoUrl);
    console.log('   - response.url:', response?.url);
    console.log('   - response.data:', response?.data);
    console.log('   - response.data?.photoUrl:', response?.data?.photoUrl);
    console.log('   - response.data?.url:', response?.data?.url);
    console.log('   - response.data?.photo?.url:', response?.data?.photo?.url);
    console.log('   - response.message:', response?.message);
    console.log('   - response.msg:', response?.msg);
    console.log('   - response.success:', response?.success);

    const photoUrl =
      response?.photoUrl ||
      response?.url ||
      response?.data?.photoUrl ||
      response?.data?.url ||
      response?.data?.photo?.url ||
      (typeof response === 'string' ? response : null);

    console.log('🖼️ [图片URL提取] 提取结果:', photoUrl);

    if (!photoUrl) {
      console.error('❌ [一百件事API] 上传成功但未返回 photoUrl，响应：', response);
      const error = new Error('上传成功但未返回照片地址');
      error.response = response;
      throw error;
    }

    return {
      success: true,
      photoUrl,
      message: response?.message || response?.msg || '照片上传成功',
      raw: response
    };
  }).catch(error => {
    console.error('❌ [一百件事API] 上传任务完成照片失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 收藏/取消收藏任务
 * @param {Object} favoriteData - 收藏数据
 * @param {number} favoriteData.taskId - 任务ID（必填）
 * @param {boolean} favoriteData.favorited - 是否收藏（必填）
 * @returns {Promise<Object>} 返回操作结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/challenge/favorite
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     taskId: number,
 *     favorited: boolean
 *   }
 */
export function favoriteTask(favoriteData) {
  const url = config.API.CHALLENGE.FAVORITE;
  const fullUrl = config.baseURL + url;
  
  const action = favoriteData.favorited ? '收藏' : '取消收藏';
  console.log(`🔗 [一百件事API] 开始${action}任务`);
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', favoriteData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, {
    taskId: favoriteData.taskId,
    favorited: favoriteData.favorited
  }).then(response => {
    console.log(`✅ [一百件事API] ${action}任务成功`);
    console.log('📦 响应数据:', response);
    console.log(`⭐ 任务ID: ${favoriteData.taskId}, 收藏状态: ${favoriteData.favorited ? '已收藏' : '未收藏'}`);
    
    return response;
  }).catch(error => {
    console.error(`❌ [一百件事API] ${action}任务失败`);
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

