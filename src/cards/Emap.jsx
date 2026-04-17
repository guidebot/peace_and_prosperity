import { useRef, useState, useCallback, useEffect } from 'react';
import { CalculateVisibilityDistance } from '../actions/Watch';
import { MovementSpeed } from '../cards/utils';
import { MdUploadFile, MdDelete, MdPalette } from 'react-icons/md';
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
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [uavClickPos, setUavClickPos] = useState(null);
    const [draggingUnitPos, setDraggingUnitPos] = useState(null);
    const [gridColor, setGridColor] = useState('default');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [movementLineStart, setMovementLineStart] = useState(null);
    const [movementLineEnd, setMovementLineEnd] = useState(null);
    const [movementSpeed, setMovementSpeed] = useState(0);
    const [tickMarks, setTickMarks] = useState([]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
        }
    };

    const allUnits = players.flatMap(player => player.children);

    const calculateMovementLine = useCallback(() => {
        if (!currentUnitId) {
            setMovementLineStart(null);
            setMovementLineEnd(null);
            setMovementSpeed(0);
            setTickMarks([]);
            return;
        }

        const observer = allUnits.find(u => u.id === currentUnitId);
        if (!observer || !observer.position) {
            setMovementLineStart(null);
            setMovementLineEnd(null);
            setMovementSpeed(0);
            setTickMarks([]);
            return;
        }

        const speedResult = MovementSpeed(observer);
        let speed = 0;
        
        if (typeof speedResult === 'object' && speedResult !== null) {
            // For vehicles, use plain speed
            speed = speedResult.plain || 0;
        } else {
            // For infantry, speedResult is a number
            speed = speedResult || 0;
        }

        setMovementSpeed(speed);

        if (speed <= 0) {
            setMovementLineStart(null);
            setMovementLineEnd(null);
            setTickMarks([]);
            return;
        }

        const observerPos = observer.position;
        const dx = mousePos.x - observerPos.x;
        const dy = mousePos.y - observerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Set line from unit to cursor
        setMovementLineStart(observerPos);
        setMovementLineEnd({ x: mousePos.x, y: mousePos.y });

        // Generate tick marks every n*3 pixels where n is speed
        const tickInterval = speed * 3;
        const tickMarksArray = [];
        
        if (distance > 0 && tickInterval > 0) {
            const numTicks = Math.floor(distance / tickInterval);
            
            for (let i = 1; i <= numTicks; i++) {
                const t = (i * tickInterval) / distance;
                const tickX = observerPos.x + t * dx;
                const tickY = observerPos.y + t * dy;
                tickMarksArray.push({ x: tickX, y: tickY });
            }
        }

        setTickMarks(tickMarksArray);
    }, [allUnits, currentUnitId, mousePos]);

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

    useEffect(() => {
        calculateMovementLine();
    }, [calculateMovementLine, mousePos, currentUnitId]);

    const handleResetImage = () => {
        if (backgroundImage && backgroundImage.startsWith('blob:')) {
            URL.revokeObjectURL(backgroundImage);
        }
        setBackgroundImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
        setMousePos({ x, y });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setMousePos({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = (e, unitId) => {
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

        setUavClickPos({ x, y });
    };

    const handleBattlefieldClick = (e) => {
        // Check if clicking on empty space (not on a unit marker)
        const target = e.target;
        if (target.classList.contains('squad-marker') || 
            target.classList.contains('squad-icon') || 
            target.classList.contains('squad-label')) {
            return; // Clicked on a unit, let handleMouseDown deal with it
        }

        if (!currentUnitId || !battlefieldRef.current) return;

        // Calculate movement distance based on speed
        const observer = allUnits.find(u => u.id === currentUnitId);
        if (!observer || !observer.position) return;

        const speedResult = MovementSpeed(observer);
        let speed = 0;
        
        if (typeof speedResult === 'object' && speedResult !== null) {
            speed = speedResult.plain || 0;
        } else {
            speed = speedResult || 0;
        }

        if (speed <= 0) return;

        const rect = battlefieldRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, FIELD_WIDTH));
        const clickY = Math.max(0, Math.min(e.clientY - rect.top, FIELD_HEIGHT));

        const observerPos = observer.position;
        const dx = clickX - observerPos.x;
        const dy = clickY - observerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move exactly n*3 pixels in the direction of the click
        const moveDistance = speed * 3;
        if (distance >= moveDistance) {
            // Move full n*3 pixels
            const t = moveDistance / distance;
            const newX = observerPos.x + t * dx;
            const newY = observerPos.y + t * dy;
            
            setDraggingUnitPos({ x: newX, y: newY });
            onOtherChange(currentUnitId, "hasMoved", true);
            onOtherChange(currentUnitId, "isMarked", true);
            onOtherChange(currentUnitId, "position", { x: newX, y: newY });
        } else if (distance > 0) {
            // If click is closer than n*3, move to the click position
            setDraggingUnitPos({ x: clickX, y: clickY });
            onOtherChange(currentUnitId, "hasMoved", true);
            onOtherChange(currentUnitId, "isMarked", true);
            onOtherChange(currentUnitId, "position", { x: clickX, y: clickY });
        }
    };

    let distanceToCursor = null;
    if (currentUnitId) {
        const observer = allUnits.find(u => u.id === currentUnitId);
        if (observer?.position) {
            const dx = mousePos.x - observer.position.x;
            const dy = mousePos.y - observer.position.y;
            distanceToCursor = Math.sqrt(dx * dx + dy * dy).toFixed(1);
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
                {/* Movement line with tick marks and arrow */}
                {movementLineStart && movementLineEnd && movementSpeed > 0 && (
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
                        {/* Main movement line */}
                        <line
                            x1={movementLineStart.x}
                            y1={movementLineStart.y}
                            x2={movementLineEnd.x}
                            y2={movementLineEnd.y}
                            stroke="rgb(0, 255, 153)"
                            strokeWidth="2"
                        />
                        
                        {/* Arrow head */}
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                                  refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="rgb(0, 255, 153)" />
                            </marker>
                        </defs>
                        <line
                            x1={movementLineStart.x}
                            y1={movementLineStart.y}
                            x2={movementLineEnd.x}
                            y2={movementLineEnd.y}
                            stroke="rgb(0, 255, 153)"
                            strokeWidth="2"
                            marker-end="url(#arrowhead)"
                        />
                        
                        {/* Tick marks */}
                        {tickMarks.map((tick, index) => (
                            <line
                                key={`tick-${index}`}
                                x1={tick.x}
                                y1={tick.y}
                                x2={tick.x}
                                y2={tick.y}
                                stroke="rgb(0, 255, 153)"
                                strokeWidth="2"
                            />
                        ))}
                    </svg>
                )}
                
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
                        >
                            <div className="squad-icon" />
                            <div className="squad-label">{unit.name}</div>
                        </div>
                    );
                })}
            </div>
            <div className="map-buttons-panel">
                <button
                    title="Загрузить картинку"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <MdUploadFile />
                </button>
                {backgroundImage && (
                    <button
                        title="Сбросить картинку"
                        onClick={handleResetImage}
                    >
                        <MdDelete />
                    </button>
                )}
                <button
                    title="Цвет сетки"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                >
                    <MdPalette />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
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
                    {distanceToCursor !== null && (
                        <div>Дистанция: {Math.round(distanceToCursor / 3)} см</div>
                    )}
                </div>
            </div>
        </div >
    );
};