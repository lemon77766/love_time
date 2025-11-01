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
  options.url;
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const isLoginApi = options.url.includes("/api/login/") && !options.url.includes("/api/login/logout");
  const isChallengeApi = options.url.includes("/api/challenge/");
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
  if (isChallengeApi) {
    common_vendor.index.__f__("log", "at utils/http.js:126", "🔗 [HTTP请求] 一百件事API");
    common_vendor.index.__f__("log", "at utils/http.js:127", "📍 完整URL:", options.url);
    common_vendor.index.__f__("log", "at utils/http.js:128", "📋 请求方法:", options.method || "GET");
    if (options.data) {
      common_vendor.index.__f__("log", "at utils/http.js:130", "📤 请求参数:", options.data);
    }
    if (token) {
      common_vendor.index.__f__("log", "at utils/http.js:133", "🔑 认证Token: 已携带");
    } else {
      common_vendor.index.__f__("warn", "at utils/http.js:135", "⚠️ 认证Token: 未携带，可能失败");
    }
    common_vendor.index.__f__("log", "at utils/http.js:137", "⏰ 请求时间:", (/* @__PURE__ */ new Date()).toLocaleString());
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          {
            if (isChallengeApi) {
              common_vendor.index.__f__("log", "at utils/http.js:148", "✅ [HTTP响应] 一百件事API请求成功");
              common_vendor.index.__f__("log", "at utils/http.js:149", "📍 响应URL:", options.url);
              common_vendor.index.__f__("log", "at utils/http.js:150", "📊 状态码:", res.statusCode);
              common_vendor.index.__f__("log", "at utils/http.js:151", "📦 响应数据:", res.data);
              common_vendor.index.__f__("log", "at utils/http.js:152", "⏰ 响应时间:", (/* @__PURE__ */ new Date()).toLocaleString());
            } else {
              common_vendor.index.__f__("log", "at utils/http.js:154", "📥 API响应:", {
                url: options.url,
                statusCode: res.statusCode,
                data: res.data
              });
            }
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
          reject(res);
        }
      },
      fail: (error) => {
        if (isChallengeApi) {
          common_vendor.index.__f__("error", "at utils/http.js:179", "❌ [HTTP错误] 一百件事API请求失败");
          common_vendor.index.__f__("error", "at utils/http.js:180", "📍 请求URL:", options.url);
          common_vendor.index.__f__("error", "at utils/http.js:181", "🔴 错误信息:", error);
          common_vendor.index.__f__("error", "at utils/http.js:182", "⏰ 错误时间:", (/* @__PURE__ */ new Date()).toLocaleString());
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
    common_vendor.index.__f__("warn", "at utils/http.js:216", "⚠️ 上传请求未携带Authorization头，可能导致401错误");
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
