import { CoordMode } from "./transform";

export interface Preset {
  name: string;
  aExpr: string;
  bExpr: string;
  coordMode: CoordMode;
}

export const presets: Preset[] = [
  // Cartesian presets
  { name: "Identity", aExpr: "x", bExpr: "y", coordMode: "cartesian" },
  { name: "Log Scale", aExpr: "log(x + 1) / log(2)", bExpr: "log(y + 1) / log(2)", coordMode: "cartesian" },
  { name: "Square Root", aExpr: "sqrt(x)", bExpr: "sqrt(y)", coordMode: "cartesian" },
  { name: "Sine Wave", aExpr: "x + 0.05 * sin(10 * y)", bExpr: "y + 0.05 * cos(10 * x)", coordMode: "cartesian" },
  { name: "Ripple", aExpr: "x + 0.03 * sin(20 * y)", bExpr: "y + 0.03 * sin(20 * x)", coordMode: "cartesian" },
  { name: "Fisheye", aExpr: "0.5 + (x - 0.5) * sqrt((x - 0.5)^2 + (y - 0.5)^2) * 2", bExpr: "0.5 + (y - 0.5) * sqrt((x - 0.5)^2 + (y - 0.5)^2) * 2", coordMode: "cartesian" },
  { name: "Mirror X", aExpr: "1 - x", bExpr: "y", coordMode: "cartesian" },
  { name: "Swirl", aExpr: "0.5 + (x - 0.5) * cos(3 * sqrt((x-0.5)^2 + (y-0.5)^2)) - (y - 0.5) * sin(3 * sqrt((x-0.5)^2 + (y-0.5)^2))", bExpr: "0.5 + (x - 0.5) * sin(3 * sqrt((x-0.5)^2 + (y-0.5)^2)) + (y - 0.5) * cos(3 * sqrt((x-0.5)^2 + (y-0.5)^2))", coordMode: "cartesian" },

  // Polar presets
  { name: "Polar Identity", aExpr: "r", bExpr: "theta", coordMode: "polar" },
  { name: "Spin", aExpr: "r", bExpr: "theta + 0.5", coordMode: "polar" },
  { name: "Polar Ripple", aExpr: "r + 0.02 * sin(20 * theta)", bExpr: "theta", coordMode: "polar" },
  { name: "Spiral", aExpr: "r", bExpr: "theta + r * 8", coordMode: "polar" },
  { name: "Zoom Center", aExpr: "r * 0.5", bExpr: "theta", coordMode: "polar" },
  { name: "Invert Radius", aExpr: "0.35 - r", bExpr: "theta", coordMode: "polar" },
  { name: "Flower", aExpr: "r + 0.04 * sin(6 * theta)", bExpr: "theta", coordMode: "polar" },
];
