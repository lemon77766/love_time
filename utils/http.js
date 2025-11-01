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
  
  // 开发环境下记录请求信息（特别是一百件事相关API）
  if (process.env.NODE_ENV === 'development' && isChallengeApi) {
    console.log('🔗 [HTTP请求] 一百件事API');
    console.log('📍 完整URL:', options.url);
    console.log('📋 请求方法:', options.method || 'GET');
    if (options.data) {
      console.log('📤 请求参数:', options.data);
    }
    if (token) {
      console.log('🔑 认证Token: 已携带');
    } else {
      console.warn('⚠️ 认证Token: 未携带，可能失败');
    }
    console.log('⏰ 请求时间:', new Date().toLocaleString());
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 开发环境下记录响应数据，帮助调试
          if (process.env.NODE_ENV === 'development') {
            if (isChallengeApi) {
              console.log('✅ [HTTP响应] 一百件事API请求成功');
              console.log('📍 响应URL:', options.url);
              console.log('📊 状态码:', res.statusCode);
              console.log('📦 响应数据:', res.data);
              console.log('⏰ 响应时间:', new Date().toLocaleString());
            } else {
              console.log('📥 API响应:', {
                url: options.url,
                statusCode: res.statusCode,
                data: res.data
              })
            }
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
          reject(res)
        }
      },
      fail: (error) => {
        // 特别记录一百件事API的错误
        if (process.env.NODE_ENV === 'development' && isChallengeApi) {
          console.error('❌ [HTTP错误] 一百件事API请求失败');
          console.error('📍 请求URL:', options.url);
          console.error('🔴 错误信息:', error);
          console.error('⏰ 错误时间:', new Date().toLocaleString());
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
