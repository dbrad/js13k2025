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
};

export let optionsScene = createScene(setup, update, draw);