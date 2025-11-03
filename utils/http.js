import config from './config'
import { isLoggedIn, logout } from './auth'

// 默认请求配置
const defaultOptions = {
  timeout: config.timeout,
  retryCount: 0,  // 默认不重试
  retryDelay: 1000,  // 重试间隔1秒
}

// 处理请求错误
function handleRequestError(error, options = {}) {
  console.error('请求错误:', error)
  
  // 开发环境下显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ 开发模式：后端接口未就绪或网络错误')
    console.warn('⚠️ 请检查：')
    console.warn('  1. 后端服务是否已启动')
    console.warn('  2. 请求地址是否正确')
    console.warn('  3. 网络是否连通')
  }
  
  // 401错误处理
  if (error.statusCode === 401) {
    handleUnauthorized()
    return
  }
  
  // 超时错误特殊处理
  if (error.errMsg && error.errMsg.includes('timeout')) {
    if (options.retryCount > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log(`请求超时，${options.retryDelay/1000}秒后重试，剩余重试次数：${options.retryCount-1}`)
          options.retryCount--
          request(options).then(resolve).catch(reject)
        }, options.retryDelay)
      })
    }
  }
  
  return Promise.reject(error)
}

// 处理未授权情况
function handleUnauthorized() {
  if (isLoggedIn()) {
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
    })
    logout()
  }
}

