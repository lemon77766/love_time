/**
 * 情侣关系 API
 * 对接后端接口文档：情侣关系绑定API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 生成邀请码
 * @returns {Promise<Object>} 返回邀请码信息
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/couple/invite/create
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "邀请码生成成功",
 *     data: {
 *       inviteCode: "ABC123",
 *       expireAt: "2024-01-16T10:30:00Z"
 *     }
 *   }
 */
export function createInviteCode() {
  const url = config.API.COUPLE.INVITE_CREATE;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [情侣关系API] 开始生成邀请码');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url).then(response => {
    console.log('✅ [情侣关系API] 生成邀请码成功');
    console.log('📦 响应数据:', response);
    
    // 优先处理标准格式：response.data.inviteCode
    if (response && response.data && response.data.inviteCode) {
      console.log(`📝 邀请码: ${response.data.inviteCode}`);
      console.log(`⏰ 过期时间: ${response.data.expireAt}`);
      return response;
    }
    // 兼容后端返回格式：response.invitation
    else if (response && response.invitation) {
      const invitation = response.invitation;
      console.log(`📝 邀请码: ${invitation.inviteCode || invitation.code || ''}`);
      console.log(`⏰ 过期时间: ${invitation.expireAt || invitation.expireTime || ''}`);
      // 统一转换为标准格式
      return {
        success: response.success !== false,
        message: response.message || '邀请码生成成功',
        data: {
          inviteCode: invitation.inviteCode || invitation.code || '',
          expireAt: invitation.expireAt || invitation.expireTime || ''
        },
        isBound: response.isBound || false
      };
    }
    // 兼容直接返回邀请码的情况
    else if (response && (response.inviteCode || response.code)) {
      console.log(`📝 邀请码: ${response.inviteCode || response.code}`);
      return {
        success: response.success !== false,
        message: response.message || '邀请码生成成功',
        data: {
          inviteCode: response.inviteCode || response.code || '',
          expireAt: response.expireAt || response.expireTime || ''
        }
      };
    }
    // 数据格式异常
    else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return {
        success: response.success !== false,
        message: response.message || '生成成功',
        data: { inviteCode: '', expireAt: '' }
      };
    }
  }).catch(error => {
    console.error('❌ [情侣关系API] 生成邀请码失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 验证邀请码
 * @param {string} inviteCode - 邀请码
 * @returns {Promise<Object>} 返回邀请码验证结果和发起方信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/couple/invite/validate?code=ABC123
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "邀请码有效",
 *     data: {
 *       code: "ABC123",
 *       creator: {
 *         userId: "user_123",
 *         nickName: "用户昵称",
 *         avatarUrl: "头像URL",
 *         displayName: "显示昵称",
 *         displayAvatar: "显示头像"
 *       },
 *       expireAt: "2024-01-16T10:30:00Z"
 *     }
 *   }
 */
export function validateInviteCode(inviteCode) {
  const url = config.API.COUPLE.INVITE_VALIDATE + '?code=' + encodeURIComponent(inviteCode);
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [情侣关系API] 开始验证邀请码');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('📝 邀请码:', inviteCode);
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [情侣关系API] 验证邀请码成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`📝 邀请码: ${response.data.code}`);
      console.log(`👤 发起方: ${response.data.creator?.nickName || '未知'}`);
      return response;
    } else if (response && response.creator) {
      // 兼容直接返回创建者信息的情况
      console.log(`👤 发起方: ${response.creator?.nickName || '未知'}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: false, message: '邀请码验证失败' };
    }
  }).catch(error => {
    console.error('❌ [情侣关系API] 验证邀请码失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 接受邀请（建立情侣关系）
 * @param {string} inviteCode - 邀请码
 * @returns {Promise<Object>} 返回绑定结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/couple/bind/accept
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     inviteCode: "ABC123"
 *   }
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "绑定成功",
 *     data: {
 *       coupleId: "couple_123456",
 *       partnerInfo: {
 *         userId: "user_789",
 *         nickName: "对方昵称",
 *         avatarUrl: "头像URL",
 *         displayName: "显示昵称",
 *         displayAvatar: "显示头像"
 *       },
 *       bindTime: "2024-01-15T10:30:00Z"
 *     }
 *   }
 */
export function acceptInvite(inviteCode) {
  const url = config.API.COUPLE.BIND_ACCEPT;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [情侣关系API] 开始接受邀请');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('📤 请求参数: { inviteCode:', inviteCode, '}');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url, { inviteCode }).then(response => {
    console.log('✅ [情侣关系API] 接受邀请成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      console.log(`💑 关系ID: ${response.data.coupleId}`);
      console.log(`👤 对方昵称: ${response.data.partnerInfo?.nickName || '未知'}`);
      return response;
    } else if (response && response.coupleId) {
      // 兼容直接返回关系信息的情况
      console.log(`💑 关系ID: ${response.coupleId}`);
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return response;
    }
  }).catch(error => {
    console.error('❌ [情侣关系API] 接受邀请失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 查询绑定状态
 * @returns {Promise<Object>} 返回绑定状态信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/couple/status
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     data: {
 *       isBound: true,
 *       coupleId: "couple_123456",
 *       partnerInfo: {
 *         userId: "user_789",
 *         nickName: "对方昵称",
 *         avatarUrl: "头像URL",
 *         displayName: "显示昵称",
 *         displayAvatar: "显示头像"
 *       },
 *       bindTime: "2024-01-15T10:30:00Z",
 *       role: "initiator"
 *     }
 *   }
 */
export function getCoupleStatus() {
  const url = config.API.COUPLE.STATUS;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [情侣关系API] 开始查询绑定状态');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: GET');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.get(url).then(response => {
    console.log('✅ [情侣关系API] 查询绑定状态成功');
    console.log('📦 响应数据:', response);
    
    if (response && response.data) {
      const status = response.data;
      console.log('📊 绑定状态:');
      console.log(`   - 是否已绑定: ${status.isBound ? '是' : '否'}`);
      if (status.isBound) {
        console.log(`   - 关系ID: ${status.coupleId}`);
        console.log(`   - 对方昵称: ${status.partnerInfo?.nickName || '未知'}`);
        console.log(`   - 绑定时间: ${status.bindTime || '未知'}`);
      }
      return response;
    } else if (response && (response.isBound !== undefined || response.coupleId)) {
      // 兼容直接返回状态的情况
      return { success: true, data: response };
    } else {
      console.warn('⚠️ 响应数据格式异常:', response);
      return { success: true, data: { isBound: false } };
    }
  }).catch(error => {
    console.error('❌ [情侣关系API] 查询绑定状态失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

/**
 * 解绑关系
 * @returns {Promise<Object>} 返回解绑结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/couple/unbind
 * - 请求头：需携带 Authorization token
 * - 返回数据格式：
 *   {
 *     success: true,
 *     message: "解绑成功"
 *   }
 */
export function unbindCouple() {
  const url = config.API.COUPLE.UNBIND;
  const fullUrl = config.baseURL + url;
  
  console.log('🔗 [情侣关系API] 开始解绑关系');
  console.log('📍 请求地址:', fullUrl);
  console.log('📋 请求方法: POST');
  console.log('⏰ 请求时间:', new Date().toLocaleString());
  
  return http.post(url).then(response => {
    console.log('✅ [情侣关系API] 解绑关系成功');
    console.log('📦 响应数据:', response);
    return response;
  }).catch(error => {
    console.error('❌ [情侣关系API] 解绑关系失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

