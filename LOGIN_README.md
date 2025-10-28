# 微信小程序登录功能使用说明（完整版）

## 📋 功能概述

本项目已成功集成**完整的微信授权登录功能**，支持与后端服务器对接，实现：
- ✅ 微信 code 获取
- ✅ 用户信息授权
- ✅ 后端 API 对接
- ✅ JWT Token 管理
- ✅ 登录状态持久化
- ✅ Token 自动携带

## ✅ 已实现功能

### 1. 微信授权登录流程 (`pages/login/index.vue`)
- 📱 **调用 wx.login** - 获取微信临时登录凭证 code
- 👤 **获取用户信息** - 调用 uni.getUserProfile 获取昵称、头像
- 📡 **后端对接** - 将 code 和用户信息发送到后端
- 🔑 **Token 管理** - 接收并保存后端返回的 token、openid
- 💾 **状态持久化** - 登录信息保存到本地存储
- ✨ **自动跳转** - 登录成功后自动进入首页

### 2. API 接口封装 (`api/login.js`)
- `wxLogin(code, userInfo)` - 微信登录接口
- `logout()` - 退出登录接口
- `getUserInfo()` - 获取用户信息接口
- 📝 详细的接口文档注释

### 3. HTTP 请求封装 (`utils/http.js`)
- 🔄 **统一请求处理** - 封装 GET、POST、PUT、DELETE
- 🔑 **自动携带 Token** - 所有请求自动添加 Authorization 头
- ⚠️ **错误处理** - 统一处理 401 未授权错误
- 🔁 **Token 过期** - 自动跳转登录页

### 4. 配置管理 (`utils/config.js`)
- 🌍 **环境区分** - 开发环境 / 生产环境
- 🔗 **API 地址管理** - 统一管理所有接口路径
- ⚙️ **灵活配置** - 轻松切换后端服务器地址

### 5. 退出登录功能
- 首页右上角退出按钮
- 退出确认对话框
- 清除本地登录信息
- 退出后自动跳转登录页

## 🚀 使用方法

### 运行项目

```bash
# 启动微信小程序开发
npm run dev:mp-weixin
```

### 测试流程

1. **首次启动**
   - 打开微信开发者工具
   - 导入项目
   - 点击"预览"或"真机调试"

2. **登录测试**
   - 小程序启动后会自动显示登录页
   - 点击"微信授权登录"按钮
   - 允许授权获取头像和昵称
   - 登录成功后自动进入首页

3. **退出测试**
   - 在首页点击右上角"退出"按钮
   - 确认退出
   - 自动跳转回登录页

4. **再次进入**
   - 关闭小程序后重新打开
   - 如果已登录，直接进入首页
   - 如果未登录，显示登录页

## 📂 文件结构

```
love_time/
├── pages/
│   ├── login/
│   │   └── index.vue          # 登录页面（微信授权登录）
│   ├── index/
│   │   └── index.vue          # 首页（已添加退出功能）
│   └── ...
├── api/
│   └── login.js               # 登录API接口封装 ⭐ 新增
├── utils/
│   ├── config.js              # 配置文件（后端地址） ⭐ 新增
│   ├── http.js                # HTTP请求封装（自动携带token） ⭐ 新增
│   └── auth.js                # 登录工具函数
├── App.vue                    # 全局配置（已添加登录检查）
├── pages.json                 # 路由配置（登录页为首页）
├── BACKEND_API.md             # 后端对接文档 ⭐ 新增
└── 前端登录功能说明.md         # 详细功能说明 ⭐ 新增
```

## 💾 数据存储

登录信息存储在本地 Storage 中（键名：`login_info`）：

