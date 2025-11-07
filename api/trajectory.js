/**
 * 轨迹相关 API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 上传/更新用户位置信息（实时定位）
 * @param {Object} locationData - 位置数据
 * @param {number} locationData.latitude - 纬度（必填）
 * @param {number} locationData.longitude - 经度（必填）
 * @param {string} locationData.address - 地址（可选，后端可自动解析）
 * @param {string} locationData.location_name - 地点名称（可选）
 * @returns {Promise<Object>} 返回更新结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/trajectory/location/update
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     latitude: number,        // 纬度（必填）
 *     longitude: number,       // 经度（必填）
 *     address: string,         // 地址（可选）
 *     location_name: string    // 地点名称（可选）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "位置更新成功",
 *     data: {
 *       location_id: number,
 *       update_time: string    // ISO时间格式
 *     }
 *   }
 */
export function updateLocation(locationData) {
  return http.post(config.API.TRAJECTORY.LOCATION_UPDATE, {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    address: locationData.address,
    location_name: locationData.location_name
  });
}

/**
 * 获取双方实时位置
 * @returns {Promise<Object>} 返回双方位置信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/trajectory/location/current
 * - 请求头：需携带 Authorization token
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       my_location: {
 *         user_id: number,
 *         latitude: number,
 *         longitude: number,
 *         address: string,
 *         location_name: string,
 *         update_time: string    // ISO时间格式
 *       },
 *       partner_location: {
 *         user_id: number,
 *         latitude: number,
 *         longitude: number,
 *         address: string,
 *         location_name: string,
 *         update_time: string
 *       },
 *       distance: number,        // 双方距离（公里）
 *       distance_text: string     // 格式化距离（如："1.2公里"）
 *     }
 *   }
 * 
 * 注意：
 * - 如果对方未上传位置，partner_location 可能为 null
 * - 如果双方都未上传位置，返回错误或空数据
 */
export function getCurrentLocations() {
  return http.get(config.API.TRAJECTORY.LOCATION_CURRENT);
}

/**
 * 获取主要轨迹点列表
 * @param {Object} params - 查询参数
 * @param {string} params.period - 时间范围：'7d'（7天）或 '30d'（30天），默认 '7d'（与start_date/end_date二选一）
 * @param {string} params.start_date - 开始日期（格式：YYYY-MM-DD），与end_date一起使用
 * @param {string} params.end_date - 结束日期（格式：YYYY-MM-DD），与start_date一起使用
 * @param {number} params.page - 页码（可选，默认1）
 * @param {number} params.limit - 每页数量（可选，默认50）
 * @returns {Promise<Object>} 返回轨迹点列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/trajectory/points
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     period: string,      // '7d' 或 '30d'（可选，与start_date/end_date二选一）
 *     start_date: string,  // 开始日期（格式：YYYY-MM-DD），与end_date一起使用
 *     end_date: string,   // 结束日期（格式：YYYY-MM-DD），与start_date一起使用
 *     page: number,       // 页码（可选，默认1）
 *     limit: number       // 每页数量（可选，默认50）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       points: [
 *         {
 *           id: number,
 *           user_id: number,
 *           latitude: number,
 *           longitude: number,
 *           address: string,
 *           location_name: string,
 *           visit_time: string,        // ISO时间格式
 *           stay_duration: number,      // 停留时长（分钟）
 *           importance_score: number,    // 重要性评分（0-10）
 *           visit_count: number,        // 到访次数
 *           is_manual: boolean,         // 是否手动添加
 *           description: string,        // 描述
 *           photos: string[]            // 照片列表
 *         }
 *       ]
 *     }
 *   }
 */
export function getTrajectoryPoints(params = {}) {
  return http.get(config.API.TRAJECTORY.POINTS, params);
}

