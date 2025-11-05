/**
 * 情侣关系 API
 * 对接后端接口文档：情侣关系绑定API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';
import { getUserInfo as getUserInfoFromAuth } from '../utils/auth.js';
import { getUserInfo as getUserInfoFromAPI } from './login.js';

/**
 * 获取当前用户ID
 * @returns {Promise<string>} 返回用户ID
 */
async function getCurrentUserId() {
  try {
    console.log('🔍 [获取用户ID] 开始尝试获取用户ID...');
    
    // 方法1: 从本地登录信息中获取
    const userInfo = getUserInfoFromAuth();
    console.log('🔍 [方法1] 从auth.js获取用户信息:', userInfo);
    if (userInfo && userInfo.userId) {
      console.log('✅ [方法1] 成功获取userId:', userInfo.userId);
      return userInfo.userId;
    }
    
    // 方法2: 从登录信息中查找userId
    const loginInfo = uni.getStorageSync('login_info');
    console.log('🔍 [方法2] 从登录信息获取:', loginInfo ? '找到登录信息' : '未找到登录信息');
    if (loginInfo) {
      console.log('🔍 [方法2] 登录信息完整结构:', JSON.stringify(loginInfo, null, 2));
      
      // 尝试多个可能的字段名
      if (loginInfo.userId) {
        console.log('✅ [方法2] 从loginInfo.userId获取:', loginInfo.userId);
        return loginInfo.userId;
      }
      if (loginInfo.userInfo && loginInfo.userInfo.userId) {
        console.log('✅ [方法2] 从loginInfo.userInfo.userId获取:', loginInfo.userInfo.userId);
        return loginInfo.userInfo.userId;
      }
      if (loginInfo.data && loginInfo.data.userId) {
        console.log('✅ [方法2] 从loginInfo.data.userId获取:', loginInfo.data.userId);
        return loginInfo.data.userId;
      }
      // 尝试openid作为userId（微信小程序场景）
      if (loginInfo.openid) {
        console.log('✅ [方法2] 使用openid作为userId:', loginInfo.openid);
        return loginInfo.openid;
      }
    }
    
    // 方法3: 调用API获取用户信息
    console.log('🔍 [方法3] 尝试调用用户信息API...');
    try {
      const response = await getUserInfoFromAPI();
      console.log('🔍 [方法3] API响应:', response);
      if (response && response.success && response.data && response.data.userId) {
        console.log('✅ [方法3] 从API获取userId:', response.data.userId);
        // 保存userId到本地登录信息
        if (loginInfo) {
          if (!loginInfo.userInfo) {
            loginInfo.userInfo = {};
          }
          loginInfo.userInfo.userId = response.data.userId;
          uni.setStorageSync('login_info', loginInfo);
          console.log('💾 [方法3] 已保存userId到本地存储');
        }
        return response.data.userId;
      } else {
        console.warn('⚠️ [方法3] API响应中没有userId:', response);
      }
    } catch (apiError) {
      console.warn('⚠️ [方法3] 调用用户信息API失败:', apiError);
    }
    
    // 方法4: 从token中解析（如果是JWT）
    if (loginInfo && loginInfo.token) {
      console.log('🔍 [方法4] 尝试从token解析userId...');
      try {
        const tokenParts = loginInfo.token.split('.');
        console.log('🔍 [方法4] Token分段数量:', tokenParts.length);
        if (tokenParts.length === 3) {
          // uni-app兼容的base64解码
          let base64Payload = tokenParts[1];
          // 处理base64 padding
          base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
          while (base64Payload.length % 4) {
            base64Payload += '=';
          }
          
          // 使用uni-app的base64解码或原生方法
          let decodedPayload;
          try {
            if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
              // uni-app方式
              const arrayBuffer = uni.base64ToArrayBuffer(base64Payload);
              decodedPayload = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
            } else {
              // 浏览器方式（H5环境）
              decodedPayload = decodeURIComponent(atob(base64Payload));
            }
            
            const payload = JSON.parse(decodedPayload);
            console.log('🔍 [方法4] Token payload:', payload);
            if (payload.userId || payload.uid || payload.user_id) {
              const userId = payload.userId || payload.uid || payload.user_id;
              console.log('✅ [方法4] 从token解析userId:', userId);
              return userId;
            } else {
              console.warn('⚠️ [方法4] Token payload中没有userId字段');
            }
          } catch (decodeError) {
            console.warn('⚠️ [方法4] Token解码失败:', decodeError);
            // 如果token不是标准JWT格式，尝试直接使用openid
            if (loginInfo.openid) {
              console.log('✅ [方法4] 使用openid作为userId:', loginInfo.openid);
              return loginInfo.openid;
            }
          }
        } else {
          console.warn('⚠️ [方法4] Token格式不正确，不是JWT格式');
          // 如果token不是JWT格式，尝试直接使用openid
          if (loginInfo.openid) {
            console.log('✅ [方法4] 使用openid作为userId:', loginInfo.openid);
            return loginInfo.openid;
          }
        }
      } catch (e) {
        console.warn('⚠️ [方法4] 从token解析userId失败:', e);
      }
    } else {
      console.warn('⚠️ [方法4] 登录信息中没有token');
    }
    
    // 所有方法都失败
    console.error('❌ [获取用户ID] 所有方法都失败，无法获取用户ID');
    console.error('❌ [登录信息]', loginInfo);
    throw new Error('无法获取用户ID，请先登录');
  } catch (error) {
    console.error('❌ [获取用户ID] 异常:', error);
    throw error;
  }
}

