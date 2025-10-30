"use strict";
const common_vendor = require("../../common/vendor.js");
const api_qna = require("../../api/qna.js");
const _sfc_main = {
  async onLoad(options) {
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
      return [...this.defaultQuestions, ...this.customQuestions];
    },
    // 计算未回答的问题列表
    unansweredQuestions() {
      const answeredIds = this.history.map((h) => h.questionId);
      return this.questions.filter((q) => !answeredIds.includes(q.id));
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
        if (res.success) {
          if (res.data.hasPartnerAnswered) {
            this.partnerAnswer = res.data.partnerAnswer;
          }
          const record = {
            id: res.data.answerId,
            questionId: this.currentQuestion.id,
            question: this.currentQuestion.text,
            myAnswer: this.myAnswer,
            partnerAnswer: res.data.partnerAnswer || "",
            time: (/* @__PURE__ */ new Date()).toLocaleString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          this.history.unshift(record);
          common_vendor.index.showToast({ title: "提交成功", icon: "success" });
          setTimeout(() => {
            this.nextQuestion();
          }, 1500);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:228", "提交答案失败", e);
        common_vendor.index.showToast({ title: "提交失败，请重试", icon: "none" });
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
        if (res.success) {
          this.history = res.data.list || [];
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:266", "加载历史记录失败", e);
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
        if (res.success) {
          this.defaultQuestions = res.data.defaultQuestions || [];
          this.customQuestions = res.data.customQuestions || [];
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:286", "加载问题失败", e);
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
          this.customQuestions.push(res.data);
          this.newQuestion = "";
          common_vendor.index.showToast({ title: "问题添加成功", icon: "success" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/index.vue:320", "添加问题失败", e);
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
              common_vendor.index.__f__("error", "at pages/qna/index.vue:347", "删除问题失败", e);
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
