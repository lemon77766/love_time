"use strict";
const common_vendor = require("../common/vendor.js");
const utils_config = require("./config.js");
class Http {
  /**
   * 发送HTTP请求
   * @param {Object} options - 请求配置
   * @returns {Promise} 返回Promise对象
   */
  request(options = {}) {
    return new Promise((resolve, reject) => {
      const loginInfo = common_vendor.index.getStorageSync("login_info") || {};
      const url = utils_config.config.baseURL + options.url;
      common_vendor.index.__f__("log", "at utils/http.js:22", `
=== HTTP ${options.method || "GET"} 请求 ===`);
      common_vendor.index.__f__("log", "at utils/http.js:23", "请求URL:", url);
      common_vendor.index.__f__("log", "at utils/http.js:24", "请求数据:", options.data);
      const requestOptions = {
        url,
        method: options.method || "GET",
        data: options.data || {},
        header: {
          "content-type": "application/json",
          // 如果已登录，携带token
          "Authorization": loginInfo.token ? `Bearer ${loginInfo.token}` : "",
          ...options.header
        },
        timeout: options.timeout || utils_config.config.timeout,
        success: (res) => {
          common_vendor.index.__f__("log", "at utils/http.js:39", "✅ 请求成功，响应状态码:", res.statusCode);
          common_vendor.index.__f__("log", "at utils/http.js:40", "响应数据:", res.data);
          if (res.statusCode === 200) {
            if (res.data.success) {
              common_vendor.index.__f__("log", "at utils/http.js:46", "✅ 业务请求成功，返回数据:", res.data.data);
              resolve(res.data.data);
            } else {
              common_vendor.index.__f__("error", "at utils/http.js:49", "❌ 业务错误:", res.data.message);
              reject(new Error(res.data.message || "请求失败"));
            }
          } else if (res.statusCode === 401) {
            common_vendor.index.__f__("error", "at utils/http.js:54", "❌ 401 未授权");
            this.handleUnauthorized();
            reject(new Error("登录已过期，请重新登录"));
          } else {
            common_vendor.index.__f__("error", "at utils/http.js:58", "❌ HTTP错误:", res.statusCode);
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/http.js:63", "❌ 请求失败:", url);
          common_vendor.index.__f__("error", "at utils/http.js:64", "错误详情:", err);
          {
            common_vendor.index.__f__("warn", "at utils/http.js:68", "⚠️ 开发模式：后端接口未就绪或网络错误");
            common_vendor.index.__f__("warn", "at utils/http.js:69", "⚠️ 请检查：");
            common_vendor.index.__f__("warn", "at utils/http.js:70", "  1. 后端服务是否已启动");
            common_vendor.index.__f__("warn", "at utils/http.js:71", "  2. 请求地址是否正确");
            common_vendor.index.__f__("warn", "at utils/http.js:72", "  3. 网络是否连通");
          }
          reject(err);
        }
      };
      common_vendor.index.request(requestOptions);
    });
  }
  /**
   * GET 请求
   */
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "GET",
      data,
      ...options
    });
  }
  /**
   * POST 请求
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "POST",
      data,
      ...options
    });
  }
  /**
   * PUT 请求
   */
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "PUT",
      data,
      ...options
    });
  }
  /**
   * DELETE 请求
   */
  delete(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "DELETE",
      data,
      ...options
    });
  }
  /**
   * 处理未授权（401）
   */
  handleUnauthorized() {
    common_vendor.index.removeStorageSync("login_info");
    common_vendor.index.showToast({
      title: "登录已过期",
      icon: "none",
      duration: 2e3
    });
    setTimeout(() => {
      common_vendor.index.reLaunch({
        url: "/pages/login/index"
      });
    }, 2e3);
  }
}
const http = new Http();
exports.http = http;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/http.js.map
