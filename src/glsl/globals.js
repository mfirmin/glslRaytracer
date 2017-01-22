

const sphereStruct = [
    'struct Sphere {',
        'vec3 center;',
        'float radius;',
    '}',
];

const triangleStruct = [
    'struct Triangle {',
        'vec3 A, B, C;',
    '}',
];

// Define box as two points, p0 and p1, where the box is the smallest axes-aligned box that
// contains both points

//   o-----1
//  /|    /|
// o-----o |
// | o---|-o
// |/    |/
// 0-----o

const boxStruct = [
    'struct Box {',
        'vec3 p0;',
        'vec3 p1;',
    '}',
];

const rayStruct = [
    'struct Ray {',
        'vec3 origin;',
        'vec3 direction;',
    '}',
];


const structs = {
    // primitives
    box:      boxStruct,
    sphere:   sphereStruct,
    triangle: triangleStruct,

    // other
    ray: rayStruct,
}

export default intersectFunctions;
