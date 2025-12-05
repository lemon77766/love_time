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
  if (trimmed.startsWith("mock_code_") || trimmed.length < 20) {
    if (trimmed.startsWith("mock_code_")) {
      return null;
    }
    if (trimmed.length < 20 && /^[A-Za-z0-9]{6,32}$/.test(trimmed) && !trimmed.includes(".")) {
      return null;
    }
  }
  return trimmed;
}
function resolveTokenFromLoginInfo(loginInfo) {
  var _a;
  if (!loginInfo || typeof loginInfo !== "object") {
    return null;
  }
  const candidates = [
    loginInfo.token,
    // 标准token字段（最优先）
    (_a = loginInfo.data) == null ? void 0 : _a.token,
    // 嵌套的token字段
    loginInfo.accessToken,
    // 备用token字段
    loginInfo.authToken,
    // 备用token字段
    loginInfo.rawToken
    // 原始token字段
    // 注意：不再从 code 字段提取token，因为code是微信登录凭证，不是JWT token
    // loginInfo.code,          // ❌ 移除：这是微信登录code，不是JWT token
    // loginInfo.data?.code,    // ❌ 移除：这是微信登录code，不是JWT token
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
  common_vendor.index.__f__("error", "at utils/http.js:69", "请求错误:", error);
  {
    common_vendor.index.__f__("warn", "at utils/http.js:73", "⚠️ 开发模式：后端接口未就绪或网络错误");
    common_vendor.index.__f__("warn", "at utils/http.js:74", "⚠️ 请检查：");
    common_vendor.index.__f__("warn", "at utils/http.js:75", "  1. 后端服务是否已启动");
    common_vendor.index.__f__("warn", "at utils/http.js:76", "  2. 请求地址是否正确");
    common_vendor.index.__f__("warn", "at utils/http.js:77", "  3. 网络是否连通");
  }
  if (error.statusCode === 401) {
    const urlForCheck = (options.url || "").toString();
    const isLoginApi = urlForCheck.includes("/api/login/") && !urlForCheck.includes("/api/login/logout");
    if (!isLoginApi) {
      handleUnauthorized();
      return;
    } else {
      common_vendor.index.__f__("error", "at utils/http.js:93", "❌ [登录接口] 返回401错误，可能是后端配置问题");
    }
  }
  if (error.errMsg && error.errMsg.includes("timeout")) {
    if (options.retryCount > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          common_vendor.index.__f__("log", "at utils/http.js:102", `请求超时，${options.retryDelay / 1e3}秒后重试，剩余重试次数：${options.retryCount - 1}`);
          options.retryCount--;
          request(options).then(resolve).catch(reject);
        }, options.retryDelay);
      });
    }
  }
  return Promise.reject(error);
}
function handleUnauthorized(customMessage) {
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  const currentToken = resolveTokenFromLoginInfo(loginInfo);
  const isMockToken = currentToken && currentToken.startsWith("mock_token_");
  if (isMockToken) {
    common_vendor.index.__f__("log", "at utils/http.js:121", "🔄 检测到mock token失效，自动切换到游客模式");
    const guestUserInfo = {
      nickName: "游客用户",
      avatarUrl: "/static/zhuye/smile.png",
      displayName: "游客用户",
      isGuest: true
    };
    const guestLoginInfo = {
      isLoggedIn: false,
      userInfo: guestUserInfo,
      token: "",
      loginTime: (/* @__PURE__ */ new Date()).toISOString(),
      isGuest: true
    };
    common_vendor.index.setStorageSync("login_info", guestLoginInfo);
    common_vendor.index.showToast({
      title: "后端连接失败，已切换到游客模式",
      icon: "none",
      duration: 2e3
    });
    setTimeout(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.onLoad) {
        currentPage.onLoad();
      }
    }, 1e3);
    return;
  }
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
function handle401Diagnosis(res, options, responseData) {
  var _a, _b;
  const urlForCheck401 = options.url || "";
  const isLoginApi = urlForCheck401.includes("/api/login/") && !urlForCheck401.includes("/api/login/logout");
  common_vendor.index.__f__("error", "at utils/http.js:185", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("error", "at utils/http.js:186", "🔐 [401错误诊断] 认证失败");
  common_vendor.index.__f__("error", "at utils/http.js:187", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  common_vendor.index.__f__("error", "at utils/http.js:188", "📍 [请求URL]", options.url);
  common_vendor.index.__f__("error", "at utils/http.js:189", "📋 [请求方法]", options.method || "GET");
  common_vendor.index.__f__("error", "at utils/http.js:190", "📊 [HTTP状态码]", res.statusCode);
  common_vendor.index.__f__("error", "at utils/http.js:191", "📊 [业务状态码]", (responseData == null ? void 0 : responseData.code) || "无");
  common_vendor.index.__f__("error", "at utils/http.js:192", "📦 [响应数据]", JSON.stringify(responseData || res.data, null, 2));
  const authHeader = ((_a = options.header) == null ? void 0 : _a["Authorization"]) || ((_b = options.header) == null ? void 0 : _b["authorization"]);
  if (authHeader) {
    common_vendor.index.__f__("error", "at utils/http.js:197", "✅ [Token传递] Authorization头已发送");
    common_vendor.index.__f__("error", "at utils/http.js:198", "📋 [Authorization头长度]", authHeader.length, "字符");
    common_vendor.index.__f__("error", "at utils/http.js:199", "🔍 [Authorization头预览]", authHeader.substring(0, 50) + "...");
    common_vendor.index.__f__("error", "at utils/http.js:200", "💡 [可能原因] Token已过期或无效，需要重新登录");
  } else {
    common_vendor.index.__f__("error", "at utils/http.js:202", "❌ [Token传递] Authorization头未发送！");
    common_vendor.index.__f__("error", "at utils/http.js:203", "💡 [可能原因] Token未正确添加到请求头");
  }
  const currentLoginInfo = common_vendor.index.getStorageSync("login_info");
  if (currentLoginInfo) {
    const currentToken = resolveTokenFromLoginInfo(currentLoginInfo);
    if (currentToken) {
      common_vendor.index.__f__("error", "at utils/http.js:211", "📦 [本地Token] Token存在");
      common_vendor.index.__f__("error", "at utils/http.js:212", "📏 [Token长度]", currentToken.length, "字符");
      common_vendor.index.__f__("error", "at utils/http.js:213", "🔍 [Token预览]", currentToken.substring(0, 50) + "...");
      common_vendor.index.__f__("error", "at utils/http.js:214", "💡 [诊断] Token已传递但后端认为无效，可能原因：");
      common_vendor.index.__f__("error", "at utils/http.js:215", "   1. Token已过期（最常见）");
      common_vendor.index.__f__("error", "at utils/http.js:216", "   2. Token格式不正确");
      common_vendor.index.__f__("error", "at utils/http.js:217", "   3. 后端验证逻辑有问题");
      common_vendor.index.__f__("error", "at utils/http.js:218", "   4. 后端服务重启导致token失效");
    } else {
      common_vendor.index.__f__("error", "at utils/http.js:220", "❌ [本地Token] Token不存在或无法解析");
      common_vendor.index.__f__("error", "at utils/http.js:221", "💡 [诊断] 本地存储中没有有效的token");
    }
  } else {
    common_vendor.index.__f__("error", "at utils/http.js:224", "❌ [本地Token] 登录信息不存在");
    common_vendor.index.__f__("error", "at utils/http.js:225", "💡 [诊断] 本地存储中没有登录信息");
  }
  common_vendor.index.__f__("error", "at utils/http.js:228", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (isLoginApi) {
    common_vendor.index.__f__("error", "at utils/http.js:232", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at utils/http.js:233", "❌ [严重错误] 登录接口返回401错误！");
    common_vendor.index.__f__("error", "at utils/http.js:234", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at utils/http.js:235", "⚠️ 可能原因：");
    common_vendor.index.__f__("error", "at utils/http.js:236", "   1. 后端配置错误：登录接口被错误地配置为需要认证");
    common_vendor.index.__f__("error", "at utils/http.js:237", "   2. 后端Spring Security配置问题：/api/login/** 路径未正确放行");
    common_vendor.index.__f__("error", "at utils/http.js:238", "   3. 请求参数错误：code、nickName或avatarUrl缺失或格式错误");
    common_vendor.index.__f__("error", "at utils/http.js:239", "   4. 后端服务异常：认证拦截器误拦截了登录接口");
    common_vendor.index.__f__("error", "at utils/http.js:240", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at utils/http.js:241", "📍 [请求URL]", options.url);
    common_vendor.index.__f__("error", "at utils/http.js:242", "📋 [请求方法]", options.method || "POST");
    if (options.data) {
      common_vendor.index.__f__("error", "at utils/http.js:244", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
    }
    common_vendor.index.__f__("error", "at utils/http.js:246", "📦 [响应数据]", JSON.stringify(responseData || res.data, null, 2));
    common_vendor.index.__f__("error", "at utils/http.js:247", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("error", "at utils/http.js:248", "💡 解决方案：");
    common_vendor.index.__f__("error", "at utils/http.js:249", "   1. 检查后端Spring Security配置，确保 /api/login/** 路径已放行");
    common_vendor.index.__f__("error", "at utils/http.js:250", "   2. 检查后端认证拦截器，确保登录接口不在拦截范围内");
    common_vendor.index.__f__("error", "at utils/http.js:251", "   3. 检查请求参数是否完整且格式正确");
    common_vendor.index.__f__("error", "at utils/http.js:252", "   4. 联系后端开发人员检查后端日志");
    common_vendor.index.__f__("error", "at utils/http.js:253", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.showToast({
      title: "登录失败：后端配置错误",
      icon: "none",
      duration: 3e3
    });
  } else {
    handleUnauthorized();
  }
}
function request(options) {
  var _a, _b, _c;
  options = { ...defaultOptions, ...options };
  const originalUrl = options.url;
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const isLoginApi = options.url.includes("/api/login/") && !options.url.includes("/api/login/logout");
  options.url.includes("/api/challenge/");
  let isDev = false;
  try {
    isDev = true;
  } catch (e) {
    isDev = true;
  }
  const urlForCheck = options.url || originalUrl || "";
  const isHeartWallApi = urlForCheck.includes("/api/heart-wall/") || urlForCheck.includes("heart-wall") || urlForCheck.includes("heartwall") || urlForCheck.toLowerCase().includes("heart_wall");
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  let token = resolveTokenFromLoginInfo(loginInfo);
  if (token && loginInfo && !loginInfo.token) {
    loginInfo.token = token;
    try {
      common_vendor.index.setStorageSync("login_info", loginInfo);
    } catch (storageError) {
      common_vendor.index.__f__("warn", "at utils/http.js:312", "⚠️ 写回标准token字段失败:", storageError);
    }
  }
  if (!token && !isLoginApi && true) {
    common_vendor.index.__f__("warn", "at utils/http.js:318", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at utils/http.js:319", "⚠️ [Token诊断] 未找到有效token");
    common_vendor.index.__f__("warn", "at utils/http.js:320", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (loginInfo) {
      common_vendor.index.__f__("warn", "at utils/http.js:322", "📦 登录信息存在，但token字段缺失");
      common_vendor.index.__f__("warn", "at utils/http.js:323", "📦 loginInfo.token:", loginInfo.token || "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:324", "📦 loginInfo.data?.token:", ((_a = loginInfo.data) == null ? void 0 : _a.token) || "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:325", "📦 loginInfo.accessToken:", loginInfo.accessToken || "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:326", "📦 loginInfo.code:", loginInfo.code ? "⚠️ 存在（这是微信登录code，不是JWT token）" : "❌ 不存在");
    } else {
      common_vendor.index.__f__("warn", "at utils/http.js:328", "📦 登录信息不存在");
    }
    common_vendor.index.__f__("warn", "at utils/http.js:330", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
  if (!isLoginApi) {
    if (!token) {
      common_vendor.index.__f__("warn", "at utils/http.js:336", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:337", "⚠️ [Token诊断] Token未找到，请求可能失败");
      common_vendor.index.__f__("warn", "at utils/http.js:338", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:339", "📦 完整登录信息结构:");
      common_vendor.index.__f__("warn", "at utils/http.js:340", JSON.stringify(loginInfo, null, 2));
      common_vendor.index.__f__("warn", "at utils/http.js:341", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("warn", "at utils/http.js:342", "🔍 登录信息字段检查:");
      if (loginInfo) {
        common_vendor.index.__f__("warn", "at utils/http.js:344", `   - isLoggedIn: ${loginInfo.isLoggedIn !== void 0 ? loginInfo.isLoggedIn : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:345", `   - token: ${loginInfo.token !== void 0 ? loginInfo.token ? `✅ 存在，长度: ${loginInfo.token.length}` : "❌ 为空" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:346", `   - data?.token: ${((_b = loginInfo.data) == null ? void 0 : _b.token) !== void 0 ? loginInfo.data.token ? `✅ 存在，长度: ${loginInfo.data.token.length}` : "❌ 为空" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:347", `   - accessToken: ${loginInfo.accessToken !== void 0 ? loginInfo.accessToken ? `✅ 存在，长度: ${loginInfo.accessToken.length}` : "❌ 为空" : "❌ 不存在"}`);
        if (loginInfo.code !== void 0) {
          if (typeof loginInfo.code === "string") {
            common_vendor.index.__f__("warn", "at utils/http.js:350", `   - code: ${loginInfo.code ? `✅ 字符串，长度: ${loginInfo.code.length}` : "❌ 为空字符串"}`);
          } else {
            common_vendor.index.__f__("warn", "at utils/http.js:352", `   - code: ℹ️ 类型: ${typeof loginInfo.code}, 值: ${loginInfo.code}`);
          }
        } else {
          common_vendor.index.__f__("warn", "at utils/http.js:355", "   - code: ❌ 不存在");
        }
        common_vendor.index.__f__("warn", "at utils/http.js:357", `   - userInfo: ${loginInfo.userInfo !== void 0 ? "✅ 存在" : "❌ 不存在"}`);
        common_vendor.index.__f__("warn", "at utils/http.js:358", `   - loginTime: ${loginInfo.loginTime !== void 0 ? `✅ 存在: ${loginInfo.loginTime}` : "❌ 不存在"}`);
      }
      common_vendor.index.__f__("warn", "at utils/http.js:360", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      if (loginInfo == null ? void 0 : loginInfo.isGuest) {
        common_vendor.index.__f__("warn", "at utils/http.js:363", "⚠️ 检测到游客登录，游客登录不支持需要认证的API");
      } else if (loginInfo && loginInfo.isLoggedIn) {
        common_vendor.index.__f__("warn", "at utils/http.js:365", "⚠️ 登录状态为true，但token缺失。可能的原因：");
        common_vendor.index.__f__("warn", "at utils/http.js:366", "   1. 之前的登录代码没有正确保存token");
        common_vendor.index.__f__("warn", "at utils/http.js:367", "   2. 登录信息被部分覆盖或损坏");
        common_vendor.index.__f__("warn", "at utils/http.js:368", "   3. 后端返回的数据结构不符合预期");
        common_vendor.index.__f__("warn", "at utils/http.js:369", "💡 建议：清除登录信息并重新登录");
        if (!hasClearedInvalidLogin && !token) {
          common_vendor.index.__f__("warn", "at utils/http.js:374", "🔧 [自动修复] 检测到无效的登录信息，正在清除...");
          common_vendor.index.removeStorageSync("login_info");
          hasClearedInvalidLogin = true;
          common_vendor.index.__f__("warn", "at utils/http.js:377", "✅ [自动修复] 已清除无效的登录信息");
          common_vendor.index.__f__("warn", "at utils/http.js:378", "💡 请重新登录以获取有效的token");
          common_vendor.index.showToast({
            title: "登录信息已过期，请重新登录",
            icon: "none",
            duration: 3e3
          });
        } else if (hasClearedInvalidLogin) {
          common_vendor.index.__f__("warn", "at utils/http.js:387", "💡 已清除过无效登录信息，请重新登录");
        }
      } else {
        common_vendor.index.__f__("warn", "at utils/http.js:390", "⚠️ 未找到登录信息，请先登录");
      }
      common_vendor.index.__f__("warn", "at utils/http.js:392", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      common_vendor.index.__f__("log", "at utils/http.js:394", "✅ Token已找到，长度:", token.length);
    }
  }
  if (token) {
    let cleanToken = token.trim();
    if (cleanToken.startsWith("Bearer ")) {
      cleanToken = cleanToken.substring(7);
    }
    if (cleanToken.length < 20) {
      common_vendor.index.__f__("warn", "at utils/http.js:407", "⚠️ [Token警告] Token长度过短，可能不是有效的JWT token");
      common_vendor.index.__f__("warn", "at utils/http.js:408", "⚠️ Token长度:", cleanToken.length);
      common_vendor.index.__f__("warn", "at utils/http.js:409", "⚠️ Token值:", cleanToken.substring(0, 20) + "...");
    }
    if (isDev || isHeartWallApi || urlForCheck.includes("/api/couple/")) {
      common_vendor.index.__f__("log", "at utils/http.js:414", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("log", "at utils/http.js:415", "🔑 [Token传递诊断]");
      common_vendor.index.__f__("log", "at utils/http.js:416", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      common_vendor.index.__f__("log", "at utils/http.js:417", "📍 [请求URL]", options.url);
      common_vendor.index.__f__("log", "at utils/http.js:418", "📋 [请求方法]", options.method || "GET");
      common_vendor.index.__f__("log", "at utils/http.js:419", "✅ [Token状态] Token已找到");
      common_vendor.index.__f__("log", "at utils/http.js:420", "📏 [Token长度]", cleanToken.length, "字符");
      common_vendor.index.__f__("log", "at utils/http.js:421", "🔍 [Token预览]", cleanToken.substring(0, 50) + (cleanToken.length > 50 ? "..." : ""));
      common_vendor.index.__f__("log", "at utils/http.js:422", "🔍 [Token格式]", cleanToken.includes(".") ? "✅ JWT格式（包含点号）" : "⚠️ 非JWT格式（不包含点号）");
      common_vendor.index.__f__("log", "at utils/http.js:423", "📦 [Authorization头]", `Bearer ${cleanToken.substring(0, 30)}...`);
      common_vendor.index.__f__("log", "at utils/http.js:424", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    if (!options.header) {
      options.header = {};
    }
    options.header = {
      ...options.header,
      "Authorization": `Bearer ${cleanToken}`
    };
    if (isDev || isHeartWallApi || urlForCheck.includes("/api/couple/")) {
      const authHeader = options.header["Authorization"] || options.header["authorization"];
      if (authHeader) {
        common_vendor.index.__f__("log", "at utils/http.js:441", "✅ [验证] Authorization头已正确设置");
        common_vendor.index.__f__("log", "at utils/http.js:442", "📋 [Authorization头长度]", authHeader.length, "字符");
        common_vendor.index.__f__("log", "at utils/http.js:443", "🔍 [Authorization头预览]", authHeader.substring(0, 50) + "...");
      } else {
        common_vendor.index.__f__("error", "at utils/http.js:445", "❌ [验证失败] Authorization头未正确设置！");
        common_vendor.index.__f__("error", "at utils/http.js:446", "📋 [当前请求头]", JSON.stringify(options.header, null, 2));
      }
    }
  } else if (!isLoginApi) {
    common_vendor.index.__f__("warn", "at utils/http.js:451", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at utils/http.js:452", "⚠️ [Token缺失] 请求未携带Authorization头，可能导致401错误");
    common_vendor.index.__f__("warn", "at utils/http.js:453", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("warn", "at utils/http.js:454", "📍 [请求URL]", options.url);
    common_vendor.index.__f__("warn", "at utils/http.js:455", "📋 [请求方法]", options.method || "GET");
    common_vendor.index.__f__("warn", "at utils/http.js:456", "📦 [登录信息]", loginInfo ? "存在但token为空" : "不存在");
    if (loginInfo) {
      common_vendor.index.__f__("warn", "at utils/http.js:458", "📋 [登录信息字段]");
      common_vendor.index.__f__("warn", "at utils/http.js:459", "   - token:", loginInfo.token ? `✅ 存在（${loginInfo.token.length}字符）` : "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:460", "   - data?.token:", ((_c = loginInfo.data) == null ? void 0 : _c.token) ? `✅ 存在（${loginInfo.data.token.length}字符）` : "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:461", "   - accessToken:", loginInfo.accessToken ? `✅ 存在（${loginInfo.accessToken.length}字符）` : "❌ 不存在");
      common_vendor.index.__f__("warn", "at utils/http.js:462", "   - isLoggedIn:", loginInfo.isLoggedIn ? "✅ true" : "❌ false");
    }
    common_vendor.index.__f__("warn", "at utils/http.js:464", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
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
    common_vendor.index.__f__("log", "at utils/http.js:489", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:490", "🔗 [HTTP请求]", apiType);
    common_vendor.index.__f__("log", "at utils/http.js:491", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    common_vendor.index.__f__("log", "at utils/http.js:492", "📍 [URL]", options.url);
    common_vendor.index.__f__("log", "at utils/http.js:493", "📋 [方法]", options.method || "GET");
    if (options.data) {
      common_vendor.index.__f__("log", "at utils/http.js:495", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
    }
    if (token) {
      common_vendor.index.__f__("log", "at utils/http.js:498", "🔑 [认证] Token已携带 (长度:", token.length, ")");
    } else {
      if (!isLoginApi) {
        common_vendor.index.__f__("warn", "at utils/http.js:501", "⚠️ [认证] Token未携带，请求可能失败");
      } else {
        common_vendor.index.__f__("log", "at utils/http.js:503", "ℹ️ [认证] 登录接口，无需Token");
      }
    }
    if (options.header) {
      common_vendor.index.__f__("log", "at utils/http.js:507", "📋 [请求头]", Object.keys(options.header).join(", "));
    }
    common_vendor.index.__f__("log", "at utils/http.js:509", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
    common_vendor.index.__f__("log", "at utils/http.js:510", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
            common_vendor.index.__f__("log", "at utils/http.js:554", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:555", "✅ [HTTP响应]", apiType, "请求成功");
            common_vendor.index.__f__("log", "at utils/http.js:556", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("log", "at utils/http.js:557", "📍 [URL]", options.url);
            common_vendor.index.__f__("log", "at utils/http.js:558", "📊 [状态码]", res.statusCode);
            common_vendor.index.__f__("log", "at utils/http.js:559", "📦 [响应数据]", JSON.stringify(res.data, null, 2));
            if (res.data && typeof res.data === "object") {
              if (res.data.tasks && Array.isArray(res.data.tasks)) {
                common_vendor.index.__f__("log", "at utils/http.js:564", "📊 [数据统计] 任务数量:", res.data.tasks.length);
              }
              if (res.data.projects && Array.isArray(res.data.projects)) {
                common_vendor.index.__f__("log", "at utils/http.js:567", "📊 [数据统计] 项目数量:", res.data.projects.length);
              }
              if (res.data.photos && Array.isArray(res.data.photos)) {
                common_vendor.index.__f__("log", "at utils/http.js:570", "📊 [数据统计] 照片数量:", res.data.photos.length);
              }
              if (res.data.questions && Array.isArray(res.data.questions)) {
                common_vendor.index.__f__("log", "at utils/http.js:573", "📊 [数据统计] 问题数量:", res.data.questions.length);
              }
              if (res.data.success !== void 0) {
                common_vendor.index.__f__("log", "at utils/http.js:576", "✅ [业务状态]", res.data.success ? "成功" : "失败");
              }
              if (res.data.message) {
                common_vendor.index.__f__("log", "at utils/http.js:579", "💬 [消息]", res.data.message);
              }
            }
            common_vendor.index.__f__("log", "at utils/http.js:583", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
            common_vendor.index.__f__("log", "at utils/http.js:584", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          if (res.data && typeof res.data === "object" && res.data.code === 401) {
            const errorMessage = res.data.msg || res.data.message || "认证失败，无法访问系统资源";
            const error = new Error(errorMessage);
            error.statusCode = 401;
            error.data = res.data;
            error.responseData = res.data;
            handle401Diagnosis(res, options, res.data);
            reject(error);
            return;
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
            common_vendor.index.__f__("warn", "at utils/http.js:652", `⚠️ [HTTP响应] 状态码异常: ${res.statusCode}`);
            common_vendor.index.__f__("warn", "at utils/http.js:653", `⚠️ [响应数据]`, responseData);
            common_vendor.index.__f__("warn", "at utils/http.js:654", `⚠️ [响应数据类型]`, typeof responseData);
            if (responseData && typeof responseData === "object") {
              common_vendor.index.__f__("warn", "at utils/http.js:656", `⚠️ [success字段]`, responseData.success);
              common_vendor.index.__f__("warn", "at utils/http.js:657", `⚠️ [message字段]`, responseData.message);
              if (isHeartWallApi2 && responseData.photo) {
                common_vendor.index.__f__("warn", "at utils/http.js:660", `⚠️ [photo字段存在]`, !!responseData.photo);
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
            common_vendor.index.__f__("warn", "at utils/http.js:685", `⚠️ [HTTP响应] 后端返回状态码 ${res.statusCode}，但业务逻辑成功 (success: true)`);
            common_vendor.index.__f__("warn", "at utils/http.js:686", "⚠️ 建议后端修改：成功时应该返回 200 状态码");
            resolve(responseData);
            return;
          }
          if (isHeartWallApi2 || true) {
            common_vendor.index.__f__("error", "at utils/http.js:694", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at utils/http.js:695", `❌ [HTTP响应] 状态码 ${res.statusCode} 且业务逻辑失败`);
            common_vendor.index.__f__("error", "at utils/http.js:696", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            common_vendor.index.__f__("error", "at utils/http.js:697", "📍 [请求URL]", options.url);
            common_vendor.index.__f__("error", "at utils/http.js:698", "📋 [请求方法]", options.method || "GET");
            if (options.data) {
              common_vendor.index.__f__("error", "at utils/http.js:700", "📤 [请求参数]", JSON.stringify(options.data, null, 2));
            }
            if (options.header) {
              common_vendor.index.__f__("error", "at utils/http.js:703", "📋 [请求头]", JSON.stringify(options.header, null, 2));
            }
            common_vendor.index.__f__("error", "at utils/http.js:705", "📊 [响应状态码]", res.statusCode);
            common_vendor.index.__f__("error", "at utils/http.js:706", "📦 [完整响应对象]", JSON.stringify(res, null, 2));
            if (!responseData || typeof responseData !== "object") {
              common_vendor.index.__f__("error", "at utils/http.js:708", `❌ [响应数据] 不是对象，类型: ${typeof responseData}，值:`, responseData);
            } else {
              common_vendor.index.__f__("error", "at utils/http.js:710", `❌ [success字段]`, responseData.success);
              common_vendor.index.__f__("error", "at utils/http.js:711", `❌ [message字段]`, responseData.message);
              common_vendor.index.__f__("error", "at utils/http.js:712", `❌ [完整响应数据]`, JSON.stringify(responseData, null, 2));
              common_vendor.index.__f__("error", "at utils/http.js:714", `❌ [响应数据字段列表]`, Object.keys(responseData).join(", "));
              if (isHeartWallApi2) {
                common_vendor.index.__f__("error", "at utils/http.js:716", `❌ [photo字段]`, responseData.photo ? "存在" : "不存在");
              }
            }
            common_vendor.index.__f__("error", "at utils/http.js:719", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
            common_vendor.index.__f__("error", "at utils/http.js:720", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          }
          const errorMessage = responseData && typeof responseData === "object" && responseData.message ? responseData.message : `请求失败，状态码: ${res.statusCode}`;
          const error = new Error(errorMessage);
          error.statusCode = res.statusCode;
          error.data = responseData || res.data;
          if (responseData && typeof responseData === "object") {
            error.responseData = responseData;
          }
          if (responseData && typeof responseData === "object" && responseData.code === 401) {
            const errorMessage2 = responseData.msg || responseData.message || "认证失败，无法访问系统资源";
            const error2 = new Error(errorMessage2);
            error2.statusCode = 401;
            error2.data = responseData;
            error2.responseData = responseData;
            handle401Diagnosis(res, options, responseData);
            reject(error2);
            return;
          }
          if (res.statusCode === 401) {
            handle401Diagnosis(res, options, responseData);
          }
          if (res.statusCode === 404 && errorMessage && errorMessage.includes("用户不存在")) {
            const isLocationApi = options.url.includes("/api/trajectory/location/");
            const isChallengeApi2 = options.url.includes("/api/challenge/");
            if (isLocationApi) {
              common_vendor.index.__f__("warn", "at utils/http.js:772", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:773", '⚠️ [HTTP响应] 检测到"用户不存在"错误（位置API）');
              common_vendor.index.__f__("warn", "at utils/http.js:774", "⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:775", "⚠️ 位置功能将无法使用，但不会影响页面其他功能");
              common_vendor.index.__f__("warn", "at utils/http.js:776", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else if (isChallengeApi2) {
              common_vendor.index.__f__("warn", "at utils/http.js:780", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:781", '⚠️ [HTTP响应] 检测到"用户不存在"错误（一百件事API）');
              common_vendor.index.__f__("warn", "at utils/http.js:782", "⚠️ 可能原因：");
              common_vendor.index.__f__("warn", "at utils/http.js:783", "   1. 接口不存在（后端未实现此接口）");
              common_vendor.index.__f__("warn", "at utils/http.js:784", "   2. 用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:785", "⚠️ 不会自动跳转登录，请检查接口是否已实现");
              common_vendor.index.__f__("warn", "at utils/http.js:786", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else {
              common_vendor.index.__f__("warn", "at utils/http.js:789", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              common_vendor.index.__f__("warn", "at utils/http.js:790", '⚠️ [HTTP响应] 检测到"用户不存在"错误');
              common_vendor.index.__f__("warn", "at utils/http.js:791", "⚠️ 这通常表示用户信息已失效或token中的用户在后端不存在");
              common_vendor.index.__f__("warn", "at utils/http.js:792", "⚠️ 将清除登录信息并跳转到登录页");
              common_vendor.index.__f__("warn", "at utils/http.js:793", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
          common_vendor.index.__f__("error", "at utils/http.js:838", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:839", "❌ [HTTP错误]", apiType, "请求失败");
          common_vendor.index.__f__("error", "at utils/http.js:840", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          common_vendor.index.__f__("error", "at utils/http.js:841", "📍 [URL]", options.url);
          common_vendor.index.__f__("error", "at utils/http.js:842", "📋 [方法]", options.method || "GET");
          common_vendor.index.__f__("error", "at utils/http.js:843", "🔴 [错误详情]", error);
          common_vendor.index.__f__("error", "at utils/http.js:844", "📋 [错误消息]", error.errMsg || error.message || "未知错误");
          common_vendor.index.__f__("error", "at utils/http.js:845", "📊 [状态码]", error.statusCode || "无");
          if (error.errMsg) {
            if (error.errMsg.includes("timeout")) {
              common_vendor.index.__f__("error", "at utils/http.js:850", "⏱️ [错误类型] 请求超时");
            } else if (error.errMsg.includes("fail")) {
              common_vendor.index.__f__("error", "at utils/http.js:852", "🔌 [错误类型] 网络连接失败");
              common_vendor.index.__f__("error", "at utils/http.js:853", "💡 [提示] 请检查：");
              common_vendor.index.__f__("error", "at utils/http.js:854", "   1. 后端服务是否已启动");
              common_vendor.index.__f__("error", "at utils/http.js:855", "   2. 请求地址是否正确:", options.url);
              common_vendor.index.__f__("error", "at utils/http.js:856", "   3. 网络是否连通");
            } else if (error.errMsg.includes("404")) {
              common_vendor.index.__f__("error", "at utils/http.js:858", "🔍 [错误类型] 接口不存在 (404)");
            } else if (error.errMsg.includes("401")) {
              common_vendor.index.__f__("error", "at utils/http.js:860", "🔐 [错误类型] 未授权 (401)，可能是Token过期");
            }
          }
          common_vendor.index.__f__("error", "at utils/http.js:864", "⏰ [时间]", (/* @__PURE__ */ new Date()).toLocaleString());
          common_vendor.index.__f__("error", "at utils/http.js:865", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
  common_vendor.index.__f__("log", "at utils/http.js:894", "📁 [上传] 原始文件路径:", originalFilePath);
  let validFilePath = originalFilePath;
  if (validFilePath && typeof validFilePath === "string") {
    if (validFilePath.startsWith("http://tmp/") || validFilePath.startsWith("https://tmp/")) {
      common_vendor.index.__f__("log", "at utils/http.js:904", "ℹ️ [上传] 检测到微信小程序临时文件路径，uni.uploadFile 将直接处理");
      validFilePath = originalFilePath;
    } else if (validFilePath.startsWith("http://") || validFilePath.startsWith("https://")) {
      common_vendor.index.__f__("warn", "at utils/http.js:910", "⚠️ [上传] 文件路径已经是URL格式，跳过上传:", validFilePath);
      return Promise.reject(new Error("文件路径已经是URL格式，无需上传"));
    }
  }
  if (!options.url.startsWith("http")) {
    options.url = utils_config.config.baseURL + options.url;
  }
  const loginInfo = common_vendor.index.getStorageSync("login_info");
  const token = loginInfo == null ? void 0 : loginInfo.token;
  if (token) {
    let cleanToken = token.trim();
    if (cleanToken.startsWith("Bearer ")) {
      cleanToken = cleanToken.substring(7);
    }
    options.header["Authorization"] = `Bearer ${cleanToken}`;
  } else {
    common_vendor.index.__f__("warn", "at utils/http.js:933", "⚠️ 上传请求未携带Authorization头，可能导致401错误");
  }
  const uploadOptions = {
    ...options,
    filePath: validFilePath
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.__f__("log", "at utils/http.js:943", "📤 [上传] 开始上传文件，路径:", validFilePath);
    common_vendor.index.uploadFile({
      ...uploadOptions,
      success: (uploadRes) => {
        common_vendor.index.__f__("log", "at utils/http.js:947", "📥 [上传响应] 原始响应:", uploadRes);
        common_vendor.index.__f__("log", "at utils/http.js:948", "📥 [上传响应] 响应数据类型:", typeof uploadRes.data);
        common_vendor.index.__f__("log", "at utils/http.js:949", "📥 [上传响应] 响应数据内容:", uploadRes.data);
        try {
          let result;
          if (typeof uploadRes.data === "string") {
            try {
              result = JSON.parse(uploadRes.data);
              common_vendor.index.__f__("log", "at utils/http.js:957", "📥 [上传响应] JSON解析成功:", result);
            } catch (parseError) {
              common_vendor.index.__f__("warn", "at utils/http.js:959", "⚠️ [上传响应] JSON解析失败，使用原始数据:", uploadRes.data);
              result = uploadRes.data;
            }
          } else {
            result = uploadRes.data;
            common_vendor.index.__f__("log", "at utils/http.js:965", "📥 [上传响应] 使用原始数据对象:", result);
          }
          common_vendor.index.__f__("log", "at utils/http.js:969", "📥 [上传响应] 响应结构分析:");
          common_vendor.index.__f__("log", "at utils/http.js:970", "   - 是否有success字段:", result.hasOwnProperty("success"));
          common_vendor.index.__f__("log", "at utils/http.js:971", "   - success字段值:", result.success);
          common_vendor.index.__f__("log", "at utils/http.js:972", "   - 是否有message字段:", result.hasOwnProperty("message"));
          common_vendor.index.__f__("log", "at utils/http.js:973", "   - message字段值:", result.message);
          common_vendor.index.__f__("log", "at utils/http.js:974", "   - 是否有data字段:", result.hasOwnProperty("data"));
          common_vendor.index.__f__("log", "at utils/http.js:975", "   - data字段值:", result.data);
          common_vendor.index.__f__("log", "at utils/http.js:976", "   - 是否有photoUrl字段:", result.hasOwnProperty("photoUrl"));
          common_vendor.index.__f__("log", "at utils/http.js:977", "   - photoUrl字段值:", result.photoUrl);
          common_vendor.index.__f__("log", "at utils/http.js:978", "   - 是否有url字段:", result.hasOwnProperty("url"));
          common_vendor.index.__f__("log", "at utils/http.js:979", "   - url字段值:", result.url);
          const isSuccess = result.success === true || result.hasOwnProperty("success") === false && (result.photoUrl || result.url || result.data);
          if (isSuccess) {
            common_vendor.index.__f__("log", "at utils/http.js:987", "✅ [上传] 文件上传成功");
            let photoUrl = result.photoUrl || result.url || result.data && result.data.photoUrl || result.data && result.data.url;
            if (photoUrl) {
              common_vendor.index.__f__("log", "at utils/http.js:991", "🖼️ [上传] 提取到图片URL:", photoUrl);
            } else {
              common_vendor.index.__f__("warn", "at utils/http.js:993", "⚠️ [上传] 未找到图片URL字段");
            }
            const normalizedData = result.data !== void 0 && result.data !== null ? result.data : result;
            resolve(normalizedData);
          } else {
            const errorMsg = result.message || result.msg || "上传失败";
            common_vendor.index.__f__("error", "at utils/http.js:1002", "❌ [上传] 服务器返回失败:", errorMsg);
            common_vendor.index.__f__("error", "at utils/http.js:1003", "📋 [上传] 完整响应数据:", result);
            reject(new Error(errorMsg));
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at utils/http.js:1007", "❌ [上传] 解析响应失败:", e);
          common_vendor.index.__f__("error", "at utils/http.js:1008", "📋 [上传] 原始响应数据:", uploadRes.data);
          reject(new Error("解析上传响应失败"));
        }
      },
      fail: (error) => {
        common_vendor.index.__f__("error", "at utils/http.js:1013", "❌ [上传] 上传失败:", error);
        common_vendor.index.__f__("error", "at utils/http.js:1014", "❌ [上传] 原始路径:", originalFilePath);
        common_vendor.index.__f__("error", "at utils/http.js:1015", "❌ [上传] 使用路径:", validFilePath);
        if (error.errMsg && (error.errMsg.includes("未找到") || error.errMsg.includes("file not found") || error.errMsg.includes("no such file") || error.errMsg.includes("file doesn't exist"))) {
          if (originalFilePath && (originalFilePath.startsWith("http://tmp/") || originalFilePath.startsWith("https://tmp/"))) {
            common_vendor.index.__f__("error", "at utils/http.js:1021", "❌ [上传] 微信小程序临时文件路径可能已过期，请重新选择图片");
            reject(new Error("图片选择已过期，请重新选择图片"));
            return;
          }
          if (validFilePath !== originalFilePath && originalFilePath) {
            common_vendor.index.__f__("warn", "at utils/http.js:1028", "⚠️ [上传] 转换后的路径无效，尝试使用原始路径:", originalFilePath);
          }
          common_vendor.index.__f__("error", "at utils/http.js:1031", "❌ [上传] 文件路径无效，无法找到文件");
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
