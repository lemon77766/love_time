# 双人绑定情侣关系功能设计文档

## 📋 功能概述

实现双人绑定情侣关系功能，使两个用户能够建立情侣关系，共享数据并支持后续功能的协同使用。

---

## 🎯 核心需求

1. **绑定关系建立**：支持两个用户之间建立唯一的情侣关系
2. **绑定状态管理**：查询、更新、解绑关系状态
3. **数据共享基础**：为后续功能提供关系查询能力
4. **用户体验优化**：简单易用的绑定流程

---

## 🔄 实现流程设计

### 方案一：邀请码绑定（推荐）

#### 流程说明

```
用户A（发起方）                用户B（接受方）
    │                             │
    │ 1. 点击"绑定情侣"            │
    │ 2. 生成唯一邀请码             │
    │ 3. 分享邀请码给用户B          │
    │                             │
    │ ←─────────────────────────── │ 4. 输入邀请码
    │                             │ 5. 查看用户A信息
    │                             │ 6. 确认绑定
    │                             │
    │ ←─────────────────────────── │ 7. 发送绑定请求到后端
    │                             │
    │ 8. 收到绑定通知              │
    │ 9. 确认接受绑定              │
    │                             │
    │ ←─────────────────────────── │ 10. 后端建立关系
    │                             │
    │ 11. 双方关系建立成功          │
    │ 12. 更新本地状态             │
    │                             │
```

#### 详细步骤

1. **生成邀请码**
   - 用户A点击"绑定情侣"
   - 系统生成唯一邀请码（6位字母数字组合，有效期24小时）
   - 展示邀请码，支持复制和分享

2. **输入邀请码**
   - 用户B输入邀请码
   - 系统验证邀请码有效性
   - 显示邀请方（用户A）的信息（昵称、头像）

3. **确认绑定**
   - 用户B确认绑定
   - 系统发送绑定请求到后端
   - 后端验证双方是否已有关系

4. **接受绑定**
   - 用户A收到绑定通知（可通过消息推送或页面提示）
   - 用户A确认接受
   - 后端建立关系记录

5. **关系建立**
   - 后端保存关系数据
   - 双方客户端更新本地状态
   - 首页显示对方信息

---

### 方案二：扫码绑定

1. 用户A生成绑定二维码
2. 用户B扫码确认
3. 后续流程同方案一

---

## 📊 数据结构设计

### 1. 本地存储结构

```javascript
// uni.getStorageSync('couple_info')
{
  isBound: true,                    // 是否已绑定
  coupleId: "couple_123456",        // 关系ID
  partnerId: "user_789",            // 对方用户ID
  partnerInfo: {                     // 对方用户信息
    userId: "user_789",
    nickName: "对方昵称",
    avatarUrl: "头像URL",
    displayName: "显示昵称",
    displayAvatar: "显示头像"
  },
  bindTime: "2024-01-15T10:30:00Z", // 绑定时间
  anniversaryDate: "2024-01-15",    // 纪念日（可自定义）
  role: "initiator" | "accepter",   // 角色：发起者/接受者
  inviteCode: "ABC123",             // 当前邀请码（仅发起方有）
  inviteCodeExpire: "2024-01-16T10:30:00Z" // 邀请码过期时间
}
```

### 2. 后端数据库结构

```sql
-- 情侣关系表
CREATE TABLE couple_relationship (
  id VARCHAR(50) PRIMARY KEY,
  user1_id VARCHAR(50) NOT NULL,        -- 用户1 ID
  user2_id VARCHAR(50) NOT NULL,        -- 用户2 ID
  initiator_id VARCHAR(50) NOT NULL,     -- 发起方ID
  status ENUM('pending', 'active', 'dissolved') DEFAULT 'pending',
  bind_time DATETIME,                   -- 绑定时间
  anniversary_date DATE,                 -- 纪念日
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW(),
  UNIQUE KEY unique_relationship (user1_id, user2_id)
);

-- 邀请码表
CREATE TABLE invite_code (
  code VARCHAR(20) PRIMARY KEY,
  creator_id VARCHAR(50) NOT NULL,       -- 创建者ID
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  expire_at DATETIME NOT NULL,          -- 过期时间
  used_by VARCHAR(50),                  -- 使用人ID
  used_at DATETIME,                     -- 使用时间
  created_at DATETIME DEFAULT NOW()
);
```

