# Image Math

A web-based interactive tool for transforming image pixel positions using mathematical functions. Upload an image, type an equation, and watch the transformation happen in real time.

## Features

- **Split-screen preview** — original image on the left, transformed result on the right
- **Cartesian & Polar coordinate modes** — toggle between `(x, y)` and `(r, theta)` transformations
- **Live rendering** — transformations update in real time as you edit expressions (200ms debounce)
- **Pixel wrapping** — toggle toroidal wrapping for pixels that map outside canvas bounds
- **Safe math parsing** — powered by [math.js](https://mathjs.org/) with support for `sin`, `cos`, `tan`, `log`, `sqrt`, `abs`, `atan2`, `^`, and more
- **Preset transformations** — 15 built-in presets across both coordinate modes (Fisheye, Swirl, Spiral, Flower, etc.)
- **Edge handling** — gracefully skips NaN, Infinity, and invalid outputs

## Getting Started

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (default: `http://localhost:5173`).

## Usage

1. Click **Upload Image** to load a PNG or JPG
2. Choose **Cartesian** or **Polar** coordinate mode
3. Edit the expressions to define your transformation
4. Toggle **Wrap pixels** to enable toroidal wrapping

### Cartesian Mode

Expressions map normalized coordinates `(x, y)` in the range `[0, 1]` to new positions `(x', y')`.

| Variable | Description |
|----------|-------------|
| `x`, `y` | Normalized pixel position (0 to 1) |
| `width`, `height` | Image dimensions in pixels |

**Examples:**
- `x' = x + 0.05 * sin(10 * y)` / `y' = y + 0.05 * cos(10 * x)` — sine wave distortion
- `x' = sqrt(x)` / `y' = sqrt(y)` — square root scaling
- `x' = 1 - x` / `y' = y` — horizontal mirror

### Polar Mode

Each pixel is converted to polar coordinates `(r, theta)` relative to the image center `(0.5, 0.5)`, transformed, then converted back.

| Variable | Description |
|----------|-------------|
| `r` | Distance from image center (0 at center, ~0.707 at corners) |
| `theta` | Angle in radians (-pi to pi) |
| `width`, `height` | Image dimensions in pixels |

**Examples:**
- `r' = r` / `theta' = theta + 0.5` — rotation
- `r' = r` / `theta' = theta + r * 8` — spiral
- `r' = r + 0.04 * sin(6 * theta)` / `theta' = theta` — flower petal distortion

## Tech Stack

- React 18 + TypeScript
- Vite
- math.js
- HTML Canvas API

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```
