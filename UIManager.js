import translations from './translations.js';

export const UIManager = {
    // DOM Elements
    elements: {
        modeSelection: document.getElementById('mode-selection'),
        converterSection: document.getElementById('converter-section'),
        dropZone: document.getElementById('drop-zone'),
        dropText: document.getElementById('drop-text'),
        fileInput: document.getElementById('file-input'),
        previewContainer: document.getElementById('preview-container'),
        convertBtn: document.getElementById('convert-btn'),
        downloadBtn: document.getElementById('download-btn'),
        resetBtn: document.getElementById('reset-btn'),
        backToModesBtn: document.getElementById('back-to-modes'),
        resultsPanel: document.getElementById('results-panel'),
        originalSizeText: document.getElementById('original-size'),
        finalSizeText: document.getElementById('final-size'),
        reductionBadge: document.getElementById('reduction-badge'),
        compressCheck: document.getElementById('compress-check'),
        vertCount: document.getElementById('vert-count'),
        faceCount: document.getElementById('face-count'),
        loaderOverlay: document.getElementById('loader'),
        loaderText: document.querySelector('#loader p'),
        compressionRange: document.getElementById('compression-range'),
        compressionValue: document.getElementById('compression-value'),
        compressionGroup: document.getElementById('compression-level-group'),
        controls: document.getElementById('controls'),
        origVertCountRes: document.getElementById('orig-vert-count-res'),
        optVertCountRes: document.getElementById('opt-vert-count-res'),
        origFaceCountRes: document.getElementById('orig-face-count-res'),
        optFaceCountRes: document.getElementById('opt-face-count-res'),
        comparisonSlider: document.getElementById('comparison-slider'),
        sliderHandle: document.getElementById('comparison-slider').querySelector('.slider-handle'),
        previewLabels: document.querySelector('.preview-labels'),
        canvasHolder: document.getElementById('canvas-holder'),
        langDropdown: document.getElementById('lang-dropdown'),
        currentLangLabel: document.getElementById('current-lang-label'),
        currentFlagImg: document.getElementById('current-flag-img')
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

    setModeUI(mode) {
        this.elements.modeSelection.classList.add('hidden');
        this.elements.converterSection.classList.remove('hidden');

        if (mode === 'STL_TO_GLB') {
            this.elements.dropText.dataset.i18n = "dropTextStl";
            this.elements.fileInput.accept = ".stl";
        } else {
            this.elements.dropText.dataset.i18n = "dropTextGlb";
            this.elements.fileInput.accept = ".glb";
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
        this.elements.previewLabels.classList.add('hidden');
        this.elements.convertBtn.classList.remove('hidden');
    },

    showResults(originalSize, finalSize, reduction, origStats, optStats) {
        this.elements.originalSizeText.textContent = originalSize;
        this.elements.finalSizeText.textContent = finalSize;
        this.elements.reductionBadge.textContent = `-${reduction}%`;

        this.elements.origVertCountRes.textContent = origStats.vertices;
        this.elements.origFaceCountRes.textContent = origStats.faces;
        this.elements.optVertCountRes.textContent = optStats.vertices;
        this.elements.optFaceCountRes.textContent = optStats.faces;

        this.elements.resultsPanel.classList.remove('hidden');
        this.elements.downloadBtn.classList.remove('hidden');
        this.elements.comparisonSlider.classList.remove('hidden');
        this.elements.previewLabels.classList.remove('hidden');
        this.updateUI(true);
    },

    resetUI() {
        this.elements.modeSelection.classList.remove('hidden');
        this.elements.converterSection.classList.add('hidden');
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
        this.elements.optFaceCountRes.textContent = '-';
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
