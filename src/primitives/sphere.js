/* global THREE */

import { default as Primitive } from './primitive.js';

class Sphere extends Primitive{
    constructor(center, radius, color, type, diffuse) {
        super(color, type, diffuse);
        this._center = center;
        this._radius = radius;
    }

    get center() {
        return this._center;
    }

    set center(c) {
        this._center = c;
    }

    get radius() {
        return this._radius;
    }

    set radius(r) {
        this._radius = r;
    }

}

export default Sphere;
