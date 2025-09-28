const Joi = require('joi');

class CitationValidator {
  constructor() {
    this.supportedFormats = [
      'apa',
      'mla', 
      'chicago',
      'ieee',
      'harvard',
      'vancouver',
      'turabian'
    ];

    this.schemas = {
      conversionRequest: Joi.object({
        citations: Joi.array()
          .items(Joi.string().min(1).max(5000))
          .min(1)
          .max(100)
          .required()
          .messages({
            'array.min': 'At least one citation is required',
            'array.max': 'Maximum 100 citations allowed per request',
            'string.min': 'Citation cannot be empty',
            'string.max': 'Citation is too long (max 5000 characters)'
          }),
        fromFormat: Joi.string()
          .valid(...this.supportedFormats)
          .required()
          .messages({
            'any.only': `Source format must be one of: ${this.supportedFormats.join(', ')}`
          }),
        toFormat: Joi.string()
          .valid(...this.supportedFormats)
          .required()
          .messages({
            'any.only': `Target format must be one of: ${this.supportedFormats.join(', ')}`
          })
      }).custom((value, helpers) => {
        // Prevent same format conversion
        if (value.fromFormat === value.toFormat) {
          return helpers.error('custom.sameFormat');
        }
        return value;
      }).messages({
        'custom.sameFormat': 'Source and target formats cannot be the same'
      }),

      detectRequest: Joi.object({
        citation: Joi.string()
          .min(1)
          .max(5000)
          .required()
          .messages({
            'string.min': 'Citation cannot be empty',
            'string.max': 'Citation is too long (max 5000 characters)'
          })
      })
    };
  }

  validateConversionRequest(data) {
    const { error, value } = this.schemas.conversionRequest.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };
  }

  validateDetectRequest(data) {
    const { error, value } = this.schemas.detectRequest.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };
  }

  validateCitation(citation, format) {
    if (!citation || typeof citation !== 'string') {
      return {
        isValid: false,
        errors: ['Citation must be a non-empty string']
      };
    }

    if (citation.length > 5000) {
      return {
        isValid: false,
        errors: ['Citation is too long (max 5000 characters)']
      };
    }

    if (!this.supportedFormats.includes(format)) {
      return {
        isValid: false,
        errors: [`Unsupported format: ${format}`]
      };
    }

    // Basic format-specific validation
    const formatValidation = this.validateFormatSpecific(citation, format);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    return {
      isValid: true,
      errors: []
    };
  }

  validateFormatSpecific(citation, format) {
    const patterns = {
      apa: {
        hasAuthor: /^[A-Z][a-z]+/,
        hasYear: /\(\d{4}\)/,
        hasTitle: /\.\s*[^\.]+\./,
        endsWithPeriod: /\.$/
      },
      mla: {
        hasAuthor: /^[A-Z][a-z]+/,
        hasTitle: /\.\s*[^\.]+\./,
        hasYear: /\d{4}\./,
        endsWithPeriod: /\.$/
      },
      chicago: {
        hasAuthor: /^[A-Z][a-z]+/,
        hasTitle: /\.\s*[^\.]+\./,
        hasYear: /\d{4}\./,
        endsWithPeriod: /\.$/
      },
      ieee: {
        hasReferenceNumber: /^\[\d+\]/,
        hasAuthor: /[A-Z]\.\s+[A-Z][a-z]+/,
        hasTitle: /"[^"]+"/,
        hasYear: /\d{4}\./
      },
      harvard: {
        hasAuthor: /^[A-Z][a-z]+/,
        hasYear: /\(\d{4}\)/,
        hasTitle: /\.\s*[^\.]+\./,
        endsWithPeriod: /\.$/
      },
      vancouver: {
        hasReferenceNumber: /^\d+\./,
        hasAuthor: /[A-Z][a-z]+\s+[A-Z]\./,
        hasTitle: /\.\s*[^\.]+\./,
        hasYear: /\d{4}\./
      },
      turabian: {
        hasAuthor: /^[A-Z][a-z]+/,
        hasTitle: /\.\s*[^\.]+\./,
        hasYear: /\d{4}\./,
        endsWithPeriod: /\.$/
      }
    };

    const formatPatterns = patterns[format];
    if (!formatPatterns) {
      return {
        isValid: false,
        errors: [`No validation patterns for format: ${format}`]
      };
    }

    const errors = [];
    
    // Check required elements
    for (const [element, pattern] of Object.entries(formatPatterns)) {
      if (!pattern.test(citation)) {
        errors.push(`Missing or invalid ${element} in ${format.toUpperCase()} format`);
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  sanitizeCitation(citation) {
    if (typeof citation !== 'string') {
      return '';
    }

    // Remove HTML tags
    let sanitized = citation.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Limit length
    if (sanitized.length > 5000) {
      sanitized = sanitized.substring(0, 5000).trim();
    }

    return sanitized;
  }

  validateBatchSize(citations) {
    if (!Array.isArray(citations)) {
      return {
        isValid: false,
        errors: ['Citations must be provided as an array']
      };
    }

    if (citations.length === 0) {
      return {
        isValid: false,
        errors: ['At least one citation is required']
      };
    }

    if (citations.length > 100) {
      return {
        isValid: false,
        errors: ['Maximum 100 citations allowed per request']
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  isFormatSupported(format) {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}

module.exports = CitationValidator;