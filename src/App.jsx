import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import ContributionGrid from './components/ContributionGrid';
import ColorPalette from './components/ColorPalette';
import './App.css';

function App() {
  const [gridData, setGridData] = useState({});
  const [selectedColor, setSelectedColor] = useState(1);
  const gridRef = useRef(null);

  const handleInteract = (col, row) => {
    const key = `${col}-${row}`;
    setGridData((prev) => ({
      ...prev,
      [key]: selectedColor
    }));
  };

  const handleExportFixedSize = async () => {
    if (!gridRef.current) return;

    const node = gridRef.current;
    const targetWidth = 1500;
    const targetHeight = 500;

    try {
      // Capture at a high resolution (3x) so it stays crisp when we draw it on the large canvas
      // skipFonts: true prevents CORS errors from cross-origin stylesheets (Google Fonts)
      const rawDataUrl = await toPng(node, {
        backgroundColor: 'white',
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const img = new Image();
      img.src = rawDataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw image centered and scaled
        // Use the smaller scale to fit within both dimensions without distortion
        // but since we captured at 3x, the source image is large.

        let drawWidth, drawHeight;

        // Scale to fit with padding
        const padding = 80;
        const availWidth = targetWidth - padding * 2;
        const availHeight = targetHeight - padding * 2;

        const scale = Math.min(availWidth / img.width, availHeight / img.height);

        drawWidth = img.width * scale;
        drawHeight = img.height * scale;

        const x = (targetWidth - drawWidth) / 2;
        const y = (targetHeight - drawHeight) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        const finalUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'github-contribution-graph.png';
        link.href = finalUrl;
        link.click();
      };
    } catch (e) {
      console.error(e);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GitHub Contribution Graph Painter</h1>
        <p>Paint your commit history and export it.</p>
      </header>

      <main className="app-main">
        <div className="mobile-message">
          <h2>Desktop Only</h2>
          <p>This app is only available on larger screens.</p>
        </div>
        <div className="controls">
          <ColorPalette
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
          <button className="export-btn" onClick={handleExportFixedSize}>
            Export PNG
          </button>
        </div>

        <div className="canvas-area">
          <ContributionGrid
            data={gridData}
            onInteract={handleInteract}
            gridRef={gridRef}
          />
        </div>

        <div className="instructions">
          <p>Click or drag to paint cells. Select colors from the palette above.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
