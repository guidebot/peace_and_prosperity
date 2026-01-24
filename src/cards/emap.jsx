import { useRef } from 'react';
import { CalculateVisibilityDistance } from '../actions/watch.jsx';
import './emap.css';

const FIELD_WIDTH = 540;
const FIELD_HEIGHT = 360;

export const UnitMap = ({
    players,
    currentUnitId,
    activeConditions,
    setSelectedNode,
    onOtherChange
}) => {
    const battlefieldRef = useRef(null);

    const getAllUnits = () => {
        const units = [];
        players.forEach(player => {
            if (player.children) {
                player.children.forEach(unit => {
                    if (unit.isActive) units.push(unit);
                });
            }
        });
        return units;
    };

    const allUnits = getAllUnits();

    let observerPlayerId = null;
    for (const player of players) {
        if (player.children?.some(u => u.id === currentUnitId)) {
            observerPlayerId = player.id;
            break;
        }
    }

    const renderVisibilityLines = () => {
        if (!currentUnitId) return null;

        const observer = allUnits.find(u => u.id === currentUnitId);
        if (!observer || !observer.position) return null;

        const observerPos = observer.position;
        const lines = [];

        allUnits.forEach(target => {
            if (target.id === currentUnitId || !target.position || !target.isHidden) return;

            let isTargetFriendly = false;
            for (const player of players) {
                if (player.children?.some(u => u.id === target.id)) {
                    isTargetFriendly = (player.id === observerPlayerId);
                    break;
                }
            }

            if (isTargetFriendly) return;

            const maxPlainDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, false);
            const maxDefDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, true);

            const plainDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, false);
            const defDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, true);

            const dx = target.position.x - observerPos.x;
            const dy = target.position.y - observerPos.y;
            const actualDistance = Math.sqrt(dx * dx + dy * dy);

            if (defDistance >= actualDistance) {
                lines.push(
                    <line
                        key={`vis-def-${target.id}`}
                        x1={observerPos.x}
                        y1={observerPos.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="rgb(127, 246, 255)"
                        strokeWidth="1"
                    />
                );

                return;
            }

            if (maxDefDistance >= actualDistance) {
                lines.push(
                    <line
                        key={`vis-max-def-${target.id}`}
                        x1={observerPos.x}
                        y1={observerPos.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="rgb(127, 246, 255)"
                        strokeWidth="2"
                        stroke-dasharray="5 10"
                    />
                );
            }

            if (plainDistance >= actualDistance) {
                lines.push(
                    <line
                        key={`vis-plain-${target.id}`}
                        x1={observerPos.x}
                        y1={observerPos.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="rgb(100, 100, 100)"
                        strokeWidth="1"
                    />
                );

                return;
            }

            if (maxPlainDistance >= actualDistance && maxDefDistance < actualDistance) {
                lines.push(
                    <line
                        key={`vis-max-plain-${target.id}`}
                        x1={observerPos.x}
                        y1={observerPos.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="rgb(95, 95, 95)"
                        strokeWidth="2"
                        stroke-dasharray="5 10"
                    />
                );
            }
        });

        return lines;
    };

    const handleMouseDown = (e, unitId) => {
        if (!battlefieldRef.current) return;

        setSelectedNode(unitId);

        if (allUnits.filter(u => u.id === unitId)[0].isDeployed) {
            return;
        }

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

            onOtherChange(unitId, "hasMoved", true);
            onOtherChange(unitId, "isMarked", true);
            onOtherChange(unitId, "position", { x: boundedX, y: boundedY });
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
    };

    if (!allUnits) return null;

    return (
        <div className="interactive-battlefield-container">
            <div className="battlefield-wrapper">
                <svg
                    className="visibility-overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: FIELD_WIDTH,
                        height: FIELD_HEIGHT,
                        pointerEvents: 'none'
                    }}
                >
                    {renderVisibilityLines()}
                </svg>
            </div>
            <div
                ref={battlefieldRef}
                className="interactive-battlefield"
            >
                {allUnits.map(unit => {
                    const pos = unit.position || { x: 50, y: 50 };
                    const isCurrent = unit.id === currentUnitId;
                    const isHidden = unit.isHidden;

                    return (
                        <div
                            key={unit.id}
                            className={`squad-marker ${isCurrent ? 'current' : ''} ${isHidden ? 'hidden' : ''}`}
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