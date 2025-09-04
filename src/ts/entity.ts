import { assert } from "./__debug/debug";
import { enemyShoot, zzfx, zzfxPlay } from "./audio";
import { cameraPos, triggerShake } from "./camera";
import { BLACK, GREEN, lightningFlash, PURPLE, pushQuad, pushTexturedQuad, RED, setV4fToColour, WHITE } from "./draw";
import { timeData, WORLD_HEIGHT, WORLD_WIDTH } from "./gameMap";
import { calcVec, clamp, cos, EULER, floor, hypot, max, min, PI, random, sin, sqrt, vecCalc } from "./math";
import { burstParticle, catParticle, emitParticle, emitParticles, eyeParticle } from "./particle";
import { gainXp, player } from "./player";

let MAX_ENTITIES = 20_000 as const;

let GRID_CELL_SIZE = 64 as const;
let GRID_WIDTH = 256 as const;
let GRID_HEIGHT = 256 as const;
let MAX_PER_CELL = 128 as const;

let PROJECTILE_RADIUS = 2;

let TYPE_PLAYER = 1 << 0;
let TYPE_ENEMY = 1 << 1;
let TYPE_PROJECTILE = 1 << 2;
let TYPE_AURA = 1 << 3;
let TYPE_XP_ORB = 1 << 4;
let TYPE_HOSTILE_PROJECTILE = 1 << 5;

export let playerDir = 0;
export let enemyCount = 0;

export let type = new Uint8Array(MAX_ENTITIES);
export let alive = new Uint8Array(MAX_ENTITIES);
export let radius = new Float32Array(MAX_ENTITIES);

export let posX = new Float32Array(MAX_ENTITIES);
export let posY = new Float32Array(MAX_ENTITIES);
export let velX = new Float32Array(MAX_ENTITIES);
export let velY = new Float32Array(MAX_ENTITIES);
export let sPosX = new Float32Array(MAX_ENTITIES);
export let sPosY = new Float32Array(MAX_ENTITIES);

export let hp = new Float32Array(MAX_ENTITIES);
let damage = new Float32Array(MAX_ENTITIES);
let lifetime = new Float32Array(MAX_ENTITIES);
let color = new Uint32Array(MAX_ENTITIES);
let slowFactor = new Float32Array(MAX_ENTITIES).fill(1);
let shootTimer = new Float32Array(MAX_ENTITIES);
let shootPeriod = new Float32Array(MAX_ENTITIES);
let knockback = new Float32Array(MAX_ENTITIES);
let speedMult = new Float32Array(MAX_ENTITIES).fill(1);

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

let isCircleOverlappingEnemyRect = (cx: number, cy: number, cr: number, eid: number): boolean => {
    let hw = radius[eid];
    let l = posX[eid] - hw;
    let r = posX[eid] + hw;
    let b = posY[eid] + hw;
    let t = posY[eid] - (0.125 * hw);
    let clx = clamp(cx, l, r);
    let cly = clamp(cy, t, b);
    let dx = cx - clx;
    let dy = cy - cly;
    return hypot(dx, dy) <= cr;
};

