# 甜蜜问答 API 集成指南

## 📝 概述

本文档说明如何将甜蜜问答功能与后端API进行集成。主要涉及以下功能点：

1. ✅ 加载问题列表（预设问题 + 自定义问题）
2. ✅ 提交答案
3. ✅ 获取对方答案
4. ✅ 查看历史记录
5. ✅ 添加自定义问题
6. ✅ 删除自定义问题

---

## 🎯 按钮事件与API映射关系

根据你提供的截图，以下是各个按钮对应的API调用时机：

| 用户操作 | 触发按钮 | 调用API | 说明 |
|---------|---------|---------|------|
| 页面加载 | - | `getQuestions()` | 获取所有问题（预设+自定义） |
| 点击"提交答案" | 提交答案按钮 | `submitAnswer()` | 提交我的答案，同时获取对方答案 |
| 点击"下一题" | 下一题按钮 | 无需调用API | 仅前端切换到下一个问题 |
| 点击"历史回答" | 历史回答悬浮按钮 | `getHistory()` | 获取所有历史回答记录 |
| 点击"添加问题" | 自定义问题弹窗中的添加按钮 | `addCustomQuestion()` | 添加新的自定义问题 |
| 点击"删除" | 自定义问题列表的删除按钮 | `deleteCustomQuestion()` | 删除指定的自定义问题 |

---

## 📦 前期准备工作（已完成）

### 1. API配置文件更新 ✅
文件路径：`utils/config.js`

已添加问答相关API路径配置：
```javascript
QNA: {
  LIST: '/api/qna/questions',          // 获取问题列表
  SUBMIT: '/api/qna/answer/submit',    // 提交答案
  HISTORY: '/api/qna/history',         // 获取历史记录
  PARTNER_ANSWER: '/api/qna/partner',  // 获取对方答案
  ADD_QUESTION: '/api/qna/question/add', // 添加自定义问题
  DELETE_QUESTION: '/api/qna/question/delete' // 删除自定义问题
}
```

### 2. API接口文件创建 ✅
文件路径：`api/qna.js`

已创建所有问答相关的API函数：
- `getQuestions()` - 获取问题列表
- `submitAnswer(answerData)` - 提交答案
- `getHistory(params)` - 获取历史记录
- `getPartnerAnswer(questionId)` - 获取对方答案
- `addCustomQuestion(questionText)` - 添加自定义问题
- `deleteCustomQuestion(questionId)` - 删除自定义问题

---

## 🔧 下一步：修改 qna 页面代码

### 需要修改的文件
文件路径：`pages/qna/index.vue`

### 主要修改点

#### 1. 导入API函数
在 `<script>` 开头添加：
```javascript
import { 
  getQuestions, 
  submitAnswer, 
  getHistory, 
  addCustomQuestion, 
  deleteCustomQuestion 
} from '@/api/qna.js';
```

#### 2. 修改 `onLoad` 生命周期
```javascript
async onLoad(options) {
  // 从后端加载问题列表
  await this.loadQuestionsFromServer();
  // 从后端加载历史记录
  await this.loadHistoryFromServer();
  
  // ... 其他逻辑保持不变
}
```

#### 3. 新增方法：从后端加载问题列表
```javascript
async loadQuestionsFromServer() {
  try {
    uni.showLoading({ title: '加载中...' });
    const res = await getQuestions();
    if (res.success) {
      this.defaultQuestions = res.data.defaultQuestions || [];
      this.customQuestions = res.data.customQuestions || [];
    }
  } catch (e) {
    console.error('加载问题失败', e);
    uni.showToast({ title: '加载问题失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}
```

#### 4. 新增方法：从后端加载历史记录
```javascript
async loadHistoryFromServer() {
  try {
    const res = await getHistory({ page: 1, pageSize: 100 });
    if (res.success) {
      this.history = res.data.list || [];
    }
  } catch (e) {
    console.error('加载历史记录失败', e);
  }
}
```

#### 5. 修改 `submitAnswer` 方法（重要！）
```javascript
async submitAnswer() {
  if (!this.myAnswer) {
    uni.showToast({ title: '请填写你的答案', icon: 'none' });
    return;
  }
  if (this.currentQuestion.id === 0) {
    uni.showToast({ title: '所有问题已回答完毕', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    // 调用后端API提交答案
    const res = await submitAnswer({
      questionId: this.currentQuestion.id,
      answer: this.myAnswer,
      questionText: this.currentQuestion.text
    });
    
    if (res.success) {
      // 如果对方已回答，显示对方答案
      if (res.data.hasPartnerAnswered) {
        this.partnerAnswer = res.data.partnerAnswer;
      }
      
      // 添加到本地历史记录（可选，也可以重新从后端加载）
      const record = {
        questionId: this.currentQuestion.id,
        question: this.currentQuestion.text,
        myAnswer: this.myAnswer,
        partnerAnswer: res.data.partnerAnswer || '',
        time: new Date().toLocaleString()
      };
      this.history.unshift(record);
      
      uni.showToast({ title: '提交成功', icon: 'success' });
      
      // 提交后自动跳到下一题
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
    }
  } catch (e) {
    console.error('提交答案失败', e);
    uni.showToast({ title: '提交失败，请重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}
```

