import config from './config'
import { isLoggedIn, logout } from './auth'

// 默认请求配置
const defaultOptions = {
  timeout: config.timeout,
  retryCount: 0,  // 默认不重试
  retryDelay: 1000,  // 重试间隔1秒
}

// 规范化可能的token（排除纯数字状态码/空值/微信code）
function normalizeTokenCandidate(candidate) {
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }
  // 排除纯数字状态码（如 200, 401）
  if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
    return null;
  }
  // 排除微信登录code（通常以"mock_code_"开头或长度较短）
  if (trimmed.startsWith('mock_code_') || trimmed.length < 20) {
    // JWT token通常很长（至少20个字符），微信code通常较短
    // 但为了安全，我们只排除明显是code的情况
    if (trimmed.startsWith('mock_code_')) {
      return null;
    }
    // 如果长度小于20且看起来像code（字母数字组合，长度6-32），也排除
    if (trimmed.length < 20 && /^[A-Za-z0-9]{6,32}$/.test(trimmed) && !trimmed.includes('.')) {
      // JWT token通常包含点号（.），而微信code不包含
      return null;
    }
  }
  return trimmed;
}

function resolveTokenFromLoginInfo(loginInfo) {
  if (!loginInfo || typeof loginInfo !== 'object') {
    return null;
  }
  // 优先从标准token字段提取，避免从code字段提取（code是微信登录凭证，不是JWT token）
  const candidates = [
    loginInfo.token,           // 标准token字段（最优先）
    loginInfo.data?.token,     // 嵌套的token字段
    loginInfo.accessToken,     // 备用token字段
    loginInfo.authToken,       // 备用token字段
    loginInfo.rawToken,        // 原始token字段
    // 注意：不再从 code 字段提取token，因为code是微信登录凭证，不是JWT token
    // loginInfo.code,          // ❌ 移除：这是微信登录code，不是JWT token
    // loginInfo.data?.code,    // ❌ 移除：这是微信登录code，不是JWT token
  ];
  for (const candidate of candidates) {
    const normalized = normalizeTokenCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

// 标记是否已经尝试过清除无效登录信息（避免重复清除）
let hasClearedInvalidLogin = false

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
  // 但是登录接口返回401时不应该调用handleUnauthorized
  if (error.statusCode === 401) {
    const urlForCheck = (options.url || '').toString();
    const isLoginApi = urlForCheck.includes('/api/login/') && 
                       !urlForCheck.includes('/api/login/logout');
    
    if (!isLoginApi) {
      // 非登录接口的401错误，正常处理
      handleUnauthorized()
      return
    } else {
      // 登录接口返回401，记录错误但不跳转
      console.error('❌ [登录接口] 返回401错误，可能是后端配置问题');
    }
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
function handleUnauthorized(customMessage) {
  if (isLoggedIn()) {
    const message = customMessage || '登录已过期，请重新登录';
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
    // 延迟一点再执行logout（静默模式，避免重复提示），让用户看到提示
    setTimeout(() => {
      logout(true) // 静默退出，避免显示"已退出登录"的提示
    }, 500);
  } else {
    // 如果未登录，直接跳转到登录页
    uni.reLaunch({
      url: '/pages/login/index'
    });
  }
}

// 处理401错误的诊断逻辑（复用代码）
function handle401Diagnosis(res, options, responseData) {
  const urlForCheck401 = options.url || '';
  const isLoginApi = urlForCheck401.includes('/api/login/') && 
                     !urlForCheck401.includes('/api/login/logout');
  
  // 详细记录401错误的token诊断信息
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('🔐 [401错误诊断] 认证失败');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📍 [请求URL]', options.url);
  console.error('📋 [请求方法]', options.method || 'GET');
  console.error('📊 [HTTP状态码]', res.statusCode);
  console.error('📊 [业务状态码]', responseData?.code || '无');
  console.error('📦 [响应数据]', JSON.stringify(responseData || res.data, null, 2));
  
  // 检查请求头中的Authorization
  const authHeader = options.header?.['Authorization'] || options.header?.['authorization'];
  if (authHeader) {
    console.error('✅ [Token传递] Authorization头已发送');
    console.error('📋 [Authorization头长度]', authHeader.length, '字符');
    console.error('🔍 [Authorization头预览]', authHeader.substring(0, 50) + '...');
    console.error('💡 [可能原因] Token已过期或无效，需要重新登录');
  } else {
    console.error('❌ [Token传递] Authorization头未发送！');
    console.error('💡 [可能原因] Token未正确添加到请求头');
  }
  
  // 检查本地存储的token
  const currentLoginInfo = uni.getStorageSync('login_info');
  if (currentLoginInfo) {
    const currentToken = resolveTokenFromLoginInfo(currentLoginInfo);
    if (currentToken) {
      console.error('📦 [本地Token] Token存在');
      console.error('📏 [Token长度]', currentToken.length, '字符');
      console.error('🔍 [Token预览]', currentToken.substring(0, 50) + '...');
      console.error('💡 [诊断] Token已传递但后端认为无效，可能原因：');
      console.error('   1. Token已过期（最常见）');
      console.error('   2. Token格式不正确');
      console.error('   3. 后端验证逻辑有问题');
      console.error('   4. 后端服务重启导致token失效');
    } else {
      console.error('❌ [本地Token] Token不存在或无法解析');
      console.error('💡 [诊断] 本地存储中没有有效的token');
    }
  } else {
    console.error('❌ [本地Token] 登录信息不存在');
    console.error('💡 [诊断] 本地存储中没有登录信息');
  }
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (isLoginApi) {
    // 登录接口返回401，说明后端配置有问题
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [严重错误] 登录接口返回401错误！');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⚠️ 可能原因：');
    console.error('   1. 后端配置错误：登录接口被错误地配置为需要认证');
    console.error('   2. 后端Spring Security配置问题：/api/login/** 路径未正确放行');
    console.error('   3. 请求参数错误：code、nickName或avatarUrl缺失或格式错误');
    console.error('   4. 后端服务异常：认证拦截器误拦截了登录接口');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('📍 [请求URL]', options.url);
    console.error('📋 [请求方法]', options.method || 'POST');
    if (options.data) {
      console.error('📤 [请求参数]', JSON.stringify(options.data, null, 2));
    }
    console.error('📦 [响应数据]', JSON.stringify(responseData || res.data, null, 2));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💡 解决方案：');
    console.error('   1. 检查后端Spring Security配置，确保 /api/login/** 路径已放行');
    console.error('   2. 检查后端认证拦截器，确保登录接口不在拦截范围内');
    console.error('   3. 检查请求参数是否完整且格式正确');
    console.error('   4. 联系后端开发人员检查后端日志');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 显示用户友好的错误提示
    uni.showToast({
      title: '登录失败：后端配置错误',
      icon: 'none',
      duration: 3000
    });
  } else {
    // 非登录接口的401错误，正常处理
    handleUnauthorized();
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
  
  // 提前判断开发环境和URL（用于token诊断日志）
  let isDev = false;
  try {
    isDev = process.env.NODE_ENV === 'development' || 
            typeof __wxConfig !== 'undefined' ||  // 微信小程序开发工具
            (typeof uni !== 'undefined' && uni.getSystemInfoSync && uni.getSystemInfoSync().platform === 'devtools'); // 开发工具环境
  } catch (e) {
    // 如果获取系统信息失败，默认判断为开发环境（保守策略，确保日志输出）
    isDev = process.env.NODE_ENV === 'development' || typeof __wxConfig !== 'undefined';
  }
  
  const urlForCheck = options.url || originalUrl || '';
  const isHeartWallApi = urlForCheck.includes('/api/heart-wall/') || 
                         urlForCheck.includes('heart-wall') ||
                         urlForCheck.includes('heartwall') ||
                         urlForCheck.toLowerCase().includes('heart_wall');
  
  // 添加token（登录接口除外）
  const loginInfo = uni.getStorageSync('login_info')
  let token = resolveTokenFromLoginInfo(loginInfo)
  
  // 如果从其他字段提取到了token，但loginInfo.token不存在，则写回标准字段
  if (token && loginInfo && !loginInfo.token) {
    loginInfo.token = token
    try {
      uni.setStorageSync('login_info', loginInfo)
    } catch (storageError) {
      console.warn('⚠️ 写回标准token字段失败:', storageError)
    }
  }
  
  // 如果token为空，记录详细日志（登录接口除外）
  if (!token && !isLoginApi && process.env.NODE_ENV === 'development') {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️ [Token诊断] 未找到有效token');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (loginInfo) {
      console.warn('📦 登录信息存在，但token字段缺失');
      console.warn('📦 loginInfo.token:', loginInfo.token || '❌ 不存在');
      console.warn('📦 loginInfo.data?.token:', loginInfo.data?.token || '❌ 不存在');
      console.warn('📦 loginInfo.accessToken:', loginInfo.accessToken || '❌ 不存在');
      console.warn('📦 loginInfo.code:', loginInfo.code ? '⚠️ 存在（这是微信登录code，不是JWT token）' : '❌ 不存在');
    } else {
      console.warn('📦 登录信息不存在');
    }
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  // 调试信息：检查token是否存在（登录接口除外）
  if (process.env.NODE_ENV === 'development' && !isLoginApi) {
    if (!token) {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('⚠️ [Token诊断] Token未找到，请求可能失败');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('📦 完整登录信息结构:');
      console.warn(JSON.stringify(loginInfo, null, 2));
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('🔍 登录信息字段检查:');
      if (loginInfo) {
        console.warn(`   - isLoggedIn: ${loginInfo.isLoggedIn !== undefined ? loginInfo.isLoggedIn : '❌ 不存在'}`);
        console.warn(`   - token: ${loginInfo.token !== undefined ? (loginInfo.token ? `✅ 存在，长度: ${loginInfo.token.length}` : '❌ 为空') : '❌ 不存在'}`);
        console.warn(`   - data?.token: ${loginInfo.data?.token !== undefined ? (loginInfo.data.token ? `✅ 存在，长度: ${loginInfo.data.token.length}` : '❌ 为空') : '❌ 不存在'}`);
        console.warn(`   - accessToken: ${loginInfo.accessToken !== undefined ? (loginInfo.accessToken ? `✅ 存在，长度: ${loginInfo.accessToken.length}` : '❌ 为空') : '❌ 不存在'}`);
        if (loginInfo.code !== undefined) {
          if (typeof loginInfo.code === 'string') {
            console.warn(`   - code: ${loginInfo.code ? `✅ 字符串，长度: ${loginInfo.code.length}` : '❌ 为空字符串'}`);
          } else {
            console.warn(`   - code: ℹ️ 类型: ${typeof loginInfo.code}, 值: ${loginInfo.code}`);
          }
        } else {
          console.warn('   - code: ❌ 不存在');
        }
        console.warn(`   - userInfo: ${loginInfo.userInfo !== undefined ? '✅ 存在' : '❌ 不存在'}`);
        console.warn(`   - loginTime: ${loginInfo.loginTime !== undefined ? `✅ 存在: ${loginInfo.loginTime}` : '❌ 不存在'}`);
      }
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (loginInfo?.isGuest) {
        console.warn('⚠️ 检测到游客登录，游客登录不支持需要认证的API')
      } else if (loginInfo && loginInfo.isLoggedIn) {
        console.warn('⚠️ 登录状态为true，但token缺失。可能的原因：');
        console.warn('   1. 之前的登录代码没有正确保存token');
        console.warn('   2. 登录信息被部分覆盖或损坏');
        console.warn('   3. 后端返回的数据结构不符合预期');
        console.warn('💡 建议：清除登录信息并重新登录');
        
        // 自动修复：如果登录信息存在但token缺失，清除登录信息（只清除一次）
        // 注意：这里只清除，不自动跳转，让用户手动重新登录
        if (!hasClearedInvalidLogin && !token) {
          console.warn('🔧 [自动修复] 检测到无效的登录信息，正在清除...');
          uni.removeStorageSync('login_info');
          hasClearedInvalidLogin = true; // 标记已清除，避免重复清除
          console.warn('✅ [自动修复] 已清除无效的登录信息');
          console.warn('💡 请重新登录以获取有效的token');
          
          // 可选：显示提示给用户
          uni.showToast({
            title: '登录信息已过期，请重新登录',
            icon: 'none',
            duration: 3000
          });
        } else if (hasClearedInvalidLogin) {
          console.warn('💡 已清除过无效登录信息，请重新登录');
        }
      } else {
        console.warn('⚠️ 未找到登录信息，请先登录')
      }
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('✅ Token已找到，长度:', token.length)
    }
  }
  
  if (token) {
    // 确保token不包含"Bearer "前缀（避免重复添加）
    let cleanToken = token.trim();
    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.substring(7); // 移除"Bearer "前缀
    }
    
    // 验证token格式（JWT token通常包含点号，且长度较长）
    if (cleanToken.length < 20) {
      console.warn('⚠️ [Token警告] Token长度过短，可能不是有效的JWT token');
      console.warn('⚠️ Token长度:', cleanToken.length);
      console.warn('⚠️ Token值:', cleanToken.substring(0, 20) + '...');
    }
    
    // 详细记录token传递信息（用于调试401错误）
    if (isDev || isHeartWallApi || urlForCheck.includes('/api/couple/')) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔑 [Token传递诊断]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 [请求URL]', options.url);
      console.log('📋 [请求方法]', options.method || 'GET');
      console.log('✅ [Token状态] Token已找到');
      console.log('📏 [Token长度]', cleanToken.length, '字符');
      console.log('🔍 [Token预览]', cleanToken.substring(0, 50) + (cleanToken.length > 50 ? '...' : ''));
      console.log('🔍 [Token格式]', cleanToken.includes('.') ? '✅ JWT格式（包含点号）' : '⚠️ 非JWT格式（不包含点号）');
      console.log('📦 [Authorization头]', `Bearer ${cleanToken.substring(0, 30)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // 确保header对象存在
    if (!options.header) {
      options.header = {};
    }
    
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${cleanToken}`
    }
    
    // 验证Authorization头是否正确设置
    if (isDev || isHeartWallApi || urlForCheck.includes('/api/couple/')) {
      const authHeader = options.header['Authorization'] || options.header['authorization'];
      if (authHeader) {
        console.log('✅ [验证] Authorization头已正确设置');
        console.log('📋 [Authorization头长度]', authHeader.length, '字符');
        console.log('🔍 [Authorization头预览]', authHeader.substring(0, 50) + '...');
      } else {
        console.error('❌ [验证失败] Authorization头未正确设置！');
        console.error('📋 [当前请求头]', JSON.stringify(options.header, null, 2));
      }
    }
  } else if (!isLoginApi) {
    // 如果没有token且不是登录接口，添加警告
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️ [Token缺失] 请求未携带Authorization头，可能导致401错误');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('📍 [请求URL]', options.url);
    console.warn('📋 [请求方法]', options.method || 'GET');
    console.warn('📦 [登录信息]', loginInfo ? '存在但token为空' : '不存在');
    if (loginInfo) {
      console.warn('📋 [登录信息字段]');
      console.warn('   - token:', loginInfo.token ? `✅ 存在（${loginInfo.token.length}字符）` : '❌ 不存在');
      console.warn('   - data?.token:', loginInfo.data?.token ? `✅ 存在（${loginInfo.data.token.length}字符）` : '❌ 不存在');
      console.warn('   - accessToken:', loginInfo.accessToken ? `✅ 存在（${loginInfo.accessToken.length}字符）` : '❌ 不存在');
      console.warn('   - isLoggedIn:', loginInfo.isLoggedIn ? '✅ true' : '❌ false');
    }
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  // 开发环境下记录所有API请求信息
  // 注意：isDev、urlForCheck、isHeartWallApi 已在前面定义（用于token诊断）
  
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
          
          // 检查业务状态码：如果后端返回 code: 401，也要按401错误处理
          // 这种情况是后端返回HTTP 200，但业务code是401
          if (res.data && typeof res.data === 'object' && res.data.code === 401) {
            const errorMessage = res.data.msg || res.data.message || '认证失败，无法访问系统资源';
            const error = new Error(errorMessage);
            error.statusCode = 401; // 设置为401，便于统一处理
            error.data = res.data;
            error.responseData = res.data;
            
            // 调用401诊断函数
            handle401Diagnosis(res, options, res.data);
            
            reject(error);
            return;
          }
          
          // 如果后端返回的格式是 { success: false, message: "..." }，应该作为错误处理
          if (res.data && typeof res.data === 'object' && res.data.success === false) {
            const errorMessage = res.data.message || '请求失败'
            const error = new Error(errorMessage)
            error.statusCode = res.statusCode
            error.data = res.data
            
            // 检查是否是token过期或未登录的错误
            const isTokenExpired = errorMessage.includes('未登录') || 
                                   errorMessage.includes('token已过期') || 
                                   errorMessage.includes('token过期') ||
                                   errorMessage.includes('登录已过期') ||
                                   errorMessage.includes('未授权') ||
                                   errorMessage.includes('Unauthorized') ||
                                   errorMessage.toLowerCase().includes('token expired') ||
                                   errorMessage.toLowerCase().includes('not logged in')
            
            // 如果是token过期错误，调用handleUnauthorized处理
            if (isTokenExpired) {
              handleUnauthorized(errorMessage)
            }
            
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
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error(`❌ [HTTP响应] 状态码 ${res.statusCode} 且业务逻辑失败`);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('📍 [请求URL]', options.url);
            console.error('📋 [请求方法]', options.method || 'GET');
            if (options.data) {
              console.error('📤 [请求参数]', JSON.stringify(options.data, null, 2));
            }
            if (options.header) {
              console.error('📋 [请求头]', JSON.stringify(options.header, null, 2));
            }
            console.error('📊 [响应状态码]', res.statusCode);
            console.error('📦 [完整响应对象]', JSON.stringify(res, null, 2));
            if (!responseData || typeof responseData !== 'object') {
              console.error(`❌ [响应数据] 不是对象，类型: ${typeof responseData}，值:`, responseData);
            } else {
              console.error(`❌ [success字段]`, responseData.success);
              console.error(`❌ [message字段]`, responseData.message);
              console.error(`❌ [完整响应数据]`, JSON.stringify(responseData, null, 2));
              // 检查响应数据的所有字段
              console.error(`❌ [响应数据字段列表]`, Object.keys(responseData).join(', '));
              if (isHeartWallApi) {
                console.error(`❌ [photo字段]`, responseData.photo ? '存在' : '不存在');
              }
            }
            console.error('⏰ [时间]', new Date().toLocaleString());
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
          
          // 创建 Error 对象，确保 handleRequestError 能正确处理
          const errorMessage = (responseData && typeof responseData === 'object' && responseData.message) 
            ? responseData.message 
            : `请求失败，状态码: ${res.statusCode}`;
          
          const error = new Error(errorMessage);
          error.statusCode = res.statusCode;
          error.data = responseData || res.data;
          // 添加响应数据到错误对象，便于上层处理
          if (responseData && typeof responseData === 'object') {
            error.responseData = responseData;
          }
          
          // 检查业务状态码：如果后端返回 code: 401，也要按401错误处理
          // 这种情况可能出现在非200-299状态码的情况下
          if (responseData && typeof responseData === 'object' && responseData.code === 401) {
            const errorMessage = responseData.msg || responseData.message || '认证失败，无法访问系统资源';
            const error = new Error(errorMessage);
            error.statusCode = 401; // 设置为401，便于统一处理
            error.data = responseData;
            error.responseData = responseData;
            
            // 调用401诊断函数
            handle401Diagnosis(res, options, responseData);
            
            reject(error);
            return;
          }
          
          // 如果是 401 错误，立即处理未授权情况
          // 但是登录接口返回401时不应该调用handleUnauthorized，因为：
          // 1. 登录接口本身不需要认证
          // 2. 如果登录接口返回401，说明后端配置有问题或请求参数有问题
          // 3. 不应该因为登录接口返回401就跳转到登录页（会导致死循环）
          if (res.statusCode === 401) {
            // 调用401诊断函数（函数内部会处理跳转逻辑）
            handle401Diagnosis(res, options, responseData);
            // 继续执行，让错误被reject
          }
          
          // 如果是 404 错误且错误消息是"用户不存在"，也按未授权处理
          // 这通常表示token中的用户信息已失效或后端数据库中用户不存在
          // 但是对于位置相关的API和一百件事API，不自动跳转登录，让调用者自己处理
          if (res.statusCode === 404 && errorMessage && errorMessage.includes('用户不存在')) {
            const isLocationApi = options.url.includes('/api/trajectory/location/');
            const isChallengeApi = options.url.includes('/api/challenge/');
            
            if (isLocationApi) {
              // 位置相关API：只记录日志，不自动跳转登录
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.warn('⚠️ [HTTP响应] 检测到"用户不存在"错误（位置API）');
              console.warn('⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在');
              console.warn('⚠️ 位置功能将无法使用，但不会影响页面其他功能');
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            } else if (isChallengeApi) {
              // 一百件事API：可能是接口不存在，也可能是用户不存在
              // 不自动跳转登录，让调用者自己处理（可以显示友好提示或使用本地数据）
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.warn('⚠️ [HTTP响应] 检测到"用户不存在"错误（一百件事API）');
              console.warn('⚠️ 可能原因：');
              console.warn('   1. 接口不存在（后端未实现此接口）');
              console.warn('   2. 用户信息已失效或token中的用户在后端不存在');
              console.warn('⚠️ 不会自动跳转登录，请检查接口是否已实现');
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            } else {
              // 其他API：清除登录信息并跳转到登录页
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.warn('⚠️ [HTTP响应] 检测到"用户不存在"错误');
              console.warn('⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在');
              console.warn('⚠️ 将清除登录信息并跳转到登录页');
              console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              handleUnauthorized('用户信息已失效，请重新登录');
            }
          }
          
          reject(error);
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
  
  // 验证文件路径
  if (!options.filePath) {
    return Promise.reject(new Error('未找到上传的文件：filePath 参数为空'))
  }
  
  // 记录原始路径
  const originalFilePath = options.filePath
  console.log('📁 [上传] 原始文件路径:', originalFilePath)
  
  // 处理文件路径
  let validFilePath = originalFilePath
  
  if (validFilePath && typeof validFilePath === 'string') {
    // 如果路径已经是完整的HTTP(S) URL（且不是临时文件路径），说明是已上传的图片，不需要上传
    if (validFilePath.startsWith('http://') || validFilePath.startsWith('https://')) {
      // 检查是否是临时文件路径（开发工具可能返回这种格式）
      if (validFilePath.includes('://tmp/') || validFilePath.includes('://tmp_')) {
        // 这是开发工具返回的临时文件路径，需要特殊处理
        // 在微信小程序中，临时文件路径应该是本地路径，直接使用可能无效
        // 尝试转换为本地路径格式
        const pathMatch = validFilePath.match(/:\/\/tmp[\/_](.+)$/)
        if (pathMatch) {
          const fileName = pathMatch[1]
          // 尝试构造本地路径（但这可能不工作，因为实际文件位置可能不同）
          // 最好的方式是直接使用原始路径，让 uni.uploadFile 处理
          console.warn('⚠️ [上传] 检测到临时文件URL格式，尝试直接使用:', validFilePath)
          // 保持原路径，不转换
        }
      } else {
        // 这是已上传的完整URL，不需要上传
        console.warn('⚠️ [上传] 文件路径已经是URL格式，跳过上传:', validFilePath)
        return Promise.reject(new Error('文件路径已经是URL格式，无需上传'))
      }
    }
    // 其他情况直接使用原始路径（uni.uploadFile 应该能处理各种本地路径格式）
  }
  
  // 处理请求URL
  if (!options.url.startsWith('http')) {
    options.url = config.baseURL + options.url
  }
  
  // 添加token
  const loginInfo = uni.getStorageSync('login_info')
  const token = loginInfo?.token
  
  if (token) {
    // 确保token不包含"Bearer "前缀（避免重复添加）
    let cleanToken = token.trim();
    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.substring(7); // 移除"Bearer "前缀
    }
    options.header['Authorization'] = `Bearer ${cleanToken}`
  } else {
    console.warn('⚠️ 上传请求未携带Authorization头，可能导致401错误')
  }
  
  // 使用修复后的文件路径
  const uploadOptions = {
    ...options,
    filePath: validFilePath
  }
  
  return new Promise((resolve, reject) => {
    console.log('📤 [上传] 开始上传文件，路径:', validFilePath)
    uni.uploadFile({
      ...uploadOptions,
      success: (uploadRes) => {
        try {
          const result = JSON.parse(uploadRes.data)
          if (result.success) {
            console.log('✅ [上传] 文件上传成功')
            const normalizedData = result.data !== undefined && result.data !== null
              ? result.data
              : result
            resolve(normalizedData)
          } else {
            const errorMsg = result.message || '上传失败'
            console.error('❌ [上传] 服务器返回失败:', errorMsg)
            reject(new Error(errorMsg))
          }
        } catch (e) {
          console.error('❌ [上传] 解析响应失败:', e)
          reject(new Error('解析上传响应失败'))
        }
      },
      fail: (error) => {
        console.error('❌ [上传] 上传失败:', error)
        console.error('❌ [上传] 原始路径:', originalFilePath)
        console.error('❌ [上传] 使用路径:', validFilePath)
        
        // 检查是否是文件路径问题
        if (error.errMsg && (error.errMsg.includes('未找到') || error.errMsg.includes('file not found') || error.errMsg.includes('no such file') || error.errMsg.includes('file doesn\'t exist'))) {
          // 如果是因为路径问题失败，尝试使用原始路径（如果不同）
          if (validFilePath !== originalFilePath && originalFilePath) {
            console.warn('⚠️ [上传] 转换后的路径无效，尝试使用原始路径:', originalFilePath)
            // 这种情况不应该再尝试，因为已经失败了
          }
          console.error('❌ [上传] 文件路径无效，无法找到文件')
          reject(new Error(`未找到上传的文件: ${validFilePath} (原始路径: ${originalFilePath})`))
        } else {
          handleRequestError(error, options)
            .then(resolve)
            .catch(reject)
        }
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
