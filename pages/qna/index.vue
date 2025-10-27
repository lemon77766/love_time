<template>
  <view class="qna-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">甜蜜问答</text>
      <text class="subtitle">用问题和答案更了解彼此</text>
    </view>

    <!-- 问题卡片 -->
    <view class="question-card">
      <text class="q-text">{{ currentQuestion.text }}</text>
    </view>

    <!-- 我的回答输入 -->
    <view class="answer-card">
      <text class="a-label">我的回答</text>
      <textarea class="a-input" v-model="myAnswer" placeholder="输入你的答案..." />
      <view class="actions">
        <button class="btn primary" @click="submitAnswer">提交答案</button>
        <button class="btn secondary" @click="nextQuestion">下一题</button>
      </view>
    </view>

    <!-- 对方答案显示（提交后出现） -->
    <view v-if="partnerAnswer" class="partner-card">
      <text class="p-label">TA 的答案</text>
      <text class="p-text">{{ partnerAnswer }}</text>
    </view>

    <!-- 悬浮自定义问题按钮 -->
    <view class="floating custom-floating" @click="showCustomModal = true">
      <text class="float-icon">✚</text>
      <text class="float-text">自定义问题</text>
    </view>

    <!-- 悬浮历史按钮 -->
    <view class="floating" @click="openHistory">
      <text class="float-icon">🕘</text>
      <text class="float-text">历史回答</text>
    </view>

    <!-- 历史记录弹窗 -->
    <view v-if="showHistory" class="modal-mask" @click="closeHistory">
      <view class="modal" @click.stop>
        <text class="modal-title">历史回答记录</text>
        <scroll-view class="history-list" scroll-y="true">
          <view v-for="(item, i) in history" :key="i" class="history-item">
            <text class="h-q">Q: {{ item.question }}</text>
            <text class="h-me">我: {{ item.myAnswer }}</text>
            <text class="h-ta">TA: {{ item.partnerAnswer }}</text>
            <text class="h-time">{{ item.time }}</text>
          </view>
        </scroll-view>
        <view class="modal-actions">
          <button class="btn secondary" @click="closeHistory">关闭</button>
          <button class="btn" @click="clearHistory">清空记录</button>
        </view>
      </view>
    </view>

    <!-- 自定义问题弹窗 -->
    <view v-if="showCustomModal" class="modal-mask" @click="closeCustomModal">
      <view class="modal custom-modal" @click.stop>
        <text class="modal-title">管理问题库</text>
        
        <!-- 添加新问题 -->
        <view class="add-question">
          <textarea 
            class="q-input" 
            v-model="newQuestion" 
            placeholder="输入你想问的问题..."
            maxlength="100"
          />
          <button class="btn primary small" @click="addCustomQuestion">添加问题</button>
        </view>

        <!-- 问题列表 -->
        <scroll-view class="question-list" scroll-y="true">
          <view class="section-title">预设问题 ({{ defaultQuestions.length }})</view>
          <view v-for="(q, i) in defaultQuestions" :key="'default-'+i" class="question-item">
            <text class="q-num">{{ i + 1 }}.</text>
            <text class="q-content">{{ q.text }}</text>
          </view>

          <view class="section-title" style="margin-top: 20rpx;">自定义问题 ({{ customQuestions.length }})</view>
          <view v-for="(q, i) in customQuestions" :key="'custom-'+i" class="question-item custom">
            <text class="q-num">{{ defaultQuestions.length + i + 1 }}.</text>
            <text class="q-content">{{ q.text }}</text>
            <text class="q-delete" @click="deleteCustomQuestion(i)">删除</text>
          </view>
          <view v-if="customQuestions.length === 0" class="empty-hint">
            <text>暂无自定义问题</text>
          </view>
        </scroll-view>

        <view class="modal-actions">
          <button class="btn secondary" @click="closeCustomModal">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  onLoad(options) {
    this.loadHistory();
    this.loadCustomQuestions();
    // 加载完历史后，找到第一个未回答的问题
    const qid = Number(options && options.qid);
    if (qid) {
      const idx = this.unansweredQuestions.findIndex(q => q.id === qid);
      if (idx >= 0) this.qIndex = idx;
    } else {
      // 默认显示第一个未回答的问题
      this.qIndex = 0;
    }
    // 如果携带 time，回显当天答案
    const time = options && options.time ? decodeURIComponent(options.time) : '';
    const rec = this.history.find(r => r.questionId === (qid || this.currentQuestion.id) && (!time || r.time === time));
    if (rec) {
      this.myAnswer = rec.myAnswer || '';
      this.partnerAnswer = rec.partnerAnswer || '';
    }
  },
  data() {
    return {
      defaultQuestions: [
        { id: 1, text: '我们第一次约会的地点是哪里？', isDefault: true },
        { id: 2, text: '你最喜欢我做的哪道菜？', isDefault: true },
        { id: 3, text: '如果周末只做一件事，你希望是什么？', isDefault: true },
        { id: 4, text: '你心中的完美旅行是什么样的？', isDefault: true },
        { id: 5, text: '这一年里，你最感动的一刻是什么？', isDefault: true }
      ],
      customQuestions: [],
      qIndex: 0,
      myAnswer: '',
      partnerAnswer: '',
      showHistory: false,
      showCustomModal: false,
      newQuestion: '',
      history: []
    };
  },
  computed: {
    questions() {
      return [...this.defaultQuestions, ...this.customQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      const answeredIds = this.history.map(h => h.questionId);
      return this.questions.filter(q => !answeredIds.includes(q.id));
    },
    currentQuestion() {
      // 从未回答的问题中获取当前问题
      if (this.unansweredQuestions.length === 0) {
        return { id: 0, text: '所有问题已回答完毕！🎉' };
      }
      return this.unansweredQuestions[this.qIndex] || this.unansweredQuestions[0];
    }
  },
  mounted() {
    this.loadHistory();
    this.loadCustomQuestions();
  },
  methods: {
    submitAnswer() {
      if (!this.myAnswer) {
        uni.showToast({ title: '请填写你的答案', icon: 'none' });
        return;
      }
      if (this.currentQuestion.id === 0) {
        uni.showToast({ title: '所有问题已回答完毕', icon: 'none' });
        return;
      }
      // 检查是否已经回答过这个问题
      const alreadyAnswered = this.history.some(h => h.questionId === this.currentQuestion.id);
      if (alreadyAnswered) {
        uni.showToast({ title: '该问题已经回答过了', icon: 'none' });
        return;
      }
      // 模拟获取对方答案（真实项目可改为请求服务端）
      this.partnerAnswer = this.generatePartnerAnswer(this.currentQuestion.id);
      const now = Date.now();
      const record = {
        questionId: this.currentQuestion.id,
        question: this.currentQuestion.text,
        myAnswer: this.myAnswer,
        partnerAnswer: this.partnerAnswer,
        time: new Date().toLocaleString(),
        ts: now
      };
      this.history.unshift(record);
      this.saveHistory();
      uni.showToast({ title: '已提交', icon: 'success' });
      
      // 提交后自动跳到下一题
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
    },
    nextQuestion() {
      this.partnerAnswer = '';
      this.myAnswer = '';
      // 重新计算未回答问题列表，显示下一个
      if (this.qIndex < this.unansweredQuestions.length - 1) {
        this.qIndex += 1;
      } else {
        this.qIndex = 0; // 回到第一个未回答的
      }
      if (this.unansweredQuestions.length === 0) {
        uni.showToast({ title: '所有问题已回答完毕！', icon: 'success' });
      }
    },
    openHistory() {
      uni.navigateTo({ url: '/pages/qna/history' });
    },
    closeHistory() {
      this.showHistory = false;
    },
    clearHistory() {
      this.history = [];
      this.saveHistory();
      uni.showToast({ title: '记录已清空', icon: 'none' });
    },
    loadHistory() {
      try {
        const data = uni.getStorageSync('qna_history');
        this.history = Array.isArray(data) ? data : [];
      } catch (e) { this.history = []; }
    },
    saveHistory() {
      try {
        uni.setStorageSync('qna_history', this.history);
      } catch (e) {}
    },
    generatePartnerAnswer(id) {
      const presets = {
        1: '那家有你最爱奶茶的小广场～',
        2: '当然是你拿手的番茄牛腩！',
        3: '一起散步、看电影、做饭都很好',
        4: '海边日出+山间露营的组合',
        5: '你偷偷准备的生日惊喜那天'
      };
      return presets[id] || '我也在认真思考这个问题～';
    },
    addCustomQuestion() {
      if (!this.newQuestion || !this.newQuestion.trim()) {
        uni.showToast({ title: '请输入问题内容', icon: 'none' });
        return;
      }
      const newId = Date.now();
      this.customQuestions.push({
        id: newId,
        text: this.newQuestion.trim(),
        isDefault: false
      });
      this.saveCustomQuestions();
      this.newQuestion = '';
      uni.showToast({ title: '问题添加成功', icon: 'success' });
    },
    deleteCustomQuestion(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个问题吗？',
        success: (res) => {
          if (res.confirm) {
            this.customQuestions.splice(index, 1);
            this.saveCustomQuestions();
            uni.showToast({ title: '已删除', icon: 'success' });
          }
        }
      });
    },
    loadCustomQuestions() {
      try {
        const data = uni.getStorageSync('qna_custom_questions');
        this.customQuestions = Array.isArray(data) ? data : [];
      } catch (e) { 
        this.customQuestions = []; 
      }
    },
    saveCustomQuestions() {
      try {
        uni.setStorageSync('qna_custom_questions', this.customQuestions);
      } catch (e) {}
    },
    closeCustomModal() {
      this.showCustomModal = false;
      this.newQuestion = '';
    }
  }
};
</script>

