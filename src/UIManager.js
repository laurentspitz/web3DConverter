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
        labelOptText: document.getElementById('label-opt-text'),

        // Edition
        rotateXBtn: document.getElementById('rotate-x-btn'),
        rotateYBtn: document.getElementById('rotate-y-btn'),
        rotateZBtn: document.getElementById('rotate-z-btn'),
        centerBtn: document.getElementById('center-btn'),
        groundBtn: document.getElementById('ground-btn'),
        weldCheck: document.getElementById('weld-check'),
        advancedToggleBtn: document.getElementById('advanced-toggle-btn'),
        advancedSection: document.getElementById('advanced-section'),

        // Advanced Features
        simplifyRange: document.getElementById('simplify-range'),
        simplifyValue: document.getElementById('simplify-value'),
        mirrorXBtn: document.getElementById('mirror-x-btn'),
        mirrorYBtn: document.getElementById('mirror-y-btn'),
        mirrorZBtn: document.getElementById('mirror-z-btn'),
        scaleInput: document.getElementById('scale-input'),
        scaleApplyBtn: document.getElementById('scale-apply-btn'),
        wireframeCheck: document.getElementById('wireframe-check'),
        baseColorPicker: document.getElementById('base-color-picker'),

        // Sculpting
        sculptToggleBtn: document.getElementById('sculpt-toggle-btn'),
        sculptControls: document.getElementById('sculpt-controls'),
        brushSizeRange: document.getElementById('brush-size-range'),
        brushSizeValue: document.getElementById('brush-size-value'),
        brushStrengthRange: document.getElementById('brush-strength-range'),
        brushStrengthValue: document.getElementById('brush-strength-value'),
        sculptInflateCheck: document.getElementById('sculpt-inflate-check')
    },

    currentLanguage: 'fr',
    flagMap: {
        fr: 'https://flagcdn.com/w40/fr.png',
        en: 'https://flagcdn.com/w40/us.png',
        es: 'https://flagcdn.com/w40/es.png',
        de: 'https://flagcdn.com/w40/de.png',
        it: 'https://flagcdn.com/w40/it.png',
        pt: 'https://flagcdn.com/w40/pt.png',
        nl: 'https://flagcdn.com/w40/nl.png',
        ru: 'https://flagcdn.com/w40/ru.png',
        zh: 'https://flagcdn.com/w40/cn.png',
        ja: 'https://flagcdn.com/w40/jp.png'
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
            this.elements.compressionOptions.style.display = 'flex';
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
        this.elements.weldCheck.checked = false;
        this.elements.compressCheck.checked = true;
        this.elements.simplifyRange.value = 0;
        this.elements.simplifyValue.textContent = '0%';
        this.elements.scaleInput.value = '1.0';
        this.elements.wireframeCheck.checked = false;
        this.elements.baseColorPicker.value = '#ffffff';
        this.elements.sculptToggleBtn.classList.remove('active');
        this.elements.sculptControls.classList.add('hidden-sculpt');
        this.elements.brushSizeRange.value = 20;
        this.elements.brushSizeValue.textContent = '20';
        this.elements.brushStrengthRange.value = 0.1;
        this.elements.brushStrengthValue.textContent = '0.1';
        this.elements.sculptInflateCheck.checked = true;
        this.elements.advancedSection.classList.add('hidden-section');
        this.elements.advancedToggleBtn.classList.remove('active');
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
