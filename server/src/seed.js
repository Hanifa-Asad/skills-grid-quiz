require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, Quiz, Question } = require('./models');

const normalizeQuestion = (item, index) => {
  const questionText = String(item.questionText || item.question || '').trim();
  const options = Array.isArray(item.options) ? item.options.map((option, optionIndex) => ({
    text: String(typeof option === 'string' ? option : option.text || '').trim(),
    isCorrect: typeof option === 'object' ? option.isCorrect === true : Number(item.answer) === optionIndex
  })) : [];
  if (!questionText || options.length !== 4 || options.some(option => !option.text) || options.filter(option => option.isCorrect).length !== 1) {
    throw new Error(`Question ${index + 1} must have text, four non-empty options, and exactly one correct answer.`);
  }
  return { questionText, options };
};

(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!!adminEmail !== !!adminPassword) throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the admin account.');
  if (adminEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 8)) {
    throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must be at least 8 characters.');
  }

  const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');
  const sourceQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  if (!Array.isArray(sourceQuestions) || sourceQuestions.length !== 80) {
    throw new Error('The seeded HTML question bank must contain exactly 80 questions.');
  }
  const seedQuestions = sourceQuestions.map(normalizeQuestion);
  const uniqueQuestions = new Set(seedQuestions.map(question => question.questionText.toLocaleLowerCase()));
  if (uniqueQuestions.size !== 80) throw new Error('The seeded HTML question bank must contain 80 unique questions.');

  await mongoose.connect(process.env.MONGO_URI);
  if (adminEmail) {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin && existingAdmin.role !== 'admin') throw new Error('ADMIN_EMAIL is already registered to a student. Choose a different email.');
  }

  let quiz = await Quiz.findOne({ title: 'HTML Quiz' });
  if (!quiz) {
    quiz = await Quiz.create({
      title: 'HTML Quiz',
      courseName: 'Modern Web Application Development',
      description: 'HTML fundamentals',
      questionsPerAttempt: 20,
      attemptLimit: 1,
      timeLimit: 30,
      randomQuestions: true,
      randomOptions: true,
      showResult: true,
      showCorrectAnswers: true,
      isActive: true
    });
  } else {
    await Quiz.updateOne({ _id: quiz._id }, { $set: {
      courseName: 'Modern Web Application Development',
      questionsPerAttempt: 20,
      attemptLimit: 1,
      randomQuestions: true,
      randomOptions: true,
      showResult: true,
      showCorrectAnswers: true,
      allowRetake: false
    } });
  }

  await Question.bulkWrite(seedQuestions.map(question => ({
    updateOne: {
      filter: { quizId: quiz._id, questionText: question.questionText },
      update: { $set: { category: 'HTML', options: question.options }, $setOnInsert: { quizId: quiz._id, questionText: question.questionText } },
      upsert: true
    }
  })));

  const seededRecords = await Question.find({ quizId: quiz._id, questionText: { $in: seedQuestions.map(question => question.questionText) } }).sort({ createdAt: 1, _id: 1 }).select('_id questionText');
  const seenTexts = new Set();
  const duplicateIds = seededRecords.filter(question => {
    if (seenTexts.has(question.questionText)) return true;
    seenTexts.add(question.questionText);
    return false;
  }).map(question => question._id);
  if (duplicateIds.length) await Question.deleteMany({ _id: { $in: duplicateIds } });

  if (adminEmail) {
    await User.updateOne({ email: adminEmail }, { $set: {
      name: String(process.env.ADMIN_NAME || 'Skills Grid Administrator').trim(),
      password: await bcrypt.hash(adminPassword, 12),
      role: 'admin'
    }, $setOnInsert: { email: adminEmail } }, { upsert: true });
  } else {
    console.warn('ADMIN_EMAIL and ADMIN_PASSWORD are not set; no admin account was created.');
  }

  console.log(`Seed complete: ${seedQuestions.length} unique HTML questions synchronized${adminEmail ? ' and admin account provisioned' : ''}.`);
  await mongoose.disconnect();
})().catch(err => {
  console.error(err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
