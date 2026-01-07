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
    baseScale: 1,

    // Sculpting State
    isSculptMode: false,
    isSculpting: false,
    brushSize: 0.5,
    brushStrength: 0.1,
    sculptInflate: true,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    brushHelper: null,
    sculptChanged: false,

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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight1.position.set(5, 10, 7);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, -5, -5); // Light from the back/bottom
        this.scene.add(directionalLight2);

        this.camera.position.set(0, 0, 5);

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;

        // Prevent context menu to allow smooth right-click panning
        this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        this.animate();
        window.addEventListener('resize', () => this.resize(canvasHolder));
        this.resize(canvasHolder);

        // Sculpting Events
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.renderer.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e));

        this.initBrushHelper();
    },

    initBrushHelper() {
        const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        this.brushHelper = new THREE.Mesh(geometry, material);
        this.brushHelper.visible = false;
        this.scene.add(this.brushHelper);
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
        this.baseScale = scale;
        this.modelGroup.scale.setScalar(this.baseScale);

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
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Convert world center to parent local space
        const localCenter = this.originalModel.parent.worldToLocal(center);
        this.originalModel.position.sub(localCenter);

        if (this.resultModel) this.resultModel.position.copy(this.originalModel.position);
    },

    autoGround() {
        if (!this.originalModel) return;
        const box = new THREE.Box3().setFromObject(this.originalModel);

        // Find world movement needed
        const worldMoveY = -box.min.y;

        // We want to move the model by worldMoveY along the world Y axis.
        // Get current world position
        const worldPos = new THREE.Vector3();
        this.originalModel.getWorldPosition(worldPos);

        // Target world position
        worldPos.y += worldMoveY;

        // Convert target world position back to local parent space
        const localPos = this.originalModel.parent.worldToLocal(worldPos);
        this.originalModel.position.copy(localPos);

        if (this.resultModel) this.resultModel.position.copy(this.originalModel.position);
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
        this.modelGroup.scale.setScalar(this.baseScale * factor);
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
    },

    // --- Sculpting Logic ---
    setSculptMode(enabled) {
        this.isSculptMode = enabled;

        if (enabled) {
            // Disable left-click for orbit but keep others enabled for panning/zooming
            this.orbitControls.mouseButtons = {
                LEFT: null,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
        } else {
            // Restore default orbit controls
            this.orbitControls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            if (this.brushHelper) this.brushHelper.visible = false;
        }
    },

    setBrushSize(size) {
        this.brushSize = size / 50; // Map range 1-100 to world scale
        if (this.brushHelper) {
            this.brushHelper.scale.setScalar(this.brushSize * 10);
        }
    },

    setBrushStrength(strength) {
        this.brushStrength = strength;
    },

    setSculptInflate(enabled) {
        this.sculptInflate = enabled;
    },

    onPointerDown(e) {
        if (!this.isSculptMode || !this.originalModel || e.button !== 0) return;
        this.isSculpting = true;
        this.onPointerMove(e);
    },

    onPointerMove(e) {
        if (!this.brushHelper) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (this.isSculptMode && this.originalModel) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.originalModel, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                this.brushHelper.visible = true;
                this.brushHelper.position.copy(hit.point);
                this.brushHelper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.face.normal.clone().applyQuaternion(hit.object.quaternion));

                if (this.isSculpting) {
                    this.sculptAtPoint(hit);
                }
            } else {
                this.brushHelper.visible = false;
            }
        }
    },

    onPointerUp() {
        this.isSculpting = false;
        if (this.sculptChanged && this.originalModel) {
            this.originalModel.traverse(child => {
                if (child.isMesh) {
                    child.geometry.computeVertexNormals();
                    child.geometry.attributes.normal.needsUpdate = true;
                }
            });
            this.sculptChanged = false;
        }
    },

    sculptAtPoint(hit) {
        const mesh = hit.object;
        if (!mesh.isMesh) return;

        const geometry = mesh.geometry;
        if (!geometry || !geometry.attributes.position) return;

        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }

        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;

        const localHit = mesh.worldToLocal(hit.point.clone());
        const worldScale = mesh.getWorldScale(new THREE.Vector3()).x;
        const localRadius = this.brushSize / worldScale;

        let changed = false;

        for (let i = 0; i < position.count; i++) {
            const v = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
            const dist = v.distanceTo(localHit);

            if (dist < localRadius) {
                // Falloff factor (linear)
                const falloff = 1 - (dist / localRadius);
                const strength = this.brushStrength * falloff * (this.sculptInflate ? 1 : -1);

                // Displace along normal
                const nx = normal.getX(i);
                const ny = normal.getY(i);
                const nz = normal.getZ(i);

                position.setXYZ(i,
                    v.x + nx * strength,
                    v.y + ny * strength,
                    v.z + nz * strength
                );
                changed = true;
                this.sculptChanged = true;
            }
        }

        if (changed) {
            position.needsUpdate = true;
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            // We might need to update normals too for shading, but computeVertexNormals can be slow
            // geometry.computeVertexNormals(); 
        }
    }
};
