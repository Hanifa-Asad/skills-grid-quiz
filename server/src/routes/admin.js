const r = require('express').Router(); const { auth, role } = require('../middleware/auth');
const { User, QuizAttempt } = require('../models'); const { asyncHandler, buildResult } = require('../helpers');
r.use(auth, role('admin'));
r.get('/dashboard', asyncHandler(async (req, res) => { const done = await QuizAttempt.find({ status: 'completed' }).select('percentage');
  res.json({ totalStudents: await User.countDocuments({ role: 'student' }), totalAttempts: await QuizAttempt.countDocuments(),
    completedAttempts: done.length, averageScore: done.length ? Math.round(done.reduce((s, a) => s + a.percentage, 0) / done.length) : 0 }); }));
r.get('/results', asyncHandler(async (req, res) => { const { q = '', grade = '' } = req.query;
  let list = await QuizAttempt.find(grade ? { grade } : {}).populate('studentId', 'name email studentId').populate('quizId', 'title').select('-questionsSnapshot -answers').sort('-submittedAt');
  if (q) list = list.filter(a => (a.studentId?.name + ' ' + a.studentId?.email + ' ' + a.studentId?.studentId).toLowerCase().includes(q.toLowerCase())); res.json(list); }));
r.get('/results/:attemptId', asyncHandler(async (req, res) => { const d = await buildResult(req.params.attemptId, true).catch(() => null);
  d ? res.json(d) : res.status(404).json({ message: 'Result not found.' }); }));
r.get('/students', asyncHandler(async (req, res) => res.json(await User.find({ role: 'student' }).select('-password').sort('name'))));
module.exports = r;
