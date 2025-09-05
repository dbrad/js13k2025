import { BLACK, pushQuad, pushText, pushTexturedQuad, WHITE } from "../draw";
import { loadGame } from "../gameState";
import { buttonActions } from "../input";
import { createScene } from "../scene";

let setup = (): void => {
    loadGame();
    buttonActions[0] = "accept";
    buttonActions[1] = "cancel";
};

let update = (delta: number): void => { };

const MAX_SUM = 20 + 20;
const DITHER_LEVELS = 32;

let draw = (): void => {
    pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, SCREEN_DIM, WHITE);
    for (let x = 0; x < 21; x++) {
        for (let y = 0; y < 21; y++) {
            const sum = x + y;
            let level = (DITHER_LEVELS - 1) - Math.floor((sum / MAX_SUM) * (DITHER_LEVELS - 1));
            if (level > 15) {
                pushQuad(SCREEN_LEFT + x * 16, y * 16, 16, 16, BLACK);
            } else {
                pushTexturedQuad(TEXTURE_DITH_00 + level, SCREEN_LEFT + x * 16, y * 16, 1, BLACK);
            }
        }
    }
    pushText("i am the", SCREEN_CENTER_X - 2, SCREEN_DIM - 102, BLACK, 4, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("i am the", SCREEN_CENTER_X, SCREEN_DIM - 100, WHITE, 4, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("night", SCREEN_CENTER_X - 2, SCREEN_DIM - 67, BLACK, 8, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushText("night", SCREEN_CENTER_X, SCREEN_DIM - 65, WHITE, 8, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
    pushTexturedQuad(TEXTURE_CAT_01, SCREEN_LEFT + 115, 0, 14, BLACK, true, false, false, false);
};

export let coverImageScene = createScene(setup, update, draw, () => { });
