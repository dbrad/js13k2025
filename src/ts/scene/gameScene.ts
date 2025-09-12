import { enemyShoot, playMusic, zzfxPlay } from "../audio";
import { cameraPos, cameraTarget, updateCamera, vCameraPos } from "../camera";
import { BLACK, clearLightning, GREEN, PURPLE, pushQuad, pushText, RED, updateLightning, WHITE } from "../draw";
import { drawEntities, enemyCount, hp, initEntities, posX, posY, spawnEnemy, spawnOffscreenEnemy, spawnPlayer, spawnRadialBurst, updateEntities, velX, velY } from "../entity";
import { drawWorld, generateWorld, timeData, updateTime, WORLD_HEIGHT, WORLD_WIDTH } from "../gameMap";
import { gameState, getRunTime, saveGame } from "../gameState";
import { A_PRESSED, B_PRESSED, buttonActions, DOWN_IS_DOWN, DOWN_PRESSED, LEFT_IS_DOWN, RIGHT_IS_DOWN, UP_IS_DOWN, UP_PRESSED } from "../input";
import { ceil, clamp, floor, hypot, max, min, randInt, random } from "../math";
import { getRandomUpgrades, player, resetPlayerStats, updatePlayerAbilities, UPGRADE_POOL, xpTable } from "../player";
import { createScene, switchToScene } from "../scene";
import { gameoverData, gameOverScene } from "./gameOver";

let upgradeSelectRow = 0;
let upgrades: Upgrade[] = [];
let timer = 0;
let gameover = false;
let bossSpawn = false;
let bossAlive = false;
let bossId = -1;
let paused = false;
let track = 0;
let waveIdx = 0;
let endCine = 0;
export let runInfo = [0, 0];

type BossDef = [string, number, number, number, number, number, number];
let bosses: BossDef[] = [
    ["r.o.u.s.", 1000, 96, 25, BLACK, 0, 0.8],
    ["ratromancer", 500, 64, 25, PURPLE, 2, 0.1],
    ["rat king", 500, 32, 25, RED, 0, 0.2],
];

type WaveDef = { hp_: number, radius_: number, dmg_: number, color_: number, shootPeriod_: number, speed_: number, count_: number; }; // SpawnConfig: hp, radius, dmg, color, shootPeriod, speed, count
let waves: WaveDef[][] = [ // Waves: time implied by index (48s intervals)
    [
        { hp_: 2, radius_: 8, dmg_: 1, color_: RED, shootPeriod_: 0, speed_: 1.5, count_: 10 },
        { hp_: 3, radius_: 12, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 0.9, count_: 5 }
    ], // Fast
    [
        { hp_: 10, radius_: 16, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 0.7, count_: 10 },
        { hp_: 5, radius_: 10, dmg_: 1, color_: PURPLE, shootPeriod_: 3, speed_: 0.3, count_: 5 },
    ], // Big+shooters
    [
        { hp_: 10, radius_: 16, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 0.7, count_: 10 },
        { hp_: 6, radius_: 8, dmg_: 2, color_: RED, shootPeriod_: 0, speed_: 1.2, count_: 15 }
    ], // Medium
    [
        { hp_: 15, radius_: 20, dmg_: 4, color_: PURPLE, shootPeriod_: 5, speed_: 0.3, count_: 5 },
        { hp_: 6, radius_: 8, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 1, count_: 20 },
    ], // Big+fodder
    [
        { hp_: 10, radius_: 16, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 0.7, count_: 10 },
        { hp_: 5, radius_: 12, dmg_: 4, color_: PURPLE, shootPeriod_: 1, speed_: 0.2, count_: 10 }
    ], // Shooters
    [
        { hp_: 10, radius_: 16, dmg_: 2, color_: BLACK, shootPeriod_: 0, speed_: 0.7, count_: 10 },
        { hp_: 8, radius_: 14, dmg_: 2, color_: RED, shootPeriod_: 0, speed_: 1.3, count_: 30 }
    ], // Fast medium
    [
        { hp_: 30, radius_: 24, dmg_: 10, color_: BLACK, shootPeriod_: 0, speed_: 0.5, count_: 10 }
    ], // Very big
    [
        { hp_: 10, radius_: 10, dmg_: 2, color_: PURPLE, shootPeriod_: 4, speed_: 0.2, count_: 10 },
        { hp_: 10, radius_: 8, dmg_: 2, color_: RED, shootPeriod_: 0, speed_: 1.5, count_: 15 }
    ], // Many shooters + Speeders
    [
        { hp_: 10, radius_: 8, dmg_: 1, color_: RED, shootPeriod_: 0, speed_: 1.3, count_: 20 },
        { hp_: 30, radius_: 32, dmg_: 10, color_: BLACK, shootPeriod_: 0, speed_: 0.5, count_: 10 }
    ], // Swarm
    [
        { hp_: 12, radius_: 18, dmg_: 2, color_: PURPLE, shootPeriod_: 3, speed_: 0.3, count_: 3 },
        { hp_: 30, radius_: 32, dmg_: 5, color_: BLACK, shootPeriod_: 0, speed_: 0.5, count_: 5 },
        { hp_: 10, radius_: 8, dmg_: 1, color_: RED, shootPeriod_: 0, speed_: 1.2, count_: 10 }
    ], // Balanced
    [
        { hp_: 12, radius_: 18, dmg_: 4, color_: PURPLE, shootPeriod_: 3, speed_: 0.4, count_: 6 },
        { hp_: 30, radius_: 32, dmg_: 10, color_: BLACK, shootPeriod_: 0, speed_: 0.6, count_: 10 },
        { hp_: 10, radius_: 8, dmg_: 2, color_: RED, shootPeriod_: 0, speed_: 1.3, count_: 20 }
    ], // Bigger Balanced
];

