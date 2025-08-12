import { pushText, WHITE } from "../draw";
import { A_PRESSED, B_PRESSED } from "../input";
import { math } from "../math";
import { emitParticles, starParticle } from "../particle";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

let setup = (): void => { };

let update = (delta: number): void => {
    if (A_PRESSED || B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
    starParticle.colourBegin_[R] = math.random();
    starParticle.colourBegin_[G] = math.random();
    starParticle.colourBegin_[B] = math.random();
    starParticle.colourEnd_[R] = math.random();
    starParticle.colourEnd_[G] = math.random();
    starParticle.colourEnd_[B] = math.random();
    emitParticles(starParticle, 10);
};

let draw = (delta: number): void => {
    pushText("game", SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, 1, TEXT_ALIGN_RIGHT, TEXT_ALIGN_BOTTOM);
};

export let gameScene = createScene(setup, update, draw);