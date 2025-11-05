"use strict";
const common_vendor = require("../common/vendor.js");
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
async function updateUserProfile(nickName, avatarUrl) {
  try {
    common_vendor.index.__f__("log", "at api/user.js:17", "🔗 [更新用户资料] 开始更新用户资料...");
    common_vendor.index.__f__("log", "at api/user.js:18", "📋 [参数] nickName:", nickName);
    common_vendor.index.__f__("log", "at api/user.js:19", "📋 [参数] avatarUrl:", avatarUrl);
    const response = await utils_http.http.post(utils_config.config.API.USER.UPDATE, {
      nickName: nickName || "",
      avatarUrl: avatarUrl || ""
    });
    common_vendor.index.__f__("log", "at api/user.js:27", "✅ [更新用户资料] 更新成功:", response);
    return response;
  } catch (error) {
    common_vendor.index.__f__("error", "at api/user.js:30", "❌ [更新用户资料] 更新失败:", error);
    throw error;
  }
}
exports.updateUserProfile = updateUserProfile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/user.js.map
