import { useState, useRef } from 'react';
import { MdDownload, MdUpload, MdTimer, MdPrint } from "react-icons/md";
import { GiTabletopPlayers } from "react-icons/gi";
import { Player } from './game/Player';
import { Level, MaxLeadership } from './game/Skill';
import { useVisibilityConditions } from './game/conditions';
import { UpdateSuppressionStatusForPersons, MovementSpeed } from './cards/utils';
import { generateSquadViewHTML } from './utils/squadView.tsx';

export function MainMenu({ players, setPlayers, setSelectedNode, addLogEntry, startNewTurn }) {
    const fileInputRef = useRef(null);

    const { activeConditionIds, toggleCondition, conditionsList } = useVisibilityConditions();

    const [startPositions, setStartPositions] = useState({});

    const handleEndTurn = () => {
        const STRESS_RECOVERY_PER_TURN = [0.1, 0.2, 0.5, 0.8, 1.3, 1.9, 2.7];
        const effects = [];

        const expiringCounters = [];
        let logMessages = [];
        const actuallyMoved = new Set();

        players.forEach(player => {
            player.children?.forEach(unit => {
                if (!unit.id || !unit.isActive) return;

                const startPos = startPositions[unit.id];
                const currentPos = unit.position;
                if (startPos && currentPos &&
                    (startPos.x !== currentPos.x || startPos.y !== currentPos.y)) {
                    if (unit.hasMoved) {
                        logMessages.push(`${unit.name} перемещался.`);
                    }
                    actuallyMoved.add(unit.id);
                }

                unit.children?.forEach(person => {
                    person.equipment?.forEach(item => {
                        if (item.counter === 1) {
                            expiringCounters.push({
                                actorName: `${unit.name} - ${person.name}`,
                                equipmentName: item.name
                            });
                        }
                    });
                });

                let stress = Number(unit.stress) || 0;
                if (stress > 0) {
                    const leadership = MaxLeadership(unit);
                    const leadershipLevel = Level(leadership);

                    const recovery = Math.min(stress, STRESS_RECOVERY_PER_TURN[leadershipLevel]);
                    const newStress = stress - recovery;

                    effects.push({
                        id: unit.id,
                        stress: newStress
                    });
                }
            });
        });

        if (expiringCounters.length > 0) {
            const messages = expiringCounters.map(e => `${e.actorName}: ${e.equipmentName} — эффект окончен.`);
            logMessages.push(...messages);
        }

        const updatedPlayers = processNextTurn(players, effects, actuallyMoved, logMessages);

        const newStartPositions = {};
        updatedPlayers.forEach(player => {
            player.children?.forEach(unit => {
                if (unit.id && unit.position) {
                    newStartPositions[unit.id] = unit.position;
                }
            });
        });

        setPlayers(updatedPlayers);
        setStartPositions(newStartPositions);

        logMessages.forEach(msg => addLogEntry(msg));
        startNewTurn();
    };

    const handleSaveToFile = () => {
        const dataStr = JSON.stringify(players, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'players.json';
        link.click();

        URL.revokeObjectURL(url);
    };

    const handleLoadFromFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                setPlayers(parsed);
            } catch (err) {
                alert('Ошибка чтения файла!');
                console.error(err);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleCreatePlayer = () => {
        const newPlayer = new Player("Новая фракция", []);
        setPlayers((prev) => [...prev, newPlayer]);
        setSelectedNode({ node: newPlayer.id });
    };

    const processNextTurn = (players, effects, actuallyMoved, logMessages) => {
        return players.map(player => {
            return {
                ...player,
                children: player.children?.map(unit => {
                    const newUnit = effects.filter(e => e.id === unit.id)[0];

                    const stress = newUnit?.stress ?? 0.0;

                    let newPosition = unit.position;
                    let newCheckpoints = unit.checkpoints;
                    let hasMoved = unit.hasMoved;
                    if (!actuallyMoved.has(unit.id) && !unit.isDeployed && unit.checkpoints && unit.checkpoints.length > 0) {
                        const speed = MovementSpeed(unit);
                        const moveDistance = speed.plain || 0;

                        if (moveDistance > 0) {
                            const currentPos = unit.position;
                            const firstCheckpoint = unit.checkpoints[0];
                            const dx = firstCheckpoint.x - currentPos.x;
                            const dy = firstCheckpoint.y - currentPos.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance <= moveDistance * 3) {
                                newPosition = { x: firstCheckpoint.x, y: firstCheckpoint.y };
                                newCheckpoints = unit.checkpoints.slice(1);
                                logMessages.push(`${unit.name} достиг чекпойнта.`);
                            } else {
                                const t = (moveDistance * 3) / distance;
                                newPosition = {
                                    x: currentPos.x + t * dx,
                                    y: currentPos.y + t * dy
                                };
                                logMessages.push(`${unit.name} перемещался по маршруту.`);
                            }
                            actuallyMoved.add(unit.id);
                            hasMoved = true;
                        }
                    }

                    const newFatigue = hasMoved && !unit.vehicle
                        ? unit.fatigue
                        : unit.fatigue > 0
                            ? unit.fatigue - 1
                            : 0;

                    const newHasMoved = hasMoved && !actuallyMoved.has(unit.id) ? false : hasMoved;

                    const suppressionMap = new Map();

                    UpdateSuppressionStatusForPersons(unit.children || [], stress, (personId, property, value) => {
                        suppressionMap.set(personId, value);
                    });

                    const updatedPersons = unit.children?.map(person => {
                        const updatedEquipment = person.equipment?.map(item => {
                            if (item.counter > 0) {
                                return {
                                    ...item,
                                    counter: item.counter - 1
                                };
                            }
                            return item;
                        }) || [];

                        if (!person.isDead && person.isBleeding) {
                            const currentFP = person.skills["END"] ?? 0;
                            const newFP = currentFP - 1;

                            const updatedSkills = {
                                ...person.skills,
                                END: newFP > 0 ? newFP : 0
                            };

                            if (newFP < 0) {
                                logMessages.push(`${person.name} умер.`);
                            }

                            return {
                                ...person,
                                equipment: updatedEquipment,
                                skills: updatedSkills,
                                isSuppressed: suppressionMap.get(person.id) ?? person.isSuppressed,
                                isDead: newFP < 0 ? true : false
                            };
                        }

                        return {
                            ...person,
                            equipment: updatedEquipment,
                            isSuppressed: suppressionMap.get(person.id) ?? person.isSuppressed
                        };
                    }) || [];

                    return {
                        ...unit,
                        position: newPosition,
                        checkpoints: newCheckpoints,
                        alertness: 1,
                        stress: stress,
                        fatigue: newFatigue,
                        hasMoved: newHasMoved,
                        isMarked: false,
                        children: updatedPersons
                    };
                }) || []
            };
        });
    };

    const handlePrintSquad = () => {
        const html = generateSquadViewHTML(players);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.onload = () => {
                printWindow.print();
            };
        } else {
            alert('Не удалось открыть окно для печати. Пожалуйста, разрешите всплывающие окна для этого сайта.');
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="buttons-panel">
            <button onClick={() => handleSaveToFile()} title="Сохранить состояние...">
                <MdDownload />
            </button>
            <input
                type="file"
                accept=".json"
                onChange={handleLoadFromFile}
                ref={fileInputRef}
                style={{ display: 'none' }}
                value=""
            />
            <button onClick={triggerFileSelect} title="Загрузить состояние...">
                <MdUpload />
            </button>
            <button title="Добавить игрока" onClick={handleCreatePlayer}>
                <GiTabletopPlayers />
            </button>
            <button title="Печать листов отрядов..." onClick={handlePrintSquad}>
                <MdPrint />
            </button>
            <button title="Закончить ход" onClick={handleEndTurn}>
                <MdTimer />
            </button>
            {conditionsList.map(cond => (
                <button
                    key={cond.id}
                    title={cond.label}
                    onClick={() => toggleCondition(cond.id)}
                    style={{ background: activeConditionIds.includes(cond.id) ? '#b2b2b2ff' : '#303030ff' }}
                >
                    {cond.pic}
                </button>
            ))}
        </div>
    );
}