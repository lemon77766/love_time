/**
 * HTTP 请求封装工具
 * 统一处理请求、响应、错误
 */

import config from './config.js';

class Http {
  /**
   * 发送HTTP请求
   * @param {Object} options - 请求配置
   * @returns {Promise} 返回Promise对象
   */
  request(options = {}) {
    return new Promise((resolve, reject) => {
      // 获取存储的登录信息
      const loginInfo = uni.getStorageSync('login_info') || {};
      
      // 构建完整的请求URL
      const url = config.baseURL + options.url;
      
      // 请求配置
      const requestOptions = {
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          // 如果已登录，携带token
          'Authorization': loginInfo.token ? `Bearer ${loginInfo.token}` : '',
          ...options.header
        },
        timeout: options.timeout || config.timeout,
        success: (res) => {
          console.log('请求成功:', url, res);
          
          // 根据状态码处理
          if (res.statusCode === 200) {
            // 检查业务状态
            if (res.data.success) {
              resolve(res.data.data);
            } else {
              reject(new Error(res.data.message || '请求失败'));
            }
          } else if (res.statusCode === 401) {
            // token过期或未登录
            this.handleUnauthorized();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('请求失败:', url, err);
          
          // 开发环境提示
          if (process.env.NODE_ENV === 'development') {
            console.warn('开发模式：后端接口未就绪');
          }
          
          reject(err);
        }
      };
      
      // 发送请求
      uni.request(requestOptions);
    });
  }
  
  /**
   * GET 请求
   */
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    });
  }
  
  /**
   * POST 请求
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    });
  }
  
  /**
   * PUT 请求
   */
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  }
  
  /**
   * DELETE 请求
   */
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    });
  }
  
  /**
   * 处理未授权（401）
   */
  handleUnauthorized() {
    // 清除登录信息
    uni.removeStorageSync('login_info');
    
    // 提示用户
    uni.showToast({
      title: '登录已过期',
      icon: 'none',
      duration: 2000
    });
    
    // 跳转到登录页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/index'
      });
    }, 2000);
  }
}

// 导出单例
export default new Http();
