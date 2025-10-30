/**
 * 问答相关 API
 */

import http from '../utils/http.js';
import config from '../utils/config.js';

/**
 * 获取问题列表
 * @returns {Promise<Object>} 返回问题列表
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/qna/questions
 * - 请求头：需携带 Authorization token
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       defaultQuestions: [  // 预设问题列表
 *         { id: 1, text: "问题内容", isDefault: true }
 *       ],
 *       customQuestions: [   // 用户自定义问题列表
 *         { id: 101, text: "自定义问题", isDefault: false, userId: "xxx" }
 *       ]
 *     }
 *   }
 */
export function getQuestions() {
  return http.get(config.API.QNA.LIST);
}

/**
 * 提交答案
 * @param {Object} answerData - 答案数据
 * @returns {Promise<Object>} 返回提交结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/qna/answer/submit
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     questionId: number,    // 问题ID（必填）
 *     answer: string,        // 我的答案（必填）
 *     questionText: string   // 问题文本（可选，用于记录）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "提交成功",
 *     data: {
 *       answerId: number,           // 答案记录ID
 *       partnerAnswer: string,      // 对方的答案（如果对方已回答）
 *       hasPartnerAnswered: boolean // 对方是否已回答
 *     }
 *   }
 */
export function submitAnswer(answerData) {
  return http.post(config.API.QNA.SUBMIT, {
    questionId: answerData.questionId,
    answer: answerData.answer,
    questionText: answerData.questionText
  });
}

/**
 * 获取历史回答记录
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 返回历史记录
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/qna/history
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     page: number,      // 页码（可选，默认1）
 *     pageSize: number   // 每页数量（可选，默认20）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       total: number,     // 总记录数
 *       list: [
 *         {
 *           id: number,
 *           questionId: number,
 *           question: string,
 *           myAnswer: string,
 *           partnerAnswer: string,
 *           createdAt: string,  // ISO时间格式
 *           updatedAt: string
 *         }
 *       ]
 *     }
 *   }
 */
export function getHistory(params = {}) {
  return http.get(config.API.QNA.HISTORY, params);
}

/**
 * 获取对方答案
 * @param {number} questionId - 问题ID
 * @returns {Promise<Object>} 返回对方答案
 * 
 * 后端接口要求：
 * - 请求方法：GET
 * - 请求地址：/api/qna/partner
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     questionId: number  // 问题ID（必填）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     data: {
 *       hasAnswered: boolean,    // 对方是否已回答
 *       answer: string,          // 对方的答案（如果已回答）
 *       answeredAt: string       // 回答时间（如果已回答）
 *     }
 *   }
 */
export function getPartnerAnswer(questionId) {
  return http.get(config.API.QNA.PARTNER_ANSWER, { questionId });
}

/**
 * 添加自定义问题
 * @param {string} questionText - 问题文本
 * @returns {Promise<Object>} 返回添加结果
 * 
 * 后端接口要求：
 * - 请求方法：POST
 * - 请求地址：/api/qna/question/add
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     text: string  // 问题文本（必填）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "添加成功",
 *     data: {
 *       id: number,          // 新问题的ID
 *       text: string,        // 问题文本
 *       isDefault: false,
 *       userId: string,
 *       createdAt: string
 *     }
 *   }
 */
export function addCustomQuestion(questionText) {
  return http.post(config.API.QNA.ADD_QUESTION, {
    text: questionText
  });
}

/**
 * 删除自定义问题
 * @param {number} questionId - 问题ID
 * @returns {Promise<Object>} 返回删除结果
 * 
 * 后端接口要求：
 * - 请求方法：POST 或 DELETE
 * - 请求地址：/api/qna/question/delete
 * - 请求头：需携带 Authorization token
 * - 请求参数：
 *   {
 *     questionId: number  // 问题ID（必填）
 *   }
 * - 返回数据：
 *   {
 *     success: true,
 *     message: "删除成功"
 *   }
 */
export function deleteCustomQuestion(questionId) {
  return http.post(config.API.QNA.DELETE_QUESTION, {
    questionId
  });
}
