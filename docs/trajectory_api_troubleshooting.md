# 轨迹API问题排查指南

## 🔴 常见错误：404 + "用户不存在"

### 错误现象
```
GET http://192.168.54.229:8080/lovetime/api/trajectory/location/current 404
响应: {success: false, message: "用户不存在"}
```

### 问题分析

#### 可能原因1：后端接口未实现 ⚠️ 最常见
- **症状**：后端返回404状态码，但响应体是JSON格式 `{success: false, message: "用户不存在"}`
- **原因**：后端接口路由 `/api/trajectory/location/current` 未实现或路由配置错误
- **解决**：检查后端路由配置，确保接口已实现

#### 可能原因2：Token中的用户在后端不存在
- **症状**：后端接口存在，但验证token时发现用户不存在
- **原因**：
  - Token中的 `openid` 或 `user_id` 在后端用户表中不存在
  - 用户数据被删除或迁移
  - Token格式正确但用户信息已失效
- **解决**：
  1. 检查后端用户表，确认token中的用户是否存在
  2. 检查token解析逻辑，确认提取的 `openid` 是否正确
  3. 如果用户确实不存在，应该引导用户重新登录

#### 可能原因3：后端验证逻辑问题
- **症状**：接口存在，用户也存在，但仍然返回"用户不存在"
- **原因**：
  - 后端验证token时，查询用户的条件错误
  - 数据库查询逻辑有问题
  - 用户状态检查过于严格（如检查用户是否激活、是否绑定伴侣等）
- **解决**：检查后端验证逻辑，确认查询条件是否正确

---

## 🔍 排查步骤

### 步骤1：检查后端接口是否实现

**后端检查清单：**

1. **路由配置**：
   ```java
   // Spring Boot示例
   @GetMapping("/api/trajectory/location/current")
   public ResponseEntity<?> getCurrentLocations(@RequestHeader("Authorization") String token) {
       // 实现逻辑
   }
   ```

2. **接口路径**：
   - 确认路径是否为：`/api/trajectory/location/current`
   - 确认请求方法是否为：`GET`
   - 确认是否需要认证（Authorization header）

3. **接口测试**：
   - 使用Postman或curl测试接口
   - 确认接口是否返回正确的响应

### 步骤2：检查Token解析

**前端Token信息：**
从错误日志中可以看到token：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJvcGVuaWQiOiJvZHNCQjF4SElHTXhqajkteFE2OTVHV0hEbXVzIiwic2Vzc2lvbl9rZXkiOiJvUGlaK1Y0S2dRc2lzMm5ZVjRFMU5nPT0iLCJzdWIiOiJvZHNCQjF4SElHTXhqajkteFE2OTVHV0hEbXVzIiwiaWF0IjoxNzYyMzI1MDM2LCJleHAiOjE3NjI5Mjk4MzZ9.XzuBz1PQIC8gCinMXE3fwannOZOL6_RpaGHAZh-0LDc
```

**后端应该：**
1. 解析JWT token，提取 `openid` 或 `sub` 字段
2. 根据 `openid` 查询用户表
3. 如果用户不存在，返回404 + "用户不存在"

**检查方法：**
```java
// 后端示例代码
String token = request.getHeader("Authorization").replace("Bearer ", "");
Claims claims = jwtUtil.parseToken(token);
String openid = claims.getSubject(); // 或 claims.get("openid")
User user = userService.findByOpenid(openid);
if (user == null) {
    return ResponseEntity.status(404).body(
        new ApiResponse(false, "用户不存在")
    );
}
```

### 步骤3：检查用户数据

**数据库检查：**
```sql
-- 检查用户是否存在（根据openid）
SELECT * FROM users WHERE openid = 'odsBB1xHIGMxjj9-xQ695GWHDmus';

-- 检查用户是否绑定伴侣
SELECT * FROM couples WHERE user_id = ? OR partner_id = ?;
```

**常见问题：**
- 用户表名不对
- `openid` 字段名不对
- 用户数据被删除
- 用户未激活或状态异常

### 步骤4：检查后端日志

**查看后端日志，确认：**
1. 接口是否被调用
2. Token解析是否成功
3. 用户查询是否返回结果
4. 错误发生在哪个环节

---

## ✅ 正确的后端实现建议

### 1. 接口路由配置

```java
@RestController
@RequestMapping("/api/trajectory")
public class TrajectoryController {
    
