class CitationConverterApp {
    constructor() {
        this.apiBase = '/api';
        this.citations = [];
        this.results = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUI();
    }

    initializeElements() {
        // Main elements
        this.fromFormatSelect = document.getElementById('fromFormat');
        this.toFormatSelect = document.getElementById('toFormat');
        this.citationInput = document.getElementById('citationInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.exampleBtn = document.getElementById('exampleBtn');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Format detector elements
        this.formatDetectorBtn = document.getElementById('formatDetectorBtn');
        this.formatDetectorModal = document.getElementById('formatDetectorModal');
        this.closeDetectorModal = document.getElementById('closeDetectorModal');
        this.cancelDetector = document.getElementById('cancelDetector');
        this.detectorInput = document.getElementById('detectorInput');
        this.detectFormatBtn = document.getElementById('detectFormat');
        this.detectorResult = document.getElementById('detectorResult');
        this.detectedFormat = document.getElementById('detectedFormat');
        this.confidence = document.getElementById('confidence');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Character and citation counters
        this.charCount = document.getElementById('charCount');
        this.citationCount = document.getElementById('citationCount');
    }

    attachEventListeners() {
        // Format selection changes
        this.fromFormatSelect.addEventListener('change', () => this.updateUI());
        this.toFormatSelect.addEventListener('change', () => this.updateUI());
        
        // Citation input changes
        this.citationInput.addEventListener('input', () => this.updateCounters());
        this.citationInput.addEventListener('input', () => this.updateUI());
        
        // Button clicks
        this.convertBtn.addEventListener('click', () => this.convertCitations());
        this.clearBtn.addEventListener('click', () => this.clearInput());
        this.exampleBtn.addEventListener('click', () => this.loadExample());
        this.copyAllBtn.addEventListener('click', () => this.copyAllResults());
        this.downloadBtn.addEventListener('click', () => this.downloadResults());
        
        // Format detector
        this.formatDetectorBtn.addEventListener('click', () => this.showFormatDetector());
        this.closeDetectorModal.addEventListener('click', () => this.hideFormatDetector());
        this.cancelDetector.addEventListener('click', () => this.hideFormatDetector());
        this.detectFormatBtn.addEventListener('click', () => this.detectFormat());
        
        // Modal backdrop click
        this.formatDetectorModal.addEventListener('click', (e) => {
            if (e.target === this.formatDetectorModal) {
                this.hideFormatDetector();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.convertBtn.disabled === false) {
                            this.convertCitations();
                        }
                        break;
                    case 'k':
                        e.preventDefault();
                        this.showFormatDetector();
                        break;
                }
            }
        });
    }

    updateCounters() {
        const text = this.citationInput.value;
        const charCount = text.length;
        const citationCount = text.split('\n').filter(line => line.trim().length > 0).length;
        
        this.charCount.textContent = `${charCount.toLocaleString()} characters`;
        this.citationCount.textContent = `${citationCount} citations`;
    }

    updateUI() {
        const hasInput = this.citationInput.value.trim().length > 0;
        const hasFromFormat = this.fromFormatSelect.value !== '';
        const hasToFormat = this.toFormatSelect.value !== '';
        const canConvert = hasInput && hasFromFormat && hasToFormat && 
                          this.fromFormatSelect.value !== this.toFormatSelect.value;
        
        this.convertBtn.disabled = !canConvert;
        
        // Update convert button text
        if (!hasInput) {
            this.convertBtn.textContent = 'Enter citations to convert';
        } else if (!hasFromFormat) {
            this.convertBtn.textContent = 'Select source format';
        } else if (!hasToFormat) {
            this.convertBtn.textContent = 'Select target format';
        } else if (this.fromFormatSelect.value === this.toFormatSelect.value) {
            this.convertBtn.textContent = 'Select different formats';
        } else {
            this.convertBtn.textContent = 'Convert Citations';
        }
    }

    async convertCitations() {
        if (this.convertBtn.disabled) return;
        
        const citations = this.citationInput.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (citations.length === 0) {
            this.showNotification('Please enter at least one citation', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBase}/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    citations,
                    fromFormat: this.fromFormatSelect.value,
                    toFormat: this.toFormatSelect.value
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed');
            }
            
            this.results = data.results;
            this.displayResults(data.results);
            this.showNotification(`Successfully converted ${data.metadata.converted} citations`, 'success');
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showNotification(`Conversion failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(results) {
        this.resultsContent.innerHTML = '';
        
        if (results.length === 0) {
            this.resultsContent.innerHTML = '<p class="text-center">No results to display</p>';
            this.resultsSection.style.display = 'block';
            return;
        }
        
        results.forEach((result, index) => {
            const resultElement = this.createResultElement(result, index);
            this.resultsContent.appendChild(resultElement);
        });
        
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    createResultElement(result, index) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `result-item ${result.success ? 'success' : 'error'} fade-in`;
        
        let content = `
            <div class="result-original">
                <div class="result-original-label">Original Citation</div>
                <div class="result-original-text">${this.escapeHtml(result.original)}</div>
            </div>
        `;
        
        if (result.success) {
            content += `
                <div class="result-converted">
                    <div class="result-converted-label">Converted Citation</div>
                    <div class="result-converted-text">${this.escapeHtml(result.converted)}</div>
                </div>
                <div class="result-actions">
                    <button class="result-copy" onclick="app.copyResult(${index})">Copy</button>
                </div>
            `;
        } else {
            content += `
                <div class="result-error">
                    <strong>Error:</strong> ${this.escapeHtml(result.error)}
                </div>
            `;
        }
        
        resultDiv.innerHTML = content;
        return resultDiv;
    }

    copyResult(index) {
        const result = this.results[index];
        if (result && result.success) {
            navigator.clipboard.writeText(result.converted).then(() => {
                this.showNotification('Citation copied to clipboard', 'success');
            }).catch(() => {
                this.showNotification('Failed to copy citation', 'error');
            });
        }
    }

    async copyAllResults() {
        const successfulResults = this.results.filter(r => r.success);
        if (successfulResults.length === 0) {
            this.showNotification('No successful conversions to copy', 'error');
            return;
        }
        
        const text = successfulResults.map(r => r.converted).join('\n\n');
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(`Copied ${successfulResults.length} citations to clipboard`, 'success');
        } catch (error) {
            this.showNotification('Failed to copy citations', 'error');
        }
    }

    downloadResults() {
        const successfulResults = this.results.filter(r => r.success);
        if (successfulResults.length === 0) {
            this.showNotification('No successful conversions to download', 'error');
            return;
        }
        
        const content = successfulResults.map(r => r.converted).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `citations_${this.fromFormatSelect.value}_to_${this.toFormatSelect.value}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`Downloaded ${successfulResults.length} citations`, 'success');
    }

    clearInput() {
        this.citationInput.value = '';
        this.updateCounters();
        this.updateUI();
        this.resultsSection.style.display = 'none';
        this.results = [];
    }

    loadExample() {
        const examples = {
            apa: `Smith, J. A. (2023). The future of academic writing in the digital age. Journal of Educational Technology, 45(3), 123-145. https://doi.org/10.1000/example`,
            mla: `Smith, John A. "The Future of Academic Writing in the Digital Age." Journal of Educational Technology, vol. 45, no. 3, 2023, pp. 123-145.`,
            chicago: `Smith, John A. "The Future of Academic Writing in the Digital Age." Journal of Educational Technology 45, no. 3 (2023): 123-145.`,
            ieee: `[1] J. A. Smith, "The future of academic writing in the digital age," Journal of Educational Technology, vol. 45, no. 3, pp. 123-145, Mar. 2023.`,
            harvard: `Smith, J.A. (2023) The future of academic writing in the digital age. Journal of Educational Technology, 45(3), pp. 123-145.`,
            vancouver: `1. Smith JA. The future of academic writing in the digital age. J Educ Technol. 2023;45(3):123-145.`
        };
        
        const selectedFormat = this.fromFormatSelect.value || 'apa';
        this.citationInput.value = examples[selectedFormat] || examples.apa;
        this.updateCounters();
        this.updateUI();
    }

    showFormatDetector() {
        this.formatDetectorModal.classList.add('show');
        this.detectorInput.focus();
        this.detectorResult.style.display = 'none';
    }

    hideFormatDetector() {
        this.formatDetectorModal.classList.remove('show');
        this.detectorInput.value = '';
        this.detectorResult.style.display = 'none';
    }

    async detectFormat() {
        const citation = this.detectorInput.value.trim();
        if (!citation) {
            this.showNotification('Please enter a citation to detect', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/detect-format`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ citation })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Detection failed');
            }
            
            this.detectedFormat.textContent = data.detectedFormat.format.toUpperCase();
            this.confidence.textContent = `${Math.round(data.confidence * 100)}% confidence`;
            this.detectorResult.style.display = 'block';
            
            // Auto-fill the format selector if detection is confident
            if (data.confidence > 0.7) {
                this.fromFormatSelect.value = data.detectedFormat.format;
                this.updateUI();
            }
            
        } catch (error) {
            console.error('Detection error:', error);
            this.showNotification(`Detection failed: ${error.message}`, 'error');
        }
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-up`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '3000',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#4299e1',
            warning: '#ed8936'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CitationConverterApp();
});

// Export for global access
window.CitationConverterApp = CitationConverterApp;