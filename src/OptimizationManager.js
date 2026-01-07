import { WebIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, quantize, draco, prune, dedup } from '@gltf-transform/functions';
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

    async applyDracoCompression(buffer, quantizationBits = 14) {
        console.time('Draco Compression');
        await this.initDraco();

        const io = new WebIO()
            .registerExtensions([KHRDracoMeshCompression])
            .registerDependencies({
                'draco3d.encoder': this.cachedDracoEncoder,
                'draco3d.decoder': this.cachedDracoDecoder
            });

        const document = await io.readBinary(new Uint8Array(buffer));

        // Pipeline: Weld -> Dedup -> Quantize -> Draco -> Prune
        await document.transform(
            weld(),
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

        const outBuffer = (await io.writeBinary(document)).buffer;
        console.timeEnd('Draco Compression');
        return outBuffer;
    }
};
