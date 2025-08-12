let saveFileName = "js13k2025dbrad";
let storage = window.localStorage;

export let gameState: GameState;

export let saveFileExists = (): boolean => {
    return storage.getItem(saveFileName) !== null;
};

export let newGame = (): void => {
    gameState = [
        [0, 0], // GS_PLAYERPOS
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
        // VERSION UPGRADE LOGIC HERE IF NEEDED
        // saveGame();
    } else {
        newGame();
        saveGame();
    }
};
