import { assert } from "./__debug/debug";
import { cathit } from "./audio";
import { cameraPos } from "./camera";
import { BLACK, pushQuad, pushTexturedQuad, WHITE } from "./draw";
import { clamp, _cos, EULER, _floor, _max, _min, PI, _random, _sin, _sqrt } from "./math";
import { burstParticle, catParticle, emitParticles, eyeParticle } from "./particle";
import { gainXp, player } from "./player";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./world";

let MAX_ENTITIES = 20_000;

let GRID_CELL_SIZE = 128;
let GRID_WIDTH = 256;
let GRID_HEIGHT = 256;
let MAX_PER_CELL = 64;

let ENEMY_SPEED = 50;
let SEEK_STOP_DIST = 14;
let PLAYER_RADIUS = 8;

let ENEMY_RADIUS = 8;
let PROJECTILE_RADIUS = 2;

let DEFAULT_ENEMY_HP = 3;

let TYPE_PLAYER = 1 << 0;
let TYPE_ENEMY = 1 << 1;
let TYPE_PROJECTILE = 1 << 2;
let TYPE_AURA = 1 << 3;

export let playerDir = 0;

let type = new Uint8Array(MAX_ENTITIES);
let alive = new Uint8Array(MAX_ENTITIES);
let radius = new Float32Array(MAX_ENTITIES);
export let posX = new Float32Array(MAX_ENTITIES);
export let posY = new Float32Array(MAX_ENTITIES);
export let velX = new Float32Array(MAX_ENTITIES);
export let velY = new Float32Array(MAX_ENTITIES);
export let sPosX = new Float32Array(MAX_ENTITIES);
export let sPosY = new Float32Array(MAX_ENTITIES);

let hp = new Float32Array(MAX_ENTITIES);
let damage = new Float32Array(MAX_ENTITIES);
let lifetime = new Float32Array(MAX_ENTITIES);
let color = new Uint32Array(MAX_ENTITIES);
let slowFactor = new Float32Array(MAX_ENTITIES).fill(1);

let activeIds = new Uint32Array(MAX_ENTITIES);
let activeIndex = new Int32Array(MAX_ENTITIES);
export let activeCount = 0;

let freeList = new Uint32Array(MAX_ENTITIES);
export let freeTop = 0;

let gridCounts = new Uint16Array(GRID_WIDTH * GRID_HEIGHT);
let gridIds = new Uint32Array(GRID_WIDTH * GRID_HEIGHT * MAX_PER_CELL);

let enemyHitSet: Uint16Array[] = new Array(MAX_ENTITIES);
let enemyHitSetCount: Uint8Array = new Uint8Array(MAX_ENTITIES);
for (let i = 0; i < MAX_ENTITIES; i++) enemyHitSet[i] = new Uint16Array(256);

export let nearestEnemyPos = new Float32Array(2);

let gridIndexFor = (x: number, y: number): number => {
    let cx = _floor(x / GRID_CELL_SIZE);
    let cy = _floor(y / GRID_CELL_SIZE);
    if (cx < 0) cx = 0; else if (cx >= GRID_WIDTH) cx = GRID_WIDTH - 1;
    if (cy < 0) cy = 0; else if (cy >= GRID_HEIGHT) cy = GRID_HEIGHT - 1;
    return cy * GRID_WIDTH + cx;
};

let gridInsert = (id: number): void => {
    let gi = gridIndexFor(posX[id], posY[id]);
    let c = gridCounts[gi];
    if (c < MAX_PER_CELL) {
        gridIds[gi * MAX_PER_CELL + c] = id;
        gridCounts[gi] = c + 1;
    }
};

