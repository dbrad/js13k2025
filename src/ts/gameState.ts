import { roundTo } from "./math";
import { player } from "./player";

let saveFileName = "js13k2025dbrad";
let storage = window.localStorage;

export let gameState: GameState;

export let saveFileExists = (): boolean => {
    return storage.getItem(saveFileName) !== null;
};

export let xpTable: number[] = Array.from({ length: 30 }, (_, i) => roundTo(50 * (1.5 ** (i - 1)), 5));

export let xpUp = (val: number) => {
    player.xp_ += val;
    let nextLevel = xpTable[player.level_];
    if (player.xp_ >= nextLevel) {
        player.xp_ -= nextLevel;
        player.level_ += 1;
        gameState[GS_LEVELUP_PENDING] = 1;
    }
};

export let newGame = (): void => {
    gameState = [
        0, // GS_TIME
        0, // GS_LEVELUP_PENDING
    ];
};

export let saveGame = (): void => {
    let json = JSON.stringify(gameState);
    let b64 = btoa(json);
    storage.setItem(saveFileName, b64);
};

export let loadGame = (): void => {
    let b64 = storage.getItem(saveFileName);
    if (b64) {
        gameState = JSON.parse(atob(b64)) as GameState;
    } else {
        newGame();
        saveGame();
    }
};
