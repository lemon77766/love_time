"use strict";
const common_vendor = require("../common/vendor.js");
function getCoupleInfo() {
  try {
    const coupleInfo = common_vendor.index.getStorageSync("couple_info");
    return coupleInfo && coupleInfo.isBound ? coupleInfo : null;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/couple.js:15", "获取情侣信息失败", e);
    return null;
  }
}
function isBound() {
  const coupleInfo = getCoupleInfo();
  return coupleInfo !== null;
}
function getPartnerInfo() {
  const coupleInfo = getCoupleInfo();
  return coupleInfo && coupleInfo.partnerInfo ? coupleInfo.partnerInfo : null;
}
function saveCoupleInfo(coupleData) {
  try {
    const coupleInfo = {
      isBound: coupleData.isBound || false,
      coupleId: coupleData.coupleId || "",
      partnerId: coupleData.partnerId || "",
      partnerInfo: coupleData.partnerInfo || null,
      bindTime: coupleData.bindTime || "",
      role: coupleData.role || "",
      inviteCode: coupleData.inviteCode || "",
      inviteCodeExpire: coupleData.inviteCodeExpire || ""
    };
    common_vendor.index.setStorageSync("couple_info", coupleInfo);
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/couple.js:64", "保存情侣信息失败", e);
    return false;
  }
}
function clearCoupleInfo() {
  try {
    common_vendor.index.removeStorageSync("couple_info");
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/couple.js:78", "清除情侣信息失败", e);
    return false;
  }
}
exports.clearCoupleInfo = clearCoupleInfo;
exports.getCoupleInfo = getCoupleInfo;
exports.getPartnerInfo = getPartnerInfo;
exports.isBound = isBound;
exports.saveCoupleInfo = saveCoupleInfo;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/couple.js.map
