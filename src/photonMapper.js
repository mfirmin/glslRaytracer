import { dot, cross } from './math/vectorMath.js';

/* global THREE */

class PhotonMapper {
    constructor(numPhotons = 10000, maxBounces = 4) {
        this._numPhotons = numPhotons;
        this._MAX_BOUNCES = maxBounces
    }

    intersectSphere(center, radius, ro, rd) {
        let ro_c = ro - center;
        let C = dot(ro_c, ro_c) - radius*radius;
        let B = dot(ro_c*2., rd);
        let A = dot(rd, rd);
        let delta = B*B - 4.*A*C;

        if (delta < 0.) {
            return -1.;
        } else if (delta == 0.) {
            if (-B/(2.*A) < 0.) {
                return -1.;
            } else {
                return -B/(2.*A);
            }
        } else {
            sqrtDelta = sqrt(delta);
            first  = (-B + sqrtDelta)/(2.*A);
            second = (-B - sqrtDelta)/(2.*A);

            if (first >= 0. && second >= 0.) {
                if (first <= second) {
                    return first;
                } else {
                    return second;
                }
            } else if (first < 0. && second < 0.) {
                return -1.;
            } else {
                if (first < 0.) {
                    return second;
                } else {
                    return first;
                }
            }
        }

    }

    intersectTriangle(a, b, c, ro, rd) {
        let N = cross(b - a, c - a);
        let t = dot(a - ro, N) / dot(rd, N);
        let pt = ro + rd*t;

        if (t < 0. || dot(N, -rd) < 0.) {
            return -1.;
        } else {
            let v1 = cross(a - pt, b - pt);
            let v2 = cross(b - pt, c - pt);
            let v3 = cross(c - pt, a - pt);
            if (dot(v1, v2) >= 0. && dot(v2, v3) >= 0. && dot(v3, v1) >= 0.) {
                return t;
            }
            else {
                return -1.;
            }
        }
    }


