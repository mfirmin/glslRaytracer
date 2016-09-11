var Raytracer = (function () {
    'use strict';

    function Entity(name, opts) {

        this.name = name;

        this.position = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.mesh = null;

        this.opts = (opts === undefined) ? {} : opts;

        this.initialize();

        this.mesh.matrixAutoUpdate = false;
    }


    Entity.prototype.constructor = Entity;

    Entity.prototype.initialize = function() {
        var rot = (this.opts.default_rotation === undefined) ? [0,0,0,0] : this.opts.default_rotation;

        this.default_rotation = new THREE.Quaternion();

        this.default_rotation.w = rot[0];
        this.default_rotation.x = rot[1];
        this.default_rotation.y = rot[2];
        this.default_rotation.z = rot[3];

    }

    Entity.prototype.setMfromQandP = function(q_in,p) {

        var quat = new THREE.Quaternion();
        quat.x = q_in[1]//q_in[1];
        quat.y = q_in[2] //q_in[0];
        quat.z = q_in[3]// q_in[0];
        quat.w = q_in[0];

        quat.multiply(this.default_rotation);

        var q = {w: quat.w, v: {x: quat.x, y: quat.y, z: quat.z}};
        var pos = {x: p[0], y: p[1], z: p[2]};

        var R = new Float32Array(9);
        var M = new Float32Array(16);
        R[0] = 1 - 2*q.v.y*q.v.y - 2*q.v.z*q.v.z; R[3] = 2*q.v.x*q.v.y - 2*q.v.z*q.w;     R[6] = 2*q.v.x*q.v.z + 2*q.v.y*q.w;
        R[1] = 2*q.v.x*q.v.y + 2*q.v.z*q.w;     R[4] = 1 - 2*q.v.x*q.v.x - 2*q.v.z*q.v.z; R[7] = 2*q.v.y*q.v.z - 2*q.v.x*q.w;
        R[2] = 2*q.v.x*q.v.z - 2*q.v.y*q.w;     R[5] = 2*q.v.y*q.v.z + 2*q.v.x*q.w;     R[8] = 1 - 2*q.v.x*q.v.x - 2*q.v.y*q.v.y;

        this.mesh.matrix.elements[0] = R[0]; this.mesh.matrix.elements[4] = R[3]; this.mesh.matrix.elements[8] =  R[6];  this.mesh.matrix.elements[12] = pos.x;
        this.mesh.matrix.elements[1] = R[1]; this.mesh.matrix.elements[5] = R[4]; this.mesh.matrix.elements[9] =  R[7];  this.mesh.matrix.elements[13] = pos.y;
        this.mesh.matrix.elements[2] = R[2]; this.mesh.matrix.elements[6] = R[5]; this.mesh.matrix.elements[10] = R[8];  this.mesh.matrix.elements[14] = pos.z;
        this.mesh.matrix.elements[3] = 0;    this.mesh.matrix.elements[7] = 0;    this.mesh.matrix.elements[11] = 0;     this.mesh.matrix.elements[15] = 1;


    }

    Entity.prototype.setPosition = function(xyz) {
        this.mesh.position.x = xyz[0];
        this.mesh.position.y = xyz[1];
        this.mesh.position.z = xyz[2];

    }
    // TODO: Make this work.
    Entity.prototype.setRotation = function(q) {
        /*

        var quat = new THREE.Quaternion();
        quat.x = q[1]//q[1];
        quat.y =q[2] //q[0];
        quat.z =q[3]// q[0];
        quat.w = q[0];
        quat.normalize();
        this.mesh.quaternion = quat;
        this.mesh.updateMatrix();

        console.log(this.mesh.matrix);

    //    this.mesh.rotation.x = Math.PI/4.;
    */

    }

    Entity.prototype.getPosition = function() {
        return this.position;
    }
    Entity.prototype.getRotation = function() {
        return this.rotation;
    }

    function Box(name, sides, opts) {

        this.sides = sides;
        Entity.call(this, name, opts);
    }


    Box.prototype = Object.create(Entity.prototype);

    Box.prototype.constructor = Box;

    Box.prototype.initialize = function() {

        Entity.prototype.initialize.call(this);

        var c = (this.opts.color === undefined) ? [130,130,130] : this.opts.color;
        var cstring = 'rgb(' + c[0] + ','+ c[1]  + ',' + c[2]  + ')';
        var color = new THREE.Color(cstring);

        var geo = new THREE.BoxGeometry(this.sides[0], this.sides[1], this.sides[2]);
        var mat;
        if (this.opts.material === undefined) {
            mat = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: cstring, specular: 0x030303, shininess: 10, shading: THREE.SmoothShading } );
        } else {
            mat = this.opts.material;
        }

        var mesh = new THREE.Mesh( geo , mat );

        this.mesh = mesh;

    }

    function Cylinder(name, radius, height, opts) {

        this.radius = radius;
        this.height = height;
        Entity.call(this, name, opts);
    }

    Cylinder.prototype = Object.create(Entity.prototype);

    Cylinder.prototype.constructor = Cylinder;

    Cylinder.prototype.initialize = function() {

        Entity.prototype.initialize.call(this);

        var c = (this.opts.color === undefined) ? [130,130,130] : this.opts.color;
        var cstring = 'rgb(' + c[0] + ','+ c[1]  + ',' + c[2]  + ')';
        var color = new THREE.Color(cstring);

        var geo = new THREE.CylinderGeometry(this.radius, this.radius, this.height);

        var mat = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: cstring, specular: 0x030303, shininess: 10, shading: THREE.SmoothShading} );
        var mesh = new THREE.Mesh( geo , mat );

        this.mesh = mesh;

    }

    function Sphere(name, radius, height, opts) {

        this.radius = radius;
        Entity.call(this, name, opts);

    }

    Sphere.prototype = Object.create(Entity.prototype);

    Sphere.prototype.constructor = Sphere;

    Sphere.prototype.initialize = function() {

        Entity.prototype.initialize.call(this);

        var c = (this.opts.color === undefined) ? [130,130,130] : this.opts.color;
        var cstring = 'rgb(' + c[0] + ','+ c[1]  + ',' + c[2]  + ')';
        var color = new THREE.Color(cstring);

        var geo = new THREE.SphereGeometry(this.radius);

        var mat = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: cstring, specular: 0x030303, shininess: 10, shading: THREE.SmoothShading} );
        var mesh = new THREE.Mesh( geo , mat );

        this.mesh = mesh;

    }

    function Capsule(name, radius, height, opts) {

        this.radius = radius;
        this.height = height;
        Entity.call(this, name, opts);
    }

    Capsule.prototype = Object.create(Entity.prototype);

    Capsule.prototype.constructor = Capsule;

    Capsule.prototype.initialize = function() {

        Entity.prototype.initialize.call(this);

        var c = (this.opts.color === undefined) ? [130,130,130] : this.opts.color;
        var cstring = 'rgb(' + c[0] + ','+ c[1]  + ',' + c[2]  + ')';
        var color = new THREE.Color(cstring);

        var capsule = new THREE.Object3D();

        var cyl_geo = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 8, 1, true);
        var sph_geo= new THREE.SphereGeometry(this.radius);
        var mat = new THREE.MeshPhongMaterial( { ambient: 0x030303, color: cstring, specular: 0x030303, shininess: 10, shading: THREE.SmoothShading} );

        var cyl_mesh = new THREE.Mesh( cyl_geo , mat );
        var top_mesh = new THREE.Mesh( sph_geo , mat );
        var btm_mesh = new THREE.Mesh( sph_geo , mat );

        top_mesh.position.y = this.height/2.;
        btm_mesh.position.y = -this.height/2.;

        capsule.add(cyl_mesh);
        capsule.add(top_mesh);
        capsule.add(btm_mesh);

        this.mesh = capsule;

    }

    function Plane(name, A, B, opts) {

        this.A = A;
        this.B = B;
        Entity.call(this, name, opts);
    }


    Plane.prototype = Object.create(Entity.prototype);

    Plane.prototype.constructor = Plane;

    Plane.prototype.initialize = function() {

        Entity.prototype.initialize.call(this);

        var c = (this.opts.color === undefined) ? [130,130,130] : this.opts.color;
        var cstring = 'rgb(' + c[0] + ','+ c[1]  + ',' + c[2]  + ')';
        var color = new THREE.Color(cstring);

        var geo = new THREE.Geometry();
        var mat = new THREE.LineBasicMaterial( {color: color} );

        geo.vertices.push(
            new THREE.Vector3(this.A[0], this.A[1], this.A[2]),
            new THREE.Vector3(this.B[0], this.B[1], this.B[2])
        );
        var mesh = new THREE.Line( geo , mat );

        this.mesh = mesh;

    }

    function World(name, opts) {

        this.name = name;
        this.opts = (opts === undefined) ? {} : opts;
        this.initializeGL();
        this.initialize();
        this.initializeDiv();
        this.paused = true;

        this.entities = {};

        this.renderReady = true;
    }


    World.prototype.constructor = World;

    World.prototype.initializeGL = function() {
        try{
            this.renderer = new THREE.WebGLRenderer({
                preserveDrawingBuffer: true,
                premultipliedAlpha: false,
                antialias: true,
            });
            this.renderType = 'webgl';
        }catch(e){
            try{
                this.renderer = new THREE.CanvasRenderer();
                this.renderType = 'canvas';
            }catch(e2){
                this.error = true;
                return;
            }
        }
        this.error = false;

        if (!this.renderer.getContext().getExtension('OES_texture_float')) {
            console.warn('BROWSER DOES NOT SUPPORT OES FLOAT TEXTURES');
        }

        this.renderer.setClearColor(0xffffff, 1);
    }

    World.prototype.initialize = function() {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 400/400, 1, 1000);
        this.scene.add(this.camera);
        this.light = new THREE.PointLight( 0xfffffa, 1, 0 );
        this.light.position.set( 1, 20, -20 );
        this.scene.add( this.light );

        /*
        this.camera.position.x = -0;
        this.camera.position.y = -5;
        */
        this.camera.position.z = 20;

        $(document).ready(function() {
    //        controls = new THREE.TrackballControls( this.camera, this.renderer.domElement);
            var controls = new THREE.TrackballControls( this.camera, (this.opts.element === undefined) ? $('body') : $(this.opts.element)[0]);

            controls.rotateSpeed = 20.0;
            controls.zoomSpeed = 1.2;

            controls.noZoom = false;

            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;

            this.controls = controls;
        }.bind(this));
    };

    World.prototype.initializeDiv = function() {

        this.panel = $('<div>')
            .addClass('ThreePanel')
            .attr({tabindex:0});

        this.renderer.setSize(400,400);

        this.canvas = $(this.renderer.domElement).width(400).height(400).addClass("threeCanvas");
        $(this.panel).append(this.canvas);

    };

    World.prototype.setSize = function() {

        var w = $(this.opts.element).width();
        var h = $(this.opts.element).height();

        this.canvas.width(w);
        this.canvas.height(h);

        this.renderer.setSize(w, h);

        this.camera.aspect = w/h;
        this.camera.updateProjectionMatrix();

    //    this.panel.css({width: w, height: h});
    };

    World.prototype.addEntity = function(e) {

        var name = e.name;
        if (name in this.entities) {
            console.error('Cannot add entity. Entity with name ' + name + 'already exists.');
            return -1;
        }

        this.entities[name] = e;

        this.scene.add(e.mesh);

    }

    World.prototype.removeEntity = function(e) {
        if (this.entities[e.name] === undefined) {
            return;
        }
        this.scene.remove(e.mesh);
        delete this.entities[e.name];
    }

    World.prototype.setFromJSON = function(data) {
        var entities = data.entities;
        for (var e in entities) {
            var ent = this.entities[e];
            if (ent !== undefined) {
                ent.setMfromQandP(entities[e].rot, entities[e].pos);
                /*
                ent.setPosition(entities[e].pos);
                ent.setRotation(entities[e].rot);
                */
            } else {
                console.error('attempting to set unknown entity with name ' + e);
            }
        }
    }

    World.prototype.populateFromJSON = function(data) {

        var entities = data.entities;
        for (var e in entities) {

            var name = e;
            var type = entities[e].type;
            var toAdd;
            switch (type) {
                case 'box':
                    toAdd = new Box(name, entities[e].sides,{default_rotation: [.7071,.7071,0,0]});
                    break;
                case 'sphere':
                    toAdd = new Sphere(name, entities[e].radius,{default_rotation: [.7071,.7071,0,0]});
                    break;
                case 'cylinder':
                    toAdd = new Cylinder(name, entities[e].radius, entities[e].height,{default_rotation: [.7071,.7071,0,0]});
                    break;
                case 'capsule':
                    toAdd = new Capsule(name, entities[e].radius, entities[e].height,{default_rotation: [.7071,.7071,0,0]});
                    break;
                case 'plane':
                    toAdd = new Plane(name, entities[e].A, entities[e].B,{default_rotation: [.7071,.7071,0,0]});
                    break;
                default:
                    toAdd = null;
                    console.error('Unknown Entity: ' + name + ' with type: ' + type);
                    break;
            }

            if (toAdd != null) {
                toAdd.setMfromQandP(entities[e].rot, entities[e].pos);
                /*
                toAdd.setPosition(entities[e].pos);
                toAdd.setRotation(entities[e].rot);
                */
                this.addEntity(toAdd);
            }

        }

        return;
    }

    World.prototype.go = function() {

        var scope = this;


        function animate() {
            scope.renderer.render(scope.scene, scope.camera);
            if (scope.controls !== undefined) {
                scope.controls.update();
            }
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

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

    class Sphere$1 extends Primitive{
        constructor(center, radius, color, type, diffuse, specular) {
            super(color, type, diffuse, specular);
            this._center = center;
            this._radius = radius;
        }

        get center() {
            return this._center;
        }

        set center(c) {
            this._center = c;
        }

        get radius() {
            return this._radius;
        }

        set radius(r) {
            this._radius = r;
        }

    }

    class Triangle extends Primitive{
        constructor(a, b, c, color, type, diffuse, specular) {
            super(color, type, diffuse, specular);
            this._a = a;
            this._b = b;
            this._c = c;
        }

        get vertices() {
            return [a,b,c];
        }

        set vertices(v) {
            this._a = v[0];
            this._b = v[1];
            this._c = v[2];
        }

        get a() {
            return this._a;
        }

        set a(a) {
            this._a = a;
        }

        get b() {
            return this._b;
        }

        set b(b) {
            this._b = b;
        }

        get c() {
            return this._c;
        }

        set c(c) {
            this._c = c;
        }

    }

    const primitives = {
        'Primitive': Primitive,
        'Sphere': Sphere$1,
        'Triangle': Triangle,
    }

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

    const RT = { Raytracer, primitives };

    return RT;

}());