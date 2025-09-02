import { boop, boopGood, zzfxPlay } from "../audio";
import { BLACK, lightningFlash, pushQuad, pushText, pushTexturedQuad, updateLightning, WHITE } from "../draw";
import { gameState, loadGame, saveGame } from "../gameState";
import { A_PRESSED, B_PRESSED, buttonActions, DOWN_PRESSED, UP_PRESSED } from "../input";
import { createScene, switchToScene } from "../scene";
import { gameScene, runInfo } from "./gameScene";
import { optionsScene } from "./options";

let mode = 0;

let selected = 0;
let options = ["new game", "options"];
let optionsDiff: string[] = [];

let setup = (): void => {
    loadGame();
    selected = 0;
    mode = 0;
    buttonActions[0] = "accept";
    buttonActions[1] = "cancel";
    optionsDiff = ["act I"];
    if (gameState[GS_PROGRESS] > 0) {
        optionsDiff.push("act II");
    }
    if (gameState[GS_PROGRESS] > 1) {
        optionsDiff.push("act III");
    }
    if (gameState[GS_PROGRESS] > 2) {
        optionsDiff.push("random");
        // optionsDiff.push("i am the night");
    }
    optionsDiff.push("back");
};

let update = (delta: number): void => {
    updateLightning(delta);

    if (UP_PRESSED) {
        if (selected > 0) {
            selected--;
            zzfxPlay(boop);
        }
    } else if (DOWN_PRESSED) {
        if (selected < (mode === 0 ? 1 : optionsDiff.length - 1)) {
            selected++;
            zzfxPlay(boop);
        }
    } else if (A_PRESSED) {
        zzfxPlay(boopGood);
        if (mode === 0) {
            switch (selected) {
                case 0:
                    mode = 1;
                    selected = 0;
                    break;
                case 1:
                    switchToScene(optionsScene.id_);
            }
        } else {
            if (selected === optionsDiff.length - 1) {
                selected = 0;
                mode = 0;
            } else {
                runInfo[0] = selected;
                runInfo[1] = 0;
                if (selected === 3 || selected === 4) {
                    runInfo[1] = 1;
                }
                gameState[GS_RUNCOUNT]++;
                saveGame();
                switchToScene(gameScene.id_);
            }
        }
    } else if (B_PRESSED) {
        zzfxPlay(boopGood);
        selected = 0;
        mode = 0;
    }
};

let draw = (): void => {
    if (lightningFlash) {
        pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    }
    pushText("i am the", SCREEN_CENTER_X, 20, lightningFlash ? BLACK : WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("night", SCREEN_CENTER_X, 20 + 16, lightningFlash ? BLACK : WHITE, 4, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushTexturedQuad(TEXTURE_CAT_01, SCREEN_RIGHT - 104, SCREEN_DIM - 104, 6, BLACK, true, false, true);
    for (let i = 0; i < (mode ? optionsDiff.length : 2); i++) {
        pushText((selected === i ? ">" : "") + (mode ? optionsDiff[i] : options[i]), SCREEN_LEFT + 8, SCREEN_DIM - 8 - (24 * (mode ? optionsDiff.length - 1 : 1)) + (i * 24), lightningFlash ? BLACK : WHITE, 2, TEXT_ALIGN_LEFT, TEXT_ALIGN_BOTTOM);
    }
};

export let mainMenuScene = createScene(setup, update, draw, () => { });
