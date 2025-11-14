const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const mongoUri = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/supalocker';
mongoose.connect(mongoUri).then(() => console.log('Mongo connected')).catch(e => { console.error('Mongo error', e); process.exit(1); });

const authMiddleware = require('./middleware/auth');

app.get('/health', (_req, res) => res.json({ ok: true }));

// Public auth routes (signup/login)
app.use('/auth', require('./routes/auth'));

// Protected routes below require a valid JWT
app.use('/did', authMiddleware, require('./routes/did'));
app.use(authMiddleware, require('./routes/upload'));
app.use(authMiddleware, require('./routes/credentials'));
app.use(authMiddleware, require('./routes/verify'));

module.exports = app;
