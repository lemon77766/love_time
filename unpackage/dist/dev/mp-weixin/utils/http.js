"use strict";
const common_vendor = require("../common/vendor.js");
const utils_config = require("./config.js");
const utils_auth = require("./auth.js");
const defaultOptions = {
  timeout: utils_config.config.timeout,
  retryCount: 0,
  // 默认不重试
  retryDelay: 1e3
  // 重试间隔1秒
};
function normalizeTokenCandidate(candidate) {
  if (typeof candidate !== "string") {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
    return null;
  }
  return trimmed;
}
function resolveTokenFromLoginInfo(loginInfo) {
  var _a, _b;
  if (!loginInfo || typeof loginInfo !== "object") {
    return null;
  }
  const candidates = [
    loginInfo.token,
    (_a = loginInfo.data) == null ? void 0 : _a.token,
    loginInfo.accessToken,
    loginInfo.authToken,
    loginInfo.code,
    (_b = loginInfo.data) == null ? void 0 : _b.code,
    loginInfo.rawToken
  ];
  for (const candidate of candidates) {
    const normalized = normalizeTokenCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}
let hasClearedInvalidLogin = false;
function handleRequestError(error, options = {}) {
  common_vendor.index.__f__("error", "at utils/http.js:53", "请求错误:", error);
  {
    common_vendor.index.__f__("warn", "at utils/http.js:57", "⚠️ 开发模式：后端接口未就绪或网络错误");
    common_vendor.index.__f__("warn", "at utils/http.js:58", "⚠️ 请检查：");
    common_vendor.index.__f__("warn", "at utils/http.js:59", "  1. 后端服务是否已启动");
    common_vendor.index.__f__("warn", "at utils/http.js:60", "  2. 请求地址是否正确");
    common_vendor.index.__f__("warn", "at utils/http.js:61", "  3. 网络是否连通");
  }
  if (error.statusCode === 401) {
    const urlForCheck = (options.url || "").toString();
    const isLoginApi = urlForCheck.includes("/api/login/") && !urlForCheck.includes("/api/login/logout");
    if (!isLoginApi) {
      handleUnauthorized();
      return;
    } else {
      common_vendor.index.__f__("error", "at utils/http.js:77", "❌ [登录接口] 返回401错误，可能是后端配置问题");
    }
  }
  if (error.errMsg && error.errMsg.includes("timeout")) {
    if (options.retryCount > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          common_vendor.index.__f__("log", "at utils/http.js:86", `请求超时，${options.retryDelay / 1e3}秒后重试，剩余重试次数：${options.retryCount - 1}`);
          options.retryCount--;
          request(options).then(resolve).catch(reject);
        }, options.retryDelay);
      });
    }
  }
  return Promise.reject(error);
}
function handleUnauthorized(customMessage) {
  if (utils_auth.isLoggedIn()) {
    const message = customMessage || "登录已过期，请重新登录";
    common_vendor.index.showToast({
      title: message,
      icon: "none",
      duration: 2e3
    });
    setTimeout(() => {
      utils_auth.logout(true);
    }, 500);
  } else {
    common_vendor.index.reLaunch({
      url: "/pages/login/index"
    });
  }
}
function request(options) {
  var _a;
  options = { ...defaultOptions, ...options };
  const originalUrl = options.url;
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const isLoginApi = options.url.includes("/api/login/") && !options.url.includes("/api/login/logout");
  options.url.includes("/api/challenge/");
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  let token = resolveTokenFromLoginInfo(loginInfo);
  if (token && loginInfo && !loginInfo.token) {
    loginInfo.token = token;
    try {
      common_vendor.index.setStorageSync("login_info", loginInfo);
    } catch (storageError) {
      common_vendor.index.__f__("warn", "at utils/http.js:144", "⚠️ 写回标准token字段失败:", storageError);
    }
  }
  if (!isLoginApi) {
    if (!token) {
      common_vendor.index.__f__("warn", "at utils/http.js:151", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:152", "⚠️ [Token诊断] Token未找到，请求可能失败");
      common_vendor.index.__f__("warn", "at utils/http.js:153", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:154", "📦 完整登录信息结构:");
      common_vendor.index.__f__("warn", "at utils/http.js:155", JSON.stringify(loginInfo, null, 2));
      common_vendor.index.__f__("warn", "at utils/http.js:156", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:157", "🔍 登录信息字段检查:");
      if (loginInfo) {
        common_vendor.index.__f__("warn", "at utils/http.js:159", `   - isLoggedIn: ${loginInfo.isLoggedIn !== void 0 ? loginInfo.isLoggedIn : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:160", `   - token: ${loginInfo.token !== void 0 ? loginInfo.token ? `✅ 存在，长度: ${loginInfo.token.length}` : "❌ 为空" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:161", `   - data?.token: ${((_a = loginInfo.data) == null ? void 0 : _a.token) !== void 0 ? loginInfo.data.token ? `✅ 存在，长度: ${loginInfo.data.token.length}` : "❌ 为空" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:162", `   - accessToken: ${loginInfo.accessToken !== void 0 ? loginInfo.accessToken ? `✅ 存在，长度: ${loginInfo.accessToken.length}` : "❌ 为空" : "❌ 不存在"}`);
        if (loginInfo.code !== void 0) {
          if (typeof loginInfo.code === "string") {
            common_vendor.index.__f__("warn", "at utils/http.js:165", `   - code: ${loginInfo.code ? `✅ 字符串，长度: ${loginInfo.code.length}` : "❌ 为空字符串"}`);
          } else {
            common_vendor.index.__f__("warn", "at utils/http.js:167", `   - code: ℹ️ 类型: ${typeof loginInfo.code}, 值: ${loginInfo.code}`);
          }
        } else {
          common_vendor.index.__f__("warn", "at utils/http.js:170", "   - code: ❌ 不存在");
        }
        common_vendor.index.__f__("warn", "at utils/http.js:172", `   - userInfo: ${loginInfo.userInfo !== void 0 ? "✅ 存在" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:173", `   - loginTime: ${loginInfo.loginTime !== void 0 ? `✅ 存在: ${loginInfo.loginTime}` : "❌ 不存在"}`);
      }
      common_vendor.index.__f__("warn", "at utils/http.js:175", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      if (loginInfo == null ? void 0 : loginInfo.isGuest) {
        common_vendor.index.__f__("warn", "at utils/http.js:178", "⚠️ 检测到游客登录，游客登录不支持需要认证的API");
      } else if (loginInfo && loginInfo.isLoggedIn) {
        common_vendor.index.__f__("warn", "at utils/http.js:180", "⚠️ 登录状态为true，但token缺失。可能的原因：");
        common_vendor.index.__f__("warn", "at utils/http.js:181", "   1. 之前的登录代码没有正确保存token");
        common_vendor.index.__f__("warn", "at utils/http.js:182", "   2. 登录信息被部分覆盖或损坏");
        common_vendor.index.__f__("warn", "at utils/http.js:183", "   3. 后端返回的数据结构不符合预期");
        common_vendor.index.__f__("warn", "at utils/http.js:184", "💡 建议：清除登录信息并重新登录");
        if (!hasClearedInvalidLogin && !token) {
          common_vendor.index.__f__("warn", "at utils/http.js:189", "🔧 [自动修复] 检测到无效的登录信息，正在清除...");
          common_vendor.index.removeStorageSync("login_info");
          hasClearedInvalidLogin = true;
          common_vendor.index.__f__("warn", "at utils/http.js:192", "✅ [自动修复] 已清除无效的登录信息");
          common_vendor.index.__f__("warn", "at utils/http.js:193", "💡 请重新登录以获取有效的token");
          common_vendor.index.showToast({
            title: "登录信息已过期，请重新登录",
            icon: "none",
            duration: 3e3
          });
        } else if (hasClearedInvalidLogin) {
          common_vendor.index.__f__("warn", "at utils/http.js:202", "💡 已清除过无效登录信息，请重新登录");
        }
      } else {
        common_vendor.index.__f__("warn", "at utils/http.js:205", "⚠️ 未找到登录信息，请先登录");
      }
      common_vendor.index.__f__("warn", "at utils/http.js:207", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      common_vendor.index.__f__("log", "at utils/http.js:209", "✅ Token已找到，长度:", token.length);
    }
  }
  if (token) {
    options.header = {
      ...options.header,
      "Authorization": `Bearer ${token}`
    };
  } else if (!isLoginApi) {
    {
      common_vendor.index.__f__("warn", "at utils/http.js:221", "⚠️ 请求未携带Authorization头，可能导致401错误");
      common_vendor.index.__f__("warn", "at utils/http.js:222", "⚠️ 当前请求URL:", options.url);
    }
  }
  let isDev = false;
  try {
    isDev = true;
  } catch (e) {
    isDev = true;
  }
  const urlForCheck = options.url || originalUrl || "";
  const isHeartWallApi = urlForCheck.includes("/api/heart-wall/") || urlForCheck.includes("heart-wall") || urlForCheck.includes("heartwall") || urlForCheck.toLowerCase().includes("heart_wall");
  if (isDev || isHeartWallApi) {
    let apiType = "通用API";
    if (urlForCheck.includes("/api/challenge/")) {
      apiType = "一百件事API";
    } else if (urlForCheck.includes("/api/couple/")) {
      apiType = "情侣绑定API";
    } else if (isHeartWallApi) {
      apiType = "心形墙API";
    } else if (urlForCheck.includes("/api/qna/")) {
      apiType = "问答API";
    } else if (urlForCheck.includes("/api/login/")) {
      apiType = "登录API";
    } else if (urlForCheck.includes("/api/user/")) {
      apiType = "用户API";
    } else if (urlForCheck.includes("/api/letter/")) {
      apiType = "情书API";
    }
    common_vendor.index.__f__("log", "at utils/http.js:264", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:265", "🔗 [HTTP请求]", apiType);
    common_vendor.index.__f__("log", "at utils/http.js:266", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:267", "📍 [URL]", options.url);
    common_vendor.index.__f__("log", "at utils/http.js:268", "📋 [方法]", options.method || "GET");
    if (options.data) {
      common_vendor.index.__f__("log", "at utils/http.js:270", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
    }
    if (token) {
      common_vendor.index.__f__("log", "at utils/http.js:273", "🔑 [认证] Token已携带 (长度:", token.length, ")");
    } else {
      if (!isLoginApi) {
        common_vendor.index.__f__("warn", "at utils/http.js:276", "⚠️ [认证] Token未携带，请求可能失败");
      } else {
        common_vendor.index.__f__("log", "at utils/http.js:278", "ℹ️ [认证] 登录接口，无需Token");
      }
    }
    if (options.header) {
      common_vendor.index.__f__("log", "at utils/http.js:282", "📋 [请求头]", Object.keys(options.header).join(", "));
    }
    common_vendor.index.__f__("log", "at utils/http.js:284", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
    common_vendor.index.__f__("log", "at utils/http.js:285", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let isDev2 = false;
          try {
            isDev2 = true;
          } catch (e) {
            isDev2 = true;
          }
          const urlForCheck2 = options.url || "";
          const isHeartWallApi2 = urlForCheck2.includes("/api/heart-wall/") || urlForCheck2.includes("heart-wall") || urlForCheck2.includes("heartwall") || urlForCheck2.toLowerCase().includes("heart_wall");
          if (isDev2 || isHeartWallApi2) {
            let apiType = "通用API";
            if (urlForCheck2.includes("/api/challenge/")) {
              apiType = "一百件事API";
            } else if (urlForCheck2.includes("/api/couple/")) {
              apiType = "情侣绑定API";
            } else if (isHeartWallApi2) {
              apiType = "心形墙API";
            } else if (urlForCheck2.includes("/api/qna/")) {
              apiType = "问答API";
            } else if (urlForCheck2.includes("/api/login/")) {
              apiType = "登录API";
            } else if (urlForCheck2.includes("/api/user/")) {
              apiType = "用户API";
            } else if (urlForCheck2.includes("/api/letter/")) {
              apiType = "情书API";
            }
            common_vendor.index.__f__("log", "at utils/http.js:329", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:330", "✅ [HTTP响应]", apiType, "请求成功");
            common_vendor.index.__f__("log", "at utils/http.js:331", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:332", "📍 [URL]", options.url);
            common_vendor.index.__f__("log", "at utils/http.js:333", "📊 [状态码]", res.statusCode);
            common_vendor.index.__f__("log", "at utils/http.js:334", "📦 [响应数据]", JSON.stringify(res.data, null, 2));
            if (res.data && typeof res.data === "object") {
              if (res.data.tasks && Array.isArray(res.data.tasks)) {
                common_vendor.index.__f__("log", "at utils/http.js:339", "📊 [数据统计] 任务数量:", res.data.tasks.length);
              }
              if (res.data.projects && Array.isArray(res.data.projects)) {
                common_vendor.index.__f__("log", "at utils/http.js:342", "📊 [数据统计] 项目数量:", res.data.projects.length);
              }
              if (res.data.photos && Array.isArray(res.data.photos)) {
                common_vendor.index.__f__("log", "at utils/http.js:345", "📊 [数据统计] 照片数量:", res.data.photos.length);
              }
              if (res.data.questions && Array.isArray(res.data.questions)) {
                common_vendor.index.__f__("log", "at utils/http.js:348", "📊 [数据统计] 问题数量:", res.data.questions.length);
              }
              if (res.data.success !== void 0) {
                common_vendor.index.__f__("log", "at utils/http.js:351", "✅ [业务状态]", res.data.success ? "成功" : "失败");
              }
              if (res.data.message) {
                common_vendor.index.__f__("log", "at utils/http.js:354", "💬 [消息]", res.data.message);
              }
            }
            common_vendor.index.__f__("log", "at utils/http.js:358", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
            common_vendor.index.__f__("log", "at utils/http.js:359", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          if (res.data && typeof res.data === "object" && res.data.success === false) {
            const errorMessage = res.data.message || "请求失败";
            const error = new Error(errorMessage);
            error.statusCode = res.statusCode;
            error.data = res.data;
            const isTokenExpired = errorMessage.includes("未登录") || errorMessage.includes("token已过期") || errorMessage.includes("token过期") || errorMessage.includes("登录已过期") || errorMessage.includes("未授权") || errorMessage.includes("Unauthorized") || errorMessage.toLowerCase().includes("token expired") || errorMessage.toLowerCase().includes("not logged in");
            if (isTokenExpired) {
              handleUnauthorized(errorMessage);
            }
            reject(error);
            return;
          }
          resolve(res.data);
        } else {
          const urlForCheck2 = options.url || "";
          const isHeartWallApi2 = urlForCheck2.includes("/api/heart-wall/") || urlForCheck2.includes("heart-wall") || urlForCheck2.includes("heartwall") || urlForCheck2.toLowerCase().includes("heart_wall");
          let responseData = res.data;
          if (typeof responseData === "string") {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
            }
          }
          if (isHeartWallApi2 || true) {
            common_vendor.index.__f__("warn", "at utils/http.js:411", `⚠️ [HTTP响应] 状态码异常: ${res.statusCode}`);
            common_vendor.index.__f__("warn", "at utils/http.js:412", `⚠️ [响应数据]`, responseData);
            common_vendor.index.__f__("warn", "at utils/http.js:413", `⚠️ [响应数据类型]`, typeof responseData);
            if (responseData && typeof responseData === "object") {
              common_vendor.index.__f__("warn", "at utils/http.js:415", `⚠️ [success字段]`, responseData.success);
              common_vendor.index.__f__("warn", "at utils/http.js:416", `⚠️ [message字段]`, responseData.message);
              if (isHeartWallApi2 && responseData.photo) {
                common_vendor.index.__f__("warn", "at utils/http.js:419", `⚠️ [photo字段存在]`, !!responseData.photo);
              }
            }
          }
          let isSuccess = false;
          if (responseData && typeof responseData === "object") {
            if (responseData.success === true) {
              isSuccess = true;
            } else if (responseData.data && typeof responseData.data === "object" && responseData.data.success === true) {
              isSuccess = true;
              responseData = responseData.data;
            } else if (isHeartWallApi2 && responseData.photo && typeof responseData.photo === "object") {
              isSuccess = true;
            }
          }
          if (isSuccess) {
            common_vendor.index.__f__("warn", "at utils/http.js:444", `⚠️ [HTTP响应] 后端返回状态码 ${res.statusCode}，但业务逻辑成功 (success: true)`);
            common_vendor.index.__f__("warn", "at utils/http.js:445", "⚠️ 建议后端修改：成功时应该返回 200 状态码");
            resolve(responseData);
            return;
          }
          if (isHeartWallApi2 || true) {
            common_vendor.index.__f__("error", "at utils/http.js:453", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at utils/http.js:454", `❌ [HTTP响应] 状态码 ${res.statusCode} 且业务逻辑失败`);
            common_vendor.index.__f__("error", "at utils/http.js:455", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at utils/http.js:456", "📍 [请求URL]", options.url);
            common_vendor.index.__f__("error", "at utils/http.js:457", "📋 [请求方法]", options.method || "GET");
            if (options.data) {
              common_vendor.index.__f__("error", "at utils/http.js:459", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
            }
            if (options.header) {
              common_vendor.index.__f__("error", "at utils/http.js:462", "📋 [请求头]", JSON.stringify(options.header, null, 2));
            }
            common_vendor.index.__f__("error", "at utils/http.js:464", "📊 [响应状态码]", res.statusCode);
            common_vendor.index.__f__("error", "at utils/http.js:465", "📦 [完整响应对象]", JSON.stringify(res, null, 2));
            if (!responseData || typeof responseData !== "object") {
              common_vendor.index.__f__("error", "at utils/http.js:467", `❌ [响应数据] 不是对象，类型: ${typeof responseData}，值:`, responseData);
            } else {
              common_vendor.index.__f__("error", "at utils/http.js:469", `❌ [success字段]`, responseData.success);
              common_vendor.index.__f__("error", "at utils/http.js:470", `❌ [message字段]`, responseData.message);
              common_vendor.index.__f__("error", "at utils/http.js:471", `❌ [完整响应数据]`, JSON.stringify(responseData, null, 2));
              common_vendor.index.__f__("error", "at utils/http.js:473", `❌ [响应数据字段列表]`, Object.keys(responseData).join(", "));
              if (isHeartWallApi2) {
                common_vendor.index.__f__("error", "at utils/http.js:475", `❌ [photo字段]`, responseData.photo ? "存在" : "不存在");
              }
            }
            common_vendor.index.__f__("error", "at utils/http.js:478", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
            common_vendor.index.__f__("error", "at utils/http.js:479", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          const errorMessage = responseData && typeof responseData === "object" && responseData.message ? responseData.message : `请求失败，状态码: ${res.statusCode}`;
          const error = new Error(errorMessage);
          error.statusCode = res.statusCode;
          error.data = responseData || res.data;
          if (responseData && typeof responseData === "object") {
            error.responseData = responseData;
          }
          if (res.statusCode === 401) {
            const urlForCheck3 = options.url || "";
            const isLoginApi2 = urlForCheck3.includes("/api/login/") && !urlForCheck3.includes("/api/login/logout");
            if (isLoginApi2) {
              common_vendor.index.__f__("error", "at utils/http.js:507", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("error", "at utils/http.js:508", "❌ [严重错误] 登录接口返回401错误！");
              common_vendor.index.__f__("error", "at utils/http.js:509", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("error", "at utils/http.js:510", "⚠️ 可能原因：");
              common_vendor.index.__f__("error", "at utils/http.js:511", "   1. 后端配置错误：登录接口被错误地配置为需要认证");
              common_vendor.index.__f__("error", "at utils/http.js:512", "   2. 后端Spring Security配置问题：/api/login/** 路径未正确放行");
              common_vendor.index.__f__("error", "at utils/http.js:513", "   3. 请求参数错误：code、nickName或avatarUrl缺失或格式错误");
              common_vendor.index.__f__("error", "at utils/http.js:514", "   4. 后端服务异常：认证拦截器误拦截了登录接口");
              common_vendor.index.__f__("error", "at utils/http.js:515", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("error", "at utils/http.js:516", "📍 [请求URL]", options.url);
              common_vendor.index.__f__("error", "at utils/http.js:517", "📋 [请求方法]", options.method || "POST");
              if (options.data) {
                common_vendor.index.__f__("error", "at utils/http.js:519", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
              }
              common_vendor.index.__f__("error", "at utils/http.js:521", "📦 [响应数据]", JSON.stringify(responseData, null, 2));
              common_vendor.index.__f__("error", "at utils/http.js:522", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("error", "at utils/http.js:523", "💡 解决方案：");
              common_vendor.index.__f__("error", "at utils/http.js:524", "   1. 检查后端Spring Security配置，确保 /api/login/** 路径已放行");
              common_vendor.index.__f__("error", "at utils/http.js:525", "   2. 检查后端认证拦截器，确保登录接口不在拦截范围内");
              common_vendor.index.__f__("error", "at utils/http.js:526", "   3. 检查请求参数是否完整且格式正确");
              common_vendor.index.__f__("error", "at utils/http.js:527", "   4. 联系后端开发人员检查后端日志");
              common_vendor.index.__f__("error", "at utils/http.js:528", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.showToast({
                title: "登录失败：后端配置错误",
                icon: "none",
                duration: 3e3
              });
            } else {
              handleUnauthorized();
            }
          }
          if (res.statusCode === 404 && errorMessage && errorMessage.includes("用户不存在")) {
            const isLocationApi = options.url.includes("/api/trajectory/location/");
            const isChallengeApi2 = options.url.includes("/api/challenge/");
            if (isLocationApi) {
              common_vendor.index.__f__("warn", "at utils/http.js:551", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:552", '⚠️ [HTTP响应] 检测到"用户不存在"错误（位置API）');
              common_vendor.index.__f__("warn", "at utils/http.js:553", "⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:554", "⚠️ 位置功能将无法使用，但不会影响页面其他功能");
              common_vendor.index.__f__("warn", "at utils/http.js:555", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else if (isChallengeApi2) {
              common_vendor.index.__f__("warn", "at utils/http.js:559", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:560", '⚠️ [HTTP响应] 检测到"用户不存在"错误（一百件事API）');
              common_vendor.index.__f__("warn", "at utils/http.js:561", "⚠️ 可能原因：");
              common_vendor.index.__f__("warn", "at utils/http.js:562", "   1. 接口不存在（后端未实现此接口）");
              common_vendor.index.__f__("warn", "at utils/http.js:563", "   2. 用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:564", "⚠️ 不会自动跳转登录，请检查接口是否已实现");
              common_vendor.index.__f__("warn", "at utils/http.js:565", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else {
              common_vendor.index.__f__("warn", "at utils/http.js:568", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:569", '⚠️ [HTTP响应] 检测到"用户不存在"错误');
              common_vendor.index.__f__("warn", "at utils/http.js:570", "⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:571", "⚠️ 将清除登录信息并跳转到登录页");
              common_vendor.index.__f__("warn", "at utils/http.js:572", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              handleUnauthorized("用户信息已失效，请重新登录");
            }
          }
          reject(error);
        }
      },
      fail: (error) => {
        let isDev2 = false;
        try {
          isDev2 = true;
        } catch (e) {
          isDev2 = true;
        }
        const urlForCheck2 = options.url || "";
        const isHeartWallApi2 = urlForCheck2.includes("/api/heart-wall/") || urlForCheck2.includes("heart-wall") || urlForCheck2.includes("heartwall") || urlForCheck2.toLowerCase().includes("heart_wall");
        if (isDev2 || isHeartWallApi2) {
          let apiType = "通用API";
          if (urlForCheck2.includes("/api/challenge/")) {
            apiType = "一百件事API";
          } else if (urlForCheck2.includes("/api/couple/")) {
            apiType = "情侣绑定API";
          } else if (isHeartWallApi2) {
            apiType = "心形墙API";
          } else if (urlForCheck2.includes("/api/qna/")) {
            apiType = "问答API";
          } else if (urlForCheck2.includes("/api/login/")) {
            apiType = "登录API";
          } else if (urlForCheck2.includes("/api/user/")) {
            apiType = "用户API";
          } else if (urlForCheck2.includes("/api/letter/")) {
            apiType = "情书API";
          }
          common_vendor.index.__f__("error", "at utils/http.js:617", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:618", "❌ [HTTP错误]", apiType, "请求失败");
          common_vendor.index.__f__("error", "at utils/http.js:619", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:620", "📍 [URL]", options.url);
          common_vendor.index.__f__("error", "at utils/http.js:621", "📋 [方法]", options.method || "GET");
          common_vendor.index.__f__("error", "at utils/http.js:622", "🔴 [错误详情]", error);
          common_vendor.index.__f__("error", "at utils/http.js:623", "📋 [错误消息]", error.errMsg || error.message || "未知错误");
          common_vendor.index.__f__("error", "at utils/http.js:624", "📊 [状态码]", error.statusCode || "无");
          if (error.errMsg) {
            if (error.errMsg.includes("timeout")) {
              common_vendor.index.__f__("error", "at utils/http.js:629", "⏱️ [错误类型] 请求超时");
            } else if (error.errMsg.includes("fail")) {
              common_vendor.index.__f__("error", "at utils/http.js:631", "🔌 [错误类型] 网络连接失败");
              common_vendor.index.__f__("error", "at utils/http.js:632", "💡 [提示] 请检查：");
              common_vendor.index.__f__("error", "at utils/http.js:633", "   1. 后端服务是否已启动");
              common_vendor.index.__f__("error", "at utils/http.js:634", "   2. 请求地址是否正确:", options.url);
              common_vendor.index.__f__("error", "at utils/http.js:635", "   3. 网络是否连通");
            } else if (error.errMsg.includes("404")) {
              common_vendor.index.__f__("error", "at utils/http.js:637", "🔍 [错误类型] 接口不存在 (404)");
            } else if (error.errMsg.includes("401")) {
              common_vendor.index.__f__("error", "at utils/http.js:639", "🔐 [错误类型] 未授权 (401)，可能是Token过期");
            }
          }
          common_vendor.index.__f__("error", "at utils/http.js:643", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
          common_vendor.index.__f__("error", "at utils/http.js:644", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
        handleRequestError(error, options).then(resolve).catch(reject);
      }
    });
  });
}
function upload(options) {
  options = {
    ...defaultOptions,
    timeout: utils_config.config.uploadTimeout,
    // 上传默认30秒超时
    header: {
      "content-type": "multipart/form-data"
    },
    ...options
  };
  if (!options.filePath) {
    return Promise.reject(new Error("未找到上传的文件：filePath 参数为空"));
  }
  const originalFilePath = options.filePath;
  common_vendor.index.__f__("log", "at utils/http.js:673", "📁 [上传] 原始文件路径:", originalFilePath);
  let validFilePath = originalFilePath;
  if (validFilePath && typeof validFilePath === "string") {
    if (validFilePath.startsWith("http://") || validFilePath.startsWith("https://")) {
      if (validFilePath.includes("://tmp/") || validFilePath.includes("://tmp_")) {
        const pathMatch = validFilePath.match(/:\/\/tmp[\/_](.+)$/);
        if (pathMatch) {
          pathMatch[1];
          common_vendor.index.__f__("warn", "at utils/http.js:691", "⚠️ [上传] 检测到临时文件URL格式，尝试直接使用:", validFilePath);
        }
      } else {
        common_vendor.index.__f__("warn", "at utils/http.js:696", "⚠️ [上传] 文件路径已经是URL格式，跳过上传:", validFilePath);
        return Promise.reject(new Error("文件路径已经是URL格式，无需上传"));
      }
    }
  }
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  const token = loginInfo == null ? void 0 : loginInfo.token;
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
  } else {
    common_vendor.index.__f__("warn", "at utils/http.js:715", "⚠️ 上传请求未携带Authorization头，可能导致401错误");
  }
  const uploadOptions = {
    ...options,
    filePath: validFilePath
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.__f__("log", "at utils/http.js:725", "📤 [上传] 开始上传文件，路径:", validFilePath);
    common_vendor.index.uploadFile({
      ...uploadOptions,
      success: (uploadRes) => {
        try {
          const result = JSON.parse(uploadRes.data);
          if (result.success) {
            common_vendor.index.__f__("log", "at utils/http.js:732", "✅ [上传] 文件上传成功");
            const normalizedData = result.data !== void 0 && result.data !== null ? result.data : result;
            resolve(normalizedData);
          } else {
            const errorMsg = result.message || "上传失败";
            common_vendor.index.__f__("error", "at utils/http.js:739", "❌ [上传] 服务器返回失败:", errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at utils/http.js:743", "❌ [上传] 解析响应失败:", e);
          reject(new Error("解析上传响应失败"));
        }
      },
      fail: (error) => {
        common_vendor.index.__f__("error", "at utils/http.js:748", "❌ [上传] 上传失败:", error);
        common_vendor.index.__f__("error", "at utils/http.js:749", "❌ [上传] 原始路径:", originalFilePath);
        common_vendor.index.__f__("error", "at utils/http.js:750", "❌ [上传] 使用路径:", validFilePath);
        if (error.errMsg && (error.errMsg.includes("未找到") || error.errMsg.includes("file not found") || error.errMsg.includes("no such file") || error.errMsg.includes("file doesn't exist"))) {
          if (validFilePath !== originalFilePath && originalFilePath) {
            common_vendor.index.__f__("warn", "at utils/http.js:756", "⚠️ [上传] 转换后的路径无效，尝试使用原始路径:", originalFilePath);
          }
          common_vendor.index.__f__("error", "at utils/http.js:759", "❌ [上传] 文件路径无效，无法找到文件");
          reject(new Error(`未找到上传的文件: ${validFilePath} (原始路径: ${originalFilePath})`));
        } else {
          handleRequestError(error, options).then(resolve).catch(reject);
        }
      }
    });
  });
}
const http = {
  request,
  upload,
  get: (url, data, options = {}) => request({ ...options, url, data, method: "GET" }),
  post: (url, data, options = {}) => request({ ...options, url, data, method: "POST" }),
  put: (url, data, options = {}) => request({ ...options, url, data, method: "PUT" }),
  delete: (url, data, options = {}) => request({ ...options, url, data, method: "DELETE" })
};
exports.http = http;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/http.js.map
