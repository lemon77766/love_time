"use strict";
const common_vendor = require("../../common/vendor.js");
const api_qna = require("../../api/qna.js");
const _sfc_main = {
  data() {
    return {
      history: [],
      defaultQuestions: [],
      customQuestions: []
    };
  },
  async onLoad() {
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    if (!loginInfo || !loginInfo.token) {
      common_vendor.index.showModal({
        title: "需要登录",
        content: "请先登录",
        showCancel: false,
        success: () => {
          common_vendor.index.reLaunch({ url: "/pages/login/index" });
        }
      });
      return;
    }
    await this.loadQuestions();
    await this.loadHistory();
  },
  methods: {
    // 从后端加载问题列表
    async loadQuestions() {
      try {
        const res = await api_qna.getQuestions();
        if (res && res.success && Array.isArray(res.questions)) {
          const presetQuestions = [];
          const customQuestions = [];
          res.questions.forEach((q) => {
            if (!q || q.id === void 0 || q.id === null)
              return;
            const question = {
              id: q.id,
              text: q.questionText || q.text || "",
              category: q.category || "preset",
              ...q
            };
            if (q.category === "preset") {
              presetQuestions.push(question);
            } else if (q.category === "custom") {
              customQuestions.push(question);
            }
          });
          this.defaultQuestions = presetQuestions;
          this.customQuestions = customQuestions;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/history.vue:93", "加载问题列表失败", e);
      }
    },
    // 从后端加载历史记录
    async loadHistory() {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await api_qna.getHistory({ page: 1, pageSize: 100 });
        common_vendor.index.__f__("log", "at pages/qna/history.vue:101", "📥 历史记录响应:", res);
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
          common_vendor.index.__f__("warn", "at pages/qna/history.vue:119", "⚠️ 历史记录响应格式不符合预期:", res);
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
        this.history.sort((a, b) => {
          const timeA = a.answeredAt || a.createdAt || a.time || "";
          const timeB = b.answeredAt || b.createdAt || b.time || "";
          return new Date(timeB) - new Date(timeA);
        });
        common_vendor.index.__f__("log", "at pages/qna/history.vue:162", "✅ 历史记录加载成功:", {
          count: this.history.length,
          totalCount: res == null ? void 0 : res.totalCount
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/qna/history.vue:167", "加载历史记录失败", e);
        if (e.statusCode === 401) {
          common_vendor.index.showModal({
            title: "需要登录",
            content: "请先登录",
            showCancel: false,
            success: () => {
              common_vendor.index.reLaunch({ url: "/pages/login/index" });
            }
          });
          return;
        }
        try {
          const data = common_vendor.index.getStorageSync("qna_history");
          this.history = Array.isArray(data) ? data : [];
        } catch (e2) {
          this.history = [];
        }
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    pad2(n) {
      return String(n).padStart(2, "0");
    },
    openItem(item) {
      const qid = encodeURIComponent(item.questionId);
      const time = encodeURIComponent(item.time || "");
      common_vendor.index.navigateTo({ url: `/pages/qna/index?qid=${qid}&time=${time}` });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.history, (item, i, i0) => {
      return {
        a: common_vendor.t($options.pad2(i + 1)),
        b: common_vendor.t(item.question),
        c: common_vendor.n(item.myAnswer ? "done" : "todo"),
        d: i,
        e: common_vendor.o(($event) => $options.openItem(item), i)
      };
    }),
    b: $data.history.length === 0
  }, $data.history.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/qna/history.js.map
