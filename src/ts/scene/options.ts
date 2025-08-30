import { boop, boopGood, zzfxPlay } from "../audio";
import { pushText, WHITE } from "../draw";
import { gameState, saveGame } from "../gameState";
import { A_PRESSED, B_PRESSED, DOWN_PRESSED, UP_PRESSED } from "../input";
import { createScene, switchToScene } from "../scene";
import { mainMenuScene } from "./mainMenu";

let selected = 0;
let options: string[] = [];

let setup = (): void => {
    selected = 0;
    options = [gameState[GS_MUTEMUSIC] === 1 ? "unmute music" : "mute music", "back"];
};

let update = (delta: number): void => {
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
        zzfxPlay(boopGood);
        switch (selected) {
            case 0:
                gameState[GS_MUTEMUSIC] = (gameState[GS_MUTEMUSIC] + 1) % 2;
                options[0] = gameState[GS_MUTEMUSIC] === 1 ? "unmute music" : "mute music";
                saveGame();
                break;
            case 1:
                switchToScene(mainMenuScene.id_);
                break;
        }
    } else if (B_PRESSED) {
        switchToScene(mainMenuScene.id_);
    }
};

let draw = (): void => {
    for (let i = 0; i < 2; i++) {
        pushText((selected === i ? ">" : "") + options[i], SCREEN_LEFT + 8, SCREEN_DIM - 8 - 24 + (i * 24), WHITE, 2, TEXT_ALIGN_LEFT, TEXT_ALIGN_BOTTOM);
    }
};

export let optionsScene = createScene(setup, update, draw, () => { });