require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required in server/.env.');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in server/.env.');
const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '100kb' }));
require('./models');
app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/quiz'));
app.use('/api', require('./routes/attempt'));
app.use('/api/admin', require('./routes/admin'));
app.use((e, req, res, next) => {
  if (res.headersSent) return next(e);
  console.error(e.message);
  const status = e.status || 500;
  res.status(status).json({ message: status < 500 ? e.message : 'Server error. Please try again.' });
});
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    await mongoose.model('QuizAttempt').init();
    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => console.log(`Skills Grid API running on port ${port}`)).on('error', err => {
      console.error('API failed to listen:', err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
