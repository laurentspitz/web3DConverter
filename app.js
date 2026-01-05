import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import translations from './translations.js';
import { ModelReader } from './ModelReader.js';
import { UIManager } from './UIManager.js';
import { ThreeManager } from './ThreeManager.js';
import { OptimizationManager } from './OptimizationManager.js';

// Application State
const State = {
    currentMode: 'STL_TO_GLB',
    currentLanguage: 'fr',
    currentFileName: "model",
    processedBuffer: null,
    originalSizeBytes: 0,
    originalStats: null
};

// --- Initialization ---

function init() {
    ThreeManager.init(UIManager.elements.canvasHolder);
    UIManager.initI18n((lang) => {
        State.currentLanguage = lang;
    });
    State.currentLanguage = UIManager.currentLanguage;

    setupEventListeners();
}

// --- Event Listeners ---

function setupEventListeners() {
    const { elements } = UIManager;

    // Mode selection
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            State.currentMode = card.dataset.mode;
            UIManager.setModeUI(State.currentMode);
        });
    });

    // File handling
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('drag-over');
    });
    elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('drag-over'));
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // Conversion and settings
    elements.convertBtn.addEventListener('click', runConversion);
    elements.compressCheck.addEventListener('change', () => {
        elements.compressionGroup.style.opacity = elements.compressCheck.checked ? '1' : '0.3';
        elements.compressionGroup.style.pointerEvents = elements.compressCheck.checked ? 'auto' : 'none';
    });
    elements.compressionRange.addEventListener('input', () => {
        elements.compressionValue.textContent = `${elements.compressionRange.value} bits`;
    });

    // Navigation
    elements.resetBtn.addEventListener('click', resetApp);
    elements.backToModesBtn.addEventListener('click', resetApp);

    // Download
    elements.downloadBtn.addEventListener('click', () => {
        if (!State.processedBuffer) return;
        const isDraco = elements.compressCheck.checked;
        const filename = `${State.currentFileName}${isDraco ? '.draco' : ''}.glb`;
        downloadBlob(State.processedBuffer, filename, 'model/gltf-binary');
    });

    // Comparison slider
    let isDragging = false;
    elements.sliderHandle.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = elements.canvasHolder.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width;
        x = Math.max(0, Math.min(1, x));
        elements.comparisonSlider.style.left = `${x * 100}%`;
        ThreeManager.setSliderPos(x);
    });
}

// --- Core Workflows ---

async function handleFile(file) {
    const t = translations[State.currentLanguage];
    const ext = file.name.toLowerCase().split('.').pop();

    // Validation
    if (State.currentMode === 'STL_TO_GLB' && ext !== 'stl') return alert(t.errStl);
    if (State.currentMode === 'COMPRESS_GLB' && ext !== 'glb') return alert(t.errGlb);

    UIManager.showLoader(t.loaderReading);
    State.currentFileName = file.name.replace(/\.[^/.]+$/, "");
    State.originalSizeBytes = file.size;

    const reader = new FileReader();
    reader.onload = async (e) => {
        UIManager.showLoader(t.loaderGenerating);
        try {
            const buffer = e.target.result;
            const result = (ext === 'stl')
                ? await ModelReader.loadSTL(buffer)
                : await ModelReader.loadGLB(buffer, 'original');

            State.originalStats = result.stats;
            ThreeManager.setModel(result.model, result.normalization);

            // Update initial stats display
            UIManager.elements.vertCount.textContent = result.stats.vertices.toLocaleString();
            UIManager.elements.faceCount.textContent = result.stats.faces.toLocaleString();

            UIManager.showConverterUI();
            setTimeout(() => ThreeManager.resize(UIManager.elements.canvasHolder), 50);

        } catch (err) {
            console.error(err);
            alert((ext === 'stl' ? t.errLoadStl : t.errLoadGlb) + err.message);
        } finally {
            UIManager.hideLoader();
        }
    };
    reader.readAsArrayBuffer(file);
}

async function runConversion() {
    if (!ThreeManager.originalModel) return;
    const t = translations[State.currentLanguage];
    const { elements } = UIManager;

    UIManager.showLoader(t.loaderOptimizing);

    try {
        // 1. Export current model to GLB buffer
        const exporter = new GLTFExporter();
        const exportObj = ThreeManager.originalModel.clone();
        const glbBuffer = await new Promise((resolve, reject) => {
            exporter.parse(exportObj, resolve, reject, { binary: true });
        });

        State.processedBuffer = glbBuffer;

        // 2. Apply Draco if selected
        if (elements.compressCheck.checked) {
            const bits = parseInt(elements.compressionRange.value);
            UIManager.showLoader(`${t.settingsDraco} (${bits} bits)...`);
            State.processedBuffer = await OptimizationManager.applyDracoCompression(glbBuffer, bits);
        }

        // 3. Load optimized preview
        UIManager.showLoader(t.loaderLoading);
        const previewResult = await ModelReader.loadGLB(State.processedBuffer, 'optimized');
        ThreeManager.setOptimizedModel(previewResult.model);

        // 4. Update UI with results
        const finalSize = State.processedBuffer.byteLength;
        const reduction = Math.round((1 - finalSize / State.originalSizeBytes) * 100);

        UIManager.showResults(
            UIManager.formatBytes(State.originalSizeBytes),
            UIManager.formatBytes(finalSize),
            reduction,
            {
                vertices: State.originalStats.vertices.toLocaleString(),
                faces: State.originalStats.faces.toLocaleString()
            },
            {
                vertices: previewResult.stats.vertices.toLocaleString(),
                faces: previewResult.stats.faces.toLocaleString()
            }
        );

    } catch (err) {
        console.error("Conversion Error:", err);
        alert((State.currentLanguage === 'fr' ? "Erreur : " : "Error: ") + err.message);
    } finally {
        UIManager.hideLoader();
    }
}

function resetApp() {
    ThreeManager.clearModels();
    UIManager.resetUI();
}

function downloadBlob(buffer, filename, type) {
    const blob = new Blob([buffer], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Start the app
init();
