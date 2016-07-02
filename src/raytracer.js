/* global THREE */
import World from './world/world';
import Box from './entity/box';

class Raytracer {
    constructor() {
        this.world = new World('raytracer', { element: '#raytracer' });

        $('#raytracer').append(this.world.panel);
        this.world.setSize();


        var PTR_SIZE = 2;
        var primitives = new Float32Array(PTR_SIZE*PTR_SIZE*4)
        primitives[0] = 0;
        primitives[1] = -1;
        primitives[2] = -1;
        primitives[3] = -1;

        primitives[4] = 3;
        primitives[5] = -1;
        primitives[6] = -1;
        primitives[7] = -1;

        var dt_ptr = new THREE.DataTexture(primitives, PTR_SIZE, PTR_SIZE, THREE.RGBAFormat, THREE.FloatType);
        dt_ptr.flipY = false;
        dt_ptr.needsUpdate = true;

        var PI_SIZE = 16;
        var primitiveInfo = new Float32Array(PI_SIZE*PI_SIZE*4);
        primitiveInfo[0] = 1; // Triangle(0) or sphere(1)
        primitiveInfo[1] = 0; // flags (0 = normal, 1 = mirror, 2 = glass)
        primitiveInfo[2] = 0;
        primitiveInfo[3] = 0;
        // Color
        primitiveInfo[4] = 1;
        primitiveInfo[5] = 0;
        primitiveInfo[6] = 0;
        primitiveInfo[7] = 1;
        // Center (rgb), radius (a)
        primitiveInfo[8] = 0;
        primitiveInfo[9] = 0;
        primitiveInfo[10] = 0;
        primitiveInfo[11] = 1;

        // TRIANGLE:
        primitiveInfo[12] = 0; // Triangle(0) or sphere(1)
        primitiveInfo[13] = 0; // flags (0 = normal, 1 = mirror, 2 = glass)
        primitiveInfo[14] = 0;
        primitiveInfo[15] = 0;
        // Color
        primitiveInfo[16] = 0;
        primitiveInfo[17] = 1;
        primitiveInfo[18] = 0;
        primitiveInfo[19] = 1;

        // A
        primitiveInfo[20] = -2;
        primitiveInfo[21] = -2;
        primitiveInfo[22] = 3;
        primitiveInfo[23] = 0;

        // B
        primitiveInfo[24] = 2;
        primitiveInfo[25] = -2;
        primitiveInfo[26] = 3;
        primitiveInfo[27] = 0;

        // C
        primitiveInfo[28] = 2;
        primitiveInfo[29] = 2;
        primitiveInfo[30] = 3;
        primitiveInfo[31] = 0;

        this.vShader =
            'varying vec4 vPosition;\n' +
            'varying vec3 vNormal;\n' +
            'void main() {\n' +
                'vPosition = modelMatrix * vec4(position, 1.0);\n' +
                'vNormal = normal;\n' +
                'gl_Position = ' +
                    'projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n' +
            '}';


        var dt = new THREE.DataTexture(primitiveInfo, PI_SIZE, PI_SIZE, THREE.RGBAFormat, THREE.FloatType);
        dt.flipY = false;
        dt.needsUpdate = true;

        this.fShader = this.makeFragmentShader(PTR_SIZE, PI_SIZE);

        this.uniforms = {};

        this.uniforms.lightsource = { type: 'v3', value: new THREE.Vector3(0,0,5) };

        this.uniforms.surface = { type: 'f', value: 0.0 };

        this.uniforms.xBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.yBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.zBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };

        // Texture storing pointers in to the primitiveInfo texture (1 pixel = 1 ptr (1 primitive))
        this.uniforms.primitive_ptrs = {'type': 't', value: dt_ptr};
        // Texture storing info about each primitive
        this.uniforms.primitive_info = {'type': 't', value: dt};

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

    makeFragmentShader(ptrsSize, piSize) {
        /* eslint indent: "off", max-len: "off" */

        const fShader = [
            'varying vec4 vPosition;',
            'uniform vec3 lightsource;',
            'uniform vec2 xBounds;',
            'uniform vec2 yBounds;',
            'uniform vec2 zBounds;',
            'uniform sampler2D primitive_ptrs;',
            'uniform sampler2D primitive_info;',

            'const int ptrsSize = ' + ptrsSize + ';',
            'const int piSize = ' + piSize + ';',

            'const float pixWidthPtrs = 1./float(ptrsSize);',
            'const float pixWidthInfo = 1./float(piSize);',

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
                'for (int i = 0; i < ptrsSize; i++) {',
                    'float t = -1.;',

                    'float pIdx = texture2D(primitive_ptrs, vec2((float(i)+0.5)*pixWidthPtrs, 0.5*pixWidthPtrs)).r;',
                    'vec4 pInfo = texture2D(primitive_info, vec2((pIdx+0.5)*pixWidthInfo, 0.5*pixWidthInfo));',

                    'if (pInfo.r == 0.) {',
                        'vec3 a = texture2D(primitive_info, vec2((pIdx+2.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        'vec3 b = texture2D(primitive_info, vec2((pIdx+3.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        'vec3 c = texture2D(primitive_info, vec2((pIdx+4.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        't = intersectTriangle(a, b, c, ro, rd);',

                    '} else if (pInfo.r == 1.) {',
                        'vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+2.+0.5)*pixWidthInfo, 0.5*pixWidthInfo));',
                        't = intersectSphere(c_and_r.xyz, c_and_r.a, ro, rd);',
                    '}',
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

//                'if (pid == 0) {',
//                    'ro = ro + min_t*rd;',
//                    'pid = -1;',
//                    'min_t = 100000.;',
//                    'normal = normalize(ro-spherePositions[0]);',
//                    'rd = rd - 2.*normal * dot(rd, normal);',
//                    'intersect(ro, rd, pid, min_t);',
//                '}',

                'if (pid == -1) {',
                    'gl_FragColor = vec4(.8,.8,.8,1.);',
                '} else {',
                    'p = ro + min_t*rd;',

                    'float pIdx = texture2D(primitive_ptrs, vec2((float(pid)+0.5)*pixWidthPtrs, 0.5*pixWidthPtrs)).r;',

                    'float pInfo = texture2D(primitive_info, vec2((pIdx + 0.5)*pixWidthInfo, 0.4*pixWidthInfo)).r;',
                    'if (pInfo == 0.) {',
                        'vec3 a = texture2D(primitive_info, vec2((pIdx+2.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        'vec3 b = texture2D(primitive_info, vec2((pIdx+3.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        'vec3 c = texture2D(primitive_info, vec2((pIdx+4.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).xyz;',
                        'normal = cross(b - a, c - a);',
                    '} else if(pInfo == 1.) {',
                        'vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+2.+0.5)*pixWidthInfo, 0.5*pixWidthInfo));',
                        'normal = p - c_and_r.xyz;',
                    '}',

                    'vec3 color = texture2D(primitive_info, vec2((pIdx+1.+0.5)*pixWidthInfo, 0.5*pixWidthInfo)).rgb;',


                    'vec3 N = normalize(normal);',
                    'vec3 L = normalize(lightsource - p);',
                    'vec3 V = -rd;',

                    'if (dot(V, N) < 0.) { N = -N; }',

                    'gl_FragColor = vec4(clamp(dot(N, L),0.,1.)*color, 1.);',
                '}',

            '}'].join('\n');

        return fShader;
    }
}

export default Raytracer;