let setup = (): void => {
    if (runInfo[0] > 2) {
        runInfo[0] = randInt(0, 2);
    }
    waveIdx = 0;
    endCine = 0;
    track = 0;
    buttonActions[0] = "dash";
    buttonActions[1] = "pause";
    gameover = bossSpawn = bossAlive = false;
    bossId = -1;

    let cx = cameraPos[X] = vCameraPos[X] = cameraTarget[X] = WORLD_WIDTH * 0.5;
    let cy = cameraPos[Y] = vCameraPos[Y] = cameraTarget[Y] = WORLD_HEIGHT * 0.5;
    resetPlayerStats();
    generateWorld();
    initEntities();
    clearLightning();
    spawnPlayer(cx, cy, 8);
};

let update = (delta: number, dt: number): void => {
    playMusic(delta, track);
    if (gameover) {
        if (endCine <= -1) return;
        updateEntities(delta, dt);
        updateCamera(posX[0], posY[0], delta, dt);
        endCine += delta;
        timeData[TIME_STAGE] = max(0, 16 - floor(endCine / 250));
        if (endCine >= 6000) {
            endCine = -1;
            switchToScene(gameOverScene.id_);
        }
        return;
    }
    if (paused) {
        if (B_PRESSED) {
            paused = false;
            buttonActions[0] = "dash";
            buttonActions[1] = "pause";
        }
        return;
    }
    if (bossAlive) {
        bossAlive = hp[bossId] > 0;
        if (!bossAlive) {
            track = 1;
            clearLightning();
        }
    }
    if (player.hp_ <= 0) {
        switchToScene(gameOverScene.id_);
        gameoverData[0] = "you died";
        gameoverData[1] = "game over";
        gameover = true;
    } else {
        if (player.levelUpPending_) {
            if (upgrades.length === 0) {
                buttonActions[0] = "accept";
                buttonActions[1] = "";
                upgrades = getRandomUpgrades(3, player.level_ === 1);
            }
            if (A_PRESSED) {
                buttonActions[0] = "dash";
                buttonActions[1] = "pause";
                if (upgradeSelectRow === 3) {
                    player.hp_ = min(player.maxHP_, player.hp_ + player.maxHP_ * .2);
                } else {
                    upgrades[upgradeSelectRow].apply_();
                }
                upgrades = [];
                upgradeSelectRow = 0;
                player.levelUpPending_ = false;
            }
            if (DOWN_PRESSED) {
                upgradeSelectRow = min(upgradeSelectRow + 1, 3);
            } else if (UP_PRESSED) {
                upgradeSelectRow = max(upgradeSelectRow - 1, 0);
            }
        } else {
            if (B_PRESSED) {
                paused = true;
                buttonActions[0] = "";
                buttonActions[1] = "unpause";
                return;
            }
            timeData[TIME_LENGTH] += dt;
            if (!bossSpawn) {
                updateTime(dt, runInfo[1] === 5);
                if (waveIdx < waves.length && timeData[TIME_LENGTH] >= waveIdx * 48) {
                    for (let enemy of waves[waveIdx]) {
                        for (let i = 0; i < enemy.count_; i++) {
                            let scaling = randInt(1, timeData[TIME_STAGE]);
                            spawnOffscreenEnemy(
                                enemy.hp_ + scaling * 2 + runInfo[1],
                                enemy.radius_ + scaling * 0.5,
                                enemy.dmg_ + scaling * 0.5 + runInfo[1],
                                enemy.color_,
                                false,
                                enemy.shootPeriod_,
                                enemy.speed_);
                        }
                    }
                    waveIdx++;
                }
            } else if (bossSpawn && !bossAlive) {
                if (enemyCount <= 0) {
                    gameover = true;
                    gameoverData[0] = "you are the night";
                    gameoverData[1] = "victory";
                    gameState[GS_PROGRESS] = max(runInfo[0] + 1, gameState[GS_PROGRESS]);
                    saveGame();
                    return;
                }
            }
            if (timeData[TIME_STAGE] > 15 && timeData[TIME_TRACKER] >= 480) {
                updateLightning(delta);
                if (!bossSpawn) {
                    let boss = bosses[runInfo[0]];
                    bossId = spawnOffscreenEnemy(boss[1] + (50 * runInfo[1]), boss[2], boss[3] + (5 * runInfo[1]), boss[4], true, boss[5], boss[6]);
                    bossSpawn = true;
                    bossAlive = true;
                }
            }

            let dash = false;
            if (A_PRESSED && player.dash_ >= 1000) {
                player.dash_ -= 1000;
                dash = true;
                player.onDash_();
            } else {
                player.dash_ = min(1000, player.dash_ + delta);
            }

            let vx = 0;
            let vy = 0;
            if (DOWN_IS_DOWN) {
                vy = 1;
            }
            if (UP_IS_DOWN) {
                vy = -1;
            }
            if (RIGHT_IS_DOWN) {
                vx = 1;
            }
            if (LEFT_IS_DOWN) {
                vx = -1;
            }
            if (vx !== 0 || vy !== 0) {
                let d = hypot(vx, vy);
                if (d > 1e-6) {
                    velX[0] += (vx / d) * (5 + player.speed_) * 100 * dt * (dash ? 100 : 1);
                    velY[0] += (vy / d) * (5 + player.speed_) * 100 * dt * (dash ? 100 : 1);
                }
            }

            if (player.stealthed_ <= 0) {
                player.bonus_ = max(0, player.bonus_ - delta);
            }
            player.stealthed_ = max(0, player.stealthed_ - delta);

            timer += delta;
            if (timer >= 1000) {
                timer -= 1000;
                if (bossSpawn && bossAlive) {
                    switch (runInfo[0]) {
                        case 1:
                            spawnRadialBurst(posX[bossId], posY[bossId], 8, 200, true);
                            zzfxPlay(enemyShoot);
                            break;
                        case 2:
                            for (let i = 0; i < 5; i++)
                                spawnEnemy(posX[bossId], posY[bossId], 8, 1 + runInfo[1], 1 + runInfo[1], RED, true, 0, 1.5);
                            break;
                    }
                }
                if (!(bossSpawn && !bossAlive)) {
                    let scaling = randInt(1, timeData[TIME_STAGE]);
                    let count = randInt(1, 2 + floor(timeData[TIME_STAGE] / 4));
                    for (let i = 0; i < count; i++) {
                        if (bossSpawn && bossAlive) spawnOffscreenEnemy(1 + scaling + runInfo[1], 4 + scaling, 1 + runInfo[1], RED, false, 0, 1.1);
                        if (random() < 0.2) spawnOffscreenEnemy(5 + scaling * 2 + runInfo[1], 8 + scaling, 1 + scaling + runInfo[1], PURPLE, false, 3, 0.3);
                        else spawnOffscreenEnemy(5 + scaling * 2 + runInfo[1], 8 + scaling, 1 + scaling + runInfo[1]);
                    }
                }
            }
            updateEntities(delta, dt);
            updatePlayerAbilities(delta);
            updateCamera(posX[0], posY[0], delta, dt);
        }
    }
};

