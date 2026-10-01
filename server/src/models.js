const m = require('mongoose'), S = m.Schema;
const User = m.model('User', new S({
  name: { type: String, required: true }, email: { type: String, unique: true, lowercase: true, required: true },
  password: { type: String, required: true }, role: { type: String, enum: ['admin', 'student'], default: 'student' },
  studentId: { type: String, unique: true, sparse: true } }, { timestamps: true }));
const Quiz = m.model('Quiz', new S({
  title: String, courseName: String, description: String, questionsPerAttempt: { type: Number, default: 20 },
  attemptLimit: { type: Number, default: 1 }, timeLimit: { type: Number, default: 30 }, // minutes, 0 = no timer
  randomQuestions: { type: Boolean, default: true }, randomOptions: { type: Boolean, default: true },
  showResult: { type: Boolean, default: true }, showCorrectAnswers: { type: Boolean, default: true },
  allowRetake: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
  gradingRules: { type: [{ min: Number, grade: String }], default: [
    { min: 90, grade: 'A+' }, { min: 80, grade: 'A' }, { min: 70, grade: 'B' }, { min: 60, grade: 'C' }, { min: 50, grade: 'D' }, { min: 0, grade: 'F' }] }
}, { timestamps: true }));
const Question = m.model('Question', new S({
  quizId: { type: S.Types.ObjectId, ref: 'Quiz', index: true }, questionText: { type: String, required: true },
  options: [{ text: String, isCorrect: Boolean }], category: { type: String, default: 'HTML' } }, { timestamps: true }));
const Attempt = new S({
  studentId: { type: S.Types.ObjectId, ref: 'User', required: true }, quizId: { type: S.Types.ObjectId, ref: 'Quiz', required: true },
  questionIds: [S.Types.ObjectId],
  questionsSnapshot: [{ questionId: S.Types.ObjectId, questionText: String, options: [{ text: String, isCorrect: Boolean }] }],
  answers: [{ questionId: S.Types.ObjectId, optionId: S.Types.ObjectId }],
  score: Number, totalQuestions: Number, correctAnswers: Number, wrongAnswers: Number, percentage: Number, grade: String,
  attemptNumber: { type: Number, default: 1 }, status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  startedAt: { type: Date, default: Date.now }, endsAt: Date, submittedAt: Date });
Attempt.index({ studentId: 1, quizId: 1 }, { unique: true }); // one student + one quiz = one attempt
const QuizAttempt = m.model('QuizAttempt', Attempt);
module.exports = { User, Quiz, Question, QuizAttempt };
