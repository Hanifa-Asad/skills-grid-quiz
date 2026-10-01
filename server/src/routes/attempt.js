const r = require('express').Router(); const { auth, role } = require('../middleware/auth');
const { Quiz, Question, QuizAttempt } = require('../models'); const { asyncHandler, shuffle, gradeFor, buildResult } = require('../helpers');
const studentOnly = [auth, role('student')];
// Student-safe payload: NEVER includes isCorrect
const present = a => ({ attemptId: a._id, status: a.status, endsAt: a.endsAt, serverNow: Date.now(),
  questions: a.questionsSnapshot.map(q => ({ _id: q.questionId, text: q.questionText, options: q.options.map(o => ({ _id: o._id, text: o.text })) })),
  answers: a.answers });
const done = (res, a) => res.status(409).json({ message: 'You have already attempted this quiz.', attemptId: a._id });

r.post('/quizzes/:quizId/start', ...studentOnly, asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId).catch(() => null);
  if (!quiz || !quiz.isActive) return res.status(404).json({ message: 'Quiz not found.' });
  let a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: quiz._id });
  if (a) return a.status === 'completed' ? done(res, a) : res.json(present(a)); // refresh = resume same attempt
  const bank = await Question.find({ quizId: quiz._id });
  if (bank.length < 20) return res.status(400).json({ message: 'This quiz needs at least 20 questions before students can start.' });
  let picked = quiz.randomQuestions ? shuffle(bank) : bank; picked = picked.slice(0, 20);
  const snap = picked.map(q => ({ questionId: q._id, questionText: q.questionText,
    options: (quiz.randomOptions ? shuffle(q.options) : q.options).map(o => ({ text: o.text, isCorrect: o.isCorrect })) }));
  try { a = await QuizAttempt.create({ studentId: req.user._id, quizId: quiz._id, questionIds: picked.map(q => q._id), questionsSnapshot: snap,
    endsAt: quiz.timeLimit > 0 ? new Date(Date.now() + quiz.timeLimit * 60000) : undefined });
  } catch (e) { if (e.code !== 11000) throw e; a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: quiz._id }); if (!a) throw e; if (a.status === 'completed') return done(res, a); }
  res.json(present(a)); }));

r.get('/quizzes/:quizId/my-attempt', ...studentOnly, asyncHandler(async (req, res) => { const a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: req.params.quizId });
  res.json(a ? { _id: a._id, status: a.status, score: a.score, totalQuestions: a.totalQuestions } : null); }));

// Autosave one answer so refresh restores progress
r.put('/quizzes/:quizId/answer', ...studentOnly, asyncHandler(async (req, res) => {
  const { questionId, optionId } = req.body;
  const a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: req.params.quizId, status: 'in_progress' });
  if (!a) return res.status(409).json({ message: 'Your quiz has already been submitted.' });
  if (a.endsAt && Date.now() >= a.endsAt.getTime()) return res.status(409).json({ message: 'Time is up.' });
  const q = a.questionsSnapshot.find(x => String(x.questionId) === String(questionId));
  if (!q || !q.options.some(o => String(o._id) === String(optionId))) return res.status(400).json({ message: 'Invalid answer.' });
  a.answers = a.answers.filter(x => String(x.questionId) !== String(questionId)).concat({ questionId, optionId }); await a.save(); res.json({ ok: true }); }));

r.post('/quizzes/:quizId/submit', ...studentOnly, asyncHandler(async (req, res) => {
  const a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: req.params.quizId });
  if (!a) return res.status(404).json({ message: 'No active attempt found.' });
  if (a.status === 'completed') return res.json({ attemptId: a._id, duplicate: true }); // return saved result
  const quiz = await Quiz.findById(a.quizId); const late = a.endsAt && Date.now() >= a.endsAt.getTime();
  const map = new Map(a.answers.map(x => [String(x.questionId), String(x.optionId)]));
  if (!late) for (const answer of req.body?.answers || []) {
    const question = a.questionsSnapshot.find(q => String(q.questionId) === String(answer.questionId));
    if (!question || !question.options.some(option => String(option._id) === String(answer.optionId))) return res.status(400).json({ message: 'Invalid answer.' });
    map.set(String(answer.questionId), String(answer.optionId));
  }
  const answers = [...map].map(([questionId, optionId]) => ({ questionId, optionId }));
  const total = a.questionsSnapshot.length;
  const correct = a.questionsSnapshot.filter(q => q.options.some(o => o.isCorrect && map.get(String(q.questionId)) === String(o._id))).length;
  const pct = Math.round((correct / total) * 10000) / 100;
  const upd = await QuizAttempt.findOneAndUpdate({ _id: a._id, status: 'in_progress' }, { answers, score: correct, correctAnswers: correct, wrongAnswers: total - correct,
    totalQuestions: total, percentage: pct, grade: gradeFor(pct), status: 'completed', submittedAt: new Date() }, { new: true }); // atomic: only first submit wins
  res.json({ attemptId: a._id, duplicate: !upd }); }));

r.get('/results/my', ...studentOnly, asyncHandler(async (req, res) => res.json(await QuizAttempt.find({ studentId: req.user._id, status: 'completed' }).populate('quizId', 'title courseName').select('-questionsSnapshot -answers'))));
r.get('/results/:attemptId', ...studentOnly, asyncHandler(async (req, res) => {
  const a = await QuizAttempt.findById(req.params.attemptId).catch(() => null);
  if (!a || String(a.studentId) !== String(req.user._id)) return res.status(404).json({ message: 'Result not found.' }); // students see only their own
  if (a.status !== 'completed') return res.status(409).json({ message: 'Quiz not submitted yet.' });
  res.json(await buildResult(a._id, false)); }));
module.exports = r;
