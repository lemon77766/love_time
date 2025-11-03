"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function createInviteCode() {
  const url = utils_config.config.API.COUPLE.INVITE_CREATE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:31", "🔗 [情侣关系API] 开始生成邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:32", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:33", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:34", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url).then((response) => {
    common_vendor.index.__f__("log", "at api/couple.js:37", "✅ [情侣关系API] 生成邀请码成功");
    common_vendor.index.__f__("log", "at api/couple.js:38", "📦 响应数据:", response);
    if (response && response.data && response.data.inviteCode) {
      common_vendor.index.__f__("log", "at api/couple.js:42", `📝 邀请码: ${response.data.inviteCode}`);
      common_vendor.index.__f__("log", "at api/couple.js:43", `⏰ 过期时间: ${response.data.expireAt}`);
      return response;
    } else if (response && response.invitation) {
      const invitation = response.invitation;
      common_vendor.index.__f__("log", "at api/couple.js:49", `📝 邀请码: ${invitation.inviteCode || invitation.code || ""}`);
      common_vendor.index.__f__("log", "at api/couple.js:50", `⏰ 过期时间: ${invitation.expireAt || invitation.expireTime || ""}`);
      return {
        success: response.success !== false,
        message: response.message || "邀请码生成成功",
        data: {
          inviteCode: invitation.inviteCode || invitation.code || "",
          expireAt: invitation.expireAt || invitation.expireTime || ""
        },
        isBound: response.isBound || false
      };
    } else if (response && (response.inviteCode || response.code)) {
      common_vendor.index.__f__("log", "at api/couple.js:64", `📝 邀请码: ${response.inviteCode || response.code}`);
      return {
        success: response.success !== false,
        message: response.message || "邀请码生成成功",
        data: {
          inviteCode: response.inviteCode || response.code || "",
          expireAt: response.expireAt || response.expireTime || ""
        }
      };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:76", "⚠️ 响应数据格式异常:", response);
      return {
        success: response.success !== false,
        message: response.message || "生成成功",
        data: { inviteCode: "", expireAt: "" }
      };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:84", "❌ [情侣关系API] 生成邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:85", "🔴 错误信息:", error);
    throw error;
  });
}
function validateInviteCode(inviteCode) {
  const url = utils_config.config.API.COUPLE.INVITE_VALIDATE + "?code=" + encodeURIComponent(inviteCode);
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:120", "🔗 [情侣关系API] 开始验证邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:121", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:122", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/couple.js:123", "📝 邀请码:", inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:124", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    var _a, _b;
    common_vendor.index.__f__("log", "at api/couple.js:127", "✅ [情侣关系API] 验证邀请码成功");
    common_vendor.index.__f__("log", "at api/couple.js:128", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/couple.js:131", `📝 邀请码: ${response.data.code}`);
      common_vendor.index.__f__("log", "at api/couple.js:132", `👤 发起方: ${((_a = response.data.creator) == null ? void 0 : _a.nickName) || "未知"}`);
      return response;
    } else if (response && response.creator) {
      common_vendor.index.__f__("log", "at api/couple.js:136", `👤 发起方: ${((_b = response.creator) == null ? void 0 : _b.nickName) || "未知"}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:139", "⚠️ 响应数据格式异常:", response);
      return { success: false, message: "邀请码验证失败" };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:143", "❌ [情侣关系API] 验证邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:144", "🔴 错误信息:", error);
    throw error;
  });
}
function acceptInvite(inviteCode) {
  const url = utils_config.config.API.COUPLE.BIND_ACCEPT;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:183", "🔗 [情侣关系API] 开始接受邀请");
  common_vendor.index.__f__("log", "at api/couple.js:184", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:185", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:186", "📤 请求参数: { inviteCode:", inviteCode, "}");
  common_vendor.index.__f__("log", "at api/couple.js:187", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, { inviteCode }).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/couple.js:190", "✅ [情侣关系API] 接受邀请成功");
    common_vendor.index.__f__("log", "at api/couple.js:191", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/couple.js:194", `💑 关系ID: ${response.data.coupleId}`);
      common_vendor.index.__f__("log", "at api/couple.js:195", `👤 对方昵称: ${((_a = response.data.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
      return response;
    } else if (response && response.coupleId) {
      common_vendor.index.__f__("log", "at api/couple.js:199", `💑 关系ID: ${response.coupleId}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:202", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:206", "❌ [情侣关系API] 接受邀请失败");
    common_vendor.index.__f__("error", "at api/couple.js:207", "🔴 错误信息:", error);
    throw error;
  });
}
function getCoupleStatus() {
  const url = utils_config.config.API.COUPLE.STATUS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:242", "🔗 [情侣关系API] 开始查询绑定状态");
  common_vendor.index.__f__("log", "at api/couple.js:243", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:244", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/couple.js:245", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/couple.js:248", "✅ [情侣关系API] 查询绑定状态成功");
    common_vendor.index.__f__("log", "at api/couple.js:249", "📦 响应数据:", response);
    if (response && response.data) {
      const status = response.data;
      common_vendor.index.__f__("log", "at api/couple.js:253", "📊 绑定状态:");
      common_vendor.index.__f__("log", "at api/couple.js:254", `   - 是否已绑定: ${status.isBound ? "是" : "否"}`);
      if (status.isBound) {
        common_vendor.index.__f__("log", "at api/couple.js:256", `   - 关系ID: ${status.coupleId}`);
        common_vendor.index.__f__("log", "at api/couple.js:257", `   - 对方昵称: ${((_a = status.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
        common_vendor.index.__f__("log", "at api/couple.js:258", `   - 绑定时间: ${status.bindTime || "未知"}`);
      }
      return response;
    } else if (response && (response.isBound !== void 0 || response.coupleId)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:265", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: { isBound: false } };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:269", "❌ [情侣关系API] 查询绑定状态失败");
    common_vendor.index.__f__("error", "at api/couple.js:270", "🔴 错误信息:", error);
    throw error;
  });
}
function unbindCouple() {
  const url = utils_config.config.API.COUPLE.UNBIND;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:293", "🔗 [情侣关系API] 开始解绑关系");
  common_vendor.index.__f__("log", "at api/couple.js:294", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:295", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:296", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url).then((response) => {
    common_vendor.index.__f__("log", "at api/couple.js:299", "✅ [情侣关系API] 解绑关系成功");
    common_vendor.index.__f__("log", "at api/couple.js:300", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:303", "❌ [情侣关系API] 解绑关系失败");
    common_vendor.index.__f__("error", "at api/couple.js:304", "🔴 错误信息:", error);
    throw error;
  });
}
exports.acceptInvite = acceptInvite;
exports.createInviteCode = createInviteCode;
exports.getCoupleStatus = getCoupleStatus;
exports.unbindCouple = unbindCouple;
exports.validateInviteCode = validateInviteCode;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/couple.js.map
