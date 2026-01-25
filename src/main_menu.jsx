import { useState, useRef } from 'react';
import { MdDownload, MdUpload, MdTimer } from "react-icons/md";
import { GiTabletopPlayers } from "react-icons/gi";
import { player } from './game/metadata';
import { RollModal } from './actions/roll';
import { MaxSkill, Level } from './game/skills';
import { useVisibilityConditions } from './game/conditions';

export function MainMenu({ players, setPlayers, setSelectedNode, addLogEntry }) {
    const fileInputRef = useRef(null);

    const { activeConditionIds, toggleCondition, conditionsList } = useVisibilityConditions();

    const [startPositions, setStartPositions] = useState({});

    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

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
                    const lid = MaxSkill(unit, "LID");
                    const skillLevel = Level(lid);

                    const recovery = Math.min(stress, STRESS_RECOVERY_PER_TURN[skillLevel]);
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
        addLogEntry(`Начинается новый ход.`);

        resetModalData();
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
        const newPlayer = new player("Новая фракция", []);
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

                    const alivePersons = unit.children?.filter(p => !p.isDead) || [];

                    const sortedPersonsByLid = alivePersons.sort((a, b) => {
                        const tpA = a.skills?.["LID"] || 0;
                        const tpB = b.skills?.["LID"] || 0;
                        if (tpA !== tpB) return tpA - tpB;
                        return Math.random() - 0.5;
                    });

                    const newFatigue = unit.hasMoved && !unit.vehicle
                        ? unit.fatigue
                        : unit.fatigue > 0
                            ? unit.fatigue - 1
                            : 0;

                    const newHasMoved = unit.hasMoved && !actuallyMoved.has(unit.id) ? false : unit.hasMoved;

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

                        let updatedSkills = person.skills;
                        let isDead = person.isDead;

                        let isSupressed = false;
                        if (!person.isDead) {
                            const index = sortedPersonsByLid.findIndex(p => p.id === person.id);
                            isSupressed = index !== -1 && index < stress;
                        }

                        if (person.isBleeding && !person.isDead) {
                            const currentFP = person.skills["FP"] ?? 0;
                            const newFP = currentFP - 1;

                            updatedSkills = {
                                ...person.skills,
                                FP: newFP > 0 ? newFP : 0
                            };

                            if (newFP < 0) {
                                isDead = true;
                                logMessages.push(`${person.name} умер.`);
                            }
                        }

                        return {
                            ...person,
                            equipment: updatedEquipment,
                            skills: updatedSkills,
                            isSupressed: isSupressed,
                            isDead: isDead
                        };
                    }) || [];

                    return {
                        ...unit,
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
            {
                modalData?.open && (
                    <RollModal
                        players={players}
                        actors={modalData?.actors}
                        equipment={modalData?.equipment}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
                        title={modalData?.title}
                        onCancel={resetModalData}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }
        </div>
    );
}