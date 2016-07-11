/* global THREE */

class Primitive {
    constructor(color = [0.8,0.8,0.8], type = 'NORMAL', diffuse, specular=[0.0, 0.0]) {
        this._color = color;
        this._diffuse = (diffuse === undefined) ? color : diffuse ;
        this._type = type;
        this._specular = specular;
    }

    get color() {
        return this._color;
    }

    set color(c) {
        this._color = c;
    }

    get diffuse() {
        return this._diffuse;
    }

    set diffuse(d) {
        this._diffuse = d;
    }

    get specular() {
        console.log(this._specular);
        return this._specular;
    }

    set specular(s) {
        this._specular = s;
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
