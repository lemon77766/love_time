# n8n 工作流问题分析与修复指南

## 🔍 问题分析

### 问题 1: 数据输出索引不匹配 ⚠️ **关键问题**

**原问题：**
- "处理电影数据1" 节点返回**两个输出项**：
  - **输出 0**：钉钉消息格式（`msgtype: "markdown"`）
  - **输出 1**：飞书记录格式（`records: [...]`）
- 但在连接配置中，"Code in JavaScript" 节点接收的是**索引 0**，实际应该接收**索引 1**

**修复方案：**
```json
"处理电影数据1": {
  "main": [
    [
      {
        "node": "推送钉钉群1",
        "type": "main",
        "index": 0  // 接收输出 0（钉钉消息）
      }
    ],
    [
      {
        "node": "Code in JavaScript",
        "type": "main",
        "index": 0  // 接收输出 1（飞书记录）
      }
    ]
  ]
}
```

### 问题 2: Code 节点数据获取方式错误

**原问题：**
```javascript
// ❌ 错误：使用 $input.all() 会获取所有输入项
const inputData = $input.all();
```

这会导致：
- 可能获取到钉钉消息数据（输出 0）
- 需要遍历查找正确的数据
- 逻辑复杂且容易出错

**修复方案：**
```javascript
// ✅ 正确：直接获取当前输入项
const inputData = $input.item.json;

// 检查数据格式
if (!inputData.records || !Array.isArray(inputData.records)) {
  console.error('未找到 records 数据');
  return [];
}
```

### 问题 3: 飞书节点 body 参数格式错误

**原问题：**
```json
"body": "={{\n  {\n    \"records\": JSON.stringify($json.records)\n  }\n}}"
```

这会导致：
- `$json.records` 已经是数组，再次 `JSON.stringify` 会变成字符串
- 飞书 API 需要的是对象数组，不是字符串

**修复方案：**
```json
"body": "={{ $json }}"
```

直接传递整个 JSON 对象，让 n8n 自动处理序列化。

## 🔧 修复后的关键改动

### 1. 连接配置修复

**修改前：**
```json
"处理电影数据1": {
  "main": [
    [
      {
        "node": "推送钉钉群1",
        "type": "main",
        "index": 0
      },
      {
        "node": "Code in JavaScript",
        "type": "main",
        "index": 0  // ❌ 错误：接收的是输出 0
      }
    ]
  ]
}
```

**修改后：**
```json
"处理电影数据1": {
  "main": [
    [
      {
        "node": "推送钉钉群1",
        "type": "main",
        "index": 0  // 输出 0 → 钉钉
      }
    ],
    [
      {
        "node": "Code in JavaScript",
        "type": "main",
        "index": 0  // ✅ 输出 1 → 飞书处理
      }
    ]
  ]
}
```

### 2. Code 节点代码修复

**修改前：**
```javascript
const inputData = $input.all();  // ❌ 获取所有输入
let movieRecords = [];
for (const item of inputData) {
  if (item.json && item.json.records) {
    movieRecords = item.json.records;
    break;
  }
}
```

**修改后：**
```javascript
const inputData = $input.item.json;  // ✅ 直接获取当前输入

if (!inputData.records || !Array.isArray(inputData.records)) {
  console.error('未找到 records 数据');
  return [];
}

const processedRecords = inputData.records.map(record => {
  // 处理逻辑...
});
```

### 3. 飞书节点 body 修复

**修改前：**
```json
"body": "={{\n  {\n    \"records\": JSON.stringify($json.records)\n  }\n}}"
```

**修改后：**
```json
"body": "={{ $json }}"
```

## 📋 工作流执行流程

修复后的正确流程：

```
1. 定时触发器（上午8点）
   ↓
2. 调用猫眼 API
   ↓
3. 处理电影数据（返回两个输出）
   ├─→ 输出 0 → 推送钉钉群
   └─→ 输出 1 → Code 节点处理
       ↓
4. Code 节点（格式化飞书数据）
   ↓
5. 飞书批量添加记录
```

## ✅ 验证步骤

1. **测试数据流：**
   - 在 "处理电影数据1" 节点后添加调试节点
   - 检查输出 0 是否包含钉钉消息格式
   - 检查输出 1 是否包含 records 数组

2. **测试 Code 节点：**
   - 查看控制台日志
   - 确认 `inputData.records` 存在且为数组

3. **测试飞书节点：**
   - 检查 body 参数格式
   - 确认 records 是数组而不是字符串

## 🚨 常见错误提示

如果仍然遇到错误，检查以下几点：

1. **"records is not defined"**
   - 检查连接配置，确保 Code 节点接收的是输出 1

2. **"Invalid JSON format"**
   - 检查飞书节点的 body 参数，不要使用 `JSON.stringify`

3. **"Empty records array"**
   - 检查 API 返回数据格式
   - 确认 `apiResponse.coming` 存在且有数据

## 📝 使用修复后的工作流

1. 复制 `n8n_workflow_fix.json` 的内容
2. 在 n8n 中导入工作流
3. 检查节点连接是否正确
4. 测试执行工作流


