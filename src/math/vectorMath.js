
export const dot = function dot(a, b) {
    return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
};

export const cross = function cross(a, b) {
    return [
        +((a[1] * b[2]) - (a[2] * b[1])),
        -((a[0] * b[2]) - (a[2] * b[0])),
        +((a[0] * b[1]) - (a[1] * b[0])),
    ];
};
