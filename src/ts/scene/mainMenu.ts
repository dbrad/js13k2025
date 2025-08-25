import { boop, boop_good, zzfxPlay } from "../audio";
import { BLACK, lightningFlash, pushQuad, pushText, pushTexturedQuad, updateLightning, WHITE } from "../draw";
import { loadGame } from "../gameState";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "../input";
import { createScene, switchToScene } from "../scene";
import { gameScene } from "./gameScene";
import { optionsScene } from "./options";

let selected = 0;
let options = ["new game", "options"];

let setup = (): void => {
    selected = 0;
};

let update = (delta: number): void => {
    updateLightning(delta);

    if (UP_PRESSED) {
        if (selected > 0) {
            selected--;
            zzfxPlay(boop);
        }
    } else if (DOWN_PRESSED) {
        if (selected < 1) {
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
                switchToScene(optionsScene.id_);
                break;
        }
    }
};

let draw = (): void => {
    if (lightningFlash) {
        pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    }
    pushText("i am the", SCREEN_CENTER_X, 20, lightningFlash ? BLACK : WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("night", SCREEN_CENTER_X, 20 + 16, lightningFlash ? BLACK : WHITE, 4, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushTexturedQuad(TEXTURE_CAT_01, SCREEN_RIGHT - 104, SCREEN_DIM - 104, 6, BLACK, true, false, true);
    for (let i = 0; i < 2; i++) {
        pushText((selected === i ? ">" : "") + options[i], SCREEN_LEFT + 8, SCREEN_DIM - 8 - 24 + (i * 24), lightningFlash ? BLACK : WHITE, 2, TEXT_ALIGN_LEFT, TEXT_ALIGN_BOTTOM);
    }
};

export let mainMenuScene = createScene(setup, update, draw, () => { });