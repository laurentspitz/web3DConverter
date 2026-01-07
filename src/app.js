import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter';
import translations from './translations.js';
import { ModelReader } from './ModelReader.js';
import { UIManager } from './UIManager.js';
import { ThreeManager } from './ThreeManager.js';
import { OptimizationManager } from './OptimizationManager.js';

// Application State
const State = {
    inputFormat: null, // 'stl', 'obj', 'glb', 'ply'
    targetFormat: 'glb',
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

    // Generic file input accept
    elements.fileInput.accept = ".stl,.obj,.glb,.ply,.fbx,.3mf";

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

    // Navigation
    elements.resetBtn.addEventListener('click', resetApp);


    elements.downloadBtn.addEventListener('click', () => {
        if (!State.processedBuffer) return;
        const ext = `.${State.targetFormat}`;
        const isDraco = State.targetFormat === 'glb' && elements.compressCheck.checked;
        const filename = `${State.currentFileName}${isDraco ? '.draco' : ''}${ext}`;
        const mimeMap = {
            glb: 'model/gltf-binary',
            stl: 'application/sla',
            obj: 'text/plain',
            ply: 'application/octet-stream',
            usdz: 'model/vnd.usdz+zip'
        };
        downloadBlob(State.processedBuffer, filename, mimeMap[State.targetFormat] || 'application/octet-stream');
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
    const validInputs = ['stl', 'obj', 'glb', 'ply', 'fbx', '3mf'];

    if (!validInputs.includes(ext)) {
        return alert(State.currentLanguage === 'fr' ? "Format non supporté" : "Unsupported format");
    }

    State.inputFormat = ext;
    State.currentFileName = file.name.replace(/\.[^/.]+$/, "");
    State.originalSizeBytes = file.size;

    UIManager.showLoader(t.loaderReading);

    const reader = new FileReader();
    reader.onload = async (e) => {
        UIManager.showLoader(t.loaderGenerating);
        try {
            const buffer = e.target.result;
            let result;
            if (ext === 'stl') result = await ModelReader.loadSTL(buffer);
            else if (ext === 'obj') result = await ModelReader.loadOBJ(buffer);
            else if (ext === 'ply') result = await ModelReader.loadPLY(buffer);
            else if (ext === 'fbx') result = await ModelReader.loadFBX(buffer);
            else if (ext === '3mf') result = await ModelReader.load3MF(buffer);
            else result = await ModelReader.loadGLB(buffer, 'original');

            State.originalStats = result.stats;
            State.normalization = result.normalization;
            ThreeManager.setModel(result.model, result.normalization);

            // Update initial stats display
            UIManager.elements.vertCount.textContent = result.stats.vertices.toLocaleString();
            UIManager.elements.faceCount.textContent = result.stats.faces.toLocaleString();

            // Set up target formats based on input
            let availableTargets = ['glb', 'stl', 'obj', 'ply', 'usdz'];
            // If input is same as target, it's an "Optimize" or "Re-save" operation
            State.targetFormat = 'glb';

            UIManager.setAvailableFormats(availableTargets, State.targetFormat, (newTarget) => {
                State.targetFormat = newTarget;
                // Hide results if we switch target format to avoid confusion
                UIManager.elements.resultsPanel.classList.add('hidden');
                UIManager.elements.downloadBtn.classList.add('hidden');
                UIManager.updateOptionsVisibility(State.inputFormat, State.targetFormat, State.currentFileName);
            });
            UIManager.updateOptionsVisibility(State.inputFormat, State.targetFormat, State.currentFileName);

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
        if (State.targetFormat !== 'glb') {
            const format = State.targetFormat;
            UIManager.showLoader(t.loaderOptimizing);

            // 1. Clone and Restore original scale
            const exportObj = ThreeManager.originalModel.clone();
            // Ensure no leftover preview transforms from parents
            exportObj.scale.set(1, 1, 1);
            exportObj.position.set(0, 0, 0);
            exportObj.rotation.set(0, 0, 0);
            exportObj.updateMatrixWorld(true);

            // 2. Compute center of the original model (at scale 1.0)
            const box = new THREE.Box3().setFromObject(exportObj);
            const center = box.getCenter(new THREE.Vector3());

            // 3. Setup Export Wrapper for Orientation/Centering
            // This is safer than baking geometry as it preserves model integrity
            const wrapper = new THREE.Object3D();
            wrapper.add(exportObj);

            // Move model within wrapper so it's centered at origin
            exportObj.position.copy(center).multiplyScalar(-1);

            // Standards: GLB/OBJ are Y-up. STL is usually Z-up.
            if (format === 'stl' && State.inputFormat !== 'stl') {
                wrapper.rotation.x = Math.PI / 2;
            }
            wrapper.updateMatrixWorld(true);

            State.processedBuffer = null;
            let previewResult;

            if (format === 'stl') {
                const exporter = new STLExporter();
                const stlData = exporter.parse(wrapper, { binary: true });
                // DataView safety: get the exact buffer slice
                State.processedBuffer = stlData.buffer.slice(stlData.byteOffset, stlData.byteOffset + stlData.byteLength);

                UIManager.showLoader(t.loaderLoading);
                previewResult = await ModelReader.loadSTL(State.processedBuffer, true);

                // Position for preview (normalized space)
                previewResult.model.position.copy(center);
                previewResult.model.rotation.x = -Math.PI / 2;
            } else if (format === 'obj') {
                const exporter = new OBJExporter();
                const objData = exporter.parse(wrapper);
                State.processedBuffer = new TextEncoder().encode(objData).buffer;
                UIManager.showLoader(t.loaderLoading);
                previewResult = await ModelReader.loadOBJ(State.processedBuffer, true);
                previewResult.model.position.copy(center);
            } else if (format === 'ply') {
                const exporter = new PLYExporter();
                const plyData = exporter.parse(wrapper, () => { }, { binary: true });
                State.processedBuffer = plyData;
                UIManager.showLoader(t.loaderLoading);
                previewResult = await ModelReader.loadPLY(State.processedBuffer, true);
                previewResult.model.position.copy(center);
            } else if (format === 'usdz') {
                const exporter = new USDZExporter();
                const usdzData = await exporter.parse(wrapper);
                State.processedBuffer = usdzData;
                // Special case: we can't easily "preview" USDZ back in Three.js without a specific loader 
                // (which doesn't exist officially in Three.js examples).
                // So we'll use the GLB preview for USDZ since it's the closest representation.
                UIManager.showLoader(t.loaderLoading);
                previewResult = await ModelReader.loadGLB(await new Promise((res, rej) => {
                    new GLTFExporter().parse(exportObj, res, rej, { binary: true });
                }), 'optimized');
                previewResult.model.position.copy(center);
            }

            previewResult.model.updateMatrixWorld(true);
            ThreeManager.setResultModel(previewResult.model);

            if (State.processedBuffer) {
                completeResults(State.processedBuffer.byteLength, previewResult.stats);
            }
        } else {
            // Target is GLB (Convert or Compress)
            const exporter = new GLTFExporter();
            const exportObj = ThreeManager.originalModel.clone();
            const glbBuffer = await new Promise((resolve, reject) => {
                exporter.parse(exportObj, resolve, reject, { binary: true });
            });

            State.processedBuffer = glbBuffer;

            if (elements.compressCheck.checked) {
                const bits = 11; // Optimization: Fixed 11-bit quantization for best compatibility/size
                UIManager.showLoader(`${t.settingsDraco} (${bits} bits)...`);
                State.processedBuffer = await OptimizationManager.applyDracoCompression(glbBuffer, bits);
            }

            UIManager.showLoader(t.loaderLoading);
            const previewResult = await ModelReader.loadGLB(State.processedBuffer, 'optimized');
            ThreeManager.setResultModel(previewResult.model);

            if (State.processedBuffer) {
                completeResults(State.processedBuffer.byteLength, previewResult.stats);
            }
        }
    } catch (err) {
        console.error("Conversion Error:", err);
        alert((State.currentLanguage === 'fr' ? "Erreur : " : "Error: ") + err.message);
    } finally {
        UIManager.hideLoader();
    }
}

function completeResults(finalSize, resStats) {
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
            vertices: resStats.vertices.toLocaleString(),
            faces: resStats.faces.toLocaleString()
        }
    );
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
