import { cameraPos } from "./camera";
import { pushQuad, pushTexturedQuad, WHITE } from "./draw";
import { gameState, xpUp } from "./gameState";
import { clamp, cos, EULER, floor, max, PI, sin, sqrt } from "./math";
import { catParticle, emitParticles, eyeParticle } from "./particle";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./world";

let MAX_ENTITIES = 20_000;

let GRID_CELL_SIZE = 64;
let GRID_WIDTH = 256;
let GRID_HEIGHT = 256;
let MAX_PER_CELL = 64;

let ENEMY_SPEED = 50;
let SEEK_STOP_DIST = 17;
let PLAYER_RADIUS = 8;

let ENEMY_RADIUS = 8;
let PROJECTILE_RADIUS = 2;

let DEFAULT_ENEMY_HP = 3;

let TYPE_PLAYER = 1 << 0;
let TYPE_ENEMY = 1 << 1;
let TYPE_PROJECTILE = 1 << 2;
// let TYPE_PICKUP = 1 << 3;

let playerDir = 0;

let type = new Uint16Array(MAX_ENTITIES);
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

let activeIds = new Uint32Array(MAX_ENTITIES);
let activeIndex = new Int32Array(MAX_ENTITIES).fill(-1);
let activeCount = 0;

let freeList = new Uint32Array(MAX_ENTITIES);
let freeTop = 0;

let gridCounts = new Uint16Array(GRID_WIDTH * GRID_HEIGHT);
let gridIds = new Uint32Array(GRID_WIDTH * GRID_HEIGHT * MAX_PER_CELL);

let enemyHitSet: Uint16Array[] = new Array(MAX_ENTITIES);
let enemyHitSetCount: Uint8Array = new Uint8Array(MAX_ENTITIES);
for (let i = 0; i < MAX_ENTITIES; i++) enemyHitSet[i] = new Uint16Array(256);

