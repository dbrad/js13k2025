import { cameraPos } from "./camera";
import { BLACK, lightningFlash, pushQuad, pushTexturedQuad } from "./draw";
import { gameState } from "./gameState";
import { ceil, clamp, floor, max, min } from "./math";

export let WORLD_WIDTH = 4096;
export let WORLD_HEIGHT = 4096;

export let WORLD_TILE_WIDTH = WORLD_WIDTH / 16;
export let WORLD_TILE_HEIGHT = WORLD_HEIGHT / 16;

export let worldMap = new Uint8Array(WORLD_TILE_WIDTH * WORLD_TILE_WIDTH);

export let generateWorld = (): void => {
    for (let x = 0; x < WORLD_TILE_WIDTH; x++) {
        for (let y = 0; y < WORLD_TILE_WIDTH; y++) {
            if (x < 3 || y < 3 || x > WORLD_TILE_WIDTH - 4 || y > WORLD_TILE_WIDTH - 4) {
                worldMap[x + y * WORLD_TILE_WIDTH] = 1;
            } else if (x < 4 || y < 4 || x > WORLD_TILE_WIDTH - 5 || y > WORLD_TILE_WIDTH - 5) {
                worldMap[x + y * WORLD_TILE_WIDTH] = 2;
            } else if (x < 5 || y < 5 || x > WORLD_TILE_WIDTH - 6 || y > WORLD_TILE_WIDTH - 6) {
                worldMap[x + y * WORLD_TILE_WIDTH] = 3;
            } else if (x < 6 || y < 6 || x > WORLD_TILE_WIDTH - 7 || y > WORLD_TILE_WIDTH - 7) {
                worldMap[x + y * WORLD_TILE_WIDTH] = 4;
            }
        }
    }
};

export let drawWorld = (): void => {
    let camLeft = floor((cameraPos[0] - SCREEN_HALF) / 16);
    let camRight = ceil((cameraPos[0] + SCREEN_HALF) / 16);
    let camTop = floor((cameraPos[1] - SCREEN_HALF) / 16);
    let camBottom = ceil((cameraPos[1] + SCREEN_HALF) / 16);

    let startX = max(0, camLeft);
    let endX = min(WORLD_TILE_WIDTH - 1, camRight);
    let startY = max(0, camTop);
    let endY = min(WORLD_TILE_HEIGHT - 1, camBottom);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            let tile = worldMap[x + y * WORLD_TILE_WIDTH];
            let offset = clamp(floor(gameState[GS_TIME] / 2), 0, 16);
            let screenX = x * 16 - (cameraPos[0] - SCREEN_HALF) + SCREEN_GUTTER;
            let screenY = y * 16 - (cameraPos[1] - SCREEN_HALF);

            if (tile === 1) {
                pushQuad(screenX, screenY, 16, 16, BLACK);
            } else if (tile > 1) {
                pushTexturedQuad(TEXTURE_DITH_15 - (tile - 2), screenX, screenY);
            }

            if (offset <= 15) {
                pushTexturedQuad(TEXTURE_DITH_00 + offset, screenX, screenY, 1, BLACK);
            } else if (!lightningFlash) {
                pushQuad(screenX, screenY, 16, 16, BLACK);
            }
        }
    }
};