"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function createFutureLetter(letterData) {
  const url = utils_config.config.API.FUTURE_LETTER.CREATE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:32", "🔗 [未来情书API] 开始创建未来情书");
  common_vendor.index.__f__("log", "at api/futureLetter.js:33", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:34", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/futureLetter.js:35", "📤 请求参数:", letterData);
  common_vendor.index.__f__("log", "at api/futureLetter.js:36", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, letterData).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:39", "✅ [未来情书API] 创建未来情书成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:40", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:43", `📝 情书ID: ${response.data.id || "未知"}`);
      common_vendor.index.__f__("log", "at api/futureLetter.js:44", `📝 情书标题: ${response.data.title || "未知"}`);
      return response;
    } else if (response && (response.id || response.letterId)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/futureLetter.js:50", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:54", "❌ [未来情书API] 创建未来情书失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:55", "🔴 错误信息:", error);
    throw error;
  });
}
function getFutureLetterList(options = {}) {
  let url = utils_config.config.API.FUTURE_LETTER.LIST;
  const params = [];
  if (options.status) {
    params.push(`status=${encodeURIComponent(options.status)}`);
  }
  if (params.length > 0) {
    url += "?" + params.join("&");
  }
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:85", "🔗 [未来情书API] 开始获取未来情书列表");
  common_vendor.index.__f__("log", "at api/futureLetter.js:86", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:87", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/futureLetter.js:88", "📄 查询参数:", options);
  common_vendor.index.__f__("log", "at api/futureLetter.js:89", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:92", "✅ [未来情书API] 获取未来情书列表成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:93", "📦 响应数据:", response);
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : response.data.letters || [];
      common_vendor.index.__f__("log", "at api/futureLetter.js:97", `📊 情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:101", `📊 情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/futureLetter.js:104", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:108", "❌ [未来情书API] 获取未来情书列表失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:109", "🔴 错误信息:", error);
    throw error;
  });
}
function getSentLetters() {
  const url = utils_config.config.API.FUTURE_LETTER.SENT;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:127", "🔗 [未来情书API] 开始获取已发送情书列表");
  common_vendor.index.__f__("log", "at api/futureLetter.js:128", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:129", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/futureLetter.js:130", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:133", "✅ [未来情书API] 获取已发送情书列表成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:134", "📦 响应数据:", response);
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : response.data.letters || [];
      common_vendor.index.__f__("log", "at api/futureLetter.js:138", `📊 已发送情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:142", `📊 已发送情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/futureLetter.js:145", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:149", "❌ [未来情书API] 获取已发送情书列表失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:150", "🔴 错误信息:", error);
    throw error;
  });
}
function getReceivedLetters() {
  const url = utils_config.config.API.FUTURE_LETTER.RECEIVED;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:168", "🔗 [未来情书API] 开始获取收到情书列表");
  common_vendor.index.__f__("log", "at api/futureLetter.js:169", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:170", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/futureLetter.js:171", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:174", "✅ [未来情书API] 获取收到情书列表成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:175", "📦 响应数据:", response);
    if (response && response.data) {
      const letters = Array.isArray(response.data) ? response.data : response.data.letters || [];
      common_vendor.index.__f__("log", "at api/futureLetter.js:179", `📊 收到情书数量: ${letters.length}`);
      return response;
    } else if (Array.isArray(response)) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:183", `📊 收到情书数量: ${response.length}`);
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/futureLetter.js:186", "⚠️ 响应数据格式异常:", response);
      return { success: true, data: [] };
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:190", "❌ [未来情书API] 获取收到情书列表失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:191", "🔴 错误信息:", error);
    throw error;
  });
}
function getFutureLetterDetail(letterId) {
  const url = `${utils_config.config.API.FUTURE_LETTER.DETAIL}/${letterId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:251", "🔗 [未来情书API] 开始获取情书详情");
  common_vendor.index.__f__("log", "at api/futureLetter.js:252", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:253", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/futureLetter.js:254", "📝 情书ID:", letterId);
  common_vendor.index.__f__("log", "at api/futureLetter.js:255", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:258", "✅ [未来情书API] 获取情书详情成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:259", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:262", `📝 情书标题: ${response.data.title || "未知"}`);
      return response;
    } else if (response && (response.id || response.letterId)) {
      return { success: true, data: response };
    } else {
      common_vendor.index.__f__("warn", "at api/futureLetter.js:268", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:272", "❌ [未来情书API] 获取情书详情失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:273", "🔴 错误信息:", error);
    throw error;
  });
}
function sendFutureLetter(letterId) {
  const url = `${utils_config.config.API.FUTURE_LETTER.SEND}/${letterId}/send`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:325", "🔗 [未来情书API] 开始发送未来情书");
  common_vendor.index.__f__("log", "at api/futureLetter.js:326", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:327", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/futureLetter.js:328", "📝 情书ID:", letterId);
  common_vendor.index.__f__("log", "at api/futureLetter.js:329", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, {}).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:332", "✅ [未来情书API] 发送未来情书成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:333", "📦 响应数据:", response);
    if (response && response.data) {
      common_vendor.index.__f__("log", "at api/futureLetter.js:336", `📝 情书状态: ${response.data.status || "未知"}`);
      if (response.data.sentAt) {
        common_vendor.index.__f__("log", "at api/futureLetter.js:338", `📝 发送时间: ${response.data.sentAt}`);
      }
      return response;
    } else {
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:345", "❌ [未来情书API] 发送未来情书失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:346", "🔴 错误信息:", error);
    throw error;
  });
}
function deleteFutureLetter(letterId) {
  const url = `${utils_config.config.API.FUTURE_LETTER.DELETE}/${letterId}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/futureLetter.js:365", "🔗 [未来情书API] 开始删除未来情书");
  common_vendor.index.__f__("log", "at api/futureLetter.js:366", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/futureLetter.js:367", "📋 请求方法: DELETE");
  common_vendor.index.__f__("log", "at api/futureLetter.js:368", "📝 情书ID:", letterId);
  common_vendor.index.__f__("log", "at api/futureLetter.js:369", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.delete(url).then((response) => {
    common_vendor.index.__f__("log", "at api/futureLetter.js:372", "✅ [未来情书API] 删除未来情书成功");
    common_vendor.index.__f__("log", "at api/futureLetter.js:373", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/futureLetter.js:376", "❌ [未来情书API] 删除未来情书失败");
    common_vendor.index.__f__("error", "at api/futureLetter.js:377", "🔴 错误信息:", error);
    throw error;
  });
}
exports.createFutureLetter = createFutureLetter;
exports.deleteFutureLetter = deleteFutureLetter;
exports.getFutureLetterDetail = getFutureLetterDetail;
exports.getFutureLetterList = getFutureLetterList;
exports.getReceivedLetters = getReceivedLetters;
exports.getSentLetters = getSentLetters;
exports.sendFutureLetter = sendFutureLetter;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/futureLetter.js.map
