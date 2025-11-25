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
    // 检查是否为有效的登录状态（排除游客状态）
    return loginInfo && loginInfo.isLoggedIn === true && loginInfo.isGuest !== true;
  } catch (e) {
    console.error('检查登录状态失败', e);
    return false;
  }
}

/**
 * 检查是否为游客用户
 * @returns {boolean} 是否为游客用户
 */
export function isGuestUser() {
  try {
    const loginInfo = uni.getStorageSync('login_info');
    return loginInfo && loginInfo.isGuest === true;
  } catch (e) {
    console.error('检查游客状态失败', e);
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
 * @param {boolean} silent - 是否静默退出（不显示提示，用于自动退出场景）
 * @returns {Promise<boolean>} 是否退出成功
 */
export function logout(silent = false) {
  return new Promise((resolve) => {
    try {
      // 清除本地存储
      uni.removeStorageSync('login_info');
      
      // 设置游客状态
      const guestUserInfo = {
        nickName: '游客用户',
        avatarUrl: '/static/zhuye/smile.png',
        displayName: '游客用户',
        displayAvatar: '/static/zhuye/smile.png',
        isGuest: true
      };
      
      const guestLoginInfo = {
        isLoggedIn: true,
        userInfo: guestUserInfo,
        isGuest: true,
        loginTime: new Date().toISOString()
      };
      
      uni.setStorageSync('login_info', guestLoginInfo);
      
      // 如果不是静默模式，显示退出成功提示
      if (!silent) {
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500
        });
      }
      
      // 延迟跳转到首页（静默模式延迟更短）
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index'
        });
      }, silent ? 500 : 1500);
      
      resolve(true);
    } catch (e) {
      console.error('退出登录失败', e);
      
      // 显示错误提示
      uni.showToast({
        title: '退出失败，请重试',
        icon: 'none',
        duration: 2000
      });
      
      resolve(false);
    }
  });
}

/**
 * 跳转到登录页
 */
export function goToLogin() {
  // 修改为不强制跳转登录页，允许用户继续浏览
  // uni.reLaunch({
  //   url: '/pages/login/index'
  // });
}

/**
 * 检查登录状态，未登录则跳转登录页
 * @returns {boolean} 是否已登录
 */
export function checkLogin() {
  const loggedIn = isLoggedIn();
  // 不再强制跳转登录页，允许用户继续浏览
  // if (!loggedIn) {
  //   goToLogin();
  // }
  return loggedIn;
}