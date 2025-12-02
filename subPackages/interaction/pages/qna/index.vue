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
          <text class="title-text">恋与问答</text>
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
    <view v-if="hasSubmitted" class="partner-card">
      <text class="p-label">TA 的答案</text>
      <text v-if="partnerAnswer" class="p-text">{{ partnerAnswer }}</text>
      <text v-else class="p-text empty-hint-text">对方暂未作答</text>
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

        <!-- 添加新问题 -->
        <view class="add-question">
          <textarea 
            class="q-input" 
            v-model="newQuestion" 
            placeholder="输入你想问的问题..."
            maxlength="100"
          />
        </view>

        <view class="modal-actions">
          <button class="btn primary small" @click="addCustomQuestion">添加问题</button>
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
  getPartnerAnswer,
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
        content: '恋与问答功能需要登录后才能使用，请先登录',
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
    
    // 处理从历史记录跳转过来的问题ID
    const qid = options && options.qid ? Number(options.qid) : null;
    const qTextParam = options && typeof options.qtext === 'string' ? options.qtext : '';
    this.targetQuestionFallbackText = qTextParam ? decodeURIComponent(qTextParam) : '';
    if (qid) {
      console.log('📌 从历史记录跳转，目标问题ID:', qid);
      // 保存目标问题ID，用于 currentQuestion 计算属性
      this.targetQuestionId = qid;
      
      // 设置防止自动切换标志，避免从历史记录查看时自动跳转
      this.preventAutoSwitch = true;
      
      // 尝试在未回答问题中找到（如果问题还未回答）
      const idx = this.unansweredQuestions.findIndex(q => q.id === qid);
      if (idx >= 0) {
        this.qIndex = idx;
        console.log('✅ 问题未回答，设置 qIndex:', idx);
      } else {
        // 问题已回答，不在 unansweredQuestions 中
        // 检查问题是否存在于所有问题列表中
        const allQuestions = this.questions;
        const questionExists = allQuestions.some(q => q.id === qid);
        if (questionExists) {
          console.log('✅ 问题已回答，但存在于问题列表中，将显示该问题');
        } else {
          console.warn('⚠️ 问题ID不存在于问题列表中:', qid);
          // 问题可能已被下架或未包含在当前问题列表中
          // 保留 targetQuestionId，后续在 currentQuestion 中使用 qtext 回退显示
          this.qIndex = 0;
        }
      }
    } else {
      // 默认显示第一个未回答的问题
      this.qIndex = 0;
      this.targetQuestionId = null;
    }
    
    // 如果携带 time，回显当天答案
    const time = options && options.time ? decodeURIComponent(options.time) : '';
    const targetQuestionId = qid || (this.currentQuestion && this.currentQuestion.id);
    
    console.log('📋 初始化答案加载:', {
      targetQuestionId,
      time,
      currentQuestionId: this.currentQuestion?.id,
      historyCount: this.history.length
    });
    
    if (targetQuestionId) {
      const rec = this.history.find(r => {
        const rQuestionId = r.questionId || r.question_id;
        return rQuestionId != null && Number(rQuestionId) === Number(targetQuestionId) && (!time || r.time === time);
      });
      if (rec) {
        console.log('✅ 从历史记录加载答案:', {
          questionId: targetQuestionId,
          hasMyAnswer: !!rec.myAnswer,
          hasPartnerAnswer: !!rec.partnerAnswer,
          partnerAnswer: rec.partnerAnswer ? rec.partnerAnswer.substring(0, 30) + '...' : '空',
          recData: rec
        });
        this.myAnswer = rec.myAnswer || '';
        this.partnerAnswer = rec.partnerAnswer || '';
        this.hasSubmitted = true; // 如果是从历史记录回显，标记为已提交状态
        
        // 无论历史记录中是否有对方答案，都从后端获取最新的对方答案
        console.log('📥 从后端获取最新的对方答案，问题ID:', targetQuestionId);
        try {
          const partnerRes = await getPartnerAnswer(targetQuestionId);
          this.handlePartnerAnswerResponse(partnerRes, {
            historyRecord: rec,
            context: `onLoad questionId=${targetQuestionId}`
          });
        } catch (e) {
          console.error('❌ 获取对方答案失败:', e);
          console.error('错误详情:', {
            message: e.message,
            statusCode: e.statusCode,
            data: e.data
          });
          // 获取失败不影响显示，使用历史记录中的答案
        }
      } else {
        // 即使历史记录中没有，也尝试加载当前问题的答案
        console.log('📋 历史记录中未找到，调用 loadAnswerForCurrentQuestion');
        this.loadAnswerForCurrentQuestion();
      }
    } else {
      // 如果没有指定问题ID，加载当前问题的答案
      this.loadAnswerForCurrentQuestion();
    }
  },
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      defaultQuestions: [],
      customQuestions: [],
      qIndex: 0,
      myAnswer: '',
      partnerAnswer: '',
      hasSubmitted: false, // 标记当前问题是否已提交
      showHistory: false,
      showCustomModal: false,
      newQuestion: '',
      history: [],
      targetQuestionId: null, // 从历史记录跳转过来的目标问题ID
      targetQuestionFallbackText: '' // 添加标志防止提交后自动切换问题
    };
  },
  watch: {
    // 监听当前问题变化，自动加载对应的答案
    'currentQuestion.id': {
      handler(newId, oldId) {
        // 如果问题ID发生变化，且不是初始化时（oldId 存在），重新加载答案
        if (newId && oldId && newId !== oldId) {
          console.log('🔄 问题切换:', { from: oldId, to: newId });
          this.loadAnswerForCurrentQuestion();
        }
      },
      immediate: false
    }
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
      const validCustomQuestions = (this.customQuestions || []).filter(q => q && q.id != null);
      const validDefaultQuestions = (this.defaultQuestions || []).filter(q => q && q.id != null);
      
      // 始终返回系统默认题 + 自定义题，两类题目都包含在题库中
      // 默认题在前，自定义题在后，便于维护原有题目顺序
      return [...validDefaultQuestions, ...validCustomQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      const answeredIds = new Set(
        this.history.map(h => {
          const qid = h.questionId || h.question_id;
          return qid != null ? Number(qid) : null;
        }).filter(id => id != null)
      );
      
      const unanswered = this.questions.filter(q => {
        if (!q || q.id == null) return false;
        return !answeredIds.has(Number(q.id)) && q.isActive !== false;
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 未回答问题计算:', {
          totalQuestions: this.questions.length,
          answeredCount: answeredIds.size,
          unansweredCount: unanswered.length,
        });
      }
      
      return unanswered;
    },
    currentQuestion() {
      console.log('🔍 currentQuestion 计算开始:', {
        targetQuestionId: this.targetQuestionId,
        targetQuestionFallbackText: this.targetQuestionFallbackText,
        qIndex: this.qIndex,
        unansweredQuestionsLength: this.unansweredQuestions.length
      });
      
      // 如果指定了目标问题ID（从历史记录跳转），优先显示该问题
      if (this.targetQuestionId != null) {
        const targetId = Number(this.targetQuestionId);
        console.log('📌 检查目标问题ID:', targetId);
        
        // 从所有问题中查找目标问题
        const targetQuestion = this.questions.find(q => q && q.id != null && Number(q.id) === targetId);
        if (targetQuestion) {
          console.log('🎯 显示目标问题:', {
            id: targetQuestion.id,
            text: targetQuestion.text.substring(0, 20) + '...'
          });
          return targetQuestion;
        } else {
          console.log('❓ 目标问题在问题列表中未找到');
          if (this.targetQuestionFallbackText) {
            console.warn('⚠️ 目标问题不在问题列表，使用历史记录携带的题干');
            return {
              id: targetId,
              text: this.targetQuestionFallbackText,
              category: 'history',
              isFallback: true
            };
          }
          console.warn('⚠️ 目标问题不存在，回退到默认逻辑');
          // 如果目标问题不存在，清除 targetQuestionId 并回退到默认逻辑
          this.targetQuestionId = null;
          this.targetQuestionFallbackText = '';
        }
      }
      
      // 如果已经提交了当前问题的答案，保持在当前问题而不是切换到下一个
      if (this.hasSubmitted && this.targetQuestionId == null) {
        // 尝试从历史记录中找到最新提交的问题
        if (this.history.length > 0 && this.history[0] && this.history[0].questionId) {
          const lastSubmittedId = Number(this.history[0].questionId);
          const currentQuestion = this.questions.find(q => 
            q && q.id != null && Number(q.id) === lastSubmittedId
          );
          
          if (currentQuestion) {
            console.log('🔒 保持已提交的问题:', {
              id: currentQuestion.id,
              text: currentQuestion.text.substring(0, 20) + '...'
            });
            return currentQuestion;
          }
        }
      }
      
      // 从未回答的问题中获取当前问题
      if (this.unansweredQuestions.length === 0) {
        console.log('🎉 所有问题已回答完毕');
        return { id: 0, text: '所有问题已回答完毕！🎉' };
      }
      
      const current = this.unansweredQuestions[this.qIndex] || this.unansweredQuestions[0];
      console.log('➡️ 返回当前问题:', {
        index: this.qIndex,
        question: current ? current.text.substring(0, 20) + '...' : 'null'
      });
      return current;
    }
  },
  mounted() {
    // onLoad 中已经加载，无需重复加载
  },
  methods: {
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
    handlePartnerAnswerResponse(partnerRes, { historyRecord = null, context = '', updateState = true } = {}) {
      const normalized = this.normalizeApiResponse(partnerRes, '获取对方答案成功');
      console.log('📥 对方答案响应（标准化）:', {
        context,
        success: normalized.success,
        message: normalized.message,
        data: normalized.data
      });
      
      if (!normalized.success) {
        console.warn('⚠️ 获取对方答案业务失败:', {
          context,
          message: normalized.message,
          raw: normalized.raw
        });
        return { updated: false, answer: '', normalized };
      }
      
      const pickPayload = candidate => {
        if (candidate && typeof candidate === 'object') {
          if (candidate.data && typeof candidate.data === 'object') {
            return candidate.data;
          }
          return candidate;
        }
        return null;
      };
      
      let payload =
        pickPayload(normalized.data) ||
        pickPayload(normalized.raw?.data) ||
        pickPayload(normalized.raw) ||
        null;
      
      if (!payload) {
        console.warn('⚠️ 对方答案响应缺少有效数据对象:', { context, normalized });
        return { updated: false, answer: '', normalized };
      }
      
      const answer =
        payload.answer ??
        payload.partnerAnswer ??
        payload.partner_answer ??
        payload.data?.answer ??
        payload.data?.partnerAnswer ??
        payload.data?.partner_answer ??
        '';
      
      const answeredFlag =
        payload.hasAnswered ??
        payload.hasPartnerAnswered ??
        payload.has_partner_answered ??
        payload.has_answered ??
        payload.data?.hasAnswered ??
        payload.data?.hasPartnerAnswered;
      
      const hasAnswered = answeredFlag === undefined ? !!answer : answeredFlag !== false;
      
      if (hasAnswered && answer) {
        console.log('✅ 解析到对方答案:', {
          context,
          preview: answer.substring(0, 30) + (answer.length > 30 ? '...' : '')
        });
        if (updateState) {
          this.partnerAnswer = answer;
          if (historyRecord) {
            historyRecord.partnerAnswer = answer;
            historyRecord.partnerAnsweredAt =
              payload.answeredAt ||
              payload.partnerAnsweredAt ||
              payload.answered_at ||
              historyRecord.partnerAnsweredAt;
          }
          // 强制触发Vue响应式更新
          this.$forceUpdate();
        }
        return { updated: true, answer, normalized };
      }
      
      console.log('⚠️ 对方暂未作答或答案为空:', { context, payload });
      return { updated: false, answer: '', normalized };
    },
    formatQuestionList(list, categoryFallback = 'preset') {
      console.log('🔧 formatQuestionList 调用:', { list, categoryFallback });
      if (!Array.isArray(list)) {
        console.log('⚠️ list 不是数组');
        return [];
      }
      const result = list
        .filter(q => q && q.id != null)
        .map(q => {
          console.log('🔧 处理问题项:', q);
          const formatted = {
            ...q,
            id: q.id,
            text: q.text || q.questionText || '',
            category: q.category || categoryFallback,
            isActive: q.isActive !== false,
            orderIndex: q.orderIndex ?? 999
          };
          console.log('🔧 格式化后的问题项:', formatted);
          if (formatted.questionText) {
            delete formatted.questionText;
          }
          return formatted;
        });
      console.log('🔧 formatQuestionList 结果:', result);
      return result;
    },
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
      
      // 设置防止自动切换标志
      this.preventAutoSwitch = true;
      
      try {
        uni.showLoading({ title: '提交中...' });
        
        // 调用后端API提交答案
        const answerData = {
          questionId: this.currentQuestion.id,
          answer: this.myAnswer,
          questionText: this.currentQuestion.text
        };
        
        console.log('📤 准备提交答案:', {
          questionId: answerData.questionId,
          answer: answerData.answer,
          questionText: answerData.questionText,
          currentQuestion: this.currentQuestion,
          allQuestions: this.questions.map(q => ({ id: q.id, text: q.text })),
          customQuestions: this.customQuestions.map(q => ({ id: q.id, text: q.text })),
          defaultQuestions: this.defaultQuestions.map(q => ({ id: q.id, text: q.text }))
        });
        
        const res = await submitAnswer(answerData);
        
        console.log('📥 提交答案响应:', res);
        
        if (res && res.success) {
          // 保存当前问题的ID，确保后续操作使用正确的ID
          const submittedQuestionId = Number(this.currentQuestion.id);
          console.log('✅ 提交答案成功，问题ID:', submittedQuestionId);
          
          // 标记已提交，显示对方答案区域
          this.hasSubmitted = true;
          
          // 兼容不同的响应格式
          const responseData = res.data || res;
          
          // 先尝试从提交接口返回的数据中获取对方答案
          let partnerAnswerFromSubmit = '';
          if (responseData && (responseData.hasPartnerAnswered || responseData.hasPartnerAnswer)) {
            partnerAnswerFromSubmit = responseData.partnerAnswer || '';
            this.partnerAnswer = partnerAnswerFromSubmit;
            console.log('📥 从提交接口获取到对方答案:', partnerAnswerFromSubmit ? partnerAnswerFromSubmit.substring(0, 20) + '...' : '空');
          }
          
          // 无论提交接口是否返回对方答案，都主动调用接口获取对方答案（确保获取最新数据）
          try {
            console.log('🔍 开始获取对方答案，问题ID:', submittedQuestionId);
            const partnerRes = await getPartnerAnswer(submittedQuestionId);
            console.log('📥 对方答案接口原始响应:', partnerRes);
            const partnerResult = this.handlePartnerAnswerResponse(partnerRes, {
              context: `submit questionId=${submittedQuestionId}`
            });
            console.log('🔧 对方答案处理结果:', {
              updated: partnerResult.updated,
              hasAnswer: !!partnerResult.answer,
              answerPreview: partnerResult.answer ? partnerResult.answer.substring(0, 20) + '...' : '空',
              currentPartnerAnswer: this.partnerAnswer
            });
            if (partnerResult.updated && partnerResult.answer) {
              partnerAnswerFromSubmit = partnerResult.answer;
            } else if (!partnerAnswerFromSubmit) {
              // 如果接口未返回答案且提交响应中也没有，保持空状态
              this.partnerAnswer = '';
            }
          } catch (partnerError) {
            // 获取对方答案失败不影响主流程，只记录日志
            console.error('❌ 获取对方答案接口调用失败:', partnerError);
            console.error('❌ 错误详情:', {
              message: partnerError.message,
              statusCode: partnerError.statusCode,
              data: partnerError.data
            });
            // 如果提交接口返回了对方答案，继续使用它；否则清空（会显示"对方暂未作答"提示）
            if (!partnerAnswerFromSubmit) {
              this.partnerAnswer = '';
            }
          }
          
          // 添加到本地历史记录
          const record = {
            id: responseData?.answerId || res?.answerId || responseData?.id || Date.now(),
            questionId: Number(submittedQuestionId), // 确保使用数字类型
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: partnerAnswerFromSubmit || this.partnerAnswer || '',
            time: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
          };
          
          // 检查是否已存在相同问题的历史记录，避免重复
          const existingIndex = this.history.findIndex(h => 
            h.questionId === record.questionId || 
            (h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId))
          );
          
          if (existingIndex >= 0) {
            // 更新现有记录而不是添加新记录
            console.log('🔄 更新现有历史记录:', record);
            this.history[existingIndex] = record;
          } else {
            // 添加新记录
            console.log('💾 添加新的历史记录:', record);
            this.history.unshift(record);
          }
          console.log('💾 保存历史记录:', {
            questionId: record.questionId,
            questionText: record.question.substring(0, 20) + '...',
            hasPartnerAnswer: !!record.partnerAnswer
          });
          this.history.unshift(record);
          this.saveHistory();
          
          // 更新当前显示的答案（关键修复点）
          this.myAnswer = this.myAnswer;
          this.partnerAnswer = partnerAnswerFromSubmit || this.partnerAnswer || '';
          
          // 强制触发Vue响应式更新
          this.$forceUpdate();
          
          uni.showToast({ title: '提交成功', icon: 'success' });
          
          // 保留在当前题目，用户手动点击"下一题"
          // 不再自动更新历史记录导致问题切换，而是保持当前题目状态
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
          
          // 检查是否已存在相同问题的历史记录，避免重复
          const existingIndex = this.history.findIndex(h => 
            h.questionId === record.questionId || 
            (h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId))
          );
          
          if (existingIndex >= 0) {
            // 更新现有记录而不是添加新记录
            console.log('🔄 更新现有历史记录（异常情况）:', record);
            this.history[existingIndex] = record;
          } else {
            // 添加新记录
            console.log('💾 添加新的历史记录（异常情况）:', record);
            this.history.unshift(record);
          }
          
          // 更新当前显示的答案（关键修复点）
          this.myAnswer = this.myAnswer;
          this.partnerAnswer = '';
          this.hasSubmitted = true;
          
          // 强制触发Vue响应式更新
          this.$forceUpdate();
          
          uni.showToast({ title: '提交成功（已保存到本地）', icon: 'success' });
          
          // 保留在当前题目，用户手动点击"下一题"
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
          // 不需要手动 hideLoading，finally 块会处理
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
          // 不需要手动 hideLoading，finally 块会处理
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
              
              // 检查是否已存在相同问题的历史记录，避免重复
              const existingIndex = this.history.findIndex(h => 
                h.questionId === record.questionId || 
                (h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId))
              );
              
              if (existingIndex >= 0) {
                // 更新现有记录而不是添加新记录
                console.log('🔄 更新现有历史记录（404情况）:', record);
                this.history[existingIndex] = record;
              } else {
                // 添加新记录
                console.log('💾 添加新的历史记录（404情况）:', record);
                this.history.unshift(record);
              }
              // 注意：上面已经添加了记录，这里不再重复添加
              this.saveHistory();
              
              // 更新当前显示的答案（关键修复点）
              this.myAnswer = this.myAnswer;
              this.partnerAnswer = '';
              this.hasSubmitted = true;
              
              // 强制触发Vue响应式更新
              this.$forceUpdate();
              
              uni.showToast({ title: '已保存到本地', icon: 'none' });
              
              // 保留在当前题目，用户手动点击"下一题"
            }
          });
          return;
        }
        
        // 不需要手动 hideLoading，finally 块会处理
        uni.showToast({ 
          title: `提交失败: ${e.statusCode || '网络错误'}`, 
          icon: 'none',
          duration: 3000
        });
      } finally {
        // 确保loading关闭（使用 try-catch 避免重复隐藏导致的错误）
        try {
          uni.hideLoading();
        } catch (e) {
          // 忽略 hideLoading 错误（可能已经隐藏过了）
        }
        
        // 延迟重置防止自动切换标志，确保页面更新完成
        setTimeout(() => {
          this.preventAutoSwitch = false;
        }, 100);
      }
    },
    nextQuestion() {
      // 解除问题锁定，允许切换到下一个
      this.targetQuestionId = null;
      this.targetQuestionFallbackText = '';
      
      // 重置提交状态，允许切换到下一个问题
      this.hasSubmitted = false;
      this.myAnswer = '';
      this.partnerAnswer = '';

      const unanswered = this.unansweredQuestions;
      if (unanswered.length === 0) {
        uni.showToast({ title: '所有问题已回答完毕！', icon: 'success' });
        // 停留在最后一个已回答的问题上
        return;
      }

      // 直接从最新的未回答问题列表中选择第一个
      this.qIndex = 0;

      // 使用 $nextTick 确保 DOM 更新后再加载答案
      this.$nextTick(() => {
        this.loadAnswerForCurrentQuestion();
      });
    },
    // 加载当前问题的答案（从历史记录或后端）
    async loadAnswerForCurrentQuestion() {
      if (!this.currentQuestion || !Number.isFinite(this.currentQuestion.id) || this.currentQuestion.id === 0) {
        this.myAnswer = '';
        this.partnerAnswer = '';
        this.hasSubmitted = false;
        return;
      }

      const questionId = Number(this.currentQuestion.id);
      const historyRecord = this.history.find(h => Number(h.questionId) === questionId);

      if (historyRecord) {
        this.myAnswer = historyRecord.myAnswer || '';
        this.partnerAnswer = historyRecord.partnerAnswer || '';
        this.hasSubmitted = true;
        
        // 即使历史记录中有，也从后端获取最新的对方答案以保证数据同步
        try {
          const partnerRes = await getPartnerAnswer(questionId);
          this.handlePartnerAnswerResponse(partnerRes, {
            historyRecord,
            context: `loadAnswer questionId=${questionId}`
          });
        } catch (e) {
          console.error(`❌ 获取对方答案失败 (问题ID: ${questionId}):`, e);
        }
      } else {
        this.myAnswer = '';
        this.partnerAnswer = '';
        this.hasSubmitted = false;
      }
      this.$forceUpdate();
    },
    openHistory() {
      
      uni.navigateTo({ url: '/subPackages/interaction/pages/qna/history' });
    },
    closeHistory() {
      this.showHistory = false;
    },
    clearHistory() {
      this.history = [];
      this.saveHistory();
      uni.showToast({ title: '记录已清空', icon: 'none' });
    },
    // 标准化历史记录项（从后端或本地存储）
    normalizeHistoryItem(item) {
      if (!item) return null;

      const id = item.id || item.answerId;
      const questionId = item.questionId || item.question_id;

      // 优先使用后端返回的题干，其次从问题列表中回填
      let question = item.question || item.questionText || item.question_text;
      if (!question && questionId != null) {
        const allQuestions = [
          ...(this.defaultQuestions || []),
          ...(this.customQuestions || [])
        ];
        const foundQuestion = allQuestions.find(q => q && q.id != null && Number(q.id) === Number(questionId));
        if (foundQuestion && foundQuestion.text) {
          question = foundQuestion.text;
        }
      }

      // 把后端的 answer 字段映射为 myAnswer，保持与页面内部逻辑一致
      const myAnswer = item.myAnswer || item.answer || item.my_answer;
      const partnerAnswer = item.partnerAnswer || item.partner_answer || '';
      const time =
        item.time ||
        item.answeredAt ||
        item.createdAt ||
        item.created_at ||
        item.updatedAt ||
        new Date().toLocaleString();

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
    },
    // 从后端加载历史记录
    async loadHistoryFromServer() {
      try {
        const res = await getHistory({ page: 1, pageSize: 100 });
        const normalizedRes = this.normalizeApiResponse(res, '获取历史记录成功');
        
        if (!normalizedRes.success) {
          console.warn(`⚠️ 历史记录业务状态返回失败: ${normalizedRes.message}`);
          const localHistory = uni.getStorageSync('qna_history');
          this.history = Array.isArray(localHistory) ? localHistory : [];
          return;
        }

        const historyList = normalizedRes.data?.list || normalizedRes.data?.history || normalizedRes.data?.answers || (Array.isArray(normalizedRes.data) ? normalizedRes.data : []);

        this.history = historyList.map(item => this.normalizeHistoryItem(item));
        
        console.log('✅ 历史记录加载并标准化成功:', {
          count: this.history.length,
          sample: this.history.slice(0, 2)
        });

      } catch (e) {
        console.error('加载历史记录失败', e);
        if (e.statusCode === 401) return; // 登录问题已在其他地方处理
        const localHistory = uni.getStorageSync('qna_history');
        this.history = Array.isArray(localHistory) ? localHistory : [];
      }
    },
    // 从后端加载问题列表
    async loadQuestionsFromServer() {
      try {
        uni.showLoading({ title: '加载中...' });
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
          console.log('📋 使用 topLevelQuestions 格式');
          const formatted = this.formatQuestionList(topLevelQuestions);
          presetQuestions = formatted.filter(q => (q.category || 'preset') === 'preset');
          customQuestions = formatted.filter(q => (q.category || 'preset') === 'custom');
        } else if (rawData && (Array.isArray(rawData.defaultQuestions) || Array.isArray(rawData.customQuestions))) {
          console.log('📋 使用 rawData 格式');
          console.log(' rawData.defaultQuestions:', rawData.defaultQuestions);
          console.log(' rawData.customQuestions:', rawData.customQuestions);
          presetQuestions = this.formatQuestionList(rawData.defaultQuestions, 'preset');
          customQuestions = this.formatQuestionList(rawData.customQuestions, 'custom');
        } else if (res && res.code === 200 && res.data && (Array.isArray(res.data.defaultQuestions) || Array.isArray(res.data.customQuestions))) {
          console.log('📋 使用 res.data 格式');
          console.log(' res.data.defaultQuestions:', res.data.defaultQuestions);
          console.log(' res.data.customQuestions:', res.data.customQuestions);
          presetQuestions = this.formatQuestionList(res.data.defaultQuestions, 'preset');
          customQuestions = this.formatQuestionList(res.data.customQuestions, 'custom');
        } else {
          console.log('📋 未识别的数据格式:', { rawData, res });
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
        } else {
          console.warn('⚠️ 问题列表响应格式不符合预期:', res);
          console.warn('⚠️ 保留本地预设问题，避免页面空白');
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
          // 不需要手动 hideLoading，finally 块会处理
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
        // 确保loading关闭（使用 try-catch 避免重复隐藏导致的错误）
        try {
        uni.hideLoading();
        } catch (e) {
          // 忽略 hideLoading 错误（可能已经隐藏过了）
        }
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
        const normalizedRes = this.normalizeApiResponse(res, '添加问题成功');
        if (!normalizedRes.success) {
          uni.showToast({ title: normalizedRes.message || '添加失败，请重试', icon: 'none' });
          return;
        }
        
        // 格式化新问题，确保包含所有必需字段
        const newQuestionData = normalizedRes.data || {};
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
            // 加载新问题的答案（会自动清空或从历史记录加载）
            this.loadAnswerForCurrentQuestion();
            
            console.log('✅ 已切换到新添加的问题:', formattedQuestion);
          }
        }, 100);
        
        uni.showToast({ title: normalizedRes.message || '问题添加成功', icon: 'success' });
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
        // 确保loading关闭（使用 try-catch 避免重复隐藏导致的错误）
        try {
        uni.hideLoading();
        } catch (e) {
          // 忽略 hideLoading 错误（可能已经隐藏过了）
        }
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
              // 确保loading关闭（使用 try-catch 避免重复隐藏导致的错误）
              try {
              uni.hideLoading();
              } catch (e) {
                // 忽略 hideLoading 错误（可能已经隐藏过了）
              }
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
  background: #FFFAF4; 
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
  font-size: 36rpx;
  font-weight: 500;
  color: #4A4A4A;
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
  color: #4A4A4A;
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
  color: #4A4A4A; 
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
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #ffffff; 
  border-radius: 24rpx; 
  padding: 14rpx 28rpx; 
  font-size: 26rpx; 
  border: none; 
}

