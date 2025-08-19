import { cameraPos, cameraTarget, updateCamera, vCameraPos } from "../camera";
import { pushQuad, pushText, pushTexturedQuad, WHITE } from "../draw";
import { drawEntities, initEntities, playerId, posX, posY, spawnEnemy, spawnOrbit, spawnPlayer, spawnRadialBurst, updateEntities, updatePlayerVel } from "../entity";
import { gameState, xpTable } from "../gameState";
import { A_PRESSED, B_PRESSED, DOWN_IS_DOWN, LEFT_IS_DOWN, RIGHT_IS_DOWN, UP_IS_DOWN } from "../input";
import { ceil, clamp, cos, EULER, floor, PI, randInt, sin } from "../math";
import { createScene } from "../scene";
import { drawWorld, generateWorld } from "../world";

let setup = (): void => {
    gameState[GS_TIME] = 0;
    generateWorld();
    initEntities();
    spawnPlayer(250, 250, 8, 0xff22ccff);
    let cx = 250, cy = 250;
    cameraPos[X] = 250;
    cameraPos[Y] = 250;
    vCameraPos[X] = 250;
    vCameraPos[Y] = 250;
    cameraTarget[X] = 250;
    cameraTarget[Y] = 250;
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
        // Offer levelup rewards.
        // Generate Player Powerups
        // Render out the 3 rewards and a skip option
        if (A_PRESSED) {
            gameState[GS_PLAYER_MOVE] += 10;
            gameState[GS_LEVELUP_PENDING] = 0;
        }
        if (B_PRESSED) { }
        if (DOWN_IS_DOWN) {
        } else if (UP_IS_DOWN) {
        }
        if (RIGHT_IS_DOWN) {
        } else if (LEFT_IS_DOWN) {
        }
    } else {
        gameState[GS_TIME] += dt;
        let acc = EULER ** (gameState[GS_PLAYER_MOVE] * dt);
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
    // for (let x = 0; x < 21; x++) {
    //     for (let y = 0; y < 21; y++) {
    //         pushTexturedQuad(TEXTURE_DITH_00 + clamp(floor(gameState[GS_TIME] / 20), 0, 15), SCREEN_LEFT + x * 16, y * 16, 1, 0xff000000);
    //     }
    // }
    drawWorld();
    drawEntities();
};

let drawGUI = (delta: number): void => {
    let hpPer = ceil(gameState[GS_PLAYER_HP] / gameState[GS_PLAYER_MAXHP] * 100);
    let xpNext = xpTable[gameState[GS_PLAYER_LEVEL]];
    let xpPer = clamp(floor(gameState[GS_PLAYER_XP] / xpNext * 100), 0, 100);
    pushText(`lvl  ${gameState[GS_PLAYER_LEVEL]}`, 0, 0);
    pushText(`hp   ${gameState[GS_PLAYER_HP]}/${gameState[GS_PLAYER_MAXHP]}`, 0, 10);
    pushQuad(0, 20, 100, 8, 0xffffffff);
    pushQuad(0, 21, hpPer, 6, 0xff0000aa);
    pushText(`xp   ${gameState[GS_PLAYER_XP]}/${xpNext}`, 0, 30);
    pushQuad(0, 40, 100, 8, 0xffffffff);
    pushQuad(0, 41, xpPer, 6, 0xff336600);
    pushText(`luck ${gameState[GS_PLAYER_LUCK]}`, 0, 50);
    pushText(`atk  ${gameState[GS_PLAYER_ATK]}`, 0, 60);
    pushText(`def  ${gameState[GS_PLAYER_DEF]}`, 0, 70);
    pushText(`cd   ${gameState[GS_PLAYER_COOLDOWN]}`, 0, 80);
    pushText(`ms   ${gameState[GS_PLAYER_MOVE]}`, 0, 90);

    if (gameState[GS_LEVELUP_PENDING]) {
        pushQuad(SCREEN_LEFT + 50, 50, SCREEN_DIM - 100, SCREEN_DIM - 100, 0xff000000);
        pushText("press a to level up", SCREEN_CENTER_X, SCREEN_CENTER_Y, WHITE, 1, TEXT_ALIGN_CENTER);
    }
};

export let gameScene = createScene(setup, update, draw, drawGUI);