    createPhotonMap(lightPosition, primitives) {
        /* eslint indent: "off", max-len: "off" */


            const PIXEL_WIDTH_PTRS = 1./POINTERS_SIZE;
            const PIXEL_WIDTH_INFO = 1./PI_SIZE;

            refractionIndex = 1.;


            bool isInShadow(in vec3 p, in int pid) {

                pIdx;
                vec4 pInfo;
                vec3 ro = p;
                vec3 rd = lightsource-p;
                len_rd = length(rd);
                vec3 rdN = normalize(lightsource-p);
                for (int i = 0; i < POINTERS_SIZE; i++) {
                    if (i == pid) { continue; }
                    t = -1.;

                    pIdx = texture2D(primitive_ptrs, vec2((float(i)+0.5)*PIXEL_WIDTH_PTRS, 0.5)).r;
                    pInfo = texture2D(primitive_info, vec2((pIdx+0.5)*PIXEL_WIDTH_INFO, 0.5));

                    if (pInfo.r < 0.5) {
                        vec3 a = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                        vec3 b = texture2D(primitive_info, vec2((pIdx+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                        vec3 c = texture2D(primitive_info, vec2((pIdx+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                        t = intersectTriangle(a, b, c, ro, rdN);

                    } else if (pInfo.r >= 0.5) {
                        vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5));
                        t = intersectSphere(c_and_r.xyz, c_and_r.a, ro, rdN);
                    }
                    if (t > 0.+1e-3 && t < len_rd && !(pInfo.g == 2.)) {
                        return true;
                    }
                }
                return false;
            }


            void intersect(in vec3 ro, in vec3 rd, inout vec3 total_color) {

                vec3 normal;
                vec3 p;
                int pid = -1;
                int except = -1;
                min_t = 1000000.;
                pIdx;
                pIdx_min;
                vec4 pInfo;
                vec4 pInfo_min;

                int refracted_pid = -1;

                for (int b = 0; b < MAX_BOUNCES; b++) {


                    // 1. Calculate intersected primitive
                    for (int i = 0; i < POINTERS_SIZE; i++) {
                        t = -1.;

                        pIdx = texture2D(primitive_ptrs, vec2((float(i)+0.5)*PIXEL_WIDTH_PTRS, 0.5)).r;
                        pInfo = texture2D(primitive_info, vec2((pIdx+0.5)*PIXEL_WIDTH_INFO, 0.5));

                        if (pInfo.r < 0.5) {
                            vec3 a = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 b = texture2D(primitive_info, vec2((pIdx+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 c = texture2D(primitive_info, vec2((pIdx+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            t = intersectTriangle(a, b, c, ro, rd);

                        } else if (pInfo.r >= 0.5) {
                            vec4 c_and_r = texture2D(primitive_info, vec2((pIdx+3.5)*PIXEL_WIDTH_INFO, 0.5));
                            t = intersectSphere(c_and_r.xyz, c_and_r.a, ro, rd);
                        }
                        if (t > 0.+1e-3 && t < min_t && i != except) {
                            pid = i;
                            min_t = t;
                            pIdx_min = pIdx;
                            pInfo_min = pInfo;
                        }
                    }

                    // 2. Calculate color from _this_ primitive
                    if (pid == -1) {
                        total_color = vec3(1.,1.,1.) + total_color;
                        return;
                    } else {
                        p = ro + min_t*rd;

                        if (pInfo_min.r < 0.5) {
                            vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            normal = cross(b - a, c - a);
                        } else if (pInfo_min.r > 0.5) {
                            vec4 c_and_r = texture2D(primitive_info, vec2((pIdx_min+3.5)*PIXEL_WIDTH_INFO, 0.5));
                            normal = p - c_and_r.xyz;
                        }

                        vec4 a_and_sk = texture2D(primitive_info, vec2((pIdx_min+1.5)*PIXEL_WIDTH_INFO, 0.5));
                        vec4 d_and_sn = texture2D(primitive_info, vec2((pIdx_min+2.5)*PIXEL_WIDTH_INFO, 0.5));
                        vec3 ambientColor = a_and_sk.rgb;
                        vec3 diffuseColor = d_and_sn.rgb;
                        specular_k = a_and_sk.a;
                        specular_n = d_and_sn.a;

                        vec3 N = normalize(normal);
                        vec3 L = normalize(lightsource - p);
                        vec3 V = normalize(-rd);
                        if (dot(V, N) < 0.) { N = -N; }
                        vec3 H = normalize(V + L);
                        vec3 r = -L + 2.*dot(L, N)*N;

                        // Is in shadow...
                        vec3 A = ambientIntensity*ambientColor;
                        if (dot(N, L) < 0. || isInShadow(p, pid)) {
                            total_color = A + total_color;
                        } else {
                            vec3 D = diffuseColor * max(dot(N, L), 0.);
                            vec3 S = specular_k*vec3(pow(max(1e-5,dot(r,V)), specular_n));
                            total_color = (lightIntensity*(D+S) + A) + total_color;
                        }
                    }


                    // 3. If mirror, calculate the new rd, ro, and keep bouncing.
                    // otherwise return the current color
                    if (pInfo_min.g == 1.) {
                        ro = ro + min_t*rd;
                        except = pid;
                        pid = -1;
                        min_t = 100000.;
                        // sphere case
                        if (pInfo_min.r > 0.5) {
                            vec3 c = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            normal = normalize(ro-c);
                        } else if (pInfo_min.r < 0.5) {
                            vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            normal = normalize(cross(b - a, c - a));
                        }
                        rd = rd - 2.*normal * dot(rd, normal);
                    } else if (pInfo_min.g == 2.) {
                        // if glass, calculate refracted rd, ro, and keep bouncing
                        // store the refraction index

                        ri_new;, // refraction index of next primitive (or air if exiting a primitive)

                        if (refracted_pid == pid) {
                            ri_new = 1.;, // back to air
                        } else {
                            ri_new = pInfo_min.b;
                        }

                        ro = ro + min_t*rd;
                        refracted_pid = pid;
                        pid = -1;
                        except = -1;
                        min_t = 100000.;

                        if (pInfo_min.r > 0.5) {
                            vec3 c = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            normal = normalize(ro-c);
                        } else if (pInfo_min.r < 0.5) {
                            vec3 a = texture2D(primitive_info, vec2((pIdx_min+3.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 b = texture2D(primitive_info, vec2((pIdx_min+4.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            vec3 c = texture2D(primitive_info, vec2((pIdx_min+5.+0.5)*PIXEL_WIDTH_INFO, 0.5)).xyz;
                            normal = normalize(cross(b - a, c - a));
                        }

                        if (dot(normal, rd) >= 0.) { normal = -normal; }

                        rd = refract(rd, normal, refractionIndex/ri_new);
                        ro = ro + rd * 0.001;

                        refractionIndex = ri_new;

                    } else {
                        return;
                    }

                }
            }

            void main() {

                vec3 ro = cameraPosition;
                vec3 dir = vPosition.xyz - ro;
                t_entry = length(dir);
                vec3 rd = normalize(dir);

                if (t_entry < 0.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }


                vec3 color = vec3(0.,0.,0.);
                intersect(ro, rd, color);
                gl_FragColor = vec4(color, 1.0);



        return fShader;
    }
}

export default PhotonMapper;
