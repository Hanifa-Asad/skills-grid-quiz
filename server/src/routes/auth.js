const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models');
const { asyncHandler } = require('../helpers');
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, studentId: u.studentId });

r.post('/login', asyncHandler(async (req, res) => {
  const { identifier = '', password = '', role = 'student' } = req.body;
  const value = String(identifier).trim();
  const pass = String(password);
  const targetRole = String(role).toLowerCase() === 'admin' ? 'admin' : 'student';

  if (!value || !pass) {
    return res.status(400).json({ message: 'Email/Student ID and password are required.' });
  }

  const query = targetRole === 'admin'
    ? { role: 'admin', email: value.toLowerCase() }
    : { $or: [{ email: value.toLowerCase() }, { studentId: value }] };

  const user = await User.findOne(query);
  if (!user || !(await bcrypt.compare(pass, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (targetRole === 'admin' && user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only.' });
  }

  if (targetRole === 'student' && user.role !== 'student') {
    return res.status(403).json({ message: 'Student access only.' });
  }

  res.json({ token: sign(user), user: pub(user) });
}));

r.post('/register', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');
  const studentId = String(req.body.studentId || '').trim();
  const errors = {};

  if (!name) errors.name = 'Full name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });
  }

  try {
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'This email is already registered.', errors: { email: 'This email is already registered.' } });
    }
    if (studentId && await User.exists({ studentId })) {
      return res.status(409).json({ message: 'This Student ID is already registered.', errors: { studentId: 'This Student ID is already registered.' } });
    }

    await User.create({
      name,
      email,
      studentId: studentId || undefined,
      password: await bcrypt.hash(password, 10),
      role: 'student'
    });

    res.status(201).json({ message: 'Account created successfully. Please log in.' });
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({
      message: e.code === 11000 ? 'Email or Student ID already exists.' : 'Server error.'
    });
  }
}));

module.exports = r;
