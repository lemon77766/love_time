/**
 * API 配置文件
 * 用于统一管理后端接口地址
 */

// 后端服务器地址配置
const CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://192.168.54.229:8080/lovetime',  // 后端服务器地址
    timeout: 10000
  },
  // 生产环境
  production: {
    baseURL: 'https://your-backend-domain.com',  // 正式服务器地址
    timeout: 10000
  }
};

// 获取当前环境配置
const ENV = process.env.NODE_ENV || 'development';
const currentConfig = CONFIG[ENV];

// 导出配置
export default {
  // 基础URL
  baseURL: currentConfig.baseURL,
  // 请求超时时间
  timeout: currentConfig.timeout,
  
  // API 接口路径
  API: {
    // 登录相关
    LOGIN: {
      WECHAT: '/api/login/wechat',        // 微信登录
      LOGOUT: '/api/login/logout'          // 退出登录
    },
    // 用户相关
    USER: {
      INFO: '/api/user/info',              // 获取用户信息
      UPDATE: '/api/user/update'           // 更新用户信息
    },
    // 信件相关
    LETTER: {
      CREATE: '/api/letter/create',        // 创建信件
      LIST: '/api/letter/list',            // 获取信件列表
      DETAIL: '/api/letter/detail',        // 获取信件详情
      DELETE: '/api/letter/delete'         // 删除信件
    }
  }
};
