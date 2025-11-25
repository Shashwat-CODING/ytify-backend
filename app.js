const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Import route modules
const apiRoutes = require('./routes/api');
const entitiesRoutes = require('./routes/entities');
const exploreRoutes = require('./routes/explore');
const youtubeRoutes = require('./routes/youtube');
const jiosaavnRoutes = require('./routes/jiosaavn');

// Import libraries
const YTMusic = require('./lib/ytmusicapi');
const YouTubeSearch = require('./lib/youtube-search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// Disable ETag generation to prevent 304 responses
app.set('etag', false);

// Add custom logging middleware for debugging 304 responses
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalStatus = res.status;

  res.status = function (code) {
    console.log(`[RESPONSE] Status set to ${code} for ${req.method} ${req.originalUrl}`);
    return originalStatus.call(this, code);
  };

  res.send = function (body) {
    console.log(`[RESPONSE] Sending response for ${req.method} ${req.originalUrl}:`, {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      bodyLength: typeof body === 'string' ? body.length : 'not-string'
    });
    return originalSend.call(this, body);
  };

  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize clients
const ytmusic = new YTMusic();
ytmusic.initialize();
const youtubeSearch = new YouTubeSearch();

// Make clients available to routes
app.locals.ytmusic = ytmusic;
app.locals.youtubeSearch = youtubeSearch;

// Root endpoint - Redirect to Frontend Demo
app.get('/', (req, res) => {
  res.redirect('https://shashwat-coding.github.io/ytify-backend');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Music API',
      version: '1.0.0',
      description: 'Node.js Music API with YouTube Music, YouTube Search, and JioSaavn integration',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API routes
app.use('/api', apiRoutes);
app.use('/api', entitiesRoutes);
app.use('/api', exploreRoutes);
app.use('/api', youtubeRoutes);
app.use('/api', jiosaavnRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server locally; on Vercel we just export the app
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ytify-backend server running on port ${PORT}`);
    console.log(`🌐 Frontend Demo redirects from http://localhost:${PORT}/ to https://shashwat-coding.github.io/ytify-backend`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

module.exports = app;
