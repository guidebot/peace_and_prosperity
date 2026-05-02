import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { CalculateVisibilityDistance } from '../actions/Watch';
import { MovementSpeed } from '../cards/utils';
import { MdPalette, MdOutlineCleaningServices, MdLayers, MdLayersClear } from 'react-icons/md';
import './emap.css';

const FIELD_WIDTH = 540;
const FIELD_HEIGHT = 360;

const GRID_COLORS = {
    default: '#7a7a7a',
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
};

export const UnitMap = ({
    players,
    currentUnitId,
    activeConditions,
    setSelectedNode,
    onOtherChange,
    backgroundImage,
    setBackgroundImage
}) => {
    const battlefieldRef = useRef(null);
    const fileInputRef = useRef(null);
    const colorPickerRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoverUnitId, setHoverUnitId] = useState(null);
    const [isMouseOverBattlefield, setIsMouseOverBattlefield] = useState(false);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [uavClickPos, setUavClickPos] = useState(null);
    const [draggingUnitPos, setDraggingUnitPos] = useState(null);
    const [gridColor, setGridColor] = useState('default');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [movementLineStart, setMovementLineStart] = useState(null);
    const [movementLineEnd, setMovementLineEnd] = useState(null);
    const [movementSpeed, setMovementSpeed] = useState(null);
    const [tickMarks, setTickMarks] = useState([]);
    const [hoveredCheckpointIndex, setHoveredCheckpointIndex] = useState(null);

    const uploadMap = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
        }
    };

    const resetMap = () => {
        if (backgroundImage && backgroundImage.startsWith('blob:')) {
            URL.revokeObjectURL(backgroundImage);
        }
        setBackgroundImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const allUnits = useMemo(() => players.flatMap(player => player.children), [players]);
    const activeUnits = useMemo(() => allUnits.filter(unit => unit.isActive), [allUnits]);

    const calculateMovementLine = useCallback(() => {
        const selectedUnit = activeUnits.find(u => u.id === currentUnitId);

        if (!selectedUnit || !selectedUnit.position) {
            setMovementLineStart(null);
            setMovementLineEnd(null);
            setMovementSpeed(null);
            setTickMarks([]);
            return;
        }

        const speedResult = MovementSpeed(selectedUnit);

        setMovementSpeed(speedResult);

        if (!speedResult || speedResult.plain <= 0) {
            setMovementLineStart(null);
            setMovementLineEnd(null);
            setTickMarks([]);
            return;
        }

        const startPos = isShiftPressed && selectedUnit.checkpoints && selectedUnit.checkpoints.length > 0
            ? selectedUnit.checkpoints.at(-1)
            : selectedUnit.position;

        const dx = mousePosRef.current.x - startPos.x;
        const dy = mousePosRef.current.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        setMovementLineStart(startPos);
        setMovementLineEnd({ x: mousePosRef.current.x, y: mousePosRef.current.y });

        const tickMarksArray = [];

        if (distance > 0 && speedResult.plain > 0) {
            const plain = speedResult.plain * 3 / distance;
            tickMarksArray.push({ x: startPos.x + plain * dx, y: startPos.y + plain * dy });
            if (speedResult.road > speedResult.plain) {
                const road = speedResult.road * 3 / distance;
                tickMarksArray.push({ x: startPos.x + road * dx, y: startPos.y + road * dy });
            }
        }

        setTickMarks(tickMarksArray);
    }, [activeUnits, currentUnitId, isCtrlPressed, isShiftPressed]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

    const addCheckpoint = useCallback((unitId, x, y) => {
        const unit = allUnits.find(u => u.id === unitId);
        onOtherChange(unitId, "checkpoints", [
            ...(unit?.checkpoints || []),
            { x, y }
        ]);
    }, [onOtherChange, allUnits]);

    const removeCheckpoint = useCallback((unitId, index) => {
        const unit = allUnits.find(u => u.id === unitId);
        onOtherChange(unitId, "checkpoints", (unit?.checkpoints || []).filter((_, i) => i !== index));
    }, [onOtherChange, allUnits]);

    const clearAllCheckpoints = useCallback((unitId) => {
        const unit = allUnits.find(u => u.id === unitId);
        onOtherChange(unitId, "checkpoints", []);
    }, [onOtherChange, allUnits]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Control') {
                setIsCtrlPressed(true);
            }
            if (e.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Control') {
                setIsCtrlPressed(false);
            }
            if (e.key === 'Shift') {
                setIsShiftPressed(false);
            }
            if (e.key === 'Delete' && currentUnitId) {
                if (hoveredCheckpointIndex !== null) {
                    removeCheckpoint(currentUnitId, hoveredCheckpointIndex);
                    setHoveredCheckpointIndex(null);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [currentUnitId, hoveredCheckpointIndex, removeCheckpoint]);

    useEffect(() => {
        calculateMovementLine();
    }, [activeUnits, currentUnitId, isCtrlPressed]);

    let activePlayerId = null;
    for (const player of players) {
        if (player.children?.some(u => u.id === currentUnitId)) {
            activePlayerId = player.id;
            break;
        }
    }

    const renderVisibilityLines = () => {
        if (!currentUnitId) return null;

        const observer = activeUnits.find(u => u.id === currentUnitId);
        if (!observer || !observer.position) return null;

        const observerPos = observer.position;
        const lines = [];

        activeUnits.forEach(target => {
            if (target.id === currentUnitId || !target.position || !target.isHidden) return;

            let isTargetFriendly = false;
            for (const player of players) {
                if (player.children?.some(u => u.id === target.id)) {
                    isTargetFriendly = (player.id === activePlayerId);
                    break;
                }
            }

            if (isTargetFriendly) return;

            if (uavClickPos) {
                const maxPlainUavDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, false, true);
                const maxDefUavDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, true, true);
                const plainUavDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, false, true);
                const defUavDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, true, true);

                const dx = target.position.x - uavClickPos.x;
                const dy = target.position.y - uavClickPos.y;
                const actualUavDistance = Math.sqrt(dx * dx + dy * dy);

                if (plainUavDistance && plainUavDistance >= actualUavDistance) {
                    lines.push(
                        <line
                            key={`vis-uav-plain-${target.id}`}
                            x1={uavClickPos.x}
                            y1={uavClickPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(115, 115, 115)"
                            strokeWidth="2"
                        />
                    );
                }

                if (defUavDistance && defUavDistance >= actualUavDistance) {
                    lines.push(
                        <line
                            key={`vis-uav-def-${target.id}`}
                            x1={uavClickPos.x}
                            y1={uavClickPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(150, 255, 255)"
                            strokeWidth="1"
                        />
                    );
                }

                if (maxPlainUavDistance && maxPlainUavDistance >= actualUavDistance && maxDefUavDistance < actualUavDistance) {
                    lines.push(
                        <line
                            key={`vis-uav-max-plain-${target.id}`}
                            x1={uavClickPos.x}
                            y1={uavClickPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(115, 115, 115)"
                            strokeWidth="2"
                            stroke-dasharray="5 10"
                        />
                    );
                }

                if (maxDefUavDistance && maxDefUavDistance >= actualUavDistance) {
                    lines.push(
                        <line
                            key={`vis-uav-max-def-${target.id}`}
                            x1={uavClickPos.x}
                            y1={uavClickPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(150, 255, 255)"
                            strokeWidth="1"
                            stroke-dasharray="5 10"
                        />
                    );
                }
            }
            else {
                const maxPlainDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, false, false);
                const maxDefDistance = CalculateVisibilityDistance(observer, target, activeConditions, 20, true, false);
                const plainDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, false);
                const defDistance = CalculateVisibilityDistance(observer, target, activeConditions, observer.alertness, true);

                const dx = target.position.x - observerPos.x;
                const dy = target.position.y - observerPos.y;
                const actualDistance = Math.sqrt(dx * dx + dy * dy);

                if (plainDistance && plainDistance >= actualDistance) {
                    lines.push(
                        <line
                            key={`vis-plain-${target.id}`}
                            x1={observerPos.x}
                            y1={observerPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(115, 115, 115)"
                            strokeWidth="2"
                        />
                    );
                }

                if (defDistance && defDistance >= actualDistance) {
                    lines.push(
                        <line
                            key={`vis-def-${target.id}`}
                            x1={observerPos.x}
                            y1={observerPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(150, 255, 255)"
                            strokeWidth="1"
                        />
                    );
                }

                if (maxPlainDistance && maxPlainDistance >= actualDistance && maxDefDistance < actualDistance) {
                    lines.push(
                        <line
                            key={`vis-max-plain-${target.id}`}
                            x1={observerPos.x}
                            y1={observerPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(115, 115, 115)"
                            strokeWidth="2"
                            stroke-dasharray="5 10"
                        />
                    );
                }

                if (maxDefDistance && maxDefDistance >= actualDistance) {
                    lines.push(
                        <line
                            key={`vis-max-def-${target.id}`}
                            x1={observerPos.x}
                            y1={observerPos.y}
                            x2={target.position.x}
                            y2={target.position.y}
                            stroke="rgb(150, 255, 255)"
                            strokeWidth="1"
                            stroke-dasharray="5 10"
                        />
                    );
                }
            }
        });

        return lines;
    };

    const handleMouseMove = useCallback((e) => {
        if (!battlefieldRef.current) return;
        const rect = battlefieldRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, FIELD_WIDTH));
        const y = Math.max(0, Math.min(e.clientY - rect.top, FIELD_HEIGHT));
        mousePosRef.current = { x, y };
        setMousePos({ x, y });
        setIsMouseOverBattlefield(true);
        calculateMovementLine();
    }, [calculateMovementLine]);

    const handleMouseLeave = useCallback(() => {
        mousePosRef.current = { x: 0, y: 0 };
        setMousePos({ x: 0, y: 0 });
        setIsMouseOverBattlefield(false);
    }, []);

    const handleMouseDown = (e, unitId) => {
        if (e.button !== 0) return;

        setUavClickPos(null);

        if (!battlefieldRef.current) return;

        setSelectedNode(unitId);

        const unit = allUnits.find(u => u.id === unitId);
        if (unit?.isDeployed) return;

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

            setDraggingUnitPos({ x: boundedX, y: boundedY });

            onOtherChange(unitId, "hasMoved", true);
            onOtherChange(unitId, "isMarked", true);
            onOtherChange(unitId, "position", { x: boundedX, y: boundedY });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setDraggingUnitPos(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRightClick = (e) => {
        e.preventDefault();

        if (!currentUnitId || !battlefieldRef.current) return;

        const rect = battlefieldRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, FIELD_WIDTH));
        const y = Math.max(0, Math.min(e.clientY - rect.top, FIELD_HEIGHT));

        if (!isCtrlPressed && !isShiftPressed) {
            setUavClickPos(null);
            if (hoveredCheckpointIndex !== null) {
                removeCheckpoint(currentUnitId, hoveredCheckpointIndex);
                setHoveredCheckpointIndex(null);
            } else {
                addCheckpoint(currentUnitId, x, y);
            }
        }

        if (isCtrlPressed && !isShiftPressed) {
            const unit = allUnits.find(u => u.id === currentUnitId);

            if (!unit || !unit.position) return;

            const speedResult = MovementSpeed(unit);
            const speed = speedResult.road || 0;

            if (speed <= 0) return;

            moveUnit(x, y, speed, onOtherChange, unit);
        }
    };

    const handleBattlefieldClick = (e) => {
        if (e.button !== 0) return;

        const target = e.target;
        if (target.classList.contains('squad-marker') ||
            target.classList.contains('squad-icon') ||
            target.classList.contains('squad-label')) {
            return;
        }

        if (!currentUnitId || !battlefieldRef.current) return;

        const rect = battlefieldRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, FIELD_WIDTH));
        const y = Math.max(0, Math.min(e.clientY - rect.top, FIELD_HEIGHT));

        if (!isCtrlPressed && !isShiftPressed) {
            setUavClickPos({ x, y });
        }

        if (isCtrlPressed && !isShiftPressed) {
            const unit = allUnits.find(u => u.id === currentUnitId);

            if (!unit || !unit.position) return;

            const speedResult = MovementSpeed(unit);
            const speed = speedResult.plain || 0;

            if (speed <= 0) return;

            moveUnit(x, y, speed, onOtherChange, unit);
        }
    };

    let distanceToCursor = null;
    if (currentUnitId) {
        const observer = allUnits.find(u => u.id === currentUnitId);
        const lastCheckPoint = observer?.checkpoints?.at(-1);
        if (isShiftPressed && lastCheckPoint) {
            const dx = mousePos.x - lastCheckPoint.x;
            const dy = mousePos.y - lastCheckPoint.y;
            distanceToCursor = Math.sqrt(dx * dx + dy * dy).toFixed(1);
        }
        else {
            const observer = allUnits.find(u => u.id === currentUnitId);
            if (observer?.position) {
                const dx = mousePos.x - observer.position.x;
                const dy = mousePos.y - observer.position.y;
                distanceToCursor = Math.sqrt(dx * dx + dy * dy).toFixed(1);
            }
        }
    }

    const battlefieldStyle = {
        backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined
    };

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
                className={`interactive-battlefield ${backgroundImage ? 'with-background' : ''} grid-${gridColor}`}
                style={battlefieldStyle}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e) => handleRightClick(e)}
                onMouseDown={(e) => handleBattlefieldClick(e)}
            >
                {movementLineStart && movementLineEnd && !hoverUnitId && !draggingUnitPos && isMouseOverBattlefield && (
                    <svg
                        className="movement-overlay"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: FIELD_WIDTH,
                            height: FIELD_HEIGHT,
                            pointerEvents: 'none'
                        }}
                    >
                        {/* Arrow head */}
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="rgb(0, 255, 153)" />
                            </marker>
                        </defs>
                        <line
                            x1={movementLineStart.x}
                            y1={movementLineStart.y}
                            x2={movementLineEnd.x}
                            y2={movementLineEnd.y}
                            stroke="rgb(0, 255, 153)"
                            strokeWidth="1"
                            marker-end="url(#arrowhead)"
                        />

                        {tickMarks.map((tick, index) => (
                            <circle
                                key={`tick-${index}`}
                                cx={tick.x}
                                cy={tick.y}
                                r="2"
                                fill="rgb(0, 255, 153)"
                            />
                        ))}
                    </svg>
                )}

                {activeUnits.map(unit => {
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
                            onMouseEnter={() => setHoverUnitId(unit.id)}
                            onMouseLeave={() => setHoverUnitId(null)}
                        >
                            <div className="squad-icon" />
                            <div className="squad-label">{unit.name}</div>
                        </div>
                    );
                })}

                {currentUnitId && (
                    <svg
                        className="checkpoint-overlay"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: FIELD_WIDTH,
                            height: FIELD_HEIGHT,
                            pointerEvents: 'none'
                        }}
                    >
                        {activeUnits.filter(u => u.id === currentUnitId).map(unit => {
                            const checkpoints = unit.checkpoints || [];
                            return checkpoints.map((checkpoint, index) => {
                                const isHovered = hoveredCheckpointIndex === index;
                                return (
                                    <g
                                        key={`checkpoint-${index}`}
                                        onMouseEnter={() => setHoveredCheckpointIndex(index)}
                                        onMouseLeave={() => setHoveredCheckpointIndex(null)}
                                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                    >
                                        {isHovered && (<circle
                                            cx={checkpoint.x}
                                            cy={checkpoint.y}
                                            r={8}
                                            fill="none"
                                            stroke="rgb(255, 0, 0)"
                                            strokeWidth="1"
                                        />)}
                                        <circle
                                            cx={checkpoint.x}
                                            cy={checkpoint.y}
                                            r={4}
                                            fill="rgb(255, 0, 0)"
                                        />
                                        <text
                                            x={checkpoint.x + 8}
                                            y={checkpoint.y + 3}
                                            fontSize="10"
                                            fill="rgb(255, 0, 0)"
                                        >
                                            {index + 1}
                                        </text>
                                    </g>
                                );
                            });
                        })}
                    </svg>
                )}
            </div>
            <div className="map-buttons-panel">
                <button
                    title="Загрузить картинку"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <MdLayers />
                </button>
                {backgroundImage && (
                    <button
                        title="Сбросить картинку"
                        onClick={resetMap}
                    >
                        <MdLayersClear />
                    </button>
                )}
                <button
                    title="Цвет сетки"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                >
                    <MdPalette />
                </button>
                {currentUnitId && (
                    <button
                        title="Удалить все путевые точки"
                        onClick={() => clearAllCheckpoints(currentUnitId)}
                    >
                        <MdOutlineCleaningServices />
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={uploadMap}
                />
                <div className="grid-color-selector" ref={colorPickerRef}>
                    {showColorPicker && (
                        <div className="color-picker-dropdown">
                            {Object.entries(GRID_COLORS).map(([name, color]) => (
                                <button
                                    key={name}
                                    className={`color-option ${gridColor === name ? 'selected' : ''}`}
                                    title={name}
                                    onClick={() => {
                                        setGridColor(name);
                                        setShowColorPicker(false);
                                    }}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ flexGrow: 1 }} />
                <div className="map-info-panel">
                    <div>
                        {draggingUnitPos
                            ? (`Позиция: ${Math.round(draggingUnitPos.x / 3)}, ${Math.round(draggingUnitPos.y / 3)}`)
                            : (`${Math.round(mousePos.x / 3)}, ${Math.round(mousePos.y / 3)}`)}
                    </div>
                    {distanceToCursor && (
                        <>
                            <div>Дистанция: {Math.round(distanceToCursor / 3)} см</div>
                            {movementSpeed && (<div>Ходов: {Math.floor(Math.round(distanceToCursor / 3) / movementSpeed.plain) + 1}</div>)}
                            {movementSpeed && movementSpeed.road > movementSpeed.plain && (<div>По дороге: {Math.floor(Math.round(distanceToCursor / 3) / movementSpeed.road) + 1}</div>)}
                        </>
                    )}
                </div>
            </div>
        </div >
    );
};

function moveUnit(x, y, speed, onOtherChange, unit) {
    const dx = x - unit.position.x;
    const dy = y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const moveDistance = speed * 3;
    if (distance >= moveDistance) {
        const t = moveDistance / distance;
        const newX = unit.position.x + t * dx;
        const newY = unit.position.y + t * dy;

        onOtherChange(unit.id, "hasMoved", true);
        onOtherChange(unit.id, "isMarked", true);
        onOtherChange(unit.id, "position", { x: newX, y: newY });
    } else if (distance > 0) {
        onOtherChange(unit.id, "hasMoved", true);
        onOtherChange(unit.id, "isMarked", true);
        onOtherChange(unit.id, "position", { x: x, y: y });
    }
}
