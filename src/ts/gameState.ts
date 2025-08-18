import { roundTo } from "./math";

let saveFileName = "js13k2025dbrad";
let storage = window.localStorage;

export let gameState: GameState;

export let saveFileExists = (): boolean => {
    return storage.getItem(saveFileName) !== null;
};

export let xpTable: number[] = Array.from({ length: 30 }, (_, i) => roundTo(50 * (1.5 ** (i - 1)), 5));

export let xpUp = (val: number) => {
    gameState[GS_PLAYER_XP] += val;
    let nextLevel = xpTable[gameState[GS_PLAYER_LEVEL]];
    if (gameState[GS_PLAYER_XP] >= nextLevel) {
        gameState[GS_PLAYER_XP] -= nextLevel;
        gameState[GS_PLAYER_LEVEL] += 1;
    }
};

export let newGame = (): void => {
    gameState = [
        10, // GS_PLAYER_HP
        10, // GS_PLAYER_MAXHP
        0, // GS_PLAYER_XP
        1, // GS_PLAYER_LEVEL
        0, // GS_PLAYER_LUCK
        0, // GS_PLAYER_ATK
        0, // GS_PLAYER_DEF
        140, // GS_PLAYER_MOVE
        500, // GS_PLAYER_MAXMOVE
        0, // GS_PLAYER_COOLDOWN
        0, // GS_TIME
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
