import { WebIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { weld, quantize, draco, prune, dedup, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3d';

export const OptimizationManager = {
    cachedDracoEncoder: null,
    cachedDracoDecoder: null,

    async initDraco() {
        if (!this.cachedDracoEncoder || !this.cachedDracoDecoder) {
            const [encoder, decoder] = await Promise.all([
                draco3d.createEncoderModule(),
                draco3d.createDecoderModule()
            ]);
            this.cachedDracoEncoder = encoder;
            this.cachedDracoDecoder = decoder;
        }
    },

    async optimize(buffer, options = {}) {
        const { weld: useWeld = false, draco: useDraco = false, simplify: simplifyRatio = 0, quantizationBits = 14 } = options;

        console.time('Optimization');
        const io = new WebIO().registerExtensions([KHRMeshQuantization]);

        if (useDraco) {
            await this.initDraco();
            io.registerExtensions([KHRDracoMeshCompression])
                .registerDependencies({
                    'draco3d.encoder': this.cachedDracoEncoder,
                    'draco3d.decoder': this.cachedDracoDecoder
                });
        }

        const document = await io.readBinary(new Uint8Array(buffer));
        const transforms = [];

        if (useWeld) {
            transforms.push(weld());
        }

        if (simplifyRatio > 0) {
            await MeshoptSimplifier.ready;
            transforms.push(simplify({
                simplifier: MeshoptSimplifier,
                ratio: 1 - (simplifyRatio / 100),
                error: 0.001
            }));
        }

        if (useDraco) {
            transforms.push(
                dedup(),
                quantize({
                    quantizePositionBits: quantizationBits,
                    quantizeNormalBits: Math.max(6, quantizationBits - 2)
                }),
                draco({
                    method: 'edgebreaker',
                    quantizePositionBits: quantizationBits,
                    quantizeNormalBits: Math.max(6, quantizationBits - 2)
                }),
                prune()
            );
        } else if (useWeld || simplifyRatio > 0) {
            transforms.push(dedup(), prune());
        }

        if (transforms.length > 0) {
            await document.transform(...transforms);
        }

        const outBuffer = (await io.writeBinary(document)).buffer;
        console.timeEnd('Optimization');
        return outBuffer;
    }
};
