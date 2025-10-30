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
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const token = (_a = common_vendor.index.getStorageSync("login_info")) == null ? void 0 : _a.token;
  if (token) {
    options.header = {
      ...options.header,
      "Authorization": `Bearer ${token}`
    };
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (error) => {
        handleRequestError(error, options).then(resolve).catch(reject);
      }
    });
  });
}
function upload(options) {
  var _a;
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
  const token = (_a = common_vendor.index.getStorageSync("login_info")) == null ? void 0 : _a.token;
  if (token) {
    options.header["Authorization"] = `Bearer ${token}`;
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
