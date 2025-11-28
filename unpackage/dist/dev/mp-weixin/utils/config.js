"use strict";
const devConfig = {
  baseURL: "http://192.168.94.229:8886",
  timeout: 1e4,
  // 普通请求超时时间
  uploadTimeout: 12e4,
  // 上传请求超时时间（2分钟）
  API: {
    LOGIN: {
      WECHAT: "/api/login/wechat",
      LOGOUT: "/api/login/logout",
      INVITE: "/api/couple/bind/accept"
      // 使用邀请码邀请用户（已切换至情侣绑定接口）
    },
    USER: {
      INFO: "/api/user/info",
      AVATAR_UPLOAD: "/api/user/avatar/upload",
      UPDATE: "/api/user/update"
    },
    LETTER: {
      LIST: "/api/letter/list",
      DETAIL: "/api/letter/detail",
      CREATE: "/api/letter/create",
      UPDATE: "/api/letter/update",
      DELETE: "/api/letter/delete"
    },
    QNA: {
      LIST: "/api/qna/questions",
      // 获取问题列表
      SUBMIT: "/api/qna/answer/submit",
      // 提交答案
      HISTORY: "/api/qna/history",
      // 获取历史记录
      PARTNER_ANSWER: "/api/qna/partner",
      // 获取对方答案
      ADD_QUESTION: "/api/qna/question/add",
      // 添加自定义问题
      DELETE_QUESTION: "/api/qna/question/delete"
      // 删除自定义问题
    },
    CHALLENGE: {
      LIST: "/api/challenge/tasks",
      // 获取任务列表
      PROGRESS: "/api/challenge/progress",
      // 获取用户进度
      ADD: "/api/challenge/task/add",
      // 添加自定义任务
      DELETE: "/api/challenge/task/delete",
      // 删除自定义任务
      COMPLETE: "/api/challenge/complete",
      // 标记完成/取消完成
      FAVORITE: "/api/challenge/favorite",
      // 收藏/取消收藏
      UPLOAD: "/api/challenge/upload"
      // 上传任务完成照片
    },
    COUPLE: {
      INVITE_CREATE: "/api/couple/invite/create",
      // 生成邀请码
      INVITE_VALIDATE: "/api/couple/invite/validate",
      // 验证邀请码
      BIND_ACCEPT: "/api/couple/bind/accept",
      // 接受邀请（绑定）
      STATUS: "/api/couple/status",
      // 查询绑定状态
      UNBIND: "/api/couple/unbind",
      // 解绑关系
      LOVE_DAYS: "/api/couple/love-days"
      // 获取相爱天数
    },
    HEART_WALL: {
      // 项目相关接口
      PROJECTS: "/api/heart-wall/projects",
      // 获取用户所有项目、创建项目
      PROJECT_DETAIL: "/api/heart-wall/projects",
      // 获取/更新/删除项目详情 (需要拼接projectId)
      // 照片相关接口
      PHOTOS: "/api/heart-wall/photos/upload",
      // 上传照片、更新/删除照片 (需要拼接photoId)
      NEXT_POSITION: "/api/heart-wall/next-position"
      // 获取下一个可用位置
    },
    TRAJECTORY: {
      // 位置相关接口
      LOCATION_UPDATE: "/api/trajectory/location/update",
      // 上传/更新用户位置
      LOCATION_CURRENT: "/api/trajectory/location/current",
      // 获取双方实时位置
      // 轨迹点相关接口
      POINTS: "/api/trajectory/points",
      // 获取轨迹点列表、添加轨迹点
      LIST: "/api/trajectory/list",
      // 获取历史轨迹列表（支持筛选）
      STATISTICS: "/api/trajectory/statistics"
      // 获取轨迹统计信息
    },
    FUTURE_LETTER: {
      BASE: "/api/future-letter",
      // 基础路径
      LIST: "/api/future-letter",
      // 获取未来情书列表
      CREATE: "/api/future-letter",
      // 创建未来情书
      DETAIL: "/api/future-letter",
      // 获取情书详情 (需要拼接id)
      UPDATE: "/api/future-letter",
      // 更新未来情书 (需要拼接id)
      DELETE: "/api/future-letter",
      // 删除未来情书 (需要拼接id)
      SENT: "/api/future-letter/sent",
      // 获取已发送情书列表
      RECEIVED: "/api/future-letter/received",
      // 获取收到情书列表
      STATS: "/api/future-letter/stats",
      // 获取统计信息
      SEND: "/api/future-letter",
      // 发送未来情书 (需要拼接id/send)
      FONTS: "/api/future-letter/fonts",
      // 获取可选字体
      UNREAD: "/api/future-letter/unread"
      // 获取未读情书
    },
    ANNIVERSARY: {
      LIST: "/api/anniversary/list",
      // 获取纪念日列表
      CREATE: "/api/anniversary/create",
      // 创建纪念日
      UPDATE: "/api/anniversary/update",
      // 更新纪念日 (需要拼接id)
      DELETE: "/api/anniversary/delete",
      // 删除纪念日 (需要拼接id)
      REMIND: "/api/anniversary/remind"
      // 切换提醒状态 (需要拼接id)
    }
  }
};
const config = devConfig;
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/config.js.map
