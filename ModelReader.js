import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

export class ModelReader {
    /**
     * Loads an STL model from array buffer.
     * @param {ArrayBuffer} buffer 
     * @returns {Promise<{model: THREE.Mesh, stats: object, normalization: object}>}
     */
    static async loadSTL(buffer) {
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        const material = this.getOriginalMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        const stats = this.extractStats(mesh);
        const normalization = this.calculateNormalization(mesh);

        return { model: mesh, stats, normalization };
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

                // Identity transforms for comparison consistency
                scene.position.set(0, 0, 0);
                scene.rotation.set(0, 0, 0);
                scene.scale.setScalar(1);

                const material = type === 'original' ? this.getOriginalMaterial() : this.getOptimizedMaterial();

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

    static getOptimizedMaterial() {
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
