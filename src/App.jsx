import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import ContributionGrid from './components/ContributionGrid';
import ColorPalette from './components/ColorPalette';
import { ROWS, COLS } from './utils/constants';
import './App.css';

function App() {
  const [gridData, setGridData] = useState({});
  const [selectedColor, setSelectedColor] = useState(1); // Default to a green color (Level 1)
  const gridRef = useRef(null);

  const handleInteract = (col, row, isClick) => {
    const key = `${col}-${row}`;
    setGridData((prev) => ({
      ...prev,
      [key]: selectedColor
    }));
  };

  const handleExport = async () => {
    if (gridRef.current === null) {
      return;
    }

    try {
      // We need to export at 1500x500.
      // The current grid size might be different.
      // We can use the 'width' and 'height' options of toPng, or scale the node.
      // Scaling often produces better results than just resizing the output.
      // However, to fill 1500x500, we'd need to stretch or center.
      // The requirement says "Exported image dimensions are always 1500x500".
      // And "Exported image must be scaled or rendered to 1500x500 without distortion".
      // This implies centering and preserving aspect ratio, or fitting.
      // Given the grid is wide and short (~740x100), 1500x500 is much larger.
      // We'll scale up the content to fit the width (with some padding) and center it vertically.

      const node = gridRef.current;

      // Calculate scale to fit 1500 width with 50px padding
      const targetWidth = 1500;
      const targetHeight = 500;
      const padding = 60;
      const contentWidth = node.offsetWidth;
      const contentHeight = node.offsetHeight;

      // We want to make the grid look nice in the center.
      // Let's scale it so it takes up most of the 1500 width.
      const scaleX = (targetWidth - padding * 2) / contentWidth;
      const scaleY = (targetHeight - padding * 2) / contentHeight;
      // Use the smaller scale to fit within both dimensions without distortion
      const scale = Math.min(scaleX, scaleY, 4); // Cap scale at 4x to avoid blockiness if grid is tiny

      const dataUrl = await toPng(node, {
        width: targetWidth,
        height: targetHeight,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // We need to center the node in the new 1500x500 canvas.
          // html-to-image 'style' applies to the cloned node.
          // If we pass width/height, the canvas changes size.
          // This part is tricky with html-to-image.
          // A safer bet is to create a wrapper or use canvasStyle.
          background: 'white',
        },
        canvasWidth: targetWidth,
        canvasHeight: targetHeight,
        // Center content manually by using margins on the cloned element if needed, 
        // but transform logic above might shift it.
        // Let's try a different approach:
        // Use a wrapper div for export that is hidden, style it to 1500x500, scale content inside.
        // But html-to-image captures what's visible or a specific node.
      });

      // Simple implementation first: just export what we have, let's see how it looks.
      // Revisiting "exactly 1500x500".
      // I'll implement a dedicated export wrapper strategy if the direct export is hard to control.
      // Let's try passing explicit width/height and using flex centering in style.

      const link = document.createElement('a');
      link.download = 'github-contribution-graph.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image');
    }
  };

  // Custom export with scaling workaround
  const handleExportFixedSize = async () => {
    if (!gridRef.current) return;

    const node = gridRef.current;
    const targetWidth = 1500;
    const targetHeight = 500;

    // We need to temporarily style the node or clone it.
    // html-to-image clones the node. We can modify the clone.
    // But we can't easily hook into the clone step deeply.
    // Strategy: Render a hidden export container that is strictly 1500x500, 
    // contains the grid scaled up.
    // But we can't easily sync state to a hidden container without duplicating component.

    // Best bet: use the filter/style options to transform during capture.
    // Or: Capture the natural size, then draw that image onto a 1500x500 canvas and save.
    // This is much more reliable for exact dimensions.

    try {
      const rawDataUrl = await toPng(node, { backgroundColor: 'white' });
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
        const aspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

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

        // Turn off smoothing for pixel art look? No, rounded corners need smoothing.
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
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GitHub Contribution Graph Drawer</h1>
        <p>Draw your commit history and export it.</p>
      </header>

      <main className="app-main">
        <div className="controls">
          <ColorPalette
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
          <button className="export-btn" onClick={handleExportFixedSize}>
            Export PNG (1500x500)
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
