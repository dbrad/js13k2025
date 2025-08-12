import mainFragment from "@shaders/main.frag";
import mainVertex from "@shaders/main.vert";
import { assert } from "@debug";

let glContext: WebGL2RenderingContext;

let VERTEX_SIZE: number = (4 * 2 * 4) + 4;
let MAX_BATCH: number = 10922;
let VERTICES_PER_QUAD: number = 6;
let VERTEX_DATA_SIZE: number = VERTEX_SIZE * MAX_BATCH * 4;
let INDEX_DATA_SIZE: number = MAX_BATCH * (2 * VERTICES_PER_QUAD);

let mainProgram: WebGLShader;
let locPositionAttr: number;
let locTranslateAttr: number;
let locScaleAttr: number;
let locUVAttr: number;
let locColourAttr: number;
let locTextureUniform: WebGLUniformLocation | null;

let vertexData: ArrayBuffer = new ArrayBuffer(VERTEX_DATA_SIZE);
let positionData: Float32Array = new Float32Array(vertexData);
let colourData: Uint32Array = new Uint32Array(vertexData);
let indexData: Uint16Array = new Uint16Array(INDEX_DATA_SIZE);

let indexBuffer: WebGLBuffer;
let vertexBuffer: WebGLBuffer;
let batchCount: number = 0;

let compileShader = (source: string, type: number): WebGLShader => {
    let shader = glContext.createShader(type);
    assert(shader !== null, "unable to created shader");
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);
    return shader;
};

let createShaderProgram = (vsSource: string, fsSource: string): WebGLProgram => {
    let program = glContext.createProgram();
    assert(program !== null, "unable to created program");
    let vShader: WebGLShader = compileShader(vsSource, GL_VERTEX_SHADER);
    let fShader: WebGLShader = compileShader(fsSource, GL_FRAGMENT_SHADER);
    glContext.attachShader(program, vShader);
    glContext.attachShader(program, fShader);
    glContext.linkProgram(program);
    return program;
};

let createBuffer = (bufferType: number, size: number, usage: number): WebGLBuffer => {
    let buffer = glContext.createBuffer();
    assert(buffer !== null, "unable to created buffer");
    glContext.bindBuffer(bufferType, buffer);
    glContext.bufferData(bufferType, size, usage);
    return buffer;
};

export let glInit = (canvas: HTMLCanvasElement) => {
    let ctx = canvas.getContext("webgl2");
    assert(ctx !== null, "failed to get webgl2 context");
    glContext = ctx;

    mainProgram = createShaderProgram(mainVertex, mainFragment);
    glContext.useProgram(mainProgram);

    for (let indexA: number = 0, indexB: number = 0; indexA < MAX_BATCH * VERTICES_PER_QUAD; indexA += VERTICES_PER_QUAD, indexB += 4) {
        indexData[indexA + 0] = indexB;
        indexData[indexA + 1] = indexB + 1;
        indexData[indexA + 2] = indexB + 2;
        indexData[indexA + 3] = indexB + 0;
        indexData[indexA + 4] = indexB + 3;
        indexData[indexA + 5] = indexB + 1;
    }

    indexBuffer = createBuffer(GL_ELEMENT_ARRAY_BUFFER, indexData.byteLength, GL_STATIC_DRAW);
    glContext.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, 0, indexData);

    vertexBuffer = createBuffer(GL_ARRAY_BUFFER, vertexData.byteLength, GL_DYNAMIC_DRAW);

    glContext.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glContext.enable(GL_BLEND);

    locPositionAttr = glContext.getAttribLocation(mainProgram, "p");
    locTranslateAttr = glContext.getAttribLocation(mainProgram, "t");
    locScaleAttr = glContext.getAttribLocation(mainProgram, "s");
    locUVAttr = glContext.getAttribLocation(mainProgram, "u");
    locColourAttr = glContext.getAttribLocation(mainProgram, "c");

    locTextureUniform = glContext.getUniformLocation(mainProgram, "g");

    glContext.activeTexture(GL_TEXTURE0);
    glContext.viewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    glContext.useProgram(mainProgram);

    glContext.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
    glContext.bindBuffer(GL_ARRAY_BUFFER, vertexBuffer);

    glContext.vertexAttribPointer(locPositionAttr, 2, GL_FLOAT, false, VERTEX_SIZE, 0);
    glContext.enableVertexAttribArray(locPositionAttr);

    glContext.vertexAttribPointer(locTranslateAttr, 2, GL_FLOAT, false, VERTEX_SIZE, 8);
    glContext.enableVertexAttribArray(locTranslateAttr);

    glContext.vertexAttribPointer(locScaleAttr, 2, GL_FLOAT, false, VERTEX_SIZE, 16);
    glContext.enableVertexAttribArray(locScaleAttr);

    glContext.vertexAttribPointer(locUVAttr, 2, GL_FLOAT, false, VERTEX_SIZE, 24);
    glContext.enableVertexAttribArray(locUVAttr);

    glContext.vertexAttribPointer(locColourAttr, 4, GL_UNSIGNED_BYTE, true, VERTEX_SIZE, 32);
    glContext.enableVertexAttribArray(locColourAttr);

    glContext.uniform1i(locTextureUniform, 0);
};

