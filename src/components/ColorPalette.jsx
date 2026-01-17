import React from 'react';
import classNames from 'classnames';
import { COLORS } from '../utils/constants';
import './ColorPalette.css';

const ColorPalette = ({ selectedColor, onColorSelect }) => {
    return (
        <div className="color-palette">
            <div className="palette-label">Select color:</div>
            <div className="palette-options">
                {COLORS.map((color, index) => (
                    <button
                        key={color}
                        className={classNames('palette-swatch', {
                            active: selectedColor === index,
                        })}
                        style={{ backgroundColor: color }}
                        onClick={() => onColorSelect(index)}
                        aria-label={`Select color level ${index}`}
                        title={`Level ${index}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorPalette;
