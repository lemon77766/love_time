"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
const utils_auth = require("../utils/auth.js");
const api_login = require("./login.js");
async function getCurrentUserId() {
  try {
    common_vendor.index.__f__("log", "at api/couple.js:17", "🔍 [获取用户ID] 开始尝试获取用户ID...");
    const userInfo = utils_auth.getUserInfo();
    common_vendor.index.__f__("log", "at api/couple.js:21", "🔍 [方法1] 从auth.js获取用户信息:", userInfo);
    if (userInfo && userInfo.userId) {
      common_vendor.index.__f__("log", "at api/couple.js:23", "✅ [方法1] 成功获取userId:", userInfo.userId);
      return userInfo.userId;
    }
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    common_vendor.index.__f__("log", "at api/couple.js:29", "🔍 [方法2] 从登录信息获取:", loginInfo ? "找到登录信息" : "未找到登录信息");
    if (loginInfo) {
      common_vendor.index.__f__("log", "at api/couple.js:31", "🔍 [方法2] 登录信息完整结构:", JSON.stringify(loginInfo, null, 2));
      if (loginInfo.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:35", "✅ [方法2] 从loginInfo.userId获取:", loginInfo.userId);
        return loginInfo.userId;
      }
      if (loginInfo.userInfo && loginInfo.userInfo.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:39", "✅ [方法2] 从loginInfo.userInfo.userId获取:", loginInfo.userInfo.userId);
        return loginInfo.userInfo.userId;
      }
      if (loginInfo.data && loginInfo.data.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:43", "✅ [方法2] 从loginInfo.data.userId获取:", loginInfo.data.userId);
        return loginInfo.data.userId;
      }
      if (loginInfo.openid) {
        common_vendor.index.__f__("log", "at api/couple.js:48", "✅ [方法2] 使用openid作为userId:", loginInfo.openid);
        return loginInfo.openid;
      }
    }
    common_vendor.index.__f__("log", "at api/couple.js:54", "🔍 [方法3] 尝试调用用户信息API...");
    try {
      const response = await api_login.getUserInfo();
      common_vendor.index.__f__("log", "at api/couple.js:57", "🔍 [方法3] API响应:", response);
      if (response && response.success && response.data && response.data.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:59", "✅ [方法3] 从API获取userId:", response.data.userId);
        if (loginInfo) {
          if (!loginInfo.userInfo) {
            loginInfo.userInfo = {};
          }
          loginInfo.userInfo.userId = response.data.userId;
          common_vendor.index.setStorageSync("login_info", loginInfo);
          common_vendor.index.__f__("log", "at api/couple.js:67", "💾 [方法3] 已保存userId到本地存储");
        }
        return response.data.userId;
      } else {
        common_vendor.index.__f__("warn", "at api/couple.js:71", "⚠️ [方法3] API响应中没有userId:", response);
      }
    } catch (apiError) {
      common_vendor.index.__f__("warn", "at api/couple.js:74", "⚠️ [方法3] 调用用户信息API失败:", apiError);
    }
    if (loginInfo && loginInfo.token) {
      common_vendor.index.__f__("log", "at api/couple.js:79", "🔍 [方法4] 尝试从token解析userId...");
      try {
        const tokenParts = loginInfo.token.split(".");
        common_vendor.index.__f__("log", "at api/couple.js:82", "🔍 [方法4] Token分段数量:", tokenParts.length);
        if (tokenParts.length === 3) {
          let base64Payload = tokenParts[1];
          base64Payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
          while (base64Payload.length % 4) {
            base64Payload += "=";
          }
          let decodedPayload;
          try {
            if (typeof common_vendor.index !== "undefined" && common_vendor.index.base64ToArrayBuffer) {
              const arrayBuffer = common_vendor.index.base64ToArrayBuffer(base64Payload);
              decodedPayload = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
            } else {
              decodedPayload = decodeURIComponent(atob(base64Payload));
            }
            const payload = JSON.parse(decodedPayload);
            common_vendor.index.__f__("log", "at api/couple.js:105", "🔍 [方法4] Token payload:", payload);
            if (payload.userId || payload.uid || payload.user_id) {
              const userId = payload.userId || payload.uid || payload.user_id;
              common_vendor.index.__f__("log", "at api/couple.js:108", "✅ [方法4] 从token解析userId:", userId);
              return userId;
            } else {
              common_vendor.index.__f__("warn", "at api/couple.js:111", "⚠️ [方法4] Token payload中没有userId字段");
            }
          } catch (decodeError) {
            common_vendor.index.__f__("warn", "at api/couple.js:114", "⚠️ [方法4] Token解码失败:", decodeError);
            if (loginInfo.openid) {
              common_vendor.index.__f__("log", "at api/couple.js:117", "✅ [方法4] 使用openid作为userId:", loginInfo.openid);
              return loginInfo.openid;
            }
          }
        } else {
          common_vendor.index.__f__("warn", "at api/couple.js:122", "⚠️ [方法4] Token格式不正确，不是JWT格式");
          if (loginInfo.openid) {
            common_vendor.index.__f__("log", "at api/couple.js:125", "✅ [方法4] 使用openid作为userId:", loginInfo.openid);
            return loginInfo.openid;
          }
        }
      } catch (e) {
        common_vendor.index.__f__("warn", "at api/couple.js:130", "⚠️ [方法4] 从token解析userId失败:", e);
      }
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:133", "⚠️ [方法4] 登录信息中没有token");
    }
    common_vendor.index.__f__("error", "at api/couple.js:137", "❌ [获取用户ID] 所有方法都失败，无法获取用户ID");
    common_vendor.index.__f__("error", "at api/couple.js:138", "❌ [登录信息]", loginInfo);
    throw new Error("无法获取用户ID，请先登录");
  } catch (error) {
    common_vendor.index.__f__("error", "at api/couple.js:141", "❌ [获取用户ID] 异常:", error);
    throw error;
  }
}
function createInviteCode() {
  const url = utils_config.config.API.COUPLE.INVITE_CREATE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:172", "🔗 [情侣关系API] 开始生成邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:173", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:174", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:175", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return getCurrentUserId().then((userId) => {
    common_vendor.index.__f__("log", "at api/couple.js:179", "👤 用户ID:", userId);
    common_vendor.index.__f__("log", "at api/couple.js:180", "📤 请求参数: { userId:", userId, "}");
    return utils_http.http.post(url, { userId }).then((response) => {
      common_vendor.index.__f__("log", "at api/couple.js:183", "✅ [情侣关系API] 生成邀请码成功");
      common_vendor.index.__f__("log", "at api/couple.js:184", "📦 响应数据:", response);
      if (response && response.data && response.data.inviteCode) {
        common_vendor.index.__f__("log", "at api/couple.js:188", `📝 邀请码: ${response.data.inviteCode}`);
        common_vendor.index.__f__("log", "at api/couple.js:189", `⏰ 过期时间: ${response.data.expireAt}`);
        return response;
      } else if (response && response.invitation) {
        const invitation = response.invitation;
        common_vendor.index.__f__("log", "at api/couple.js:195", `📝 邀请码: ${invitation.inviteCode || invitation.code || ""}`);
        common_vendor.index.__f__("log", "at api/couple.js:196", `⏰ 过期时间: ${invitation.expireAt || invitation.expireTime || ""}`);
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
        common_vendor.index.__f__("log", "at api/couple.js:210", `📝 邀请码: ${response.inviteCode || response.code}`);
        return {
          success: response.success !== false,
          message: response.message || "邀请码生成成功",
          data: {
            inviteCode: response.inviteCode || response.code || "",
            expireAt: response.expireAt || response.expireTime || ""
          }
        };
      } else {
        common_vendor.index.__f__("warn", "at api/couple.js:222", "⚠️ 响应数据格式异常:", response);
        return {
          success: response.success !== false,
          message: response.message || "生成成功",
          data: { inviteCode: "", expireAt: "" }
        };
      }
    });
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:231", "❌ [情侣关系API] 生成邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:232", "🔴 错误信息:", error);
    throw error;
  });
}
function validateInviteCode(inviteCode) {
  const url = utils_config.config.API.COUPLE.INVITE_VALIDATE + "?code=" + encodeURIComponent(inviteCode);
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:267", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("log", "at api/couple.js:268", "🔗 [情侣关系API] 开始验证邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:269", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("log", "at api/couple.js:270", "📍 [请求地址]", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:271", "📋 [请求方法] GET");
  common_vendor.index.__f__("log", "at api/couple.js:272", "📝 [原始邀请码]", inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:273", "📝 [邀请码类型]", typeof inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:274", "📝 [邀请码长度]", inviteCode ? inviteCode.length : 0);
  common_vendor.index.__f__("log", "at api/couple.js:275", "📝 [URL编码后邀请码]", encodeURIComponent(inviteCode));
  common_vendor.index.__f__("log", "at api/couple.js:276", "📝 [完整URL参数]", "code=" + encodeURIComponent(inviteCode));
  common_vendor.index.__f__("log", "at api/couple.js:277", "⏰ [请求时间]", (/* @__PURE__ */ new Date()).toLocaleString());
  common_vendor.index.__f__("log", "at api/couple.js:278", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return utils_http.http.get(url).then((response) => {
    var _a, _b, _c, _d;
    common_vendor.index.__f__("log", "at api/couple.js:281", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at api/couple.js:282", "✅ [情侣关系API] 验证邀请码成功");
    common_vendor.index.__f__("log", "at api/couple.js:283", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at api/couple.js:284", "📦 [响应数据类型]", typeof response);
    common_vendor.index.__f__("log", "at api/couple.js:285", "📦 [完整响应数据]", JSON.stringify(response, null, 2));
    if (response && typeof response === "object") {
      common_vendor.index.__f__("log", "at api/couple.js:288", "📦 [响应数据字段列表]", Object.keys(response).join(", "));
    }
    if (response && response.data && response.data.creator) {
      common_vendor.index.__f__("log", "at api/couple.js:293", `📝 [返回的邀请码] ${response.data.code || inviteCode}`);
      common_vendor.index.__f__("log", "at api/couple.js:294", `👤 [发起方昵称] ${((_a = response.data.creator) == null ? void 0 : _a.nickName) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:295", `👤 [发起方ID] ${((_b = response.data.creator) == null ? void 0 : _b.id) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:296", `⏰ [过期时间] ${response.data.expireAt || "未知"}`);
      if (response.data.creator) {
        common_vendor.index.__f__("log", "at api/couple.js:298", "👤 [发起方完整信息]", JSON.stringify(response.data.creator, null, 2));
      }
      return response;
    }
    if (response && response.creator) {
      common_vendor.index.__f__("log", "at api/couple.js:305", `👤 [发起方昵称] ${((_c = response.creator) == null ? void 0 : _c.nickName) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:306", `👤 [发起方ID] ${((_d = response.creator) == null ? void 0 : _d.id) || "未知"}`);
      return { success: true, data: response };
    }
    if (response && (response.inviterNickName || response.inviterId)) {
      common_vendor.index.__f__("log", "at api/couple.js:312", `👤 [发起方昵称] ${response.inviterNickName || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:313", `👤 [发起方ID] ${response.inviterId || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:314", `🖼️ [发起方头像] ${response.inviterAvatarUrl || "未知"}`);
      const normalizedResponse = {
        success: response.success !== void 0 ? response.success : true,
        message: response.message || "邀请码有效",
        data: {
          code: inviteCode,
          creator: {
            id: response.inviterId,
            nickName: response.inviterNickName,
            avatarUrl: response.inviterAvatarUrl
          },
          expireAt: response.expireAt || null
        }
      };
      common_vendor.index.__f__("log", "at api/couple.js:331", "✅ [数据格式转换] 已将新格式转换为标准格式");
      common_vendor.index.__f__("log", "at api/couple.js:332", "📦 [转换后的数据]", JSON.stringify(normalizedResponse, null, 2));
      return normalizedResponse;
    }
    common_vendor.index.__f__("warn", "at api/couple.js:337", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at api/couple.js:338", "⚠️ [情侣关系API] 响应数据格式异常");
    common_vendor.index.__f__("warn", "at api/couple.js:339", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at api/couple.js:340", "📦 [响应数据]", response);
    common_vendor.index.__f__("warn", "at api/couple.js:341", "📦 [响应数据类型]", typeof response);
    if (response && typeof response === "object") {
      common_vendor.index.__f__("warn", "at api/couple.js:343", "📦 [响应数据字段]", Object.keys(response).join(", "));
    }
    common_vendor.index.__f__("warn", "at api/couple.js:345", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { success: false, message: (response == null ? void 0 : response.message) || "邀请码验证失败" };
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:348", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at api/couple.js:349", "❌ [情侣关系API] 验证邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:350", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at api/couple.js:351", "📝 [输入的邀请码]", inviteCode);
    common_vendor.index.__f__("error", "at api/couple.js:352", "📝 [邀请码类型]", typeof inviteCode);
    common_vendor.index.__f__("error", "at api/couple.js:353", "📝 [邀请码长度]", inviteCode ? inviteCode.length : 0);
    common_vendor.index.__f__("error", "at api/couple.js:354", "🔴 [错误对象]", error);
    common_vendor.index.__f__("error", "at api/couple.js:355", "🔴 [错误类型]", typeof error);
    common_vendor.index.__f__("error", "at api/couple.js:356", "🔴 [错误消息]", error == null ? void 0 : error.message);
    common_vendor.index.__f__("error", "at api/couple.js:357", "🔴 [错误状态码]", error == null ? void 0 : error.statusCode);
    common_vendor.index.__f__("error", "at api/couple.js:358", "🔴 [错误数据]", error == null ? void 0 : error.data);
    common_vendor.index.__f__("error", "at api/couple.js:359", "🔴 [错误响应数据]", error == null ? void 0 : error.responseData);
    if (error && typeof error === "object") {
      common_vendor.index.__f__("error", "at api/couple.js:361", "🔴 [错误对象字段列表]", Object.keys(error).join(", "));
    }
    if (error == null ? void 0 : error.stack) {
      common_vendor.index.__f__("error", "at api/couple.js:364", "🔴 [错误堆栈]", error.stack);
    }
    common_vendor.index.__f__("error", "at api/couple.js:366", "⏰ [错误时间]", (/* @__PURE__ */ new Date()).toLocaleString());
    common_vendor.index.__f__("error", "at api/couple.js:367", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw error;
  });
}
function acceptInvite(inviteCode) {
  const url = utils_config.config.API.COUPLE.BIND_ACCEPT;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:406", "🔗 [情侣关系API] 开始接受邀请");
  common_vendor.index.__f__("log", "at api/couple.js:407", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:408", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:409", "📤 请求参数: { inviteCode:", inviteCode, "}");
  common_vendor.index.__f__("log", "at api/couple.js:410", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, { inviteCode }).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/couple.js:413", "✅ [情侣关系API] 接受邀请成功");
    common_vendor.index.__f__("log", "at api/couple.js:414", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/couple.js:417", `💑 关系ID: ${response.data.coupleId}`);
      common_vendor.index.__f__("log", "at api/couple.js:418", `👤 对方昵称: ${((_a = response.data.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
      return response;
    } else if (response && response.coupleId) {
      common_vendor.index.__f__("log", "at api/couple.js:422", `💑 关系ID: ${response.coupleId}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:425", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:429", "❌ [情侣关系API] 接受邀请失败");
    common_vendor.index.__f__("error", "at api/couple.js:430", "🔴 错误信息:", error);
    throw error;
  });
}
function getCoupleStatus() {
  const url = utils_config.config.API.COUPLE.STATUS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:465", "🔗 [情侣关系API] 开始查询绑定状态");
  common_vendor.index.__f__("log", "at api/couple.js:466", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:467", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/couple.js:468", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/couple.js:471", "✅ [情侣关系API] 查询绑定状态成功");
    common_vendor.index.__f__("log", "at api/couple.js:472", "📦 响应数据:", response);
    if (response && response.data) {
      const status = response.data;
      common_vendor.index.__f__("log", "at api/couple.js:476", "📊 绑定状态:");
      common_vendor.index.__f__("log", "at api/couple.js:477", `   - 是否已绑定: ${status.isBound ? "是" : "否"}`);
      if (status.isBound) {
        common_vendor.index.__f__("log", "at api/couple.js:479", `   - 关系ID: ${status.coupleId}`);
        common_vendor.index.__f__("log", "at api/couple.js:480", `   - 对方昵称: ${((_a = status.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
        common_vendor.index.__f__("log", "at api/couple.js:481", `   - 绑定时间: ${status.bindTime || "未知"}`);
      }
      return response;
    } else if (response && (response.isBound !== void 0 || response.coupleId)) {
      return { success: true, data: response };
    } else if (response && response.isCouple !== void 0) {
      common_vendor.index.__f__("log", "at api/couple.js:489", "📊 绑定状态:");
      common_vendor.index.__f__("log", "at api/couple.js:490", `   - 是否已绑定: ${response.isCouple ? "是" : "否"}`);
      return {
        success: response.success !== false,
        message: response.message || "查询成功",
        data: {
          isBound: response.isCouple,
          coupleId: response.coupleId || null,
          partnerInfo: response.partnerInfo || null,
          bindTime: response.bindTime || null,
          role: response.role || null
        }
      };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:503", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: { isBound: false } };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:507", "❌ [情侣关系API] 查询绑定状态失败");
    common_vendor.index.__f__("error", "at api/couple.js:508", "🔴 错误信息:", error);
    throw error;
  });
}
function unbindCouple() {
  const url = utils_config.config.API.COUPLE.UNBIND;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:531", "🔗 [情侣关系API] 开始解绑关系");
  common_vendor.index.__f__("log", "at api/couple.js:532", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:533", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:534", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url).then((response) => {
    common_vendor.index.__f__("log", "at api/couple.js:537", "✅ [情侣关系API] 解绑关系成功");
    common_vendor.index.__f__("log", "at api/couple.js:538", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    const errorMessage = error.message || error.data && error.data.message || "";
    if (errorMessage.includes("没有情侣关系") || errorMessage.includes("未绑定") || errorMessage.includes("不存在")) {
      common_vendor.index.__f__("warn", "at api/couple.js:546", '⚠️ [情侣关系API] 解绑时检测到"没有情侣关系"，视为成功');
      common_vendor.index.__f__("warn", "at api/couple.js:547", "💡 说明：没有关系可解，目标已达成");
      return {
        success: true,
        message: "已解除关系（原本没有情侣关系）",
        data: null
      };
    }
    common_vendor.index.__f__("error", "at api/couple.js:555", "❌ [情侣关系API] 解绑关系失败");
    common_vendor.index.__f__("error", "at api/couple.js:556", "🔴 错误信息:", error);
    throw error;
  });
}
exports.acceptInvite = acceptInvite;
exports.createInviteCode = createInviteCode;
exports.getCoupleStatus = getCoupleStatus;
exports.unbindCouple = unbindCouple;
exports.validateInviteCode = validateInviteCode;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/couple.js.map
