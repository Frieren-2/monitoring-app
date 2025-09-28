const cheerio = require('cheerio');

class CitationConverter {
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
    
    this.formatPatterns = {
      apa: {
        book: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*\((\d{4})\)\.\s*.+\.\s*.+\.$/,
        journal: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*\((\d{4})\)\.\s*.+\.\s*.+,\s*\d+\(\d+\),\s*\d+-\d+\.$/,
        website: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*\((\d{4},\s*\w+\s+\d+)\)\.\s*.+\.\s*Retrieved from/
      },
      mla: {
        book: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*[A-Z][a-z]+\.\s*.+,\s*\d{4}\.$/,
        journal: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*"[A-Z][a-z\s]+"\s*.+,\s*vol\.\s*\d+,\s*no\.\s*\d+,\s*\d{4},\s*pp\.\s*\d+-\d+\.$/,
        website: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*"[A-Z][a-z\s]+"\s*.+\.\s*Web\.\s*\d+\s+\w+\s+\d{4}\.$/
      },
      chicago: {
        book: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*[A-Z][a-z]+\.\s*.+:\s*.+,\s*\d{4}\.$/,
        journal: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*"[A-Z][a-z\s]+"\s*.+\s*\d+,\s*no\.\s*\d+\s*\(\w+\s*\d{4}\):\s*\d+-\d+\.$/,
        website: /^[A-Z][a-z]+,?\s+[A-Z]\.\s*"[A-Z][a-z\s]+"\s*.+\.\s*Accessed\s+\w+\s+\d+,\s*\d{4}\./
      },
      ieee: {
        book: /^\[1\]\s+[A-Z]\.\s+[A-Z][a-z]+,\s*[A-Z][a-z\s]+\.\s*.+:\s*.+,\s*\d{4}\.$/,
        journal: /^\[1\]\s+[A-Z]\.\s+[A-Z][a-z]+,\s*"[A-Z][a-z\s]+"\s*.+,\s*vol\.\s*\d+,\s*no\.\s*\d+,\s*pp\.\s*\d+-\d+,\s*\w+\s*\d{4}\.$/,
        website: /^\[1\]\s+[A-Z]\.\s+[A-Z][a-z]+\.\s*"[A-Z][a-z\s]+"\s*\(Online\)\.\s*Available:/
      }
    };
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }

  async detectFormat(citation) {
    const citationText = citation.trim();
    let bestMatch = { format: 'unknown', confidence: 0 };
    
    for (const [format, patterns] of Object.entries(this.formatPatterns)) {
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(citationText)) {
          const confidence = this.calculateConfidence(citationText, pattern);
          if (confidence > bestMatch.confidence) {
            bestMatch = { format, type, confidence };
          }
        }
      }
    }
    
    return bestMatch;
  }

  calculateConfidence(citation, pattern) {
    const match = citation.match(pattern);
    if (!match) return 0;
    
    // Basic confidence calculation based on pattern match strength
    const matchLength = match[0].length;
    const totalLength = citation.length;
    return Math.min(0.9, matchLength / totalLength);
  }

  async convertCitations(citations, fromFormat, toFormat) {
    if (!this.supportedFormats.includes(fromFormat) || !this.supportedFormats.includes(toFormat)) {
      throw new Error(`Unsupported format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    const results = [];
    
    for (const citation of citations) {
      try {
        const converted = await this.convertSingleCitation(citation, fromFormat, toFormat);
        results.push({
          original: citation,
          converted: converted,
          success: true
        });
      } catch (error) {
        results.push({
          original: citation,
          converted: null,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async convertSingleCitation(citation, fromFormat, toFormat) {
    // Parse the citation into structured data
    const parsed = this.parseCitation(citation, fromFormat);
    
    // Convert to target format
    return this.formatCitation(parsed, toFormat);
  }

  parseCitation(citation, format) {
    const $ = cheerio.load(`<div>${citation}</div>`);
    const text = $.text().trim();
    
    switch (format.toLowerCase()) {
      case 'apa':
        return this.parseAPA(text);
      case 'mla':
        return this.parseMLA(text);
      case 'chicago':
        return this.parseChicago(text);
      case 'ieee':
        return this.parseIEEE(text);
      case 'harvard':
        return this.parseHarvard(text);
      case 'vancouver':
        return this.parseVancouver(text);
      case 'turabian':
        return this.parseTurabian(text);
      default:
        throw new Error(`Unsupported source format: ${format}`);
    }
  }

  parseAPA(citation) {
    // Enhanced APA parsing with better pattern recognition
    const patterns = {
      author: /^([A-Z][a-z]+(?:,\s*[A-Z]\.\s*[A-Z][a-z]+)*)/,
      year: /\((\d{4})\)/,
      title: /\.\s*([^\.]+)\./,
      publisher: /\.\s*([^\.]+)\.\s*$/,
      journal: /,\s*([^,]+),\s*\d+\(\d+\)/,
      volume: /(\d+)\(\d+\)/,
      issue: /\(\d+\)/,
      pages: /(\d+-\d+)/
    };

    const data = {};
    
    // Extract author
    const authorMatch = citation.match(patterns.author);
    if (authorMatch) {
      data.authors = authorMatch[1].split(',').map(author => 
        author.trim().split(' ').map(name => name.trim())
      );
    }

    // Extract year
    const yearMatch = citation.match(patterns.year);
    if (yearMatch) {
      data.year = yearMatch[1];
    }

    // Extract title
    const titleMatch = citation.match(patterns.title);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Determine if it's a journal article or book
    if (patterns.journal.test(citation)) {
      data.type = 'journal';
      const journalMatch = citation.match(patterns.journal);
      if (journalMatch) {
        data.journal = journalMatch[1].trim();
      }
      
      const volumeMatch = citation.match(patterns.volume);
      if (volumeMatch) {
        data.volume = volumeMatch[1];
      }
      
      const pagesMatch = citation.match(patterns.pages);
      if (pagesMatch) {
        data.pages = pagesMatch[1];
      }
    } else {
      data.type = 'book';
      const publisherMatch = citation.match(patterns.publisher);
      if (publisherMatch) {
        data.publisher = publisherMatch[1].trim();
      }
    }

    return data;
  }

  parseMLA(citation) {
    // MLA parsing logic
    const data = {};
    
    // Extract author
    const authorMatch = citation.match(/^([A-Z][a-z]+,?\s+[A-Z]\.)/);
    if (authorMatch) {
      data.authors = [authorMatch[1].trim().split(' ')];
    }

    // Extract title (between author and period)
    const titleMatch = citation.match(/\.\s*([^\.]+)\./);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Extract year
    const yearMatch = citation.match(/(\d{4})\./);
    if (yearMatch) {
      data.year = yearMatch[1];
    }

    return data;
  }

  parseChicago(citation) {
    // Chicago parsing logic
    const data = {};
    
    const authorMatch = citation.match(/^([A-Z][a-z]+,?\s+[A-Z]\.)/);
    if (authorMatch) {
      data.authors = [authorMatch[1].trim().split(' ')];
    }

    const titleMatch = citation.match(/\.\s*([^\.]+)\./);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    const yearMatch = citation.match(/(\d{4})\./);
    if (yearMatch) {
      data.year = yearMatch[1];
    }

    return data;
  }

  parseIEEE(citation) {
    // IEEE parsing logic
    const data = {};
    
    // Remove reference number
    const cleanCitation = citation.replace(/^\[\d+\]\s*/, '');
    
    const authorMatch = cleanCitation.match(/^([A-Z]\.\s+[A-Z][a-z]+)/);
    if (authorMatch) {
      data.authors = [authorMatch[1].trim().split(' ')];
    }

    const titleMatch = cleanCitation.match(/,\s*"([^"]+)"/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    const yearMatch = cleanCitation.match(/(\d{4})\./);
    if (yearMatch) {
      data.year = yearMatch[1];
    }

    return data;
  }

  parseHarvard(citation) {
    // Harvard parsing logic
    return this.parseAPA(citation); // Similar structure
  }

  parseVancouver(citation) {
    // Vancouver parsing logic
    const data = {};
    
    const authorMatch = citation.match(/^(\d+)\.\s*([A-Z][a-z]+\s+[A-Z]\.)/);
    if (authorMatch) {
      data.referenceNumber = authorMatch[1];
      data.authors = [authorMatch[2].trim().split(' ')];
    }

    return data;
  }

  parseTurabian(citation) {
    // Turabian parsing logic (similar to Chicago)
    return this.parseChicago(citation);
  }

  formatCitation(data, format) {
    switch (format.toLowerCase()) {
      case 'apa':
        return this.formatAPA(data);
      case 'mla':
        return this.formatMLA(data);
      case 'chicago':
        return this.formatChicago(data);
      case 'ieee':
        return this.formatIEEE(data);
      case 'harvard':
        return this.formatHarvard(data);
      case 'vancouver':
        return this.formatVancouver(data);
      case 'turabian':
        return this.formatTurabian(data);
      default:
        throw new Error(`Unsupported target format: ${format}`);
    }
  }

  formatAPA(data) {
    if (!data.authors || !data.title || !data.year) {
      throw new Error('Insufficient data for APA format');
    }

    let citation = '';
    
    // Format authors
    if (data.authors.length === 1) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}`;
    } else if (data.authors.length === 2) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}, & ${data.authors[1][0]}, ${data.authors[1][1] ? data.authors[1][1][0] + '.' : ''}`;
    } else {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}, et al.`;
    }

    citation += ` (${data.year}). ${data.title}.`;
    
    if (data.type === 'journal' && data.journal) {
      citation += ` ${data.journal}`;
      if (data.volume) {
        citation += `, ${data.volume}`;
        if (data.issue) {
          citation += `(${data.issue})`;
        }
      }
      if (data.pages) {
        citation += `, ${data.pages}`;
      }
      citation += '.';
    } else if (data.publisher) {
      citation += ` ${data.publisher}.`;
    }

    return citation;
  }

  formatMLA(data) {
    if (!data.authors || !data.title || !data.year) {
      throw new Error('Insufficient data for MLA format');
    }

    let citation = '';
    
    // Format authors
    if (data.authors.length === 1) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}`;
    } else if (data.authors.length === 2) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}, and ${data.authors[1][0]}, ${data.authors[1][1] ? data.authors[1][1] : ''}`;
    } else {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}, et al.`;
    }

    citation += ` ${data.title}.`;
    
    if (data.type === 'journal' && data.journal) {
      citation += ` ${data.journal},`;
      if (data.volume) {
        citation += ` vol. ${data.volume}`;
        if (data.issue) {
          citation += `, no. ${data.issue}`;
        }
      }
      citation += `, ${data.year}`;
      if (data.pages) {
        citation += `, pp. ${data.pages}`;
      }
      citation += '.';
    } else {
      citation += ` ${data.publisher}, ${data.year}.`;
    }

    return citation;
  }

  formatChicago(data) {
    if (!data.authors || !data.title || !data.year) {
      throw new Error('Insufficient data for Chicago format');
    }

    let citation = '';
    
    // Format authors
    if (data.authors.length === 1) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}`;
    } else if (data.authors.length === 2) {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}, and ${data.authors[1][0]}, ${data.authors[1][1] ? data.authors[1][1] : ''}`;
    } else {
      citation += `${data.authors[0][0]}, ${data.authors[0][1] ? data.authors[0][1] : ''}, et al.`;
    }

    citation += ` ${data.title}.`;
    
    if (data.type === 'journal' && data.journal) {
      citation += ` ${data.journal}`;
      if (data.volume) {
        citation += ` ${data.volume}`;
        if (data.issue) {
          citation += `, no. ${data.issue}`;
        }
      }
      citation += ` (${data.year}): ${data.pages || '1-10'}.`;
    } else {
      citation += ` ${data.publisher}, ${data.year}.`;
    }

    return citation;
  }

  formatIEEE(data) {
    if (!data.authors || !data.title || !data.year) {
      throw new Error('Insufficient data for IEEE format');
    }

    let citation = '[1] ';
    
    // Format authors
    if (data.authors.length === 1) {
      citation += `${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''} ${data.authors[0][0]}`;
    } else if (data.authors.length === 2) {
      citation += `${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''} ${data.authors[0][0]} and ${data.authors[1][1] ? data.authors[1][1][0] + '.' : ''} ${data.authors[1][0]}`;
    } else {
      citation += `${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''} ${data.authors[0][0]} et al.`;
    }

    citation += `, "${data.title}"`;
    
    if (data.type === 'journal' && data.journal) {
      citation += `, ${data.journal}`;
      if (data.volume) {
        citation += `, vol. ${data.volume}`;
        if (data.issue) {
          citation += `, no. ${data.issue}`;
        }
      }
      citation += `, pp. ${data.pages || '1-10'}, ${data.year}.`;
    } else {
      citation += `, ${data.publisher}, ${data.year}.`;
    }

    return citation;
  }

  formatHarvard(data) {
    // Harvard format is similar to APA
    return this.formatAPA(data);
  }

  formatVancouver(data) {
    if (!data.authors || !data.title || !data.year) {
      throw new Error('Insufficient data for Vancouver format');
    }

    let citation = '1. ';
    
    // Format authors
    if (data.authors.length === 1) {
      citation += `${data.authors[0][0]} ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}`;
    } else if (data.authors.length === 2) {
      citation += `${data.authors[0][0]} ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}, ${data.authors[1][0]} ${data.authors[1][1] ? data.authors[1][1][0] + '.' : ''}`;
    } else {
      citation += `${data.authors[0][0]} ${data.authors[0][1] ? data.authors[0][1][0] + '.' : ''}, et al.`;
    }

    citation += ` ${data.title}.`;
    
    if (data.type === 'journal' && data.journal) {
      citation += ` ${data.journal}`;
      if (data.volume) {
        citation += `. ${data.volume}`;
        if (data.issue) {
          citation += `(${data.issue})`;
        }
      }
      citation += `;${data.year}`;
      if (data.pages) {
        citation += `:${data.pages}`;
      }
      citation += '.';
    } else {
      citation += ` ${data.publisher}; ${data.year}.`;
    }

    return citation;
  }

  formatTurabian(data) {
    // Turabian is similar to Chicago
    return this.formatChicago(data);
  }
}

module.exports = CitationConverter;