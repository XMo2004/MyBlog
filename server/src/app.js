const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const { scheduleDaily } = require('./services/backup.service')
const { generalLimiter } = require('./middleware/rateLimit.middleware')

// Middleware
app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim()).filter(Boolean)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('CORS: origin not allowed'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
              app.use(generalLimiter);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Blog Server is Running!' });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const tagRoutes = require('./routes/tag.routes');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', require('./routes/comment.routes'));
app.use('/api/tags', tagRoutes);
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/resources', require('./routes/resource.routes'));
app.use('/api/columns', require('./routes/column.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/visit', require('./routes/visit.routes'));
app.use('/api/weight', require('./routes/weight.routes'));
app.use('/api/diet', require('./routes/diet.routes'));
app.use('/api/bookmarks', require('./routes/bookmark.routes'));

// Error handler (last)
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'CORS blocked' });
  }
  res.status(500).json({ message: 'Server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  scheduleDaily()
}

module.exports = app;