---

## 🔌 API接口设计

### 1. 生成邀请码

**接口**：`POST /api/couple/invite/create`

**请求参数**：
```json
{
  "userId": "user_123"
}
```

**响应**：
```json
{
  "success": true,
  "message": "邀请码生成成功",
  "data": {
    "inviteCode": "ABC123",
    "expireAt": "2024-01-16T10:30:00Z"
  }
}
```

### 2. 验证邀请码

**接口**：`GET /api/couple/invite/validate?code=ABC123`

**响应**：
```json
{
  "success": true,
  "message": "邀请码有效",
  "data": {
    "code": "ABC123",
    "creator": {
      "userId": "user_123",
      "nickName": "用户昵称",
      "avatarUrl": "头像URL",
      "displayName": "显示昵称",
      "displayAvatar": "显示头像"
    },
    "expireAt": "2024-01-16T10:30:00Z"
  }
}
```

### 3. 创建绑定请求

**接口**：`POST /api/couple/bind/create`

**请求参数**：
```json
{
  "inviteCode": "ABC123",
  "accepterId": "user_789"
}
```

**响应**：
```json
{
  "success": true,
  "message": "绑定请求已发送，等待对方确认",
  "data": {
    "bindRequestId": "request_456",
    "status": "pending"
  }
}
```

### 4. 确认绑定（双方）

**接口**：`POST /api/couple/bind/confirm`

**请求参数**：
```json
{
  "bindRequestId": "request_456",
  "userId": "user_123",
  "confirm": true
}
```

**响应**：
```json
{
  "success": true,
  "message": "绑定成功",
  "data": {
    "coupleId": "couple_123456",
    "partnerInfo": {
      "userId": "user_789",
      "nickName": "对方昵称",
      "avatarUrl": "头像URL"
    },
    "bindTime": "2024-01-15T10:30:00Z"
  }
}
```

### 5. 查询绑定状态

**接口**：`GET /api/couple/status`

**响应**：
```json
{
  "success": true,
  "data": {
    "isBound": true,
    "coupleId": "couple_123456",
    "partnerInfo": {
      "userId": "user_789",
      "nickName": "对方昵称",
      "avatarUrl": "头像URL",
      "displayName": "显示昵称",
      "displayAvatar": "显示头像"
    },
    "bindTime": "2024-01-15T10:30:00Z",
    "anniversaryDate": "2024-01-15",
    "role": "initiator"
  }
}
```

### 6. 解绑关系

**接口**：`POST /api/couple/unbind`

**请求参数**：
```json
{
  "coupleId": "couple_123456",
  "userId": "user_123"
}
```

**响应**：
```json
{
  "success": true,
  "message": "解绑成功"
}
```

### 7. 更新纪念日

**接口**：`PUT /api/couple/anniversary`

**请求参数**：
```json
{
  "coupleId": "couple_123456",
  "anniversaryDate": "2024-01-15"
}
```

**响应**：
```json
{
  "success": true,
  "message": "纪念日更新成功"
}
```

---

## 📱 前端实现规划

### 1. 文件结构

```
pages/
  couple/                    # 情侣绑定相关页面
    bind.vue                 # 绑定主页面（生成/输入邀请码）
    confirm.vue              # 确认绑定页面
    status.vue               # 绑定状态页面

api/
  couple.js                  # 情侣绑定API

utils/
  couple.js                  # 情侣关系工具函数
```

### 2. 页面功能