/**
 * 获取历史轨迹列表（支持只显示对方轨迹）
 * @param {Object} params - 查询参数
 * @param {string} params.period - 时间范围：'30days'（30天），默认 '30days'（与start_date/end_date二选一）
 * @param {string} params.start_date - 开始日期（格式：YYYY-MM-DD），与end_date一起使用
 * @param {string} params.end_date - 结束日期（格式：YYYY-MM-DD），与start_date一起使用
 * @param {boolean} params.showPartnerOnly - 是否只显示对方轨迹，默认 true
 * @param {number} params.page - 页码（可选，默认1）
 * @param {number} params.limit - 每页数量（可选，默认50）
 * @returns {Promise<Object>} 返回轨迹点列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/trajectory/list
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     period: string,         // '30days'（可选，与start_date/end_date二选一）
 *     start_date: string,     // 开始日期（格式：YYYY-MM-DD），与end_date一起使用
 *     end_date: string,       // 结束日期（格式：YYYY-MM-DD），与start_date一起使用
 *     showPartnerOnly: boolean, // 是否只显示对方轨迹，默认 true
 *     page: number,          // 页码（可选，默认1）
 *     limit: number          // 每页数量（可选，默认50）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       points: [
 *         {
 *           id: number,
 *           user_id: number,
 *           latitude: number,
 *           longitude: number,
 *           address: string,
 *           location_name: string,
 *           visit_time: string,        // ISO时间格式
 *           stay_duration: number,      // 停留时长（分钟）
 *           importance_score: number,    // 重要性评分（0-10）
 *           visit_count: number,        // 到访次数
 *           is_manual: boolean,         // 是否手动添加
 *           description: string,         // 描述
 *           photos: string[]             // 照片列表
 *         }
 *       ]
 *     }
 *   }
 */
export function getTrajectoryList(params = {}) {
  // 如果用户提供了 start_date 和 end_date，则使用自定义时间区间，不使用 period
  // 否则使用默认的 period=30days
  const defaultParams = {
    showPartnerOnly: true,
    ...params
  };
  
  // 如果提供了 start_date 和 end_date，则移除 period 参数
  if (params.start_date && params.end_date) {
    delete defaultParams.period;
  } else if (!defaultParams.period) {
    // 如果没有提供 start_date/end_date 且没有 period，则使用默认值
    defaultParams.period = '30days';
  }
  
  return http.get(config.API.TRAJECTORY.LIST, defaultParams);
}

/**
 * 手动添加轨迹点
 * @param {Object} pointData - 轨迹点数据
 * @param {number} pointData.latitude - 纬度（必填）
 * @param {number} pointData.longitude - 经度（必填）
 * @param {string} pointData.address - 地址（可选）
 * @param {string} pointData.location_name - 地点名称（必填）
 * @param {string} pointData.visit_time - 到访时间（可选，默认当前时间，ISO格式）
 * @param {string} pointData.description - 描述（可选）
 * @param {string[]} pointData.photos - 照片列表（可选）
 * @returns {Promise<Object>} 返回添加结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/trajectory/points
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     latitude: number,
 *     longitude: number,
 *     address: string,         // 可选
 *     location_name: string,    // 必填
 *     visit_time: string,       // ISO时间格式，可选，默认当前时间
 *     description: string,     // 可选
 *     photos: string[]          // 可选
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "轨迹点添加成功",
 *     data: {
 *       point_id: number,
 *       importance_score: number  // 手动添加的默认高分（10.0）
 *     }
 *   }
 */
export function addTrajectoryPoint(pointData) {
  return http.post(config.API.TRAJECTORY.POINTS, {
    latitude: pointData.latitude,
    longitude: pointData.longitude,
    address: pointData.address,
    location_name: pointData.location_name,
    visit_time: pointData.visit_time,
    description: pointData.description,
    photos: pointData.photos || []
  });
}

/**
 * 获取轨迹统计信息
 * @param {Object} params - 查询参数
 * @param {string} params.period - 时间范围：'7d' 或 '30d'，默认 '7d'
 * @returns {Promise<Object>} 返回统计信息
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/trajectory/statistics
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     period: string    // '7d' 或 '30d'（可选，默认'7d'）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       total_points: number,
 *       total_distance: number,        // 总行程（公里）
 *       avg_daily_points: number,      // 平均每日轨迹点数
 *       most_visited_location: {
 *         name: string,
 *         count: number,
 *         latitude: number,
 *         longitude: number
 *       },
 *       trajectory_heatmap: [         // 轨迹热力图数据（可选）
 *         {
 *           latitude: number,
 *           longitude: number,
 *           intensity: number          // 热度值 0-1
 *         }
 *       ]
 *     }
 *   }
 */
export function getTrajectoryStatistics(params = {}) {
  return http.get(config.API.TRAJECTORY.STATISTICS, params);
}