<style>
.qna-page { min-height: 100vh; background: #f7f7f9; padding-bottom: 60rpx; }
.header { padding: 32rpx 24rpx 12rpx 24rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #2b2b2b; }
.subtitle { margin-top: 6rpx; font-size: 24rpx; color: #7a7a7a; display: block; }
.header-actions { margin-top: 16rpx; }
.btn-custom { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; border-radius: 24rpx; padding: 14rpx 28rpx; font-size: 26rpx; border: none; }

.question-card { margin: 24rpx; background: #ffffff; border-radius: 24rpx; padding: 24rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06); }
.q-label { font-size: 24rpx; color: #9aa0a6; }
.q-text { margin-top: 8rpx; font-size: 30rpx; color: #2b2b2b; font-weight: 600; }

.answer-card { margin: 0 24rpx; background: #ffffff; border-radius: 24rpx; padding: 24rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06); }
.a-label { font-size: 24rpx; color: #9aa0a6; }
.a-input { margin-top: 12rpx; min-height: 100rpx; border: 1rpx solid #e6e6e6; border-radius: 16rpx; padding: 16rpx; font-size: 26rpx; }
.actions { margin-top: 16rpx; display: flex; gap: 12rpx; }
.btn { padding: 16rpx 26rpx; border-radius: 14rpx; font-size: 26rpx; }
.btn.primary { background: #2bad81; color: #ffffff; }
.btn.secondary { background: #f0f0f0; color: #333; }

.partner-card { margin: 16rpx 24rpx; background: #ffffff; border-radius: 24rpx; padding: 24rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06); }
.p-label { font-size: 24rpx; color: #9aa0a6; }
.p-text { margin-top: 8rpx; font-size: 28rpx; color: #2b2b2b; }

.floating { position: fixed; right: 24rpx; bottom: 120rpx; background: #2bad81; color: #ffffff; border-radius: 999rpx; padding: 16rpx 20rpx; display: flex; align-items: center; gap: 10rpx; box-shadow: 0 10rpx 24rpx rgba(43,173,129,0.35); z-index: 99; }
.custom-floating { bottom: 200rpx; } /* 自定义问题按钮在历史按钮上面 */
.float-icon { font-size: 26rpx; }
.float-text { font-size: 24rpx; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { width: 88%; background: #ffffff; border-radius: 24rpx; padding: 24rpx; max-height: 80vh; display: flex; flex-direction: column; }
.modal.custom-modal { width: 92%; }
.modal-title { font-size: 30rpx; font-weight: 700; color: #2b2b2b; margin-bottom: 16rpx; }
.history-list { max-height: 520rpx; margin-top: 12rpx; }
.history-item { padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.h-q { font-size: 26rpx; color: #333; }
.h-me, .h-ta { font-size: 24rpx; color: #555; margin-top: 6rpx; }
.h-time { font-size: 22rpx; color: #9aa0a6; margin-top: 6rpx; }
.modal-actions { margin-top: 14rpx; display: flex; justify-content: flex-end; gap: 12rpx; }

/* 自定义问题弹窗样式 */
.add-question { display: flex; gap: 12rpx; align-items: flex-start; margin-bottom: 16rpx; }
.q-input { flex: 1; min-height: 80rpx; border: 1rpx solid #e6e6e6; border-radius: 12rpx; padding: 12rpx; font-size: 26rpx; }
.btn.small { padding: 12rpx 20rpx; font-size: 24rpx; white-space: nowrap; }

.question-list { flex: 1; overflow-y: auto; }
.section-title { font-size: 24rpx; color: #9aa0a6; margin-bottom: 12rpx; padding-left: 4rpx; }
.question-item { display: flex; align-items: flex-start; padding: 14rpx 12rpx; background: #f7f7f9; border-radius: 12rpx; margin-bottom: 8rpx; }
.question-item.custom { background: linear-gradient(135deg, #e8f5f1 0%, #f0f9f6 100%); } /* 改为淡绿色渐变 */
.q-num { font-size: 24rpx; color: #2bad81; font-weight: 600; margin-right: 8rpx; flex-shrink: 0; }
.q-content { flex: 1; font-size: 26rpx; color: #2b2b2b; word-break: break-all; }
.q-delete { font-size: 24rpx; color: #ff6b6b; margin-left: 12rpx; flex-shrink: 0; padding: 4rpx 8rpx; }

.empty-hint { padding: 32rpx; text-align: center; color: #9aa0a6; font-size: 24rpx; }
</style>
