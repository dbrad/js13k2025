import { cameraPos, cameraTarget, updateCamera, vCameraPos } from "../camera";
import { BLACK, clearLightning, pushQuad, pushText, updateLightning, WHITE } from "../draw";
import { drawEntities, hp, initEntities, posX, posY, spawnOffscreenEnemy, spawnPlayer, updateEntities, velX, velY } from "../entity";
import { drawWorld, gameStage, generateWorld, updateTime, WORLD_HEIGHT, WORLD_WIDTH } from "../gameMap";
import { gameState, getRunTime } from "../gameState";
import { A_PRESSED, DOWN_IS_DOWN, DOWN_PRESSED, LEFT_IS_DOWN, RIGHT_IS_DOWN, UP_IS_DOWN, UP_PRESSED } from "../input";
import { ceil, clamp, floor, max, min, randInt, sqrt } from "../math";
import { getRandomUpgrades, player, resetPlayer, updatePlayerAbilities, UPGRADE_POOL, xpTable } from "../player";
import { createScene, switchToScene } from "../scene";
import { gameoverData, gameOverScene } from "./gameOver";

let upgradeSelectRow = 0;
let upgrades: Upgrade[] = [];
let timer = 0;
let gameover = false;
let bossSpawn = false;
let bossAlive = false;
let bossId = -1;

let setup = (): void => {
    gameover = bossSpawn = bossAlive = false;
    bossId = -1;
    resetPlayer();
    generateWorld();
    initEntities();
    clearLightning();
    let cx = cameraPos[X] = vCameraPos[X] = cameraTarget[X] = WORLD_WIDTH * 0.5;
    let cy = cameraPos[Y] = vCameraPos[Y] = cameraTarget[Y] = WORLD_HEIGHT * 0.5;
    spawnPlayer(cx, cy, 8);
};

let update = (delta: number): void => {
    if (gameover) return;
    let dt = delta * 0.001;
    gameState[GS_RUNTIME] += dt;
    if (bossAlive) {
        bossAlive = hp[bossId] > 0;
        if (!bossAlive) {
            clearLightning();
        }
    }
    if (player.hp_ <= 0) {
        switchToScene(gameOverScene.id_);
        gameoverData[0] = "you died";
        gameover = true;
    } else {
        if (player.levelUpPending_) {
            if (upgrades.length === 0) {
                upgrades = getRandomUpgrades(3, player.level_ === 1);
            }
            if (A_PRESSED) {
                if (upgradeSelectRow === 3) {
                    player.luck_--;
                } else {
                    upgrades[upgradeSelectRow].apply_();
                    player.luck_++;
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
            if (!bossSpawn) {
                updateTime(dt);
            } else if (bossSpawn && !bossAlive) {
                updateTime(-dt);
                if (gameStage === -1) {
                    switchToScene(gameOverScene.id_);
                    gameoverData[0] = "you are the night";
                    gameover = true;
                }
            }
            if (gameStage > 15) {
                updateLightning(delta);
                if (!bossSpawn) {
                    bossId = spawnOffscreenEnemy(500, 64, 25, 0xff3c053c, true);
                    bossSpawn = true;
                    bossAlive = true;
                }
            }

            let vx = 0;
            let vy = 0;
            if (DOWN_IS_DOWN) {
                vy = 1;
            } else if (UP_IS_DOWN) {
                vy = -1;
            }
            if (RIGHT_IS_DOWN) {
                vx = 1;
            } else if (LEFT_IS_DOWN) {
                vx = -1;
            }
            if (vx !== 0 || vy !== 0) {
                let d = sqrt(vx * vx + vy * vy);
                if (d > 1e-6) {
                    velX[0] = (vx / d) * player.speed_;
                    velY[0] = (vy / d) * player.speed_;
                }
            }

            timer += delta;
            if (timer >= 500) {
                timer -= 500;
                let s = randInt(1, gameStage);
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s);
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s);
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s, 0xff3c053c, false, 3);
            }

            updateEntities(delta);
            updatePlayerAbilities(delta);
            updateCamera(posX[0], posY[0], delta);
        }
    }
};

