<template>
  <view class="history-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">问答记录</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 分隔与徽标 -->
    <view class="divider-row">
      <view class="divider"></view>
      <text class="heart">💛</text>
      <view class="divider"></view>
    </view>

    <!-- 历史列表 -->
    <view class="list">
      <view v-for="(item, i) in history" :key="i" class="list-item" @click="openItem(item)">
        <view class="left">
          <text class="index">{{ pad2(i + 1) }}</text>
        </view>
        <view class="center">
          <text class="question">{{ item.question }}</text>
        </view>
        <view class="right">
          <view class="status" :class="item.myAnswer ? 'done' : 'todo'"></view>
        </view>
      </view>
      <view v-if="history.length === 0" class="empty">
        <text class="empty-text">暂无历史记录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getHistory } from '@/api/qna.js';
import { getQuestions } from '@/api/qna.js';

export default {
  data() {
    return { 
      statusBarHeight: 0,
      navBarHeight: 54,
      screenWidth: 375,
      history: [],
      defaultQuestions: [],
      customQuestions: []
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    }
  },
  async onLoad() {
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.screenWidth = systemInfo.screenWidth || 375;

    const loginInfo = uni.getStorageSync('login_info');
    if (!loginInfo || !loginInfo.token) {
      uni.showModal({
        title: '需要登录',
        content: '请先登录',
        showCancel: false,
        success: () => uni.reLaunch({ url: '/pages/login/index' })
      });
      return;
    }

    await this.loadQuestions();
    await this.loadHistory();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    normalizeApiResponse(response, defaultMessage = '操作成功') {
      if (response == null) {
        return { success: false, message: '响应为空', data: null, raw: response };
      }
      if (typeof response === 'string') {
        return { success: false, message: response, data: null, raw: response };
      }
      if (typeof response.success === 'boolean') {
        return {
          success: !!response.success,
          message: response.message || response.msg || defaultMessage,
          data: response.data !== undefined ? response.data : null,
          raw: response
        };
      }
      if (response.code !== undefined) {
        const success = Number(response.code) === 200;
        return {
          success,
          message: response.msg || response.message || defaultMessage,
          data: response.data !== undefined ? response.data : null,
          raw: response
        };
      }
      if (Array.isArray(response)) {
        return { success: true, message: defaultMessage, data: response, raw: response };
      }
      return {
        success: true,
        message: response.message || response.msg || defaultMessage,
        data: response.data !== undefined ? response.data : response,
        raw: response
      };
    },
    formatQuestionList(list, categoryFallback = 'preset') {
      if (!Array.isArray(list)) {
        return [];
      }
      return list
        .filter(q => q && q.id != null)
        .map(q => {
          const formatted = {
            ...q,
            id: q.id,
            text: q.text || q.questionText || '',
            category: q.category || categoryFallback,
            isActive: q.isActive !== false,
            orderIndex: q.orderIndex ?? 999
          };
          if (formatted.questionText) {
            delete formatted.questionText;
          }
          return formatted;
        });
    },
    // 从后端加载问题列表
    async loadQuestions() {
      try {
        const res = await getQuestions();
        console.log('📥 问题列表响应:', res);
        const normalizedRes = this.normalizeApiResponse(res, '获取问题成功');
        
        const rawData = normalizedRes.data ?? res?.data ?? {};
        let topLevelQuestions = null;
        if (Array.isArray(res?.questions)) {
          topLevelQuestions = res.questions;
        } else if (Array.isArray(rawData?.questions)) {
          topLevelQuestions = rawData.questions;
        } else if (Array.isArray(rawData)) {
          topLevelQuestions = rawData;
        }

        let presetQuestions = null;
        let customQuestions = null;
        
        if (Array.isArray(topLevelQuestions)) {
          const formatted = this.formatQuestionList(topLevelQuestions);
          presetQuestions = formatted.filter(q => (q.category || 'preset') === 'preset');
          customQuestions = formatted.filter(q => (q.category || 'preset') === 'custom');
        } else if (rawData && (Array.isArray(rawData.defaultQuestions) || Array.isArray(rawData.customQuestions))) {
          presetQuestions = this.formatQuestionList(rawData.defaultQuestions, 'preset');
          customQuestions = this.formatQuestionList(rawData.customQuestions, 'custom');
        } else if (res && res.code === 200 && res.data && (Array.isArray(res.data.defaultQuestions) || Array.isArray(res.data.customQuestions))) {
          presetQuestions = this.formatQuestionList(res.data.defaultQuestions, 'preset');
          customQuestions = this.formatQuestionList(res.data.customQuestions, 'custom');
        }

        if (presetQuestions !== null) {
          presetQuestions.sort((a, b) => {
            const orderA = a.orderIndex ?? 999;
            const orderB = b.orderIndex ?? 999;
            return orderA - orderB;
          });
          this.defaultQuestions = presetQuestions;
        }

        if (customQuestions !== null) {
          this.customQuestions = customQuestions;
        }

        if (presetQuestions !== null || customQuestions !== null) {
          console.log('✅ 问题列表加载成功:', {
            preset: this.defaultQuestions.length,
            custom: this.customQuestions.length,
            total: this.defaultQuestions.length + this.customQuestions.length
          });
        } else if (!normalizedRes.success) {
          console.warn('⚠️ 问题列表业务状态失败:', {
            message: normalizedRes.message,
            raw: normalizedRes.raw
          });
        } else {
          console.warn('⚠️ 问题列表响应格式不符合预期:', res);
        }
      } catch (e) {
        console.error('加载问题列表失败', e);
      }
    },
    // 从后端加载历史记录
    async loadHistory() {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await getHistory({ page: 1, pageSize: 100 });
        console.log('📥 历史记录响应:', res);
        const normalizedRes = this.normalizeApiResponse(res, '获取历史记录成功');
        if (!normalizedRes.success) {
          console.warn('⚠️ 历史记录业务状态返回失败:', {
            message: normalizedRes.message,
            raw: normalizedRes.raw
          });
        }
        
        const dataSources = [
          normalizedRes.data?.list,
          normalizedRes.data?.history,
          normalizedRes.data?.answers,
          Array.isArray(normalizedRes.data) ? normalizedRes.data : null,
          normalizedRes.raw?.history,
          normalizedRes.raw?.answers,
          normalizedRes.raw?.data?.list,
          normalizedRes.raw?.data?.history,
          normalizedRes.raw?.data?.answers,
          Array.isArray(normalizedRes.raw?.data) ? normalizedRes.raw.data : null,
          res?.history,
          res?.answers,
          res?.data?.list,
          res?.data?.history,
          res?.data?.answers,
          Array.isArray(res?.data) ? res.data : null,
          res?.list,
          Array.isArray(res) ? res : null
        ];
        
        let historyList = [];
        for (const candidate of dataSources) {
          if (Array.isArray(candidate)) {
            historyList = candidate;
            break;
          }
        }
        
        if (!Array.isArray(historyList)) {
          console.warn('⚠️ 历史记录响应格式不符合预期:', res);
          historyList = [];
        }
        
        // 标准化历史记录格式，确保字段名一致
        this.history = historyList.map(item => {
          const id = item.id || item.answerId;
          const questionId = item.questionId || item.question_id;
          
          // 优先使用后端返回的问题文本
          let question = item.question || item.questionText || item.question_text;
          console.log('🔍 处理历史记录项:', { 
            originalItem: item, 
            questionId, 
            initialQuestion: question 
          });
          
          if (!question && questionId != null) {
            const allQuestions = [...(this.defaultQuestions || []), ...(this.customQuestions || [])];
            const foundQuestion = allQuestions.find(q => q && q.id != null && Number(q.id) === Number(questionId));
            if (foundQuestion && foundQuestion.text) {
              question = foundQuestion.text;
            }
          }
          
          const myAnswer = item.myAnswer || item.answer || item.my_answer;
          const partnerAnswer = item.partnerAnswer || item.partner_answer || '';
          const time = item.time || item.answeredAt || item.createdAt || item.created_at || item.updatedAt || new Date().toLocaleString();
          
          const formattedItem = {
            id,
            questionId,
            question: question || `问题ID: ${questionId}`,
            myAnswer,
            partnerAnswer,
            time,
            questionCategory: item.questionCategory || item.category,
            answeredAt: item.answeredAt,
            // 保留原始对象的其他字段，但不覆盖我们处理过的字段
            ...Object.fromEntries(
              Object.entries(item).filter(([key]) => 
                !['id', 'questionId', 'question', 'myAnswer', 'partnerAnswer', 'time', 'questionCategory', 'answeredAt'].includes(key)
              )
            )
          };
          
          console.log('🔧 格式化历史记录项:', {
            original: item,
            formatted: formattedItem
          });
          
          return formattedItem;
        });
        
        // 从新到旧排序（顶部最新）
        this.history.sort((a, b) => {
          const timeA = a.answeredAt || a.createdAt || a.time || '';
          const timeB = b.answeredAt || b.createdAt || b.time || '';
          return new Date(timeB) - new Date(timeA);
        });
        
        console.log('✅ 历史记录加载成功:', {
          count: this.history.length,
          totalCount: normalizedRes.raw?.totalCount ?? normalizedRes.data?.totalCount ?? normalizedRes.data?.total,
          sample: this.history.slice(0, 3)
        });
        
        // 输出完整的历史记录数据用于调试
        console.log('📋 完整历史记录数据:', this.history);
        console.log('✅ 历史记录加载成功:', {
          count: this.history.length,
          totalCount: normalizedRes.raw?.totalCount ?? normalizedRes.data?.totalCount ?? normalizedRes.data?.total,
          sample: this.history.slice(0, 3)
        });
      } catch (e) {
        console.error('加载历史记录失败', e);
        
        // 401错误特殊处理
        if (e.statusCode === 401) {
          uni.showModal({
            title: '需要登录',
            content: '请先登录',
            showCancel: false,
            success: () => {
              uni.reLaunch({ url: '/pages/login/index' });
            }
          });
          return;
        }
        
        // 如果后端请求失败，尝试从本地存储加载
        try {
          const data = uni.getStorageSync('qna_history');
          this.history = Array.isArray(data) ? data : [];
        } catch (e2) {
          this.history = [];
        }
      } finally {
        uni.hideLoading();
      }
    },
    pad2(n) { return String(n).padStart(2, '0'); },
    openItem(item) {
      if (!item.questionId) {
        uni.showToast({ title: '问题ID缺失，无法跳转', icon: 'none' });
        return;
      }
      
      const qid = encodeURIComponent(item.questionId);
      const qtext = encodeURIComponent(item.question);
      
      uni.navigateTo({ 
        url: `/subPackages/interaction/pages/qna/index?qid=${qid}&qtext=${qtext}` 
      });
    }
  }
};
</script>

