/* global THREE */

const powersOfTwo = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]);
const MAX_SIDE_LENGTH = powersOfTwo[powersOfTwo.length - 1];
const MAX_TEXTURE_SIZE = MAX_SIDE_LENGTH * MAX_SIDE_LENGTH;

const sizes = [];

for (let h = 0; h < powersOfTwo.length; h++) {
    const inner = [];
    for (let w = h; w < powersOfTwo.length; w++) {
        inner.push(powersOfTwo[w] * powersOfTwo[h]);
    }
    sizes.push(inner);
}

class DataTexture {

    constructor() {
        this.data = [];
        this.ptr = 0;
    }

    computeTextureSize(pixelsNeeded) {
        if (pixelsNeeded < 0 || pixelsNeeded > MAX_TEXTURE_SIZE) {
            throw new Error(`Invalid data size: ${pixelsNeeded}`);
        }
        let min = Number.MAX_VALUE;
        let minH = 0;
        let minW = 0;
        for (let h = 0; h < sizes.length; h++) {
            const inner = sizes[h];
            for (let w = 0; w < inner.length; w++) {
                const value = inner[w];
                if (value === pixelsNeeded) {
                    return {
                        height: powersOfTwo[h],
                        width:  powersOfTwo[w + powersOfTwo.length - inner.length],
                    };
                } else if (value > pixelsNeeded && value < min) {
                    min = value;
                    minH = powersOfTwo[h];
                    minW = powersOfTwo[w + powersOfTwo.length - inner.length];
                }
            }
        }

        return { width: minW, height: minH };
    }

    construct() {
        const pixelsNeeded = this.data / 4;

        const { width, height } = this.computeTextureSize(pixelsNeeded);

        const dt = new THREE.DataTexture(
            this.data,
            width,
            height,
            THREE.RGBAFormat,
            THREE.FloatType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter
        );

        dt.flipY = false;
        dt.needsUpdate = true;


        this.textureWidth = width;
        this.textureHeight = height;
        this.datatexture = dt;

        return this.datatexture;
    }
}

export default DataTexture;
