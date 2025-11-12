"use strict";
const utils_http = require("../utils/http.js");
const utils_config = require("../utils/config.js");
function getQuestions() {
  return utils_http.http.get(utils_config.config.API.QNA.LIST);
}
function submitAnswer(answerData) {
  return utils_http.http.post(utils_config.config.API.QNA.SUBMIT, {
    questionId: answerData.questionId,
    answer: answerData.answer,
    questionText: answerData.questionText
  });
}
function getHistory(params = {}) {
  return utils_http.http.get(utils_config.config.API.QNA.HISTORY, params);
}
function getPartnerAnswer(questionId) {
  return utils_http.http.get(utils_config.config.API.QNA.PARTNER_ANSWER, { questionId });
}
function addCustomQuestion(questionText) {
  return utils_http.http.post(utils_config.config.API.QNA.ADD_QUESTION, {
    text: questionText
  });
}
function deleteCustomQuestion(questionId) {
  return utils_http.http.post(utils_config.config.API.QNA.DELETE_QUESTION, {
    questionId
  });
}
exports.addCustomQuestion = addCustomQuestion;
exports.deleteCustomQuestion = deleteCustomQuestion;
exports.getHistory = getHistory;
exports.getPartnerAnswer = getPartnerAnswer;
exports.getQuestions = getQuestions;
exports.submitAnswer = submitAnswer;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/qna.js.map
