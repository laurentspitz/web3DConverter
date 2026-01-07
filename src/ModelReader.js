import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader';
import * as fflate from 'fflate';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

export class ModelReader {
    /**
     * Loads an STL model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @returns {Promise<{model: THREE.Mesh, stats: object, normalization: object}>}
     */
    static async loadSTL(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new STLLoader();
        // Handle cases where buffer might be a DataView (e.g., from STLExporter)
        const dataToParse = (buffer instanceof DataView) ? buffer.buffer : buffer;
        const geometry = loader.parse(dataToParse);
        const material = isResult ? this.getResultMaterial() : this.getOriginalMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        const stats = this.extractStats(mesh);
        const normalization = !isResult ? this.calculateNormalization(mesh) : null;

        return { model: mesh, stats, normalization };
    }

    /**
     * Loads an OBJ model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @returns {Promise<{model: THREE.Group, stats: object, normalization: object}>}
     */
    static async loadOBJ(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new OBJLoader();
        const text = new TextDecoder().decode(buffer);
        const object = loader.parse(text);

        const material = isResult ? this.getResultMaterial() : this.getOriginalMaterial();
        object.traverse(child => {
            if (child.isMesh) {
                child.material = material;
            }
        });

        const stats = this.extractStats(object);
        const normalization = !isResult ? this.calculateNormalization(object) : null;

        return { model: object, stats, normalization };
    }

    /**
     * Loads a PLY model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @returns {Promise<{model: THREE.Mesh, stats: object, normalization: object}>}
     */
    static async loadPLY(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new PLYLoader();
        const geometry = loader.parse(buffer);
        if (geometry.attributes.position) {
            geometry.computeVertexNormals();
        }

        const material = isResult ? this.getResultMaterial() : this.getOriginalMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        const stats = this.extractStats(mesh);
        const normalization = !isResult ? this.calculateNormalization(mesh) : null;

        return { model: mesh, stats, normalization };
    }

    static async loadFBX(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new FBXLoader();
        // @ts-ignore
        loader.setResourcePath('');
        // FBXLoader in some versions might need fflate if the file is compressed
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        try {
            const object = await loader.loadAsync(url);
            URL.revokeObjectURL(url);
            const stats = this.extractStats(object);
            const normalization = !isResult ? this.calculateNormalization(object) : null;
            return { model: object, stats, normalization };
        } catch (e) {
            URL.revokeObjectURL(url);
            throw e;
        }
    }

    static async load3MF(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new ThreeMFLoader();
        // @ts-ignore
        loader.fflate = fflate;
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        try {
            const object = await loader.loadAsync(url);
            URL.revokeObjectURL(url);
            const stats = this.extractStats(object);
            const normalization = !isResult ? this.calculateNormalization(object) : null;
            return { model: object, stats, normalization };
        } catch (e) {
            URL.revokeObjectURL(url);
            throw e;
        }
    }

    /**
     * Loads a USDZ model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @param {boolean} isResult 
     * @returns {Promise<{model: THREE.Object3D, stats: object, normalization: object}>}
     */
    static async loadUSDZ(buffer, isResult = false) {
        if (!buffer) throw new Error("Buffer is undefined");
        const loader = new USDZLoader();
        const group = await loader.parse(buffer);

        const material = isResult ? this.getResultMaterial() : this.getOriginalMaterial();
        group.traverse(child => {
            if (child.isMesh) {
                child.material = material;
            }
        });

        const stats = this.extractStats(group);
        const normalization = !isResult ? this.calculateNormalization(group) : null;

        return { model: group, stats, normalization };
    }
    /**
     * Loads a GLB model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @param {'original' | 'optimized'} type 
     * @returns {Promise<{model: THREE.Group, stats: object, normalization: object|null}>}
     */
    static async loadGLB(buffer, type = 'original') {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        return new Promise((resolve, reject) => {
            loader.parse(buffer, '', (gltf) => {
                const scene = gltf.scene;
                // Preserve original transforms

                const material = type === 'original' ? this.getOriginalMaterial() : this.getResultMaterial();

                scene.traverse(child => {
                    if (child.isMesh) {
                        child.material = material;
                    }
                });

                const stats = this.extractStats(scene);
                const normalization = type === 'original' ? this.calculateNormalization(scene) : null;

                resolve({ model: scene, stats, normalization });
            }, (err) => {
                console.error("GLB Load Error:", err);
                reject(err);
            });
        });
    }

    static getOriginalMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x00f2fe,
            metalness: 0.7,
            roughness: 0.2,
            flatShading: true
        });
    }

    static getResultMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x38ef7d,
            metalness: 0.8,
            roughness: 0.1,
            flatShading: true
        });
    }

    static extractStats(object) {
        let vCount = 0;
        object.traverse(child => {
            if (child.isMesh) vCount += child.geometry.attributes.position.count;
        });
        return {
            vertices: vCount,
            faces: Math.floor(vCount / 3)
        };
    }

    static calculateNormalization(object) {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        return { center, scale };
    }
}