let draw = (delta: number, dt: number): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    drawWorld();
    drawEntities(delta, dt);
};

let w = SCREEN_GUTTER - 4;
let drawGUI = (): void => {
    pushText(getRunTime(), SCREEN_GUTTER * .5, SCREEN_HEIGHT - 8, WHITE, 1, TEXT_ALIGN_CENTER);

    if (bossSpawn && !bossAlive && !gameover) {
        pushText("finish them all", SCREEN_CENTER_X, SCREEN_DIM * .1, WHITE, 2, TEXT_ALIGN_CENTER);
    }

    if (!gameover) {
        let hpPer = ceil(player.hp_ / player.maxHP_ * w);
        let xpNext = xpTable[player.level_];
        let xpPer = clamp(floor(player.xp_ / xpNext * w), 0, w);
        pushText(`lvl  ${player.level_}`, 2, 0);
        pushText(`hp`, 2, 10);
        pushQuad(2, 20, w, 8, WHITE);
        pushQuad(2, 21, hpPer, 6, 0xff0000aa);
        pushText(`xp`, 2, 30);
        pushQuad(2, 40, w, 8, WHITE);
        pushQuad(2, 41, xpPer, 6, GREEN);
        pushText(`bonuses`, 2, 60, 0xff666666);
        pushText(`damage  ${player.damage_}`, 2, 70);
        pushText(`armor   ${player.defense_}`, 2, 80);
        pushText(`move    ${player.speed_}`, 2, 90);
        pushText(`rate   +${player.cooldown_}%`, 2, 100);

        pushQuad(SCREEN_RIGHT + 3, 0, w, 1, WHITE);
        for (let i = 0; i < player.abilities_.length; i++) {
            let a = player.abilities_[i];
            let offset = 4 + i * 35;
            pushText(UPGRADE_POOL[a.id_].name_, SCREEN_RIGHT + 3, offset);
            if (a.type_ === COOLDOWN) {
                pushQuad(SCREEN_RIGHT + 3, 10 + offset, w, 8, WHITE);
                pushQuad(SCREEN_RIGHT + 3, 10 + offset + 1, clamp((1 - a.timer_ / (a.cooldown_ * (100 / (100 + player.cooldown_)))) * w, 0, w), 6, 0xff0000aa);
            } else {
                pushText(a.type_ === AURA ? "aura" : "passive", SCREEN_RIGHT + 3, 10 + offset, 0xff666666);
            }
            pushText(`lvl ${a.level_}`, SCREEN_RIGHT + 3, 20 + offset, 0xff666666);
            pushQuad(SCREEN_RIGHT + 3, 31 + offset, w, 1, WHITE);
        }

        if (player.stealthed_ > 0) {
            pushText("stealthed", SCREEN_RIGHT + SCREEN_GUTTER * .5, SCREEN_DIM - 50, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushQuad(SCREEN_RIGHT + 3, SCREEN_DIM - 50, player.stealthed_ / player.stealthedMax_ * w, 20, 0xff13ba13);
        } else if (player.bonus_ > 0) {
            pushText("bonus", SCREEN_RIGHT + SCREEN_GUTTER * .5, SCREEN_DIM - 50, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushQuad(SCREEN_RIGHT + 3, SCREEN_DIM - 50, player.bonus_ / player.bonusMax_ * w, 20, 0xff13ba13);
        }

        pushQuad(SCREEN_RIGHT + 3, SCREEN_DIM - 20, w, 20, WHITE);
        pushQuad(SCREEN_RIGHT + 3, SCREEN_DIM - 20, player.dash_ / 1000 * w, 20, player.dash_ >= 1000 ? 0xff13ba13 : RED);
        pushText("dash", SCREEN_RIGHT + SCREEN_GUTTER * .5, SCREEN_DIM - 10, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_MIDDLE);

        if (bossAlive) {
            pushText(bosses[runInfo[0]][0], SCREEN_CENTER_X, SCREEN_DIM - 14, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushQuad(SCREEN_CENTER_X - 50, SCREEN_DIM - 12, 100, 8, WHITE);
            pushQuad(SCREEN_CENTER_X - 50, SCREEN_DIM - 11, hp[bossId] / bosses[runInfo[0]][1] * 100, 6, 0xff0000aa);
        }

        if (player.levelUpPending_) {
            pushQuad(SCREEN_LEFT, 0, SCREEN_DIM + 1, SCREEN_DIM + 1, 0xcc000000);
            for (let i = 0; i < upgrades.length; i++) {
                if (upgradeSelectRow === i) {
                    pushQuad(SCREEN_LEFT, (84 * i), SCREEN_DIM + 1, 84, WHITE);
                }
                pushQuad(SCREEN_LEFT + 1, 1 + (84 * i), SCREEN_DIM - 1, 82, BLACK);
                pushText(upgrades[i].name_, SCREEN_CENTER_X, 1 + 42 + (84 * i) - 1, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
                pushText(upgrades[i].description_, SCREEN_CENTER_X, 1 + 42 + (84 * i) + 8, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
            }
            if (upgradeSelectRow === 3) {
                pushQuad(SCREEN_LEFT + 83, (84 * 3), SCREEN_DIM - 166, 84, WHITE);
            }
            pushQuad(SCREEN_LEFT + 84, 1 + (84 * 3), SCREEN_DIM - 168, 82, BLACK);
            pushText("skip", SCREEN_CENTER_X, 1 + 42 + (84 * 3), WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushText("heal 20%", SCREEN_CENTER_X, 1 + 42 + (84 * 3) + 8, 0xff666666, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
        }

        if (paused) {
            pushQuad(SCREEN_LEFT + 8, SCREEN_DIM * .333, SCREEN_DIM - 16, SCREEN_DIM * .333, 0xaa000000);
            pushText("paused", SCREEN_CENTER_X, SCREEN_DIM * .5, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_MIDDLE);
        }
    }
};

export let gameScene = createScene(setup, update, draw, drawGUI);