import { useState, useRef, useCallback, useEffect } from "react";
import {
  compileExpressions,
  applyTransform,
  CoordMode,
} from "./utils/transform";
import {
  presets as builtInPresets,
  loadCustomPresets,
  saveCustomPresets,
  Preset,
} from "./utils/presets";
import "./App.css";

function App() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [coordMode, setCoordMode] = useState<CoordMode>("cartesian");
  const [aExpr, setAExpr] = useState("x");
  const [bExpr, setBExpr] = useState("y");
  const [wrapMode, setWrapMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadCustomPresets);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const transformedCanvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<number>(0);
  const presetNameRef = useRef<HTMLInputElement>(null);

  const filteredBuiltIn = builtInPresets.filter((p) => p.coordMode === coordMode);
  const filteredCustom = customPresets.filter((p) => p.coordMode === coordMode);
  // Combined list: built-in first, then custom
  const allFiltered = [...filteredBuiltIn, ...filteredCustom];

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
    const p = allFiltered[idx];
    if (!p) return;
    setAExpr(p.aExpr);
    setBExpr(p.bExpr);
  };

  const handleCoordModeChange = (mode: CoordMode) => {
    setCoordMode(mode);
    if (mode === "cartesian") {
      setAExpr("x");
      setBExpr("y");
    } else {
      setAExpr("r");
      setBExpr("theta");
    }
    setSavingPreset(false);
  };

  const handleReset = () => {
    handleCoordModeChange(coordMode);
    setWrapMode(false);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const newPreset: Preset = {
      name,
      aExpr,
      bExpr,
      coordMode,
      custom: true,
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setSavingPreset(false);
    setPresetName("");
  };

  const handleDeletePreset = (presetToDelete: Preset) => {
    const updated = customPresets.filter((p) => p !== presetToDelete);
    setCustomPresets(updated);
    saveCustomPresets(updated);
  };

  // Focus the name input when save mode opens
  useEffect(() => {
    if (savingPreset) {
      presetNameRef.current?.focus();
    }
  }, [savingPreset]);

  const selectedIdx = allFiltered.findIndex(
    (p) => p.aExpr === aExpr && p.bExpr === bExpr
  );

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

          <div className="preset-group">
            <div className="preset-select">
              <label>Presets:</label>
              <select
                onChange={(e) => handlePreset(Number(e.target.value))}
                value={selectedIdx}
              >
                <optgroup label="Built-in">
                  {filteredBuiltIn.map((p, i) => (
                    <option key={`b-${p.name}`} value={i}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                {filteredCustom.length > 0 && (
                  <optgroup label="Custom">
                    {filteredCustom.map((p, i) => (
                      <option
                        key={`c-${p.name}-${i}`}
                        value={filteredBuiltIn.length + i}
                      >
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Delete button for selected custom preset */}
            {selectedIdx >= filteredBuiltIn.length && selectedIdx >= 0 && (
              <button
                className="delete-preset-btn"
                title="Delete this custom preset"
                onClick={() =>
                  handleDeletePreset(
                    filteredCustom[selectedIdx - filteredBuiltIn.length]
                  )
                }
              >
                &times;
              </button>
            )}

            <button
              className="save-preset-btn"
              onClick={() => {
                setSavingPreset(!savingPreset);
                setPresetName("");
              }}
              title="Save current equations as preset"
            >
              Save
            </button>
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

        {savingPreset && (
          <div className="save-preset-row">
            <input
              ref={presetNameRef}
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePreset();
                if (e.key === "Escape") setSavingPreset(false);
              }}
              spellCheck={false}
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              Save
            </button>
            <button onClick={() => setSavingPreset(false)}>Cancel</button>
          </div>
        )}

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
