import { pushQuad, toABGR } from "./draw";
import { clearInput, updateHardwareInput, updateInputState } from "./input";
import { lerp } from "./math";
import { clearParticles, drawParticles, updateParticles } from "./particle";

export let TRANSITION_TIME = 300 as const;
export let TRANSITION_TIME_HALF = 150 as const;
export let TRANSITION_TIME_HALFWAY = 175 as const;

let currentSceneId: number = -1;
let targetSceneId: number = -1;

let scenes: Scene[] = [];

let transitionInProgress: boolean = false;
let transition: number = 0;
let sceneCleared: boolean = true;

let nextSceneId: number = 0;

export let createScene = (setup_: VoidFunction, update_: UpdateFunction, draw_: UpdateFunction): Scene => {
    return {
        id_: -1,
        setup_,
        update_,
        draw_,
    };
};

export let registerScene = (scene: Scene): void => {
    let id = nextSceneId++;
    scene.id_ = id;
    scenes[id] = scene;
    if (currentSceneId == -1) {
        scene.setup_();
        currentSceneId = id;
    }
};

export let switchToScene = (sceneId: number): void => {
    sceneCleared = false;
    targetSceneId = sceneId;
    transition = TRANSITION_TIME;
    transitionInProgress = true;
    clearInput();
};

export let updateScene = (delta: number, now: number): void => {
    if (transitionInProgress || transition > 0) {
        transition -= delta;
        if (transition <= 0) {
            transition = 0;
            transitionInProgress = false;
        } else if (transition < TRANSITION_TIME_HALFWAY) {
            if (!sceneCleared) {
                sceneCleared = true;
                clearInput();
                clearParticles();
                scenes[targetSceneId].setup_();
            }
            currentSceneId = targetSceneId;
        }
    }

    if (sceneCleared) {
        updateHardwareInput();
        updateInputState(delta);
        updateParticles(delta);
    }

    scenes[currentSceneId].update_(delta);
};

export let drawScene = (delta: number, now: number): void => {
    scenes[currentSceneId].draw_(delta);
    drawParticles();

    if (transitionInProgress) {
        let progress: number = 0;
        if (transition >= TRANSITION_TIME_HALFWAY) {
            progress = lerp(1, 0, (transition - TRANSITION_TIME_HALFWAY) / TRANSITION_TIME_HALF);
        } else if (transition > 0) {
            progress = lerp(0, 1, transition / TRANSITION_TIME_HALF);
        }
        let col = toABGR(0, 0, 0, progress * 255);
        pushQuad(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, col);
    }
};
