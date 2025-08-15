import { pushQuad, pushTexturedQuad, WHITE } from "../draw";
import { gameState } from "../gameState";
import { A_PRESSED, B_PRESSED, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, setKeyPulseTime, UP_PRESSED } from "../input";
import { emitParticles, starParticle } from "../particle";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

let setup = (): void => {
    setKeyPulseTime([D_UP, D_DOWN, D_RIGHT, D_LEFT], 25);
};

let moveAndEmit = (x: number, y: number, dir: number) => {
    gameState[GS_PLAYERDIR] = dir;
    gameState[GS_PLAYERPOS][X] += x;
    gameState[GS_PLAYERPOS][Y] += y;
    starParticle.position_[X] = gameState[GS_PLAYERPOS][X] + 8;
    starParticle.position_[Y] = gameState[GS_PLAYERPOS][Y] + 8;
    emitParticles(starParticle, 10);
};

let update = (delta: number): void => {
    if (A_PRESSED || B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
    if (DOWN_PRESSED) {
        moveAndEmit(0, 8, gameState[GS_PLAYERDIR]);
    } else if (UP_PRESSED) {
        moveAndEmit(0, -8, gameState[GS_PLAYERDIR]);
    }
    if (RIGHT_PRESSED) {
        moveAndEmit(8, 0, 1);
    } else if (LEFT_PRESSED) {
        moveAndEmit(-8, 0, 0);
    }
};

let draw = (delta: number): void => {
    pushQuad(SCREEN_LEFT, 0, 100, SCREEN_HEIGHT - 16, WHITE);
    pushQuad(SCREEN_RIGHT - 100, 0, 100, SCREEN_HEIGHT - 16, WHITE);
    pushTexturedQuad(14, gameState[GS_PLAYERPOS][X], gameState[GS_PLAYERPOS][Y], 1, WHITE, (gameState[GS_PLAYERDIR] == 0), false, true);
};

export let gameScene = createScene(setup, update, draw);