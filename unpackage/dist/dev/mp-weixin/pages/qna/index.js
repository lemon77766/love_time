"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  onLoad(options) {
    this.loadHistory();
    this.loadCustomQuestions();
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
    this.loadHistory();
    this.loadCustomQuestions();
  },
  methods: {
    submitAnswer() {
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
      this.partnerAnswer = this.generatePartnerAnswer(this.currentQuestion.id);
      const now = Date.now();
      const record = {
        questionId: this.currentQuestion.id,
        question: this.currentQuestion.text,
        myAnswer: this.myAnswer,
        partnerAnswer: this.partnerAnswer,
        time: (/* @__PURE__ */ new Date()).toLocaleString(),
        ts: now
      };
      this.history.unshift(record);
      this.saveHistory();
      common_vendor.index.showToast({ title: "已提交", icon: "success" });
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
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
    loadHistory() {
      try {
        const data = common_vendor.index.getStorageSync("qna_history");
        this.history = Array.isArray(data) ? data : [];
      } catch (e) {
        this.history = [];
      }
    },
    saveHistory() {
      try {
        common_vendor.index.setStorageSync("qna_history", this.history);
      } catch (e) {
      }
    },
    generatePartnerAnswer(id) {
      const presets = {
        1: "那家有你最爱奶茶的小广场～",
        2: "当然是你拿手的番茄牛腩！",
        3: "一起散步、看电影、做饭都很好",
        4: "海边日出+山间露营的组合",
        5: "你偷偷准备的生日惊喜那天"
      };
      return presets[id] || "我也在认真思考这个问题～";
    },
    addCustomQuestion() {
      if (!this.newQuestion || !this.newQuestion.trim()) {
        common_vendor.index.showToast({ title: "请输入问题内容", icon: "none" });
        return;
      }
      const newId = Date.now();
      this.customQuestions.push({
        id: newId,
        text: this.newQuestion.trim(),
        isDefault: false
      });
      this.saveCustomQuestions();
      this.newQuestion = "";
      common_vendor.index.showToast({ title: "问题添加成功", icon: "success" });
    },
    deleteCustomQuestion(index) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个问题吗？",
        success: (res) => {
          if (res.confirm) {
            this.customQuestions.splice(index, 1);
            this.saveCustomQuestions();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          }
        }
      });
    },
    loadCustomQuestions() {
      try {
        const data = common_vendor.index.getStorageSync("qna_custom_questions");
        this.customQuestions = Array.isArray(data) ? data : [];
      } catch (e) {
        this.customQuestions = [];
      }
    },
    saveCustomQuestions() {
      try {
        common_vendor.index.setStorageSync("qna_custom_questions", this.customQuestions);
      } catch (e) {
      }
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
