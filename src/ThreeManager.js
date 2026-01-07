import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const ThreeManager = {
    scene: null,
    camera: null,
    renderer: null,
    orbitControls: null,
    modelGroup: null,
    pivotGroup: null,

    isComparing: false,
    sliderPos: 0.5,
    originalModel: null,
    resultModel: null,

    init(canvasHolder) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        this.modelGroup = new THREE.Group();
        this.pivotGroup = new THREE.Group();
        this.modelGroup.add(this.pivotGroup);
        this.scene.add(this.modelGroup);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        canvasHolder.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        this.camera.position.set(0, 0, 5);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        this.animate();
        window.addEventListener('resize', () => this.resize(canvasHolder));
        this.resize(canvasHolder);
    },

    resize(canvasHolder) {
        const rect = canvasHolder.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.camera.aspect = rect.width / rect.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(rect.width, rect.height);
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.orbitControls.update();

        if (this.isComparing && this.originalModel && this.resultModel) {
            const width = this.renderer.domElement.clientWidth;
            const height = this.renderer.domElement.clientHeight;
            const sliderX = this.sliderPos * width;

            this.renderer.setScissorTest(true);

            // 1. Render Original (Left side)
            this.originalModel.visible = true;
            this.resultModel.visible = false;
            this.renderer.setScissor(0, 0, sliderX, height);
            this.renderer.setViewport(0, 0, width, height);
            this.renderer.render(this.scene, this.camera);

            // 2. Render Result (Right side)
            this.originalModel.visible = false;
            this.resultModel.visible = true;
            this.renderer.setScissor(sliderX, 0, width - sliderX, height);
            this.renderer.setViewport(0, 0, width, height);
            this.renderer.render(this.scene, this.camera);

            this.renderer.setScissorTest(false);
            this.originalModel.visible = true;
            this.resultModel.visible = true;
        } else {
            this.renderer.setScissorTest(false);
            if (this.originalModel) this.originalModel.visible = true;
            if (this.resultModel) this.resultModel.visible = true;
            this.renderer.render(this.scene, this.camera);
        }
    },

    setModel(model, normalization) {
        this.clearModels();
        this.originalModel = model;

        // Apply normalization
        const { center, scale } = normalization;
        this.pivotGroup.position.copy(center).multiplyScalar(-1);
        this.modelGroup.scale.setScalar(scale);

        this.pivotGroup.add(this.originalModel);

        this.camera.position.set(0, 0, 5);
        this.orbitControls.reset();
    },

    setResultModel(model) {
        if (this.resultModel && this.resultModel.parent) {
            this.resultModel.parent.remove(this.resultModel);
        }
        this.resultModel = model;
        this.pivotGroup.add(this.resultModel);
        this.isComparing = true;
    },

    clearModels() {
        this.pivotGroup.clear();
        this.modelGroup.position.set(0, 0, 0);
        this.modelGroup.scale.setScalar(1);
        this.modelGroup.rotation.set(0, 0, 0);
        this.pivotGroup.position.set(0, 0, 0);
        this.pivotGroup.rotation.set(0, 0, 0);

        this.originalModel = null;
        this.resultModel = null;
        this.isComparing = false;
    },

    setSliderPos(pos) {
        this.sliderPos = pos;
    }
};
