/**
 * 纪念日 API
 * 提供纪念日相关的增删改查接口
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 获取用户的纪念日列表
 * @returns {Promise<Object>} 返回纪念日列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/anniversary/list
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "获取纪念日列表成功",
 *     data: {
 *       anniversaryList: [
 *         {
 *           id: 1,
 *           title: "我们的第一次旅行",
 *           date: "2025-10-21",
 *           icon: "mdi:airplane",
 *           color: "#4A90E2",
 *           remind: true
 *         }
 *       ]
 *     }
 *   }
 */
export function getAnniversaryList() {
  const url = config.API.ANNIVERSARY.LIST;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [纪念日API] 开始获取纪念日列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [纪念日API] 获取纪念日列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const anniversaryData = response.data;
      console.log('📊 纪念日列表信息:');
      console.log(`   - 纪念日数量: ${anniversaryData.anniversaryList?.length || 0}`);
      return response;
    } else if (response && Array.isArray(response)) {
      // 兼容直接返回数组的情况
      return { success: true, data: { anniversaryList: response } };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [纪念日API] 获取纪念日列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 添加纪念日
 * @param {Object} anniversaryData - 纪念日数据
 * @returns {Promise<Object>} 返回添加结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/anniversary/create
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     title: "纪念日标题",
 *     date: "2025-10-21",
 *     icon: "mdi:airplane",
 *     color: "#4A90E2",
 *     remind: true
 *   }
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "添加纪念日成功",
 *     data: {
 *       id: 1,
 *       title: "纪念日标题",
 *       date: "2025-10-21",
 *       icon: "mdi:airplane",
 *       color: "#4A90E2",
 *       remind: true
 *     }
 *   }
 */
export function addAnniversary(anniversaryData) {
  const url = config.API.ANNIVERSARY.CREATE;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [纪念日API] 开始添加纪念日');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📥 请求参数:', anniversaryData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, anniversaryData).then(response => {
    console.log('✅ [纪念日API] 添加纪念日成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [纪念日API] 添加纪念日失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 更新纪念日
 * @param {number} id - 纪念日ID
 * @param {Object} anniversaryData - 纪念日数据
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/anniversary/update/{id}
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     title: "纪念日标题",
 *     date: "2025-10-21",
 *     icon: "mdi:airplane",
 *     color: "#4A90E2",
 *     remind: true
 *   }
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "更新纪念日成功",
 *     data: {
 *       id: 1,
 *       title: "纪念日标题",
 *       date: "2025-10-21",
 *       icon: "mdi:airplane",
 *       color: "#4A90E2",
 *       remind: true
 *     }
 *   }
 */
export function updateAnniversary(id, anniversaryData) {
  const url = `${config.API.ANNIVERSARY.UPDATE}/${id}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [纪念日API] 开始更新纪念日');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📥 请求参数:', anniversaryData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.put(url, anniversaryData).then(response => {
    console.log('✅ [纪念日API] 更新纪念日成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [纪念日API] 更新纪念日失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 删除纪念日
 * @param {number} id - 纪念日ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：DELETE
 * - 请求地址：/api/anniversary/delete/{id}
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "删除纪念日成功"
 *   }
 */
export function deleteAnniversary(id) {
  const url = `${config.API.ANNIVERSARY.DELETE}/${id}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [纪念日API] 开始删除纪念日');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: DELETE');
  console.log('🆔 纪念日ID:', id);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.delete(url).then(response => {
    console.log('✅ [纪念日API] 删除纪念日成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [纪念日API] 删除纪念日失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 切换纪念日提醒状态
 * @param {number} id - 纪念日ID
 * @param {boolean} remind - 提醒状态
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/anniversary/remind/{id}
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     remind: true
 *   }
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "更新提醒状态成功"
 *   }
 */
export function toggleAnniversaryRemind(id, remind) {
  const url = `${config.API.ANNIVERSARY.REMIND}/${id}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [纪念日API] 开始切换纪念日提醒状态');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📥 请求参数:', { remind });
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.put(url, { remind }).then(response => {
    console.log('✅ [纪念日API] 切换纪念日提醒状态成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [纪念日API] 切换纪念日提醒状态失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}