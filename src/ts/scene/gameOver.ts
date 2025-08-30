import { animationFrame, pushText, WHITE } from "../draw";
import { getRunTime } from "../gameState";
import { A_PRESSED, B_PRESSED, buttonActions } from "../input";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

export let gameoverData = [""];
let setup = (): void => {
    buttonActions[0] = buttonActions[1] = "continue";
};

let update = (delta: number): void => {
    if (A_PRESSED || B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
};

let draw = (): void => {
    pushText(gameoverData[0], SCREEN_CENTER_X, SCREEN_CENTER_Y - 16, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
    pushText("game over", SCREEN_CENTER_X, SCREEN_CENTER_Y, WHITE, 3, TEXT_ALIGN_CENTER, TEXT_ALIGN_MIDDLE);
    pushText("run duration|" + getRunTime(), SCREEN_CENTER_X, SCREEN_CENTER_Y + 16, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    if (animationFrame) {
        pushText("action / cancel to continue", SCREEN_CENTER_X, SCREEN_DIM - 8, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_BOTTOM);
    }
};

export let gameOverScene = createScene(setup, update, draw, () => { });