/**
 * 未来情书 API
 * 对接后端接口文档：未来情书API接口文档
 * 基础URL前缀：/api/future-letter
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 创建未来情书
 * @param {Object} letterData - 情书数据
 * @param {number} [letterData.receiverId] - 接收者用户ID（可选，当deliveryMethod为PARTNER时使用）
 * @param {string} letterData.title - 情书标题（必填）
 * @param {string} letterData.content - 情书内容（必填）
 * @param {string} letterData.deliveryMethod - 发送方式：目前只支持PARTNER（情侣）
 * @param {string} letterData.scheduledDate - 预计发送日期（必填，格式：YYYY-MM-DD）
 * @param {string} [letterData.scheduledTime] - 预计发送时间（可选，格式：HH:MM:SS，默认为00:00:00）
 * @param {string} [letterData.status] - 状态：DRAFT（草稿）、SCHEDULED（已安排）
 * @param {string} [letterData.backgroundImage] - 背景图片URL（可选）
 * @returns {Promise<Object>} 返回创建结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/future-letter
 * - 请求头：需携带 Authorization token
 */
export function createFutureLetter(letterData) {
  const url = config.API.FUTURE_LETTER.CREATE;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始创建未来情书');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数:', letterData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, letterData).then(response => {
    console.log('✅ [未来情书API] 创建未来情书成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 情书ID: ${response.data.id || '未知'}`);
      console.log(`📝 情书标题: ${response.data.title || '未知'}`);
      return response;
    } else if (response && (response.id || response.letterId)) {
      // 兼容直接返回情书信息的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 创建未来情书失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取未来情书列表
 * @param {Object} [options] - 查询选项
 * @param {string} [options.status] - 筛选状态（可选，DRAFT、SCHEDULED、SENT等）
 * @returns {Promise<Object>} 返回情书列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter?status=DRAFT
 * - 请求头：需携带 Authorization token
 */
export function getFutureLetterList(options = {}) {
  let url = config.API.FUTURE_LETTER.LIST;
  
  // 添加查询参数
  const params = [];
  if (options.status) {
    params.push(`status=${encodeURIComponent(options.status)}`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取未来情书列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📄 查询参数:', options);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取未来情书列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : (response.data.letters || []);
      console.log(`📊 情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取未来情书列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取已发送情书列表
 * @returns {Promise<Object>} 返回已发送情书列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/sent
 * - 请求头：需携带 Authorization token
 */
export function getSentLetters() {
  const url = config.API.FUTURE_LETTER.SENT;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取已发送情书列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取已发送情书列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : (response.data.letters || []);
      console.log(`📊 已发送情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 已发送情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取已发送情书列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取收到情书列表
 * @returns {Promise<Object>} 返回收到情书列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/received
 * - 请求头：需携带 Authorization token
 */
export function getReceivedLetters() {
  const url = config.API.FUTURE_LETTER.RECEIVED;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取收到情书列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取收到情书列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : (response.data.letters || []);
      console.log(`📊 收到情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 收到情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取收到情书列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取统计信息
 * @returns {Promise<Object>} 返回统计信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/stats
 * - 请求头：需携带 Authorization token
 */
export function getFutureLetterStats() {
  const url = config.API.FUTURE_LETTER.STATS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取统计信息');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取统计信息成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📊 草稿数量: ${response.data.draftCount || 0}`);
      console.log(`📊 已安排数量: ${response.data.scheduledCount || 0}`);
      console.log(`📊 已发送数量: ${response.data.sentCount || 0}`);
      return response;
    } else if (response && (response.draftCount !== undefined || response.scheduledCount !== undefined)) {
      // 兼容直接返回统计信息的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取统计信息失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取可用字体列表
 * @returns {Promise<Object>} 返回字体列表
 *
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/fonts
 * - 请求头：需携带 Authorization token
 */
export function getFutureLetterFonts() {
  const url = config.API.FUTURE_LETTER.FONTS;
  const fullUrl = config.baseURL + url;

  console.log('🔗 [未来情书API] 开始获取字体列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());

  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取字体列表成功');
    console.log('📦 响应数据:', response);

    let fonts = [];
    if (response && Array.isArray(response.data)) {
      fonts = response.data;
    } else if (response && Array.isArray(response.fonts)) {
      fonts = response.fonts;
    } else if (response && response.data && Array.isArray(response.data.fonts)) {
      fonts = response.data.fonts;
    } else if (Array.isArray(response)) {
      fonts = response;
    } else {
      console.warn('⚠️ 字体列表响应数据格式异常:', response);
    }

    return { success: true, data: fonts };
  }).catch(error => {
    console.error('❌ [未来情书API] 获取字体列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取情书详情
 * @param {number|string} letterId - 情书ID
 * @returns {Promise<Object>} 返回情书详情
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/{id}
 * - 请求头：需携带 Authorization token
 */
export function getFutureLetterDetail(letterId) {
  const url = `${config.API.FUTURE_LETTER.DETAIL}/${letterId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取情书详情');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📝 情书ID:', letterId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取情书详情成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 情书标题: ${response.data.title || '未知'}`);
      return response;
    } else if (response && (response.id || response.letterId)) {
      // 兼容直接返回情书详情的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取情书详情失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 更新未来情书
 * @param {number|string} letterId - 情书ID
 * @param {Object} letterData - 情书数据（同创建接口）
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：PUT
 * - 请求地址：/api/future-letter/{id}
 * - 请求头：需携带 Authorization token
 */
export function updateFutureLetter(letterId, letterData) {
  const url = `${config.API.FUTURE_LETTER.UPDATE}/${letterId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始更新未来情书');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: PUT');
  console.log('📝 情书ID:', letterId);
  console.log('📤 请求参数:', letterData);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.put(url, letterData).then(response => {
    console.log('✅ [未来情书API] 更新未来情书成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [未来情书API] 更新未来情书失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 发送未来情书（立即发送）
 * @param {number|string} letterId - 情书ID
 * @returns {Promise<Object>} 返回发送结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/future-letter/{id}/send
 * - 请求头：需携带 Authorization token
 */
export function sendFutureLetter(letterId) {
  const url = `${config.API.FUTURE_LETTER.SEND}/${letterId}/send`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始发送未来情书');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📝 情书ID:', letterId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, {}).then(response => {
    console.log('✅ [未来情书API] 发送未来情书成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 情书状态: ${response.data.status || '未知'}`);
      if (response.data.sentAt) {
        console.log(`📝 发送时间: ${response.data.sentAt}`);
      }
      return response;
    } else {
      return response;
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 发送未来情书失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 删除未来情书
 * @param {number|string} letterId - 情书ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：DELETE
 * - 请求地址：/api/future-letter/{id}
 * - 请求头：需携带 Authorization token
 */
export function deleteFutureLetter(letterId) {
  const url = `${config.API.FUTURE_LETTER.DELETE}/${letterId}`;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始删除未来情书');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: DELETE');
  console.log('📝 情书ID:', letterId);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.delete(url).then(response => {
    console.log('✅ [未来情书API] 删除未来情书成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [未来情书API] 删除未来情书失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 获取未读情书
 * @returns {Promise<Object>} 返回未读情书列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/future-letter/unread
 * - 请求头：需携带 Authorization token
 */
export function getUnreadLetters() {
  const url = '/api/future-letter/unread';
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [未来情书API] 开始获取未读情书列表');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [未来情书API] 获取未读情书列表成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : (response.data.letters || []);
      console.log(`📊 未读情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      console.log(`📊 未读情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: [] };
    }
  }).catch(error => {
    console.error('❌ [未来情书API] 获取未读情书列表失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}
