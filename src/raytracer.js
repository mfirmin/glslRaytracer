/* global THREE */
import World from './world/world';
import Box from './entity/box';

class Raytracer {
    constructor() {
        this.world = new World('raytracer', { element: '#raytracer' });

        $('#raytracer').append(this.world.panel);
        this.world.setSize();

        this.vShader =
            'varying vec4 vPosition;\n' +
            'varying vec3 vNormal;\n' +
            'void main() {\n' +
                'vPosition = modelMatrix * vec4(position, 1.0);\n' +
                'vNormal = normal;\n' +
                'gl_Position = ' +
                    'projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n' +
            '}';



        this.fShader = this.makeFragmentShader();

        this.uniforms = {};

        this.uniforms.lightsource = { type: 'v3', value: new THREE.Vector3(10, 10, -30) };
        // Stepsize for sampling... 1 seems a good compromise between real-time shading and quality
        // on my MBP
        this.uniforms.stepsize = { type: 'f', value: 0.01 };
        this.uniforms.opacity = { type: 'f', value: 0.5 };
        this.uniforms.surface = { type: 'f', value: 0.0 };

        this.uniforms.xBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.yBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.zBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };

        this.material = new THREE.ShaderMaterial({
            uniforms:       this.uniforms,
            vertexShader:   this.vShader,
            fragmentShader: this.fShader,
            side:           THREE.DoubleSide,
            shading:        THREE.SmoothShading,
        });

        this.box = new Box('plot', [4, 4, 4], { material: this.material });

        this.world.addEntity(this.box);

        this.world.go();

        $(window).resize(() => this.world.setSize());
    }

    makeFragmentShader(fn) {
        /* eslint indent: "off", max-len: "off" */

        const fShader = [
            'varying vec4 vPosition;',
            'uniform vec3 lightsource;',
            'uniform float stepsize;',
            'uniform float opacity;',
            'uniform float surface;',
            'uniform vec2 xBounds;',
            'uniform vec2 yBounds;',
            'uniform vec2 zBounds;',

            'float intersectSphere(vec3 c, float r, vec3 ro, vec3 rd) {',
                'float A, B, C;',
                'vec3 ro_c = ro - c;',
                'C = dot(ro_c, ro_c) - r*r;',
                'B = dot(ro_c*2., rd);',
                'A = dot(rd, rd);',
                'float delta = B*B - 4.*A*C;',

                'if (delta < 0.) { return -1.; }',
                'else if (delta == 0.) {',
                    'if (-B/(2.*A) < 0.) {',
                        'return -1.;',
                    '} else {',
                        'return -B/(2.*A);',
                    '}',
                '} else {',
                    'float sqrtDelta = sqrt(delta);',
                    'float first  = (-B + sqrtDelta)/(2.*A);',
                    'float second = (-B - sqrtDelta)/(2.*A);',

                    'if (first >= 0. && second >= 0.) {',
                        'if (first <= second) {',
                            'return first;',
                        '} else {',
                            'return second;',
                        '}',
                    '} else if (first < 0. && second < 0.) {',
                        'return -1.;',
                    '} else {',
                        'if (first < 0.) { return second; }',
                        'else { return first; }',
                    '}',
                '}',

            '}',

            'void main() {',
                'vec3 ro = cameraPosition;',
                'vec3 dir = vPosition.xyz - ro;',
                'float t_entry = length(dir);',
                'vec3 rd = normalize(dir);',

                'if (t_entry < 0.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }',

                'float t_sphere1 = intersectSphere(vec3(0.,0.,0.), 1., ro, rd);',
                'float t_sphere2 = intersectSphere(vec3(1.,1.,1.), 0.5, ro, rd);',

                'if (t_sphere1 > 0. && (t_sphere2 < 0. || (t_sphere1 < t_sphere2))) {',
                    'gl_FragColor = vec4(1.,0.,0.,1.);',
                '} else if (t_sphere2 > 0.) {',
                    'gl_FragColor = vec4(0.,0.,1.,1.);',
                '} else {',
                    'gl_FragColor = vec4(1.,1.,1.,1.);',
                '}',

            '}'].join('\n');

        return fShader;
    }
}

export default Raytracer;
