// Camera state
export let cameraPos: V2 = [0, 0];
export let cameraTarget: V2 = [0, 0];

let DEAD_ZONE_X = 24;
let DEAD_ZONE_Y = 24;

let CAMERA_LERP = 0.90;

export let updateCamera = (x: number, y: number, delta: number) => {
    let targetX = cameraTarget[X];
    let targetY = cameraTarget[Y];

    let left = cameraPos[X] - (SCREEN_HALF) + DEAD_ZONE_X;
    let right = cameraPos[X] + (SCREEN_HALF) - DEAD_ZONE_X;
    let top = cameraPos[Y] - (SCREEN_HALF) + DEAD_ZONE_Y;
    let bottom = cameraPos[Y] + (SCREEN_HALF) - DEAD_ZONE_Y;

    if (x < left) targetX = x - (SCREEN_HALF) + DEAD_ZONE_X;
    if (x > right) targetX = x + (SCREEN_HALF) - DEAD_ZONE_X;
    if (y < top) targetY = y - (SCREEN_HALF) + DEAD_ZONE_Y;
    if (y > bottom) targetY = y + (SCREEN_HALF) - DEAD_ZONE_Y;

    cameraTarget[X] = targetX;
    cameraTarget[Y] = targetY;

    let lerpFactor = 1 - Math.exp(-CAMERA_LERP * (delta * 0.001));
    cameraPos[X] += (cameraTarget[X] - cameraPos[X]) * lerpFactor;
    cameraPos[Y] += (cameraTarget[Y] - cameraPos[Y]) * lerpFactor;
};