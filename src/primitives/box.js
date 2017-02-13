/* global THREE */

import { default as Primitive } from './primitive.js';

class Box extends Primitive {
    constructor(p0, p1, color, type, diffuse, specular) {
        super(color, type, diffuse, specular);
        this._p0 = p0;
        this._p1 = p1;
    }

    get p0() {
        return this._p0;
    }

    set p0(p) {
        this._p0 = p;
    }

    get p1() {
        return this._p1;
    }

    set p1(p) {
        this._p1 = p;
    }
}

export default Box;
