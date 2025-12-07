import { useRef } from 'react';
import './emap.css';

const FIELD_WIDTH = 540;
const FIELD_HEIGHT = 360;

export const UnitMap = ({
    units,
    positions,
    currentUnitId,
    setSelectedNode,
    onPositionChange
}) => {
    const battlefieldRef = useRef(null);

    const handleMouseDown = (e, unitId) => {
        if (!battlefieldRef.current) return;

        setSelectedNode(unitId);

        const battlefieldRect = battlefieldRef.current.getBoundingClientRect();
        const marker = e.currentTarget;
        const markerRect = marker.getBoundingClientRect();

        const offsetX = e.clientX - markerRect.left - markerRect.width / 2;
        const offsetY = e.clientY - markerRect.top - markerRect.height / 2;

        let currentX, currentY;

        const handleMouseMove = (moveEvent) => {
            currentX = moveEvent.clientX - battlefieldRect.left - offsetX;
            currentY = moveEvent.clientY - battlefieldRect.top - offsetY;

            const boundedX = Math.max(0, Math.min(currentX, FIELD_WIDTH));
            const boundedY = Math.max(0, Math.min(currentY, FIELD_HEIGHT));

            onPositionChange(unitId, { x: boundedX, y: boundedY });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRightClick = (e, unitId) => {
        e.preventDefault();
        // setSelectedNode(unitId);
    };

    if (!units) return null;

    return (
        <div className="interactive-battlefield-container">
            <div
                ref={battlefieldRef}
                className="interactive-battlefield"
            >
                {units.map(unit => {
                    const pos = positions[unit.id] || { x: 50, y: 50 };
                    const isCurrent = unit.id === currentUnitId;

                    return (
                        <div
                            key={unit.id}
                            className={`squad-marker ${isCurrent ? 'current' : ''}`}
                            style={{
                                left: pos.x,
                                top: pos.y,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, unit.id)}
                            onContextMenu={(e) => handleRightClick(e, unit.id)}
                        >
                            <div className="squad-icon" />
                            <div className="squad-label">{unit.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};