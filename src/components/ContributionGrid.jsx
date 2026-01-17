import React, { useRef } from 'react';
import classNames from 'classnames';
import { ROWS, COLS, COLORS } from '../utils/constants';
import './ContributionGrid.css';

const ContributionGrid = ({ data, onInteract, gridRef }) => {
    // We handle mouse down/enter in cells
    // If the user is dragging, App.jsx manages the 'isDrawing' state, 
    // but for simplicity we can check flags here or assume onInteract is gated.
    // Actually, to support "click and drag", we need to know if mouse is down.
    // We'll rely on onMouseEnter events firing only layout-wise, 
    // and the parent passing a handler that checks if it should draw.

    const renderCells = () => {
        const cells = [];
        // GitHub grid is column-major (weeks), but CSS Grid handles row/col order easily.
        // We'll render week by week (columns).
        for (let col = 0; col < COLS; col++) {
            const colCells = [];
            for (let row = 0; row < ROWS; row++) {
                const key = `${col}-${row}`;
                const level = data[key] || 0;
                const color = COLORS[level];

                colCells.push(
                    <div
                        key={key}
                        className="grid-cell"
                        style={{ backgroundColor: color }}
                        onMouseDown={() => onInteract(col, row, true)}
                        onMouseEnter={(e) => {
                            // Only trigger if primary button is pressed (buttons === 1)
                            if (e.buttons === 1) {
                                onInteract(col, row, false);
                            }
                        }}
                        data-col={col}
                        data-row={row}
                        title={`Week ${col + 1}, Day ${row + 1}`}
                    />
                );
            }
            cells.push(
                <div key={`col-${col}`} className="grid-column">
                    {colCells}
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="contribution-grid-container" ref={gridRef}>
            <div className="contribution-grid">
                {renderCells()}
            </div>
        </div>
    );
};

export default ContributionGrid;
