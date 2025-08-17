let saveFileName = "js13k2025dbrad";
let storage = window.localStorage;

export let gameState: GameState;

export let saveFileExists = (): boolean => {
    return storage.getItem(saveFileName) !== null;
};

export let newGame = (): void => {
    gameState = [
        [SCREEN_LEFT + SCREEN_HALF - 8, SCREEN_HALF - 8], // GS_PLAYERPOS
        [0, 0], // GS_PLAYERVEL
        1, // GS_PLAYERDIR
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
