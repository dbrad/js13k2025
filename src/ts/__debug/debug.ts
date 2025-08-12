import { pushQuad, pushText, WHITE } from "../draw";

let frameCount: number = 0;
let fps: number = 60;
let ms: number = 1000 / fps;
let updateTime: number = 0;
let drawTime: number = 0;
let renderTime: number = 0;

let averageFrameTime: number = 0;
let averageUpdateTime: number = 0;
let averageDrawTime: number = 0;
let averageRenderTime: number = 0;
let averageDrawCount: number = 0;

let displayMs: string = "";
let displayFrameTime: string = "";
let displayUpdateTime: string = "";
let displayDrawTime: string = "";
let displayRenderTime: string = "";
let displayDrawCount: string = "";

let nextFpsTime: number = 0;
let FPS_INTERVAL: number = 1000;

let nextDisplayTime: number = 0;
let DISPLAY_INTERVAL: number = 100;

let showPerformance: boolean = false;

export let initPerformanceMeter = (): void => {
    if (DEBUG) {
        showPerformance = false;
    }
};

export let togglePerformanceDisplay = (): void => {
    if (DEBUG) {
        showPerformance = !showPerformance;
    }
};

let background: number = 0xf0000000;
let col1: number = SCREEN_WIDTH - 8;
let col2: number = SCREEN_WIDTH - 160;

export let drawPerformanceMeter = (): void => {
    if (DEBUG) {
        if (showPerformance) {
            pushQuad(0, 0, SCREEN_WIDTH, 85, background);

            pushText(`fps ${fps.toFixed(0).padStart(7, " ")} hz`, col1, 5, WHITE, 1, TEXT_ALIGN_RIGHT);
            pushText(`frame ${displayMs} ms`, col1, 18, WHITE, 1, TEXT_ALIGN_RIGHT);
            pushText(`actual ${displayFrameTime} us`, col1, 31, WHITE, 1, TEXT_ALIGN_RIGHT);
            pushText(`update ${displayUpdateTime} us`, col1, 44, WHITE, 1, TEXT_ALIGN_RIGHT);
            pushText(`draw ${displayDrawTime} us`, col1, 57, WHITE, 1, TEXT_ALIGN_RIGHT);
            pushText(`render ${displayRenderTime} us`, col1, 70, WHITE, 1, TEXT_ALIGN_RIGHT);

            pushText(`draw calls ${displayDrawCount}`, col2, 70, WHITE, 1, TEXT_ALIGN_RIGHT);
        }
    }
};

export let tickPerformanceMeter = (delta: number, drawCount: number): void => {
    if (DEBUG) {
        let frameStartTime = performance.getEntriesByName("start_of_frame", "mark")[0].startTime;

        // MS
        ms = (0.9 * delta) + (0.1 * ms);
        if (ms > 250) {
            fps = 0;
            ms = 0;
            averageFrameTime = 0;
            averageUpdateTime = 0;
            averageDrawTime = 0;
            averageRenderTime = 0;
            averageDrawCount = 0;
        }

        // FPS
        if (frameStartTime >= nextFpsTime) {
            let lastUpdateTime = nextFpsTime - FPS_INTERVAL;
            let currentFps = frameCount * 1000;
            let actualDuration = frameStartTime - lastUpdateTime;
            fps = (0.9 * (currentFps / actualDuration)) + (0.1 * fps);
            frameCount = 0;
            nextFpsTime = frameStartTime + FPS_INTERVAL;
        }
        frameCount++;

        // UPDATE + DRAW + RENDER
        if (performance.getEntriesByName("update_start").length > 0) {
            performance.measure("update", "update_start", "update_end");
            updateTime = performance.getEntriesByName("update")[0].duration;
            if (updateTime > 0)
                averageUpdateTime = (0.9 * updateTime) + (0.1 * averageUpdateTime);

            performance.measure("draw", "draw_start", "draw_end");
            drawTime = performance.getEntriesByName("draw")[0].duration;
            if (drawTime > 0)
                averageDrawTime = (0.9 * drawTime) + (0.1 * averageDrawTime);

            performance.measure("render", "render_start", "render_end");
            renderTime = performance.getEntriesByName("render")[0].duration;
            if (renderTime > 0)
                averageRenderTime = (0.9 * renderTime) + (0.1 * averageRenderTime);
        }

        let total = averageUpdateTime + averageDrawTime + averageRenderTime;
        averageFrameTime = (0.9 * total) + (0.1 * averageFrameTime);
        if (drawCount > 0)
            averageDrawCount = (0.9 * drawCount) + (0.1 * averageDrawCount);

        performance.clearMeasures();
        performance.clearMarks();

        if (frameStartTime > nextDisplayTime) {
            displayMs = ms.toFixed(3).padStart(7, " ");
            displayFrameTime = (averageFrameTime * 1000).toFixed(0).padStart(7, " ");
            displayUpdateTime = (averageUpdateTime * 1000).toFixed(0).padStart(7, " ");
            displayDrawTime = (averageDrawTime * 1000).toFixed(0).padStart(7, " ");
            displayRenderTime = (averageRenderTime * 1000).toFixed(0).padStart(7, " ");
            displayDrawCount = averageDrawCount.toFixed(0).padStart(7, " ");

            nextDisplayTime = frameStartTime + DISPLAY_INTERVAL;
        }
    }
};

export let performanceMark = (markName: string): void => {
    if (DEBUG) {
        performance.mark(markName);
    }
};

export function assert(predicate: (() => boolean) | boolean, message: string): asserts predicate {
    if (DEBUG) {
        if (typeof predicate === "function" ? !predicate() : !predicate) {
            throw new Error(message);
        };
    }
};
