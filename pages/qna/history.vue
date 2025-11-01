<template>
  <view class="history-page">
    <!-- 顶部栏（系统风格简洁） -->

    <!-- 分隔与徽标 -->
    <view class="divider-row">
      <view class="divider"></view>
      <text class="heart">💚</text>
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
      history: [],
      defaultQuestions: [],
      customQuestions: []
    };
  },
  async onLoad() {
    // 检查登录状态
    const loginInfo = uni.getStorageSync('login_info');
    if (!loginInfo || !loginInfo.token) {
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
    
    // 先加载问题列表，再加载历史记录
    await this.loadQuestions();
    await this.loadHistory();
  },
  methods: {
    // 从后端加载问题列表
    async loadQuestions() {
      try {
        const res = await getQuestions();
        if (res && res.success && Array.isArray(res.questions)) {
          const presetQuestions = [];
          const customQuestions = [];
          
          res.questions.forEach(q => {
            if (!q || q.id === undefined || q.id === null) return;
            
            const question = {
              id: q.id,
              text: q.questionText || q.text || '',
              category: q.category || 'preset',
              ...q
            };
            
            if (q.category === 'preset') {
              presetQuestions.push(question);
            } else if (q.category === 'custom') {
              customQuestions.push(question);
            }
          });
          
          this.defaultQuestions = presetQuestions;
          this.customQuestions = customQuestions;
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
        
        let historyList = [];
        
        // 处理不同的响应格式
        if (res && res.success && Array.isArray(res.history)) {
          historyList = res.history;
        } else if (res && res.success && Array.isArray(res.answers)) {
          historyList = res.answers;
        } else if (res && res.success && res.data && res.data.list) {
          historyList = Array.isArray(res.data.list) ? res.data.list : [];
        } else if (res && res.success && res.data && Array.isArray(res.data)) {
          historyList = res.data;
        } else if (res && res.list) {
          historyList = Array.isArray(res.list) ? res.list : [];
        } else if (Array.isArray(res)) {
          historyList = res;
        } else {
          console.warn('⚠️ 历史记录响应格式不符合预期:', res);
          historyList = [];
        }
        
        // 标准化历史记录格式，确保字段名一致
        this.history = historyList.map(item => {
          const id = item.id || item.answerId;
          const questionId = item.questionId || item.question_id;
          
          // 优先使用后端返回的 question，如果没有则从问题列表中查找
          let question = item.question || item.questionText || item.question_text;
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
          
          return {
            id,
            questionId,
            question: question || `问题ID: ${questionId}`,
            myAnswer,
            partnerAnswer,
            time,
            questionCategory: item.questionCategory || item.category,
            answeredAt: item.answeredAt,
            ...item
          };
        });
        
        // 从新到旧排序（顶部最新）
        this.history.sort((a, b) => {
          const timeA = a.answeredAt || a.createdAt || a.time || '';
          const timeB = b.answeredAt || b.createdAt || b.time || '';
          return new Date(timeB) - new Date(timeA);
        });
        
        console.log('✅ 历史记录加载成功:', {
          count: this.history.length,
          totalCount: res?.totalCount
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
      const qid = encodeURIComponent(item.questionId);
      const time = encodeURIComponent(item.time || '');
      uni.navigateTo({ url: `/pages/qna/index?qid=${qid}&time=${time}` });
    }
  }
};
</script>

<style>
.history-page { min-height: 100vh; background: #ffffff; }
.topbar { position: relative; height: 96rpx; display: flex; align-items: center; justify-content: center; background: #ffffff; }
.topbar-title { font-size: 32rpx; color: #2b2b2b; font-weight: 600; }
.topbar-actions { position: absolute; right: 24rpx; top: 50%; transform: translateY(-50%); display: flex; gap: 12rpx; }
.icon-btn { width: 64rpx; height: 64rpx; border-radius: 32rpx; background: #f7f7f7; color: #ff8fb3; font-size: 28rpx; display: flex; align-items: center; justify-content: center; }

.divider-row { margin: 12rpx 24rpx; display: flex; align-items: center; gap: 16rpx; }
.divider { flex: 1; height: 2rpx; background: #f5e6f0; }
.heart { color: #ff8fb3; font-size: 26rpx; }

.list { padding: 12rpx 24rpx; }
.list-item { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.list-item:last-child { border-bottom: none; }
.left { width: 64rpx; }
.index { font-size: 30rpx; color: #ff8fb3; font-weight: 700; }
.center { flex: 1; }
.question { font-size: 28rpx; color: #2b2b2b; }
.right { width: 60rpx; display: flex; justify-content: flex-end; }
.status { width: 32rpx; height: 32rpx; border-radius: 16rpx; border: 3rpx solid #ff8fb3; }
.status.done { background: #ff8fb3; }
.status.todo { background: #ffffff; }

.empty { padding: 40rpx; display: flex; justify-content: center; }
.empty-text { color: #9aa0a6; font-size: 26rpx; }
</style>
