'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere;
let userPoint;
let magnit;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexTextureBuffer = gl.createBuffer();
    this.count = 0;
    this.textureCount = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.TextureBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.textureCount = vertices.length / 2;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
    this.DrawSphere = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribVertexTexture = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iTMU = -1;
    this.iUserPoint = -1;
    this.iMagnit = 1;
    this.iTranslateSphere = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(1., 1., 1., 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.uniform2fv(shProgram.iUserPoint, [userPoint.x, userPoint.y]);
    gl.uniform1f(shProgram.iMagnit, magnit);
    gl.uniform1f(shProgram.iB, -1);

    gl.uniform3fv(shProgram.iTranslateSphere, [-0., -0., -0.])
    surface.Draw();
    let translate = SnialSurfaceData(map(userPoint.x, 0, 1, -9, 9), map(userPoint.y, 0, 1, 1, 9))
    gl.uniform3fv(shProgram.iTranslateSphere, [translate.x, translate.y, translate.z])
    gl.uniform1f(shProgram.iB, 1);
    sphere.DrawSphere();
}

function CreateSurfaceData() {
    let vertexList = [];
    let u1 = 0;
    let v = -Math.PI;
    const LIMIT_U = Math.PI*2
    const LIMIT_V = Math.PI
    const INC = 0.25
    while (u1 < LIMIT_U) {
        while (v < LIMIT_V) {
            const v1 = SnialSurfaceData(u1, v);
            const v2 = SnialSurfaceData(u1 + INC, v);
            const v3 = SnialSurfaceData(u1, v + INC);
            const v4 = SnialSurfaceData(u1 + INC, v + INC);
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v2.x, v2.y, v2.z)
            vertexList.push(v4.x, v4.y, v4.z)
            vertexList.push(v3.x, v3.y, v3.z)
            v += INC
        }
        v = -Math.PI
        u1 += INC
    }
    return vertexList;
}
function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}
function CreateSurfaceTextureData() {
    let vertexTextureList = [];
    let u1 = 0;
    let v1 = -Math.PI;
    const LIMIT_U = Math.PI*2
    const LIMIT_V = Math.PI
    const INC = 0.25
    while (u1 < LIMIT_U) {
        while (v1 < LIMIT_V) {
            let u = map(u1, 0, LIMIT_U, 0, 1)
            let v = map(v1, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1 + INC, 0, LIMIT_U, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1, 0, LIMIT_U, 0, 1)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1 + INC, 0, LIMIT_U, 0, 1)
            v = map(v1, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            u = map(u1, 0, LIMIT_U, 0, 1)
            v = map(v1 + INC, -Math.PI, LIMIT_V, 0, 1)
            vertexTextureList.push(u, v)
            v1 += INC
        }
        v1 = -Math.PI
        u1 += INC
    }
    return vertexTextureList;
}

function SnialSurfaceData(u, v) {
    let x = 0.15 * u * Math.sin(u) * Math.cos(v)
    let y = 0.15 * u * Math.cos(u) * Math.cos(v)
    let z = -0.15 * u * Math.sin(v)
    return {
        x: x,
        y: y,
        z: z
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexTexture = gl.getAttribLocation(prog, "vertexTexture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iTMU = gl.getUniformLocation(prog, 'TMU');
    shProgram.iUserPoint = gl.getUniformLocation(prog, 'userPoint');;
    shProgram.iMagnit = gl.getUniformLocation(prog, 'magnit');
    shProgram.iTranslateSphere = gl.getUniformLocation(prog, 'translateSphere');
    shProgram.iB = gl.getUniformLocation(prog, 'b');

    LoadTexture()
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.TextureBufferData(CreateSurfaceTextureData());
    sphere = new Model('Sphere');
    sphere.BufferData(CreateSphereSurface())

    gl.enable(gl.DEPTH_TEST);
}

function CreateSphereSurface(r = 0.05) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceDate(r, lon, lat);
            let v2 = sphereSurfaceDate(r, lon + 0.5, lat);
            let v3 = sphereSurfaceDate(r, lon, lat + 0.5);
            let v4 = sphereSurfaceDate(r, lon + 0.5, lat + 0.5);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);
            lat += 0.5;
        }
        lat = -Math.PI * 0.5
        lon += 0.5;
    }
    return vertexList;
}

function sphereSurfaceDate(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    userPoint = { x: 0.7, y: 0.6 }
    magnit = 1.0;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';

    image.src = "https://raw.githubusercontent.com/minishmek/Labs_Vggi/CGW/12034.jpeg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}

onmousemove = (e) => {
    magnit = map(e.clientX, 0, window.outerWidth, 0, Math.PI)
    draw()
};
window.onkeydown = (e) => {
    switch (e.keyCode) {
        case 87:
            userPoint.y -= 0.01;
            break;
        case 83:
            userPoint.y += 0.01;
            break;
        case 65:
            userPoint.x += 0.01;
            break;
        case 68:
            userPoint.x -= 0.01;
            break;
    }
    console.log(userPoint)
    userPoint.x = Math.max(0.01, Math.min(userPoint.x, 0.999))
    userPoint.y = Math.max(0.01, Math.min(userPoint.y, 0.999))
    draw();
}