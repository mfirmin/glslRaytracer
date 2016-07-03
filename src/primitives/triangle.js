/* global THREE */

import { default as Primitive } from './primitive.js';

class Triangle extends Primitive{
    constructor(a, b, c, color, type, diffuse) {
        super(color, type, diffuse);
        this._a = a;
        this._b = b;
        this._c = c;
    }

    get vertices() {
        return [a,b,c];
    }

    set vertices(v) {
        this._a = v[0];
        this._b = v[1];
        this._c = v[2];
    }

    get a() {
        return this._a;
    }

    set a(a) {
        this._a = a;
    }

    get b() {
        return this._b;
    }

    set b(b) {
        this._b = b;
    }

    get c() {
        return this._c;
    }

    set c(c) {
        this._c = c;
    }

}

export default Triangle;
