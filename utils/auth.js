/**
 * 登录认证工具函数
 */

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  try {
    const loginInfo = uni.getStorageSync('login_info');
    return loginInfo && loginInfo.isLoggedIn === true;
  } catch (e) {
    console.error('检查登录状态失败', e);
    return false;
  }
}

/**
 * 获取当前登录用户信息
 * @returns {object|null} 用户信息对象或null
 */
export function getUserInfo() {
  try {
    const loginInfo = uni.getStorageSync('login_info');
    return loginInfo && loginInfo.userInfo ? loginInfo.userInfo : null;
  } catch (e) {
    console.error('获取用户信息失败', e);
    return null;
  }
}

/**
 * 保存登录信息
 * @param {object} userInfo - 用户信息对象
 * @returns {boolean} 是否保存成功
 */
export function saveLoginInfo(userInfo) {
  try {
    const loginInfo = {
      isLoggedIn: true,
      userInfo: userInfo,
      loginTime: new Date().toISOString()
    };
    uni.setStorageSync('login_info', loginInfo);
    return true;
  } catch (e) {
    console.error('保存登录信息失败', e);
    return false;
  }
}

/**
 * 退出登录
 * @returns {boolean} 是否退出成功
 */
export function logout() {
  try {
    uni.removeStorageSync('login_info');
    return true;
  } catch (e) {
    console.error('退出登录失败', e);
    return false;
  }
}

/**
 * 跳转到登录页
 */
export function goToLogin() {
  uni.reLaunch({
    url: '/pages/login/index'
  });
}

/**
 * 检查登录状态，未登录则跳转登录页
 * @returns {boolean} 是否已登录
 */
export function checkLogin() {
  const loggedIn = isLoggedIn();
  if (!loggedIn) {
    goToLogin();
  }
  return loggedIn;
}
