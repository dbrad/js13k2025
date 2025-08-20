import { cameraPos, cameraTarget, updateCamera, vCameraPos } from "../camera";
import { pushQuad, pushText, WHITE } from "../draw";
import { drawEntities, initEntities, playerId, posX, posY, spawnEnemy, spawnOrbit, spawnPlayer, spawnRadialBurst, updateEntities, updatePlayerVel } from "../entity";
import { gameState, newGame } from "../gameState";
import { A_PRESSED, B_PRESSED, DOWN_IS_DOWN, DOWN_PRESSED, LEFT_IS_DOWN, RIGHT_IS_DOWN, UP_IS_DOWN, UP_PRESSED } from "../input";
import { ceil, clamp, cos, EULER, floor, max, min, PI, randInt, sin } from "../math";
import { getWeightedRandomUpgrades, player, resetPlayer, xpTable } from "../player";
import { createScene } from "../scene";
import { drawWorld, generateWorld } from "../world";

let upgradeSelectRow = 0;
let upgrades: Upgrade[] = [];

let setup = (): void => {
    newGame();
    resetPlayer();
    generateWorld();
    initEntities();
    let cx = 1024, cy = 1024;
    spawnPlayer(cx, cy, 8, 0xff22ccff);
    cameraPos[X] = cx;
    cameraPos[Y] = cy;
    vCameraPos[X] = cx;
    vCameraPos[Y] = cy;
    cameraTarget[X] = cx;
    cameraTarget[Y] = cy;
    let enemyRing = 60, ringRadius = 300;
    for (let k = 0; k < enemyRing; k++) {
        let a = (2 * PI * k) / enemyRing;
        let ex = cx + cos(a) * ringRadius;
        let ey = cy + sin(a) * ringRadius;
        spawnEnemy(ex, ey, 8, 3, 0xff000000);
    }
};

let timer = 0;
let timer2 = 0;
let update = (delta: number): void => {
    let dt = delta * 0.001;
    if (gameState[GS_LEVELUP_PENDING]) {
        if (upgrades.length === 0) [
            upgrades = getWeightedRandomUpgrades(3)
        ];
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
        gameState[GS_TIME] += dt;
        let acc = EULER ** (player.speed_ * dt);
        let velx = 0;
        let vely = 0;
        if (A_PRESSED) { }
        if (B_PRESSED) { }
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
        timer2 += delta;
        if (timer >= 500) {
            timer -= 500;
            spawnEnemy(randInt(0, 2048), randInt(0, 2048), 8, 3, 0xff000000);
            spawnOrbit(posX[playerId], posY[playerId], 32, 4, 50, 0.05, 1);
        }
        if (timer2 > 1000) {
            timer2 -= 1000;
            spawnRadialBurst(posX[playerId], posY[playerId], 36, 300, 2, 1.5, 1);
        }

        updateEntities(delta);
        updateCamera(posX[playerId], posY[playerId], delta);
    }
};

let draw = (delta: number): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    drawWorld();
    drawEntities();
};

let drawGUI = (delta: number): void => {
    let hpPer = ceil(player.hp_ / player.maxHP_ * 100);
    let xpNext = xpTable[player.level_];
    let xpPer = clamp(floor(player.xp_ / xpNext * 100), 0, 100);
    pushText(`lvl  ${player.level_}`, 0, 0);
    pushText(`hp   ${player.hp_}/${player.maxHP_}`, 0, 10);
    pushQuad(0, 20, 100, 8, 0xffffffff);
    pushQuad(0, 21, hpPer, 6, 0xff0000aa);
    pushText(`xp   ${player.xp_}/${xpNext}`, 0, 30);
    pushQuad(0, 40, 100, 8, 0xffffffff);
    pushQuad(0, 41, xpPer, 6, 0xff336600);
    pushText(`luck ${player.luck_}`, 0, 50);
    pushText(`atk  ${player.damage_}`, 0, 60);
    pushText(`def  ${player.defense_}`, 0, 70);
    pushText(`cd   ${player.cooldown_}`, 0, 80);
    pushText(`ms   ${player.speed_}`, 0, 90);

    if (gameState[GS_LEVELUP_PENDING]) {
        pushQuad(SCREEN_LEFT, 0, SCREEN_DIM + 1, SCREEN_DIM + 1, 0xcc000000);
        for (let i = 0; i < upgrades.length; i++) {
            if (upgradeSelectRow === i) {
                pushQuad(SCREEN_LEFT, (84 * i), SCREEN_DIM + 1, 84, WHITE);
            }
            pushQuad(SCREEN_LEFT + 1, 1 + (84 * i), SCREEN_DIM - 1, 82, 0xff000000);
            pushText(upgrades[i].name_, SCREEN_CENTER_X, 1 + 42 + (84 * i) - 1, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
            pushText(upgrades[i].description_, SCREEN_CENTER_X, 1 + 42 + (84 * i) + 1, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
        }
        if (upgradeSelectRow === 3) {
            pushQuad(SCREEN_LEFT + 83, (84 * 3), SCREEN_DIM - 166, 84, WHITE);
        }
        pushQuad(SCREEN_LEFT + 84, 1 + (84 * 3), SCREEN_DIM - 168, 82, 0xff000000);
        pushText("SKIP", SCREEN_CENTER_X, 1 + 42 + (84 * 3), WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_MIDDLE);
    }
};

export let gameScene = createScene(setup, update, draw, drawGUI);