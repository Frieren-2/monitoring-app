# 📚 Thesis Citation Converter

A modern, web-based citation converter that supports conversion between major academic citation styles including APA, MLA, Chicago, IEEE, Harvard, Vancouver, and Turabian formats.

## ✨ Features

- **Multi-Format Support**: Convert between 7 major citation styles
- **Auto-Detection**: Automatically detect citation format with confidence scoring
- **Batch Processing**: Convert multiple citations at once
- **Modern UI**: Beautiful, responsive interface with real-time feedback
- **Export Options**: Copy to clipboard or download as text file
- **Validation**: Comprehensive input validation and error handling
- **Rate Limiting**: Built-in protection against abuse
- **Security**: Helmet.js security headers and input sanitization

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd thesis-citation-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the frontend**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode

For development with hot reloading:

```bash
npm run dev
```

## 📖 Usage

### Web Interface

1. **Select Formats**: Choose source and target citation formats
2. **Enter Citations**: Paste your citations (one per line)
3. **Convert**: Click "Convert Citations" or use Ctrl+Enter
4. **Export**: Copy individual citations or download all results

### Auto-Detection

1. Click "🔍 Auto-Detect Format" or press Ctrl+K
2. Paste a citation to detect its format
3. The system will suggest the detected format with confidence level

### API Usage

#### Convert Citations

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "citations": ["Smith, J. (2023). Example Title. Journal Name, 15(3), 123-145."],
    "fromFormat": "apa",
    "toFormat": "mla"
  }'
```

#### Detect Format

```bash
curl -X POST http://localhost:3000/api/detect-format \
  -H "Content-Type: application/json" \
  -d '{
    "citation": "Smith, J. (2023). Example Title. Journal Name, 15(3), 123-145."
  }'
```

#### Get Supported Formats

```bash
curl http://localhost:3000/api/formats
```

## 🎯 Supported Formats

| Format | Full Name | Version | Notes |
|--------|-----------|---------|-------|
| APA | American Psychological Association | 7th Edition | Most common in social sciences |
| MLA | Modern Language Association | 9th Edition | Common in humanities |
| Chicago | Chicago Manual of Style | 17th Edition | Academic and professional writing |
| IEEE | Institute of Electrical and Electronics Engineers | Latest | Engineering and technology |
| Harvard | Harvard Referencing | Various | Author-date system |
| Vancouver | Vancouver Style | Latest | Medical and scientific |
| Turabian | Turabian Style | 9th Edition | Student version of Chicago |

## 🏗️ Architecture

### Backend (Node.js/Express)

- **Server**: Express.js with security middleware
- **Validation**: Joi schema validation
- **Rate Limiting**: Flexible rate limiting
- **Security**: Helmet.js, CORS, input sanitization
- **Parsing**: Cheerio for HTML parsing and text extraction

### Frontend (Vanilla JavaScript)

- **Framework**: Pure JavaScript (no dependencies)
- **Styling**: Modern CSS with Flexbox/Grid
- **Build**: Webpack for bundling
- **Features**: Responsive design, animations, notifications

### Core Components

```
src/
├── CitationConverter.js    # Main conversion logic
├── CitationValidator.js    # Input validation
├── index.html             # Main HTML template
├── styles.css             # CSS styles
└── app.js                 # Frontend JavaScript
```

## 🔧 Configuration

### Environment Variables

```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment mode
```

### Rate Limiting

Default: 100 requests per 60 seconds per IP

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 📊 API Reference

### POST /api/convert

Convert citations between formats.

**Request Body:**
```json
{
  "citations": ["citation1", "citation2"],
  "fromFormat": "apa",
  "toFormat": "mla"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "original": "original citation",
      "converted": "converted citation",
      "success": true
    }
  ],
  "metadata": {
    "converted": 1,
    "fromFormat": "apa",
    "toFormat": "mla",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/detect-format

Detect the format of a citation.

**Request Body:**
```json
{
  "citation": "Smith, J. (2023). Example Title."
}
```

**Response:**
```json
{
  "success": true,
  "detectedFormat": {
    "format": "apa",
    "type": "journal",
    "confidence": 0.85
  }
}
```

### GET /api/formats

Get list of supported formats.

**Response:**
```json
{
  "success": true,
  "formats": ["apa", "mla", "chicago", "ieee", "harvard", "vancouver", "turabian"]
}
```

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test

# Test API endpoints
curl http://localhost:3000/api/health
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

1. **Production**: Set `NODE_ENV=production`
2. **Security**: Configure CORS origins
3. **Rate Limiting**: Adjust limits for your use case
4. **Monitoring**: Add logging and health checks

## 🔒 Security Features

- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Security Headers**: Helmet.js for security headers
- **Input Sanitization**: HTML tag removal and character filtering
- **CORS**: Configurable cross-origin resource sharing

## 📈 Performance

- **Compression**: Gzip compression for responses
- **Caching**: Static file caching
- **Rate Limiting**: Memory-based rate limiting
- **Batch Processing**: Efficient batch citation conversion

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port
   PORT=3001 npm start
   ```

2. **Build errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CORS issues**
   - Check CORS configuration in server.js
   - Ensure frontend and backend are on same domain

### Debug Mode

```bash
NODE_ENV=development npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Academic citation style guidelines
- Modern web development best practices
- Open source community contributions

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Made with ❤️ for academic researchers and students**