"use strict";
const common_vendor = require("../../common/vendor.js");
const api_qna = require("../../api/qna.js");
const _sfc_main = {
  async onLoad(options) {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    if (!loginInfo || !loginInfo.token) {
      common_vendor.index.showModal({
        title: "需要登录",
        content: "甜蜜问答功能需要登录后才能使用，请先登录",
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
    const qid = Number(options && options.qid);
    if (qid) {
      const idx = this.unansweredQuestions.findIndex((q) => q.id === qid);
      if (idx >= 0)
        this.qIndex = idx;
    } else {
      this.qIndex = 0;
    }
    const time = options && options.time ? decodeURIComponent(options.time) : "";
    const rec = this.history.find((r) => r.questionId === (qid || this.currentQuestion.id) && (!time || r.time === time));
    if (rec) {
      this.myAnswer = rec.myAnswer || "";
      this.partnerAnswer = rec.partnerAnswer || "";
    }
  },
  data() {
    return {
      defaultQuestions: [
        { id: 1, text: "我们第一次约会的地点是哪里？", isDefault: true },
        { id: 2, text: "你最喜欢我做的哪道菜？", isDefault: true },
        { id: 3, text: "如果周末只做一件事，你希望是什么？", isDefault: true },
        { id: 4, text: "你心中的完美旅行是什么样的？", isDefault: true },
        { id: 5, text: "这一年里，你最感动的一刻是什么？", isDefault: true }
      ],
      customQuestions: [],
      qIndex: 0,
      myAnswer: "",
      partnerAnswer: "",
      showHistory: false,
      showCustomModal: false,
      newQuestion: "",
      history: []
    };
  },
  computed: {
    questions() {
      const validDefaultQuestions = (this.defaultQuestions || []).filter((q) => q && q.id != null);
      const validCustomQuestions = (this.customQuestions || []).filter((q) => q && q.id != null);
      return [...validDefaultQuestions, ...validCustomQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      const answeredIds = this.history.map((h) => {
        const qid = h.questionId || h.question_id || h.id;
        return qid != null ? Number(qid) : null;
      }).filter((id) => id != null);
      const unanswered = this.questions.filter((q) => {
        if (!q || q.id === void 0 || q.id === null) {
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:194", "⚠️ 发现无效的问题对象:", q);
          return false;
        }
        const questionId = Number(q.id);
        if (isNaN(questionId)) {
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:200", "⚠️ 问题ID无效:", q.id);
          return false;
        }
        const isAnswered = answeredIds.includes(questionId);
        return !isAnswered && q.isActive !== false;
      });
      {
        common_vendor.index.__f__("log", "at pages/qna/index.vue:209", "🔍 未回答问题计算:", {
          totalQuestions: this.questions.length,
          answeredIds,
          unansweredCount: unanswered.length,
          answeredCount: answeredIds.length,
          historyCount: this.history.length,
          questions: this.questions.map((q) => ({ id: q.id, text: q.text })),
          history: this.history.map((h) => ({
            questionId: h.questionId || h.question_id,
            question: h.question || h.questionText
          }))
        });
      }
      return unanswered;
    },
    currentQuestion() {
      if (this.unansweredQuestions.length === 0) {
        return { id: 0, text: "所有问题已回答完毕！🎉" };
      }
      return this.unansweredQuestions[this.qIndex] || this.unansweredQuestions[0];
    }
  },
  mounted() {
  },
  methods: {
    // 保存历史记录到本地存储
    saveHistory() {
      try {
        common_vendor.index.setStorageSync("qna_history", this.history);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:242", "保存历史记录失败", e);
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
      try {
        common_vendor.index.showLoading({ title: "提交中..." });
        const res = await api_qna.submitAnswer({
          questionId: this.currentQuestion.id,
          answer: this.myAnswer,
          questionText: this.currentQuestion.text
        });
        common_vendor.index.__f__("log", "at pages/qna/index.vue:271", "📥 提交答案响应:", res);
        if (res && res.success) {
          const responseData = res.data || res;
          if (responseData && (responseData.hasPartnerAnswered || responseData.hasPartnerAnswer)) {
            this.partnerAnswer = responseData.partnerAnswer || "";
          }
          const record = {
            id: (responseData == null ? void 0 : responseData.answerId) || (res == null ? void 0 : res.answerId) || (responseData == null ? void 0 : responseData.id) || Date.now(),
            questionId: this.currentQuestion.id,
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: (responseData == null ? void 0 : responseData.partnerAnswer) || "",
            time: (/* @__PURE__ */ new Date()).toLocaleString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          this.history.unshift(record);
          this.saveHistory();
          common_vendor.index.showToast({ title: "提交成功", icon: "success" });
          setTimeout(() => {
            this.nextQuestion();
          }, 1500);
        } else {
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:303", "⚠️ 响应格式不符合预期:", res);
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
          common_vendor.index.showToast({ title: "提交成功（已保存到本地）", icon: "success" });
          setTimeout(() => {
            this.nextQuestion();
          }, 1500);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:322", "提交答案失败", e);
        common_vendor.index.__f__("error", "at pages/qna/index.vue:323", "错误详情:", {
          statusCode: e.statusCode,
          message: e.message,
          data: e.data,
          url: e.url || "未知"
        });
        if (e.statusCode === 401) {
          common_vendor.index.hideLoading();
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
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:349", "⚠️ 后端接口未实现: POST /api/qna/answer/submit");
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:350", "💡 提示: 请联系后端开发人员实现该接口，或检查接口路径是否正确");
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
              this.history.unshift(record);
              this.saveHistory();
              common_vendor.index.showToast({ title: "已保存到本地", icon: "none" });
              setTimeout(() => {
                this.nextQuestion();
              }, 1500);
            }
          });
          return;
        }
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: `提交失败: ${e.statusCode || "网络错误"}`,
          icon: "none",
          duration: 3e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    nextQuestion() {
      this.partnerAnswer = "";
      this.myAnswer = "";
      if (this.qIndex < this.unansweredQuestions.length - 1) {
        this.qIndex += 1;
      } else {
        this.qIndex = 0;
      }
      if (this.unansweredQuestions.length === 0) {
        common_vendor.index.showToast({ title: "所有问题已回答完毕！", icon: "success" });
      }
    },
    openHistory() {
      common_vendor.index.navigateTo({ url: "/pages/qna/history" });
    },
    closeHistory() {
      this.showHistory = false;
    },
    clearHistory() {
      this.history = [];
      this.saveHistory();
      common_vendor.index.showToast({ title: "记录已清空", icon: "none" });
    },
    // 从后端加载历史记录
    async loadHistoryFromServer() {
      try {
        const res = await api_qna.getHistory({ page: 1, pageSize: 100 });
        common_vendor.index.__f__("log", "at pages/qna/index.vue:423", "📥 历史记录响应:", res);
        let historyList = [];
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
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:447", "⚠️ 历史记录响应格式不符合预期:", res);
          historyList = [];
        }
        this.history = historyList.map((item) => {
          const id = item.id || item.answerId;
          const questionId = item.questionId || item.question_id;
          let question = item.question || item.questionText || item.question_text;
          if (!question && questionId != null) {
            const allQuestions = [...this.defaultQuestions || [], ...this.customQuestions || []];
            const foundQuestion = allQuestions.find((q) => q && q.id != null && Number(q.id) === Number(questionId));
            if (foundQuestion && foundQuestion.text) {
              question = foundQuestion.text;
            }
          }
          const myAnswer = item.myAnswer || item.answer || item.my_answer;
          const partnerAnswer = item.partnerAnswer || item.partner_answer || "";
          const time = item.time || item.answeredAt || item.createdAt || item.created_at || item.updatedAt || (/* @__PURE__ */ new Date()).toLocaleString();
          const createdAt = item.createdAt || item.created_at || item.answeredAt || item.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
          return {
            id,
            questionId,
            question: question || `问题ID: ${questionId}`,
            // 如果仍然找不到，显示ID作为备用
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
        common_vendor.index.__f__("log", "at pages/qna/index.vue:491", "✅ 历史记录加载成功:", {
          count: this.history.length,
          totalCount: res == null ? void 0 : res.totalCount,
          sample: this.history.slice(0, 3)
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:497", "加载历史记录失败", e);
        common_vendor.index.__f__("error", "at pages/qna/index.vue:498", "错误详情:", {
          message: e.message,
          statusCode: e.statusCode,
          data: e.data
        });
        if (e.statusCode === 401) {
          return;
        }
        try {
          const data = common_vendor.index.getStorageSync("qna_history");
          this.history = Array.isArray(data) ? data : [];
        } catch (e2) {
          this.history = [];
        }
      }
    },
    // 从后端加载问题列表
    async loadQuestionsFromServer() {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await api_qna.getQuestions();
        common_vendor.index.__f__("log", "at pages/qna/index.vue:523", "📥 问题列表响应:", res);
        if (res && res.success && Array.isArray(res.questions)) {
          const presetQuestions = [];
          const customQuestions = [];
          res.questions.forEach((q) => {
            if (!q || q.id === void 0 || q.id === null) {
              common_vendor.index.__f__("warn", "at pages/qna/index.vue:534", "⚠️ 跳过无效的问题对象:", q);
              return;
            }
            const question = {
              id: q.id,
              text: q.questionText || q.text || "",
              // 兼容两种字段名，确保有默认值
              category: q.category || "preset",
              isActive: q.isActive !== false,
              // 默认为 true
              orderIndex: q.orderIndex ?? 999,
              createdBy: q.createdBy,
              // 保留其他可能存在的字段
              ...q
            };
            if (question.questionText) {
              delete question.questionText;
            }
            if (q.category === "preset") {
              presetQuestions.push(question);
            } else if (q.category === "custom") {
              customQuestions.push(question);
            }
          });
          presetQuestions.sort((a, b) => {
            const orderA = a.orderIndex ?? 999;
            const orderB = b.orderIndex ?? 999;
            return orderA - orderB;
          });
          this.defaultQuestions = presetQuestions;
          this.customQuestions = customQuestions;
          common_vendor.index.__f__("log", "at pages/qna/index.vue:573", "✅ 问题列表加载成功:", {
            preset: presetQuestions.length,
            custom: customQuestions.length,
            total: presetQuestions.length + customQuestions.length
          });
        } else if (res && res.success && res.data) {
          this.defaultQuestions = Array.isArray(res.data.defaultQuestions) ? res.data.defaultQuestions.filter((q) => q && q.id != null).map((q) => ({
            id: q.id,
            text: q.questionText || q.text || "",
            ...q
          })) : [];
          this.customQuestions = Array.isArray(res.data.customQuestions) ? res.data.customQuestions.filter((q) => q && q.id != null).map((q) => ({
            id: q.id,
            text: q.questionText || q.text || "",
            ...q
          })) : [];
        } else {
          common_vendor.index.__f__("warn", "at pages/qna/index.vue:599", "⚠️ 问题列表响应格式不符合预期:", res);
          this.defaultQuestions = [];
          this.customQuestions = [];
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:604", "加载问题失败", e);
        common_vendor.index.__f__("error", "at pages/qna/index.vue:605", "错误详情:", {
          message: e.message,
          statusCode: e.statusCode,
          data: e.data
        });
        if (e.statusCode === 401) {
          common_vendor.index.hideLoading();
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
        common_vendor.index.hideLoading();
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
        if (res.success) {
          const newQuestionData = res.data || {};
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
              this.myAnswer = "";
              this.partnerAnswer = "";
              common_vendor.index.__f__("log", "at pages/qna/index.vue:688", "✅ 已切换到新添加的问题:", formattedQuestion);
            }
          }, 100);
          common_vendor.index.showToast({ title: "问题添加成功", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:695", "添加问题失败", e);
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
        common_vendor.index.hideLoading();
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
              common_vendor.index.__f__("error", "at pages/qna/index.vue:738", "删除问题失败", e);
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
              common_vendor.index.hideLoading();
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
    a: common_vendor.t($options.currentQuestion.text),
    b: $data.myAnswer,
    c: common_vendor.o(($event) => $data.myAnswer = $event.detail.value),
    d: common_vendor.o((...args) => $options.submitAnswer && $options.submitAnswer(...args)),
    e: common_vendor.o((...args) => $options.nextQuestion && $options.nextQuestion(...args)),
    f: $data.partnerAnswer
  }, $data.partnerAnswer ? {
    g: common_vendor.t($data.partnerAnswer)
  } : {}, {
    h: common_vendor.o(($event) => $data.showCustomModal = true),
    i: common_vendor.o((...args) => $options.openHistory && $options.openHistory(...args)),
    j: $data.showHistory
  }, $data.showHistory ? {
    k: common_vendor.f($data.history, (item, i, i0) => {
      return {
        a: common_vendor.t(item.question),
        b: common_vendor.t(item.myAnswer),
        c: common_vendor.t(item.partnerAnswer),
        d: common_vendor.t(item.time),
        e: i
      };
    }),
    l: common_vendor.o((...args) => $options.closeHistory && $options.closeHistory(...args)),
    m: common_vendor.o((...args) => $options.clearHistory && $options.clearHistory(...args)),
    n: common_vendor.o(() => {
    }),
    o: common_vendor.o((...args) => $options.closeHistory && $options.closeHistory(...args))
  } : {}, {
    p: $data.showCustomModal
  }, $data.showCustomModal ? common_vendor.e({
    q: $data.newQuestion,
    r: common_vendor.o(($event) => $data.newQuestion = $event.detail.value),
    s: common_vendor.o((...args) => $options.addCustomQuestion && $options.addCustomQuestion(...args)),
    t: common_vendor.t($data.defaultQuestions.length),
    v: common_vendor.f($data.defaultQuestions, (q, i, i0) => {
      return {
        a: common_vendor.t(i + 1),
        b: common_vendor.t(q.text),
        c: "default-" + i
      };
    }),
    w: common_vendor.t($data.customQuestions.length),
    x: common_vendor.f($data.customQuestions, (q, i, i0) => {
      return {
        a: common_vendor.t($data.defaultQuestions.length + i + 1),
        b: common_vendor.t(q.text),
        c: common_vendor.o(($event) => $options.deleteCustomQuestion(i), "custom-" + i),
        d: "custom-" + i
      };
    }),
    y: $data.customQuestions.length === 0
  }, $data.customQuestions.length === 0 ? {} : {}, {
    z: common_vendor.o((...args) => $options.closeCustomModal && $options.closeCustomModal(...args)),
    A: common_vendor.o(() => {
    }),
    B: common_vendor.o((...args) => $options.closeCustomModal && $options.closeCustomModal(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/qna/index.js.map