    @GetMapping("/location/current")
    public ResponseEntity<ApiResponse> getCurrentLocations(
        @RequestHeader("Authorization") String authHeader
    ) {
        try {
            // 1. 解析token
            String token = authHeader.replace("Bearer ", "");
            Claims claims = jwtUtil.parseToken(token);
            String openid = claims.getSubject();
            
            // 2. 查询用户
            User user = userService.findByOpenid(openid);
            if (user == null) {
                return ResponseEntity.status(404).body(
                    new ApiResponse(false, "用户不存在")
                );
            }
            
            // 3. 查询用户位置
            UserLocation myLocation = locationService.getCurrentLocation(user.getId());
            
            // 4. 查询伴侣位置
            Couple couple = coupleService.findByUserId(user.getId());
            UserLocation partnerLocation = null;
            if (couple != null) {
                Long partnerId = couple.getPartnerId(user.getId());
                partnerLocation = locationService.getCurrentLocation(partnerId);
            }
            
            // 5. 计算距离
            double distance = 0;
            if (myLocation != null && partnerLocation != null) {
                distance = LocationUtil.calculateDistance(
                    myLocation.getLatitude(), myLocation.getLongitude(),
                    partnerLocation.getLatitude(), partnerLocation.getLongitude()
                );
            }
            
            // 6. 返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("my_location", myLocation);
            data.put("partner_location", partnerLocation);
            data.put("distance", distance);
            data.put("distance_text", LocationUtil.formatDistance(distance));
            
            return ResponseEntity.ok(
                new ApiResponse(true, "获取成功", data)
            );
            
        } catch (JwtException e) {
            // Token无效
            return ResponseEntity.status(401).body(
                new ApiResponse(false, "Token无效")
            );
        } catch (Exception e) {
            // 其他错误
            return ResponseEntity.status(500).body(
                new ApiResponse(false, "服务器错误: " + e.getMessage())
            );
        }
    }
}
```

### 2. 错误处理建议

**对于位置API，建议：**
- 如果用户不存在，返回404 + "用户不存在"（前端已处理，不会跳转登录）
- 如果用户未绑定伴侣，`partner_location` 应为 `null`，不返回错误
- 如果双方都未上传位置，`my_location` 和 `partner_location` 都为 `null`，`distance` 为 0

**错误响应格式：**
```json
{
  "success": false,
  "message": "用户不存在"
}
```

**成功响应格式：**
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
    "partner_location": null,  // 如果对方未上传位置，为null
    "distance": 0,              // 如果无法计算距离，为0
    "distance_text": "0米"
  }
}
```

---

## 🧪 测试方法

### 1. 使用Postman测试

```http
GET http://192.168.54.229:8080/lovetime/api/trajectory/location/current
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJvcGVuaWQiOiJvZHNCQjF4SElHTXhqajkteFE2OTVHV0hEbXVzIiwic2Vzc2lvbl9rZXkiOiJvUGlaK1Y0S2dRc2lzMm5ZVjRFMU5nPT0iLCJzdWIiOiJvZHNCQjF4SElHTXhqajkteFE2OTVHV0hEbXVzIiwiaWF0IjoxNzYyMzI1MDM2LCJleHAiOjE3NjI5Mjk4MzZ9.XzuBz1PQIC8gCinMXE3fwannOZOL6_RpaGHAZh-0LDc
```

### 2. 检查后端日志

确认：
- 接口是否被调用
- Token解析结果
- 用户查询结果
- 返回的数据

### 3. 前端调试

在浏览器控制台查看：
- 请求URL是否正确
- Token是否正确传递
- 响应数据格式

---

## 📝 临时解决方案

如果后端接口暂时未实现，前端会优雅处理：
- 不会跳转登录
- 不会显示错误提示
- 位置功能会静默失败，但不影响页面其他功能

**建议：**
1. 尽快实现后端接口
2. 如果接口已实现但仍然报错，按照上述步骤排查
3. 如果用户确实不存在，引导用户重新登录

---

## 🔗 相关文档

- [轨迹API需求文档](./trajectory_api_requirements.md)
- [后端API文档](../BACKEND_API.md)
- [登录流程文档](../LOGIN_README.md)


