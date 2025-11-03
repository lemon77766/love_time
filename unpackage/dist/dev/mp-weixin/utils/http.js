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
function handleRequestError(error, options = {}) {
  common_vendor.index.__f__("error", "at utils/http.js:13", "请求错误:", error);
  {
    common_vendor.index.__f__("warn", "at utils/http.js:17", "⚠️ 开发模式：后端接口未就绪或网络错误");
    common_vendor.index.__f__("warn", "at utils/http.js:18", "⚠️ 请检查：");
    common_vendor.index.__f__("warn", "at utils/http.js:19", "  1. 后端服务是否已启动");
    common_vendor.index.__f__("warn", "at utils/http.js:20", "  2. 请求地址是否正确");
    common_vendor.index.__f__("warn", "at utils/http.js:21", "  3. 网络是否连通");
  }
  if (error.statusCode === 401) {
    handleUnauthorized();
    return;
  }
  if (error.errMsg && error.errMsg.includes("timeout")) {
    if (options.retryCount > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          common_vendor.index.__f__("log", "at utils/http.js:35", `请求超时，${options.retryDelay / 1e3}秒后重试，剩余重试次数：${options.retryCount - 1}`);
          options.retryCount--;
          request(options).then(resolve).catch(reject);
        }, options.retryDelay);
      });
    }
  }
  return Promise.reject(error);
}
function handleUnauthorized() {
  if (utils_auth.isLoggedIn()) {
    common_vendor.index.showToast({
      title: "登录已过期，请重新登录",
      icon: "none",
      duration: 2e3
    });
    utils_auth.logout();
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
  let token = null;
  if (loginInfo) {
    token = loginInfo.token || ((_a = loginInfo.data) == null ? void 0 : _a.token) || loginInfo.accessToken || null;
    if (token && typeof token === "string" && token.trim()) {
      token = token.trim();
    } else {
      token = null;
    }
  }
  if (!isLoginApi) {
    if (!token) {
      common_vendor.index.__f__("warn", "at utils/http.js:94", "⚠️ Token未找到，请求可能失败");
      common_vendor.index.__f__("warn", "at utils/http.js:95", "⚠️ 登录信息:", loginInfo);
      if (loginInfo == null ? void 0 : loginInfo.isGuest) {
        common_vendor.index.__f__("warn", "at utils/http.js:97", "⚠️ 检测到游客登录，游客登录不支持需要认证的API");
      } else if (loginInfo) {
        common_vendor.index.__f__("warn", "at utils/http.js:99", "⚠️ 登录信息存在，但token为空。可能的原因：");
        common_vendor.index.__f__("warn", "at utils/http.js:100", '   1. 后端返回的token字段名不是"token"');
        common_vendor.index.__f__("warn", "at utils/http.js:101", "   2. 后端返回的数据结构不符合预期");
        common_vendor.index.__f__("warn", "at utils/http.js:102", "   3. 登录时token提取失败");
      } else {
        common_vendor.index.__f__("warn", "at utils/http.js:104", "⚠️ 未找到登录信息，请先登录");
      }
    } else {
      common_vendor.index.__f__("log", "at utils/http.js:107", "✅ Token已找到，长度:", token.length);
    }
  }
  if (token) {
    options.header = {
      ...options.header,
      "Authorization": `Bearer ${token}`
    };
  } else if (!isLoginApi) {
    {
      common_vendor.index.__f__("warn", "at utils/http.js:119", "⚠️ 请求未携带Authorization头，可能导致401错误");
      common_vendor.index.__f__("warn", "at utils/http.js:120", "⚠️ 当前请求URL:", options.url);
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
    common_vendor.index.__f__("log", "at utils/http.js:162", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:163", "🔗 [HTTP请求]", apiType);
    common_vendor.index.__f__("log", "at utils/http.js:164", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:165", "📍 [URL]", options.url);
    common_vendor.index.__f__("log", "at utils/http.js:166", "📋 [方法]", options.method || "GET");
    if (options.data) {
      common_vendor.index.__f__("log", "at utils/http.js:168", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
    }
    if (token) {
      common_vendor.index.__f__("log", "at utils/http.js:171", "🔑 [认证] Token已携带 (长度:", token.length, ")");
    } else {
      if (!isLoginApi) {
        common_vendor.index.__f__("warn", "at utils/http.js:174", "⚠️ [认证] Token未携带，请求可能失败");
      } else {
        common_vendor.index.__f__("log", "at utils/http.js:176", "ℹ️ [认证] 登录接口，无需Token");
      }
    }
    if (options.header) {
      common_vendor.index.__f__("log", "at utils/http.js:180", "📋 [请求头]", Object.keys(options.header).join(", "));
    }
    common_vendor.index.__f__("log", "at utils/http.js:182", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
    common_vendor.index.__f__("log", "at utils/http.js:183", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
            common_vendor.index.__f__("log", "at utils/http.js:227", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:228", "✅ [HTTP响应]", apiType, "请求成功");
            common_vendor.index.__f__("log", "at utils/http.js:229", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:230", "📍 [URL]", options.url);
            common_vendor.index.__f__("log", "at utils/http.js:231", "📊 [状态码]", res.statusCode);
            common_vendor.index.__f__("log", "at utils/http.js:232", "📦 [响应数据]", JSON.stringify(res.data, null, 2));
            if (res.data && typeof res.data === "object") {
              if (res.data.tasks && Array.isArray(res.data.tasks)) {
                common_vendor.index.__f__("log", "at utils/http.js:237", "📊 [数据统计] 任务数量:", res.data.tasks.length);
              }
              if (res.data.projects && Array.isArray(res.data.projects)) {
                common_vendor.index.__f__("log", "at utils/http.js:240", "📊 [数据统计] 项目数量:", res.data.projects.length);
              }
              if (res.data.photos && Array.isArray(res.data.photos)) {
                common_vendor.index.__f__("log", "at utils/http.js:243", "📊 [数据统计] 照片数量:", res.data.photos.length);
              }
              if (res.data.questions && Array.isArray(res.data.questions)) {
                common_vendor.index.__f__("log", "at utils/http.js:246", "📊 [数据统计] 问题数量:", res.data.questions.length);
              }
              if (res.data.success !== void 0) {
                common_vendor.index.__f__("log", "at utils/http.js:249", "✅ [业务状态]", res.data.success ? "成功" : "失败");
              }
              if (res.data.message) {
                common_vendor.index.__f__("log", "at utils/http.js:252", "💬 [消息]", res.data.message);
              }
            }
            common_vendor.index.__f__("log", "at utils/http.js:256", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
            common_vendor.index.__f__("log", "at utils/http.js:257", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          if (res.data && typeof res.data === "object" && res.data.success === false) {
            const error = new Error(res.data.message || "请求失败");
            error.statusCode = res.statusCode;
            error.data = res.data;
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
            common_vendor.index.__f__("warn", "at utils/http.js:292", `⚠️ [HTTP响应] 状态码异常: ${res.statusCode}`);
            common_vendor.index.__f__("warn", "at utils/http.js:293", `⚠️ [响应数据]`, responseData);
            common_vendor.index.__f__("warn", "at utils/http.js:294", `⚠️ [响应数据类型]`, typeof responseData);
            if (responseData && typeof responseData === "object") {
              common_vendor.index.__f__("warn", "at utils/http.js:296", `⚠️ [success字段]`, responseData.success);
              common_vendor.index.__f__("warn", "at utils/http.js:297", `⚠️ [message字段]`, responseData.message);
              if (isHeartWallApi2 && responseData.photo) {
                common_vendor.index.__f__("warn", "at utils/http.js:300", `⚠️ [photo字段存在]`, !!responseData.photo);
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
            common_vendor.index.__f__("warn", "at utils/http.js:325", `⚠️ [HTTP响应] 后端返回状态码 ${res.statusCode}，但业务逻辑成功 (success: true)`);
            common_vendor.index.__f__("warn", "at utils/http.js:326", "⚠️ 建议后端修改：成功时应该返回 200 状态码");
            resolve(responseData);
            return;
          }
          if (isHeartWallApi2 || true) {
            common_vendor.index.__f__("error", "at utils/http.js:334", `❌ [HTTP响应] 状态码 ${res.statusCode} 且业务逻辑失败`);
            if (!responseData || typeof responseData !== "object") {
              common_vendor.index.__f__("error", "at utils/http.js:336", `❌ 响应数据不是对象:`, responseData);
            } else {
              common_vendor.index.__f__("error", "at utils/http.js:338", `❌ success字段:`, responseData.success);
              if (isHeartWallApi2) {
                common_vendor.index.__f__("error", "at utils/http.js:340", `❌ photo字段:`, responseData.photo ? "存在" : "不存在");
              }
            }
          }
          reject(res);
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
          common_vendor.index.__f__("error", "at utils/http.js:385", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:386", "❌ [HTTP错误]", apiType, "请求失败");
          common_vendor.index.__f__("error", "at utils/http.js:387", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:388", "📍 [URL]", options.url);
          common_vendor.index.__f__("error", "at utils/http.js:389", "📋 [方法]", options.method || "GET");
          common_vendor.index.__f__("error", "at utils/http.js:390", "🔴 [错误详情]", error);
          common_vendor.index.__f__("error", "at utils/http.js:391", "📋 [错误消息]", error.errMsg || error.message || "未知错误");
          common_vendor.index.__f__("error", "at utils/http.js:392", "📊 [状态码]", error.statusCode || "无");
          if (error.errMsg) {
            if (error.errMsg.includes("timeout")) {
              common_vendor.index.__f__("error", "at utils/http.js:397", "⏱️ [错误类型] 请求超时");
            } else if (error.errMsg.includes("fail")) {
              common_vendor.index.__f__("error", "at utils/http.js:399", "🔌 [错误类型] 网络连接失败");
              common_vendor.index.__f__("error", "at utils/http.js:400", "💡 [提示] 请检查：");
              common_vendor.index.__f__("error", "at utils/http.js:401", "   1. 后端服务是否已启动");
              common_vendor.index.__f__("error", "at utils/http.js:402", "   2. 请求地址是否正确:", options.url);
              common_vendor.index.__f__("error", "at utils/http.js:403", "   3. 网络是否连通");
            } else if (error.errMsg.includes("404")) {
              common_vendor.index.__f__("error", "at utils/http.js:405", "🔍 [错误类型] 接口不存在 (404)");
            } else if (error.errMsg.includes("401")) {
              common_vendor.index.__f__("error", "at utils/http.js:407", "🔐 [错误类型] 未授权 (401)，可能是Token过期");
            }
          }
          common_vendor.index.__f__("error", "at utils/http.js:411", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
          common_vendor.index.__f__("error", "at utils/http.js:412", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  const token = loginInfo == null ? void 0 : loginInfo.token;
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
  } else {
    common_vendor.index.__f__("warn", "at utils/http.js:446", "⚠️ 上传请求未携带Authorization头，可能导致401错误");
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      ...options,
      success: (uploadRes) => {
        try {
          const result = JSON.parse(uploadRes.data);
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.message || "上传失败"));
          }
        } catch (e) {
          reject(new Error("解析上传响应失败"));
        }
      },
      fail: (error) => {
        handleRequestError(error, options).then(resolve).catch(reject);
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