#### `pages/couple/bind.vue`
- 显示当前绑定状态
- 生成邀请码（未绑定时）
- 输入邀请码（未绑定时）
- 查看对方信息（已绑定时）
- 解绑功能（已绑定时）

#### `pages/couple/confirm.vue`
- 显示对方信息
- 确认/拒绝绑定请求

#### `pages/couple/status.vue`
- 显示绑定状态详情
- 设置纪念日
- 解绑功能

### 3. 工具函数

#### `utils/couple.js`
- `getCoupleInfo()` - 获取本地情侣信息
- `isBound()` - 检查是否已绑定
- `getPartnerInfo()` - 获取对方信息
- `saveCoupleInfo()` - 保存情侣信息
- `clearCoupleInfo()` - 清除情侣信息

### 4. API封装

#### `api/couple.js`
- `createInviteCode()` - 生成邀请码
- `validateInviteCode()` - 验证邀请码
- `createBindRequest()` - 创建绑定请求
- `confirmBind()` - 确认绑定
- `getCoupleStatus()` - 查询绑定状态
- `unbind()` - 解绑
- `updateAnniversary()` - 更新纪念日

---

## 🎨 UI/UX设计要点

### 1. 绑定入口

- **个人资料页面**：添加"情侣绑定"入口
- **首页**：如果未绑定，显示"立即绑定"提示
- **导航栏**：可以考虑添加绑定状态图标

### 2. 绑定流程页面

- **邀请码展示**：大号字体，易于复制
- **二维码展示**：可选方案，美化二维码样式
- **对方信息预览**：头像+昵称，清晰展示
- **状态提示**：清晰的步骤提示和状态反馈

### 3. 已绑定状态

- **首页显示**：双方头像、昵称、纪念日
- **状态页面**：详细信息展示
- **操作按钮**：解绑、修改纪念日等

---

## 🔒 安全考虑

1. **邀请码安全**
   - 有效期限制（24小时）
   - 一次性使用（使用后失效）
   - 防止重复使用

2. **绑定验证**
   - 双方都需要确认
   - 防止自己绑定自己
   - 防止重复绑定（同一用户只能有一个关系）

3. **数据隐私**
   - 只在建立关系后显示对方信息
   - 解绑后清除相关数据
   - 后端验证用户身份

---

## 📝 实现步骤建议

### 阶段一：基础功能
1. ✅ 创建API接口文件
2. ✅ 创建工具函数文件
3. ✅ 实现绑定主页面
4. ✅ 实现后端接口对接（或模拟）

### 阶段二：状态管理
1. ✅ 实现绑定状态查询
2. ✅ 更新首页显示
3. ✅ 实现状态页面

### 阶段三：完善功能
1. ✅ 解绑功能
2. ✅ 纪念日设置
3. ✅ 消息通知（可选）

### 阶段四：优化体验
1. ✅ 错误处理优化
2. ✅ 加载状态优化
3. ✅ 动画效果（可选）

---

## 💡 扩展功能建议

1. **绑定记录**：查看绑定历史
2. **绑定提醒**：纪念日提醒
3. **关系标签**：自定义关系名称
4. **多人关系**：支持友情关系等（未来扩展）

---

## 🔗 与其他功能的关联

1. **首页显示**：需要读取绑定状态显示对方信息
2. **数据共享**：后续功能可通过 `coupleId` 查询共享数据
3. **权限控制**：某些功能可能需要双方都绑定后才能使用

---

## 📌 注意事项

1. **向后兼容**：确保未绑定用户也能正常使用其他功能
2. **错误处理**：网络错误、邀请码失效等情况要有友好提示
3. **数据同步**：本地状态与后端状态要保持一致
4. **测试场景**：单人测试、双人测试、异常场景测试

---

## 📚 参考资料

- 微信小程序分享功能
- 二维码生成库（如需要）
- 日期计算工具

---

**文档版本**：v1.0  
**最后更新**：2024-01-15  
**维护者**：开发团队


