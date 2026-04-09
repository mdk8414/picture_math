import { useState, useRef, useCallback, useEffect } from "react";
import {
  compileExpressions,
  applyTransform,
  CoordMode,
} from "./utils/transform";
import { presets } from "./utils/presets";
import "./App.css";

function App() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [coordMode, setCoordMode] = useState<CoordMode>("cartesian");
  const [aExpr, setAExpr] = useState("x");
  const [bExpr, setBExpr] = useState("y");
  const [wrapMode, setWrapMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const transformedCanvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<number>(0);

  const filteredPresets = presets.filter((p) => p.coordMode === coordMode);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          setImageSrc(img.src);
          const canvas = originalCanvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, img.width, img.height);
          setImageData(data);

          const tCanvas = transformedCanvasRef.current;
          if (tCanvas) {
            tCanvas.width = img.width;
            tCanvas.height = img.height;
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const runTransform = useCallback(() => {
    if (!imageData) return;

    const fns = compileExpressions(aExpr, bExpr, coordMode);
    if (!fns) {
      setError("Invalid expression");
      return;
    }
    setError(null);

    const canvas = transformedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dstData = ctx.createImageData(imageData.width, imageData.height);

    applyTransform(imageData, dstData, fns, wrapMode, coordMode);
    ctx.putImageData(dstData, 0, 0);
  }, [imageData, aExpr, bExpr, wrapMode, coordMode]);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      requestAnimationFrame(runTransform);
    }, 200);
    return () => window.clearTimeout(debounceRef.current);
  }, [runTransform]);

  const handlePreset = (idx: number) => {
    const p = filteredPresets[idx];
    if (!p) return;
    setAExpr(p.aExpr);
    setBExpr(p.bExpr);
  };

  const handleCoordModeChange = (mode: CoordMode) => {
    setCoordMode(mode);
    // Reset to identity for the new mode
    if (mode === "cartesian") {
      setAExpr("x");
      setBExpr("y");
    } else {
      setAExpr("r");
      setBExpr("theta");
    }
  };

  const handleReset = () => {
    handleCoordModeChange(coordMode);
    setWrapMode(false);
  };

  const aLabel = coordMode === "cartesian" ? "x'" : "r'";
  const bLabel = coordMode === "cartesian" ? "y'" : "\u03B8'";
  const helpVars =
    coordMode === "cartesian" ? (
      <>
        <code>x</code>, <code>y</code> (normalized 0-1)
      </>
    ) : (
      <>
        <code>r</code> (distance from center), <code>theta</code> (angle in
        radians)
      </>
    );

  return (
    <div className="app">
      <header className="header">
        <h1>Image Math</h1>
        <p className="subtitle">
          Transform pixel positions with math functions
        </p>
      </header>

      <div className="controls">
        <div className="controls-row">
          <label className="file-upload">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileUpload}
            />
            <span className="file-upload-btn">Upload Image</span>
          </label>

          <div className="coord-toggle">
            <button
              className={coordMode === "cartesian" ? "active" : ""}
              onClick={() => handleCoordModeChange("cartesian")}
            >
              Cartesian
            </button>
            <button
              className={coordMode === "polar" ? "active" : ""}
              onClick={() => handleCoordModeChange("polar")}
            >
              Polar
            </button>
          </div>

          <div className="preset-select">
            <label>Presets:</label>
            <select
              onChange={(e) => handlePreset(Number(e.target.value))}
              value={filteredPresets.findIndex(
                (p) => p.aExpr === aExpr && p.bExpr === bExpr
              )}
            >
              {filteredPresets.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <label className="wrap-toggle">
            <input
              type="checkbox"
              checked={wrapMode}
              onChange={(e) => setWrapMode(e.target.checked)}
            />
            <span>Wrap pixels</span>
          </label>

          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="expr-row">
          <div className="expr-field">
            <label>{aLabel} =</label>
            <input
              type="text"
              value={aExpr}
              onChange={(e) => setAExpr(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="expr-field">
            <label>{bLabel} =</label>
            <input
              type="text"
              value={bExpr}
              onChange={(e) => setBExpr(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="help-text">
          Variables: {helpVars}, <code>width</code>, <code>height</code>{" "}
          (pixels). Functions: <code>sin</code>, <code>cos</code>,{" "}
          <code>tan</code>, <code>log</code>, <code>sqrt</code>,{" "}
          <code>abs</code>, <code>atan2</code>, <code>^</code>, etc.
        </div>
      </div>

      <div className="panels">
        <div className="panel">
          <h2>Original</h2>
          <div className="canvas-wrapper">
            {!imageSrc && (
              <div className="placeholder">Upload an image to begin</div>
            )}
            <canvas ref={originalCanvasRef} />
          </div>
        </div>
        <div className="panel">
          <h2>Transformed</h2>
          <div className="canvas-wrapper">
            {!imageSrc && (
              <div className="placeholder">
                Transformation will appear here
              </div>
            )}
            <canvas ref={transformedCanvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
