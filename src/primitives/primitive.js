/* global THREE */

class Primitive {
    constructor(color = [0.8,0.8,0.8], type = 'NORMAL') {
        this._color = color;
        this._type = type;
    }

    get color() {
        return this._color;
    }

    set color(c) {
        this._color = c;
    }

    get type() {
        return this._type;
    }

    set type(t) {
        if (['NORMAL', 'MIRROR', 'GLASS'].indexOf(t) === -1) {
            t = 'NORMAL';
        }
        this._type = t;
    }

}

export default Primitive;
