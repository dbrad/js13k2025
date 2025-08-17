import { cameraPos, cameraTarget, updateCamera } from "../camera";
import { pushQuad, pushTexturedQuad, WHITE } from "../draw";
import { drawEntities, initEntities, playerId, posX, posY, spawnEnemy, spawnPlayer, spawnRadialBurst, updateEntities, updatePlayerVel } from "../entity";
import { A_PRESSED, B_PRESSED, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, setKeyPulseTime, UP_PRESSED } from "../input";
import { createScene } from "../scene";

let setup = (): void => {
    setKeyPulseTime([D_UP, D_DOWN, D_RIGHT, D_LEFT], 1);
    initEntities();
    spawnPlayer(250, 250, 8, 0xff22ccff);
    let cx = 250, cy = 250;
    cameraPos[X] = 250;
    cameraPos[Y] = 250;
    cameraTarget[X] = 250;
    cameraTarget[Y] = 250;
    let enemyRing = 60, ringRadius = 300;
    for (let k = 0; k < enemyRing; k++) {
        let a = (2 * Math.PI * k) / enemyRing;
        let ex = cx + Math.cos(a) * ringRadius;
        let ey = cy + Math.sin(a) * ringRadius;
        spawnEnemy(ex, ey, 8, 3, 0xff000000);
    }
};

let update = (delta: number): void => {
    let acc = 15 * 0.06 * delta;
    let velx = 0;
    let vely = 0;
    if (A_PRESSED || B_PRESSED) {
        spawnRadialBurst(posX[playerId], posY[playerId], 24, 300, 2, 1.5, 1);
    }
    if (DOWN_PRESSED) {
        vely += acc;
    } else if (UP_PRESSED) {
        vely -= acc;
    }
    if (RIGHT_PRESSED) {
        velx += acc;
    } else if (LEFT_PRESSED) {
        velx -= acc;
    }

    updatePlayerVel(velx, vely);
    updateEntities(delta);
    updateCamera(posX[playerId], posY[playerId], delta);
};

let draw = (delta: number): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 23; y++) {
            pushTexturedQuad(TEXTURE_DITH_00 + x, 36 + SCREEN_LEFT + x * 16, y * 16, 1, 0xff000000);
        }
    }
    pushQuad(SCREEN_LEFT + 292, 0, 48, SCREEN_DIM, 0xff000000);
    drawEntities();
};

export let gameScene = createScene(setup, update, draw);