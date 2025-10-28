# 后端API对接文档

## 📋 目录
1. [配置说明](#配置说明)
2. [登录接口](#登录接口)
3. [请求流程](#请求流程)
4. [数据格式](#数据格式)
5. [错误处理](#错误处理)

---

## 配置说明

### 1. 修改后端服务器地址

编辑文件：`utils/config.js`

```javascript
const CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:3000',  // 改为你的本地开发服务器地址
    timeout: 10000
  },
  // 生产环境
  production: {
    baseURL: 'https://your-backend-domain.com',  // 改为你的正式服务器地址
    timeout: 10000
  }
};
```

---

## 登录接口

### 微信登录接口

**接口地址**：`POST /api/login/wechat`

**请求头**：
```json
{
  "Content-Type": "application/json"
}
```

**请求参数**：
```json
{
  "code": "081xYz0w3wkTiw2TID1w3BW8Jd0xYz0f",  // 微信登录凭证
  "nickName": "用户昵称",                      // 用户昵称
  "avatarUrl": "https://..."                   // 用户头像URL
}
```

**成功响应** (HTTP 200)：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT token
    "openid": "oABC123xyz...",                           // 微信用户唯一标识
    "session_key": "HyVFkGl5F5...",                      // 会话密钥
    "userId": "user_12345",                              // 用户ID（可选）
    "isNewUser": false                                   // 是否新用户（可选）
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "登录失败：code已过期",
  "data": null
}
```

---

## 请求流程

### 完整登录流程图

```
┌─────────────┐
│  前端小程序  │
└──────┬──────┘
       │
       │ 1. 用户点击"微信授权登录"
       ↓
┌─────────────────────┐
│ wx.login()          │
│ 获取临时凭证 code   │
└──────┬──────────────┘
       │
       │ 2. code (有效期5分钟)
       ↓
┌─────────────────────┐
│ uni.getUserProfile()│
│ 获取用户信息        │
└──────┬──────────────┘
       │
       │ 3. nickName, avatarUrl
       ↓
┌─────────────────────────────┐
│ POST /api/login/wechat      │
│ 发送: code + userInfo       │
└──────┬──────────────────────┘
       │
       │ 4. 请求发送到后端
       ↓
┌──────────────────────────────┐
│  后端服务器                  │
│  1. 接收 code                │
│  2. 用 AppID + AppSecret +   │
│     code 调用微信服务器      │
│  3. 获取 openid + session_key│
│  4. 验证用户身份             │
│  5. 生成 token               │
│  6. 返回登录结果             │
└──────┬───────────────────────┘
       │
       │ 5. token + openid + session_key
       ↓
┌─────────────────────┐
│  前端                │
│  1. 保存 token      │
│  2. 保存用户信息     │
│  3. 跳转到首页       │
└─────────────────────┘
```

---

## 后端需要做什么

### 1. 接收前端请求

```javascript
// Node.js + Express 示例
app.post('/api/login/wechat', async (req, res) => {
  const { code, nickName, avatarUrl } = req.body;
  
  // ... 处理登录逻辑
});
```

### 2. 调用微信服务器

```javascript
const axios = require('axios');

// 微信服务器接口
const WX_API = 'https://api.weixin.qq.com/sns/jscode2session';

// 你的小程序配置
const APPID = 'your_appid';
const SECRET = 'your_secret';

// 调用微信接口
const response = await axios.get(WX_API, {
  params: {
    appid: APPID,
    secret: SECRET,
    js_code: code,
    grant_type: 'authorization_code'
  }
});

// 微信返回
const { openid, session_key } = response.data;
```

### 3. 验证并生成token

```javascript
const jwt = require('jsonwebtoken');

// 查询或创建用户
let user = await User.findOne({ openid });
if (!user) {
  user = await User.create({
    openid,
    nickName,
    avatarUrl,
    session_key
  });
}

// 生成JWT token
const token = jwt.sign(
  { userId: user.id, openid },
  'your_secret_key',
  { expiresIn: '7d' }
);
```

### 4. 返回结果

```javascript
res.json({
  success: true,
  message: '登录成功',
  data: {
    token,
    openid,
    session_key,
    userId: user.id,
    isNewUser: user.createdAt === user.updatedAt
  }
});
```

---

## 数据格式

### 统一响应格式

所有API接口返回统一格式：

```json
{
  "success": true|false,    // 业务是否成功
  "message": "提示信息",     // 提示消息
  "data": {}|[]|null        // 返回数据
}
```

### 前端请求头格式

后续请求需要携带token：

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 错误处理

### HTTP 状态码

- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权（token过期或无效）
- `404` - 资源不存在
- `500` - 服务器内部错误

### 业务错误码（可选）

```json
{
  "success": false,
  "message": "登录失败",
  "errorCode": "LOGIN_EXPIRED",  // 错误码
  "data": null
}
```

---

## 前端调用示例

### 1. 登录

```javascript
import { wxLogin } from '@/api/login.js';

// 调用登录
const result = await wxLogin(code, userInfo);
// result = { token, openid, session_key, userId }
```

### 2. 后续请求自动携带token

```javascript
import http from '@/utils/http.js';

// 发送请求（自动携带token）
const data = await http.post('/api/letter/create', {
  title: '信件标题',
  content: '信件内容'
});
```

---

## 开发模式说明

### 前端开发（后端未就绪）

当后端接口未就绪时，前端会自动使用模拟数据：

```javascript
// 在开发环境下，如果请求失败会返回模拟数据
if (process.env.NODE_ENV === 'development') {
  console.warn('开发模式：使用模拟数据');
  return {
    token: 'mock_token_' + Date.now(),
    openid: 'mock_openid',
    session_key: 'mock_session_key'
  };
}
```

---

## 快速开始

### 1. 前端配置

```bash
# 修改 utils/config.js 中的 baseURL
# 开发环境：http://localhost:3000
# 生产环境：https://your-domain.com
```

### 2. 后端准备

- [ ] 创建 POST /api/login/wechat 接口
- [ ] 配置小程序 AppID 和 AppSecret
- [ ] 实现微信登录验证逻辑
- [ ] 生成并返回 JWT token

### 3. 联调测试

```bash
# 前端启动
npm run dev:mp-weixin

# 后端启动
npm start

# 测试登录流程
# 1. 点击"微信授权登录"
# 2. 查看控制台输出的请求和响应
# 3. 确认token正确保存
```

---

## 常见问题

### Q1: code已失效怎么办？
A: code的有效期只有5分钟，前端会自动重新获取。

### Q2: 如何测试登录？
A: 开发模式下前端会使用模拟数据，可以先完成前端开发。

### Q3: token存储在哪里？
A: 存储在 `uni.getStorageSync('login_info')` 中。

### Q4: 如何退出登录？
A: 调用 `uni.removeStorageSync('login_info')` 并跳转到登录页。

---

## 联系方式

如有问题请联系后端开发人员对接接口细节。
