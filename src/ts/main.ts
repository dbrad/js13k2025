import version from "../../VERSION.txt";
import { drawPerformanceMeter, initPerformanceMeter, performanceMark, tickPerformanceMeter, togglePerformanceDisplay } from "./__debug/debug";
import { zzfxInit } from "./audio";
import { initCanvas } from "./canvas";
import { animationFrame, clear, drawCount, initDrawQueue, pushQuad, pushText, render, updateAnimationFrame, WHITE } from "./draw";
import { glInit, glSetClearColour } from "./gl";
import { initializeInput, isTouchEvent, renderControls } from "./input";
import { initParticles } from "./particle";
import { drawScene, registerScene, updateScene } from "./scene";
import { gameScene } from "./scene/gameScene";
import { mainMenuScene } from "./scene/mainMenu";
import { optionsScene } from "./scene/options";
import { loadTextureAtlas } from "./texture";
export let VERSION = version;

window.addEventListener("load", async () => {
    let canvas = initCanvas();
    glInit(canvas);
    await loadTextureAtlas();
    glSetClearColour(0, 0, 0);

    initPerformanceMeter();
    initDrawQueue();

    let playing = false;
    let initializeGame = (e: PointerEvent | TouchEvent) => {
        if (!playing) {
            initializeInput(canvas);
            isTouchEvent(e);

            zzfxInit();
            initParticles();

            canvas.removeEventListener("touchstart", initializeGame);
            canvas.removeEventListener("pointerdown", initializeGame);
            playing = true;

            registerScene(mainMenuScene);
            registerScene(optionsScene);
            registerScene(gameScene);

            if (DEBUG) {
                document.addEventListener("keyup", (e: KeyboardEvent) => {
                    if (e.code === "KeyD") {
                        togglePerformanceDisplay();

                    };
                });
            }
        }
    };

    canvas.addEventListener("touchstart", initializeGame);
    canvas.addEventListener("pointerdown", initializeGame);

    let targetUpdateMs: number = 16.5;
    let accDelta: number = 0;
    let then = performance.now();
    let tick = (now: number) => {
        requestAnimationFrame(tick);

        let delta = now - then;
        then = now;
        let drawCalls = 0;

        if (playing) {
            performanceMark("start_of_frame");
            accDelta += delta;

            if (accDelta >= targetUpdateMs) {
                if (accDelta > 250) {
                    accDelta = targetUpdateMs;
                }
                clear();
                performanceMark("update_start");
                {
                    updateAnimationFrame(accDelta);
                    updateScene(accDelta, now);
                }
                performanceMark("update_end");

                performanceMark("draw_start");
                {
                    drawScene(accDelta, now);
                    pushQuad(0, 0, 145, SCREEN_HEIGHT, 0xff000000);
                    pushQuad(SCREEN_WIDTH - 145, 0, 145, SCREEN_HEIGHT, 0xff000000);
                    renderControls();
                    if (DEBUG) {
                        drawCalls = drawCount();
                        drawPerformanceMeter();
                    }
                }
                performanceMark("draw_end");

                performanceMark("render_start");
                {
                    render();
                }
                performanceMark("render_end");

                tickPerformanceMeter(accDelta, drawCalls);
                accDelta = 0;
            }
        } else {
            updateAnimationFrame(delta);
            clear();
            pushText("js13k 2025", SCREEN_CENTER_X, SCREEN_CENTER_Y, WHITE, 2, TEXT_ALIGN_CENTER);
            if (animationFrame) {
                pushText("tap to start", SCREEN_CENTER_X, SCREEN_CENTER_Y + 35, WHITE, 1, TEXT_ALIGN_CENTER);
            }
            pushText(VERSION, SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, 1, TEXT_ALIGN_RIGHT, TEXT_ALIGN_BOTTOM);
            render();
        }
    };
    requestAnimationFrame(tick);
});