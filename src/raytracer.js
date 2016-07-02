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

        this.uniforms.spherePositions = { 'type': 'v3v', value: [ new THREE.Vector3(0,0,0), new THREE.Vector3(1,1,-2), new THREE.Vector3(-1,0,1) ]};
        this.uniforms.sphereRadii     = { 'type': 'fv1', value: [ .7, .2, 0.5, .8, 1.2, .6 ]};
        this.uniforms.sphereColors    = { 'type': 'v3v', value: [ new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1) ]};

        this.uniforms.trianglePositions = {'type': 'v3v', value: [
            new THREE.Vector3(-4,-4,-5), new THREE.Vector3(4,-4,-5), new THREE.Vector3(4,4,-5),
            new THREE.Vector3(-4,-4,-5), new THREE.Vector3(4,4,-5), new THREE.Vector3(-4,4,-5)
        ]};
        this.uniforms.triangleColors = {'type': 'v3v', value: [ new THREE.Vector3(0,1,1), new THREE.Vector3(1,1,0)]};

        this.material = new THREE.ShaderMaterial({
            uniforms:       this.uniforms,
            vertexShader:   this.vShader,
            fragmentShader: this.fShader,
            side:           THREE.DoubleSide,
            shading:        THREE.SmoothShading,
        });

        this.box = new Box('plot', [10,10,10], { material: this.material });

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
            'uniform vec3 spherePositions[3];',
            'uniform float sphereRadii[3];',
            'uniform vec3 sphereColors[3];',
            'uniform vec3 trianglePositions[6];',
            'uniform vec3 triangleColors[2];',

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

            'float intersectTriangle(vec3 a, vec3 b, vec3 c, vec3 ro, vec3 rd) {',
                'vec3 N = cross(b - a, c - a);',
                'float t = dot(a - ro, N) / dot(rd, N);',
                'vec3 pt = ro + rd*t;',

                'if (t < 0.) { return -1.; }',
                'else {',
                    'vec3 v1 = cross(a - pt, b - pt);',
                    'vec3 v2 = cross(b - pt, c - pt);',
                    'vec3 v3 = cross(c - pt, a - pt);',
                    'if (dot(v1, v2) >= 0. && dot(v2,v3) >= 0. && dot(v3,v1) >= 0.) { return t; }',
                    'else { return -1.; }',
                '}',
            '}',

            'void intersect(in vec3 ro, in vec3 rd, inout int pid, inout float min_t) {',
            // intersect S
                'for (int i = 0; i < 5; i++) {',
                    'float t;',
                    'if (i == 0) { t = intersectSphere(spherePositions[0], sphereRadii[0], ro, rd); }',
                    'if (i == 1) { t = intersectSphere(spherePositions[1], sphereRadii[1], ro, rd); }',
                    'if (i == 2) { t = intersectSphere(spherePositions[2], sphereRadii[2], ro, rd); }',
                    'if (i == 3) { t = intersectTriangle(trianglePositions[0], trianglePositions[1], trianglePositions[2], ro, rd); }',
                    'if (i == 4) { t = intersectTriangle(trianglePositions[3], trianglePositions[4], trianglePositions[5], ro, rd); }',
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
                    'if (pid == 0) { color = sphereColors[0]; c = spherePositions[0]; normal = vec3(p-c); }',
                    'if (pid == 1) { color = sphereColors[1]; c = spherePositions[1]; normal = vec3(p-c); }',
                    'if (pid == 2) { color = sphereColors[2]; c = spherePositions[2]; normal = vec3(p-c); }',
                    'if (pid == 3) {',
                        'color = triangleColors[0];',
                        'normal = cross(trianglePositions[1] - trianglePositions[0], trianglePositions[2] - trianglePositions[0]);',
                    '}',
                    'if (pid == 4) {',
                        'color = triangleColors[1];',
                        'normal = cross(trianglePositions[4] - trianglePositions[3], trianglePositions[5] - trianglePositions[3]);',
                    '}',


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
