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

let draw = (): void => {
    pushText(">back", SCREEN_LEFT + 8, SCREEN_DIM - 8, WHITE, 2, TEXT_ALIGN_LEFT, TEXT_ALIGN_BOTTOM);
};

export let optionsScene = createScene(setup, update, draw, () => { });