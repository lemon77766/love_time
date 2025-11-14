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
  onLoad() {
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.screenWidth = systemInfo.screenWidth || 375;
    
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
    this.loadQuestions();
    this.loadHistory();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
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
      // 确保获取正确的 questionId（兼容不同的字段名）
      const questionId = item.questionId || item.question_id;
      if (!questionId) {
        console.error('❌ 历史记录项缺少 questionId:', item);
        uni.showToast({ title: '问题ID缺失，无法跳转', icon: 'none' });
        return;
      }
      
      const qid = encodeURIComponent(questionId);
      const time = encodeURIComponent(item.time || '');
      
      console.log('🔗 跳转到问题页面:', {
        questionId: questionId,
        question: item.question ? item.question.substring(0, 20) + '...' : '',
        time: time
      });
      
      uni.navigateTo({ url: `/subPackages/interaction/pages/qna/index?qid=${qid}&time=${time}` });
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
