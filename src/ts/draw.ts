import { assert } from "./__debug/debug";
import { thunder, zzfxPlay } from "./audio";
import { glClear, glFlush, glPushQuad } from "./gl";
import { clamp, floor, randInt } from "./math";
import { TEXTURE_CACHE } from "./texture";

// Colour
export let WHITE = 0xffffffff;

export let toABGR = (r: number, g: number, b: number, a: number): number => {
    let out = (0 | (clamp(a, 0, 255) & 0xff)) << 8 >>> 0;
    out = (out | (clamp(b, 0, 255) & 0xff)) << 8 >>> 0;
    out = (out | (clamp(g, 0, 255) & 0xff)) << 8 >>> 0;
    out = (out | (clamp(r, 0, 255) & 0xff)) >>> 0;
    return out;
};

export let setV4ToColour = (v: V4, c: number): void => {
    c >>>= 0;
    v[R] = c & 0xff;
    v[G] = (c & 0xff00) >>> 8;
    v[B] = (c & 0xff0000) >>> 16;
    v[A] = ((c & 0xff000000) >>> 24);
};

export let v4fToABGR = (colour: V4f): number => {
    let out = (0 | (colour[3] * 255 & 0xff)) << 8 >>> 0;
    out = (out | (colour[2] * 255 & 0xff)) << 8 >>> 0;
    out = (out | (colour[1] * 255 & 0xff)) << 8 >>> 0;
    out = (out | (colour[0] * 255 & 0xff)) >>> 0;
    return out;
};

// Animation Timing
let idleAnimationTimer = 0;
export let animationFrame = 0;
export let updateAnimationFrame = (delta: number): void => {
    idleAnimationTimer += delta;
    if (idleAnimationTimer > 500) {
        if (idleAnimationTimer > 1000) idleAnimationTimer = 0;
        idleAnimationTimer -= 500;
        animationFrame = ++animationFrame % 2;
    }
};

let nextInter = 1000;
let nextDur = 50;
export let lightningFlash = false;
export let updateLightning = (delta: number): void => {
    if (nextInter <= 0) {
        lightningFlash = true;
        if (nextDur <= 0) {
            zzfxPlay(thunder);
            lightningFlash = false;
            nextInter = randInt(50, 8000);
            nextDur = randInt(50, 200);
        } else {
            nextDur -= delta;
        }
    } else {
        nextInter -= delta;
    }
};

// Draw Queue
let drawQueue: DrawCall[] = [];
let index = 0;

export let initDrawQueue = (): void => {
    for (let i = 0; i < 25_000; i++) {
        drawQueue[i] = {
            x_: 0, y_: 0,
            w_: 0, h_: 0,
            sx_: 1, sy_: 1,
            u0_: 0, v0_: 0, u1_: 0, v1_: 0,
            colour_: 0,
            hFlip_: false, vFlip_: false,
        };
    }
};

let queueDraw = (x: number, y: number, w: number, h: number, sx: number, sy: number, u0: number, v0: number, u1: number, v1: number, colour: number, hFlip: boolean, vFlip: boolean) => {
    let call: DrawCall = drawQueue[index];
    call.x_ = x;
    call.y_ = y;
    call.w_ = w;
    call.h_ = h;
    call.sx_ = sx;
    call.sy_ = sy;
    call.u0_ = u0;
    call.v0_ = v0;
    call.u1_ = u1;
    call.v1_ = v1;
    call.colour_ = colour;
    call.hFlip_ = hFlip;
    call.vFlip_ = vFlip;
    index++;
};

export let clear = (): void => {
    index = 0;
};

export let render = (): void => {
    glClear();
    for (let i = 0; i < index; i++) {
        let call: DrawCall = drawQueue[i];
        let tx: number = 0,
            ty: number = 0;
        if (call.hFlip_) {
            tx = -call.w_;
            call.sx_ *= -1;
        }
        if (call.vFlip_) {
            ty = -call.h_;
            call.sy_ *= -1;
        }
        glPushQuad(
            tx, ty,
            call.w_, call.h_,
            call.x_, call.y_,
            call.sx_, call.sy_,
            call.u0_, call.v0_, call.u1_, call.v1_,
            call.colour_);
    }
    glFlush();
};

export let drawCount = (): number => {
    return index;
};

// Quads
export let pushQuad = (x: number, y: number, w: number, h: number, colour: number): void => {
    queueDraw(x, y, w, h, 1, 1, 2, 2, 2, 2, colour, false, false);
};

export let pushTexturedQuad = (textureId: number, x: number, y: number, scale: number = 1, colour: number = WHITE, hFlip: boolean = false, vFlip: boolean = false, idleAnimation: boolean = false, customAnimation: boolean = false): void => {
    let t = TEXTURE_CACHE[textureId + (customAnimation ? animationFrame : 0)];
    assert(t !== undefined, `missing texture id: ${textureId}`);
    queueDraw(
        x, y + (idleAnimation ? animationFrame : 0),
        t.w_, t.h_ - (idleAnimation ? animationFrame : 0),
        scale, scale,
        t.u0_, t.v0_, t.u1_, t.v1_ - (idleAnimation ? animationFrame * (1 / ATLAS_HEIGHT) : 0),
        colour,
        hFlip, vFlip
    );
};

// Text
export let characterCodeMap: { [key: string]: number; } = {};
export let pushText = (text: string | number, x: number, y: number, colour: number = WHITE, scale: number = 1, horizontalAlign: number = TEXT_ALIGN_LEFT, verticalAlign: number = TEXT_ALIGN_TOP): void => {
    text = (text + "").toUpperCase();
    let letterSize: number = 8 * scale;
    let lineHeight: number = letterSize + (scale * 2);
    let lines: string[] = text.split("|");
    let lineCount: number = lines.length;
    let totalHeight: number = (letterSize * lineCount) + ((scale * 2) * (lineCount - 1));
    let xOffset: number = 0;
    let yOffset: number = verticalAlign === TEXT_ALIGN_MIDDLE ? floor(totalHeight / 2) : verticalAlign === TEXT_ALIGN_BOTTOM ? totalHeight : 0;
    let alignmentOffset: number = 0;
    let characterCount: number = 0;
    let lineWidth: number = 0;

    for (let i = 0; i < lineCount; i++) {
        let line = lines[i];
        characterCount = line.length;
        lineWidth = characterCount * letterSize;
        if (horizontalAlign === TEXT_ALIGN_CENTER) {
            alignmentOffset = floor(lineWidth / 2);
        }
        else if (horizontalAlign === TEXT_ALIGN_RIGHT) {
            alignmentOffset = lineWidth;
        }

        for (let j = 0; j < characterCount; j++) {
            let letter = line[j];
            if (letter !== " ") {
                assert(characterCodeMap[letter] !== undefined, `undefined character ${letter} used.`);
                let t = TEXTURE_CACHE[100 + characterCodeMap[letter]];
                queueDraw(
                    x + xOffset - alignmentOffset, y - yOffset,
                    t.w_, t.h_,
                    scale, scale,
                    t.u0_, t.v0_, t.u1_, t.v1_,
                    colour,
                    false, false
                );
            }
            xOffset += letterSize;
        }
        y += lineHeight;
        xOffset = 0;
    }
};
