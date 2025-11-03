<template>
  <view class="qna-page" :style="{ paddingTop: containerPaddingTop }">
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
          <text class="title-text">甜蜜问答</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 顶部标题 -->
    <view class="header">
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
import { 
  getQuestions, 
  submitAnswer, 
  getHistory, 
  addCustomQuestion, 
  deleteCustomQuestion 
} from '@/api/qna.js';

export default {
  async onLoad(options) {
    this.getSystemInfo();
    // 检查登录状态和token
    const loginInfo = uni.getStorageSync('login_info');
    if (!loginInfo || !loginInfo.token) {
      uni.showModal({
        title: '需要登录',
        content: '甜蜜问答功能需要登录后才能使用，请先登录',
        showCancel: false,
        success: () => {
          uni.reLaunch({
            url: '/pages/login/index'
          });
        }
      });
      return;
    }
    
    // 从后端加载问题列表和历史记录
    await this.loadQuestionsFromServer();
    await this.loadHistoryFromServer();
    
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
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
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
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 20 + 'rpx';
    },
    questions() {
      // 过滤掉无效的问题对象，确保每个问题都有 id 和 text
      const validDefaultQuestions = (this.defaultQuestions || []).filter(q => q && q.id != null);
      const validCustomQuestions = (this.customQuestions || []).filter(q => q && q.id != null);
      return [...validDefaultQuestions, ...validCustomQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      // 获取已回答的问题ID列表（确保类型一致）
      const answeredIds = this.history
        .map(h => {
          // 兼容不同的字段名
          const qid = h.questionId || h.question_id || h.id;
          // 统一转换为数字类型进行比较
          return qid != null ? Number(qid) : null;
        })
        .filter(id => id != null);
      
      // 过滤出未回答的问题（添加安全检查）
      const unanswered = this.questions.filter(q => {
        // 安全检查：确保 q 存在且有 id 属性
        if (!q || q.id === undefined || q.id === null) {
          console.warn('⚠️ 发现无效的问题对象:', q);
          return false;
        }
        const questionId = Number(q.id);
        // 检查转换后的ID是否有效
        if (isNaN(questionId)) {
          console.warn('⚠️ 问题ID无效:', q.id);
          return false;
        }
        const isAnswered = answeredIds.includes(questionId);
        return !isAnswered && q.isActive !== false; // 过滤掉已禁用的问题
      });
      
      // 开发环境下输出调试信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 未回答问题计算:', {
          totalQuestions: this.questions.length,
          answeredIds: answeredIds,
          unansweredCount: unanswered.length,
          answeredCount: answeredIds.length,
          historyCount: this.history.length,
          questions: this.questions.map(q => ({ id: q.id, text: q.text })),
          history: this.history.map(h => ({ 
            questionId: h.questionId || h.question_id,
            question: h.question || h.questionText
          }))
        });
      }
      
      return unanswered;
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
    // onLoad 中已经加载，无需重复加载
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      // #ifdef MP-WEIXIN
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      this.navBarHeight = 44;
      // #endif
    },
    // 保存历史记录到本地存储
    saveHistory() {
      try {
        uni.setStorageSync('qna_history', this.history);
      } catch (e) {
        console.error('保存历史记录失败', e);
      }
    },
    async submitAnswer() {
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
      
      try {
        uni.showLoading({ title: '提交中...' });
        
        // 调用后端API提交答案
        const res = await submitAnswer({
          questionId: this.currentQuestion.id,
          answer: this.myAnswer,
          questionText: this.currentQuestion.text
        });
        
        console.log('📥 提交答案响应:', res);
        
        if (res && res.success) {
          // 兼容不同的响应格式
          const responseData = res.data || res;
          
          // 如果对方已回答，显示对方答案（兼容 hasPartnerAnswer 和 hasPartnerAnswered 两种字段名）
          if (responseData && (responseData.hasPartnerAnswered || responseData.hasPartnerAnswer)) {
            this.partnerAnswer = responseData.partnerAnswer || '';
          }
          
          // 添加到本地历史记录
          const record = {
            id: responseData?.answerId || res?.answerId || responseData?.id || Date.now(),
            questionId: this.currentQuestion.id,
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: responseData?.partnerAnswer || '',
            time: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
          };
          this.history.unshift(record);
          this.saveHistory();
          
          uni.showToast({ title: '提交成功', icon: 'success' });
          
          // 提交后自动跳到下一题
          setTimeout(() => {
            this.nextQuestion();
          }, 1500);
        } else {
          // 即使响应格式不符合预期，也保存到本地
          console.warn('⚠️ 响应格式不符合预期:', res);
          const record = {
            id: Date.now(),
            questionId: this.currentQuestion.id,
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: '',
            time: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
          };
          this.history.unshift(record);
          this.saveHistory();
          uni.showToast({ title: '提交成功（已保存到本地）', icon: 'success' });
          
          setTimeout(() => {
            this.nextQuestion();
          }, 1500);
        }
      } catch (e) {
        console.error('提交答案失败', e);
        console.error('错误详情:', {
          statusCode: e.statusCode,
          message: e.message,
          data: e.data,
          url: e.url || '未知'
        });
        
        // 401错误特殊处理
        if (e.statusCode === 401) {
          uni.hideLoading();
          uni.showModal({
            title: '登录已过期',
            content: '您的登录已过期，请重新登录',
            showCancel: false,
            success: () => {
              uni.reLaunch({
                url: '/pages/login/index'
              });
            }
          });
          return;
        }
        
        // 404错误：后端接口未实现
        if (e.statusCode === 404) {
          uni.hideLoading();
          console.warn('⚠️ 后端接口未实现: POST /api/qna/answer/submit');
          console.warn('💡 提示: 请联系后端开发人员实现该接口，或检查接口路径是否正确');
          
          // 临时方案：保存到本地，等后端接口就绪后再同步
          uni.showModal({
            title: '接口未实现',
            content: '提交答案接口暂未实现，已保存到本地。请联系后端开发人员实现接口：POST /api/qna/answer/submit',
            showCancel: false,
            confirmText: '知道了',
            success: () => {
              // 本地保存答案记录（临时方案）
              const record = {
                id: Date.now(), // 临时ID
                questionId: this.currentQuestion.id,
                question: this.currentQuestion.text,
                myAnswer: this.myAnswer,
                partnerAnswer: '',
                time: new Date().toLocaleString(),
                createdAt: new Date().toISOString(),
                _pendingSync: true // 标记为待同步
              };
              this.history.unshift(record);
              this.saveHistory();
              uni.showToast({ title: '已保存到本地', icon: 'none' });
              
              // 提交后自动跳到下一题
              setTimeout(() => {
                this.nextQuestion();
              }, 1500);
            }
          });
          return;
        }
        
        uni.hideLoading();
        uni.showToast({ 
          title: `提交失败: ${e.statusCode || '网络错误'}`, 
          icon: 'none',
          duration: 3000
        });
      } finally {
        // 确保loading关闭
        uni.hideLoading();
      }
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
    // 从后端加载历史记录
    async loadHistoryFromServer() {
      try {
        const res = await getHistory({ page: 1, pageSize: 100 });
        console.log('📥 历史记录响应:', res);
        
        let historyList = [];
        
        // 处理不同的响应格式（按优先级顺序）
        if (res && res.success && Array.isArray(res.history)) {
          // 格式: { success: true, history: [...], message: "获取成功", totalCount: 5 }
          historyList = res.history;
        } else if (res && res.success && Array.isArray(res.answers)) {
          // 格式: { success: true, answers: [...], message: "获取成功", totalCount: 0 }
          historyList = res.answers;
        } else if (res && res.success && res.data && res.data.list) {
          // 格式: { success: true, data: { list: [...] } }
          historyList = Array.isArray(res.data.list) ? res.data.list : [];
        } else if (res && res.success && res.data && Array.isArray(res.data)) {
          // 格式: { success: true, data: [...] } （直接是数组）
          historyList = res.data;
        } else if (res && res.list) {
          // 格式: { list: [...] } （直接返回数据）
          historyList = Array.isArray(res.list) ? res.list : [];
        } else if (Array.isArray(res)) {
          // 格式: [...] （直接返回数组）
          historyList = res;
        } else {
          console.warn('⚠️ 历史记录响应格式不符合预期:', res);
          historyList = [];
        }
        
        // 标准化历史记录格式，确保字段名一致
        this.history = historyList.map(item => {
          // 兼容多种字段名和格式
          const id = item.id || item.answerId;
          const questionId = item.questionId || item.question_id;
          
          // 优先使用后端返回的 question，如果没有则从问题列表中查找
          let question = item.question || item.questionText || item.question_text;
          if (!question && questionId != null) {
            // 从问题列表中根据 questionId 查找对应的 question 文本
            const allQuestions = [...(this.defaultQuestions || []), ...(this.customQuestions || [])];
            const foundQuestion = allQuestions.find(q => q && q.id != null && Number(q.id) === Number(questionId));
            if (foundQuestion && foundQuestion.text) {
              question = foundQuestion.text;
            }
          }
          
          // 兼容 answer、myAnswer、my_answer 等多种字段名
          const myAnswer = item.myAnswer || item.answer || item.my_answer;
          const partnerAnswer = item.partnerAnswer || item.partner_answer || '';
          // 兼容多种时间字段：answeredAt、createdAt、created_at、time、updatedAt
          const time = item.time || item.answeredAt || item.createdAt || item.created_at || item.updatedAt || new Date().toLocaleString();
          const createdAt = item.createdAt || item.created_at || item.answeredAt || item.updatedAt || new Date().toISOString();
          
          return {
            id,
            questionId,
            question: question || `问题ID: ${questionId}`, // 如果仍然找不到，显示ID作为备用
            myAnswer,
            partnerAnswer,
            time,
            createdAt,
            // 保留原始数据中的其他字段（如 questionCategory、answeredAt 等）
            questionCategory: item.questionCategory || item.category,
            answeredAt: item.answeredAt,
            updatedAt: item.updatedAt,
            ...item
          };
        });
        
        console.log('✅ 历史记录加载成功:', {
          count: this.history.length,
          totalCount: res?.totalCount,
          sample: this.history.slice(0, 3)
        });
      } catch (e) {
        console.error('加载历史记录失败', e);
        console.error('错误详情:', {
          message: e.message,
          statusCode: e.statusCode,
          data: e.data
        });
        
        // 401错误特殊处理（但不弹出提示，因为已经在上面的加载问题中处理了）
        if (e.statusCode === 401) {
          return;
        }
        
        // 如果后端请求失败，尝试从本地存储加载
        try {
          const data = uni.getStorageSync('qna_history');
          this.history = Array.isArray(data) ? data : [];
        } catch (e2) { 
          this.history = []; 
        }
      }
    },
    // 从后端加载问题列表
    async loadQuestionsFromServer() {
      try {
        uni.showLoading({ title: '加载中...' });
        const res = await getQuestions();
        console.log('📥 问题列表响应:', res);
        
        // 处理后端返回的格式: { success: true, questions: Array, message: "获取成功" }
        if (res && res.success && Array.isArray(res.questions)) {
          // 将问题按 category 分类，并转换字段名
          const presetQuestions = [];
          const customQuestions = [];
          
          res.questions.forEach(q => {
            // 跳过无效的问题对象
            if (!q || q.id === undefined || q.id === null) {
              console.warn('⚠️ 跳过无效的问题对象:', q);
              return;
            }
            
            // 转换字段：questionText -> text，保留其他字段
            const question = {
              id: q.id,
              text: q.questionText || q.text || '', // 兼容两种字段名，确保有默认值
              category: q.category || 'preset',
              isActive: q.isActive !== false, // 默认为 true
              orderIndex: q.orderIndex ?? 999,
              createdBy: q.createdBy,
              // 保留其他可能存在的字段
              ...q
            };
            
            // 移除原始的 questionText，避免混乱
            if (question.questionText) {
              delete question.questionText;
            }
            
            // 按 category 分类
            if (q.category === 'preset') {
              presetQuestions.push(question);
            } else if (q.category === 'custom') {
              customQuestions.push(question);
            }
          });
          
          // 预设问题按 orderIndex 排序
          presetQuestions.sort((a, b) => {
            const orderA = a.orderIndex ?? 999;
            const orderB = b.orderIndex ?? 999;
            return orderA - orderB;
          });
          
          this.defaultQuestions = presetQuestions;
          this.customQuestions = customQuestions;
          
          console.log('✅ 问题列表加载成功:', {
            preset: presetQuestions.length,
            custom: customQuestions.length,
            total: presetQuestions.length + customQuestions.length
          });
        } else if (res && res.success && res.data) {
          // 兼容旧格式: { success: true, data: { defaultQuestions: [...], customQuestions: [...] } }
          this.defaultQuestions = Array.isArray(res.data.defaultQuestions) 
            ? res.data.defaultQuestions
                .filter(q => q && q.id != null) // 过滤无效数据
                .map(q => ({
                  id: q.id,
                  text: q.questionText || q.text || '',
                  ...q
                }))
            : [];
          this.customQuestions = Array.isArray(res.data.customQuestions) 
            ? res.data.customQuestions
                .filter(q => q && q.id != null) // 过滤无效数据
                .map(q => ({
                  id: q.id,
                  text: q.questionText || q.text || '',
                  ...q
                }))
            : [];
        } else {
          console.warn('⚠️ 问题列表响应格式不符合预期:', res);
          this.defaultQuestions = [];
          this.customQuestions = [];
        }
      } catch (e) {
        console.error('加载问题失败', e);
        console.error('错误详情:', {
          message: e.message,
          statusCode: e.statusCode,
          data: e.data
        });
        
        // 401错误特殊处理
        if (e.statusCode === 401) {
          uni.hideLoading();
          uni.showModal({
            title: '登录已过期',
            content: '您的登录已过期，请重新登录',
            showCancel: false,
            success: () => {
              uni.reLaunch({
                url: '/pages/login/index'
              });
            }
          });
          return;
        }
        
        // 如果后端请求失败，使用预设问题和本地自定义问题
        uni.showToast({ title: '加载问题失败，使用本地数据', icon: 'none' });
        try {
          const data = uni.getStorageSync('qna_custom_questions');
          this.customQuestions = Array.isArray(data) ? data : [];
        } catch (e2) { 
          this.customQuestions = []; 
        }
      } finally {
        uni.hideLoading();
      }
    },

    // 添加自定义问题
    async addCustomQuestion() {
      if (!this.newQuestion || !this.newQuestion.trim()) {
        uni.showToast({ title: '请输入问题内容', icon: 'none' });
        return;
      }
      
      try {
        uni.showLoading({ title: '添加中...' });
        
        // 调用后端API添加问题
        const res = await addCustomQuestion(this.newQuestion.trim());
        
        if (res.success) {
          // 格式化新问题，确保包含所有必需字段
          const newQuestionData = res.data || {};
          const formattedQuestion = {
            id: newQuestionData.id,
            text: newQuestionData.text || newQuestionData.questionText || this.newQuestion.trim(),
            category: 'custom',
            isActive: true,
            orderIndex: 999,
            createdBy: newQuestionData.userId || newQuestionData.createdBy,
            createdAt: newQuestionData.createdAt,
            // 保留其他字段
            ...newQuestionData
          };
          
          // 将新问题添加到列表
          this.customQuestions.push(formattedQuestion);
          this.newQuestion = '';
          
          // 关闭弹窗，让用户看到主页面
          this.showCustomModal = false;
          
          // 自动切换到新添加的问题（如果它是未回答的问题）
          // 使用 setTimeout 确保响应式更新已完成（uni-app 中使用 setTimeout 更可靠）
          setTimeout(() => {
            const newQuestionIndex = this.unansweredQuestions.findIndex(
              q => q.id === formattedQuestion.id
            );
            if (newQuestionIndex >= 0) {
              // 找到新问题在未回答列表中的位置，切换过去
              this.qIndex = newQuestionIndex;
              // 清空当前的答案输入，准备回答新问题
              this.myAnswer = '';
              this.partnerAnswer = '';
              
              console.log('✅ 已切换到新添加的问题:', formattedQuestion);
            }
          }, 100);
          
          uni.showToast({ title: '问题添加成功', icon: 'success' });
        }
      } catch (e) {
        console.error('添加问题失败', e);
        
        // 401错误特殊处理
        if (e.statusCode === 401) {
          uni.showModal({
            title: '登录已过期',
            content: '您的登录已过期，请重新登录',
            showCancel: false,
            success: () => {
              uni.reLaunch({
                url: '/pages/login/index'
              });
            }
          });
          return;
        }
        
        uni.showToast({ title: '添加失败，请重试', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    async deleteCustomQuestion(index) {
      const question = this.customQuestions[index];
      
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个问题吗？',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              uni.showLoading({ title: '删除中...' });
              
              // 调用后端API删除问题
              const res = await deleteCustomQuestion(question.id);
              
              if (res.success) {
                // 从列表中移除
                this.customQuestions.splice(index, 1);
                uni.showToast({ title: '已删除', icon: 'success' });
              }
            } catch (e) {
              console.error('删除问题失败', e);
              
              // 401错误特殊处理
              if (e.statusCode === 401) {
                uni.showModal({
                  title: '登录已过期',
                  content: '您的登录已过期，请重新登录',
                  showCancel: false,
                  success: () => {
                    uni.reLaunch({
                      url: '/pages/login/index'
                    });
                  }
                });
                return;
              }
              
              uni.showToast({ title: '删除失败，请重试', icon: 'none' });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },

    closeCustomModal() {
      this.showCustomModal = false;
      this.newQuestion = '';
    }
  }
};
</script>

<style>
.qna-page { 
  min-height: 100vh; 
  background: #F8F0FC; 
  padding-bottom: 60rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.header { padding: 32rpx 24rpx 12rpx 24rpx; }
/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #F8F0FC;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: linear-gradient(180deg, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
  background: -webkit-linear-gradient(top, #F8F0FC 0%, #F3E8FF 30%, #F0E0FF 60%, #F8F0FC 100%);
}

.status-bar {
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #6B5B95;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 50rpx;
  font-weight: 600;
  color: #6B5B95;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.3s;
}

.back-icon:active {
  opacity: 0.6;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title { 
  font-size: 34rpx; 
  font-weight: 600; 
  color: #6B5B95; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.subtitle { 
  margin-top: 6rpx; 
  font-size: 26rpx; 
  color: #9B8FB8; 
  display: block; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.header-actions { margin-top: 16rpx; }
.btn-custom { 
  background: #DCC7E1; 
  color: #ffffff; 
  border-radius: 24rpx; 
  padding: 14rpx 28rpx; 
  font-size: 26rpx; 
  border: none; 
}

.question-card { 
  margin: 24rpx; 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 24rpx; 
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); 
}
.q-label { font-size: 24rpx; color: #9B8FB8; }
.q-text { 
  margin-top: 8rpx; 
  font-size: 34rpx; 
  color: #6B5B95; 
  font-weight: 600; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.answer-card { 
  margin: 0 24rpx; 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 24rpx; 
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); 
}
.a-label { 
  font-size: 28rpx; 
  color: #6B5B95; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.a-input { 
  margin-top: 12rpx; 
  min-height: 100rpx; 
  border: 1rpx solid #F3E8FF; 
  border-radius: 16rpx; 
  padding: 16rpx; 
  font-size: 26rpx; 
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.actions { margin-top: 16rpx; display: flex; gap: 12rpx; }
.btn { 
  padding: 16rpx 26rpx; 
  border-radius: 14rpx; 
  font-size: 26rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn.primary { 
  background: #DCC7E1; 
  color: #ffffff; 
}
.btn.secondary { 
  background: #F3E8FF; 
  color: #6B5B95; 
}

.partner-card { 
  margin: 16rpx 24rpx; 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 24rpx; 
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); 
}
.p-label { 
  font-size: 28rpx; 
  color: #6B5B95; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.p-text { 
  margin-top: 8rpx; 
  font-size: 26rpx; 
  color: #9B8FB8; 
  font-weight: 400;
  line-height: 1.8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.floating { 
  position: fixed; 
  right: 24rpx; 
  bottom: 120rpx; 
  background: #DCC7E1; 
  color: #ffffff; 
  border-radius: 999rpx; 
  padding: 16rpx 20rpx; 
  display: flex; 
  align-items: center; 
  gap: 10rpx; 
  box-shadow: 0 10rpx 24rpx rgba(220, 199, 225, 0.35); 
  z-index: 99; 
}
.custom-floating { bottom: 200rpx; }
.float-icon { font-size: 26rpx; }
.float-text { font-size: 24rpx; }

.modal-mask { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.35); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 100; 
}
.modal { 
  width: 88%; 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 24rpx; 
  max-height: 80vh; 
  display: flex; 
  flex-direction: column; 
}
.modal.custom-modal { width: 92%; }
.modal-title { 
  font-size: 34rpx; 
  font-weight: 600; 
  color: #6B5B95; 
  margin-bottom: 16rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.history-list { max-height: 520rpx; margin-top: 12rpx; }
.history-item { padding: 16rpx 0; border-bottom: 1rpx solid #F3E8FF; }
.h-q { 
  font-size: 26rpx; 
  color: #6B5B95; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.h-me, .h-ta { 
  font-size: 26rpx; 
  color: #9B8FB8; 
  margin-top: 6rpx; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.h-time { 
  font-size: 24rpx; 
  color: #9B8FB8; 
  margin-top: 6rpx; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.modal-actions { margin-top: 14rpx; display: flex; justify-content: flex-end; gap: 12rpx; }

/* 自定义问题弹窗样式 */
.add-question { display: flex; gap: 12rpx; align-items: flex-start; margin-bottom: 16rpx; }
.q-input { 
  flex: 1; 
  min-height: 80rpx; 
  border: 1rpx solid #F3E8FF; 
  border-radius: 12rpx; 
  padding: 12rpx; 
  font-size: 26rpx; 
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn.small { padding: 12rpx 20rpx; font-size: 24rpx; white-space: nowrap; }

.question-list { flex: 1; overflow-y: auto; }
.section-title { 
  font-size: 26rpx; 
  color: #6B5B95; 
  margin-bottom: 12rpx; 
  padding-left: 4rpx; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.question-item { 
  display: flex; 
  align-items: flex-start; 
  padding: 14rpx 12rpx; 
  background: #F8F0FC; 
  border-radius: 12rpx; 
  margin-bottom: 8rpx; 
  border: 1rpx solid #F3E8FF;
}
.question-item.custom { 
  background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); 
  border: 1rpx solid #D8B4FE;
}
.q-num { 
  font-size: 24rpx; 
  color: #DCC7E1; 
  font-weight: 600; 
  margin-right: 8rpx; 
  flex-shrink: 0; 
}
.q-content { 
  flex: 1; 
  font-size: 26rpx; 
  color: #6B5B95; 
  word-break: break-all; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.q-delete { 
  font-size: 24rpx; 
  color: #ff6b6b; 
  margin-left: 12rpx; 
  flex-shrink: 0; 
  padding: 4rpx 8rpx; 
}

.empty-hint { 
  padding: 32rpx; 
  text-align: center; 
  color: #9B8FB8; 
  font-size: 26rpx; 
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
</style>
