import { boop, boop_good, thunder, zzfxPlay } from "../audio";
import { pushQuad, pushText, pushTexturedQuad, WHITE } from "../draw";
import { loadGame, newGame, saveFileExists, saveGame } from "../gameState";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "../input";
import { randInt } from "../math";
import { createScene, switchToScene } from "../scene";
import { gameScene } from "./gameScene";
import { optionsScene } from "./options";

let selected = 0;
let options = ["new game", "options"];
let numOptions = 2;

let nextInter = 1000;
let nextDur = 50;
let flash = false;

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
    if (nextInter <= 0) {
        flash = true;
        if (nextDur <= 0) {
            zzfxPlay(thunder);
            flash = false;
            nextInter = randInt(50, 10000);
            nextDur = randInt(50, 200);
        } else {
            nextDur -= delta;
        }
    } else {
        nextInter -= delta;
    }

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
    if (flash) {
        pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    }

    pushText("i am the", SCREEN_CENTER_X, 20, flash ? 0xff000000 : WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("night", SCREEN_CENTER_X, 20 + 16, flash ? 0xff000000 : WHITE, 4, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushTexturedQuad(TEXTURE_CAT_01, SCREEN_RIGHT - 104, SCREEN_DIM - 104, 6, WHITE, true, false, true);

    for (let i = 0; i < numOptions; i++) {
        pushText((selected === i ? ">" : "") + options[i], SCREEN_LEFT + 8, SCREEN_DIM - 8 - (24 * (numOptions - 1)) + (i * 24), flash ? 0xff000000 : WHITE, 2, TEXT_ALIGN_LEFT, TEXT_ALIGN_BOTTOM);
    }
};

export let mainMenuScene = createScene(setup, update, draw);