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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/did', require('./routes/did'));
app.use(require('./routes/upload'));
app.use(require('./routes/credentials'));
app.use(require('./routes/verify'));

module.exports = app;
