/* global THREE */
import World from './world/world';
import Box from './entity/box';
import primitives from './primitives/index';

class Raytracer {
    constructor(light = [0, 4, 0], lightIntensity = 1.0, ambientIntensity = 0.1) {
        this._primitives = [];
        this._lightPosition = light;
        this._lightIntensity = lightIntensity;
        this._ambientIntensity = ambientIntensity;
        this._sCount = 0;
        this._tCount = 0;

        this._initialized = false;
    }

    add(p) {
        if (p instanceof primitives.Sphere) {
            this._sCount++;
        } else if (p instanceof primitives.Triangle) {
            this._tCount++;
        } else {
            console.warn('Unknown primitive type'); // eslint-disable-line no-console
            return;
        }
        this._primitives.push(p);
    }

    get lightPosition() {
        return this._lightPosition;
    }

    set lightPosition(pos) {
        this._lightPosition = pos;
        if (this._initialized) {
            this.uniforms.lightsource.value.x = pos[0];
            this.uniforms.lightsource.value.y = pos[1];
            this.uniforms.lightsource.value.z = pos[2];
        }
    }
    get lightIntensity() {
        return this._lightIntensity;
    }

    set lightIntensity(I) {
        this._lightIntensity = I;
        if (this._initialized) {
            this.uniforms.lightIntensity.value = I;
        }
    }

    get ambientIntensity() {
        return this._ambientIntensity;
    }

    set ambientIntensity(aI) {
        this._ambientIntensity = aI;
        if (this._initialized) {
            this.uniforms.ambientIntensity.value = aI;
        }
    }

