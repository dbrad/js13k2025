import { assert } from "@debug";
import textureAltas from "@res/sheet.webp";
import { characterCodeMap } from "./draw";
import { glUploadAtlas } from "./gl";

let textureDefinitions: TextureDefinition[] = [
  [TEXTURE_TYPE_SPRITE, [TEXTURE_C_4x4], 0, 16, 4, 4],
  [TEXTURE_TYPE_SPRITE, [TEXTURE_C_5x5], 4, 16, 5, 5],
  [TEXTURE_TYPE_SPRITE, [TEXTURE_C_6x6], 9, 16, 6, 6],
  [TEXTURE_TYPE_SPRITE, [TEXTURE_C_7x7], 0, 22, 7, 7],
  [TEXTURE_TYPE_SPRITE, [TEXTURE_C_8x8], 7, 22, 8, 8],
  [TEXTURE_TYPE_SPRITE_STRIP, [TEXTURE_C_16x16, TEXTURE_D_PAD, TEXTURE_D_PAD_UP, TEXTURE_D_PAD_RIGHT, TEXTURE_A_BUTTON_UP, TEXTURE_B_BUTTON_UP, TEXTURE_A_BUTTON_DOWN, TEXTURE_B_BUTTON_DOWN, TEXTURE_CAT_01, TEXTURE_CAT_02], 16, 16, 16, 16],
  [TEXTURE_TYPE_SPRITE_STRIP, [TEXTURE_DITH_00, TEXTURE_DITH_01, TEXTURE_DITH_02, TEXTURE_DITH_03, TEXTURE_DITH_04, TEXTURE_DITH_05, TEXTURE_DITH_06, TEXTURE_DITH_07, TEXTURE_DITH_08, TEXTURE_DITH_09, TEXTURE_DITH_10, TEXTURE_DITH_11, TEXTURE_DITH_12, TEXTURE_DITH_13, TEXTURE_DITH_14, TEXTURE_DITH_15], 0, ATLAS_HEIGHT - 16, 16, 16],
];

export let TEXTURE_CACHE: TextureCache = [];

let newTexture = (_w: number, _h: number, _u0: number, _v0: number, _u1: number, _v1: number): Texture => {
  return { w_: _w, h_: _h, u0_: _u0, v0_: _v0, u1_: _u1, v1_: _v1 };
};

export let loadTextureAtlas = async (): Promise<void> => {
  return new Promise(async (resolve) => {
    let response = await fetch(textureAltas);
    let blob = await response.blob();
    let imageBitmap = await createImageBitmap(blob);

    assert(ATLAS_WIDTH === imageBitmap.width, `ATLAS WIDTH CHANGED (expected: ${ATLAS_WIDTH} actual: ${imageBitmap.width})`);
    assert(ATLAS_HEIGHT - 16 === imageBitmap.height, `ATLAS HEIGHT CHANGED (expected: ${ATLAS_HEIGHT} actual: ${imageBitmap.height})`);

    let canvas = document.createElement("canvas",);
    let ctx = canvas.getContext("2d")!!;
    canvas.width = ATLAS_WIDTH;
    canvas.height = ATLAS_HEIGHT;
    ctx.drawImage(imageBitmap, 0, 0);

    let bayer4x4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
    let imageData = ctx.getImageData(0, ATLAS_HEIGHT - 16, ATLAS_WIDTH, 16);
    let data = imageData.data;
    for (let stage = 0; stage < 16; stage++) {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let b = bayer4x4[(y % 4) * 4 + (x % 4)];
          let idx = (y * ATLAS_WIDTH + stage * 16 + x) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = (b < stage / 16) ? 255 : 0;
        }
      }
    }
    ctx.putImageData(imageData, 0, ATLAS_HEIGHT - 16);
    glUploadAtlas(canvas);

    for (let i: number = 33; i <= 96; i++) {
      characterCodeMap[String.fromCharCode(i)] = i;
      let y = i < 65 ? 0 : 8;
      let x = y === 8 ? (i - 65) * 8 : (i - 33) * 8;
      TEXTURE_CACHE[100 + i] = newTexture(8, 8, x / ATLAS_WIDTH, y / ATLAS_HEIGHT, (x + 8) / ATLAS_WIDTH, (y + 8) / ATLAS_HEIGHT);
    }

    for (let texture of textureDefinitions) {
      let [defType, id, x, y, w, h] = texture;
      if (defType === TEXTURE_TYPE_SPRITE) {
        TEXTURE_CACHE[id[0]] = newTexture(w, h, x / ATLAS_WIDTH, y / ATLAS_HEIGHT, (x + w) / ATLAS_WIDTH, (y + h) / ATLAS_HEIGHT);
      } else { // TEXTURE_TYPE_SPRITE_STRIP
        for (let offsetX: number = x, i: number = 0; offsetX < ATLAS_WIDTH; offsetX += w) {
          TEXTURE_CACHE[id[i++]] = newTexture(w, h, offsetX / ATLAS_WIDTH, y / ATLAS_HEIGHT, (offsetX + w) / ATLAS_WIDTH, (y + h) / ATLAS_HEIGHT);
        }
      }
    }
    resolve();
  });
};