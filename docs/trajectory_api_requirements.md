# 轨迹页面功能实现与后端接口需求

## 📋 目录
- [已实现功能](#已实现功能)
- [后端接口需求](#后端接口需求)
- [接口详细说明](#接口详细说明)
- [数据模型](#数据模型)

---

## ✅ 已实现功能

### 1. **实时位置功能** ⭐ 已对接后端
- ✅ 显示我的位置（地址、更新时间）
- ✅ 显示对方位置（地址、更新时间）
- ✅ 计算并显示双方距离（自动格式化：米/公里）
- ✅ 手动刷新位置
- ✅ 定位追踪开关（开启后每5分钟自动上传位置）
- ✅ 定位权限检查与引导
- ✅ 错误处理（用户不存在时不跳转登录）

### 2. **轨迹点展示功能** ⚠️ 部分实现（使用静态数据）
- ✅ 在地图上显示轨迹点
- ✅ 点击轨迹点查看详情（标题、日期、描述、图片）
- ✅ 添加轨迹点UI（表单已实现）
- ❌ **未对接后端**：添加轨迹点只是添加到本地数组，未调用API
- ❌ **未对接后端**：轨迹点列表未从后端加载，使用静态数据

### 3. **UI/UX功能**
- ✅ 自定义导航栏（适配状态栏高度）
- ✅ 实时位置卡片展示
- ✅ 地图背景（静态图片）
- ✅ 轨迹点标记与连线
- ✅ 弹窗交互（详情、添加）
- ✅ 响应式布局

---

## 🔌 后端接口需求

### ⚠️ 必须实现的接口（已在前端调用）

#### 1. **上传/更新用户位置** ✅ 已调用
- **接口路径**: `POST /api/trajectory/location/update`
- **请求头**: 需携带 `Authorization: Bearer {token}`
- **请求参数**:
  ```json
  {
    "latitude": 39.9042,      // 纬度（必填，number）
    "longitude": 116.4074,    // 经度（必填，number）
    "address": "北京市朝阳区xxx",  // 地址（可选，string）
    "location_name": "咖啡厅"     // 地点名称（可选，string）
  }
  ```
- **返回数据**:
  ```json
  {
    "success": true,
    "message": "位置更新成功",
    "data": {
      "location_id": 123,
      "update_time": "2024-01-01T12:00:00.000Z"
    }
  }
  ```
- **错误处理**:
  - 401: 未授权（会自动跳转登录）
  - 404 + "用户不存在": 位置API会静默失败，不跳转登录
  - 其他错误: 返回错误信息

#### 2. **获取双方实时位置** ✅ 已调用
- **接口路径**: `GET /api/trajectory/location/current`
- **请求头**: 需携带 `Authorization: Bearer {token}`
- **请求参数**: 无
- **返回数据**:
  ```json
  {
    "success": true,
    "data": {
      "my_location": {
        "user_id": 1,
        "latitude": 39.9042,
        "longitude": 116.4074,
        "address": "北京市朝阳区xxx",
        "location_name": "当前位置",
        "update_time": "2024-01-01T12:00:00.000Z"
      },
      "partner_location": {
        "user_id": 2,
        "latitude": 39.9142,
        "longitude": 116.4174,
        "address": "北京市海淀区xxx",
        "location_name": "对方位置",
        "update_time": "2024-01-01T11:55:00.000Z"
      },
      "distance": 1.5,              // 双方距离（公里，number）
      "distance_text": "1.5公里"     // 格式化距离（可选，string）
    }
  }
  ```
- **特殊情况**:
  - 如果对方未上传位置，`partner_location` 应为 `null`
  - 如果双方都未上传位置，可以返回错误或空数据

---

### 📝 需要实现的接口（前端已定义但未使用）

#### 3. **获取轨迹点列表** ⚠️ 未使用（建议实现）
- **接口路径**: `GET /api/trajectory/points`
- **请求头**: 需携带 `Authorization: Bearer {token}`
- **请求参数**（Query参数）:
  ```
  period=7d          // 时间范围：'7d'（7天）或 '30d'（30天），默认 '7d'
  page=1             // 页码（可选，默认1）
  limit=50           // 每页数量（可选，默认50）
  ```
- **返回数据**:
  ```json
  {
    "success": true,
    "data": {
      "points": [
        {
          "id": 1,
          "user_id": 1,
          "latitude": 39.9042,
          "longitude": 116.4074,
          "address": "北京市朝阳区xxx",
          "location_name": "初遇咖啡厅",
          "visit_time": "2023-03-15T10:00:00.000Z",
          "stay_duration": 120,           // 停留时长（分钟）
          "importance_score": 9.5,        // 重要性评分（0-10）
          "visit_count": 1,               // 到访次数
          "is_manual": true,              // 是否手动添加
          "description": "第一次见面的地方",
          "photos": ["/path/to/photo1.jpg"]
        }
      ],
      "summary": {
        "total_points": 10,
        "total_distance": 50.5,           // 总行程（公里）
        "most_visited": {
          "location_name": "初遇咖啡厅",
          "visit_count": 5
        }
      }
    }
  }
  ```

#### 4. **手动添加轨迹点** ⚠️ 未使用（建议实现）
- **接口路径**: `POST /api/trajectory/points`
- **请求头**: 需携带 `Authorization: Bearer {token}`
- **请求参数**:
  ```json
  {
    "latitude": 39.9042,              // 纬度（必填，number）
    "longitude": 116.4074,            // 经度（必填，number）
    "address": "北京市朝阳区xxx",      // 地址（可选，string）
    "location_name": "初遇咖啡厅",      // 地点名称（必填，string）
    "visit_time": "2023-03-15T10:00:00.000Z",  // 到访时间（可选，ISO格式，默认当前时间）
    "description": "第一次见面的地方",   // 描述（可选，string）
    "photos": ["/path/to/photo1.jpg"]  // 照片列表（可选，string[]）
  }
  ```
- **返回数据**:
  ```json
  {
    "success": true,
    "message": "轨迹点添加成功",
    "data": {
      "point_id": 123,
      "importance_score": 10.0          // 手动添加的默认高分
    }
  }
  ```

#### 5. **获取轨迹统计信息** ⚠️ 未使用（可选）
- **接口路径**: `GET /api/trajectory/statistics`
- **请求头**: 需携带 `Authorization: Bearer {token}`
- **请求参数**（Query参数）:
  ```
  period=7d    // 时间范围：'7d' 或 '30d'，默认 '7d'
  ```
- **返回数据**:
  ```json
  {
    "success": true,
    "data": {
      "total_points": 10,
      "total_distance": 50.5,              // 总行程（公里）
      "avg_daily_points": 1.4,               // 平均每日轨迹点数
      "most_visited_location": {
        "name": "初遇咖啡厅",
        "count": 5,
        "latitude": 39.9042,
        "longitude": 116.4074
      },
      "trajectory_heatmap": [                // 轨迹热力图数据（可选）
        {
          "latitude": 39.9042,
          "longitude": 116.4074,
          "intensity": 0.8                   // 热度值 0-1
        }
      ]
    }
  }
  ```

---

## 📊 数据模型

### 位置数据表（建议）
```sql
CREATE TABLE user_locations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,                    -- 用户ID
  latitude DECIMAL(10, 8) NOT NULL,            -- 纬度
  longitude DECIMAL(11, 8) NOT NULL,           -- 经度
  address VARCHAR(255),                        -- 地址
  location_name VARCHAR(100),                  -- 地点名称
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
  INDEX idx_user_id (user_id),
  INDEX idx_update_time (update_time)
);
```

### 轨迹点数据表（建议）
```sql
CREATE TABLE trajectory_points (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,                     -- 用户ID
  latitude DECIMAL(10, 8) NOT NULL,            -- 纬度
  longitude DECIMAL(11, 8) NOT NULL,           -- 经度
  address VARCHAR(255),                        -- 地址
  location_name VARCHAR(100) NOT NULL,         -- 地点名称
  visit_time DATETIME NOT NULL,                -- 到访时间
  stay_duration INT DEFAULT 0,                 -- 停留时长（分钟）
  importance_score DECIMAL(3, 1) DEFAULT 0,     -- 重要性评分（0-10）
  visit_count INT DEFAULT 1,                   -- 到访次数
  is_manual BOOLEAN DEFAULT FALSE,             -- 是否手动添加
  description TEXT,                            -- 描述
  photos JSON,                                  -- 照片列表（JSON数组）
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_visit_time (visit_time),
  INDEX idx_importance_score (importance_score)
);
```

---

## 🔄 前端调用逻辑

### 实时位置功能流程
1. **页面加载时**:
   - 检查定位权限
   - 获取当前位置并上传 → `POST /api/trajectory/location/update`
   - 加载双方位置 → `GET /api/trajectory/location/current`

2. **开启定位追踪后**:
   - 每5分钟自动调用 `POST /api/trajectory/location/update`
   - 每次上传后自动调用 `GET /api/trajectory/location/current` 刷新双方位置

3. **手动刷新位置**:
   - 获取当前位置并上传 → `POST /api/trajectory/location/update`
   - 加载双方位置 → `GET /api/trajectory/location/current`

### 轨迹点功能流程（当前未对接）
1. **页面加载时**:
   - ❌ 应调用 `GET /api/trajectory/points` 加载轨迹点列表
   - 当前：使用静态数据

2. **添加轨迹点时**:
   - ❌ 应调用 `POST /api/trajectory/points` 保存到后端
   - 当前：只添加到本地数组，刷新后丢失

---

## ⚠️ 注意事项

### 1. 用户关系
- 后端需要根据 token 中的用户ID，找到对应的伴侣（couple关系）
- 如果用户未绑定伴侣，`partner_location` 应为 `null`

### 2. 距离计算
- 前端会计算距离，但建议后端也返回计算好的距离
- 使用 Haversine 公式计算两点间距离（公里）

### 3. 坐标系
- 前端使用 `gcj02` 坐标系（腾讯地图/高德地图）
- 后端存储和计算时需保持一致

### 4. 错误处理
- 位置相关API（`/api/trajectory/location/*`）在遇到"用户不存在"错误时，前端不会自动跳转登录
- 其他API遇到"用户不存在"错误时，会清除登录信息并跳转登录页

### 5. 性能优化建议
- 位置更新接口可以合并更新（如果用户位置变化小于50米，可以忽略）
- 轨迹点列表建议支持分页，避免一次性加载过多数据
- 可以考虑缓存最近的位置信息，减少数据库查询

---

## 📝 优先级建议

### 🔴 高优先级（必须实现）
1. ✅ `POST /api/trajectory/location/update` - 上传位置（已调用）
2. ✅ `GET /api/trajectory/location/current` - 获取双方位置（已调用）

### 🟡 中优先级（建议实现）
3. `GET /api/trajectory/points` - 获取轨迹点列表（替换静态数据）
4. `POST /api/trajectory/points` - 添加轨迹点（完善添加功能）

### 🟢 低优先级（可选实现）
5. `GET /api/trajectory/statistics` - 获取统计信息（用于未来扩展）

---

## 🧪 测试建议

### 测试场景
1. **正常流程**:
   - 用户A上传位置 → 用户B查看，应能看到用户A的位置和距离
   - 开启定位追踪 → 验证每5分钟自动上传
   - 手动刷新位置 → 验证位置更新

2. **边界情况**:
   - 用户未绑定伴侣 → 应返回 `partner_location: null`
   - 用户从未上传位置 → 应返回 `my_location: null` 或错误
   - Token过期 → 应返回401错误
   - 用户不存在 → 应返回404错误（位置API不跳转登录）

3. **数据验证**:
   - 经纬度范围验证（纬度：-90~90，经度：-180~180）
   - 必填字段验证
   - 时间格式验证

---

## 📚 相关文件

- 前端页面: `pages/trajectory/index.vue`
- API定义: `api/trajectory.js`
- HTTP配置: `utils/http.js`
- API配置: `utils/config.js`


