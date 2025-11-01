# 甜蜜问答功能快速联调指南

## 🚀 5分钟快速开始

### 第一步：确认后端服务
```bash
# 确认后端服务地址（开发环境）
http://192.168.54.229:8080/lovetime
```

### 第二步：检查前端配置
已自动配置好以下接口路径：
- ✅ `GET /api/qna/questions` - 获取问题列表
- ✅ `POST /api/qna/answer/submit` - 提交答案
- ✅ `GET /api/qna/history` - 获取历史记录
- ✅ `POST /api/qna/question/add` - 添加自定义问题
- ✅ `POST /api/qna/question/delete` - 删除自定义问题

### 第三步：测试核心流程

#### 1. 打开页面
```
主页 → 点击"甜蜜问答" → 进入问答页面
```

#### 2. 查看网络请求
打开浏览器开发者工具（F12）→ Network 标签，查看：
- 页面加载时是否有 `GET /api/qna/questions` 请求
- 请求是否返回 200 状态码
- 响应数据格式是否正确

#### 3. 测试提交答案
- 输入答案 → 点击"提交答案"
- 查看是否有 `POST /api/qna/answer/submit` 请求
- 检查返回数据

### 第四步：验证数据格式

#### 问题列表响应格式
```json
{
  "success": true,
  "data": {
    "defaultQuestions": [
      { "id": 1, "text": "问题内容", "isDefault": true }
    ],
    "customQuestions": [
      { "id": 101, "text": "自定义问题", "isDefault": false }
    ]
  }
}
```

#### 提交答案响应格式
```json
{
  "success": true,
  "message": "提交成功",
  "data": {
    "answerId": 1001,
    "partnerAnswer": "对方的答案",
    "hasPartnerAnswered": true
  }
}
```

## ⚠️ 常见问题快速修复

### 问题：404 Not Found
**原因**：后端路由未配置  
**解决**：检查后端是否实现了对应接口

### 问题：401 Unauthorized
**原因**：Token未传递或过期  
**解决**：重新登录获取token

### 问题：数据格式错误
**原因**：后端返回格式与前端期望不一致  
**解决**：参考上面的数据格式要求修改后端

## 📋 快速测试清单

- [ ] 页面能正常加载问题
- [ ] 能成功提交答案
- [ ] 能查看历史记录
- [ ] 能添加自定义问题
- [ ] 能删除自定义问题

## 📚 详细文档

如需更详细的联调指南，请查看：`docs/QNA_DEBUGGING_GUIDE.md`

---

**提示**：如果遇到问题，请查看浏览器开发者工具的 Console 和 Network 标签获取详细错误信息。

