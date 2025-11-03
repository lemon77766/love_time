/**
 * 情侣关系工具函数
 * 用于管理本地情侣关系信息
 */

/**
 * 获取本地情侣信息
 * @returns {object|null} 情侣信息对象或null
 */
export function getCoupleInfo() {
  try {
    const coupleInfo = uni.getStorageSync('couple_info');
    return coupleInfo && coupleInfo.isBound ? coupleInfo : null;
  } catch (e) {
    console.error('获取情侣信息失败', e);
    return null;
  }
}

/**
 * 检查是否已绑定
 * @returns {boolean} 是否已绑定
 */
export function isBound() {
  const coupleInfo = getCoupleInfo();
  return coupleInfo !== null;
}

/**
 * 获取对方信息
 * @returns {object|null} 对方信息对象或null
 */
export function getPartnerInfo() {
  const coupleInfo = getCoupleInfo();
  return coupleInfo && coupleInfo.partnerInfo ? coupleInfo.partnerInfo : null;
}

/**
 * 保存情侣信息到本地
 * @param {object} coupleData - 情侣信息对象
 * @param {boolean} coupleData.isBound - 是否已绑定
 * @param {string} coupleData.coupleId - 关系ID
 * @param {string} coupleData.partnerId - 对方用户ID
 * @param {object} coupleData.partnerInfo - 对方用户信息
 * @param {string} coupleData.bindTime - 绑定时间
 * @param {string} coupleData.role - 角色：initiator/accepter
 * @returns {boolean} 是否保存成功
 */
export function saveCoupleInfo(coupleData) {
  try {
    const coupleInfo = {
      isBound: coupleData.isBound || false,
      coupleId: coupleData.coupleId || '',
      partnerId: coupleData.partnerId || '',
      partnerInfo: coupleData.partnerInfo || null,
      bindTime: coupleData.bindTime || '',
      role: coupleData.role || '',
      inviteCode: coupleData.inviteCode || '',
      inviteCodeExpire: coupleData.inviteCodeExpire || ''
    };
    uni.setStorageSync('couple_info', coupleInfo);
    return true;
  } catch (e) {
    console.error('保存情侣信息失败', e);
    return false;
  }
}

/**
 * 清除情侣信息
 * @returns {boolean} 是否清除成功
 */
export function clearCoupleInfo() {
  try {
    uni.removeStorageSync('couple_info');
    return true;
  } catch (e) {
    console.error('清除情侣信息失败', e);
    return false;
  }
}

/**
 * 更新邀请码信息
 * @param {string} inviteCode - 邀请码
 * @param {string} expireAt - 过期时间
 * @returns {boolean} 是否更新成功
 */
export function updateInviteCode(inviteCode, expireAt) {
  try {
    const coupleInfo = getCoupleInfo() || {
      isBound: false,
      coupleId: '',
      partnerId: '',
      partnerInfo: null,
      bindTime: '',
      role: ''
    };
    coupleInfo.inviteCode = inviteCode;
    coupleInfo.inviteCodeExpire = expireAt;
    return saveCoupleInfo(coupleInfo);
  } catch (e) {
    console.error('更新邀请码失败', e);
    return false;
  }
}

/**
 * 获取关系ID
 * @returns {string|null} 关系ID或null
 */
export function getCoupleId() {
  const coupleInfo = getCoupleInfo();
  return coupleInfo && coupleInfo.coupleId ? coupleInfo.coupleId : null;
}