export let findNearestEnemy = (maxDist: number): boolean => {
    if (nearestEnemyPos[X] !== -1 || nearestEnemyPos[Y] !== -1) {
        return true;
    }
    let px = posX[0], py = posY[0];
    let maxDist2 = maxDist * maxDist;
    let cx_min = clamp(_floor((px - maxDist) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
    let cx_max = clamp(_floor((px + maxDist) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
    let cy_min = clamp(_floor((py - maxDist) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
    let cy_max = clamp(_floor((py + maxDist) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
    let minDist2 = maxDist2 + 1;
    for (let cy = cy_min; cy <= cy_max; cy++) {
        for (let cx = cx_min; cx <= cx_max; cx++) {
            let gi = cy * GRID_WIDTH + cx;
            let gc = gridCounts[gi];
            let gbase = gi * MAX_PER_CELL;
            for (let k = 0; k < gc; k++) {
                let id = gridIds[gbase + k];
                if (!alive[id] || !(type[id] & TYPE_ENEMY)) continue;
                let dx = posX[id] - px;
                let dy = posY[id] - py;
                let d2 = dx * dx + dy * dy;
                if (d2 < minDist2 && d2 <= maxDist2) {
                    minDist2 = d2;
                    nearestEnemyPos[X] = posX[id];
                    nearestEnemyPos[Y] = posY[id];
                }
            }
        }
    }
    return minDist2 <= maxDist2;
};

export let initEntities = (): void => {
    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        free(id);
    }
    activeCount = 0;
    for (let i = 0; i < MAX_ENTITIES; i++) {
        freeList[i] = MAX_ENTITIES - 1 - i;
    }
    freeTop = MAX_ENTITIES;
};

let alloc = (): number => {
    if (freeTop === 0) return -1;
    let id = freeList[--freeTop];
    alive[id] = 1;
    slowFactor[id] = 1;
    activeIndex[id] = activeCount;
    activeIds[activeCount++] = id;
    return id;
};

let free = (id: number): void => {
    alive[id] = 0;
    let idx = activeIndex[id];
    let lastId = activeIds[--activeCount];
    activeIds[idx] = lastId;
    activeIndex[lastId] = idx;
    activeIndex[id] = -1;
    freeList[freeTop++] = id;
};

export let spawnPlayer = (x: number, y: number, r: number = PLAYER_RADIUS): void => {
    let id = alloc();
    assert(id === 0, "player got non-zero id");
    type[id] = TYPE_PLAYER;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = 0;
    velY[id] = 0;
    lifetime[id] = 0;
};

export let spawnEnemy = (x: number, y: number, r: number = ENEMY_RADIUS, hpVal: number = DEFAULT_ENEMY_HP, rgba: number = BLACK): number => {
    let id = alloc();
    if (id < 1) return -1;
    type[id] = TYPE_ENEMY;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = 0;
    velY[id] = 0;
    hp[id] = hpVal;
    color[id] = rgba;
    return id;
};

let diag = _sqrt(SCREEN_DIM * SCREEN_DIM * 2) / 2 + 84;
export let spawnOffscreenEnemy = (hp: number = 3, r: number = 8): number => {
    let angle = _random() * PI * 2;
    let x = cameraPos[X] + _cos(angle) * diag;
    let y = cameraPos[Y] + _sin(angle) * diag;
    if (x < 0 || y < 0 || x > WORLD_WIDTH || y > WORLD_HEIGHT) {
        angle = (angle + PI) % (2 * PI);
        x = cameraPos[X] + _cos(angle) * diag;
        y = cameraPos[Y] + _sin(angle) * diag;
    }
    x = clamp(x, 0, WORLD_WIDTH); y = clamp(y, 0, WORLD_HEIGHT);
    return spawnEnemy(x, y, r, hp);
};

export let spawnProjectile = (x: number, y: number, vx: number, vy: number, r: number = PROJECTILE_RADIUS, dmg: number = 1, lifeSec: number = 2, hpVal: number = 1, abgr: number = 0xff0000ff): number => {
    let id = alloc();
    if (id < 1) return -1;
    type[id] = TYPE_PROJECTILE;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = vx;
    velY[id] = vy;
    damage[id] = dmg + player.damage_;
    lifetime[id] = lifeSec;
    hp[id] = hpVal;
    color[id] = abgr;
    return id;
};

export let spawnAura = (r: number = 50, dmg: number = 5, lifeSec: number = -1, abgr: number = 0x4000ff80, slow: number = 1.0, existingId: number = -1): number => {
    let id = existingId >= 0 && alive[existingId] && type[existingId] & TYPE_AURA ? existingId : alloc();
    if (id < 1) return -1;
    type[id] = TYPE_AURA;
    radius[id] = r;
    posX[id] = posX[0];
    posY[id] = posY[0];
    velX[id] = 0;
    velY[id] = 0;
    damage[id] = dmg;
    lifetime[id] = lifeSec;
    color[id] = abgr;
    slowFactor[id] = slow;
    return id;
};

export let spawnRadialBurst = (cx: number, cy: number, count: number, speed: number, r: number = PROJECTILE_RADIUS, lifeSec: number = 2, dmg: number = 1): void => {
    for (let k = 0; k < count; k++) {
        let a = (2 * PI * k) / count;
        let vx = _cos(a) * speed;
        let vy = _sin(a) * speed;
        spawnProjectile(cx, cy, vx, vy, r, dmg, lifeSec, 1);
    }
};

export let spawnOrbit = (cx: number, cy: number, count: number, r: number = PROJECTILE_RADIUS, ar: number, lifeSec: number = 2, dmg: number = 1): void => {
    for (let k = 0; k < count; k++) {
        let a = (2 * PI * k) / count;
        let px = cx + _cos(a) * ar;
        let py = cy + _sin(a) * ar;
        spawnProjectile(px, py, 0, 0, r, dmg, lifeSec, 999);
    }
};

let damageEnemy = (id: number, amt: number): void => {
    hp[id] -= amt;
    if (hp[id] <= 0) {
        gainXp(1);
        burstParticle.position_[X] = posX[id];
        burstParticle.position_[Y] = posY[id];
        emitParticles(burstParticle, 20);
        alive[id] = 0;
    }
};

let damagePlayer = (amt: number): void => {
    if (lifetime[0] <= 0) {
        player.hp_ -= amt;
        lifetime[0] = 0.8;
        cathit();
        if (player.hp_ <= 0) {
            alive[0] = 0;
        }
    }
};

export let updatePlayerVel = (x: number, y: number): void => {
    velX[0] += x;
    velY[0] += y;
};

export let updateEntities = (deltaMs: number): void => {
    let dt = deltaMs * 0.001;
    if (activeCount === 0 || alive[0] === 0) return;
    gridCounts.fill(0);

    nearestEnemyPos[X] = -1;
    nearestEnemyPos[Y] = -1;
    let pX = posX[0], pY = posY[0];

    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        let t = type[id];

        if (!alive[id]) {
            free(id);
            continue;
        }

        if (t & TYPE_ENEMY) {
            enemyHitSetCount[id] = 0;
            let dx = pX - posX[id];
            let dy = pY - posY[id];
            let d2 = dx * dx + dy * dy;
            if (d2 > SEEK_STOP_DIST * SEEK_STOP_DIST) {
                let inv = 1 / _sqrt(_max(d2, 1e-8));
                dx *= inv;
                dy *= inv;
                velX[id] = dx * ENEMY_SPEED * slowFactor[id];
                velY[id] = dy * ENEMY_SPEED * slowFactor[id];
                slowFactor[id] = 1.0;
            } else {
                velX[id] = 0;
                velY[id] = 0;
            }
        } else if (t & TYPE_PROJECTILE) {
            lifetime[id] -= dt;
            if (lifetime[id] <= 0) {
                free(id);
                continue;
            }
            // NOTE: (velocity already set on spawn; homing/projectile logic could modify here)
        } else if (t & TYPE_PLAYER) {
            if (velX[id] !== 0) {
                playerDir = velX[id] < 0 ? 0 : 1;
                velX[id] = velX[id] * EULER ** (-5 * dt);
                if (velX[id] < 1 && velX[id] > -1) {
                    velX[id] = 0;
                }
                velX[id] = clamp(velX[id], -500, 500);
            }
            if (velY[id] !== 0) {
                velY[id] = velY[id] * EULER ** (-5 * dt);
                if (velY[id] < 1 && velY[id] > -1) {
                    velY[id] = 0;
                }
                velY[id] = clamp(velY[id], -500, 500);
            }
            if (lifetime[id] > 0) {
                lifetime[id] -= dt;
            }
        } else if (t & TYPE_AURA) {
            if (lifetime[id] > 0) {
                lifetime[id] -= dt;
                if (lifetime[id] <= 0) {
                    free(id);
                    continue;
                }
            }
            posX[id] = posX[0];
            posY[id] = posY[0];
        }

        posX[id] += velX[id] * dt;
        posY[id] += velY[id] * dt;

        if (t === TYPE_PLAYER || t === TYPE_ENEMY) {
            posX[id] = clamp(posX[id], 0 + radius[id], WORLD_WIDTH - radius[id]);
            posY[id] = clamp(posY[id], 0 + radius[id], WORLD_HEIGHT - radius[id]);
        } else if (t === TYPE_PROJECTILE) {
            if (posX[id] < 0 || posX[id] > WORLD_WIDTH || posY[id] < 0 || posY[id] > WORLD_HEIGHT) {
                free(id);
                continue;
            }
        }

        if (alive[id]) gridInsert(id);
    }

    for (let cell = 0; cell < gridCounts.length; cell++) {
        let count = gridCounts[cell];
        if (count <= 1) continue;

        let base = cell * MAX_PER_CELL;
        for (let a = 0; a < count; a++) {
            let i = gridIds[base + a];
            if (!alive[i]) continue;

            for (let b = a + 1; b < count; b++) {
                let j = gridIds[base + b];
                if (!alive[j]) continue;

                let dx = posX[j] - posX[i];
                let dy = posY[j] - posY[i];
                let rsum = radius[i] + radius[j];
                let d2 = dx * dx + dy * dy;
                if (d2 >= rsum * rsum || d2 === 0) continue;

                let d = _sqrt(d2);
                let nx = dx / d, ny = dy / d;
                let overlap = (rsum - d);

                let ti = type[i], tj = type[j];

                if ((ti & TYPE_ENEMY) && (tj & TYPE_ENEMY)) {
                    let half = overlap * 0.5;
                    posX[i] -= nx * half; posY[i] -= ny * half;
                    posX[j] += nx * half; posY[j] += ny * half;
                    continue;
                }

                if ((ti & TYPE_PLAYER) && (tj & TYPE_ENEMY)) {
                    posX[j] += nx * overlap; posY[j] += ny * overlap;
                    posX[i] -= nx * (overlap * 0.25); posY[i] -= ny * (overlap * 0.25);
                    damagePlayer(1);
                    continue;
                }

                if ((tj & TYPE_PLAYER) && (ti & TYPE_ENEMY)) {
                    posX[i] -= nx * overlap; posY[i] -= ny * overlap;
                    posX[j] += nx * (overlap * 0.25); posY[j] += ny * (overlap * 0.25);
                    damagePlayer(1);
                    continue;
                }

                if ((ti & TYPE_PROJECTILE) && (tj & TYPE_ENEMY)) {
                    if (enemyHitSet[j].includes(i)) {
                        continue;
                    }
                    enemyHitSet[j][enemyHitSetCount[j]++] = i;
                    damageEnemy(j, damage[i]);
                    hp[i] -= 1;
                    if (hp[i] <= 0) {
                        alive[i] = 0;
                    }
                    continue;
                }

                if ((tj & TYPE_PROJECTILE) && (ti & TYPE_ENEMY)) {
                    if (enemyHitSet[i].includes(j)) {
                        continue;
                    }
                    enemyHitSet[i][enemyHitSetCount[i]++] = j;
                    damageEnemy(i, damage[j]);
                    hp[j] -= 1;
                    if (hp[j] <= 0) {
                        alive[j] = 0;
                    }
                    continue;
                }
            }
        }
    }

    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        if (!alive[id] || !(type[id] & TYPE_AURA)) continue;
        let ar = radius[id];
        let cx_min = clamp(_floor((pX - ar) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
        let cx_max = clamp(_floor((pX + ar) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
        let cy_min = clamp(_floor((pY - ar) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
        let cy_max = clamp(_floor((pY + ar) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
        for (let cy = cy_min; cy <= cy_max; cy++) {
            for (let cx = cx_min; cx <= cx_max; cx++) {
                let gi = cy * GRID_WIDTH + cx;
                let gc = gridCounts[gi];
                let gbase = gi * MAX_PER_CELL;
                for (let k = 0; k < gc; k++) {
                    let eid = gridIds[gbase + k];
                    if (!alive[eid] || !(type[eid] & TYPE_ENEMY)) continue;
                    let dx = posX[eid] - pX;
                    let dy = posY[eid] - pY;
                    let d2 = dx * dx + dy * dy;
                    let rsum = ar + radius[eid];
                    if (d2 < rsum * rsum) {
                        damageEnemy(eid, damage[id] * dt);
                        slowFactor[eid] = _min(slowFactor[eid], slowFactor[id]);
                    }
                }
            }
        }
    }
};

export let drawEntities = (): void => {
    for (let n = 0; n < activeCount; n++) {
        let id = activeIds[n];
        sPosX[id] = posX[id] - cameraPos[X] + SCREEN_HALF + SCREEN_GUTTER;
        sPosY[id] = posY[id] - cameraPos[Y] + SCREEN_HALF;
        if (0 === id) {
            continue;
        }
        let r = radius[id];
        let d = r * 2;
        if (sPosX[id] < -d || sPosX[id] > SCREEN_DIM + SCREEN_GUTTER + d || sPosY[id] < -d || sPosY[id] > SCREEN_DIM + d) {
            continue;
        }
        let t = type[id];
        if (t & TYPE_AURA) {
            pushTexturedQuad(TEXTURE_C_16x16, sPosX[id] - r, sPosY[id] - r, d * 0.0625, color[id] || 0x33ffffff);
        } else if (t & TYPE_ENEMY) {
            pushTexturedQuad(TEXTURE_RAT, sPosX[id] - r, sPosY[id] - r, d * 0.0625, BLACK, velX[id] < 0, false, true);
        } else {
            if (d < 4) {
                pushQuad(sPosX[id] - r, sPosY[id] - r, d, d, color[id] || WHITE);
            } else if (d > 3 && d < 9) {
                pushTexturedQuad(TEXTURE_C_4x4 + (d - 4), sPosX[id] - r, sPosY[id] - r, 1, color[id] || WHITE);
            } else {
                pushTexturedQuad(TEXTURE_C_8x8, sPosX[id] - r, sPosY[id] - r, d * 0.125, color[id] || WHITE);
            }
        }
    }

    if (velX[0] !== 0 || velY[0] !== 0 || lifetime[0] > 0) {
        if (lifetime[0] > 0 && _floor(lifetime[0] * 10) % 2 == 1) {
            catParticle.colourBegin_[R] = 1;
        } else {
            catParticle.colourBegin_[R] = 0;
        }
        catParticle.position_[X] = posX[0];
        catParticle.position_[Y] = posY[0];
        emitParticles(catParticle, 10);

        eyeParticle.position_[Y] = catParticle.position_[Y] - 1;
        eyeParticle.position_[X] = catParticle.position_[X] - 3;
        emitParticles(eyeParticle, 2);
        eyeParticle.position_[X] += 6;
        emitParticles(eyeParticle, 2);
    } else {
        pushTexturedQuad(TEXTURE_CAT_01, sPosX[0] - 8, sPosY[0] - 8, 1, BLACK, playerDir === 0, false, false, true);
    }
};
