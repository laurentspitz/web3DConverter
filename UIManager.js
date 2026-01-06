import translations from './translations.js';

export const UIManager = {
    // DOM Elements
    elements: {
        converterSection: document.getElementById('converter-section'),
        dropZone: document.getElementById('drop-zone'),
        dropText: document.getElementById('drop-text'),
        fileInput: document.getElementById('file-input'),
        previewContainer: document.getElementById('preview-container'),
        convertBtn: document.getElementById('convert-btn'),
        downloadBtn: document.getElementById('download-btn'),
        resetBtn: document.getElementById('reset-btn'),

        resultsPanel: document.getElementById('results-panel'),
        originalSizeText: document.getElementById('original-size'),
        finalSizeText: document.getElementById('final-size'),
        reductionBadge: document.getElementById('reduction-badge'),
        compressCheck: document.getElementById('compress-check'),
        vertCount: document.getElementById('vert-count'),
        faceCount: document.getElementById('face-count'),
        loaderOverlay: document.getElementById('loader'),
        loaderText: document.querySelector('#loader p'),
        compressionOptions: document.getElementById('compression-options'),
        controls: document.getElementById('controls'),
        origVertCountRes: document.getElementById('orig-vert-count-res'),
        optVertCountRes: document.getElementById('opt-vert-count-res'),
        origFaceCountRes: document.getElementById('orig-face-count-res'),
        resFaceCountRes: document.getElementById('opt-face-count-res'),
        comparisonSlider: document.getElementById('comparison-slider'),
        sliderHandle: document.getElementById('comparison-slider').querySelector('.slider-handle'),
        previewLabels: document.querySelector('.preview-labels'),
        canvasHolder: document.getElementById('canvas-holder'),
        langDropdown: document.getElementById('lang-dropdown'),
        currentLangLabel: document.getElementById('current-lang-label'),
        currentFlagImg: document.getElementById('current-flag-img'),
        formatSelection: document.getElementById('format-selection'),
        targetFormatGroup: document.getElementById('target-format-group'),
        labelOrigText: document.getElementById('label-orig-text'),
        labelOptText: document.getElementById('label-opt-text')
    },

    currentLanguage: 'fr',
    flagMap: {
        fr: 'https://flagcdn.com/w40/fr.png',
        en: 'https://flagcdn.com/w40/us.png',
        es: 'https://flagcdn.com/w40/es.png',
        de: 'https://flagcdn.com/w40/de.png',
        it: 'https://flagcdn.com/w40/it.png'
    },

    initI18n(onLanguageChange) {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            this.currentLanguage = browserLang;
        }

        const { langDropdown, dropdownOptions } = {
            langDropdown: this.elements.langDropdown,
            dropdownOptions: this.elements.langDropdown.querySelector('.dropdown-options')
        };

        // Toggle dropdown
        langDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownOptions.classList.toggle('hidden');
        });

        // Close on click outside
        window.addEventListener('click', () => {
            dropdownOptions.classList.add('hidden');
        });

        // Option selection
        langDropdown.querySelectorAll('.option').forEach(opt => {
            opt.addEventListener('click', () => {
                this.currentLanguage = opt.dataset.value;
                this.updateCustomUI();
                this.updateUI();
                if (onLanguageChange) onLanguageChange(this.currentLanguage);
            });
        });

        this.updateCustomUI();
        this.updateUI();
    },

    updateCustomUI() {
        this.elements.currentLangLabel.textContent = this.currentLanguage.toUpperCase();
        this.elements.currentFlagImg.src = this.flagMap[this.currentLanguage];
    },

    updateUI(isResultVisible = false) {
        const t = translations[this.currentLanguage];
        if (!t) return;

        document.title = t.title;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                if (key === 'headerTitle') {
                    el.innerHTML = t[key];
                } else {
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = t[key];
                    } else {
                        el.textContent = t[key];
                    }
                }
            }
        });

        // Special case for update button
        if (isResultVisible || !this.elements.resultsPanel.classList.contains('hidden')) {
            const btnSpan = this.elements.convertBtn.querySelector('span');
            if (btnSpan) btnSpan.textContent = t.btnUpdate;
        }
    },

    showLoader(text) {
        this.elements.loaderText.textContent = text;
        this.elements.loaderOverlay.classList.remove('hidden');
    },

    hideLoader() {
        this.elements.loaderOverlay.classList.add('hidden');
    },

    setAvailableFormats(formats, currentTarget, onFormatChange) {
        this.elements.formatSelection.innerHTML = '';
        formats.forEach(fmt => {
            const btn = document.createElement('button');
            btn.className = `format-btn ${fmt === currentTarget ? 'active' : ''}`;
            btn.dataset.format = fmt;
            btn.textContent = fmt.toUpperCase();
            btn.addEventListener('click', () => {
                this.elements.formatSelection.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (onFormatChange) onFormatChange(fmt);
            });
            this.elements.formatSelection.appendChild(btn);
        });

        // Show/Hide target format group based on number of options
        if (formats.length > 0) {
            this.elements.targetFormatGroup.classList.remove('hidden');
        } else {
            this.elements.targetFormatGroup.classList.add('hidden');
        }
    },

    updateOptionsVisibility(inputExt, targetFormat, fileName = "model") {
        const t = translations[this.currentLanguage];

        // Update labels with format info and file names
        if (this.elements.labelOrigText) {
            const origLabelBase = t.originalLabel || 'Original';
            this.elements.labelOrigText.textContent = `${origLabelBase} ${inputExt.toUpperCase()} : ${fileName}`;
        }
        if (this.elements.labelOptText) {
            const resultLabelBase = t.resultLabel || 'Optimisé';
            this.elements.labelOptText.textContent = `${resultLabelBase} ${targetFormat.toUpperCase()} : ${fileName}`;
        }

        // Draco only for GLB output
        if (targetFormat === 'glb') {
            this.elements.compressionOptions.style.display = 'block';
        } else {
            this.elements.compressionOptions.style.display = 'none';
        }

        // Update download button text
        const dlSpan = this.elements.downloadBtn.querySelector('span');
        if (dlSpan) {
            if (targetFormat === 'stl') dlSpan.dataset.i18n = "btnDownloadStl";
            else if (targetFormat === 'obj') dlSpan.dataset.i18n = "btnDownloadObj";
            else if (targetFormat === 'ply') dlSpan.dataset.i18n = "btnDownloadPly";
            else if (targetFormat === 'usdz') dlSpan.dataset.i18n = "btnDownloadUsdz";
            else dlSpan.dataset.i18n = "btnDownload";
        }
        this.updateUI();
    },

    showConverterUI() {
        this.elements.dropZone.classList.add('hidden');
        this.elements.previewContainer.classList.remove('hidden');
        this.elements.controls.classList.remove('hidden');
        this.elements.resultsPanel.classList.add('hidden');
        this.elements.downloadBtn.classList.add('hidden');
        this.elements.comparisonSlider.classList.add('hidden');
        this.elements.previewLabels.classList.remove('hidden');
        if (this.elements.labelOptText) this.elements.labelOptText.classList.add('hidden');
        this.elements.convertBtn.classList.remove('hidden');
    },

    showResults(originalSize, finalSize, reduction, origStats, resStats) {
        this.elements.originalSizeText.textContent = originalSize;
        this.elements.finalSizeText.textContent = finalSize;
        const sign = reduction >= 0 ? '-' : '+';
        const absReduction = Math.abs(reduction);
        this.elements.reductionBadge.textContent = `${sign}${absReduction}%`;

        // Optional: change badge color if size increased
        if (reduction < 0) {
            this.elements.reductionBadge.style.background = 'rgba(255, 71, 87, 0.2)'; // Soft red
            this.elements.reductionBadge.style.color = '#ff4757';
        } else {
            this.elements.reductionBadge.style.background = ''; // Reset to CSS default
            this.elements.reductionBadge.style.color = '';
        }

        this.elements.origVertCountRes.textContent = origStats.vertices;
        this.elements.origFaceCountRes.textContent = origStats.faces;
        this.elements.optVertCountRes.textContent = resStats.vertices;
        this.elements.resFaceCountRes.textContent = resStats.faces;

        this.elements.resultsPanel.classList.remove('hidden');
        this.elements.downloadBtn.classList.remove('hidden');
        this.elements.comparisonSlider.classList.remove('hidden');
        this.elements.previewLabels.classList.remove('hidden');
        if (this.elements.labelOptText) this.elements.labelOptText.classList.remove('hidden');
        this.updateUI(true);
    },

    resetUI() {
        this.elements.dropZone.classList.remove('hidden');
        this.elements.previewContainer.classList.add('hidden');
        this.elements.controls.classList.add('hidden');
        this.elements.downloadBtn.classList.add('hidden');
        this.elements.comparisonSlider.classList.add('hidden');
        this.elements.previewLabels.classList.add('hidden');
        this.elements.resultsPanel.classList.add('hidden');

        this.elements.fileInput.value = '';
        this.elements.origVertCountRes.textContent = '-';
        this.elements.optVertCountRes.textContent = '-';
        this.elements.origFaceCountRes.textContent = '-';
        this.elements.resFaceCountRes.textContent = '-';
        this.updateUI();
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};
