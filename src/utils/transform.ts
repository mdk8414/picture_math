import { compile, EvalFunction } from "mathjs";

export type CoordMode = "cartesian" | "polar";

export interface TransformFunctions {
  aExpr: EvalFunction; // x' or r'
  bExpr: EvalFunction; // y' or theta'
}

/**
 * Compiles math expressions into evaluable functions.
 * Cartesian variables: x, y, width, height
 * Polar variables: r, theta, width, height
 */
export function compileExpressions(
  aExprStr: string,
  bExprStr: string,
  coordMode: CoordMode
): TransformFunctions | null {
  try {
    const aExpr = compile(aExprStr);
    const bExpr = compile(bExprStr);
    // Quick validation with representative test values
    const testScope =
      coordMode === "cartesian"
        ? { x: 0.5, y: 0.5, width: 100, height: 100 }
        : { r: 0.25, theta: 0.5, width: 100, height: 100 };
    const aResult = aExpr.evaluate(testScope);
    const bResult = bExpr.evaluate(testScope);
    if (typeof aResult !== "number" || typeof bResult !== "number") return null;
    return { aExpr, bExpr };
  } catch {
    return null;
  }
}

/**
 * Applies the pixel transformation from source image data to destination image data.
 *
 * Cartesian mode: expressions map normalized (x, y) -> (x', y')
 * Polar mode: pixel (x, y) is converted to (r, theta) relative to image center,
 *   expressions map (r, theta) -> (r', theta'), then converted back to cartesian.
 */
export function applyTransform(
  srcData: ImageData,
  dstData: ImageData,
  fns: TransformFunctions,
  wrapMode: boolean,
  coordMode: CoordMode
): void {
  const { width, height } = srcData;
  const src = srcData.data;
  const dst = dstData.data;

  dst.fill(0);

  if (coordMode === "cartesian") {
    applyCartesian(src, dst, width, height, fns, wrapMode);
  } else {
    applyPolar(src, dst, width, height, fns, wrapMode);
  }
}

function applyCartesian(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  fns: TransformFunctions,
  wrapMode: boolean
): void {
  const scope = { x: 0, y: 0, width, height };

  for (let py = 0; py < height; py++) {
    scope.y = py / height;
    for (let px = 0; px < width; px++) {
      scope.x = px / width;

      let nx2: number, ny2: number;
      try {
        nx2 = fns.aExpr.evaluate(scope) as number;
        ny2 = fns.bExpr.evaluate(scope) as number;
      } catch {
        continue;
      }

      if (!isFinite(nx2) || !isFinite(ny2)) continue;

      let x2 = Math.round(nx2 * width);
      let y2 = Math.round(ny2 * height);

      if (wrapMode) {
        x2 = ((x2 % width) + width) % width;
        y2 = ((y2 % height) + height) % height;
      } else {
        if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;
      }

      copyPixel(src, dst, py * width + px, y2 * width + x2);
    }
  }
}

function applyPolar(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  fns: TransformFunctions,
  wrapMode: boolean
): void {
  const scope = { r: 0, theta: 0, width, height };

  for (let py = 0; py < height; py++) {
    const ny = py / height - 0.5; // center-relative
    for (let px = 0; px < width; px++) {
      const nx = px / width - 0.5; // center-relative

      scope.r = Math.sqrt(nx * nx + ny * ny);
      scope.theta = Math.atan2(ny, nx);

      let r2: number, theta2: number;
      try {
        r2 = fns.aExpr.evaluate(scope) as number;
        theta2 = fns.bExpr.evaluate(scope) as number;
      } catch {
        continue;
      }

      if (!isFinite(r2) || !isFinite(theta2)) continue;

      // Convert back to normalized cartesian
      const nx2 = 0.5 + r2 * Math.cos(theta2);
      const ny2 = 0.5 + r2 * Math.sin(theta2);

      let x2 = Math.round(nx2 * width);
      let y2 = Math.round(ny2 * height);

      if (wrapMode) {
        x2 = ((x2 % width) + width) % width;
        y2 = ((y2 % height) + height) % height;
      } else {
        if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;
      }

      copyPixel(src, dst, py * width + px, y2 * width + x2);
    }
  }
}

function copyPixel(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  srcOff: number,
  dstOff: number
): void {
  const si = srcOff * 4;
  const di = dstOff * 4;
  dst[di] = src[si];
  dst[di + 1] = src[si + 1];
  dst[di + 2] = src[si + 2];
  dst[di + 3] = src[si + 3];
}
