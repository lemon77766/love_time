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
    
    // 处理从历史记录跳转过来的问题ID
    const qid = options && options.qid ? Number(options.qid) : null;
    if (qid) {
      console.log('📌 从历史记录跳转，目标问题ID:', qid);
      // 保存目标问题ID，用于 currentQuestion 计算属性
      this.targetQuestionId = qid;
      
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
          // 如果问题不存在，重置为默认显示
          this.targetQuestionId = null;
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
          console.log('📥 后端返回的对方答案响应:', {
            success: partnerRes?.success,
            data: partnerRes?.data,
            fullResponse: partnerRes
          });
          
          if (partnerRes && partnerRes.success) {
            // 处理不同的响应格式
            const partnerData = partnerRes.data || partnerRes;
            const hasAnswered = partnerData.hasAnswered !== false; // 默认为 true，除非明确为 false
            const answer = partnerData.answer || partnerData.partnerAnswer || partnerData.partner_answer || '';
            
            console.log('📥 解析后的对方答案数据:', {
              hasAnswered,
              answer: answer ? answer.substring(0, 30) + '...' : '空',
              partnerData
            });
            
            if (hasAnswered && answer) {
              console.log('✅ 更新对方答案:', answer.substring(0, 30) + '...');
              this.partnerAnswer = answer;
              // 同时更新历史记录中的对方答案
              if (rec) {
                rec.partnerAnswer = answer;
              }
            } else {
              console.log('⚠️ 对方暂未作答或答案为空');
              // 如果后端返回对方未作答，但历史记录中有，保留历史记录中的答案
              // 如果历史记录中也没有，则显示"对方暂未作答"
            }
          } else {
            console.warn('⚠️ 后端返回失败，使用历史记录中的答案');
          }
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
      hasSubmitted: false, // 标记当前问题是否已提交
      showHistory: false,
      showCustomModal: false,
      newQuestion: '',
      history: [],
      targetQuestionId: null // 从历史记录跳转过来的目标问题ID
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
      // 如果指定了目标问题ID（从历史记录跳转），优先显示该问题
      if (this.targetQuestionId != null) {
        const targetId = Number(this.targetQuestionId);
        // 从所有问题中查找目标问题
        const targetQuestion = this.questions.find(q => q && q.id != null && Number(q.id) === targetId);
        if (targetQuestion) {
          console.log('🎯 显示目标问题:', {
            id: targetQuestion.id,
            text: targetQuestion.text.substring(0, 20) + '...'
          });
          return targetQuestion;
        } else {
          console.warn('⚠️ 目标问题不存在，回退到默认逻辑');
          // 如果目标问题不存在，清除 targetQuestionId 并回退到默认逻辑
          this.targetQuestionId = null;
        }
      }
      
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
            const partnerRes = await getPartnerAnswer(submittedQuestionId);
            console.log('📥 获取对方答案响应:', {
              questionId: submittedQuestionId,
              response: partnerRes
            });
            
            if (partnerRes && partnerRes.success && partnerRes.data) {
              const partnerData = partnerRes.data;
              // 如果对方已回答，更新对方答案
              if (partnerData.hasAnswered && partnerData.answer) {
                this.partnerAnswer = partnerData.answer;
                partnerAnswerFromSubmit = partnerData.answer; // 更新用于保存历史记录的答案
              } else {
                // 如果对方还没回答，清空显示（会显示"对方暂未作答"提示）
                this.partnerAnswer = '';
              }
            }
          } catch (partnerError) {
            // 获取对方答案失败不影响主流程，只记录日志
            console.warn('⚠️ 获取对方答案失败（不影响提交）:', partnerError);
            // 如果提交接口返回了对方答案，继续使用它；否则清空（会显示"对方暂未作答"提示）
            if (!partnerAnswerFromSubmit) {
              this.partnerAnswer = '';
            }
          }
          
          // 添加到本地历史记录
          const record = {
            id: responseData?.answerId || res?.answerId || responseData?.id || Date.now(),
            questionId: submittedQuestionId, // 使用保存的ID，确保一致性
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: partnerAnswerFromSubmit || this.partnerAnswer || '',
            time: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
          };
          console.log('💾 保存历史记录:', {
            questionId: record.questionId,
            questionText: record.question.substring(0, 20) + '...',
            hasPartnerAnswer: !!record.partnerAnswer
          });
          this.history.unshift(record);
          this.saveHistory();
          
          uni.showToast({ title: '提交成功', icon: 'success' });
          
          // 保留在当前题目，用户手动点击“下一题”
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
          
          // 保留在当前题目，用户手动点击“下一题”
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
              this.history.unshift(record);
              this.saveHistory();
              uni.showToast({ title: '已保存到本地', icon: 'none' });
              
              // 保留在当前题目，用户手动点击“下一题”
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
      }
    },
    nextQuestion() {
      // 清除目标问题ID，恢复正常的问题切换逻辑
      if (this.targetQuestionId != null) {
        console.log('🔄 清除目标问题ID，恢复正常切换逻辑');
        this.targetQuestionId = null;
      }
      
      // 保存当前问题ID，用于调试
      const currentId = this.currentQuestion && this.currentQuestion.id;
      console.log('➡️ 切换到下一题，当前问题ID:', currentId);
      
      // 重新计算未回答问题列表，显示下一个
      // 注意：由于历史记录可能已更新，unansweredQuestions 会重新计算
      const unansweredCount = this.unansweredQuestions.length;
      
      if (unansweredCount === 0) {
        uni.showToast({ title: '所有问题已回答完毕！', icon: 'success' });
        return;
      }
      
      // 计算下一个问题的索引
      if (this.qIndex < unansweredCount - 1) {
        this.qIndex += 1;
      } else {
        this.qIndex = 0; // 回到第一个未回答的
      }
      
      // 注意：清空答案和重置状态会在 loadAnswerForCurrentQuestion 中处理
      // watch 会监听到 currentQuestion.id 的变化，自动调用 loadAnswerForCurrentQuestion
      // 但为了确保立即执行，我们也可以手动调用
      const nextId = this.currentQuestion && this.currentQuestion.id;
      console.log('➡️ 下一题ID:', nextId);
    },
    // 加载当前问题的答案（从历史记录或后端）
    async loadAnswerForCurrentQuestion() {
      if (!this.currentQuestion || !this.currentQuestion.id) {
        console.warn('⚠️ loadAnswerForCurrentQuestion: 当前问题无效', this.currentQuestion);
        return;
      }
      
      const questionId = Number(this.currentQuestion.id);
      console.log('📋 加载问题答案:', {
        questionId,
        questionText: this.currentQuestion.text,
        historyCount: this.history.length
      });
      
      // 先清空当前答案
      this.myAnswer = '';
      this.partnerAnswer = '';
      this.hasSubmitted = false;
      
      // 检查历史记录中是否有这个问题的答案
      const historyRecord = this.history.find(h => {
        const hQuestionId = h.questionId || h.question_id;
        const hIdNum = hQuestionId != null ? Number(hQuestionId) : null;
        const match = hIdNum !== null && hIdNum === questionId;
        if (match) {
          console.log('✅ 找到历史记录:', {
            questionId: hIdNum,
            myAnswer: h.myAnswer ? h.myAnswer.substring(0, 20) + '...' : '',
            partnerAnswer: h.partnerAnswer ? h.partnerAnswer.substring(0, 20) + '...' : ''
          });
        }
        return match;
      });
      
      if (historyRecord) {
        // 如果历史记录中有，从历史记录加载
        this.myAnswer = historyRecord.myAnswer || '';
        this.partnerAnswer = historyRecord.partnerAnswer || '';
        this.hasSubmitted = true; // 标记为已提交状态
        
        console.log('📋 从历史记录加载答案:', {
          questionId,
          hasMyAnswer: !!this.myAnswer,
          hasPartnerAnswer: !!this.partnerAnswer,
          partnerAnswer: this.partnerAnswer ? this.partnerAnswer.substring(0, 30) + '...' : '空'
        });
        
        // 无论历史记录中是否有对方答案，都从后端获取最新的对方答案
        console.log('📥 从后端获取最新的对方答案，问题ID:', questionId);
        try {
          const partnerRes = await getPartnerAnswer(questionId);
          console.log('📥 后端返回的对方答案响应:', {
            success: partnerRes?.success,
            data: partnerRes?.data,
            fullResponse: partnerRes
          });
          
          if (partnerRes && partnerRes.success) {
            // 处理不同的响应格式
            const partnerData = partnerRes.data || partnerRes;
            const hasAnswered = partnerData.hasAnswered !== false; // 默认为 true，除非明确为 false
            const answer = partnerData.answer || partnerData.partnerAnswer || partnerData.partner_answer || '';
            
            console.log('📥 解析后的对方答案数据:', {
              hasAnswered,
              answer: answer ? answer.substring(0, 30) + '...' : '空',
              partnerData
            });
            
            if (hasAnswered && answer) {
              console.log('✅ 更新对方答案:', answer.substring(0, 30) + '...');
              this.partnerAnswer = answer;
              // 同时更新历史记录中的对方答案
              if (historyRecord) {
                historyRecord.partnerAnswer = answer;
              }
            } else {
              console.log('⚠️ 对方暂未作答或答案为空');
              // 如果后端返回对方未作答，但历史记录中有，保留历史记录中的答案
              // 如果历史记录中也没有，则显示"对方暂未作答"
            }
          } else {
            console.warn('⚠️ 后端返回失败，使用历史记录中的答案');
          }
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
        // 如果历史记录中没有，检查后端是否有对方答案（可能对方回答了但自己还没回答）
        try {
          const partnerRes = await getPartnerAnswer(questionId);
          console.log('📥 检查对方是否已回答:', partnerRes);
          
          if (partnerRes && partnerRes.success && partnerRes.data) {
            const partnerData = partnerRes.data;
            // 如果对方已回答，显示对方答案（但标记为未提交状态，因为自己还没回答）
            if (partnerData.hasAnswered && partnerData.answer) {
              // 注意：这种情况下不显示对方答案，因为自己还没回答
              // 只有在提交后或从历史记录回显时才显示
            }
          }
        } catch (e) {
          // 忽略错误
          console.warn('⚠️ 检查对方答案失败:', e);
        }
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
              // 加载新问题的答案（会自动清空或从历史记录加载）
              this.loadAnswerForCurrentQuestion();
              
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
