/* eslint-disable indent */
const intersectSphere = [
    'float intersectSphere(Sphere sphere, Ray ray) {',
        'float A, B, C;',
        'vec3 c = sphere.center;',
        'float r = sphere.radius;',
        'vec3 ro = ray.origin;',
        'vec3 rd = ray.direction;',
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
].join('\n');

const intersectTriangle = [
    'float intersectTriangle(Triangle triangle, Ray ray) {',
        'vec3 a = triangle.A;',
        'vec3 b = triangle.B;',
        'vec3 c = triangle.C;',

        'vec3 ro = ray.origin;',
        'vec3 rd = ray.direction;',

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
].join('\n');

const intersectBox = [
    'float intersectBox(Box box, Ray ray) {',
        'vec3 p0 = box.p0;',
        'vec3 p1 = box.p1;',
        'float t0 = 0.0;',
        'float t1 = 100000.0;',

        // Intersect x slabs
        'float invRayDir = 1.0 / ray.direction.x;',

        'float tNear = (p0.x - ray.origin.x) * invRayDir;',
        'float tFar  = (p1.x - ray.origin.x) * invRayDir;',
        'float temp = min(tNear, tFar);',
        'tFar = max(tNear, tFar);',
        'tNear = temp;',

        't0 = mix(t0, tNear, step(0.5, float(tNear > t0)));',
        't1 = mix(t1, tFar, step(0.5, float(tFar < t1)));',
        'if (t0 > t1) { return -1.0; }',

        // Intersect y slabs
        'invRayDir = 1.0 / ray.direction.y;',

        'tNear = (p0.y - ray.origin.y) * invRayDir;',
        'tFar  = (p1.y - ray.origin.y) * invRayDir;',
        'temp = min(tNear, tFar);',
        'tFar = max(tNear, tFar);',
        'tNear = temp;',

        't0 = mix(t0, tNear, step(0.5, float(tNear > t0)));',
        't1 = mix(t1, tFar, step(0.5, float(tFar < t1)));',
        'if (t0 > t1) { return -1.0; }',

        // Intersect z slabs
        'invRayDir = 1.0 / ray.direction.z;',

        'tNear = (p0.z - ray.origin.z) * invRayDir;',
        'tFar  = (p1.z - ray.origin.z) * invRayDir;',
        'temp = min(tNear, tFar);',
        'tFar = max(tNear, tFar);',
        'tNear = temp;',

        't0 = mix(t0, tNear, step(0.5, float(tNear > t0)));',
        't1 = mix(t1, tFar, step(0.5, float(tFar < t1)));',
        'if (t0 > t1) { return -1.0; }',
        // Return t0 if it is positive (both points are in position ray dir)
        // otherwise return t1 (ray is inside box -OR- both points are behind ray)
        'return mix(t1, t0, step(0.5, float(t0 > 0.0)));',
    '}',
].join('\n');


const intersectFunctions = {
    intersectBox,
    intersectSphere,
    intersectTriangle,
};

export default intersectFunctions;
/* eslint-enable */