```javascript
// 完整存储结构
{
  isLoggedIn: true,              // 是否已登录
  token: "eyJhbGciOiJIUzI1...",  // JWT Token（后端返回） ⭐
  openid: "oABC123xyz...",       // 微信用户唯一标识（后端返回） ⭐
  sessionKey: "HyVFkGl5F5...",   // 会话密钥（后端返回） ⭐
  userInfo: {                    // 用户信息
    nickName: "用户昵称",
    avatarUrl: "头像URL"
  },
  loginTime: "2025-10-28T..."   // 登录时间
}
```

### Token 的使用

所有后续 API 请求都会自动携带 token：

```javascript
// 请求头中会自动添加
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1..."
}
```

## 🔧 在其他页面使用

如果你想在其他页面添加登录检查，可以这样做：

```javascript
// 在页面的 script 中引入工具函数
import { checkLogin, getUserInfo, logout } from '@/utils/auth.js';

export default {
  onLoad() {
    // 检查登录状态，未登录则跳转
    if (!checkLogin()) {
      return;
    }
    
    // 获取用户信息
    const userInfo = getUserInfo();
    console.log('当前用户：', userInfo);
  },
  
  methods: {
    handleLogout() {
      logout();
      uni.reLaunch({
        url: '/pages/login/index'
      });
    }
  }
}
```

## 🔗 后端对接说明

### 第一步：配置后端地址

编辑 `utils/config.js` 文件：

```javascript
const CONFIG = {
  development: {
    baseURL: 'http://192.168.1.100:3000',  // ⚠️ 改成你的后端地址
  },
  production: {
    baseURL: 'https://your-domain.com',    // ⚠️ 改成正式服务器地址
  }
};
```

### 第二步：后端实现登录接口

**接口地址：** `POST /api/login/wechat`

**前端发送的数据：**
```json
{
  "code": "081xYz0w3wkTiw2TID1w3BW8Jd0xYz0f",  // 微信登录凭证
  "nickName": "用户昵称",
  "avatarUrl": "https://..."
}
```

**后端应该返回：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "openid": "oABC123xyz...",
    "session_key": "HyVFkGl5F5..."
  }
}
```

**详细对接文档：** 请查看 📄 `BACKEND_API.md` 和 📄 `前端登录功能说明.md`

### 第三步：联调测试

1. 启动后端服务
2. 修改前端配置中的 baseURL
3. 点击"微信授权登录"测试
4. 查看控制台日志和网络请求
5. 确认 token 正确保存

## 🎯 后续优化建议

1. **增强功能**
   - ✅ JWT Token 管理（已实现）
   - ✅ Token 自动携带（已实现）
   - ✅ Token 过期处理（已实现）
   - ⏳ 添加手机号绑定
   - ⏳ 实现用户资料编辑
   - ⏳ Token 自动刷新机制

2. **安全优化**
   - ✅ 统一错误处理（已实现）
   - ⏳ 加密存储敏感信息
   - ⏳ 实现多设备登录管理

## ⚠️ 注意事项

1. **微信小程序配置**
   - 确保在微信公众平台配置了小程序信息
   - 检查 `manifest.json` 中的 AppID 是否正确
   - 用户信息获取需要用户主动授权

2. **开发调试**
   - 微信开发者工具需要开启"不校验合法域名"
   - 真机调试需要配置服务器域名白名单

3. **隐私政策**
   - 上线前需要完善用户协议和隐私政策
   - 需要在小程序管理后台配置隐私协议

## 📞 技术支持

如有问题，请检查：
1. 微信开发者工具版本是否最新
2. uni-app 版本是否兼容
3. 控制台是否有错误信息

---

## 📚 相关文档

| 文档名称 | 说明 |
|---------|------|
| `前端登录功能说明.md` | 详细的前端实现说明，包含完整代码示例 |
| `BACKEND_API.md` | 后端接口对接文档，包含接口定义和示例 |
| `LOGIN_README.md` | 本文档，快速上手指南 |

---

**最后更新时间**: 2025-10-28  
**适用平台**: 微信小程序 + H5  
**技术栈**: Vue3 + uni-app + Vite  
**登录方式**: 微信授权登录 + 后端 JWT Token
