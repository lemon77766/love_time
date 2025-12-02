"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_qna = require("../../../../api/qna.js");
const _sfc_main = {
  async onLoad(options) {
    var _a;
    this.getSystemInfo();
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    if (!loginInfo || !loginInfo.token) {
      common_vendor.index.showModal({
        title: "需要登录",
        content: "恋与问答功能需要登录后才能使用，请先登录",
        showCancel: false,
        success: () => {
          common_vendor.index.reLaunch({
            url: "/pages/login/index"
          });
        }
      });
      return;
    }
    await this.loadQuestionsFromServer();
    await this.loadHistoryFromServer();
    const qid = options && options.qid ? Number(options.qid) : null;
    const qTextParam = options && typeof options.qtext === "string" ? options.qtext : "";
    this.targetQuestionFallbackText = qTextParam ? decodeURIComponent(qTextParam) : "";
    if (qid) {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:160", "📌 从历史记录跳转，目标问题ID:", qid);
      this.targetQuestionId = qid;
      this.preventAutoSwitch = true;
      const idx = this.unansweredQuestions.findIndex((q) => q.id === qid);
      if (idx >= 0) {
        this.qIndex = idx;
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:171", "✅ 问题未回答，设置 qIndex:", idx);
      } else {
        const allQuestions = this.questions;
        const questionExists = allQuestions.some((q) => q.id === qid);
        if (questionExists) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:178", "✅ 问题已回答，但存在于问题列表中，将显示该问题");
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:180", "⚠️ 问题ID不存在于问题列表中:", qid);
          this.qIndex = 0;
        }
      }
    } else {
      this.qIndex = 0;
      this.targetQuestionId = null;
    }
    const time = options && options.time ? decodeURIComponent(options.time) : "";
    const targetQuestionId = qid || this.currentQuestion && this.currentQuestion.id;
    common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:196", "📋 初始化答案加载:", {
      targetQuestionId,
      time,
      currentQuestionId: (_a = this.currentQuestion) == null ? void 0 : _a.id,
      historyCount: this.history.length
    });
    if (targetQuestionId) {
      const rec = this.history.find((r) => {
        const rQuestionId = r.questionId || r.question_id;
        return rQuestionId != null && Number(rQuestionId) === Number(targetQuestionId) && (!time || r.time === time);
      });
      if (rec) {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:209", "✅ 从历史记录加载答案:", {
          questionId: targetQuestionId,
          hasMyAnswer: !!rec.myAnswer,
          hasPartnerAnswer: !!rec.partnerAnswer,
          partnerAnswer: rec.partnerAnswer ? rec.partnerAnswer.substring(0, 30) + "..." : "空",
          recData: rec
        });
        this.myAnswer = rec.myAnswer || "";
        this.partnerAnswer = rec.partnerAnswer || "";
        this.hasSubmitted = true;
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:221", "📥 从后端获取最新的对方答案，问题ID:", targetQuestionId);
        try {
          const partnerRes = await api_qna.getPartnerAnswer(targetQuestionId);
          this.handlePartnerAnswerResponse(partnerRes, {
            historyRecord: rec,
            context: `onLoad questionId=${targetQuestionId}`
          });
        } catch (e) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:229", "❌ 获取对方答案失败:", e);
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:230", "错误详情:", {
            message: e.message,
            statusCode: e.statusCode,
            data: e.data
          });
        }
      } else {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:239", "📋 历史记录中未找到，调用 loadAnswerForCurrentQuestion");
        this.loadAnswerForCurrentQuestion();
      }
    } else {
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
      myAnswer: "",
      partnerAnswer: "",
      hasSubmitted: false,
      // 标记当前问题是否已提交
      showHistory: false,
      showCustomModal: false,
      newQuestion: "",
      history: [],
      targetQuestionId: null,
      // 从历史记录跳转过来的目标问题ID
      targetQuestionFallbackText: ""
      // 添加标志防止提交后自动切换问题
    };
  },
  watch: {
    // 监听当前问题变化，自动加载对应的答案
    "currentQuestion.id": {
      handler(newId, oldId) {
        if (newId && oldId && newId !== oldId) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:272", "🔄 问题切换:", { from: oldId, to: newId });
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
      return totalHeightRpx + 20 + "rpx";
    },
    questions() {
      const validCustomQuestions = (this.customQuestions || []).filter((q) => q && q.id != null);
      const validDefaultQuestions = (this.defaultQuestions || []).filter((q) => q && q.id != null);
      return [...validDefaultQuestions, ...validCustomQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      const answeredIds = new Set(
        this.history.map((h) => {
          const qid = h.questionId || h.question_id;
          return qid != null ? Number(qid) : null;
        }).filter((id) => id != null)
      );
      const unanswered = this.questions.filter((q) => {
        if (!q || q.id == null)
          return false;
        return !answeredIds.has(Number(q.id)) && q.isActive !== false;
      });
      {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:310", "🔍 未回答问题计算:", {
          totalQuestions: this.questions.length,
          answeredCount: answeredIds.size,
          unansweredCount: unanswered.length
        });
      }
      return unanswered;
    },
    currentQuestion() {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:320", "🔍 currentQuestion 计算开始:", {
        targetQuestionId: this.targetQuestionId,
        targetQuestionFallbackText: this.targetQuestionFallbackText,
        qIndex: this.qIndex,
        unansweredQuestionsLength: this.unansweredQuestions.length
      });
      if (this.targetQuestionId != null) {
        const targetId = Number(this.targetQuestionId);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:330", "📌 检查目标问题ID:", targetId);
        const targetQuestion = this.questions.find((q) => q && q.id != null && Number(q.id) === targetId);
        if (targetQuestion) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:335", "🎯 显示目标问题:", {
            id: targetQuestion.id,
            text: targetQuestion.text.substring(0, 20) + "..."
          });
          return targetQuestion;
        } else {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:341", "❓ 目标问题在问题列表中未找到");
          if (this.targetQuestionFallbackText) {
            common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:343", "⚠️ 目标问题不在问题列表，使用历史记录携带的题干");
            return {
              id: targetId,
              text: this.targetQuestionFallbackText,
              category: "history",
              isFallback: true
            };
          }
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:351", "⚠️ 目标问题不存在，回退到默认逻辑");
          this.targetQuestionId = null;
          this.targetQuestionFallbackText = "";
        }
      }
      if (this.hasSubmitted && this.targetQuestionId == null) {
        if (this.history.length > 0 && this.history[0] && this.history[0].questionId) {
          const lastSubmittedId = Number(this.history[0].questionId);
          const currentQuestion = this.questions.find(
            (q) => q && q.id != null && Number(q.id) === lastSubmittedId
          );
          if (currentQuestion) {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:368", "🔒 保持已提交的问题:", {
              id: currentQuestion.id,
              text: currentQuestion.text.substring(0, 20) + "..."
            });
            return currentQuestion;
          }
        }
      }
      if (this.unansweredQuestions.length === 0) {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:379", "🎉 所有问题已回答完毕");
        return { id: 0, text: "所有问题已回答完毕！🎉" };
      }
      const current = this.unansweredQuestions[this.qIndex] || this.unansweredQuestions[0];
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:384", "➡️ 返回当前问题:", {
        index: this.qIndex,
        question: current ? current.text.substring(0, 20) + "..." : "null"
      });
      return current;
    }
  },
  mounted() {
  },
  methods: {
    normalizeApiResponse(response, defaultMessage = "操作成功") {
      if (response == null) {
        return { success: false, message: "响应为空", data: null, raw: response };
      }
      if (typeof response === "string") {
        return { success: false, message: response, data: null, raw: response };
      }
      if (typeof response.success === "boolean") {
        return {
          success: !!response.success,
          message: response.message || response.msg || defaultMessage,
          data: response.data !== void 0 ? response.data : null,
          raw: response
        };
      }
      if (response.code !== void 0) {
        const success = Number(response.code) === 200;
        return {
          success,
          message: response.msg || response.message || defaultMessage,
          data: response.data !== void 0 ? response.data : null,
          raw: response
        };
      }
      if (Array.isArray(response)) {
        return { success: true, message: defaultMessage, data: response, raw: response };
      }
      return {
        success: true,
        message: response.message || response.msg || defaultMessage,
        data: response.data !== void 0 ? response.data : response,
        raw: response
      };
    },
    handlePartnerAnswerResponse(partnerRes, { historyRecord = null, context = "", updateState = true } = {}) {
      var _a, _b, _c, _d, _e, _f;
      const normalized = this.normalizeApiResponse(partnerRes, "获取对方答案成功");
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:431", "📥 对方答案响应（标准化）:", {
        context,
        success: normalized.success,
        message: normalized.message,
        data: normalized.data
      });
      if (!normalized.success) {
        common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:439", "⚠️ 获取对方答案业务失败:", {
          context,
          message: normalized.message,
          raw: normalized.raw
        });
        return { updated: false, answer: "", normalized };
      }
      const pickPayload = (candidate) => {
        if (candidate && typeof candidate === "object") {
          if (candidate.data && typeof candidate.data === "object") {
            return candidate.data;
          }
          return candidate;
        }
        return null;
      };
      let payload = pickPayload(normalized.data) || pickPayload((_a = normalized.raw) == null ? void 0 : _a.data) || pickPayload(normalized.raw) || null;
      if (!payload) {
        common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:464", "⚠️ 对方答案响应缺少有效数据对象:", { context, normalized });
        return { updated: false, answer: "", normalized };
      }
      const answer = payload.answer ?? payload.partnerAnswer ?? payload.partner_answer ?? ((_b = payload.data) == null ? void 0 : _b.answer) ?? ((_c = payload.data) == null ? void 0 : _c.partnerAnswer) ?? ((_d = payload.data) == null ? void 0 : _d.partner_answer) ?? "";
      const answeredFlag = payload.hasAnswered ?? payload.hasPartnerAnswered ?? payload.has_partner_answered ?? payload.has_answered ?? ((_e = payload.data) == null ? void 0 : _e.hasAnswered) ?? ((_f = payload.data) == null ? void 0 : _f.hasPartnerAnswered);
      const hasAnswered = answeredFlag === void 0 ? !!answer : answeredFlag !== false;
      if (hasAnswered && answer) {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:488", "✅ 解析到对方答案:", {
          context,
          preview: answer.substring(0, 30) + (answer.length > 30 ? "..." : "")
        });
        if (updateState) {
          this.partnerAnswer = answer;
          if (historyRecord) {
            historyRecord.partnerAnswer = answer;
            historyRecord.partnerAnsweredAt = payload.answeredAt || payload.partnerAnsweredAt || payload.answered_at || historyRecord.partnerAnsweredAt;
          }
          this.$forceUpdate();
        }
        return { updated: true, answer, normalized };
      }
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:508", "⚠️ 对方暂未作答或答案为空:", { context, payload });
      return { updated: false, answer: "", normalized };
    },
    formatQuestionList(list, categoryFallback = "preset") {
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:512", "🔧 formatQuestionList 调用:", { list, categoryFallback });
      if (!Array.isArray(list)) {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:514", "⚠️ list 不是数组");
        return [];
      }
      const result = list.filter((q) => q && q.id != null).map((q) => {
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:520", "🔧 处理问题项:", q);
        const formatted = {
          ...q,
          id: q.id,
          text: q.text || q.questionText || "",
          category: q.category || categoryFallback,
          isActive: q.isActive !== false,
          orderIndex: q.orderIndex ?? 999
        };
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:529", "🔧 格式化后的问题项:", formatted);
        if (formatted.questionText) {
          delete formatted.questionText;
        }
        return formatted;
      });
      common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:535", "🔧 formatQuestionList 结果:", result);
      return result;
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    getSystemInfo() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 0;
      this.screenWidth = systemInfo.windowWidth || 375;
      this.navBarHeight = 44;
    },
    // 保存历史记录到本地存储
    saveHistory() {
      try {
        common_vendor.index.setStorageSync("qna_history", this.history);
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:557", "保存历史记录失败", e);
      }
    },
    async submitAnswer() {
      if (!this.myAnswer) {
        common_vendor.index.showToast({ title: "请填写你的答案", icon: "none" });
        return;
      }
      if (this.currentQuestion.id === 0) {
        common_vendor.index.showToast({ title: "所有问题已回答完毕", icon: "none" });
        return;
      }
      const alreadyAnswered = this.history.some((h) => h.questionId === this.currentQuestion.id);
      if (alreadyAnswered) {
        common_vendor.index.showToast({ title: "该问题已经回答过了", icon: "none" });
        return;
      }
      this.preventAutoSwitch = true;
      try {
        common_vendor.index.showLoading({ title: "提交中..." });
        const answerData = {
          questionId: this.currentQuestion.id,
          answer: this.myAnswer,
          questionText: this.currentQuestion.text
        };
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:589", "📤 准备提交答案:", {
          questionId: answerData.questionId,
          answer: answerData.answer,
          questionText: answerData.questionText,
          currentQuestion: this.currentQuestion,
          allQuestions: this.questions.map((q) => ({ id: q.id, text: q.text })),
          customQuestions: this.customQuestions.map((q) => ({ id: q.id, text: q.text })),
          defaultQuestions: this.defaultQuestions.map((q) => ({ id: q.id, text: q.text }))
        });
        const res = await api_qna.submitAnswer(answerData);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:601", "📥 提交答案响应:", res);
        if (res && res.success) {
          const submittedQuestionId = Number(this.currentQuestion.id);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:606", "✅ 提交答案成功，问题ID:", submittedQuestionId);
          this.hasSubmitted = true;
          const responseData = res.data || res;
          let partnerAnswerFromSubmit = "";
          if (responseData && (responseData.hasPartnerAnswered || responseData.hasPartnerAnswer)) {
            partnerAnswerFromSubmit = responseData.partnerAnswer || "";
            this.partnerAnswer = partnerAnswerFromSubmit;
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:619", "📥 从提交接口获取到对方答案:", partnerAnswerFromSubmit ? partnerAnswerFromSubmit.substring(0, 20) + "..." : "空");
          }
          try {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:624", "🔍 开始获取对方答案，问题ID:", submittedQuestionId);
            const partnerRes = await api_qna.getPartnerAnswer(submittedQuestionId);
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:626", "📥 对方答案接口原始响应:", partnerRes);
            const partnerResult = this.handlePartnerAnswerResponse(partnerRes, {
              context: `submit questionId=${submittedQuestionId}`
            });
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:630", "🔧 对方答案处理结果:", {
              updated: partnerResult.updated,
              hasAnswer: !!partnerResult.answer,
              answerPreview: partnerResult.answer ? partnerResult.answer.substring(0, 20) + "..." : "空",
              currentPartnerAnswer: this.partnerAnswer
            });
            if (partnerResult.updated && partnerResult.answer) {
              partnerAnswerFromSubmit = partnerResult.answer;
            } else if (!partnerAnswerFromSubmit) {
              this.partnerAnswer = "";
            }
          } catch (partnerError) {
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:644", "❌ 获取对方答案接口调用失败:", partnerError);
            common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:645", "❌ 错误详情:", {
              message: partnerError.message,
              statusCode: partnerError.statusCode,
              data: partnerError.data
            });
            if (!partnerAnswerFromSubmit) {
              this.partnerAnswer = "";
            }
          }
          const record = {
            id: (responseData == null ? void 0 : responseData.answerId) || (res == null ? void 0 : res.answerId) || (responseData == null ? void 0 : responseData.id) || Date.now(),
            questionId: Number(submittedQuestionId),
            // 确保使用数字类型
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: partnerAnswerFromSubmit || this.partnerAnswer || "",
            time: (/* @__PURE__ */ new Date()).toLocaleString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          const existingIndex = this.history.findIndex(
            (h) => h.questionId === record.questionId || h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId)
          );
          if (existingIndex >= 0) {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:675", "🔄 更新现有历史记录:", record);
            this.history[existingIndex] = record;
          } else {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:679", "💾 添加新的历史记录:", record);
            this.history.unshift(record);
          }
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:682", "💾 保存历史记录:", {
            questionId: record.questionId,
            questionText: record.question.substring(0, 20) + "...",
            hasPartnerAnswer: !!record.partnerAnswer
          });
          this.history.unshift(record);
          this.saveHistory();
          this.myAnswer = this.myAnswer;
          this.partnerAnswer = partnerAnswerFromSubmit || this.partnerAnswer || "";
          this.$forceUpdate();
          common_vendor.index.showToast({ title: "提交成功", icon: "success" });
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:703", "⚠️ 响应格式不符合预期:", res);
          const record = {
            id: Date.now(),
            questionId: this.currentQuestion.id,
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: "",
            time: (/* @__PURE__ */ new Date()).toLocaleString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          this.history.unshift(record);
          this.saveHistory();
          const existingIndex = this.history.findIndex(
            (h) => h.questionId === record.questionId || h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId)
          );
          if (existingIndex >= 0) {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:724", "🔄 更新现有历史记录（异常情况）:", record);
            this.history[existingIndex] = record;
          } else {
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:728", "💾 添加新的历史记录（异常情况）:", record);
            this.history.unshift(record);
          }
          this.myAnswer = this.myAnswer;
          this.partnerAnswer = "";
          this.hasSubmitted = true;
          this.$forceUpdate();
          common_vendor.index.showToast({ title: "提交成功（已保存到本地）", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:745", "提交答案失败", e);
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:746", "错误详情:", {
          statusCode: e.statusCode,
          message: e.message,
          data: e.data,
          url: e.url || "未知"
        });
        if (e.statusCode === 401) {
          common_vendor.index.showModal({
            title: "登录已过期",
            content: "您的登录已过期，请重新登录",
            showCancel: false,
            success: () => {
              common_vendor.index.reLaunch({
                url: "/pages/login/index"
              });
            }
          });
          return;
        }
        if (e.statusCode === 404) {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:772", "⚠️ 后端接口未实现: POST /api/qna/answer/submit");
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:773", "💡 提示: 请联系后端开发人员实现该接口，或检查接口路径是否正确");
          common_vendor.index.showModal({
            title: "接口未实现",
            content: "提交答案接口暂未实现，已保存到本地。请联系后端开发人员实现接口：POST /api/qna/answer/submit",
            showCancel: false,
            confirmText: "知道了",
            success: () => {
              const record = {
                id: Date.now(),
                // 临时ID
                questionId: this.currentQuestion.id,
                question: this.currentQuestion.text,
                myAnswer: this.myAnswer,
                partnerAnswer: "",
                time: (/* @__PURE__ */ new Date()).toLocaleString(),
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                _pendingSync: true
                // 标记为待同步
              };
              const existingIndex = this.history.findIndex(
                (h) => h.questionId === record.questionId || h.questionId && record.questionId && Number(h.questionId) === Number(record.questionId)
              );
              if (existingIndex >= 0) {
                common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:802", "🔄 更新现有历史记录（404情况）:", record);
                this.history[existingIndex] = record;
              } else {
                common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:806", "💾 添加新的历史记录（404情况）:", record);
                this.history.unshift(record);
              }
              this.saveHistory();
              this.myAnswer = this.myAnswer;
              this.partnerAnswer = "";
              this.hasSubmitted = true;
              this.$forceUpdate();
              common_vendor.index.showToast({ title: "已保存到本地", icon: "none" });
            }
          });
          return;
        }
        common_vendor.index.showToast({
          title: `提交失败: ${e.statusCode || "网络错误"}`,
          icon: "none",
          duration: 3e3
        });
      } finally {
        try {
          common_vendor.index.hideLoading();
        } catch (e) {
        }
        setTimeout(() => {
          this.preventAutoSwitch = false;
        }, 100);
      }
    },
    nextQuestion() {
      this.targetQuestionId = null;
      this.targetQuestionFallbackText = "";
      this.hasSubmitted = false;
      this.myAnswer = "";
      this.partnerAnswer = "";
      const unanswered = this.unansweredQuestions;
      if (unanswered.length === 0) {
        common_vendor.index.showToast({ title: "所有问题已回答完毕！", icon: "success" });
        return;
      }
      this.qIndex = 0;
      this.$nextTick(() => {
        this.loadAnswerForCurrentQuestion();
      });
    },
    // 加载当前问题的答案（从历史记录或后端）
    async loadAnswerForCurrentQuestion() {
      if (!this.currentQuestion || !Number.isFinite(this.currentQuestion.id) || this.currentQuestion.id === 0) {
        this.myAnswer = "";
        this.partnerAnswer = "";
        this.hasSubmitted = false;
        return;
      }
      const questionId = Number(this.currentQuestion.id);
      const historyRecord = this.history.find((h) => Number(h.questionId) === questionId);
      if (historyRecord) {
        this.myAnswer = historyRecord.myAnswer || "";
        this.partnerAnswer = historyRecord.partnerAnswer || "";
        this.hasSubmitted = true;
        try {
          const partnerRes = await api_qna.getPartnerAnswer(questionId);
          this.handlePartnerAnswerResponse(partnerRes, {
            historyRecord,
            context: `loadAnswer questionId=${questionId}`
          });
        } catch (e) {
          common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:898", `❌ 获取对方答案失败 (问题ID: ${questionId}):`, e);
        }
      } else {
        this.myAnswer = "";
        this.partnerAnswer = "";
        this.hasSubmitted = false;
      }
      this.$forceUpdate();
    },
    openHistory() {
      common_vendor.index.navigateTo({ url: "/subPackages/interaction/pages/qna/history" });
    },
    closeHistory() {
      this.showHistory = false;
    },
    clearHistory() {
      this.history = [];
      this.saveHistory();
      common_vendor.index.showToast({ title: "记录已清空", icon: "none" });
    },
    // 标准化历史记录项（从后端或本地存储）
    normalizeHistoryItem(item) {
      if (!item)
        return null;
      const id = item.id || item.answerId;
      const questionId = item.questionId || item.question_id;
      let question = item.question || item.questionText || item.question_text;
      if (!question && questionId != null) {
        const allQuestions = [
          ...this.defaultQuestions || [],
          ...this.customQuestions || []
        ];
        const foundQuestion = allQuestions.find((q) => q && q.id != null && Number(q.id) === Number(questionId));
        if (foundQuestion && foundQuestion.text) {
          question = foundQuestion.text;
        }
      }
      const myAnswer = item.myAnswer || item.answer || item.my_answer;
      const partnerAnswer = item.partnerAnswer || item.partner_answer || "";
      const time = item.time || item.answeredAt || item.createdAt || item.created_at || item.updatedAt || (/* @__PURE__ */ new Date()).toLocaleString();
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
      var _a, _b, _c;
      try {
        const res = await api_qna.getHistory({ page: 1, pageSize: 100 });
        const normalizedRes = this.normalizeApiResponse(res, "获取历史记录成功");
        if (!normalizedRes.success) {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:969", `⚠️ 历史记录业务状态返回失败: ${normalizedRes.message}`);
          const localHistory = common_vendor.index.getStorageSync("qna_history");
          this.history = Array.isArray(localHistory) ? localHistory : [];
          return;
        }
        const historyList = ((_a = normalizedRes.data) == null ? void 0 : _a.list) || ((_b = normalizedRes.data) == null ? void 0 : _b.history) || ((_c = normalizedRes.data) == null ? void 0 : _c.answers) || (Array.isArray(normalizedRes.data) ? normalizedRes.data : []);
        this.history = historyList.map((item) => this.normalizeHistoryItem(item));
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:979", "✅ 历史记录加载并标准化成功:", {
          count: this.history.length,
          sample: this.history.slice(0, 2)
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:985", "加载历史记录失败", e);
        if (e.statusCode === 401)
          return;
        const localHistory = common_vendor.index.getStorageSync("qna_history");
        this.history = Array.isArray(localHistory) ? localHistory : [];
      }
    },
    // 从后端加载问题列表
    async loadQuestionsFromServer() {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await api_qna.getQuestions();
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:996", "📥 问题列表响应:", res);
        const normalizedRes = this.normalizeApiResponse(res, "获取问题成功");
        const rawData = normalizedRes.data ?? (res == null ? void 0 : res.data) ?? {};
        let topLevelQuestions = null;
        if (Array.isArray(res == null ? void 0 : res.questions)) {
          topLevelQuestions = res.questions;
        } else if (Array.isArray(rawData == null ? void 0 : rawData.questions)) {
          topLevelQuestions = rawData.questions;
        } else if (Array.isArray(rawData)) {
          topLevelQuestions = rawData;
        }
        let presetQuestions = null;
        let customQuestions = null;
        if (Array.isArray(topLevelQuestions)) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1013", "📋 使用 topLevelQuestions 格式");
          const formatted = this.formatQuestionList(topLevelQuestions);
          presetQuestions = formatted.filter((q) => (q.category || "preset") === "preset");
          customQuestions = formatted.filter((q) => (q.category || "preset") === "custom");
        } else if (rawData && (Array.isArray(rawData.defaultQuestions) || Array.isArray(rawData.customQuestions))) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1018", "📋 使用 rawData 格式");
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1019", " rawData.defaultQuestions:", rawData.defaultQuestions);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1020", " rawData.customQuestions:", rawData.customQuestions);
          presetQuestions = this.formatQuestionList(rawData.defaultQuestions, "preset");
          customQuestions = this.formatQuestionList(rawData.customQuestions, "custom");
        } else if (res && res.code === 200 && res.data && (Array.isArray(res.data.defaultQuestions) || Array.isArray(res.data.customQuestions))) {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1024", "📋 使用 res.data 格式");
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1025", " res.data.defaultQuestions:", res.data.defaultQuestions);
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1026", " res.data.customQuestions:", res.data.customQuestions);
          presetQuestions = this.formatQuestionList(res.data.defaultQuestions, "preset");
          customQuestions = this.formatQuestionList(res.data.customQuestions, "custom");
        } else {
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1030", "📋 未识别的数据格式:", { rawData, res });
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
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1047", "✅ 问题列表加载成功:", {
            preset: this.defaultQuestions.length,
            custom: this.customQuestions.length,
            total: this.defaultQuestions.length + this.customQuestions.length
          });
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:1053", "⚠️ 问题列表响应格式不符合预期:", res);
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/index.vue:1054", "⚠️ 保留本地预设问题，避免页面空白");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:1057", "加载问题失败", e);
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:1058", "错误详情:", {
          message: e.message,
          statusCode: e.statusCode,
          data: e.data
        });
        if (e.statusCode === 401) {
          common_vendor.index.showModal({
            title: "登录已过期",
            content: "您的登录已过期，请重新登录",
            showCancel: false,
            success: () => {
              common_vendor.index.reLaunch({
                url: "/pages/login/index"
              });
            }
          });
          return;
        }
        common_vendor.index.showToast({ title: "加载问题失败，使用本地数据", icon: "none" });
        try {
          const data = common_vendor.index.getStorageSync("qna_custom_questions");
          this.customQuestions = Array.isArray(data) ? data : [];
        } catch (e2) {
          this.customQuestions = [];
        }
      } finally {
        try {
          common_vendor.index.hideLoading();
        } catch (e) {
        }
      }
    },
    // 添加自定义问题
    async addCustomQuestion() {
      if (!this.newQuestion || !this.newQuestion.trim()) {
        common_vendor.index.showToast({ title: "请输入问题内容", icon: "none" });
        return;
      }
      try {
        common_vendor.index.showLoading({ title: "添加中..." });
        const res = await api_qna.addCustomQuestion(this.newQuestion.trim());
        const normalizedRes = this.normalizeApiResponse(res, "添加问题成功");
        if (!normalizedRes.success) {
          common_vendor.index.showToast({ title: normalizedRes.message || "添加失败，请重试", icon: "none" });
          return;
        }
        const newQuestionData = normalizedRes.data || {};
        const formattedQuestion = {
          id: newQuestionData.id,
          text: newQuestionData.text || newQuestionData.questionText || this.newQuestion.trim(),
          category: "custom",
          isActive: true,
          orderIndex: 999,
          createdBy: newQuestionData.userId || newQuestionData.createdBy,
          createdAt: newQuestionData.createdAt,
          // 保留其他字段
          ...newQuestionData
        };
        this.customQuestions.push(formattedQuestion);
        this.newQuestion = "";
        this.showCustomModal = false;
        setTimeout(() => {
          const newQuestionIndex = this.unansweredQuestions.findIndex(
            (q) => q.id === formattedQuestion.id
          );
          if (newQuestionIndex >= 0) {
            this.qIndex = newQuestionIndex;
            this.loadAnswerForCurrentQuestion();
            common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/index.vue:1149", "✅ 已切换到新添加的问题:", formattedQuestion);
          }
        }, 100);
        common_vendor.index.showToast({ title: normalizedRes.message || "问题添加成功", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:1155", "添加问题失败", e);
        if (e.statusCode === 401) {
          common_vendor.index.showModal({
            title: "登录已过期",
            content: "您的登录已过期，请重新登录",
            showCancel: false,
            success: () => {
              common_vendor.index.reLaunch({
                url: "/pages/login/index"
              });
            }
          });
          return;
        }
        common_vendor.index.showToast({ title: "添加失败，请重试", icon: "none" });
      } finally {
        try {
          common_vendor.index.hideLoading();
        } catch (e) {
        }
      }
    },
    async deleteCustomQuestion(index) {
      const question = this.customQuestions[index];
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个问题吗？",
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              const res = await api_qna.deleteCustomQuestion(question.id);
              if (res.success) {
                this.customQuestions.splice(index, 1);
                common_vendor.index.showToast({ title: "已删除", icon: "success" });
              }
            } catch (e) {
              common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/index.vue:1203", "删除问题失败", e);
              if (e.statusCode === 401) {
                common_vendor.index.showModal({
                  title: "登录已过期",
                  content: "您的登录已过期，请重新登录",
                  showCancel: false,
                  success: () => {
                    common_vendor.index.reLaunch({
                      url: "/pages/login/index"
                    });
                  }
                });
                return;
              }
              common_vendor.index.showToast({ title: "删除失败，请重试", icon: "none" });
            } finally {
              try {
                common_vendor.index.hideLoading();
              } catch (e) {
              }
            }
          }
        }
      });
    },
    closeCustomModal() {
      this.showCustomModal = false;
      this.newQuestion = "";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_vendor.t($options.currentQuestion.text),
    e: $data.myAnswer,
    f: common_vendor.o(($event) => $data.myAnswer = $event.detail.value),
    g: common_vendor.o((...args) => $options.submitAnswer && $options.submitAnswer(...args)),
    h: common_vendor.o((...args) => $options.nextQuestion && $options.nextQuestion(...args)),
    i: $data.hasSubmitted
  }, $data.hasSubmitted ? common_vendor.e({
    j: $data.partnerAnswer
  }, $data.partnerAnswer ? {
    k: common_vendor.t($data.partnerAnswer)
  } : {}) : {}, {
    l: common_vendor.o(($event) => $data.showCustomModal = true),
    m: common_vendor.o((...args) => $options.openHistory && $options.openHistory(...args)),
    n: $data.showHistory
  }, $data.showHistory ? {
    o: common_vendor.f($data.history, (item, i, i0) => {
      return {
        a: common_vendor.t(item.question),
        b: common_vendor.t(item.myAnswer),
        c: common_vendor.t(item.partnerAnswer),
        d: common_vendor.t(item.time),
        e: i
      };
    }),
    p: common_vendor.o((...args) => $options.closeHistory && $options.closeHistory(...args)),
    q: common_vendor.o((...args) => $options.clearHistory && $options.clearHistory(...args)),
    r: common_vendor.o(() => {
    }),
    s: common_vendor.o((...args) => $options.closeHistory && $options.closeHistory(...args))
  } : {}, {
    t: $data.showCustomModal
  }, $data.showCustomModal ? common_vendor.e({
    v: common_vendor.t($data.defaultQuestions.length),
    w: common_vendor.f($data.defaultQuestions, (q, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(q.text),
        c: "default-" + i
      };
    }),
    x: common_vendor.t($data.customQuestions.length),
    y: common_vendor.f($data.customQuestions, (q, i, i0) => {
      return {
        a: common_vendor.t($data.defaultQuestions.length + i + 1),
        b: common_vendor.t(q.text),
        c: common_vendor.o(($event) => $options.deleteCustomQuestion(i), "custom-" + i),
        d: "custom-" + i
      };
    }),
    z: $data.customQuestions.length === 0
  }, $data.customQuestions.length === 0 ? {} : {}, {
    A: $data.newQuestion,
    B: common_vendor.o(($event) => $data.newQuestion = $event.detail.value),
    C: common_vendor.o((...args) => $options.addCustomQuestion && $options.addCustomQuestion(...args)),
    D: common_vendor.o((...args) => $options.closeCustomModal && $options.closeCustomModal(...args)),
    E: common_vendor.o(() => {
    }),
    F: common_vendor.o((...args) => $options.closeCustomModal && $options.closeCustomModal(...args))
  }) : {}, {
    G: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/interaction/pages/qna/index.js.map