#### 6. 修改 `addCustomQuestion` 方法
```javascript
async addCustomQuestion() {
  if (!this.newQuestion || !this.newQuestion.trim()) {
    uni.showToast({ title: '请输入问题内容', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: '添加中...' });
    
    // 调用后端API添加问题
    const res = await addCustomQuestion(this.newQuestion.trim());
    
    if (res.success) {
      // 将新问题添加到列表
      this.customQuestions.push(res.data);
      this.newQuestion = '';
      uni.showToast({ title: '问题添加成功', icon: 'success' });
    }
  } catch (e) {
    console.error('添加问题失败', e);
    uni.showToast({ title: '添加失败，请重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}
```

#### 7. 修改 `deleteCustomQuestion` 方法
```javascript
async deleteCustomQuestion(index) {
  const question = this.customQuestions[index];
  
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个问题吗？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        try {
          uni.showLoading({ title: '删除中...' });
          
          // 调用后端API删除问题
          const res = await deleteCustomQuestion(question.id);
          
          if (res.success) {
            // 从列表中移除
            this.customQuestions.splice(index, 1);
            uni.showToast({ title: '已删除', icon: 'success' });
          }
        } catch (e) {
          console.error('删除问题失败', e);
          uni.showToast({ title: '删除失败，请重试', icon: 'none' });
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
}
```

---

## 🔐 后端接口规范

### 1. 获取问题列表
**接口地址**：`GET /api/qna/questions`  
**请求头**：需携带 `Authorization: Bearer {token}`  
**返回示例**：
```json
{
  "success": true,
  "data": {
    "defaultQuestions": [
      { "id": 1, "text": "我们第一次约会的地点是哪里？", "isDefault": true },
      { "id": 2, "text": "你最喜欢我做的哪道菜？", "isDefault": true }
    ],
    "customQuestions": [
      { "id": 101, "text": "你最想去哪里旅游？", "isDefault": false, "userId": "user123" }
    ]
  }
}
```

### 2. 提交答案
**接口地址**：`POST /api/qna/answer/submit`  
**请求头**：需携带 `Authorization: Bearer {token}`  
**请求体**：
```json
{
  "questionId": 1,
  "answer": "那家有你最爱奶茶的小广场",
  "questionText": "我们第一次约会的地点是哪里？"
}
```
**返回示例**：
```json
{
  "success": true,
  "message": "提交成功",
  "data": {
    "answerId": 1001,
    "partnerAnswer": "是那个有秋千的公园吧～",
    "hasPartnerAnswered": true
  }
}
```

### 3. 获取历史记录
**接口地址**：`GET /api/qna/history?page=1&pageSize=20`  
**请求头**：需携带 `Authorization: Bearer {token}`  
**返回示例**：
```json
{
  "success": true,
  "data": {
    "total": 15,
    "list": [
      {
        "id": 1001,
        "questionId": 1,
        "question": "我们第一次约会的地点是哪里？",
        "myAnswer": "那家有你最爱奶茶的小广场",
        "partnerAnswer": "是那个有秋千的公园吧～",
        "createdAt": "2025-10-29T10:30:00Z",
        "updatedAt": "2025-10-29T10:35:00Z"
      }
    ]
  }
}
```

### 4. 添加自定义问题
**接口地址**：`POST /api/qna/question/add`  
**请求头**：需携带 `Authorization: Bearer {token}`  
**请求体**：
```json
{
  "text": "你最想去哪里旅游？"
}
```
**返回示例**：
```json
{
  "success": true,
  "message": "添加成功",
  "data": {
    "id": 101,
    "text": "你最想去哪里旅游？",
    "isDefault": false,
    "userId": "user123",
    "createdAt": "2025-10-29T10:40:00Z"
  }
}
```

### 5. 删除自定义问题
**接口地址**：`POST /api/qna/question/delete`  
**请求头**：需携带 `Authorization: Bearer {token}`  
**请求体**：
```json
{
  "questionId": 101
}
```
**返回示例**：
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## ⚠️ 注意事项

1. **Token认证**：所有API请求都需要携带登录后获取的token，已在 `utils/http.js` 中统一处理
2. **错误处理**：建议在每个API调用处添加 try-catch 错误处理
3. **加载状态**：提交答案、添加/删除问题时显示loading提示，提升用户体验
4. **本地缓存策略**：可以保留部分本地缓存逻辑作为降级方案（当网络请求失败时）
5. **数据同步**：提交答案后可选择：
   - 方案A：重新调用 `getHistory()` 从后端获取最新历史记录
   - 方案B：将后端返回的数据添加到本地 `history` 数组

---

## 📌 下一步行动

1. ✅ **已完成**：创建 `api/qna.js` 和更新 `utils/config.js`
2. 🔄 **待完成**：根据上述指南修改 `pages/qna/index.vue`
3. 🔄 **待完成**：后端实现对应的6个API接口
4. 🔄 **待完成**：联调测试所有功能

---

## 🤝 后端需要实现的接口清单

请将以下接口清单交给后端开发人员：

- [ ] `GET /api/qna/questions` - 获取问题列表
- [ ] `POST /api/qna/answer/submit` - 提交答案
- [ ] `GET /api/qna/history` - 获取历史记录
- [ ] `GET /api/qna/partner` - 获取对方答案（可选，可合并到submit接口）
- [ ] `POST /api/qna/question/add` - 添加自定义问题
- [ ] `POST /api/qna/question/delete` - 删除自定义问题

所有接口需要：
- 验证用户token
- 返回统一的JSON格式
- 处理错误情况并返回友好的错误信息