.question-card { 
  margin: 24rpx; 
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx; 
  padding: 24rpx; 
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}
.q-label { font-size: 24rpx; color: #9B8FB8; }
.q-text { 
  margin-top: 8rpx; 
  font-size: 34rpx; 
  color: #4A4A4A; 
  font-weight: 600; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.answer-card { 
  margin: 0 24rpx; 
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx; 
  padding: 24rpx; 
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}
.a-label { 
  font-size: 28rpx; 
  color: #4A4A4A; 
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
  border: none;
}
.btn.primary { 
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #ffffff; 
}
.btn.secondary { 
  background: rgba(255, 255, 255, 0.8);
  color: #4A4A4A; 
  border: 1rpx solid rgba(255, 181, 194, 0.3);
}

.partner-card { 
  margin: 16rpx 24rpx; 
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx; 
  padding: 24rpx; 
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
}
.p-label { 
  font-size: 28rpx; 
  color: #4A4A4A; 
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
.empty-hint-text {
  color: #C8C8C8;
  font-style: italic;
}

.floating { 
  position: fixed; 
  right: 24rpx; 
  bottom: 120rpx; 
  background: linear-gradient(135deg, #FFB5C2 0%, #FFD4A3 100%);
  color: #ffffff; 
  border-radius: 999rpx; 
  padding: 16rpx 20rpx; 
  display: flex; 
  align-items: center; 
  gap: 10rpx; 
  box-shadow: 0 8rpx 24rpx rgba(255, 181, 194, 0.4); 
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
  color: #4A4A4A; 
  margin-bottom: 16rpx; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.history-list { max-height: 520rpx; margin-top: 12rpx; }
.history-item { padding: 16rpx 0; border-bottom: 1rpx solid #F3E8FF; }
.h-q { 
  font-size: 26rpx; 
  color: #4A4A4A; 
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
.modal-actions { margin-top: 14rpx; display: flex; justify-content: flex-end; gap: 12rpx; align-items: center; }

/* 自定义问题弹窗样式 */
.add-question { display: flex; gap: 12rpx; align-items: flex-start; margin-top: 16rpx; margin-bottom: 12rpx; }
.q-input { 
  flex: 1; 
  height: 60rpx; 
  line-height: 60rpx;
  border: 1rpx solid #F3E8FF; 
  border-radius: 8rpx; 
  padding: 0 12rpx; 
  font-size: 24rpx; 
  color: #333;
  resize: none;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.btn.small { padding: 12rpx 20rpx; font-size: 24rpx; white-space: nowrap; }

.question-list { flex: 1; overflow-y: auto; margin-top: 8rpx; }
.section-title { 
  font-size: 26rpx; 
  color: #4A4A4A; 
  margin-bottom: 12rpx; 
  padding-left: 4rpx; 
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}
.question-item { 
  display: flex; 
  align-items: flex-start; 
  padding: 14rpx 12rpx; 
  background: rgba(255, 255, 255, 0.5); 
  border-radius: 12rpx; 
  margin-bottom: 8rpx; 
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}
.question-item.custom { 
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}
.q-num { 
  font-size: 24rpx; 
  color: #FFB5C2; 
  font-weight: 600; 
  margin-right: 8rpx; 
  flex-shrink: 0; 
}
.q-content { 
  flex: 1; 
  font-size: 26rpx; 
  color: #4A4A4A; 
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