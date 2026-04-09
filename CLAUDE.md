# Graphics Transformation App – CLAUDE.md

## Overview

Build a web-based interactive graphics application that allows a user to upload an image and transform its pixel positions using a mathematical function.

---

## Core Requirements

### 1. UI Layout

* Split screen with two panels:

  * Left: Original image preview
  * Right: Transformed image (live rendering)
* Top or side panel input controls:

  * File upload button
  * Text input for a mathematical function
  * Toggle: **Wrap pixels (on/off)**
  * Optional: reset button

---

### 2. Image Handling

* Accept standard image formats (PNG, JPG)
* Render image onto an HTML `<canvas>`
* Extract pixel data using Canvas API (`getImageData`)

---

### 3. Transformation System

* Allow user to input a function that remaps pixel coordinates:

  * Example:

    * `x' = log(x)`
    * `y' = log(y)`

* The transformation operates on pixel positions, not colors

* For each pixel `(x, y)` in the original image:

  * Compute new position `(x', y')`
  * Map pixel color to the new position in the output canvas

---

### 4. Pixel Wrapping

Add support for handling pixels that map outside the canvas bounds:

* Provide a toggle:

  * `wrapMode: boolean`

* Behavior:

  * **If wrapping is OFF (default):**

    * Discard pixels that fall outside bounds

  * **If wrapping is ON:**

    * Wrap coordinates using modular arithmetic:

      ```ts
      x2 = ((x2 % width) + width) % width;
      y2 = ((y2 % height) + height) % height;
      ```
    * This ensures negative values wrap correctly

* This creates a toroidal (infinite tiling) effect

---

### 5. Live Rendering

* Re-render the transformed image in real-time as the user edits the equation or toggles wrapping
* Debounce input (e.g., 200ms)

---

### 6. Math Expression Parsing

* Use a safe math parser (e.g., math.js)
* Support functions:

  * `log`, `sin`, `cos`, `tan`, `sqrt`, `abs`, etc.
* Variables:

  * `x`, `y`, `width`, `height`

---

### 7. Edge Handling

* Handle invalid outputs (NaN, Infinity)
* Skip invalid pixels safely
* Prevent crashes on bad user input

---

### 8. Performance

* Use efficient pixel loops
* Consider:

  * `requestAnimationFrame`
  * Web Workers (optional)
* Avoid blocking UI on large images

---

## Technical Stack

* Framework: React (hooks)
* Rendering: HTML Canvas API
* Math parsing: math.js
* Language: TypeScript preferred

---

## Implementation Details

* Maintain two canvases:

  * `originalCanvas`
  * `transformedCanvas`

* Normalize coordinates:

  ```ts
  const nx = x / width;
  const ny = y / height;
  ```

* Apply transformation:

  ```ts
  const nx2 = f(nx);
  const ny2 = f(ny);

  let x2 = Math.floor(nx2 * width);
  let y2 = Math.floor(ny2 * height);
  ```

* Apply wrapping if enabled:

  ```ts
  if (wrapMode) {
    x2 = ((x2 % width) + width) % width;
    y2 = ((y2 % height) + height) % height;
  }
  ```

* Otherwise discard out-of-bounds pixels

---

## Example Inputs to Support

* `x' = log(x + 1)`
* `y' = sqrt(y)`
* `x' = x + 0.2 * sin(10 * y)`
* `y' = y + 0.2 * cos(10 * x)`

---

## UX Improvements (Nice-to-have)

* Preset transformations dropdown
* Grid overlay toggle
* Zoom/pan
* Hover pixel coordinate display

---

## Deliverables

* Fully working React app
* Clean modular code
* Clear comments explaining transformation logic
* Instructions to run locally

---

## Future Enhancements

* Inverse mapping (to prevent holes in output)
* WebGL shader-based implementation for performance improvements