export let findNearestEnemy = (maxDist: number): boolean => {
    if (nearestEnemyPos[X] !== -1 || nearestEnemyPos[Y] !== -1) {
        return true;
    }
    let px = posX[0], py = posY[0];
    let cx_min = clamp(floor((px - maxDist) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
    let cx_max = clamp(floor((px + maxDist) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
    let cy_min = clamp(floor((py - maxDist) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
    let cy_max = clamp(floor((py + maxDist) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
    let minDist = maxDist + 1;
    for (let cy = cy_min; cy <= cy_max; cy++) {
        for (let cx = cx_min; cx <= cx_max; cx++) {
            let gi = cy * GRID_WIDTH + cx;
            let gc = gridCounts[gi];
            let gbase = gi * MAX_PER_CELL;
            for (let k = 0; k < gc; k++) {
                let id = gridIds[gbase + k];
                if (!alive[id] || !(type[id] & TYPE_ENEMY)) continue;
                calcVec(px, py, posX[id], posY[id]);
                if (vecCalc[DIST] < minDist && vecCalc[DIST] <= maxDist) {
                    minDist = vecCalc[DIST];
                    nearestEnemyPos[X] = posX[id];
                    nearestEnemyPos[Y] = posY[id];
                }
            }
        }
    }
    return minDist <= maxDist;
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
    enemyCount = 0;
};

let alloc = (): number => {
    if (freeTop === 0) return -1;
    let id = freeList[--freeTop];
    alive[id] = 1;
    slowFactor[id] = 1;
    shootTimer[id] = 0;
    shootPeriod[id] = 0;
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
    if (type[id] & TYPE_ENEMY) {
        enemyCount--;
    }
};

export let spawnPlayer = (x: number, y: number, r: number = 8): void => {
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

export let spawnEnemy = (x: number, y: number, r: number = 8, hpVal: number = 3, dmg: number = 1, rgba: number = BLACK, forceSpawn: boolean = false, shootPeriodVal: number = 0, speed: number = 1): number => {
    if (!forceSpawn && enemyCount >= 300) return -1;
    let id = alloc();
    if (id < 1) return -1;
    type[id] = TYPE_ENEMY;
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = velY[id] = 0;
    hp[id] = hpVal;
    damage[id] = dmg;
    color[id] = rgba;
    if (shootPeriodVal) {
        shootPeriod[id] = shootPeriodVal;
        shootTimer[id] = random() * shootPeriodVal;
    }
    speedMult[id] = speed;
    enemyCount++;
    return id;
};

let diagDist = sqrt(SCREEN_DIM * SCREEN_DIM * 2) / 2 + 84;
export let spawnOffscreenEnemy = (hpVal: number = 3, r: number = 8, dmg: number = 1, abgr: number = BLACK, forceSpawn: boolean = false, shootPeriodParam: number = 0, speedMult: number = 1): number => {
    let angle = random() * PI * 2;
    let x = cameraPos[X] + cos(angle) * diagDist;
    let y = cameraPos[Y] + sin(angle) * diagDist;
    if (x < 0 || y < 0 || x > WORLD_WIDTH || y > WORLD_HEIGHT) {
        angle = (angle + PI) % (2 * PI);
        x = cameraPos[X] + cos(angle) * diagDist;
        y = cameraPos[Y] + sin(angle) * diagDist;
    }
    x = clamp(x, 0, WORLD_WIDTH); y = clamp(y, 0, WORLD_HEIGHT);
    let id = spawnEnemy(x, y, r, hpVal, dmg, abgr, forceSpawn, shootPeriodParam, speedMult);
    if (id === -1 && !forceSpawn) {
        let px = posX[0];
        let py = posY[0];
        let farthestId = -1;
        let max = -1;
        for (let n = 0; n < activeCount; n++) {
            let eid = activeIds[n];
            if (alive[eid] && (type[eid] & TYPE_ENEMY)) {
                calcVec(px, py, posX[eid], posY[eid]);
                if (vecCalc[DIST] > max) {
                    max = vecCalc[DIST];
                    farthestId = eid;
                }
            }
        }
        if (farthestId !== -1) {
            posX[farthestId] = x;
            posY[farthestId] = y;
            id = farthestId;
        }
    }
    return id;
};

export let spawnProjectile = (x: number, y: number, vx: number, vy: number, r: number = PROJECTILE_RADIUS, dmg: number = 1, lifeSec: number = 2, hpVal: number = 1, abgr: number = RED, hostile: boolean = false, kb: number = 0): number => {
    let id = alloc();
    if (id < 1) return -1;
    type[id] = TYPE_PROJECTILE | (hostile ? TYPE_HOSTILE_PROJECTILE : 0);
    radius[id] = r;
    posX[id] = x;
    posY[id] = y;
    velX[id] = vx;
    velY[id] = vy;
    hp[id] = hpVal;
    damage[id] = dmg;
    lifetime[id] = lifeSec;
    color[id] = abgr;
    knockback[id] = kb;
    return id;
};

export let spawnRadialBurst = (x: number, y: number, count: number, speed: number, hostile: boolean = false) => {
    for (let k = 0; k < count; k++) {
        let angle = (2 * PI * k) / count;
        let vx = cos(angle) * speed;
        let vy = sin(angle) * speed;
        spawnProjectile(x, y, vx, vy, 2, 1, 2, 1, hostile ? PURPLE : RED, hostile);
    }
};

export let spawnAura = (existingId: number = -1, r: number = 50, dmg: number = 5, lifeSec: number = -1, abgr: number = 0x4000ff80, slow: number = 1.0): number => {
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

export let spawnXpOrb = (x: number, y: number, xp: number, r: number = 2, abgr: number = GREEN): number => {
    let id = alloc();
    if (id < 1) return -1;
    type[id] = TYPE_XP_ORB;
    radius[id] = 4;
    posX[id] = x;
    posY[id] = y;
    velX[id] = 0;
    velY[id] = 0;
    damage[id] = xp;
    color[id] = abgr;
    return id;
};

let damageEnemy = (id: number, amt: number): void => {
    hp[id] -= amt * (player.bonus_ > 0 ? 2 : 1);
    if (hp[id] <= 0) {
        spawnXpOrb(posX[id], posY[id], damage[id], max(2, floor(damage[id] * .5)));
        zzfx([.3, , 900, .07, .08, .01, 1, .1, , , 109, , .02, , .9, , , .53, , , 662]);
        burstParticle.position_[X] = posX[id];
        burstParticle.position_[Y] = posY[id];
        setV4fToColour(burstParticle.colourBegin_, RED);
        burstParticle.colourBegin_[A] = 0.8;
        setV4fToColour(burstParticle.colourEnd_, RED);
        burstParticle.colourEnd_[A] = 0;
        burstParticle.sizeBegin_ = radius[id];
        emitParticles(burstParticle, 10);
        alive[id] = 0;
    }
};

let damagePlayer = (amt: number): void => {
    if (lifetime[0] <= 0) {
        triggerShake(15, 50);
        if (player.shield_ <= 0) {
            player.hp_ -= max(1, amt - player.defense_);
            zzfx([, .6, 325, .04, .02, .04, 2, 3, , , , , , .5, 1, .1, , .8, .07]);
        } else {
            player.shield_ = max(0, player.shield_ - 1);
            zzfx([, , , .05, .05, .3, , 3, -20, , , , , , 200, .2, , .9]);
        }
        lifetime[0] = 0.8;
        if (player.hp_ <= 0) {
            alive[0] = 0;
        }
    }
};

let handlePlayerEnemyCollision = (enemyId: number, nx: number, ny: number, overlap: number) => {
    if (!isCircleOverlappingEnemyRect(posX[0], posY[0], radius[0], enemyId)) return;
    posX[enemyId] += nx * overlap; posY[enemyId] += ny * overlap;
    damagePlayer(damage[enemyId]);
};

let handleProjectileEnemyCollision = (projectileId: number, enemyId: number) => {
    if (enemyHitSet[enemyId].includes(projectileId)) return;
    enemyHitSet[enemyId][enemyHitSetCount[enemyId]++] = projectileId;
    zzfx([.3, , 550, .01, .03, .05, 1, 1.5, -2, , 250]);
    damageEnemy(enemyId, damage[projectileId] + player.damage_);
    if (knockback[projectileId] > 0) {
        let pv = hypot(velX[projectileId], velY[projectileId]);
        let kx: number, ky: number;
        if (pv > 0) {
            kx = velX[projectileId] / pv;
            ky = velY[projectileId] / pv;
        } else {
            if (calcVec(posX[projectileId], posY[projectileId], posX[enemyId], posY[enemyId])) {
                kx = vecCalc[NX];
                ky = vecCalc[NY];
            } else {
                return;
            }
        }
        posX[enemyId] += kx * knockback[projectileId];
        posY[enemyId] += ky * knockback[projectileId];
    }
    hp[projectileId] -= 1;
    if (hp[projectileId] <= 0) {
        alive[projectileId] = 0;
    }
};

export let updateEntities = (deltaMs: number): void => {
    if (activeCount === 0 || alive[0] === 0) return;
    gridCounts.fill(0);

    nearestEnemyPos[X] = -1;
    nearestEnemyPos[Y] = -1;

    let pX = posX[0], pY = posY[0];
    let dt = deltaMs * 0.001;

    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        let t = type[id];

        if (!alive[id]) {
            free(id);
            continue;
        }

        if (t & TYPE_ENEMY) {
            enemyHitSetCount[id] = 0;
            let baseSpeed = 35 + timeData[TIME_STAGE] * 2.5;
            if (player.stealthed_ <= 0) {
                calcVec(posX[id], posY[id], pX, pY);
                if (vecCalc[DIST] > 1e-6) {
                    velX[id] = vecCalc[NX] * baseSpeed * speedMult[id] * slowFactor[id];
                    velY[id] = vecCalc[NY] * baseSpeed * speedMult[id] * slowFactor[id];
                    slowFactor[id] = 1.0;
                } else {
                    velX[id] = 0;
                    velY[id] = 0;
                }
                if (shootPeriod[id] > 0) {
                    shootTimer[id] -= dt;
                    if (shootTimer[id] <= 0) {
                        if (vecCalc[DIST] > 0 && vecCalc[DIST] < SCREEN_HALF + 30) {
                            let speed = 160;
                            let dmg = floor(damage[id] * .5);
                            spawnProjectile(posX[id], posY[id], vecCalc[NX] * speed, vecCalc[NY] * speed, max(3, dmg), dmg, 5, 1, PURPLE, true);
                            zzfxPlay(enemyShoot);
                        }
                        shootTimer[id] += shootPeriod[id];
                    }
                }
            }
        } else if (t & TYPE_PROJECTILE) {
            lifetime[id] -= dt;
            if (lifetime[id] <= 0) {
                free(id);
                continue;
            }
        } else if (t & TYPE_PLAYER) {
            if (velX[id] !== 0) {
                playerDir = velX[id] < 0 ? 0 : 1;
                velX[id] = velX[id] * EULER ** (-5 * dt);
                if (velX[id] < 1 && velX[id] > -1) {
                    velX[id] = 0;
                }
                velX[id] = clamp(velX[id], -300, 300);
            }
            if (velY[id] !== 0) {
                velY[id] = velY[id] * EULER ** (-5 * dt);
                if (velY[id] < 1 && velY[id] > -1) {
                    velY[id] = 0;
                }
                velY[id] = clamp(velY[id], -300, 300);
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
        } else if (t & TYPE_XP_ORB) {
            velX[id] *= EULER ** (-2 * dt);
            velY[id] *= EULER ** (-2 * dt);
            calcVec(posX[id], posY[id], pX, pY);
            let speed = 10;
            if (vecCalc[DIST] <= 50) {
                speed = 200;
            } else if (vecCalc[DIST] <= 100) {
                speed = 100;
            }
            velX[id] = vecCalc[NX] * speed;
            velY[id] = vecCalc[NY] * speed;
        }

        posX[id] += velX[id] * dt;
        posY[id] += velY[id] * dt;

        if (t === TYPE_PLAYER || t === TYPE_ENEMY) {
            posX[id] = clamp(posX[id], 0 + radius[id], WORLD_WIDTH - radius[id]);
            posY[id] = clamp(posY[id], 0 + radius[id], WORLD_HEIGHT - radius[id]);
        } else if (t === TYPE_PROJECTILE || t === TYPE_HOSTILE_PROJECTILE) {
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
                calcVec(posX[i], posY[i], posX[j], posY[j]);
                let rsum = radius[i] + radius[j];
                if (vecCalc[DIST] >= rsum || vecCalc[DIST] === 0) continue;
                let overlap = (rsum - vecCalc[DIST]);

                let ti = type[i], tj = type[j];

                if ((ti & TYPE_ENEMY) && (tj & TYPE_ENEMY)) {
                    let ri = radius[i];
                    let rj = radius[j];
                    let total_r = ri + rj;
                    if (total_r <= 0) total_r = 1;
                    let push_i = overlap * (rj / total_r);
                    let push_j = overlap * (ri / total_r);
                    posX[i] -= vecCalc[NX] * push_i; posY[i] -= vecCalc[NY] * push_i;
                    posX[j] += vecCalc[NX] * push_j; posY[j] += vecCalc[NY] * push_j;
                    continue;
                }

                if ((ti & TYPE_PLAYER) && (tj & TYPE_ENEMY)) {
                    handlePlayerEnemyCollision(j, vecCalc[NX], vecCalc[NY], overlap);
                    continue;
                }

                if ((tj & TYPE_PLAYER) && (ti & TYPE_ENEMY)) {
                    handlePlayerEnemyCollision(i, vecCalc[NX], vecCalc[NY], -overlap);
                    continue;
                }

                if ((ti & TYPE_PROJECTILE) && !(ti & TYPE_HOSTILE_PROJECTILE) && (tj & TYPE_ENEMY)) {
                    handleProjectileEnemyCollision(i, j);
                    continue;
                }

                if ((tj & TYPE_PROJECTILE) && !(tj & TYPE_HOSTILE_PROJECTILE) && (ti & TYPE_ENEMY)) {
                    handleProjectileEnemyCollision(j, i);
                    continue;
                }

                if ((ti & TYPE_HOSTILE_PROJECTILE) && (tj & TYPE_PLAYER)) {
                    damagePlayer(damage[i]);
                    hp[i] -= 1;
                    if (hp[i] <= 0) {
                        alive[i] = 0;
                    }
                    continue;
                }

                if ((tj & TYPE_HOSTILE_PROJECTILE) && (ti & TYPE_PLAYER)) {
                    damagePlayer(damage[j]);
                    hp[j] -= 1;
                    if (hp[j] <= 0) {
                        alive[j] = 0;
                    }
                    continue;
                }

                if (((ti & TYPE_PLAYER) && (tj & TYPE_XP_ORB)) || ((ti & TYPE_XP_ORB) && (tj & TYPE_PLAYER))) {
                    let orbId = ti & TYPE_XP_ORB ? i : j;
                    gainXp(damage[orbId]);
                    alive[orbId] = 0;
                    continue;
                }
            }
        }
    }

    for (let n = activeCount - 1; n >= 0; n--) {
        let id = activeIds[n];
        if (!alive[id] || !(type[id] & TYPE_AURA)) continue;
        let ar = radius[id];
        let cx_min = clamp(floor((pX - ar) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
        let cx_max = clamp(floor((pX + ar) / GRID_CELL_SIZE), 0, GRID_WIDTH - 1);
        let cy_min = clamp(floor((pY - ar) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
        let cy_max = clamp(floor((pY + ar) / GRID_CELL_SIZE), 0, GRID_HEIGHT - 1);
        for (let cy = cy_min; cy <= cy_max; cy++) {
            for (let cx = cx_min; cx <= cx_max; cx++) {
                let gi = cy * GRID_WIDTH + cx;
                let gc = gridCounts[gi];
                let gbase = gi * MAX_PER_CELL;
                for (let k = 0; k < gc; k++) {
                    let eid = gridIds[gbase + k];
                    if (!alive[eid] || !(type[eid] & TYPE_ENEMY)) continue;
                    calcVec(pX, pY, posX[eid], posY[eid]);
                    let rsum = ar + radius[eid];
                    if (vecCalc[DIST] < rsum) {
                        damageEnemy(eid, damage[id] * dt);
                        slowFactor[eid] = min(slowFactor[eid], slowFactor[id]);
                    }
                }
            }
        }
    }
};

export let drawEntities = (): void => {
    if (activeCount === 0) return;
    for (let n = 0; n < activeCount; n++) {
        let id = activeIds[n];
        if (type[id] & TYPE_AURA) {
            let r = radius[id];
            pushTexturedQuad(TEXTURE_C_16x16, sPosX[id] - r, sPosY[id] - r, r * 0.125, color[id] || 0x33ffffff);
        } else {
            continue;
        }
    }

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
            continue;
        } else if (t & TYPE_XP_ORB) {
            pushTexturedQuad(142, sPosX[id] - r, sPosY[id] - r, d < 9 ? 1 : d * 0.125, color[id] || WHITE);
        } else if (t & TYPE_ENEMY) {
            pushTexturedQuad(TEXTURE_RAT, sPosX[id] - r, sPosY[id] - r, d * 0.0625, lightningFlash || timeData[TIME_STAGE] < 16 ? color[id] : BLACK, velX[id] < 0, false, true);
        } else {
            let d = r * 2;
            let tex = d < 4 ? null : d < 9 ? TEXTURE_C_4x4 + (d - 4) : TEXTURE_C_8x8;
            if (tex) {
                pushTexturedQuad(tex, sPosX[id] - r, sPosY[id] - r, d < 9 ? 1 : d * 0.125, color[id] || WHITE);
            } else {
                pushQuad(sPosX[id] - r, sPosY[id] - r, d, d, color[id] || WHITE);
            }
            if (t & TYPE_PROJECTILE) {
                burstParticle.position_[X] = posX[id];
                burstParticle.position_[Y] = posY[id];
                if (t & TYPE_HOSTILE_PROJECTILE) {
                    setV4fToColour(burstParticle.colourBegin_, PURPLE);
                    setV4fToColour(burstParticle.colourEnd_, PURPLE);
                } else if (t & TYPE_PROJECTILE) {
                    setV4fToColour(burstParticle.colourBegin_, RED);
                    setV4fToColour(burstParticle.colourEnd_, RED);
                }
                burstParticle.colourEnd_[A] = 0;
                burstParticle.sizeBegin_ = d;
                emitParticle(burstParticle);
            }
        }
    };

    if (velX[0] !== 0 || velY[0] !== 0 || lifetime[0] > 0) {
        if (lifetime[0] > 0 && floor(lifetime[0] * 10) % 2 == 1) {
            catParticle.colourBegin_[R] = 0.8;
        } else {
            catParticle.colourBegin_[R] = 0;
        }
        catParticle.position_[X] = posX[0];
        catParticle.position_[Y] = posY[0];
        catParticle.velocityVariation_[0] = 250;
        catParticle.velocityVariation_[1] = 250;
        emitParticles(catParticle, 5);
        catParticle.velocityVariation_[0] = 75;
        catParticle.velocityVariation_[1] = 75;
        emitParticles(catParticle, 5);

        eyeParticle.position_[Y] = catParticle.position_[Y] - 1;
        eyeParticle.position_[X] = catParticle.position_[X] - 3;
        emitParticles(eyeParticle, 2);
        eyeParticle.position_[X] += 6;
        emitParticles(eyeParticle, 2);
    } else {
        pushTexturedQuad(TEXTURE_CAT_01, sPosX[0] - 8, sPosY[0] - 8, 1, BLACK, playerDir === 0, false, false, true);
    }
    if (player.shield_ > 0) {
        pushTexturedQuad(TEXTURE_C_16x16, sPosX[0] - 16, sPosY[0] - 16, 2, 0x33aa0000);
    }
};
