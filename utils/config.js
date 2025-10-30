// 开发环境配置
const devConfig = {
  baseURL: 'http://192.168.54.229:8080/lovetime',
  timeout: 10000,  // 普通请求超时时间
  uploadTimeout: 30000,  // 上传请求超时时间
  API: {
    LOGIN: {
      WECHAT: '/api/login/wechat',
      LOGOUT: '/api/login/logout'
    },
    USER: {
      INFO: '/api/user/info',
      AVATAR_UPLOAD: '/api/user/avatar/upload',
      UPDATE: '/api/user/update'
    },
    LETTER: {
      LIST: '/api/letter/list',
      DETAIL: '/api/letter/detail',
      CREATE: '/api/letter/create',
      UPDATE: '/api/letter/update',
      DELETE: '/api/letter/delete'
    },
    QA: {
      LIST: '/api/qa/list',
      DETAIL: '/api/qa/detail',
      CREATE: '/api/qa/create',
      UPDATE: '/api/qa/update',
      DELETE: '/api/qa/delete'
    }
  }
}

// 生产环境配置
const prodConfig = {
  baseURL: 'https://api.lovetime.com',
  timeout: 10000,  // 普通请求超时时间
  uploadTimeout: 30000,  // 上传请求超时时间
  API: devConfig.API  // 使用相同的API路径配置
}

// 根据环境导出配置
export default process.env.NODE_ENV === 'development' ? devConfig : prodConfig
