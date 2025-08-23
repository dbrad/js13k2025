import { EULER, max, min, round } from "./math";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./world";

export let cameraPos: V2 = [0, 0];
export let vCameraPos: V2 = [0, 0];
export let cameraTarget: V2 = [0, 0];


export let updateCamera = (x: number, y: number, delta: number): void => {
    cameraTarget[X] = x;
    cameraTarget[Y] = y;

    let minX = SCREEN_HALF;
    let maxX = WORLD_WIDTH - SCREEN_HALF;
    let minY = SCREEN_HALF;
    let maxY = WORLD_HEIGHT - SCREEN_HALF;

    cameraTarget[X] = max(minX, min(maxX, cameraTarget[X]));
    cameraTarget[Y] = max(minY, min(maxY, cameraTarget[Y]));

    let dx = cameraTarget[X] - vCameraPos[X];
    let dy = cameraTarget[Y] - vCameraPos[Y];
    let distSq = dx * dx + dy * dy;

    let stiffness = 3 + distSq * 0.00005;

    let lerpFactor = 1 - EULER ** (-stiffness * delta * 0.001);

    vCameraPos[X] += (cameraTarget[X] - vCameraPos[X]) * lerpFactor;
    vCameraPos[Y] += (cameraTarget[Y] - vCameraPos[Y]) * lerpFactor;

    cameraPos[X] = round(vCameraPos[X]);
    cameraPos[Y] = round(vCameraPos[Y]);
};
