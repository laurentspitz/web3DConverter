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
    },

    rotateX() {
        if (!this.originalModel) return;
        this.originalModel.rotation.x += Math.PI / 2;
        if (this.resultModel) this.resultModel.rotation.x = this.originalModel.rotation.x;
    },

    rotateY() {
        if (!this.originalModel) return;
        this.originalModel.rotation.y += Math.PI / 2;
        if (this.resultModel) this.resultModel.rotation.y = this.originalModel.rotation.y;
    },

    rotateZ() {
        if (!this.originalModel) return;
        this.originalModel.rotation.z += Math.PI / 2;
        if (this.resultModel) this.resultModel.rotation.z = this.originalModel.rotation.z;
    },

    autoCenter() {
        if (!this.originalModel) return;
        const box = new THREE.Box3().setFromObject(this.originalModel);
        const center = box.getCenter(new THREE.Vector3());
        this.originalModel.position.sub(center);
        if (this.resultModel) this.resultModel.position.copy(this.originalModel.position);
    },

    autoGround() {
        if (!this.originalModel) return;
        const box = new THREE.Box3().setFromObject(this.originalModel);
        const minY = box.min.y;
        this.originalModel.position.y -= minY;
        if (this.resultModel) this.resultModel.position.y = this.originalModel.position.y;
    },

    mirrorX() {
        if (!this.originalModel) return;
        this.originalModel.scale.x *= -1;
        if (this.resultModel) this.resultModel.scale.x = this.originalModel.scale.x;
    },

    mirrorY() {
        if (!this.originalModel) return;
        this.originalModel.scale.y *= -1;
        if (this.resultModel) this.resultModel.scale.y = this.originalModel.scale.y;
    },

    mirrorZ() {
        if (!this.originalModel) return;
        this.originalModel.scale.z *= -1;
        if (this.resultModel) this.resultModel.scale.z = this.originalModel.scale.z;
    },

    applyScale(factor) {
        if (!this.originalModel || isNaN(factor)) return;
        this.originalModel.scale.multiplyScalar(factor);
        if (this.resultModel) this.resultModel.scale.copy(this.originalModel.scale);
    },

    setWireframe(enabled) {
        if (!this.originalModel) return;
        this.originalModel.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.wireframe = enabled);
                } else {
                    child.material.wireframe = enabled;
                }
            }
        });
        if (this.resultModel) this.setWireframeForResult(enabled);
    },

    setWireframeForResult(enabled) {
        if (!this.resultModel) return;
        this.resultModel.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.wireframe = enabled);
                } else {
                    child.material.wireframe = enabled;
                }
            }
        });
    },

    setBaseColor(hex) {
        if (!this.originalModel) return;
        const color = new THREE.Color(hex);
        this.originalModel.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => {
                        if (m.color) m.color.copy(color);
                    });
                } else {
                    if (child.material.color) child.material.color.copy(color);
                }
            }
        });
        if (this.resultModel) this.setBaseColorForResult(hex);
    },

    setBaseColorForResult(hex) {
        if (!this.resultModel) return;
        const color = new THREE.Color(hex);
        this.resultModel.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => {
                        if (m.color) m.color.copy(color);
                    });
                } else {
                    if (child.material.color) child.material.color.copy(color);
                }
            }
        });
    }
};
