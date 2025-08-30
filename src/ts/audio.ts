import { gameStage } from "./gameMap";
import { gameState } from "./gameState";
import { abs, cos, lerp, max, min, PI, random, round, sin, tan } from "./math";

export let zzfxPlay = (m: number[]): void => { let f = zzfxContext.createBuffer(1, m.length, zzfxSampleRate), d = zzfxContext.createBufferSource(); f.getChannelData(0).set(m); d.buffer = f; d.connect(zzfxContext.destination); d.start(); };
let zzfxGenerate = (m = 1, f = .05, d = 220, b = 0, n = 0, t = .1, r = 0, D = 1, u = 0, z = 0, v = 0, A = 0, k = 0, E = 0, B = 0, F = 0, e = 0, w = 1, p = 0, C = 0): number[] => { let c = 2 * PI, G = u *= 500 * c / zzfxSampleRate / zzfxSampleRate; f = d *= (1 + 2 * f * random() - f) * c / zzfxSampleRate; let x = [], h = 0, H = 0, a = 0, q = 1, I = 0, J = 0, g = 0, y, l; b = zzfxSampleRate * b + 9; p *= zzfxSampleRate; n *= zzfxSampleRate; t *= zzfxSampleRate; e *= zzfxSampleRate; z *= 500 * c / zzfxSampleRate ** 3; B *= c / zzfxSampleRate; v *= c / zzfxSampleRate; A *= zzfxSampleRate; k = zzfxSampleRate * k | 0; for (l = b + p + n + t + e | 0; a < l; x[a++] = g)++J % (100 * F | 0) || (g = r ? 1 < r ? 2 < r ? 3 < r ? sin((h % c) ** 3) : max(min(tan(h), 1), -1) : 1 - (2 * h / c % 2 + 2) % 2 : 1 - 4 * abs(round(h / c) - h / c) : sin(h), g = (k ? 1 - C + C * sin(c * a / k) : 1) * (0 < g ? 1 : -1) * abs(g) ** D * m * zzfxVolume * (a < b ? a / b : a < b + p ? 1 - (a - b) / p * (1 - w) : a < b + p + n ? w : a < l - e ? (l - a - e) / t * w : 0), g = e ? g / 2 + (e > a ? 0 : (a < l - e ? 1 : (l - a) / e) * x[a - e | 0] / 2) : g), y = (d += u += z) * cos(B * H++), h += y - y * E * (1 - 1E9 * (sin(a) + 1) % 2), q && ++q > A && (d += v, f += v, q = 0), !k || ++I % k || (d = f, u = G, q = q || 1); return x; };
let zzfx = (m: (number | undefined)[]) => zzfxPlay(zzfxGenerate(...m));

let zzfxVolume: number = 0.3;
let zzfxSampleRate: number = 44100;
let zzfxContext: AudioContext;

export let boop: number[];
export let boopGood: number[];
export let thunder: number[];
export let catHit: VoidFunction;
export let ratDie: VoidFunction;

let bass: number[];
let snare: number[];
let hihat: number[];

export let zzfxInit = (): void => {
    if (!zzfxContext) {
        zzfxContext = new AudioContext();
    }
    boop = zzfxGenerate(...[, .1, , .05, .05, , , , , , 200, .06, , , , , , .5, .05]);
    boopGood = zzfxGenerate(...[, .1, 440, .05, .05, , , , , , 200, .06, , , , , , .5, .05, 1]);
    thunder = zzfxGenerate(...[2, 4, 25, .06, .31, .35, , 3.9, , -3, , , , .9, 12, .9, .3, .32, .16]);
    catHit = () => zzfx([, .75, 325, .04, .02, .04, 2, 3, , , , , , .5, 1, .1, , .8, .07]);
    ratDie = () => zzfx([.4, , 900, .07, .08, .01, 1, .1, , , 109, , .02, , .9, , , .53, , , 662]);

    zzfxVolume = 0.15;
    snare = zzfxGenerate(...[.8, .2, 200, .02, .02, .1, 4, 2, , , , , , 1, 10, .1, .1, .7, .03]);
    hihat = zzfxGenerate(...[.2, 0, 3e3, .02, .02, .08, 3, 2, 1, , , , .05, 1, , , , .3, .05, .25]);
    bass = zzfxGenerate(...[1, 0, 60, .05, .05, .2, , .5, , -2, , , , , -3, .3, , .25, .15]);
    zzfxVolume = 0.3;
};

let beat = 0;
let timer = 428;
export let playMusic = (delta: number) => {
    if (!gameState[GS_MUTEMUSIC]) {
        timer -= delta;
        if (timer <= 0) {
            timer = lerp(428, 333, gameStage / 15) + (random() * 20 - 10);
            zzfxPlay(hihat);
            if (beat % 3 === 0) {
                zzfxPlay(bass);
            }
            if (beat % 4 === 0) {
                zzfxPlay(snare);
            }
            beat = (beat + 1) % 8;
        }
    }
};
