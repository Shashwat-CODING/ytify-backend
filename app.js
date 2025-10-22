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
  
  res.status = function(code) {
    console.log(`[RESPONSE] Status set to ${code} for ${req.method} ${req.originalUrl}`);
    return originalStatus.call(this, code);
  };
  
  res.send = function(body) {
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
const youtubeSearch = new YouTubeSearch();

// Make clients available to routes
app.locals.ytmusic = ytmusic;
app.locals.youtubeSearch = youtubeSearch;

// Root endpoint - Frontend Demo
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ytify-backend - Music API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            max-width: 800px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: #667eea;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .demo-button {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }
        
        .demo-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
        }
        
        .api-button {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
        }
        
        .api-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(78, 205, 196, 0.6);
        }
        
        .features {
            margin-top: 3rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 15px;
            backdrop-filter: blur(5px);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .feature h3 {
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        
        .feature p {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .github-link {
            margin-top: 2rem;
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .github-link:hover {
            color: white;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 1rem;
                padding: 1.5rem;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .demo-button, .api-button {
                display: block;
                margin: 0.5rem auto;
                width: 100%;
                max-width: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎵</div>
        <h1>ytify-backend</h1>
        <p class="subtitle">Comprehensive Music Streaming API</p>
        
        <a href="https://shashwat-coding.github.io/ytify-backend" class="demo-button" target="_blank">
            🌐 Live Demo
        </a>
        
        <a href="/api-docs" class="api-button">
            📚 API Documentation
        </a>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h3>YouTube Music</h3>
                <p>Search songs, albums, artists, and playlists</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔍</div>
                <h3>YouTube Search</h3>
                <p>Search videos, channels, and playlists</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎧</div>
                <h3>Last.fm Integration</h3>
                <p>Get similar tracks and recommendations</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎶</div>
                <h3>Saavn API</h3>
                <p>Search and stream music from JioSaavn</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📺</div>
                <h3>Piped & Invidious</h3>
                <p>Alternative YouTube streaming sources</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎨</div>
                <h3>Channel Feeds</h3>
                <p>Get latest videos from YouTube channels</p>
            </div>
        </div>
        
        <a href="https://github.com/Shashwat-CODING/ytify-backend" class="github-link" target="_blank">
            View on GitHub →
        </a>
    </div>
    
    <script>
        // Add some interactive effects
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('.demo-button, .api-button');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px) scale(1.05)';
                });
                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
        });
    </script>
</body>
</html>
  `);
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
    console.log(`🌐 Frontend Demo available at http://localhost:${PORT}/`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

module.exports = app;