// 基础请求方法
function request(options) {
  // 合并默认配置
  options = { ...defaultOptions, ...options }
  
  // 处理请求URL
  const originalUrl = options.url
  if (!options.url.startsWith('http')) {
    options.url = config.baseURL + options.url
  }
  
  // 判断是否为登录接口（登录接口不需要token）
  const isLoginApi = options.url.includes('/api/login/') && 
                     !options.url.includes('/api/login/logout')
  
  // 判断是否为一百件事相关API
  const isChallengeApi = options.url.includes('/api/challenge/')
  
  // 添加token（登录接口除外）
  const loginInfo = uni.getStorageSync('login_info')
  let token = null
  
  // 尝试从多个可能的路径获取token
  if (loginInfo) {
    token = loginInfo.token || loginInfo.data?.token || loginInfo.accessToken || null
    // 确保token是字符串且不为空
    if (token && typeof token === 'string' && token.trim()) {
      token = token.trim()
    } else {
      token = null
    }
  }
  
  // 调试信息：检查token是否存在（登录接口除外）
  if (process.env.NODE_ENV === 'development' && !isLoginApi) {
    if (!token) {
      console.warn('⚠️ Token未找到，请求可能失败')
      console.warn('⚠️ 登录信息:', loginInfo)
      if (loginInfo?.isGuest) {
        console.warn('⚠️ 检测到游客登录，游客登录不支持需要认证的API')
      } else if (loginInfo) {
        console.warn('⚠️ 登录信息存在，但token为空。可能的原因：')
        console.warn('   1. 后端返回的token字段名不是"token"')
        console.warn('   2. 后端返回的数据结构不符合预期')
        console.warn('   3. 登录时token提取失败')
      } else {
        console.warn('⚠️ 未找到登录信息，请先登录')
      }
    } else {
      console.log('✅ Token已找到，长度:', token.length)
    }
  }
  
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  } else if (!isLoginApi) {
    // 如果没有token且不是登录接口，添加警告
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ 请求未携带Authorization头，可能导致401错误')
      console.warn('⚠️ 当前请求URL:', options.url)
    }
  }
  
  // 开发环境下记录所有API请求信息
  // 判断是否在开发环境：uni-app开发工具或本地调试
  let isDev = false;
  try {
    isDev = process.env.NODE_ENV === 'development' || 
            typeof __wxConfig !== 'undefined' ||  // 微信小程序开发工具
            (typeof uni !== 'undefined' && uni.getSystemInfoSync && uni.getSystemInfoSync().platform === 'devtools'); // 开发工具环境
  } catch (e) {
    // 如果获取系统信息失败，默认判断为开发环境（保守策略，确保日志输出）
    isDev = process.env.NODE_ENV === 'development' || typeof __wxConfig !== 'undefined';
  }
  
  // 无论是否开发环境，都记录爱心墙相关的请求（便于调试）
  const urlForCheck = options.url || originalUrl || '';
  const isHeartWallApi = urlForCheck.includes('/api/heart-wall/') || 
                         urlForCheck.includes('heart-wall') ||
                         urlForCheck.includes('heartwall') ||
                         urlForCheck.toLowerCase().includes('heart_wall');
  
  if (isDev || isHeartWallApi) {
    // 判断API类型（使用完整URL或原始URL进行判断）
    let apiType = '通用API';
    if (urlForCheck.includes('/api/challenge/')) {
      apiType = '一百件事API';
    } else if (urlForCheck.includes('/api/couple/')) {
      apiType = '情侣绑定API';
    } else if (isHeartWallApi) {
      apiType = '心形墙API';
    } else if (urlForCheck.includes('/api/qna/')) {
      apiType = '问答API';
    } else if (urlForCheck.includes('/api/login/')) {
      apiType = '登录API';
    } else if (urlForCheck.includes('/api/user/')) {
      apiType = '用户API';
    } else if (urlForCheck.includes('/api/letter/')) {
      apiType = '情书API';
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 [HTTP请求]', apiType);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 [URL]', options.url);
    console.log('📋 [方法]', options.method || 'GET');
    if (options.data) {
      console.log('📤 [请求参数]', JSON.stringify(options.data, null, 2));
    }
    if (token) {
      console.log('🔑 [认证] Token已携带 (长度:', token.length, ')');
    } else {
      if (!isLoginApi) {
        console.warn('⚠️ [认证] Token未携带，请求可能失败');
      } else {
        console.log('ℹ️ [认证] 登录接口，无需Token');
      }
    }
    if (options.header) {
      console.log('📋 [请求头]', Object.keys(options.header).join(', '));
    }
    console.log('⏰ [时间]', new Date().toLocaleString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 开发环境下记录所有API响应数据，帮助调试
          let isDev = false;
          try {
            isDev = process.env.NODE_ENV === 'development' || 
                    typeof __wxConfig !== 'undefined' ||
                    (typeof uni !== 'undefined' && uni.getSystemInfoSync && uni.getSystemInfoSync().platform === 'devtools');
          } catch (e) {
            isDev = process.env.NODE_ENV === 'development' || typeof __wxConfig !== 'undefined';
          }
          
          // 无论是否开发环境，都记录爱心墙相关的响应（便于调试）
          const urlForCheck = options.url || '';
          const isHeartWallApi = urlForCheck.includes('/api/heart-wall/') || 
                                 urlForCheck.includes('heart-wall') ||
                                 urlForCheck.includes('heartwall') ||
                                 urlForCheck.toLowerCase().includes('heart_wall');
          
          if (isDev || isHeartWallApi) {
            // 判断API类型（使用完整URL进行判断）
            let apiType = '通用API';
            if (urlForCheck.includes('/api/challenge/')) {
              apiType = '一百件事API';
            } else if (urlForCheck.includes('/api/couple/')) {
              apiType = '情侣绑定API';
            } else if (isHeartWallApi) {
              apiType = '心形墙API';
            } else if (urlForCheck.includes('/api/qna/')) {
              apiType = '问答API';
            } else if (urlForCheck.includes('/api/login/')) {
              apiType = '登录API';
            } else if (urlForCheck.includes('/api/user/')) {
              apiType = '用户API';
            } else if (urlForCheck.includes('/api/letter/')) {
              apiType = '情书API';
            }
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ [HTTP响应]', apiType, '请求成功');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📍 [URL]', options.url);
            console.log('📊 [状态码]', res.statusCode);
            console.log('📦 [响应数据]', JSON.stringify(res.data, null, 2));
            
            // 统计响应数据信息
            if (res.data && typeof res.data === 'object') {
              if (res.data.tasks && Array.isArray(res.data.tasks)) {
                console.log('📊 [数据统计] 任务数量:', res.data.tasks.length);
              }
              if (res.data.projects && Array.isArray(res.data.projects)) {
                console.log('📊 [数据统计] 项目数量:', res.data.projects.length);
              }
              if (res.data.photos && Array.isArray(res.data.photos)) {
                console.log('📊 [数据统计] 照片数量:', res.data.photos.length);
              }
              if (res.data.questions && Array.isArray(res.data.questions)) {
                console.log('📊 [数据统计] 问题数量:', res.data.questions.length);
              }
              if (res.data.success !== undefined) {
                console.log('✅ [业务状态]', res.data.success ? '成功' : '失败');
              }
              if (res.data.message) {
                console.log('💬 [消息]', res.data.message);
              }
            }
            
            console.log('⏰ [时间]', new Date().toLocaleString());
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
          
          // 如果后端返回的格式是 { success: false, message: "..." }，应该作为错误处理
          if (res.data && typeof res.data === 'object' && res.data.success === false) {
            const error = new Error(res.data.message || '请求失败')
            error.statusCode = res.statusCode
            error.data = res.data
            reject(error)
            return
          }
          
          resolve(res.data)
        } else {
          // 特殊情况：即使HTTP状态码不是200-299，但如果响应体中 success: true，也应该当作成功处理
          // 这是因为后端可能在业务成功时返回了错误的状态码（如500）
          
          // 先记录详细日志，便于调试
          const urlForCheck = options.url || '';
          const isHeartWallApi = urlForCheck.includes('/api/heart-wall/') || 
                                 urlForCheck.includes('heart-wall') ||
                                 urlForCheck.includes('heartwall') ||
                                 urlForCheck.toLowerCase().includes('heart_wall');
          
          // 尝试解析响应数据（如果是字符串格式）
          let responseData = res.data;
          if (typeof responseData === 'string') {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              // 解析失败，保持原样
            }
          }
          
          if (isHeartWallApi || process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ [HTTP响应] 状态码异常: ${res.statusCode}`);
            console.warn(`⚠️ [响应数据]`, responseData);
            console.warn(`⚠️ [响应数据类型]`, typeof responseData);
            if (responseData && typeof responseData === 'object') {
              console.warn(`⚠️ [success字段]`, responseData.success);
              console.warn(`⚠️ [message字段]`, responseData.message);
              // 如果是心形墙API，也检查photo字段
              if (isHeartWallApi && responseData.photo) {
                console.warn(`⚠️ [photo字段存在]`, !!responseData.photo);
              }
            }
          }
          
          // 检查响应数据中是否有 success: true
          // 支持多种格式：
          // 1. { success: true, ... }
          // 2. { data: { success: true, ... } }
          // 3. 对于心形墙API，也检查是否有photo字段（表示成功）
          let isSuccess = false;
          if (responseData && typeof responseData === 'object') {
            if (responseData.success === true) {
              isSuccess = true;
            } else if (responseData.data && typeof responseData.data === 'object' && responseData.data.success === true) {
              isSuccess = true;
              // 将data提升为顶层
              responseData = responseData.data;
            } else if (isHeartWallApi && responseData.photo && typeof responseData.photo === 'object') {
              // 对于心形墙API，如果返回了photo字段，也认为成功
              isSuccess = true;
            }
          }
          
          if (isSuccess) {
            console.warn(`⚠️ [HTTP响应] 后端返回状态码 ${res.statusCode}，但业务逻辑成功 (success: true)`);
            console.warn('⚠️ 建议后端修改：成功时应该返回 200 状态码');
            // 当作成功处理
            resolve(responseData)
            return
          }
          
          // 如果检查失败，记录详细信息后reject
          if (isHeartWallApi || process.env.NODE_ENV === 'development') {
            console.error(`❌ [HTTP响应] 状态码 ${res.statusCode} 且业务逻辑失败`);
            if (!responseData || typeof responseData !== 'object') {
              console.error(`❌ 响应数据不是对象:`, responseData);
            } else {
              console.error(`❌ success字段:`, responseData.success);
              if (isHeartWallApi) {
                console.error(`❌ photo字段:`, responseData.photo ? '存在' : '不存在');
              }
            }
          }
          
          reject(res)
        }
      },
      fail: (error) => {
        // 开发环境下记录所有API的错误信息
        let isDev = false;
        try {
          isDev = process.env.NODE_ENV === 'development' || 
                  typeof __wxConfig !== 'undefined' ||
                  (typeof uni !== 'undefined' && uni.getSystemInfoSync && uni.getSystemInfoSync().platform === 'devtools');
        } catch (e) {
          isDev = process.env.NODE_ENV === 'development' || typeof __wxConfig !== 'undefined';
        }
        
        // 无论是否开发环境，都记录爱心墙相关的错误（便于调试）
        const urlForCheck = options.url || '';
        const isHeartWallApi = urlForCheck.includes('/api/heart-wall/') || 
                               urlForCheck.includes('heart-wall') ||
                               urlForCheck.includes('heartwall') ||
                               urlForCheck.toLowerCase().includes('heart_wall');
        
        if (isDev || isHeartWallApi) {
          // 判断API类型（使用完整URL进行判断）
          let apiType = '通用API';
          if (urlForCheck.includes('/api/challenge/')) {
            apiType = '一百件事API';
          } else if (urlForCheck.includes('/api/couple/')) {
            apiType = '情侣绑定API';
          } else if (isHeartWallApi) {
            apiType = '心形墙API';
          } else if (urlForCheck.includes('/api/qna/')) {
            apiType = '问答API';
          } else if (urlForCheck.includes('/api/login/')) {
            apiType = '登录API';
          } else if (urlForCheck.includes('/api/user/')) {
            apiType = '用户API';
          } else if (urlForCheck.includes('/api/letter/')) {
            apiType = '情书API';
          }
          
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ [HTTP错误]', apiType, '请求失败');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('📍 [URL]', options.url);
          console.error('📋 [方法]', options.method || 'GET');
          console.error('🔴 [错误详情]', error);
          console.error('📋 [错误消息]', error.errMsg || error.message || '未知错误');
          console.error('📊 [状态码]', error.statusCode || '无');
          
          // 错误分析
          if (error.errMsg) {
            if (error.errMsg.includes('timeout')) {
              console.error('⏱️ [错误类型] 请求超时');
            } else if (error.errMsg.includes('fail')) {
              console.error('🔌 [错误类型] 网络连接失败');
              console.error('💡 [提示] 请检查：');
              console.error('   1. 后端服务是否已启动');
              console.error('   2. 请求地址是否正确:', options.url);
              console.error('   3. 网络是否连通');
            } else if (error.errMsg.includes('404')) {
              console.error('🔍 [错误类型] 接口不存在 (404)');
            } else if (error.errMsg.includes('401')) {
              console.error('🔐 [错误类型] 未授权 (401)，可能是Token过期');
            }
          }
          
          console.error('⏰ [时间]', new Date().toLocaleString());
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        handleRequestError(error, options)
          .then(resolve)
          .catch(reject)
      }
    })
  })
}

// 文件上传方法
function upload(options) {
  // 合并默认配置
  options = {
    ...defaultOptions,
    timeout: config.uploadTimeout || 30000,  // 上传默认30秒超时
    header: {
      'content-type': 'multipart/form-data'
    },
    ...options
  }
  
  // 处理请求URL
  if (!options.url.startsWith('http')) {
    options.url = config.baseURL + options.url
  }
  
  // 添加token
  const loginInfo = uni.getStorageSync('login_info')
  const token = loginInfo?.token
  
  if (token) {
    options.header['Authorization'] = `Bearer ${token}`
  } else {
    console.warn('⚠️ 上传请求未携带Authorization头，可能导致401错误')
  }
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      ...options,
      success: (uploadRes) => {
        try {
          const result = JSON.parse(uploadRes.data)
          if (result.success) {
            resolve(result.data)
          } else {
            reject(new Error(result.message || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析上传响应失败'))
        }
      },
      fail: (error) => {
        handleRequestError(error, options)
          .then(resolve)
          .catch(reject)
      }
    })
  })
}

// HTTP方法封装
const http = {
  request,
  upload,
  get: (url, data, options = {}) => request({ ...options, url, data, method: 'GET' }),
  post: (url, data, options = {}) => request({ ...options, url, data, method: 'POST' }),
  put: (url, data, options = {}) => request({ ...options, url, data, method: 'PUT' }),
  delete: (url, data, options = {}) => request({ ...options, url, data, method: 'DELETE' })
}

export default http
