/**
 * 登录相关 API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 微信登录
 * @param {string} code - 微信登录凭证
 * @param {Object} userInfo - 用户信息
 * @returns {Promise<Object>} 返回登录结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/login/wechat
 * - 请求参数：
 *   {
 *     code: string,        // 微信登录凭证（必填）
 *     nickName: string,    // 用户昵称（必填）
 *     avatarUrl: string    // 用户头像（必填）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "登录成功",
 *     data: {
 *       token: string,         // 登录凭证，后续请求需携带
 *       openid: string,        // 微信用户唯一标识
 *       session_key: string,   // 会话密钥
 *       userId: string,        // 用户ID（可选）
 *       isNewUser: boolean     // 是否新用户（可选）
 *     }
 *   }
 */
export function wxLogin(code, userInfo) {
  return http.post(config.API.LOGIN.WECHAT, {
    code: code,
    nickName: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl
  });
}

/**
 * 退出登录
 * @returns {Promise<Object>} 返回退出结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/login/logout
 * - 请求头：需携带 Authorization token
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "退出成功"
 *   }
 */
export function logout() {
  return http.post(config.API.LOGIN.LOGOUT);
}

/**
 * 获取用户信息
 * @returns {Promise<Object>} 返回用户信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/user/info
 * - 请求头：需携带 Authorization token
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       userId: string,
 *       nickName: string,
 *       avatarUrl: string,
 *       phone: string,
 *       // ... 其他用户信息
 *     }
 *   }
 */
export function getUserInfo() {
  return http.get(config.API.USER.INFO);
}
