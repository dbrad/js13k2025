import { pushQuad, pushTexturedQuad, WHITE } from "../draw";
import { gameState } from "../gameState";
import { A_PRESSED, B_PRESSED, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, setKeyPulseTime, UP_PRESSED } from "../input";
import { catParticle, emitParticles, eyeParticle } from "../particle";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

let setup = (): void => {
    setKeyPulseTime([D_UP, D_DOWN, D_RIGHT, D_LEFT], 1);
};

const pxPer16 = 40;
const decayPer16 = 0.95;

let update = (delta: number): void => {
    let ds = delta * 0.001;
    let acc = pxPer16 * 0.06 * delta;

    if (A_PRESSED || B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
    if (DOWN_PRESSED) {
        gameState[GS_PLAYERVEL][Y] += acc;
    } else if (UP_PRESSED) {
        gameState[GS_PLAYERVEL][Y] -= acc;
    }
    if (RIGHT_PRESSED) {
        gameState[GS_PLAYERVEL][X] += acc;
    } else if (LEFT_PRESSED) {
        gameState[GS_PLAYERVEL][X] -= acc;
    }

    if (gameState[GS_PLAYERVEL][X] !== 0) {
        gameState[GS_PLAYERDIR] = gameState[GS_PLAYERVEL][X] < 0 ? 0 : 1;
        gameState[GS_PLAYERVEL][X] = gameState[GS_PLAYERVEL][X] * ((decayPer16 * 0.06) ** ds);
        if (gameState[GS_PLAYERVEL][X] < 10 && gameState[GS_PLAYERVEL][X] > -10) {
            gameState[GS_PLAYERVEL][X] = 0;
        }
    }
    if (gameState[GS_PLAYERVEL][Y] !== 0) {
        gameState[GS_PLAYERVEL][Y] = gameState[GS_PLAYERVEL][Y] * ((decayPer16 * 0.06) ** ds);
        if (gameState[GS_PLAYERVEL][Y] < 10 && gameState[GS_PLAYERVEL][Y] > -10) {
            gameState[GS_PLAYERVEL][Y] = 0;
        }
    }

    if (gameState[GS_PLAYERVEL][X] !== 0 || gameState[GS_PLAYERVEL][Y] !== 0) {
        gameState[GS_PLAYERPOS][X] += gameState[GS_PLAYERVEL][X] * ds;
        gameState[GS_PLAYERPOS][Y] += gameState[GS_PLAYERVEL][Y] * ds;

        catParticle.position_[X] = gameState[GS_PLAYERPOS][X] + 8;
        catParticle.position_[Y] = gameState[GS_PLAYERPOS][Y] + 8;
        emitParticles(catParticle, 10);

        eyeParticle.position_[Y] = catParticle.position_[Y] - 1;
        eyeParticle.position_[X] = catParticle.position_[X] - 3;
        emitParticles(eyeParticle, 2);
        eyeParticle.position_[X] += 6;
        emitParticles(eyeParticle, 2);
    }

    if (gameState[GS_PLAYERPOS][X] <= SCREEN_LEFT) {
        gameState[GS_PLAYERPOS][X] = SCREEN_LEFT;
        gameState[GS_PLAYERVEL][X] = 0;
    }
    if (gameState[GS_PLAYERPOS][X] >= SCREEN_RIGHT - 16) {
        gameState[GS_PLAYERPOS][X] = SCREEN_RIGHT - 16;
        gameState[GS_PLAYERVEL][X] = 0;
    }
    if (gameState[GS_PLAYERPOS][Y] <= 0) {
        gameState[GS_PLAYERPOS][Y] = 0;
        gameState[GS_PLAYERVEL][Y] = 0;
    }
    if (gameState[GS_PLAYERPOS][Y] >= SCREEN_DIM - 16) {
        gameState[GS_PLAYERPOS][Y] = SCREEN_DIM - 16;
        gameState[GS_PLAYERVEL][Y] = 0;
    }
};

let draw = (delta: number): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    pushQuad(SCREEN_LEFT + 292, 0, 48, SCREEN_DIM, 0xff000000);
    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 23; y++) {
            pushTexturedQuad(TEXTURE_DITH_00 + x, 36 + SCREEN_LEFT + x * 16, y * 16, 1, 0xff000000);
        }
    }
    pushTexturedQuad(TEXTURE_CAT_01, gameState[GS_PLAYERPOS][X], gameState[GS_PLAYERPOS][Y], 1, WHITE, (gameState[GS_PLAYERDIR] == 0), false, true);
};

export let gameScene = createScene(setup, update, draw);