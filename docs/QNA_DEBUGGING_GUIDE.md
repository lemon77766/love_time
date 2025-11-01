# 甜蜜问答功能前后端联调指南

## 📋 目录

1. [联调前准备](#联调前准备)
2. [后端接口要求](#后端接口要求)
3. [前端调用说明](#前端调用说明)
4. [联调测试步骤](#联调测试步骤)
5. [常见问题排查](#常见问题排查)
6. [测试检查清单](#测试检查清单)

---

## 🔧 联调前准备

### 1. 检查后端服务
- ✅ 确认后端服务已启动
- ✅ 确认后端服务地址：`http://192.168.54.229:8080/lovetime`（开发环境）
- ✅ 确认后端已实现所有6个问答相关接口

### 2. 检查前端配置
- ✅ 确认 `utils/config.js` 中已配置 `QNA` API 路径
- ✅ 确认 `api/qna.js` 中所有API函数已正确导入
- ✅ 确认用户已登录（token已保存）

### 3. 检查网络连接
- ✅ 前端设备与后端服务器网络连通
- ✅ 可以访问后端服务的健康检查接口

---

## 🔌 后端接口要求

### 接口清单

后端需要实现以下6个接口，所有接口都需要：
- **认证方式**：请求头携带 `Authorization: Bearer {token}`
- **返回格式**：统一使用 `{ success: boolean, message?: string, data?: any }` 格式
- **错误处理**：错误时返回 `{ success: false, message: "错误描述" }`

#### 1. 获取问题列表
```
GET /api/qna/questions
```

**请求头**：
```
Authorization: Bearer {token}
```

**返回数据格式**：
```json
{
  "success": true,
  "data": {
    "defaultQuestions": [
      {
        "id": 1,
        "text": "我们第一次约会的地点是哪里？",
        "isDefault": true
      }
    ],
    "customQuestions": [
      {
        "id": 101,
        "text": "你最想去哪里旅游？",
        "isDefault": false,
        "userId": "user123"
      }
    ]
  }
}
```

#### 2. 提交答案
```
POST /api/qna/answer/submit
```

**请求头**：
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "questionId": 1,
  "answer": "我的答案是...",
  "questionText": "我们第一次约会的地点是哪里？"
}
```

**返回数据格式**：
```json
{
  "success": true,
  "message": "提交成功",
  "data": {
    "answerId": 1001,
    "partnerAnswer": "对方的答案...",
    "hasPartnerAnswered": true
  }
}
```

**注意**：
- 如果对方还没有回答，`partnerAnswer` 应为空字符串，`hasPartnerAnswered` 应为 `false`
- `answerId` 是新创建的答案记录的ID

#### 3. 获取历史记录
```
GET /api/qna/history?page=1&pageSize=100
```

**请求头**：
```
Authorization: Bearer {token}
```

**查询参数**：
- `page`（可选）：页码，默认1
- `pageSize`（可选）：每页数量，默认20

**返回数据格式**：
```json
{
  "success": true,
  "data": {
    "total": 50,
    "list": [
      {
        "id": 1001,
        "questionId": 1,
        "question": "我们第一次约会的地点是哪里？",
        "myAnswer": "我的答案",
        "partnerAnswer": "对方的答案",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### 4. 获取对方答案（可选）
```
GET /api/qna/partner?questionId=1
```

**请求头**：
```
Authorization: Bearer {token}
```

**查询参数**：
- `questionId`（必填）：问题ID

**返回数据格式**：
```json
{
  "success": true,
  "data": {
    "hasAnswered": true,
    "answer": "对方的答案",
    "answeredAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 5. 添加自定义问题
```
POST /api/qna/question/add
```

**请求头**：
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "text": "你最想去哪里旅游？"
}
```

**返回数据格式**：
```json
{
  "success": true,
  "message": "添加成功",
  "data": {
    "id": 101,
    "text": "你最想去哪里旅游？",
    "isDefault": false,
    "userId": "user123",
    "createdAt": "2025-01-15T10:40:00Z"
  }
}
```

#### 6. 删除自定义问题
```
POST /api/qna/question/delete
```

**请求头**：
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "questionId": 101
}
```

**返回数据格式**：
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 💻 前端调用说明

### API 函数位置
所有问答相关的API函数都在 `api/qna.js` 文件中：
- `getQuestions()` - 获取问题列表
- `submitAnswer(answerData)` - 提交答案
- `getHistory(params)` - 获取历史记录
- `getPartnerAnswer(questionId)` - 获取对方答案（当前未使用）
- `addCustomQuestion(questionText)` - 添加自定义问题
- `deleteCustomQuestion(questionId)` - 删除自定义问题

### 页面调用位置
主要页面：`pages/qna/index.vue`

**调用时机**：
1. **页面加载时**（`onLoad` 钩子）：
   - 调用 `loadQuestionsFromServer()` → 内部调用 `getQuestions()`
   - 调用 `loadHistoryFromServer()` → 内部调用 `getHistory()`

2. **提交答案时**（`submitAnswer` 方法）：
   - 调用 `submitAnswer()` API

3. **添加自定义问题时**（`addCustomQuestion` 方法）：
   - 调用 `addCustomQuestion()` API

4. **删除自定义问题时**（`deleteCustomQuestion` 方法）：
   - 调用 `deleteCustomQuestion()` API

---

## 🧪 联调测试步骤

### 步骤1：测试问题列表加载

1. **操作**：打开甜蜜问答页面（从主页点击"甜蜜问答"进入）

2. **预期结果**：
   - 页面显示加载提示
   - 成功加载后，显示第一个未回答的问题
   - 如果后端返回了预设问题和自定义问题，页面应正确显示

3. **检查点**：
   - 打开浏览器开发者工具 → Network 标签
   - 查看是否有请求：`GET /api/qna/questions`
   - 检查请求头是否携带 `Authorization: Bearer {token}`
   - 检查响应数据格式是否正确

4. **可能的问题**：
   - ❌ 请求失败（404）：检查后端路由配置
   - ❌ 401未授权：检查token是否正确传递
   - ❌ 返回数据格式不对：检查后端返回的数据结构

### 步骤2：测试提交答案

1. **操作**：
   - 在输入框中填写答案
   - 点击"提交答案"按钮

2. **预期结果**：
   - 显示"提交中..."加载提示
   - 提交成功后显示"提交成功"提示
   - 如果对方已回答，显示对方答案
   - 自动切换到下一题

3. **检查点**：
   - 查看 Network 请求：`POST /api/qna/answer/submit`
   - 检查请求体是否正确：`{ questionId, answer, questionText }`
   - 检查响应数据：`{ success, data: { answerId, partnerAnswer, hasPartnerAnswered } }`

4. **可能的问题**：
   - ❌ 提交失败：检查后端是否正确处理请求
   - ❌ 对方答案未显示：检查 `hasPartnerAnswered` 和 `partnerAnswer` 字段

### 步骤3：测试历史记录

1. **操作**：
   - 提交几个答案后
   - 点击"历史回答"悬浮按钮

2. **预期结果**：
   - 跳转到历史页面（如果有）或显示历史记录弹窗
   - 显示所有历史回答记录，包括问题和答案

3. **检查点**：
   - 查看 Network 请求：`GET /api/qna/history?page=1&pageSize=100`
   - 检查返回的历史记录格式是否正确

### 步骤4：测试添加自定义问题

1. **操作**：
   - 点击"自定义问题"悬浮按钮
   - 在输入框中输入新问题
   - 点击"添加问题"按钮

2. **预期结果**：
   - 显示"添加中..."提示
   - 添加成功后，新问题出现在自定义问题列表中
   - 输入框清空

3. **检查点**：
   - 查看 Network 请求：`POST /api/qna/question/add`
   - 检查请求体：`{ text: "问题内容" }`
   - 检查响应数据：`{ success, data: { id, text, isDefault, userId } }`

### 步骤5：测试删除自定义问题

1. **操作**：
   - 在自定义问题列表中
   - 点击某个自定义问题旁边的"删除"按钮
   - 确认删除

2. **预期结果**：
   - 显示"删除中..."提示
   - 删除成功后，该问题从列表中消失

3. **检查点**：
   - 查看 Network 请求：`POST /api/qna/question/delete`
   - 检查请求体：`{ questionId: 101 }`
   - 检查响应：`{ success, message: "删除成功" }`

---

## 🔍 常见问题排查

### 问题1：请求404 Not Found

**可能原因**：
- 后端路由配置错误
- API路径不匹配

**排查步骤**：
1. 检查后端服务是否已启动
2. 检查 `utils/config.js` 中的 API 路径是否正确
3. 使用 Postman 或 curl 直接测试后端接口
4. 检查后端路由配置是否匹配前端请求的路径

### 问题2：请求401 Unauthorized

**可能原因**：
- Token未传递或已过期
- Token格式不正确

**排查步骤**：
1. 检查 `utils/http.js` 中是否正确添加了 Authorization 头
2. 检查本地存储中是否有 token：`uni.getStorageSync('login_info')`
3. 检查后端是否正确验证了 token
4. 重新登录获取新的 token

### 问题3：请求超时

**可能原因**：
- 网络连接问题
- 后端响应慢
- 超时时间设置太短

**排查步骤**：
1. 检查网络连接是否正常
2. 检查 `utils/config.js` 中的 `timeout` 配置（默认10秒）
3. 检查后端服务是否正常运行
4. 使用浏览器开发者工具查看请求耗时

### 问题4：数据格式不匹配

**可能原因**：
- 后端返回的数据结构与前端期望的不一致
- 字段名称不匹配

**排查步骤**：
1. 查看浏览器 Network 标签，检查后端实际返回的数据
2. 对比 `api/qna.js` 中的注释说明
3. 检查后端返回的字段是否与前端代码中使用的一致
4. 特别检查：`success`、`data`、`message` 字段

### 问题5：页面显示异常

**可能原因**：
- 前端数据绑定错误
- 后端返回的数据为空或格式错误

**排查步骤**：
1. 打开浏览器开发者工具 Console，查看是否有错误信息
2. 检查 Vue 组件的 data 和 computed 属性
3. 检查后端返回的数据是否为空数组或 null
4. 查看前端代码中的错误处理逻辑

---

## ✅ 测试检查清单

### 功能测试

- [ ] 页面加载时能成功获取问题列表
- [ ] 预设问题和自定义问题都能正确显示
- [ ] 能成功提交答案
- [ ] 提交后能正确显示对方答案（如果对方已回答）
- [ ] 能成功查看历史记录
- [ ] 能成功添加自定义问题
- [ ] 能成功删除自定义问题
- [ ] 未回答的问题能正确筛选显示

### 接口测试

- [ ] `GET /api/qna/questions` - 返回正确格式
- [ ] `POST /api/qna/answer/submit` - 提交成功
- [ ] `GET /api/qna/history` - 返回历史记录
- [ ] `POST /api/qna/question/add` - 添加成功
- [ ] `POST /api/qna/question/delete` - 删除成功

### 错误处理测试

- [ ] 网络错误时显示友好提示
- [ ] 401错误时提示重新登录
- [ ] 接口返回 `success: false` 时显示错误信息
- [ ] 空数据时页面不崩溃

### 边界情况测试

- [ ] 没有预设问题时页面正常
- [ ] 没有自定义问题时页面正常
- [ ] 所有问题都回答完毕后显示提示
- [ ] 提交空答案时显示验证提示

### 性能测试

- [ ] 问题列表加载时间 < 2秒
- [ ] 提交答案响应时间 < 3秒
- [ ] 历史记录加载时间 < 2秒

---

## 📞 联调协助

### 查看请求日志

在浏览器开发者工具中：
1. 打开 **Network** 标签
2. 筛选 **XHR** 或 **Fetch** 类型请求
3. 查看请求的：
   - URL（是否拼接到正确的后端地址）
   - Method（GET/POST）
   - Headers（是否包含 Authorization）
   - Request Payload（POST请求的数据）
   - Response（后端返回的数据）

### 查看控制台错误

在浏览器开发者工具中：
1. 打开 **Console** 标签
2. 查看是否有红色错误信息
3. 特别关注：
   - `Cannot read property 'xxx' of undefined` - 数据格式问题
   - `Network Error` - 网络连接问题
   - `401` 或 `403` - 认证问题
   - `404` - 接口不存在

### 调试技巧

1. **断点调试**：
   - 在 `pages/qna/index.vue` 的方法中添加 `console.log`
   - 在 `api/qna.js` 中添加日志输出

2. **模拟数据**：
   - 如果后端未就绪，可以临时修改代码使用 mock 数据
   - 在 `loadQuestionsFromServer` 方法中，如果请求失败，使用本地数据

3. **测试工具**：
   - 使用 Postman 测试后端接口
   - 使用 uni-app 的调试工具查看请求详情

---

## 🎯 联调完成标准

当以下所有项都通过时，说明联调成功：

✅ 所有6个接口都能正常调用并返回正确数据  
✅ 页面所有功能都能正常工作  
✅ 错误情况都有友好的提示  
✅ 用户体验流畅，无明显卡顿  
✅ 数据能正确同步到后端  
✅ 能正确显示对方答案  

---

**祝联调顺利！如有问题，请参考常见问题排查部分或联系后端开发人员。** 🚀

