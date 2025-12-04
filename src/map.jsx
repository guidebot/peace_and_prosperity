import { useState, useRef } from 'react';
import './map.css';

export const BattlefieldMapModal = ({
    units,
    positions,
    onPositionChange,
    onClose
}) => {
    const battlefieldRef = useRef(null);
    const [localPositions, setLocalPositions] = useState(() => {
        const initial = {};
        units.forEach(unit => {
            if (positions[unit.id]) {
                initial[unit.id] = positions[unit.id];
            } else {
                const idx = units.indexOf(unit);
                initial[unit.id] = { x: 50 + (idx % 5) * 120, y: 50 + Math.floor(idx / 5) * 80 };
            }
        });
        return initial;
    });

    const handleMouseDown = (e, unitId) => {
        if (!battlefieldRef.current) return;

        const battlefieldRect = battlefieldRef.current.getBoundingClientRect();
        const marker = e.currentTarget;
        const markerWidth = marker.offsetWidth;
        const markerHeight = marker.offsetHeight;

        const offsetX = e.clientX - marker.getBoundingClientRect().left;
        const offsetY = e.clientY - marker.getBoundingClientRect().top;

        let currentX, currentY;

        const handleMouseMove = (moveEvent) => {
            currentX = moveEvent.clientX - battlefieldRect.left - offsetX;
            currentY = moveEvent.clientY - battlefieldRect.top - offsetY;

            setLocalPositions(prev => ({
                ...prev,
                [unitId]: {
                    x: Math.max(0, Math.min(currentX, battlefieldRect.width - markerWidth)),
                    y: Math.max(0, Math.min(currentY, battlefieldRect.height - markerHeight))
                }
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (currentX !== undefined && currentY !== undefined) {
                const finalPos = {
                    x: Math.max(0, Math.min(currentX, battlefieldRect.width - markerWidth)),
                    y: Math.max(0, Math.min(currentY, battlefieldRect.height - markerHeight))
                };
                onPositionChange(unitId, finalPos);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="battlefield-modal-overlay" onClick={onClose}>
            <div
                className="battlefield-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Расположение отрядов</h2>
                <div
                    ref={battlefieldRef}
                    className="battlefield"
                >
                    {units.map(unit => {
                        const pos = localPositions[unit.id];
                        return (
                            <div
                                key={unit.id}
                                className="squad-wrapper"
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, unit.id)}
                            >
                                <div className="squad-icon" />
                                <div className="squad-label">{unit.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};