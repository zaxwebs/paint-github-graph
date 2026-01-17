import { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Undo, Redo, Trash2 } from 'lucide-react';
import ContributionGrid from './components/ContributionGrid';
import ColorPalette from './components/ColorPalette';
import './App.css';

function App() {
  const [gridData, setGridData] = useState({});
  const [selectedColor, setSelectedColor] = useState(1);
  const gridRef = useRef(null);

  // History State
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modal State
  const [showClearModal, setShowClearModal] = useState(false);

  // Modal focus trap refs
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Computed: check if grid is empty
  const isGridEmpty = Object.keys(gridData).length === 0;

  // Refs for tracking drag state and current data without re-triggering effects
  const isDrawingRef = useRef(false);
  const gridDataRef = useRef({});

  // Sync gridDataRef with gridData
  useEffect(() => {
    gridDataRef.current = gridData;
  }, [gridData]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGridData(history[newIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGridData(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleClear = useCallback(() => {
    const clearedState = {};
    setGridData(clearedState);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(clearedState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setShowClearModal(false);
  }, [history, historyIndex]);

  // Modal focus trap and keyboard handling
  useEffect(() => {
    if (!showClearModal) return;

    // Focus the cancel button when modal opens
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowClearModal(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showClearModal]);

  const handleInteract = (col, row) => {
    isDrawingRef.current = true;
    const key = `${col}-${row}`;
    setGridData((prev) => {
      // Optimization: if color hasn't changed, don't update state
      if (prev[key] === selectedColor) return prev;
      return {
        ...prev,
        [key]: selectedColor
      };
    });
  };

  // Global Event Listeners for MouseUp (end of stroke) and Keyboard Shortcuts
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        const currentGrid = gridDataRef.current;
        const previousGrid = history[historyIndex];

        // Only push to history if state actually changed
        if (JSON.stringify(currentGrid) !== JSON.stringify(previousGrid)) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(currentGrid);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [history, historyIndex, undo, redo]);

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

          <div className="history-controls">
            <button
              className="history-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              className="history-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo size={16} />
            </button>
            <button
              className="history-btn clear-btn"
              onClick={() => setShowClearModal(true)}
              disabled={isGridEmpty}
              title="Clear All"
              aria-label="Clear All"
            >
              <Trash2 size={16} />
            </button>
          </div>

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

        {/* Clear Confirmation Modal */}
        {showClearModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowClearModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
              <h2 id="modal-title">Clear Canvas?</h2>
              <p>This will remove all painted cells. This action can be undone.</p>
              <div className="modal-actions">
                <button
                  ref={cancelBtnRef}
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowClearModal(false)}
                >
                  Cancel
                </button>
                <button
                  ref={confirmBtnRef}
                  className="modal-btn modal-btn-confirm"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
