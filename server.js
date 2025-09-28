const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const path = require('path');

const CitationConverter = require('./src/CitationConverter');
const CitationValidator = require('./src/CitationValidator');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ error: 'Too many requests' });
    });
};

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiterMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize services
const citationConverter = new CitationConverter();
const citationValidator = new CitationValidator();

// API Routes
app.post('/api/convert', async (req, res) => {
  try {
    const { citations, fromFormat, toFormat } = req.body;
    
    // Validate input
    const validation = citationValidator.validateConversionRequest({
      citations,
      fromFormat,
      toFormat
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.errors
      });
    }

    // Convert citations
    const results = await citationConverter.convertCitations(citations, fromFormat, toFormat);
    
    res.json({
      success: true,
      results,
      metadata: {
        converted: results.length,
        fromFormat,
        toFormat,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/detect-format', async (req, res) => {
  try {
    const { citation } = req.body;
    
    if (!citation || typeof citation !== 'string') {
      return res.status(400).json({
        error: 'Citation text is required'
      });
    }

    const detectedFormat = await citationConverter.detectFormat(citation);
    
    res.json({
      success: true,
      detectedFormat,
      confidence: detectedFormat.confidence
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get('/api/formats', (req, res) => {
  res.json({
    success: true,
    formats: citationConverter.getSupportedFormats()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Thesis Citation Converter running on port ${PORT}`);
  console.log(`📚 Supporting formats: ${citationConverter.getSupportedFormats().join(', ')}`);
});

module.exports = app;