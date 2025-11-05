/**
 * 用户信息 API
 * 对接后端接口文档：用户信息API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 更新用户资料（昵称和头像）
 * @param {string} nickName - 用户昵称
 * @param {string} avatarUrl - 用户头像URL
 * @returns {Promise<object>} 返回更新结果
 */
export async function updateUserProfile(nickName, avatarUrl) {
  try {
    console.log('🔗 [更新用户资料] 开始更新用户资料...');
    console.log('📋 [参数] nickName:', nickName);
    console.log('📋 [参数] avatarUrl:', avatarUrl);
    
    // 使用配置中的正确API路径
    const response = await http.post(config.API.USER.UPDATE, {
      nickName: nickName || '',
      avatarUrl: avatarUrl || ''
    });
    
    console.log('✅ [更新用户资料] 更新成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [更新用户资料] 更新失败:', error);
    throw error;
  }
}

/**
 * 获取用户信息
 * @returns {Promise<object>} 返回用户信息
 */
export async function getUserInfo() {
  try {
    const response = await http.get('/api/user/info');
    return response;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

