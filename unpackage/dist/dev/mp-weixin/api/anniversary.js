"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function getAnniversaryList() {
  const url = utils_config.config.API.ANNIVERSARY.LIST;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/anniversary.js:39", "🔗 [纪念日API] 开始获取纪念日列表");
  common_vendor.index.__f__("log", "at api/anniversary.js:40", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/anniversary.js:41", "📋 请求方法: GET");
  common_vendor.index.__f__("log", "at api/anniversary.js:42", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.get(url).then((response) => {
    var _a;
    common_vendor.index.__f__("log", "at api/anniversary.js:45", "✅ [纪念日API] 获取纪念日列表成功");
    common_vendor.index.__f__("log", "at api/anniversary.js:46", "📦 响应数据:", response);
    if (response && response.data) {
      const anniversaryData = response.data;
      common_vendor.index.__f__("log", "at api/anniversary.js:50", "📊 纪念日列表信息:");
      common_vendor.index.__f__("log", "at api/anniversary.js:51", `   - 纪念日数量: ${((_a = anniversaryData.anniversaryList) == null ? void 0 : _a.length) || 0}`);
      return response;
    } else if (response && Array.isArray(response)) {
      return { success: true, data: { anniversaryList: response } };
    } else {
      common_vendor.index.__f__("warn", "at api/anniversary.js:57", "⚠️ 响应数据格式异常:", response);
      return response;
    }
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/anniversary.js:61", "❌ [纪念日API] 获取纪念日列表失败");
    common_vendor.index.__f__("error", "at api/anniversary.js:62", "🔴 错误信息:", error);
    throw error;
  });
}
function addAnniversary(anniversaryData) {
  const url = utils_config.config.API.ANNIVERSARY.CREATE;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/anniversary.js:102", "🔗 [纪念日API] 开始添加纪念日");
  common_vendor.index.__f__("log", "at api/anniversary.js:103", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/anniversary.js:104", "📋 请求方法: POST");
  common_vendor.index.__f__("log", "at api/anniversary.js:105", "📥 请求参数:", anniversaryData);
  common_vendor.index.__f__("log", "at api/anniversary.js:106", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.post(url, anniversaryData).then((response) => {
    common_vendor.index.__f__("log", "at api/anniversary.js:109", "✅ [纪念日API] 添加纪念日成功");
    common_vendor.index.__f__("log", "at api/anniversary.js:110", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/anniversary.js:113", "❌ [纪念日API] 添加纪念日失败");
    common_vendor.index.__f__("error", "at api/anniversary.js:114", "🔴 错误信息:", error);
    throw error;
  });
}
function updateAnniversary(id, anniversaryData) {
  const url = `${utils_config.config.API.ANNIVERSARY.UPDATE}/${id}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/anniversary.js:155", "🔗 [纪念日API] 开始更新纪念日");
  common_vendor.index.__f__("log", "at api/anniversary.js:156", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/anniversary.js:157", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/anniversary.js:158", "📥 请求参数:", anniversaryData);
  common_vendor.index.__f__("log", "at api/anniversary.js:159", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, anniversaryData).then((response) => {
    common_vendor.index.__f__("log", "at api/anniversary.js:162", "✅ [纪念日API] 更新纪念日成功");
    common_vendor.index.__f__("log", "at api/anniversary.js:163", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/anniversary.js:166", "❌ [纪念日API] 更新纪念日失败");
    common_vendor.index.__f__("error", "at api/anniversary.js:167", "🔴 错误信息:", error);
    throw error;
  });
}
function deleteAnniversary(id) {
  const url = `${utils_config.config.API.ANNIVERSARY.DELETE}/${id}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/anniversary.js:191", "🔗 [纪念日API] 开始删除纪念日");
  common_vendor.index.__f__("log", "at api/anniversary.js:192", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/anniversary.js:193", "📋 请求方法: DELETE");
  common_vendor.index.__f__("log", "at api/anniversary.js:194", "🆔 纪念日ID:", id);
  common_vendor.index.__f__("log", "at api/anniversary.js:195", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.delete(url).then((response) => {
    common_vendor.index.__f__("log", "at api/anniversary.js:198", "✅ [纪念日API] 删除纪念日成功");
    common_vendor.index.__f__("log", "at api/anniversary.js:199", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/anniversary.js:202", "❌ [纪念日API] 删除纪念日失败");
    common_vendor.index.__f__("error", "at api/anniversary.js:203", "🔴 错误信息:", error);
    throw error;
  });
}
function toggleAnniversaryRemind(id, remind) {
  const url = `${utils_config.config.API.ANNIVERSARY.REMIND}/${id}`;
  const fullUrl = utils_config.config.baseURL + url;
  common_vendor.index.__f__("log", "at api/anniversary.js:232", "🔗 [纪念日API] 开始切换纪念日提醒状态");
  common_vendor.index.__f__("log", "at api/anniversary.js:233", "📍 请求地址:", fullUrl);
  common_vendor.index.__f__("log", "at api/anniversary.js:234", "📋 请求方法: PUT");
  common_vendor.index.__f__("log", "at api/anniversary.js:235", "📥 请求参数:", { remind });
  common_vendor.index.__f__("log", "at api/anniversary.js:236", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  return utils_http.http.put(url, { remind }).then((response) => {
    common_vendor.index.__f__("log", "at api/anniversary.js:239", "✅ [纪念日API] 切换纪念日提醒状态成功");
    common_vendor.index.__f__("log", "at api/anniversary.js:240", "📦 响应数据:", response);
    return response;
  }).catch((error) => {
    common_vendor.index.__f__("error", "at api/anniversary.js:243", "❌ [纪念日API] 切换纪念日提醒状态失败");
    common_vendor.index.__f__("error", "at api/anniversary.js:244", "🔴 错误信息:", error);
    throw error;
  });
}
exports.addAnniversary = addAnniversary;
exports.deleteAnniversary = deleteAnniversary;
exports.getAnniversaryList = getAnniversaryList;
exports.toggleAnniversaryRemind = toggleAnniversaryRemind;
exports.updateAnniversary = updateAnniversary;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/anniversary.js.map
