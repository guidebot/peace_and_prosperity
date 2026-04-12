import { useRef, useState, useCallback } from 'react';
import { CalculateVisibilityDistance } from '../actions/Watch';
import { MdUploadFile, MdDelete } from 'react-icons/md';
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
    const fileInputRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [uavClickPos, setUavClickPos] = useState(null);
    const [draggingUnitPos, setDraggingUnitPos] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
        }
    };

    const handleResetImage = () => {
        if (backgroundImage && backgroundImage.startsWith('blob:')) {
            URL.revokeObjectURL(backgroundImage);
        }
        setBackgroundImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
                className={`interactive-battlefield ${backgroundImage ? 'with-background' : ''}`}
                style={battlefieldStyle}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e) => handleRightClick(e)}
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
                        >
                            <div className="squad-icon" />
                            <div className="squad-label">{unit.name}</div>
                        </div>
                    );
                })}
            </div>
            <div className='buttons-panel'>
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
                <div className="map-info-panel">
                    <div>
                        {draggingUnitPos
                            ? (`Позиция: ${Math.round(draggingUnitPos.x / 3)}, ${Math.round(draggingUnitPos.y / 3)}`)
                            : (`${Math.round(mousePos.x / 3)}, ${Math.round(mousePos.y / 3)}`)}
                    </div>
                    {distanceToCursor !== null && (
                        <div>Дистанция: {Math.round(distanceToCursor / 3)} см</div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />
                </div>
            </div>
        </div >
    );
};