    go() {
        this.world = new World('raytracer', { element: '#raytracer' });

        $('#raytracer').append(this.world.panel);
        this.world.setSize();

        const numPrimitives = this._primitives.length;

        const primitivePtrs = new Float32Array(numPrimitives * 1 * 4);

        const pinfoPixels = this._sCount * 4 + this._tCount * 6;
        if (pinfoPixels > 1024) {
            console.error('TOO MANY PRIMITIVES (pInfo > 1024 not supported yet...)'); // eslint-disable-line no-console
        }
        const primitiveInfo = new Float32Array(pinfoPixels * 1 * 4);
        let pixCount = 0;
        for (let i = 0; i < numPrimitives; i++) {
            primitivePtrs[4 * i + 0] = pixCount;
            primitivePtrs[4 * i + 1] = -1;
            primitivePtrs[4 * i + 2] = -1;
            primitivePtrs[4 * i + 3] = -1;

            const p = this._primitives[i];

            let type = -1;
            if (p instanceof primitives.Triangle) {
                type = 0;
            } else if (p instanceof primitives.Sphere) {
                type = 1;
            } else {
                console.warn('Unknown primitive. Should never reach here'); // eslint-disable-line no-console
                continue;
            }

            primitiveInfo[4 * pixCount + 0] = type;
            primitiveInfo[4 * pixCount + 1] = ['NORMAL', 'MIRROR', 'GLASS'].indexOf(p.type);
            primitiveInfo[4 * pixCount + 2] = p.type === 'GLASS' ? 1.4 : 0; // Index of refraction (if glass type)
            primitiveInfo[4 * pixCount + 3] = p.type === 'GLASS' ? 1 : 1; // multiplier on color of bounce
            ++pixCount;
            // Color
            primitiveInfo[4 * pixCount + 0] = p.color[0];
            primitiveInfo[4 * pixCount + 1] = p.color[1];
            primitiveInfo[4 * pixCount + 2] = p.color[2];
            primitiveInfo[4 * pixCount + 3] = p.specular[0];
            ++pixCount;
            primitiveInfo[4 * pixCount + 0] = p.diffuse[0];
            primitiveInfo[4 * pixCount + 1] = p.diffuse[1];
            primitiveInfo[4 * pixCount + 2] = p.diffuse[2];
            primitiveInfo[4 * pixCount + 3] = p.specular[1];
            ++pixCount;

            if (type === 0) {
                // TRIANGLE CASE (A,B,C)
                primitiveInfo[4 * pixCount + 0] = p.a[0];
                primitiveInfo[4 * pixCount + 1] = p.a[1];
                primitiveInfo[4 * pixCount + 2] = p.a[2];
                primitiveInfo[4 * pixCount + 3] = 0;
                ++pixCount;
                primitiveInfo[4 * pixCount + 0] = p.b[0];
                primitiveInfo[4 * pixCount + 1] = p.b[1];
                primitiveInfo[4 * pixCount + 2] = p.b[2];
                primitiveInfo[4 * pixCount + 3] = 0;
                ++pixCount;
                primitiveInfo[4 * pixCount + 0] = p.c[0];
                primitiveInfo[4 * pixCount + 1] = p.c[1];
                primitiveInfo[4 * pixCount + 2] = p.c[2];
                primitiveInfo[4 * pixCount + 3] = 0;
                ++pixCount;
            } else if (type === 1) {
                // SPHERE CASE
                primitiveInfo[4 * pixCount + 0] = p.center[0];
                primitiveInfo[4 * pixCount + 1] = p.center[1];
                primitiveInfo[4 * pixCount + 2] = p.center[2];
                primitiveInfo[4 * pixCount + 3] = p.radius;
                ++pixCount;
            }
        }

        const dtPtr = new THREE.DataTexture(primitivePtrs, numPrimitives, 1, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        dtPtr.flipY = false;
        dtPtr.needsUpdate = true;


        const dt = new THREE.DataTexture(primitiveInfo, pinfoPixels, 1, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        dt.flipY = false;
        dt.needsUpdate = true;

        this.fShader = this.makeFragmentShader(numPrimitives, pinfoPixels);

        this.vShader = [
            'varying vec4 vPosition;',
            'varying vec3 vNormal;',
            'void main() {',
                'vPosition = modelMatrix * vec4(position, 1.0);',
                'vNormal = normal;',
                'gl_Position = ',
                    'projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            '}'].join('\n');


        this.uniforms = {};

        this.uniforms.lightsource = { type: 'v3', value: new THREE.Vector3(this._lightPosition[0], this._lightPosition[1], this._lightPosition[2]) };
        this.uniforms.lightIntensity = { type: 'f', value: this._lightIntensity };
        this.uniforms.ambientIntensity = { type: 'f', value: this._ambientIntensity };

        this.uniforms.xBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.yBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };
        this.uniforms.zBounds = { type: 'v2', value: new THREE.Vector2(-1, 1) };

        // Texture storing pointers in to the primitiveInfo texture (1 pixel = 1 ptr (1 primitive))
        this.uniforms.primitive_ptrs = { type: 't', value: dtPtr };
        // Texture storing info about each primitive
        this.uniforms.primitive_info = { type: 't', value: dt };

        this.material = new THREE.ShaderMaterial({
            uniforms:       this.uniforms,
            vertexShader:   this.vShader,
            fragmentShader: this.fShader,
            side:           THREE.DoubleSide,
            shading:        THREE.SmoothShading,
        });

        this.box = new Box('plot', [10, 10, 10], { material: this.material });

        this.world.addEntity(this.box);

        this.world.go();

        $(window).resize(() => this.world.setSize());

        this._initialized = true;
    }

    makeFragmentShader(ptrsSize, piSize) {
        /* eslint indent: "off", max-len: "off" */

        const fShader = [
            'varying vec4 vPosition;',
            'uniform vec3 lightsource;',
            'uniform float lightIntensity;',
            'uniform float ambientIntensity;',
            'uniform vec2 xBounds;',
            'uniform vec2 yBounds;',
            'uniform vec2 zBounds;',
            'uniform sampler2D primitive_ptrs;',
            'uniform sampler2D primitive_info;',

            'const int MAX_BOUNCES = 4;',

            `const int POINTERS_SIZE = ${ptrsSize};`,
            `const int PI_SIZE = ${piSize};`,

            'const float PIXEL_WIDTH_PTRS = 1./float(POINTERS_SIZE);',
            'const float PIXEL_WIDTH_INFO = 1./float(PI_SIZE);',

            'float refractionIndex = 1.;',

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

                'if (t < 0. || dot(N, -rd) < 0.) { return -1.; }',
                'else {',
                    'vec3 v1 = cross(a - pt, b - pt);',
                    'vec3 v2 = cross(b - pt, c - pt);',
                    'vec3 v3 = cross(c - pt, a - pt);',
                    'if (dot(v1, v2) >= 0. && dot(v2,v3) >= 0. && dot(v3,v1) >= 0.) { return t; }',
                    'else { return -1.; }',
                '}',
            '}',

            'bool isInShadow(in vec3 p, in int pid) {',

                'float pIdx;',
                'vec4 pInfo;',
                'vec3 ro = p;',
                'vec3 rd = lightsource-p;',
                'float len_rd = length(rd);',
                'vec3 rdN = normalize(lightsource-p);',
                'for (int i = 0; i < POINTERS_SIZE; i++) {',
                    'if (i == pid) { continue; }',
                    'float t = -1.;',

                    'pIdx = texture2D(primitive_ptrs, vec2((float(i)+0.5)*PIXEL_WIDTH_PTRS, 0.5)).r;',
                    'pInfo = texture2D(primitive_info, vec2((pIdx+0.5)*PIXEL_WIDTH_INFO, 0.5));',

                    'if (pInfo.r < 0.5) {',
                        'vec3 a = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                        'vec3 b = texture2D(primitive_info, vec2((pIdx+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                        'vec3 c = texture2D(primitive_info, vec2((pIdx+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                        't = intersectTriangle(a, b, c, ro, rdN);',

                    '} else if (pInfo.r >= 0.5) {',
                        'vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5));',
                        't = intersectSphere(c_and_r.xyz, c_and_r.a, ro, rdN);',
                    '}',
                    'if (t > 0.+1e-3 && t < len_rd && !(pInfo.g == 2.)) {',
                        'return true;',
                    '}',
                '}',
                'return false;',
            '}',


            'void intersect(in vec3 ro, in vec3 rd, inout vec3 total_color) {',

                'vec3 normal;',
                'vec3 p;',
                'int pid = -1;',
                'int except = -1;',
                'float min_t = 1000000.;',
                'float pIdx;',
                'float pIdx_min;',
                'vec4 pInfo;',
                'vec4 pInfo_min;',

                'int refracted_pid = -1;',

                'for (int b = 0; b < MAX_BOUNCES; b++) {',


                    // 1. Calculate intersected primitive
                    'for (int i = 0; i < POINTERS_SIZE; i++) {',
                        'float t = -1.;',

                        'pIdx = texture2D(primitive_ptrs, vec2((float(i)+0.5)*PIXEL_WIDTH_PTRS, 0.5)).r;',
                        'pInfo = texture2D(primitive_info, vec2((pIdx+0.5)*PIXEL_WIDTH_INFO, 0.5));',

                        'if (pInfo.r < 0.5) {',
                            'vec3 a = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 b = texture2D(primitive_info, vec2((pIdx+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            't = intersectTriangle(a, b, c, ro, rd);',

                        '} else if (pInfo.r >= 0.5) {',
                            'vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5));',
                            't = intersectSphere(c_and_r.xyz, c_and_r.a, ro, rd);',
                        '}',
                        'if (t > 0.+1e-3 && t < min_t && i != except) {',
                            'pid = i;',
                            'min_t = t;',
                            'pIdx_min = pIdx;',
                            'pInfo_min = pInfo;',
                        '}',
                    '}',

                    // 2. Calculate color from _this_ primitive
                    'if (pid == -1) {',
                        'total_color = vec3(1.,1.,1.) + total_color;',
                        'return;',
                    '} else {',
                        'p = ro + min_t*rd;',

                        'if (pInfo_min.r < 0.5) {',
                            'vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'normal = cross(b - a, c - a);',
                        '} else if (pInfo_min.r > 0.5) {',
                            'vec4 c_and_r = texture2D(primitive_info, vec2((pIdx_min+3.5)*PIXEL_WIDTH_INFO, 0.5));',
                            'normal = p - c_and_r.xyz;',
                        '}',

                        'vec4 a_and_sk = texture2D(primitive_info, vec2((pIdx_min+1.5)*PIXEL_WIDTH_INFO, 0.5));',
                        'vec4 d_and_sn = texture2D(primitive_info, vec2((pIdx_min+2.5)*PIXEL_WIDTH_INFO, 0.5));',
                        'vec3 ambientColor = a_and_sk.rgb;',
                        'vec3 diffuseColor = d_and_sn.rgb;',
                        'float specular_k = a_and_sk.a;',
                        'float specular_n = d_and_sn.a;',

                        'vec3 N = normalize(normal);',
                        'vec3 L = normalize(lightsource - p);',
                        'vec3 V = normalize(-rd);',
                        'if (dot(V, N) < 0.) { N = -N; }',
                        'vec3 H = normalize(V + L);',
                        'vec3 r = -L + 2.*dot(L, N)*N;',

                        // Is in shadow...
                        'vec3 A = ambientIntensity*ambientColor;',
                        'if (dot(N, L) < 0. || isInShadow(p, pid)) {',
                            'total_color = A + total_color;',
                        '} else {',
                            'vec3 D = diffuseColor * max(dot(N, L), 0.);',
                            'vec3 S = specular_k*vec3(pow(max(1e-5,dot(r,V)), specular_n));',
                            'total_color = (lightIntensity*(D+S) + A) + total_color;',
                        '}',
                    '}',


                    // 3. If mirror, calculate the new rd, ro, and keep bouncing.
                    // otherwise return the current color
                    'if (pInfo_min.g == 1.) {',
                        'ro = ro + min_t*rd;',
                        'except = pid;',
                        'pid = -1;',
                        'min_t = 100000.;',
                        // sphere case
                        'if (pInfo_min.r > 0.5) {',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'normal = normalize(ro-c);',
                        '} else if (pInfo_min.r < 0.5) {',
                            'vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'normal = normalize(cross(b - a, c - a));',
                        '}',
                        'rd = rd - 2.*normal * dot(rd, normal);',
                    '} else if (pInfo_min.g == 2.) {',
                        // if glass, calculate refracted rd, ro, and keep bouncing
                        // store the refraction index

                        'float ri_new;', // refraction index of next primitive (or air if exiting a primitive)

                        'if (refracted_pid == pid) {',
                            'ri_new = 1.;', // back to air
                        '} else {',
                            'ri_new = pInfo_min.b;',
                        '}',

                        'ro = ro + min_t*rd;',
                        'refracted_pid = pid;',
                        'pid = -1;',
                        'except = -1;',
                        'min_t = 100000.;',

                        'if (pInfo_min.r > 0.5) {',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'normal = normalize(ro-c);',
                        '} else if (pInfo_min.r < 0.5) {',
                            'vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;',
                            'normal = normalize(cross(b - a, c - a));',
                        '}',

                        'if (dot(normal, rd) >= 0.) { normal = -normal; }',

                        'rd = refract(rd, normal, refractionIndex/ri_new);',
                        'ro = ro + rd * 0.001;',

                        'refractionIndex = ri_new;',

                    '} else {',
                        'return;',
                    '}',

                '}',
            '}',

            'void main() {',

                'vec3 ro = cameraPosition;',
                'vec3 dir = vPosition.xyz - ro;',
                'float t_entry = length(dir);',
                'vec3 rd = normalize(dir);',

                'if (t_entry < 0.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }',


                'vec3 color = vec3(0.,0.,0.);',
                'intersect(ro, rd, color);',
                'gl_FragColor = vec4(color, 1.0);',

            '}'].join('\n');

        return fShader;
    }
}

export default Raytracer;
