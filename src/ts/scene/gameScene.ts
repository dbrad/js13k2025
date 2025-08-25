import { cameraPos, cameraTarget, updateCamera, vCameraPos } from "../camera";
import { BLACK, pushQuad, pushText, updateLightning, WHITE } from "../draw";
import { drawEntities, hp, initEntities, posX, posY, spawnOffscreenEnemy, spawnPlayer, updateEntities, updatePlayerVel } from "../entity";
import { gameState, newGame } from "../gameState";
import { A_PRESSED, DOWN_IS_DOWN, DOWN_PRESSED, LEFT_IS_DOWN, RIGHT_IS_DOWN, UP_IS_DOWN, UP_PRESSED } from "../input";
import { ceil, clamp, EULER, floor, max, min, randInt } from "../math";
import { getRandomUpgrades, player, resetPlayer, updatePlayerAbilities, UPGRADE_POOL, xpTable } from "../player";
import { createScene, switchToScene } from "../scene";
import { drawWorld, generateWorld, WORLD_HEIGHT, WORLD_WIDTH } from "../world";
import { mainMenuScene } from "./mainMenu";

let upgradeSelectRow = 0;
let upgrades: Upgrade[] = [];
let timer = 0;
let gameover = false;
let bossSpawn = false;
let bossAlive = false;
let bossId = -1;

let setup = (): void => {
    gameover = bossSpawn = false;
    resetPlayer();
    newGame();
    generateWorld();
    initEntities();
    let cx = cameraPos[X] = vCameraPos[X] = cameraTarget[X] = WORLD_WIDTH / 2;
    let cy = cameraPos[Y] = vCameraPos[Y] = cameraTarget[Y] = WORLD_HEIGHT / 2;
    spawnPlayer(cx, cy, 8);
};

let update = (delta: number): void => {
    let dt = delta * 0.001;
    gameState[GS_RUNTIME] += dt;
    if (bossAlive) {
        bossAlive = hp[bossId] > 0;
    }
    if (player.hp_ <= 0 && !gameover) {
        switchToScene(mainMenuScene.id_);
        gameover = true;
    } else {
        if (gameState[GS_LEVELUP_PENDING]) {
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
                gameState[GS_LEVELUP_PENDING] = 0;
            }
            if (DOWN_PRESSED) {
                upgradeSelectRow = min(upgradeSelectRow + 1, 3);
            } else if (UP_PRESSED) {
                upgradeSelectRow = max(upgradeSelectRow - 1, 0);
            }
        } else {
            if (!bossSpawn) {
                gameState[GS_TIME] += dt;
            } else if (bossSpawn && !bossAlive) {
                gameState[GS_TIME] -= dt;
            }
            if (gameState[GS_TIME] >= 192) {
                updateLightning(delta);
                if (!bossSpawn) {
                    bossId = spawnOffscreenEnemy(500, 64, 25);
                    bossSpawn = true;
                    bossAlive = true;
                }
            }
            let acc = EULER ** (player.speed_ * dt);
            let velx = 0;
            let vely = 0;
            if (DOWN_IS_DOWN) {
                vely += acc;
            } else if (UP_IS_DOWN) {
                vely -= acc;
            }
            if (RIGHT_IS_DOWN) {
                velx += acc;
            } else if (LEFT_IS_DOWN) {
                velx -= acc;
            }

            updatePlayerVel(velx, vely);

            timer += delta;
            if (timer >= 500) {
                timer -= 500;
                let s = randInt(0, floor(gameState[GS_TIME] / 12));
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s);
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s);
                spawnOffscreenEnemy(3 + s, 8 + s, 1 + s);
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
    pushText(`luck   ${player.luck_}`, 1, 50); // TODO WHAT DO YOU DOOOOO
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

    if (gameState[GS_LEVELUP_PENDING]) {
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