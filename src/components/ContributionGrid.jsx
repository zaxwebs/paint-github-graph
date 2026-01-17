import React from 'react';
import { ROWS, COLS, COLORS } from '../utils/constants';
import './ContributionGrid.css';

// Month label positions with their start week index and colspan (number of weeks)
// Based on GitHub's month positioning in a 53-week year
const MONTHS = [
    { label: 'Jan', start: 0, span: 4 },
    { label: 'Feb', start: 4, span: 5 },
    { label: 'Mar', start: 9, span: 4 },
    { label: 'Apr', start: 13, span: 5 },
    { label: 'May', start: 18, span: 4 },
    { label: 'Jun', start: 22, span: 5 },
    { label: 'Jul', start: 27, span: 4 },
    { label: 'Aug', start: 31, span: 5 },
    { label: 'Sep', start: 36, span: 4 },
    { label: 'Oct', start: 40, span: 5 },
    { label: 'Nov', start: 45, span: 4 },
    { label: 'Dec', start: 49, span: 4 },
];

// Days of week - GitHub shows Sun, Mon, Tue, Wed, Thu, Fri, Sat
// But only displays Mon, Wed, Fri labels
const WEEK_DAYS = [
    { index: 0, label: '' },      // Sun
    { index: 1, label: 'Mon' },   // Mon
    { index: 2, label: '' },      // Tue
    { index: 3, label: 'Wed' },   // Wed
    { index: 4, label: '' },      // Thu
    { index: 5, label: 'Fri' },   // Fri
    { index: 6, label: '' },      // Sat
];

const ContributionGrid = ({ data, onInteract, gridRef }) => {

    const renderHeaderRow = () => {
        const cells = [];
        // First cell is empty (aligns with day labels column)
        cells.push(<th key="header-empty" className="grid-header-empty" aria-hidden="true"></th>);

        // Create month header cells with proper spans
        MONTHS.forEach((month, idx) => {
            cells.push(
                <th
                    key={`month-${idx}`}
                    className="grid-header-cell"
                    colSpan={month.span}
                    scope="col"
                >
                    <span className="month-label-text">{month.label}</span>
                </th>
            );
        });

        return <tr className="grid-header-row">{cells}</tr>;
    };

    const renderBodyRows = () => {
        const rows = [];

        for (let row = 0; row < ROWS; row++) {
            const cells = [];
            const dayInfo = WEEK_DAYS[row];

            // Day label cell
            cells.push(
                <td key={`label-${row}`} className="grid-day-label" aria-hidden={!dayInfo.label}>
                    <span className="day-label-text">{dayInfo.label}</span>
                </td>
            );

            // Contribution cells for each week
            for (let col = 0; col < COLS; col++) {
                const key = `${col}-${row}`;
                const level = data[key] || 0;
                const color = COLORS[level];
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                cells.push(
                    <td key={key} className="grid-cell-container">
                        <div
                            className="grid-cell"
                            style={{ backgroundColor: color }}
                            onMouseDown={() => onInteract(col, row, true)}
                            onMouseEnter={(e) => {
                                if (e.buttons === 1) {
                                    onInteract(col, row, false);
                                }
                            }}
                            role="gridcell"
                            tabIndex={-1}
                            data-level={level}
                            aria-label={`${dayNames[row]}, Week ${col + 1}`}
                            title={`${dayNames[row]}, Week ${col + 1}`}
                        />
                    </td>
                );
            }
            rows.push(<tr key={`row-${row}`} className="grid-row" role="row">{cells}</tr>);
        }
        return rows;
    };

    return (
        <div className="contribution-grid-container" ref={gridRef}>
            <table className="contribution-table" role="grid" aria-label="Contribution Graph">
                <thead>
                    {renderHeaderRow()}
                </thead>
                <tbody>
                    {renderBodyRows()}
                </tbody>
            </table>
            <div className="contribution-legend">
                <span className="legend-text">Less</span>
                <ul className="legend-colors">
                    {COLORS.map((color, index) => (
                        <li
                            key={`legend-color-${index}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Contribution level ${index}`}
                        />
                    ))}
                </ul>
                <span className="legend-text">More</span>
            </div>
        </div>
    );
};

export default ContributionGrid;