/**
 * 生成邀请码
 * @returns {Promise<Object>} 返回邀请码信息
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/couple/invite/create
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     userId: "user_123"
 *   }
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
  
  // 先获取userId，然后发送请求
  return getCurrentUserId().then(userId => {
    console.log('👤 用户ID:', userId);
    console.log('📤 请求参数: { userId:', userId, '}');
    
    return http.post(url, { userId }).then(response => {
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
    });
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
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 [情侣关系API] 开始验证邀请码');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 [请求地址]', fullUrl);
  console.log('📋 [请求方法] GET');
  console.log('📝 [原始邀请码]', inviteCode);
  console.log('📝 [邀请码类型]', typeof inviteCode);
  console.log('📝 [邀请码长度]', inviteCode ? inviteCode.length : 0);
  console.log('📝 [URL编码后邀请码]', encodeURIComponent(inviteCode));
  console.log('📝 [完整URL参数]', 'code=' + encodeURIComponent(inviteCode));
  console.log('⏰ [请求时间]', new Date().toLocaleString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return http.get(url).then(response => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [情侣关系API] 验证邀请码成功');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 [响应数据类型]', typeof response);
    console.log('📦 [完整响应数据]', JSON.stringify(response, null, 2));
    
    if (response && typeof response === 'object') {
      console.log('📦 [响应数据字段列表]', Object.keys(response).join(', '));
    }
    
    // 处理标准格式：response.data.creator
    if (response && response.data && response.data.creator) {
      console.log(`📝 [返回的邀请码] ${response.data.code || inviteCode}`);
      console.log(`👤 [发起方昵称] ${response.data.creator?.nickName || '未知'}`);
      console.log(`👤 [发起方ID] ${response.data.creator?.id || '未知'}`);
      console.log(`⏰ [过期时间] ${response.data.expireAt || '未知'}`);
      if (response.data.creator) {
        console.log('👤 [发起方完整信息]', JSON.stringify(response.data.creator, null, 2));
      }
      return response;
    }
    
    // 处理直接返回 creator 的情况
    if (response && response.creator) {
      console.log(`👤 [发起方昵称] ${response.creator?.nickName || '未知'}`);
      console.log(`👤 [发起方ID] ${response.creator?.id || '未知'}`);
      return { success: true, data: response };
    }
    
    // 处理新格式：inviterNickName, inviterId, inviterAvatarUrl
    if (response && (response.inviterNickName || response.inviterId)) {
      console.log(`👤 [发起方昵称] ${response.inviterNickName || '未知'}`);
      console.log(`👤 [发起方ID] ${response.inviterId || '未知'}`);
      console.log(`🖼️ [发起方头像] ${response.inviterAvatarUrl || '未知'}`);
      
      // 转换为统一格式
      const normalizedResponse = {
        success: response.success !== undefined ? response.success : true,
        message: response.message || '邀请码有效',
        data: {
          code: inviteCode,
          creator: {
            id: response.inviterId,
            nickName: response.inviterNickName,
            avatarUrl: response.inviterAvatarUrl
          },
          expireAt: response.expireAt || null
        }
      };
      
      console.log('✅ [数据格式转换] 已将新格式转换为标准格式');
      console.log('📦 [转换后的数据]', JSON.stringify(normalizedResponse, null, 2));
      return normalizedResponse;
    }
    
    // 如果都不匹配，返回错误
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️ [情侣关系API] 响应数据格式异常');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('📦 [响应数据]', response);
    console.warn('📦 [响应数据类型]', typeof response);
    if (response && typeof response === 'object') {
      console.warn('📦 [响应数据字段]', Object.keys(response).join(', '));
    }
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: false, message: response?.message || '邀请码验证失败' };
  }).catch(error => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [情侣关系API] 验证邀请码失败');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('📝 [输入的邀请码]', inviteCode);
    console.error('📝 [邀请码类型]', typeof inviteCode);
    console.error('📝 [邀请码长度]', inviteCode ? inviteCode.length : 0);
    console.error('🔴 [错误对象]', error);
    console.error('🔴 [错误类型]', typeof error);
    console.error('🔴 [错误消息]', error?.message);
    console.error('🔴 [错误状态码]', error?.statusCode);
    console.error('🔴 [错误数据]', error?.data);
    console.error('🔴 [错误响应数据]', error?.responseData);
    if (error && typeof error === 'object') {
      console.error('🔴 [错误对象字段列表]', Object.keys(error).join(', '));
    }
    if (error?.stack) {
      console.error('🔴 [错误堆栈]', error.stack);
    }
    console.error('⏰ [错误时间]', new Date().toLocaleString());
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    } else if (response && (response.isCouple !== undefined)) {
      // 兼容后端返回 isCouple 字段的情况
      console.log('📊 绑定状态:');
      console.log(`   - 是否已绑定: ${response.isCouple ? '是' : '否'}`);
      return {
        success: response.success !== false,
        message: response.message || '查询成功',
        data: {
          isBound: response.isCouple,
          coupleId: response.coupleId || null,
          partnerInfo: response.partnerInfo || null,
          bindTime: response.bindTime || null,
          role: response.role || null
        }
      };
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
    // 如果错误消息是"没有情侣关系"，说明已经达到解绑的目的（没有关系可解）
    // 这种情况可以视为成功，因为目标就是解除关系
    const errorMessage = error.message || (error.data && error.data.message) || '';
    
    if (errorMessage.includes('没有情侣关系') || errorMessage.includes('未绑定') || errorMessage.includes('不存在')) {
      console.warn('⚠️ [情侣关系API] 解绑时检测到"没有情侣关系"，视为成功');
      console.warn('💡 说明：没有关系可解，目标已达成');
      return {
        success: true,
        message: '已解除关系（原本没有情侣关系）',
        data: null
      };
    }
    
    console.error('❌ [情侣关系API] 解绑关系失败');
    console.error('🔴 错误信息:', error);
    throw error;
  });
}

