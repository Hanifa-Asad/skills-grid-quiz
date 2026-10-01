const r = require('express').Router();
const { auth, role } = require('../middleware/auth');
const { Quiz, Question, QuizAttempt } = require('../models');
const { asyncHandler } = require('../helpers');

const withBank = async q => ({ ...q.toObject(), questionBankSize: await Question.countDocuments({ quizId: q._id }) });
const quizFields = ['title', 'courseName', 'description', 'timeLimit', 'randomOptions', 'isActive'];
const pickQuizFields = body => Object.fromEntries(quizFields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
const validateQuizFields = fields => {
  if (fields.title !== undefined && !String(fields.title).trim()) return 'Quiz name is required.';
  if (fields.courseName !== undefined && !String(fields.courseName).trim()) return 'Course name is required.';
  if (fields.timeLimit !== undefined && (!Number.isInteger(fields.timeLimit) || fields.timeLimit < 1 || fields.timeLimit > 180)) return 'Time limit must be between 1 and 180 minutes.';
  if (['randomOptions', 'isActive'].some(key => fields[key] !== undefined && typeof fields[key] !== 'boolean')) return 'Quiz settings must use valid boolean values.';
  return null;
};

r.use(auth);

r.get('/quizzes', asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find(req.user.role === 'admin' ? {} : { isActive: true });
  const out = [];

  for (const q of quizzes) {
    const o = await withBank(q);
    if (req.user.role === 'student') {
      const a = await QuizAttempt.findOne({ studentId: req.user._id, quizId: q._id });
      o.attempt = a && { _id: a._id, status: a.status, score: a.score, totalQuestions: a.totalQuestions };
      delete o.gradingRules;
    }
    out.push(o);
  }

  res.json(out);
}));

r.get('/quizzes/:id', asyncHandler(async (req, res) => { const q = await Quiz.findById(req.params.id).catch(() => null);
  if (!q) return res.status(404).json({ message: 'Quiz not found.' });
  const o = await withBank(q);
  if (req.user.role !== 'admin') delete o.gradingRules;
  res.json(o);
}));

r.post('/quizzes', role('admin'), asyncHandler(async (req, res) => {
  const fields = pickQuizFields(req.body);
  const error = validateQuizFields(fields);
  if (error) return res.status(400).json({ message: error });
  res.status(201).json(await Quiz.create({ ...fields, questionsPerAttempt: 20, attemptLimit: 1, randomQuestions: true, allowRetake: false, timeLimit: fields.timeLimit ?? 30 }));
}));
r.put('/quizzes/:id', role('admin'), asyncHandler(async (req, res) => {
  const fields = pickQuizFields(req.body);
  const error = validateQuizFields(fields);
  if (error) return res.status(400).json({ message: error });
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, { $set: { ...fields, questionsPerAttempt: 20, attemptLimit: 1, randomQuestions: true, allowRetake: false, showResult: true, showCorrectAnswers: true } }, { new: true, runValidators: true });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
  res.json(quiz);
}));

const valid = b => String(b.questionText || '').trim() && Array.isArray(b.options) && b.options.length === 4 && b.options.every(o => String(o.text || '').trim()) && b.options.filter(o => o.isCorrect === true).length === 1;
r.get('/quizzes/:quizId/questions', role('admin'), asyncHandler(async (req, res) => res.json(await Question.find({ quizId: req.params.quizId }).sort('createdAt'))));
r.post('/quizzes/:quizId/questions', role('admin'), asyncHandler(async (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ message: 'Provide question text, 4 non-empty options and exactly 1 correct answer.' });
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
  res.status(201).json(await Question.create({ quizId: quiz._id, category: String(req.body.category || 'HTML'), questionText: String(req.body.questionText).trim(), options: req.body.options.map(o => ({ text: String(o.text).trim(), isCorrect: o.isCorrect === true })) }));
}));
r.put('/questions/:id', role('admin'), asyncHandler(async (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ message: 'Provide question text, 4 non-empty options and exactly 1 correct answer.' });
  const question = await Question.findByIdAndUpdate(req.params.id, { $set: { category: String(req.body.category || 'HTML'), questionText: String(req.body.questionText).trim(), options: req.body.options.map(o => ({ text: String(o.text).trim(), isCorrect: o.isCorrect === true })) } }, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ message: 'Question not found.' });
  res.json(question);
}));
r.delete('/questions/:id', role('admin'), asyncHandler(async (req, res) => { const deleted = await Question.findByIdAndDelete(req.params.id); if (!deleted) return res.status(404).json({ message: 'Question not found.' }); res.json({ ok: true }); }));
module.exports = r;
