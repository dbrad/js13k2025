import { pushText, WHITE } from "../draw";
import { A_PRESSED, B_PRESSED } from "../input";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

let setup = (): void => { };

let update = (delta: number): void => {
    if (A_PRESSED || B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
};

let draw = (delta: number): void => {
    pushText("options", SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, 1, TEXT_ALIGN_RIGHT, TEXT_ALIGN_BOTTOM);
};

export let optionsScene = createScene(setup, update, draw);