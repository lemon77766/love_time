"use strict";
const common_vendor = require("../../../../common/vendor.js");
const api_qna = require("../../../../api/qna.js");
const _sfc_main = {
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
      return totalHeightRpx + 20 + "rpx";
    }
  },
  async onLoad() {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.screenWidth = systemInfo.screenWidth || 375;
    const loginInfo = common_vendor.index.getStorageSync("login_info");
    if (!loginInfo || !loginInfo.token) {
      common_vendor.index.showModal({
        title: "需要登录",
        content: "请先登录",
        showCancel: false,
        success: () => common_vendor.index.reLaunch({ url: "/pages/login/index" })
      });
      return;
    }
    await this.loadQuestions();
    await this.loadHistory();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
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
    formatQuestionList(list, categoryFallback = "preset") {
      if (!Array.isArray(list)) {
        return [];
      }
      return list.filter((q) => q && q.id != null).map((q) => {
        const formatted = {
          ...q,
          id: q.id,
          text: q.text || q.questionText || "",
          category: q.category || categoryFallback,
          isActive: q.isActive !== false,
          orderIndex: q.orderIndex ?? 999
        };
        if (formatted.questionText) {
          delete formatted.questionText;
        }
        return formatted;
      });
    },
    // 从后端加载问题列表
    async loadQuestions() {
      try {
        const res = await api_qna.getQuestions();
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:153", "📥 问题列表响应:", res);
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
          const formatted = this.formatQuestionList(topLevelQuestions);
          presetQuestions = formatted.filter((q) => (q.category || "preset") === "preset");
          customQuestions = formatted.filter((q) => (q.category || "preset") === "custom");
        } else if (rawData && (Array.isArray(rawData.defaultQuestions) || Array.isArray(rawData.customQuestions))) {
          presetQuestions = this.formatQuestionList(rawData.defaultQuestions, "preset");
          customQuestions = this.formatQuestionList(rawData.customQuestions, "custom");
        } else if (res && res.code === 200 && res.data && (Array.isArray(res.data.defaultQuestions) || Array.isArray(res.data.customQuestions))) {
          presetQuestions = this.formatQuestionList(res.data.defaultQuestions, "preset");
          customQuestions = this.formatQuestionList(res.data.customQuestions, "custom");
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
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:195", "✅ 问题列表加载成功:", {
            preset: this.defaultQuestions.length,
            custom: this.customQuestions.length,
            total: this.defaultQuestions.length + this.customQuestions.length
          });
        } else if (!normalizedRes.success) {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/history.vue:201", "⚠️ 问题列表业务状态失败:", {
            message: normalizedRes.message,
            raw: normalizedRes.raw
          });
        } else {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/history.vue:206", "⚠️ 问题列表响应格式不符合预期:", res);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/history.vue:209", "加载问题列表失败", e);
      }
    },
    // 从后端加载历史记录
    async loadHistory() {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await api_qna.getHistory({ page: 1, pageSize: 100 });
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:217", "📥 历史记录响应:", res);
        const normalizedRes = this.normalizeApiResponse(res, "获取历史记录成功");
        if (!normalizedRes.success) {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/history.vue:220", "⚠️ 历史记录业务状态返回失败:", {
            message: normalizedRes.message,
            raw: normalizedRes.raw
          });
        }
        const dataSources = [
          (_a = normalizedRes.data) == null ? void 0 : _a.list,
          (_b = normalizedRes.data) == null ? void 0 : _b.history,
          (_c = normalizedRes.data) == null ? void 0 : _c.answers,
          Array.isArray(normalizedRes.data) ? normalizedRes.data : null,
          (_d = normalizedRes.raw) == null ? void 0 : _d.history,
          (_e = normalizedRes.raw) == null ? void 0 : _e.answers,
          (_g = (_f = normalizedRes.raw) == null ? void 0 : _f.data) == null ? void 0 : _g.list,
          (_i = (_h = normalizedRes.raw) == null ? void 0 : _h.data) == null ? void 0 : _i.history,
          (_k = (_j = normalizedRes.raw) == null ? void 0 : _j.data) == null ? void 0 : _k.answers,
          Array.isArray((_l = normalizedRes.raw) == null ? void 0 : _l.data) ? normalizedRes.raw.data : null,
          res == null ? void 0 : res.history,
          res == null ? void 0 : res.answers,
          (_m = res == null ? void 0 : res.data) == null ? void 0 : _m.list,
          (_n = res == null ? void 0 : res.data) == null ? void 0 : _n.history,
          (_o = res == null ? void 0 : res.data) == null ? void 0 : _o.answers,
          Array.isArray(res == null ? void 0 : res.data) ? res.data : null,
          res == null ? void 0 : res.list,
          Array.isArray(res) ? res : null
        ];
        let historyList = [];
        for (const candidate of dataSources) {
          if (Array.isArray(candidate)) {
            historyList = candidate;
            break;
          }
        }
        if (!Array.isArray(historyList)) {
          common_vendor.index.__f__("warn", "at subPackages/interaction/pages/qna/history.vue:256", "⚠️ 历史记录响应格式不符合预期:", res);
          historyList = [];
        }
        this.history = historyList.map((item) => {
          const id = item.id || item.answerId;
          const questionId = item.questionId || item.question_id;
          let question = item.question || item.questionText || item.question_text;
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:267", "🔍 处理历史记录项:", {
            originalItem: item,
            questionId,
            initialQuestion: question
          });
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
          const formattedItem = {
            id,
            questionId,
            question: question || `问题ID: ${questionId}`,
            myAnswer,
            partnerAnswer,
            time,
            questionCategory: item.questionCategory || item.category,
            answeredAt: item.answeredAt,
            // 保留原始对象的其他字段，但不覆盖我们处理过的字段
            ...Object.fromEntries(
              Object.entries(item).filter(
                ([key]) => !["id", "questionId", "question", "myAnswer", "partnerAnswer", "time", "questionCategory", "answeredAt"].includes(key)
              )
            )
          };
          common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:302", "🔧 格式化历史记录项:", {
            original: item,
            formatted: formattedItem
          });
          return formattedItem;
        });
        this.history.sort((a, b) => {
          const timeA = a.answeredAt || a.createdAt || a.time || "";
          const timeB = b.answeredAt || b.createdAt || b.time || "";
          return new Date(timeB) - new Date(timeA);
        });
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:317", "✅ 历史记录加载成功:", {
          count: this.history.length,
          totalCount: ((_p = normalizedRes.raw) == null ? void 0 : _p.totalCount) ?? ((_q = normalizedRes.data) == null ? void 0 : _q.totalCount) ?? ((_r = normalizedRes.data) == null ? void 0 : _r.total),
          sample: this.history.slice(0, 3)
        });
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:324", "📋 完整历史记录数据:", this.history);
        common_vendor.index.__f__("log", "at subPackages/interaction/pages/qna/history.vue:325", "✅ 历史记录加载成功:", {
          count: this.history.length,
          totalCount: ((_s = normalizedRes.raw) == null ? void 0 : _s.totalCount) ?? ((_t = normalizedRes.data) == null ? void 0 : _t.totalCount) ?? ((_u = normalizedRes.data) == null ? void 0 : _u.total),
          sample: this.history.slice(0, 3)
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at subPackages/interaction/pages/qna/history.vue:331", "加载历史记录失败", e);
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
      if (!item.questionId) {
        common_vendor.index.showToast({ title: "问题ID缺失，无法跳转", icon: "none" });
        return;
      }
      const qid = encodeURIComponent(item.questionId);
      const qtext = encodeURIComponent(item.question);
      common_vendor.index.navigateTo({
        url: `/subPackages/interaction/pages/qna/index?qid=${qid}&qtext=${qtext}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.navBarHeight + "px",
    d: common_vendor.f($data.history, (item, i, i0) => {
      return {
        a: common_vendor.t($options.pad2(i + 1)),
        b: common_vendor.t(item.question),
        c: common_vendor.n(item.myAnswer ? "done" : "todo"),
        d: i,
        e: common_vendor.o(($event) => $options.openItem(item), i)
      };
    }),
    e: $data.history.length === 0
  }, $data.history.length === 0 ? {} : {}, {
    f: $options.containerPaddingTop
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/subPackages/interaction/pages/qna/history.js.map
