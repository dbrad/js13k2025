import version from "../../VERSION.txt";
import { drawPerformanceMeter, initPerformanceMeter, performanceMark, tickPerformanceMeter, togglePerformanceDisplay } from "./__debug/debug";
import { zzfxInit } from "./audio";
import { initCanvas } from "./canvas";
import { animationFrame, clear, drawCount, initDrawQueue, pushQuad, pushText, render, updateAnimationFrame, WHITE } from "./draw";
import { glInit, glSetClearColour } from "./gl";
import { drawControls, initializeInput, isTouchEvent } from "./input";
import { initParticles } from "./particle";
import { drawGUI, drawScene, registerScene, updateScene } from "./scene";
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

    let then = performance.now();
    let tick = (now: number) => {
        requestAnimationFrame(tick);

        let delta = now - then;
        then = now;
        let drawCalls = 0;

        if (playing) {
            performanceMark("start_of_frame");
            if (delta > 250) {
                delta = 16.6;
            }
            clear();
            performanceMark("update_start");
            {
                updateAnimationFrame(delta);
                updateScene(delta, now);
            }
            performanceMark("update_end");

            performanceMark("draw_start");
            {
                drawScene(delta, now);
                pushQuad(0, 0, SCREEN_LEFT, SCREEN_DIM, 0xff000000);
                pushQuad(SCREEN_RIGHT, 0, SCREEN_GUTTER, SCREEN_DIM, 0xff000000);
                pushQuad(0, SCREEN_DIM, SCREEN_WIDTH, 24, 0xff000000);

                pushQuad(SCREEN_LEFT, 0, 1, SCREEN_DIM, WHITE);
                pushQuad(SCREEN_RIGHT, 0, 1, SCREEN_DIM, WHITE);
                pushQuad(SCREEN_LEFT, 0, SCREEN_DIM, 1, WHITE);
                pushQuad(SCREEN_LEFT, SCREEN_DIM - 1, SCREEN_DIM, 1, WHITE);
                drawGUI(delta);
                drawControls();
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

            tickPerformanceMeter(delta, drawCalls);
        } else {
            updateAnimationFrame(delta);
            clear();
            pushText("i am the night", SCREEN_CENTER_X, SCREEN_CENTER_Y - 28, WHITE, 3, TEXT_ALIGN_CENTER);
            pushText("js13k 2025 entry by david brad", SCREEN_CENTER_X, SCREEN_CENTER_Y, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
            pushText("warning: flashing lights", SCREEN_CENTER_X, SCREEN_HEIGHT - 40, WHITE, 2, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);
            pushText("the game contains flashing lights and scrolling screen effects", SCREEN_CENTER_X, SCREEN_HEIGHT - 20, WHITE, 1, TEXT_ALIGN_CENTER, TEXT_ALIGN_TOP);


            if (animationFrame) {
                pushText("tap to start", SCREEN_CENTER_X, SCREEN_CENTER_Y + 35, WHITE, 1, TEXT_ALIGN_CENTER);
            }
            pushText(VERSION, SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, 1, TEXT_ALIGN_RIGHT, TEXT_ALIGN_BOTTOM);
            render();
        }
    };
    requestAnimationFrame(tick);
});