<style>
/* 导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #FFFAF4;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

.status-bar {
  width: 100%;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  position: relative;
  z-index: 10;
}

.navbar-left {
  width: 80rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.back-icon {
  font-size: 50rpx;
  font-weight: 600;
  color: #4A4A4A;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.3s;
}

.navbar-title {
  flex: 1;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-right {
  width: 80rpx;
  height: 54rpx;
}

.history-page { 
  min-height: 100vh; 
  background: #FFFAF4; 
}
.topbar { position: relative; height: 96rpx; display: flex; align-items: center; justify-content: center; background: #ffffff; }
.topbar-title { font-size: 32rpx; color: #2b2b2b; font-weight: 600; }
.topbar-actions { position: absolute; right: 24rpx; top: 50%; transform: translateY(-50%); display: flex; gap: 12rpx; }
.icon-btn { width: 64rpx; height: 64rpx; border-radius: 32rpx; background: #f7f7f7; color: #2bad81; font-size: 28rpx; display: flex; align-items: center; justify-content: center; }

.divider-row { 
  margin: 12rpx 24rpx; 
  display: flex; 
  align-items: center; 
  gap: 16rpx; 
}
.divider { 
  flex: 1; 
  height: 2rpx; 
  background: linear-gradient(90deg, transparent 0%, #FFC94D 50%, transparent 100%);
  opacity: 0.6;
}
.heart { 
  color: #FFC94D; 
  font-size: 32rpx;
  text-shadow: 0 2rpx 4rpx rgba(255, 181, 194, 0.3);
}

.list { 
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.list-item { 
  display: flex; 
  align-items: center; 
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.left { width: 64rpx; }
.index { 
  font-size: 30rpx; 
  color: #FFB5C2; 
  font-weight: 700; 
}
.center { flex: 1; padding: 0 16rpx; }
.question { 
  font-size: 28rpx; 
  color: #4A4A4A;
  font-weight: 500;
  line-height: 1.4;
}
.right { width: 60rpx; display: flex; justify-content: flex-end; }
.status { 
  width: 32rpx; 
  height: 32rpx; 
  border-radius: 16rpx; 
  border: 3rpx solid #FFB5C2;
  transition: all 0.3s ease;
}
.status.done { 
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%);
  border-color: #FFB5C2;
  box-shadow: 0 2rpx 8rpx rgba(255, 181, 194, 0.3);
}
.status.todo { 
  background: #ffffff; 
  border-color: #FFB5C2;
}

.debug {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #999;
}

.empty { 
  padding: 80rpx 40rpx; 
  display: flex; 
  justify-content: center; 
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  margin: 24rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}
.empty-text { 
  color: #666; 
  font-size: 28rpx;
  font-weight: 500;
}
</style>
