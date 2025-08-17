import { cameraPos } from "./camera";
import { pushQuad, pushTexturedQuad, v4fToABGR } from "./draw";
import { clamp, floor, lerp, math, setV2, setV4fFromV4f, v4f } from "./math";

type ParticleParameters = {
    position_: V2;
    velocity_: V2;
    velocityVariation_: V2;

    sizeBegin_: number;
    sizeEnd_: number;
    sizeVariation_: number;

    colourBegin_: V4f;
    colourEnd_: V4f;

    lifetime_: number;
};

let particlePosition: V2[] = [];
let screenPosition: V2[] = [];
let particleVelocity: V2[] = [];

let particleSizeBegin: number[] = [];
let particleSizeEnd: number[] = [];
let particleSize: number[] = [];

let particleColourBegin: V4f[] = [];
let particleColourEnd: V4f[] = [];
let particleColourRaw: V4f[] = [];
let particleColour: number[] = [];

let particleLifetime: number[] = [];
let particleLifetimeRemaining: number[] = [];

let particlePoolSize: number = 10_000;
let particlePoolIndex = particlePoolSize - 1;

export let catParticle: ParticleParameters = {
    position_: [0, 0],
    velocity_: [0, 0],
    velocityVariation_: [50, 50],
    sizeBegin_: 20,
    sizeEnd_: 0,
    sizeVariation_: 4,
    colourBegin_: v4f(0, 0, 0, 1),
    colourEnd_: v4f(0, 0, 0, 0.1),
    lifetime_: 200
};

export let eyeParticle: ParticleParameters = {
    position_: [0, 0],
    velocity_: [0, 0],
    velocityVariation_: [0, 0],
    sizeBegin_: 2,
    sizeEnd_: 0,
    sizeVariation_: 0,
    colourBegin_: v4f(1, 1, 1, 1),
    colourEnd_: v4f(0, 0, 0, 0.1),
    lifetime_: 16
};

export let fireParticle: ParticleParameters = {
    position_: [0, 0],
    velocity_: [0, -45],
    velocityVariation_: [15, 40],
    sizeBegin_: 6,
    sizeEnd_: 0,
    sizeVariation_: 0.5,
    colourBegin_: v4f(120 / 255, 170 / 255, 220 / 255, 1),
    colourEnd_: v4f(1, 1, 1, 0.25),
    lifetime_: 500
};

export let activeParticles: Set<number> = new Set();

export let initParticles = (): void => {
    for (let i = 0; i < particlePoolSize; i++) {
        particlePosition[i] = [0, 0];
        screenPosition[i] = [0, 0];
        particleVelocity[i] = [0, 0];
        particleSizeBegin[i] = 0;
        particleSizeEnd[i] = 0;
        particleSize[i] = 0;
        particleColourBegin[i] = v4f(1.0, 1.0, 1.0, 1.0);
        particleColourEnd[i] = v4f(1.0, 1.0, 1.0, 1.0);
        particleColourRaw[i] = v4f(1.0, 1.0, 1.0, 1.0);
        particleColour[i] = v4fToABGR(particleColourRaw[i]);
        particleLifetime[i] = 0;
        particleLifetimeRemaining[i] = 0;
    }
};

export let updateParticles = (delta: number): void => {
    if (activeParticles.size === 0) return;
    let deltaSeconds = (delta * 0.001);
    let indexes = activeParticles.values();
    for (let i of indexes) {
        if (particleLifetimeRemaining[i] <= 0 || particleSize[i] < 1) {
            activeParticles.delete(i);
            continue;
        }

        particleLifetimeRemaining[i] -= delta;

        particlePosition[i][X] += particleVelocity[i][X] * deltaSeconds;
        particlePosition[i][Y] += particleVelocity[i][Y] * deltaSeconds;

        let lifeProgress = clamp(particleLifetimeRemaining[i] / particleLifetime[i], 0, 1);

        particleSize[i] = floor(lerp(particleSizeEnd[i], particleSizeBegin[i], lifeProgress));

        let colourBegin = particleColourBegin[i];
        let colourEnd = particleColourEnd[i];
        particleColourRaw[i][R] = lerp(colourBegin[R], colourEnd[R], lifeProgress);
        particleColourRaw[i][G] = lerp(colourBegin[G], colourEnd[G], lifeProgress);
        particleColourRaw[i][B] = lerp(colourBegin[B], colourEnd[B], lifeProgress);
        particleColourRaw[i][A] = lerp(colourBegin[A], colourEnd[A], lifeProgress);
        particleColour[i] = v4fToABGR(particleColourRaw[i]);
    }
};

export let clearParticles = (): void => {
    activeParticles.clear();
};

export let drawParticles = (): void => {
    if (activeParticles.size === 0) return;
    for (let i of activeParticles) {
        if (particleSize[i] < 1) {
            continue;
        }
        screenPosition[i][X] = particlePosition[i][X] - cameraPos[X] + SCREEN_HALF + SCREEN_GUTTER;
        screenPosition[i][Y] = particlePosition[i][Y] - cameraPos[Y] + SCREEN_HALF;
        let halfSize = particleSize[i] * 0.5;
        let x = floor(screenPosition[i][X] - halfSize);
        let y = floor(screenPosition[i][Y] - halfSize);
        if (particleSize[i] < 4) {
            pushQuad(x, y, particleSize[i], particleSize[i], particleColour[i]);
        } else if (particleSize[i] > 3 && particleSize[i] < 9) {
            pushTexturedQuad(TEXTURE_C_4x4 + (particleSize[i] - 4), x, y, 1, particleColour[i]);
        } else {
            pushTexturedQuad(TEXTURE_C_8x8, x, y, particleSize[i] * 0.125, particleColour[i]);
        }
    }
};

export let emitParticle = (particleParams: ParticleParameters): void => {
    activeParticles.add(particlePoolIndex);

    setV2(particlePosition[particlePoolIndex], particleParams.position_[X], particleParams.position_[Y]);
    setV2(particleVelocity[particlePoolIndex], particleParams.velocity_[X] + particleParams.velocityVariation_[X] * (math.random() - 0.5), particleParams.velocity_[Y] + particleParams.velocityVariation_[Y] * (math.random() - 0.5));

    setV4fFromV4f(particleColourBegin[particlePoolIndex], particleParams.colourBegin_);
    setV4fFromV4f(particleColourEnd[particlePoolIndex], particleParams.colourEnd_);
    setV4fFromV4f(particleColourRaw[particlePoolIndex], particleColourBegin[particlePoolIndex]);
    particleColour[particlePoolIndex] = v4fToABGR(particleColourRaw[particlePoolIndex]);

    particleLifetime[particlePoolIndex] = particleParams.lifetime_;
    particleLifetimeRemaining[particlePoolIndex] = particleLifetime[particlePoolIndex];

    particleSizeBegin[particlePoolIndex] = particleParams.sizeBegin_ + particleParams.sizeVariation_ * (math.random() - 0.5);
    particleSizeEnd[particlePoolIndex] = particleParams.sizeEnd_;
    particleSize[particlePoolIndex] = particleSizeBegin[particlePoolIndex];

    --particlePoolIndex;
    if (particlePoolIndex < 0) {
        particlePoolIndex = particlePoolSize - 1;
    }
};

export let emitParticles = (particleParams: ParticleParameters, count: number): void => {
    while (--count) {
        emitParticle(particleParams);
    }
};