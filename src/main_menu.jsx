import { useState, useRef } from 'react';
import { MdDownload, MdUpload, MdTimer } from "react-icons/md";
import { GiTabletopPlayers } from "react-icons/gi";
import { player } from './game/metadata';
import { RollModal } from './actions/roll';
import { MaxSkill } from './game/skills';
import { useVisibilityConditions } from './game/conditions';

export function MainMenu({ players, setPlayers, setSelectedNode, addLogEntry }) {
    const fileInputRef = useRef(null);

    const { activeConditionIds, toggleCondition, conditionsList } = useVisibilityConditions();

    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    const applyInitiativeRoll = (players, rolls, actors, target) => {
        const expiringCounters = [];

        players.forEach(player => {
            player.children?.forEach(unit => {
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
            });
        });

        let logMessages = [];
        if (expiringCounters.length > 0) {
            const messages = expiringCounters.map(e => `${e.actorName}: ${e.equipmentName} — эффект окончен.`);
            logMessages.push(...messages);
        }

        const effects = getInitiativeRoll(players, rolls, actors, target);
        const updatedPlayers = processNextTurn(players, effects);

        setPlayers(updatedPlayers);

        logMessages.forEach(msg => addLogEntry(msg));
        addLogEntry(`Начинается новый ход.`);

        resetModalData();
    };

    function getInitiativeRoll(players, rolls, actors, target) {
        return rolls.map(roll => {
            const unit = actors.filter(a => a.actor.id === roll.id)[0];
            const lid = MaxSkill(unit, "LID");
            const initiative = roll.roll + lid;
            return { id: roll.id, initiative: initiative, message: `d20=${roll.roll}, результат ${initiative}.` }
        });
    }

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

    const processNextTurn = (players, effects) => {
        return players.map(player => {
            return {
                ...player,
                children: player.children?.map(unit => {
                    const initiative = effects.filter(e => e.id === unit.id)[0]?.initiative ?? 0;

                    const newFatigue = unit.hasMoved && !unit.vehicle
                        ? unit.fatigue
                        : unit.fatigue > 0
                            ? unit.fatigue - 1
                            : 0;

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
                        return {
                            ...person,
                            equipment: updatedEquipment
                        };
                    }) || [];

                    return {
                        ...unit,
                        initiative: initiative,
                        fatigue: newFatigue,
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
            <button title="Закончить ход" onClick={() => setModalData({ open: true, title: "Инициатива", actors: players.flatMap(p => p.children).filter(u => u.isActive).map(u => ({ actor: u })), targets: [], onConfirm: applyInitiativeRoll, calculateEffect: getInitiativeRoll })}>
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