const { QuizAttempt } = require('./models');
exports.asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
exports.shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
exports.gradeFor = pct => pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
// Full result incl. review. Correct answers only included if quiz allows it (or caller is admin).
exports.buildResult = async (id, isAdmin = true) => {
  const a = await QuizAttempt.findById(id).populate('studentId', 'name email studentId').populate('quizId', 'title courseName showCorrectAnswers');
  if (!a) return null; const o = a.toObject();
  o.review = a.questionsSnapshot.map((q, i) => {
    const ans = a.answers.find(x => String(x.questionId) === String(q.questionId));
    const sel = ans && q.options.find(op => String(op._id) === String(ans.optionId)); const cor = q.options.find(op => op.isCorrect);
    return { number: i + 1, questionText: q.questionText, yourAnswer: sel ? sel.text : null, correctAnswer: cor?.text, isCorrect: !!(sel && sel.isCorrect) }; });
  delete o.questionsSnapshot; return o;
};
