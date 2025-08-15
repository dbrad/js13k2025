import { boop, boop_good, zzfxPlay } from "../audio";
import { pushText, WHITE } from "../draw";
import { loadGame, newGame, saveFileExists, saveGame } from "../gameState";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "../input";
import { createScene, switchToScene } from "../scene";
import { gameScene } from "./gameScene";
import { optionsScene } from "./options";

let selected = 0;
let options = ["new game", "options"];
let numOptions = 2;

let setup = (): void => {
    if (saveFileExists()) {
        options = ["continue", "new game", "options"];
    } else {
        options = ["new game", "options"];
    }
    selected = 0;
    numOptions = options.length;
};

let update = (delta: number): void => {
    if (UP_PRESSED) {
        if (selected > 0) {
            selected--;
            zzfxPlay(boop);
        }
    } else if (DOWN_PRESSED) {
        if (selected < numOptions - 1) {
            selected++;
            zzfxPlay(boop);
        }
    } else if (A_PRESSED) {
        zzfxPlay(boop_good);
        switch (selected) {
            case 0:
                loadGame();
                switchToScene(gameScene.id_);
                break;
            case 1:
                if (numOptions === 3) {
                    newGame();
                    saveGame();
                    switchToScene(gameScene.id_);
                } else {
                    switchToScene(optionsScene.id_);
                }
                break;
            case 2:
                switchToScene(optionsScene.id_);
                break;
        }
    }
};

let draw = (delta: number): void => {
    pushText("i am the night", SCREEN_CENTER_X, 20, WHITE, 3, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("js13k 2025 entry by david brad", SCREEN_CENTER_X, 50, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);

    for (let i = 0; i < numOptions; i++) {
        pushText((selected === i ? "> " : "") + options[i], SCREEN_LEFT + 8, SCREEN_CENTER_Y + (24 * i), WHITE, 2);
    }
};

export let mainMenuScene = createScene(setup, update, draw);