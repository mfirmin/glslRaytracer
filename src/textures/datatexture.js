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

    constructor(data = []) {
        this._data = data;
        this.ptr = 0;
    }

    set data(d) {
        this._data = d;
    }

    get data() {
        return this._data;
    }

    get texture() {
        return this.constructTexture();
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

    padData(length) {
        const newData = new Float32Array(length);
        for (let i = 0; i < this._data.length; i++) {
            newData[i] = this._data[i];
        }
        this._data = newData;
    }

    constructTexture() {
        const pixelsNeeded = this._data.length / 4;

        const { width, height } = this.computeTextureSize(pixelsNeeded);

        this.padData(width * height * 4);

        const dt = new THREE.DataTexture(
            this._data,
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
        this._datatexture = dt;

        return this._datatexture;
    }
}

export default DataTexture;
