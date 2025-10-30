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
  if (!options.url.startsWith('http')) {
    options.url = config.baseURL + options.url
  }
  
  // 添加token
  const token = uni.getStorageSync('login_info')?.token
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res)
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
  const token = uni.getStorageSync('login_info')?.token
  if (token) {
    options.header['Authorization'] = `Bearer ${token}`
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