let draw = (): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    drawWorld();
    drawEntities();
};

let w = SCREEN_GUTTER - 4;
let drawGUI = (): void => {
    pushText(getRunTime(), SCREEN_GUTTER / 2, SCREEN_HEIGHT - 8, WHITE, 1, TEXT_ALIGN_CENTER);
    let hpPer = ceil(player.hp_ / player.maxHP_ * w);
    let xpNext = xpTable[player.level_];
    let xpPer = clamp(floor(player.xp_ / xpNext * w), 0, w);
    pushText(`lvl  ${player.level_}`, 1, 0);
    pushText(`hp`, 1, 10);
    pushQuad(2, 20, w, 8, WHITE);
    pushQuad(2, 21, hpPer, 6, 0xff0000aa);
    pushText(`xp`, 1, 30);
    pushQuad(2, 40, w, 8, WHITE);
    pushQuad(2, 41, xpPer, 6, 0xff336600);
    // pushText(`luck   ${player.luck_}`, 1, 50); // TODO WHAT DO YOU DOOOOO
    pushText(`damage ${player.damage_}`, 2, 60);
    pushText(`armor  ${player.defense_}`, 1, 70);
    pushText(`rate   ${100 + player.cooldown_}%`, 1, 80);
    pushText(`move   ${player.speed_}`, 1, 90);

    pushQuad(SCREEN_RIGHT + 2, 0, w, 1, WHITE);
    for (let i = 0; i < player.abilities_.length; i++) {
        let a = player.abilities_[i];
        let offset = 4 + i * 35;
        pushText(UPGRADE_POOL[a.id_].name_, SCREEN_RIGHT + 1, offset);
        if (a.type_ === BULLET || a.type_ === PASSIVE) {
            pushQuad(SCREEN_RIGHT + 2, 10 + offset, w, 8, WHITE);
            pushQuad(SCREEN_RIGHT + 2, 10 + offset + 1, clamp((1 - a.timer_ / (a.cooldown_ * (100 / (100 + player.cooldown_)))) * w, 0, w), 6, 0xff0000aa);
        } else {
            pushText("aura", SCREEN_RIGHT + 1, 10 + offset, 0xff666666);
        }
        pushText(`lvl ${a.level_}`, SCREEN_RIGHT + 1, 20 + offset, 0xff666666);
        pushQuad(SCREEN_RIGHT + 2, 31 + offset, w, 1, WHITE);
    }

    if (player.levelUpPending_) {
        pushQuad(SCREEN_LEFT, 0, SCREEN_DIM + 1, SCREEN_DIM + 1, 0xcc000000);
        for (let i = 0; i < upgrades.length; i++) {
            if (upgradeSelectRow === i) {
                pushQuad(SCREEN_LEFT, (84 * i), SCREEN_DIM + 1, 84, WHITE);
            }
            pushQuad(SCREEN_LEFT + 1, 1 + (84 * i), SCREEN_DIM - 1, 82, BLACK);
            pushText(upgrades[i].name_, SCREEN_CENTER_X, 1 + 42 + (84 * i) - 1, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushText(upgrades[i].description_, SCREEN_CENTER_X, 1 + 42 + (84 * i) + 1, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
        }
        if (upgradeSelectRow === 3) {
            pushQuad(SCREEN_LEFT + 83, (84 * 3), SCREEN_DIM - 166, 84, WHITE);
        }
        pushQuad(SCREEN_LEFT + 84, 1 + (84 * 3), SCREEN_DIM - 168, 82, BLACK);
        pushText("SKIP", SCREEN_CENTER_X, 1 + 42 + (84 * 3), WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_MIDDLE);
    }

    if (bossAlive) {
        pushText("r.o.u.s", SCREEN_CENTER_X, SCREEN_DIM - 14, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
        pushQuad(SCREEN_CENTER_X - 50, SCREEN_DIM - 12, 100, 8, WHITE);
        pushQuad(SCREEN_CENTER_X - 50, SCREEN_DIM - 11, hp[bossId] / 500 * 100, 6, 0xff0000aa);
    }
};

export let gameScene = createScene(setup, update, draw, drawGUI);