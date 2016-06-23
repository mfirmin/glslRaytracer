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

        this.uniforms.lightsource = { type: 'v3', value: new THREE.Vector3(0,0,5) };
        // Stepsize for sampling... 1 seems a good compromise between real-time shading and quality
        // on my MBP
        this.uniforms.stepsize = { type: 'f', value: 0.01 };
        this.uniforms.opacity = { type: 'f', value: 0.5 };
        this.uniforms.surface = { type: 'f', value: 0.0 };

        this.uniforms.xBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.yBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.zBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };

        this.uniforms.spherePositions = { 'type': 'v3v', value: [ new THREE.Vector3(0,0,0), new THREE.Vector3(1,1,1), new THREE.Vector3(-1,0,1), new THREE.Vector3(0, 2, 0), new THREE.Vector3(0,0,-3), new THREE.Vector3(.25,-2,0) ]};
        this.uniforms.sphereRadii     = { 'type': 'fv1', value: [ .7, .2, 0.5, .8, 1.2, .6 ]};
        this.uniforms.sphereColors    = { 'type': 'v3v', value: [ new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,0), new THREE.Vector3(1,1,0), new THREE.Vector3(1,0,1) ]};

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
            'uniform vec3 spherePositions[6];',
            'uniform float sphereRadii[6];',
            'uniform vec3 sphereColors[6];',

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

            'void intersect(in vec3 ro, in vec3 rd, inout int pid, inout float min_t) {',
                'for (int i = 0; i < 6; i++) {',
                    'vec3 c;',
                    'float r;',
                    'if (i == 0) { c = spherePositions[0]; r = sphereRadii[0]; }',
                    'if (i == 1) { c = spherePositions[1]; r = sphereRadii[1]; }',
                    'if (i == 2) { c = spherePositions[2]; r = sphereRadii[2]; }',
                    'if (i == 3) { c = spherePositions[3]; r = sphereRadii[3]; }',
                    'if (i == 4) { c = spherePositions[4]; r = sphereRadii[4]; }',
                    'if (i == 5) { c = spherePositions[5]; r = sphereRadii[5]; }',
                    'float t = intersectSphere(c, r, ro, rd);',
                    'if (t > 0.+1e-3 && t < min_t) {',
                        'pid = i;',
                        'min_t = t;',
                    '}',
                '}',
            '}',

            'void main() {',
                'vec3 ro = cameraPosition;',
                'vec3 dir = vPosition.xyz - ro;',
                'float t_entry = length(dir);',
                'vec3 rd = normalize(dir);',

                'if (t_entry < 0.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }',


                'vec3 normal;',
                'vec3 color;',
                'vec3 p;',
                'int pid = -1;',
                'float min_t = 1000000.;',

                'intersect(ro, rd, pid, min_t);',

                'if (pid == 0) {',
                    'ro = ro + min_t*rd;',
                    'pid = -1;',
                    'min_t = 100000.;',
                    'normal = normalize(ro-spherePositions[0]);',
                    'rd = rd - 2.*normal * dot(rd, normal);',
                    'intersect(ro, rd, pid, min_t);',
                '}',

                'if (pid == -1) {',
                    'gl_FragColor = vec4(.8,.8,.8,1.);',
                '} else {',
                    'p = ro + min_t*rd;',

                    'vec3 c;',
                    'if (pid == 0) { color = sphereColors[0]; c = spherePositions[0]; }',
                    'if (pid == 1) { color = sphereColors[1]; c = spherePositions[1]; }',
                    'if (pid == 2) { color = sphereColors[2]; c = spherePositions[2]; }',
                    'if (pid == 3) { color = sphereColors[3]; c = spherePositions[3]; }',
                    'if (pid == 4) { color = sphereColors[4]; c = spherePositions[4]; }',
                    'if (pid == 5) { color = sphereColors[5]; c = spherePositions[5]; }',

                    'normal = vec3(p-c);',

                    'vec3 N = normalize(normal);',
                    'vec3 L = normalize(lightsource - p);',
                    'vec3 V = -rd;',
                    'vec3 H = normalize(V+L);',


                    'gl_FragColor = vec4(dot(N, L)*color, 1.);',
                '}',

            '}'].join('\n');

        return fShader;
    }
}

export default Raytracer;
