"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
const utils_auth = require("../utils/auth.js");
const api_login = require("./login.js");
function isMsgCodeSuccess(response) {
  return response && typeof response === "object" && response.code === 200 && ("msg" in response || "message" in response);
}
function getResponseMessage(response, fallbackText = "") {
  if (!response || typeof response !== "object") {
    return fallbackText;
  }
  return response.msg || response.message || fallbackText;
}
async function getCurrentUserId() {
  try {
    common_vendor.index.__f__("log", "at api/couple.js:33", "🔍 [获取用户ID] 开始尝试获取用户ID...");
    const userInfo = utils_auth.getUserInfo();
    common_vendor.index.__f__("log", "at api/couple.js:37", "🔍 [方法1] 从auth.js获取用户信息:", userInfo);
    if (userInfo && userInfo.userId) {
      common_vendor.index.__f__("log", "at api/couple.js:39", "✅ [方法1] 成功获取userId:", userInfo.userId);
      return userInfo.userId;
    }
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    common_vendor.index.__f__("log", "at api/couple.js:45", "🔍 [方法2] 从登录信息获取:", loginInfo ? "找到登录信息" : "未找到登录信息");
    if (loginInfo) {
      common_vendor.index.__f__("log", "at api/couple.js:47", "🔍 [方法2] 登录信息完整结构:", JSON.stringify(loginInfo, null, 2));
      if (loginInfo.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:51", "✅ [方法2] 从loginInfo.userId获取:", loginInfo.userId);
        return loginInfo.userId;
      }
      if (loginInfo.userInfo && loginInfo.userInfo.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:55", "✅ [方法2] 从loginInfo.userInfo.userId获取:", loginInfo.userInfo.userId);
        return loginInfo.userInfo.userId;
      }
      if (loginInfo.data && loginInfo.data.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:59", "✅ [方法2] 从loginInfo.data.userId获取:", loginInfo.data.userId);
        return loginInfo.data.userId;
      }
      if (loginInfo.openid) {
        common_vendor.index.__f__("log", "at api/couple.js:64", "✅ [方法2] 使用openid作为userId:", loginInfo.openid);
        return loginInfo.openid;
      }
    }
    common_vendor.index.__f__("log", "at api/couple.js:70", "🔍 [方法3] 尝试调用用户信息API...");
    try {
      const response = await api_login.getUserInfo();
      common_vendor.index.__f__("log", "at api/couple.js:73", "🔍 [方法3] API响应:", response);
      if (response && response.success && response.data && response.data.userId) {
        common_vendor.index.__f__("log", "at api/couple.js:75", "✅ [方法3] 从API获取userId:", response.data.userId);
        if (loginInfo) {
          if (!loginInfo.userInfo) {
            loginInfo.userInfo = {};
          }
          loginInfo.userInfo.userId = response.data.userId;
          common_vendor.index.setStorageSync("login_info", loginInfo);
          common_vendor.index.__f__("log", "at api/couple.js:83", "💾 [方法3] 已保存userId到本地存储");
        }
        return response.data.userId;
      } else {
        common_vendor.index.__f__("warn", "at api/couple.js:87", "⚠️ [方法3] API响应中没有userId:", response);
      }
    } catch (apiError) {
      common_vendor.index.__f__("warn", "at api/couple.js:90", "⚠️ [方法3] 调用用户信息API失败:", apiError);
    }
    if (loginInfo && loginInfo.token) {
      common_vendor.index.__f__("log", "at api/couple.js:95", "🔍 [方法4] 尝试从token解析userId...");
      try {
        const tokenParts = loginInfo.token.split(".");
        common_vendor.index.__f__("log", "at api/couple.js:98", "🔍 [方法4] Token分段数量:", tokenParts.length);
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
            common_vendor.index.__f__("log", "at api/couple.js:121", "🔍 [方法4] Token payload:", payload);
            if (payload.userId || payload.uid || payload.user_id) {
              const userId = payload.userId || payload.uid || payload.user_id;
              common_vendor.index.__f__("log", "at api/couple.js:124", "✅ [方法4] 从token解析userId:", userId);
              return userId;
            } else {
              common_vendor.index.__f__("warn", "at api/couple.js:127", "⚠️ [方法4] Token payload中没有userId字段");
            }
          } catch (decodeError) {
            common_vendor.index.__f__("warn", "at api/couple.js:130", "⚠️ [方法4] Token解码失败:", decodeError);
            if (loginInfo.openid) {
              common_vendor.index.__f__("log", "at api/couple.js:133", "✅ [方法4] 使用openid作为userId:", loginInfo.openid);
              return loginInfo.openid;
            }
          }
        } else {
          common_vendor.index.__f__("warn", "at api/couple.js:138", "⚠️ [方法4] Token格式不正确，不是JWT格式");
          if (loginInfo.openid) {
            common_vendor.index.__f__("log", "at api/couple.js:141", "✅ [方法4] 使用openid作为userId:", loginInfo.openid);
            return loginInfo.openid;
          }
        }
      } catch (e) {
        common_vendor.index.__f__("warn", "at api/couple.js:146", "⚠️ [方法4] 从token解析userId失败:", e);
      }
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:149", "⚠️ [方法4] 登录信息中没有token");
    }
    common_vendor.index.__f__("error", "at api/couple.js:153", "❌ [获取用户ID] 所有方法都失败，无法获取用户ID");
    common_vendor.index.__f__("error", "at api/couple.js:154", "❌ [登录信息]", loginInfo);
    throw new Error("无法获取用户ID，请先登录");
  } catch (error) {
    common_vendor.index.__f__("error", "at api/couple.js:157", "❌ [获取用户ID] 异常:", error);
    throw error;
  }
}
function createInviteCode() {
  const url = utils_config.config.API.COUPLE.INVITE_CREATE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:188", "🔗 [情侣关系API] 开始生成邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:189", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:190", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:191", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return getCurrentUserId().then((userId) => {
    common_vendor.index.__f__("log", "at api/couple.js:195", "👤 用户ID:", userId);
    common_vendor.index.__f__("log", "at api/couple.js:196", "📤 请求参数: { userId:", userId, "}");
    return utils_http.http.post(url, { userId }).then((response) => {
      var _a;
      common_vendor.index.__f__("log", "at api/couple.js:199", "✅ [情侣关系API] 生成邀请码成功");
      common_vendor.index.__f__("log", "at api/couple.js:200", "📦 响应数据:", response);
      if (response && typeof response === "object" && response.code !== void 0 && response.code !== 200) {
        const errorMsg = response.msg || response.message || "请求失败";
        common_vendor.index.__f__("error", "at api/couple.js:205", "❌ [情侣关系API] 后端返回错误码:", response.code);
        common_vendor.index.__f__("error", "at api/couple.js:206", "❌ 错误信息:", errorMsg);
        if (response.code === 401 || response.code === 403) {
          throw new Error(errorMsg);
        }
        return {
          success: false,
          message: errorMsg,
          data: { inviteCode: "", expireAt: "" },
          code: response.code
        };
      }
      const normalizedMessage = getResponseMessage(response, "邀请码生成成功");
      if (isMsgCodeSuccess(response)) {
        const responseData = response == null ? void 0 : response.data;
        const inviteCode = typeof responseData === "string" ? responseData : (responseData == null ? void 0 : responseData.inviteCode) || (responseData == null ? void 0 : responseData.code) || "";
        const expireAt = typeof responseData === "object" && (responseData == null ? void 0 : responseData.expireAt) || (response == null ? void 0 : response.expireAt) || ((_a = response == null ? void 0 : response.data) == null ? void 0 : _a.expireAt) || "";
        common_vendor.index.__f__("log", "at api/couple.js:234", `📝 邀请码: ${inviteCode}`);
        return {
          success: true,
          message: normalizedMessage,
          data: {
            inviteCode,
            expireAt
          }
        };
      }
      if (response && response.data && typeof response.data === "string") {
        const inviteCode = response.data;
        common_vendor.index.__f__("log", "at api/couple.js:249", `📝 邀请码: ${inviteCode}`);
        return {
          success: response.code === 200 || response.success !== false,
          message: normalizedMessage,
          data: {
            inviteCode,
            expireAt: response.expireAt || ""
            // 如果后端返回过期时间
          }
        };
      } else if (response && response.data && response.data.inviteCode) {
        common_vendor.index.__f__("log", "at api/couple.js:262", `📝 邀请码: ${response.data.inviteCode}`);
        common_vendor.index.__f__("log", "at api/couple.js:263", `⏰ 过期时间: ${response.data.expireAt}`);
        return {
          ...response,
          message: getResponseMessage(response, "邀请码生成成功")
        };
      } else if (response && response.invitation) {
        const invitation = response.invitation;
        common_vendor.index.__f__("log", "at api/couple.js:272", `📝 邀请码: ${invitation.inviteCode || invitation.code || ""}`);
        common_vendor.index.__f__("log", "at api/couple.js:273", `⏰ 过期时间: ${invitation.expireAt || invitation.expireTime || ""}`);
        return {
          success: response.success !== false,
          message: normalizedMessage,
          data: {
            inviteCode: invitation.inviteCode || invitation.code || "",
            expireAt: invitation.expireAt || invitation.expireTime || ""
          },
          isBound: response.isBound || false
        };
      } else if (response && (response.inviteCode || response.code)) {
        common_vendor.index.__f__("log", "at api/couple.js:287", `📝 邀请码: ${response.inviteCode || response.code}`);
        return {
          success: response.success !== false,
          message: normalizedMessage,
          data: {
            inviteCode: response.inviteCode || response.code || "",
            expireAt: response.expireAt || response.expireTime || ""
          }
        };
      } else {
        common_vendor.index.__f__("warn", "at api/couple.js:299", "⚠️ 响应数据格式异常:", response);
        return {
          success: response.code === 200 || response.success !== false,
          message: normalizedMessage || "生成成功",
          data: { inviteCode: "", expireAt: "" }
        };
      }
    });
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:308", "❌ [情侣关系API] 生成邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:309", "🔴 错误信息:", error);
    throw error;
  });
}
function validateInviteCode(inviteCode) {
  const url = utils_config.config.API.COUPLE.INVITE_VALIDATE + "?code=" + encodeURIComponent(inviteCode);
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:344", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("log", "at api/couple.js:345", "🔗 [情侣关系API] 开始验证邀请码");
  common_vendor.index.__f__("log", "at api/couple.js:346", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("log", "at api/couple.js:347", "📍 [请求地址]", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:348", "📋 [请求方法] GET");
  common_vendor.index.__f__("log", "at api/couple.js:349", "📝 [原始邀请码]", inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:350", "📝 [邀请码类型]", typeof inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:351", "📝 [邀请码长度]", inviteCode ? inviteCode.length : 0);
  common_vendor.index.__f__("log", "at api/couple.js:352", "📝 [URL编码后邀请码]", encodeURIComponent(inviteCode));
  common_vendor.index.__f__("log", "at api/couple.js:353", "📝 [完整URL参数]", "code=" + encodeURIComponent(inviteCode));
  common_vendor.index.__f__("log", "at api/couple.js:354", "⏰ [请求时间]", (/* @__PURE__ */ new Date()).toLocaleString());
  common_vendor.index.__f__("log", "at api/couple.js:355", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return utils_http.http.get(url).then((response) => {
    var _a, _b, _c, _d;
    common_vendor.index.__f__("log", "at api/couple.js:358", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at api/couple.js:359", "✅ [情侣关系API] 验证邀请码成功");
    common_vendor.index.__f__("log", "at api/couple.js:360", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at api/couple.js:361", "📦 [响应数据类型]", typeof response);
    common_vendor.index.__f__("log", "at api/couple.js:362", "📦 [完整响应数据]", JSON.stringify(response, null, 2));
    if (response && typeof response === "object") {
      common_vendor.index.__f__("log", "at api/couple.js:365", "📦 [响应数据字段列表]", Object.keys(response).join(", "));
    }
    if (response && typeof response === "object" && response.code !== void 0 && response.code !== 200) {
      const errorMsg = response.msg || response.message || "请求失败";
      common_vendor.index.__f__("error", "at api/couple.js:371", "❌ [情侣关系API] 后端返回错误码:", response.code);
      common_vendor.index.__f__("error", "at api/couple.js:372", "❌ 错误信息:", errorMsg);
      if (response.code === 401 || response.code === 403) {
        throw new Error(errorMsg);
      }
      return {
        success: false,
        message: errorMsg,
        data: null,
        code: response.code
      };
    }
    const hasMsgCodeFormat = response && typeof response === "object" && "code" in response && (response.msg || response.message);
    if (hasMsgCodeFormat) {
      if (isMsgCodeSuccess(response)) {
        const normalizedResponse = {
          success: true,
          message: getResponseMessage(response, "邀请码有效"),
          data: null
        };
        if (response.data && typeof response.data === "object") {
          normalizedResponse.data = {
            code: response.data.code || inviteCode,
            creator: response.data.creator || response.creator || null,
            expireAt: response.data.expireAt || response.expireAt || null
          };
        } else {
          normalizedResponse.data = {
            code: inviteCode,
            creator: response.creator || null,
            expireAt: response.expireAt || null
          };
        }
        common_vendor.index.__f__("log", "at api/couple.js:410", "✅ [情侣关系API] msg/code格式响应，已转换为标准结构");
        common_vendor.index.__f__("log", "at api/couple.js:411", "📦 [转换后的数据]", JSON.stringify(normalizedResponse, null, 2));
        return normalizedResponse;
      }
      common_vendor.index.__f__("warn", "at api/couple.js:415", "⚠️ [情侣关系API] msg/code格式响应但 code 非200，视为失败");
      return {
        success: false,
        message: getResponseMessage(response, "邀请码验证失败"),
        data: null,
        code: response.code
      };
    }
    if (response && response.data && response.data.creator) {
      common_vendor.index.__f__("log", "at api/couple.js:426", `📝 [返回的邀请码] ${response.data.code || inviteCode}`);
      common_vendor.index.__f__("log", "at api/couple.js:427", `👤 [发起方昵称] ${((_a = response.data.creator) == null ? void 0 : _a.nickName) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:428", `👤 [发起方ID] ${((_b = response.data.creator) == null ? void 0 : _b.id) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:429", `⏰ [过期时间] ${response.data.expireAt || "未知"}`);
      if (response.data.creator) {
        common_vendor.index.__f__("log", "at api/couple.js:431", "👤 [发起方完整信息]", JSON.stringify(response.data.creator, null, 2));
      }
      return response;
    }
    if (response && response.creator) {
      common_vendor.index.__f__("log", "at api/couple.js:438", `👤 [发起方昵称] ${((_c = response.creator) == null ? void 0 : _c.nickName) || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:439", `👤 [发起方ID] ${((_d = response.creator) == null ? void 0 : _d.id) || "未知"}`);
      return { success: true, data: response };
    }
    if (response && (response.inviterNickName || response.inviterId)) {
      common_vendor.index.__f__("log", "at api/couple.js:445", `👤 [发起方昵称] ${response.inviterNickName || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:446", `👤 [发起方ID] ${response.inviterId || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:447", `🖼️ [发起方头像] ${response.inviterAvatarUrl || "未知"}`);
      const normalizedResponse = {
        success: response.success !== void 0 ? response.success : true,
        message: getResponseMessage(response, "邀请码有效"),
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
      common_vendor.index.__f__("log", "at api/couple.js:464", "✅ [数据格式转换] 已将新格式转换为标准格式");
      common_vendor.index.__f__("log", "at api/couple.js:465", "📦 [转换后的数据]", JSON.stringify(normalizedResponse, null, 2));
      return normalizedResponse;
    }
    common_vendor.index.__f__("warn", "at api/couple.js:470", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at api/couple.js:471", "⚠️ [情侣关系API] 响应数据格式异常");
    common_vendor.index.__f__("warn", "at api/couple.js:472", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at api/couple.js:473", "📦 [响应数据]", response);
    common_vendor.index.__f__("warn", "at api/couple.js:474", "📦 [响应数据类型]", typeof response);
    if (response && typeof response === "object") {
      common_vendor.index.__f__("warn", "at api/couple.js:476", "📦 [响应数据字段]", Object.keys(response).join(", "));
    }
    common_vendor.index.__f__("warn", "at api/couple.js:478", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { success: false, message: getResponseMessage(response, "邀请码验证失败") };
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:481", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at api/couple.js:482", "❌ [情侣关系API] 验证邀请码失败");
    common_vendor.index.__f__("error", "at api/couple.js:483", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at api/couple.js:484", "📝 [输入的邀请码]", inviteCode);
    common_vendor.index.__f__("error", "at api/couple.js:485", "📝 [邀请码类型]", typeof inviteCode);
    common_vendor.index.__f__("error", "at api/couple.js:486", "📝 [邀请码长度]", inviteCode ? inviteCode.length : 0);
    common_vendor.index.__f__("error", "at api/couple.js:487", "🔴 [错误对象]", error);
    common_vendor.index.__f__("error", "at api/couple.js:488", "🔴 [错误类型]", typeof error);
    common_vendor.index.__f__("error", "at api/couple.js:489", "🔴 [错误消息]", error == null ? void 0 : error.message);
    common_vendor.index.__f__("error", "at api/couple.js:490", "🔴 [错误状态码]", error == null ? void 0 : error.statusCode);
    common_vendor.index.__f__("error", "at api/couple.js:491", "🔴 [错误数据]", error == null ? void 0 : error.data);
    common_vendor.index.__f__("error", "at api/couple.js:492", "🔴 [错误响应数据]", error == null ? void 0 : error.responseData);
    if (error && typeof error === "object") {
      common_vendor.index.__f__("error", "at api/couple.js:494", "🔴 [错误对象字段列表]", Object.keys(error).join(", "));
    }
    if (error == null ? void 0 : error.stack) {
      common_vendor.index.__f__("error", "at api/couple.js:497", "🔴 [错误堆栈]", error.stack);
    }
    common_vendor.index.__f__("error", "at api/couple.js:499", "⏰ [错误时间]", (/* @__PURE__ */ new Date()).toLocaleString());
    common_vendor.index.__f__("error", "at api/couple.js:500", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw error;
  });
}
function acceptInvite(inviteCode) {
  const url = utils_config.config.API.COUPLE.BIND_ACCEPT;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:532", "🔗 [情侣关系API] 开始接受邀请");
  common_vendor.index.__f__("log", "at api/couple.js:533", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:534", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:535", "📝 邀请码:", inviteCode);
  common_vendor.index.__f__("log", "at api/couple.js:536", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return getCurrentUserId().then((userId) => {
    common_vendor.index.__f__("log", "at api/couple.js:540", "👤 被邀请用户ID:", userId);
    common_vendor.index.__f__("log", "at api/couple.js:541", "📤 请求参数: { inviteCode:", inviteCode, ", userId:", userId, "}");
    return utils_http.http.post(url, { inviteCode, userId }).then((response) => {
      var _a;
      common_vendor.index.__f__("log", "at api/couple.js:544", "✅ [情侣关系API] 接受邀请成功");
      common_vendor.index.__f__("log", "at api/couple.js:545", "📦 响应数据:", response);
      if (response && typeof response === "object" && response.code !== void 0 && response.code !== 200) {
        const errorMsg = response.msg || response.message || "请求失败";
        common_vendor.index.__f__("error", "at api/couple.js:550", "❌ [情侣关系API] 后端返回错误码:", response.code);
        common_vendor.index.__f__("error", "at api/couple.js:551", "❌ 错误信息:", errorMsg);
        if (response.code === 401 || response.code === 403) {
          throw new Error(errorMsg);
        }
        return {
          success: false,
          message: errorMsg,
          data: null,
          code: response.code
        };
      }
      const normalizedMessage = getResponseMessage(response, "邀请成功");
      if (isMsgCodeSuccess(response)) {
        const inviteData = (response == null ? void 0 : response.data) || {};
        common_vendor.index.__f__("log", "at api/couple.js:569", "👤 邀请人信息:", inviteData);
        return {
          success: true,
          message: normalizedMessage,
          data: {
            coupleId: inviteData.coupleId || "",
            partnerInfo: inviteData.partnerInfo || inviteData || {},
            bindTime: inviteData.bindTime || (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      }
      if (response && response.code === 200 && response.data) {
        const inviteData = response.data;
        common_vendor.index.__f__("log", "at api/couple.js:586", `👤 邀请人信息:`, inviteData);
        return {
          success: true,
          message: normalizedMessage,
          data: {
            coupleId: inviteData.coupleId || "",
            partnerInfo: inviteData.partnerInfo || inviteData || {},
            bindTime: inviteData.bindTime || (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      } else if (response && response.data) {
        common_vendor.index.__f__("log", "at api/couple.js:601", `💑 关系ID: ${response.data.coupleId || "未知"}`);
        common_vendor.index.__f__("log", "at api/couple.js:602", `👤 对方昵称: ${((_a = response.data.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
        return response;
      } else if (response && response.coupleId) {
        common_vendor.index.__f__("log", "at api/couple.js:607", `💑 关系ID: ${response.coupleId}`);
        return { success: true, data: response };
      } else {
        common_vendor.index.__f__("warn", "at api/couple.js:612", "⚠️ 响应数据格式异常:", response);
        return {
          success: response.code === 200 || response.success !== false,
          message: normalizedMessage || "邀请成功",
          data: response.data || {}
        };
      }
    });
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:621", "❌ [情侣关系API] 接受邀请失败");
    common_vendor.index.__f__("error", "at api/couple.js:622", "🔴 错误信息:", error);
    throw error;
  });
}
function getCoupleStatus() {
  const url = utils_config.config.API.COUPLE.STATUS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:657", "🔗 [情侣关系API] 开始查询绑定状态");
  common_vendor.index.__f__("log", "at api/couple.js:658", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:659", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/couple.js:660", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/couple.js:663", "✅ [情侣关系API] 查询绑定状态成功");
    common_vendor.index.__f__("log", "at api/couple.js:664", "📦 响应数据:", response);
    if (response && typeof response === "object" && response.code !== void 0 && response.code !== 200) {
      const errorMsg = response.msg || response.message || "请求失败";
      common_vendor.index.__f__("error", "at api/couple.js:669", "❌ [情侣关系API] 后端返回错误码:", response.code);
      common_vendor.index.__f__("error", "at api/couple.js:670", "❌ 错误信息:", errorMsg);
      throw new Error(errorMsg);
    }
    if (response && response.data) {
      const status = response.data;
      common_vendor.index.__f__("log", "at api/couple.js:676", "📊 绑定状态:");
      common_vendor.index.__f__("log", "at api/couple.js:677", `   - 是否已绑定: ${status.isBound ? "是" : "否"}`);
      if (status.isBound) {
        common_vendor.index.__f__("log", "at api/couple.js:679", `   - 关系ID: ${status.coupleId}`);
        common_vendor.index.__f__("log", "at api/couple.js:680", `   - 对方昵称: ${((_a = status.partnerInfo) == null ? void 0 : _a.nickName) || "未知"}`);
        common_vendor.index.__f__("log", "at api/couple.js:681", `   - 绑定时间: ${status.bindTime || "未知"}`);
      }
      return response;
    } else if (response && (response.isBound !== void 0 || response.coupleId)) {
      return { success: true, data: response };
    } else if (response && response.isCouple !== void 0) {
      common_vendor.index.__f__("log", "at api/couple.js:689", "📊 绑定状态:");
      common_vendor.index.__f__("log", "at api/couple.js:690", `   - 是否已绑定: ${response.isCouple ? "是" : "否"}`);
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
    } else if (response && response.msg && (response.msg.includes("未找到情侣关系") || response.msg.includes("没有情侣关系") || response.msg.includes("未绑定"))) {
      common_vendor.index.__f__("log", "at api/couple.js:705", "📊 绑定状态: 未绑定（后端返回未找到情侣关系）");
      return {
        success: true,
        message: response.msg || "未找到情侣关系",
        data: {
          isBound: false,
          coupleId: null,
          partnerInfo: null,
          bindTime: null,
          role: null
        }
      };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:718", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: { isBound: false } };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:722", "❌ [情侣关系API] 查询绑定状态失败");
    common_vendor.index.__f__("error", "at api/couple.js:723", "🔴 错误信息:", error);
    throw error;
  });
}
function unbindCouple() {
  const url = utils_config.config.API.COUPLE.UNBIND;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:746", "🔗 [情侣关系API] 开始解绑关系");
  common_vendor.index.__f__("log", "at api/couple.js:747", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:748", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/couple.js:749", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url).then((response) => {
    common_vendor.index.__f__("log", "at api/couple.js:752", "✅ [情侣关系API] 解绑关系成功");
    common_vendor.index.__f__("log", "at api/couple.js:753", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    const errorMessage = error.message || error.data && error.data.message || "";
    if (errorMessage.includes("没有情侣关系") || errorMessage.includes("未绑定") || errorMessage.includes("不存在")) {
      common_vendor.index.__f__("warn", "at api/couple.js:761", '⚠️ [情侣关系API] 解绑时检测到"没有情侣关系"，视为成功');
      common_vendor.index.__f__("warn", "at api/couple.js:762", "💡 说明：没有关系可解，目标已达成");
      return {
        success: true,
        message: "已解除关系（原本没有情侣关系）",
        data: null
      };
    }
    common_vendor.index.__f__("error", "at api/couple.js:770", "❌ [情侣关系API] 解绑关系失败");
    common_vendor.index.__f__("error", "at api/couple.js:771", "🔴 错误信息:", error);
    throw error;
  });
}
function getLoveDays() {
  const url = utils_config.config.API.COUPLE.LOVE_DAYS;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/couple.js:799", "🔗 [情侣关系API] 开始获取相爱天数");
  common_vendor.index.__f__("log", "at api/couple.js:800", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/couple.js:801", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/couple.js:802", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/couple.js:805", "✅ [情侣关系API] 获取相爱天数成功");
    common_vendor.index.__f__("log", "at api/couple.js:806", "📦 响应数据:", response);
    if (response && response.data) {
      const loveDaysData = response.data;
      common_vendor.index.__f__("log", "at api/couple.js:810", "📊 相爱天数信息:");
      common_vendor.index.__f__("log", "at api/couple.js:811", `   - 相爱天数: ${loveDaysData.loveDays || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:812", `   - 纪念日: ${loveDaysData.anniversaryDate || "未知"}`);
      common_vendor.index.__f__("log", "at api/couple.js:813", `   - 关系名称: ${loveDaysData.relationshipName || "未知"}`);
      return response;
    } else if (response && (response.loveDays !== void 0 || response.anniversaryDate)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/couple.js:819", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/couple.js:823", "❌ [情侣关系API] 获取相爱天数失败");
    common_vendor.index.__f__("error", "at api/couple.js:824", "🔴 错误信息:", error);
    throw error;
  });
}
exports.acceptInvite = acceptInvite;
exports.createInviteCode = createInviteCode;
exports.getCoupleStatus = getCoupleStatus;
exports.getLoveDays = getLoveDays;
exports.unbindCouple = unbindCouple;
exports.validateInviteCode = validateInviteCode;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/couple.js.map
