import { timeData } from "./gameMap";
import { floor } from "./math";

let saveFileName = "js13k2025dbrad_0";
let storage = window.localStorage;

export let gameState: GameState = [0, 0, 0];

export let saveFileExists = (): boolean => {
    return storage.getItem(saveFileName) !== null;
};

export let getRunTime = (): string => {
    let m = floor(timeData[TIME_LENGTH] / 60);
    let s = floor(timeData[TIME_LENGTH]) % 60;
    return `${m.toFixed(0).padStart(2, "0")}:${s.toFixed(0).padStart(2, "0")}`;
};

export let newGame = (): void => {
    gameState = [
        0, // GS_RUNCOUNT
        0, // GS_MUTEMUSIC
        0, // GS_PROGRESS
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