export let glUploadAtlas = (image: TexImageSource): void => {
    glContext.activeTexture(GL_TEXTURE0);
    let texture = glContext.createTexture();
    assert(texture !== null, "Unable to create texture.");
    glContext.bindTexture(GL_TEXTURE_2D, texture);
    glContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, image);
};

export let glSetClearColour = (r: number, g: number, b: number): void => {
    glContext.clearColor(r, g, b, 1);
};

export let glFlush = (): void => {
    if (batchCount > 0) {
        glContext.bufferSubData(GL_ARRAY_BUFFER, 0, positionData.subarray(0, batchCount * VERTEX_SIZE));
        glContext.drawElements(GL_TRIANGLES, batchCount * VERTICES_PER_QUAD, GL_UNSIGNED_SHORT, 0);
        batchCount = 0;
    }
};

export let glClear = (): void => {
    glContext.clear(GL_COLOR_BUFFER_BIT);
};

export let glPushQuad = (x: number, y: number, w: number, h: number, tx: number, ty: number, sx: number, sy: number, u0: number, v0: number, u1: number, v1: number, colour: number): void => {
    if (batchCount + 1 >= MAX_BATCH) {
        glContext.bufferSubData(GL_ARRAY_BUFFER, 0, vertexData);
        glContext.drawElements(GL_TRIANGLES, batchCount * VERTICES_PER_QUAD, GL_UNSIGNED_SHORT, 0);
        batchCount = 0;
    }

    let offset: number = batchCount * VERTEX_SIZE;

    // Vertex Order
    // Vertex Position | Translation | Scale | UV | ABGR
    // Vertex 1
    positionData[offset++] = x;
    positionData[offset++] = y;
    positionData[offset++] = tx;
    positionData[offset++] = ty;
    positionData[offset++] = sx;
    positionData[offset++] = sy;
    positionData[offset++] = u0;
    positionData[offset++] = v0;
    colourData[offset++] = colour;

    // Vertex 2
    positionData[offset++] = x + w;
    positionData[offset++] = y + h;
    positionData[offset++] = tx;
    positionData[offset++] = ty;
    positionData[offset++] = sx;
    positionData[offset++] = sy;
    positionData[offset++] = u1;
    positionData[offset++] = v1;
    colourData[offset++] = colour;

    // Vertex 3
    positionData[offset++] = x;
    positionData[offset++] = y + h;
    positionData[offset++] = tx;
    positionData[offset++] = ty;
    positionData[offset++] = sx;
    positionData[offset++] = sy;
    positionData[offset++] = u0;
    positionData[offset++] = v1;
    colourData[offset++] = colour;

    // Vertex 4
    positionData[offset++] = x + w;
    positionData[offset++] = y;
    positionData[offset++] = tx;
    positionData[offset++] = ty;
    positionData[offset++] = sx;
    positionData[offset++] = sy;
    positionData[offset++] = u1;
    positionData[offset++] = v0;
    colourData[offset++] = colour;

    if (++batchCount >= MAX_BATCH) {
        glContext.bufferSubData(GL_ARRAY_BUFFER, 0, vertexData);
        glContext.drawElements(GL_TRIANGLES, batchCount * VERTICES_PER_QUAD, GL_UNSIGNED_SHORT, 0);
        batchCount = 0;
    }
};