let gridIndexFor = (x: number, y: number): number => {
    let cx = floor(x / GRID_CELL_SIZE);
    let cy = floor(y / GRID_CELL_SIZE);
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

export let initEntities = (): void => {
    for (let i = 0; i < MAX_ENTITIES; i++) {
        freeList[i] = MAX_ENTITIES - 1 - i;
    }
    freeTop = MAX_ENTITIES;
};

let alloc = (): number => {
    if (freeTop === 0) return -1;
    let id = freeList[--freeTop];
    alive[id] = 1;
    activeIndex[id] = activeCount;
    activeIds[activeCount++] = id;
    return id;
};

let free = (id: number): void => {
    if (alive[id] === 0) return;
    alive[id] = 0;
    let idx = activeIndex[id];
    let lastId = activeIds[--activeCount];
    activeIds[idx] = lastId;
    activeIndex[lastId] = idx;
    activeIndex[id] = -1;
    freeList[freeTop++] = id;
};

export let playerId = -1;

export let spawnPlayer = (x: number, y: number, r: number = PLAYER_RADIUS, rgba: number = 0xff00ffff): number => {
    let id = alloc();
    if (id < 0) return -1;
    type[id] = TYPE_PLAYER;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = 0;
    velY[id] = 0;
    color[id] = rgba;
    playerId = id;
    return id;
};

export let spawnEnemy = (x: number, y: number, r: number = ENEMY_RADIUS, hpVal: number = DEFAULT_ENEMY_HP, rgba: number = 0xff0000ff): number => {
    let id = alloc();
    if (id < 0) return -1;
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

export let spawnProjectile = (x: number, y: number, vx: number, vy: number, r: number = PROJECTILE_RADIUS, dmg: number = 1, lifeSec: number = 2, hpVal: number = 1, rgba: number = 0xff0000ff): number => {
    let id = alloc();
    if (id < 0) return -1;
    type[id] = TYPE_PROJECTILE;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = vx;
    velY[id] = vy;
    damage[id] = dmg;
    lifetime[id] = lifeSec;
    hp[id] = hpVal;
    color[id] = rgba;
    return id;
};

export let spawnRadialBurst = (cx: number, cy: number, count: number, speed: number, r: number = PROJECTILE_RADIUS, lifeSec: number = 2, dmg: number = 1): void => {
    for (let k = 0; k < count; k++) {
        let a = (2 * PI * k) / count;
        let vx = cos(a) * speed;
        let vy = sin(a) * speed;
        spawnProjectile(cx, cy, vx, vy, r, dmg, lifeSec, 1);
    }
};

export let spawnOrbit = (cx: number, cy: number, count: number, r: number = PROJECTILE_RADIUS, ar: number, lifeSec: number = 2, dmg: number = 1): void => {
    for (let k = 0; k < count; k++) {
        let a = (2 * PI * k) / count;
        let px = cx + cos(a) * ar;
        let py = cy + sin(a) * ar;
        spawnProjectile(px, py, 0, 0, r, dmg, lifeSec, 999);
    }
};

let damageEnemy = (id: number, amt: number): void => {
    hp[id] -= amt;
    if (hp[id] <= 0) {
        xpUp(1);
        free(id);
    }
};

export let updatePlayerVel = (x: number, y: number): void => {
    velX[playerId] += x;
    velY[playerId] += y;
};

export let updateEntities = (deltaMs: number): void => {
    let dt = deltaMs * 0.001;
    if (activeCount === 0 || playerId < 0 || alive[playerId] === 0) return;
    gridCounts.fill(0);

    let pX = posX[playerId], pY = posY[playerId];

    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        let t = type[id];

        if (t & TYPE_ENEMY) {
            enemyHitSetCount[id] = 0;
            let dx = pX - posX[id];
            let dy = pY - posY[id];
            let d2 = dx * dx + dy * dy;
            if (d2 > SEEK_STOP_DIST * SEEK_STOP_DIST) {
                let inv = 1 / sqrt(max(d2, 1e-8));
                dx *= inv;
                dy *= inv;
                velX[id] = dx * ENEMY_SPEED;
                velY[id] = dy * ENEMY_SPEED;
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
            // (velocity already set on spawn; homing/projectile logic could modify here)
        } else if (t & TYPE_PLAYER) {
            if (velX[id] !== 0) {
                playerDir = velX[id] < 0 ? 0 : 1;
                velX[id] = velX[id] * EULER ** (-5 * dt);
                if (velX[id] < 1 && velX[id] > -1) {
                    velX[id] = 0;
                }
                velX[id] = clamp(velX[id], -gameState[GS_PLAYER_MAXMOVE], gameState[GS_PLAYER_MAXMOVE]);
            }
            if (velY[id] !== 0) {
                velY[id] = velY[id] * EULER ** (-5 * dt);
                if (velY[id] < 1 && velY[id] > -1) {
                    velY[id] = 0;
                }
                velY[id] = clamp(velY[id], -gameState[GS_PLAYER_MAXMOVE], gameState[GS_PLAYER_MAXMOVE]);
            }
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

                let d = sqrt(d2);
                let nx = dx / d, ny = dy / d;
                let overlap = (rsum - d);

                let ti = type[i], tj = type[j];

                // Enemy ↔ Enemy: push apart equally
                if ((ti & TYPE_ENEMY) && (tj & TYPE_ENEMY)) {
                    let half = overlap * 0.5;
                    posX[i] -= nx * half; posY[i] -= ny * half;
                    posX[j] += nx * half; posY[j] += ny * half;
                    continue;
                }

                // Player ↔ Enemy: push enemy away from player (and optionally the player)
                if ((ti & TYPE_PLAYER) && (tj & TYPE_ENEMY)) {
                    posX[j] += nx * overlap; posY[j] += ny * overlap;
                    posX[i] -= nx * (overlap * 0.25); posY[i] -= ny * (overlap * 0.25);
                    gameState[GS_PLAYER_HP]--;
                    continue;
                }
                if ((tj & TYPE_PLAYER) && (ti & TYPE_ENEMY)) {
                    posX[i] -= nx * overlap; posY[i] -= ny * overlap;
                    posX[j] += nx * (overlap * 0.25); posY[j] += ny * (overlap * 0.25);
                    gameState[GS_PLAYER_HP]--;
                    continue;
                }

                // Projectile ↔ Enemy: deal damage, destroy projectile
                if ((ti & TYPE_PROJECTILE) && (tj & TYPE_ENEMY)) {
                    if (enemyHitSet[j].includes(i)) {
                        continue;
                    }
                    enemyHitSet[j][enemyHitSetCount[j]++] = i;
                    damageEnemy(j, damage[i]);
                    hp[i] -= 1;
                    if (hp[i] <= 0)
                        free(i);
                    continue;
                }
                if ((tj & TYPE_PROJECTILE) && (ti & TYPE_ENEMY)) {
                    if (enemyHitSet[i].includes(j)) {
                        continue;
                    }
                    enemyHitSet[i][enemyHitSetCount[i]++] = j;
                    damageEnemy(i, damage[j]);
                    hp[j] -= 1;
                    if (hp[j] <= 0)
                        free(j);
                    continue;
                }

                // (Optional) Projectile ↔ Player (hazards)
                // if ((ti & TYPE_PROJECTILE) && (tj & TYPE_PLAYER)) { /* playerTakeDamage(...); destroyProjectile(i); */ }
                // if ((tj & TYPE_PROJECTILE) && (ti & TYPE_PLAYER)) { /* playerTakeDamage(...); destroyProjectile(j); */ }

                // Player ↔ Pickup, etc., can be added here similarly.
            }
        }
    }
};

export let drawEntities = (): void => {
    for (let n = 0; n < activeCount; n++) {
        let id = activeIds[n];
        sPosX[id] = posX[id] - cameraPos[X] + SCREEN_HALF + SCREEN_GUTTER;
        sPosY[id] = posY[id] - cameraPos[Y] + SCREEN_HALF;
        if (playerId === id) {
            continue;
        }
        let r = radius[id];
        let d = r * 2;
        if (sPosX[id] < -d || sPosX[id] > SCREEN_DIM + SCREEN_GUTTER + d || sPosY[id] < -d || sPosY[id] > SCREEN_DIM + d) {
            continue;
        }
        if (d < 4) {
            pushQuad(sPosX[id] - r, sPosY[id] - r, d, d, color[id] || 0xffffffff);
        } else if (d > 3 && d < 9) {
            pushTexturedQuad(TEXTURE_C_4x4 + (d - 4), sPosX[id] - r, sPosY[id] - r, 1, color[id] || 0xffffffff);
        } else {
            pushTexturedQuad(TEXTURE_C_8x8, sPosX[id] - r, sPosY[id] - r, d * 0.125, color[id] || 0xffffffff);
        }
    }

    if (velX[playerId] !== 0 || velY[playerId] !== 0) {
        catParticle.position_[X] = posX[playerId];
        catParticle.position_[Y] = posY[playerId];
        emitParticles(catParticle, 10);

        eyeParticle.position_[Y] = catParticle.position_[Y] - 1;
        eyeParticle.position_[X] = catParticle.position_[X] - 3;
        emitParticles(eyeParticle, 2);
        eyeParticle.position_[X] += 6;
        emitParticles(eyeParticle, 2);
    } else {
        pushTexturedQuad(TEXTURE_CAT_01, sPosX[playerId] - 8, sPosY[playerId] - 8, 1, WHITE, playerDir === 0, false, true);
    }
};
