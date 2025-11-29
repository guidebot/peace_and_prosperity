import { useState } from 'react';
import { CreateVehicle, Vehicles, RangeKey } from '../game/equipment';
import { Level, MinSkill, MaxSkill } from '../game/skills';
import { RollModal } from '../actions/roll';
import { GiRallyTheTroops, GiCheckMark } from "react-icons/gi";
import { GiRun } from 'react-icons/gi';
import { PiBinocularsFill } from 'react-icons/pi';
import { FaLocationPinLock } from "react-icons/fa6";
import { TfiTarget } from "react-icons/tfi";
import { CalculateFireEffects, ApplyFireEffects } from '../actions/fire';
import { IoIosPersonAdd, IoMdMove } from "react-icons/io";
import { PersonGenerator } from '../actions/person_generator';
import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { PossibleTargets, MovementSpeed, TotalWeight, TotalCapacity } from './utils';
import { MdDelete } from 'react-icons/md';
import { CalculateWatchEffectWithConditions } from '../game/conditions';

export function UnitForm({ players, data, onChange, onOtherChange, setPlayers, addLogEntry }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const [personGeneratorOpen, setPersonGeneratorOpen] = useState(false);
    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    const applyRallyEffect = (players, rolls, actors, target) => {
        const effects = getRallyEffects(players, rolls, actors, target);
        onChange("stress", effects[0].value);
        addLogEntry(effects[0].message);
        resetModalData();
    };

    function getRallyEffects(players, rolls, actors, target) {
        const unit = actors[0].actor;
        const maxSkill = MaxSkill(unit, "LID");
        const skillLevel = Level(maxSkill);

        const rallyPoints = rolls[0].roll >= 20 ? skillLevel + 1 :
            rolls[0].roll >= 18 && skillLevel > 0 ? skillLevel :
                rolls[0].roll >= 16 && skillLevel > 1 ? skillLevel - 1 :
                    rolls[0].roll >= 14 && skillLevel > 2 ? skillLevel - 2 :
                        rolls[0].roll >= 12 && skillLevel > 3 ? skillLevel - 3 :
                            rolls[0].roll >= 9 && skillLevel > 4 ? skillLevel - 4 :
                                rolls[0].roll >= 5 && skillLevel > 5 ? skillLevel - 5 : 0;

        const stress = Number(data.stress) || 0;
        if (rallyPoints > 0) {
            const newStress = stress - rallyPoints > 0 ? stress - rallyPoints : 0;
            return [{ value: newStress, message: `Восстановление эффективности отряда ${data.name}: d20=${rolls[0].roll}, уменьшение очков стресса на ${rallyPoints}.` }];
        } else {
            return [{ value: data.stress, message: `Восстановление эффективности отряда ${data.name}: d20=${rolls[0].roll}, эффекта нет.` }];
        };
    }

    function checkIfCanRun() {
        if (!data.children) return false;

        if (!checkIfCanMove()) return false;

        if (data.vehicle) return false;

        const minFpLevel = Level(MinSkill(data, "FP"));

        return data.fatigue < minFpLevel;
    }

    function checkIfCanMove() {
        if (!data.children) return false;

        if (data.isDeployed) return false;

        return true;
    }

    function checkIfCanDeploy() {
        if (!data.children) return false;

        if (data.hasMoved) return false;

        return true;
    }

    function run() {
        if (!data.children) return;
        onChange("fatigue", data.fatigue + 1);
        onChange("hasMoved", true);
        onChange("isMarked", true);
    }

    function toggleHasMoved() {
        if (!data.hasMoved) {
            onChange("isMarked", true);
        }
        onChange("hasMoved", !data.hasMoved);
    }

    function toggleIsDeployed() {
        onChange("isDeployed", !data.isDeployed);
    }

    function toggleIsMarked() {
        onChange("isMarked", !data.isMarked);
    }

    function toggleIsHidden() {
        onChange("isHidden", !data.isHidden);
    }

    const applyWatchEffect = (players, rolls, result, actors, target) => {
        const effects = calculateWatchEffect(players, rolls, result, actors, target);
        addLogEntry(effects[0].message);
        resetModalData();
    };

    const handleCreatePerson = (newPerson) => {
        setPlayers((prevPlayers) => {
            return prevPlayers.map(player => {
                if (player.children?.some(unit => unit.id === data.id)) {
                    return {
                        ...player,
                        children: player.children.map(unit => {
                            if (unit.id === data.id) {
                                return {
                                    ...unit,
                                    children: [...(unit.children || []), newPerson]
                                };
                            }
                            return unit;
                        })
                    };
                }
                return player;
            });
        });
    };

    const speed = MovementSpeed(data);

    function applyFireEffects(players, rolls, actors, target) {
        const effects = ApplyFireEffects(players, rolls, actors, target, onOtherChange);
        addLogEntry(`Групповой огонь ${data.name} по ${target.name} (${actors[0].equipment.name}).`);
        effects.forEach(element => {
            addLogEntry(element.message);
        });
        resetModalData();
    };

    function getUnitFireGroups(unit) {
        if (!unit?.children) return [];

        const shooters = unit.children.filter(p => !p.isDead && p.defaultEquipment);

        const groups = {};
        for (const person of shooters) {
            const eq = person.equipment.find(eq => eq.id === person.defaultEquipment);
            const key = RangeKey(eq);
            if (!groups[key]) {
                groups[key] = {
                    key,
                    actors: []
                };
            }
            groups[key].actors.push({ actor: person, equipment: eq });
        }

        return Object.values(groups);
    }

    function onSetVehicle(e) {
        const newVehicleId = e.target.value;
        onChange("vehicle", newVehicleId === 0 ? null : CreateVehicle([newVehicleId])[0]);
    }

    return (
        <div>
            <div className="buttons-panel">
                <button key="addPerson" title="Добавить персонаж" onClick={() => setPersonGeneratorOpen(true)}>
                    <IoIosPersonAdd />
                </button>
                <button key="rally" title="Восстановить эффективность" onClick={() => setModalData({ open: true, actors: [{ actor: data }], targets: [], onConfirm: applyRallyEffect, calculateEffect: getRallyEffects })}>
                    <GiRallyTheTroops />
                </button>
                {PossibleTargets(players, data).length > 0 && (<button key="watch" title="Наблюдать" onClick={() => setModalData({ open: true, actors: [{ actor: data }], targets: PossibleTargets(players, data), onConfirm: applyWatchEffect, calculateEffect: calculateWatchEffect })}>
                    <PiBinocularsFill />
                </button>)}
                <button key="run" title="Бежать" onClick={run} style={{ display: checkIfCanRun() ? 'inline' : 'none' }}>
                    <GiRun />
                </button>
                <button key="toggleHasMoved" title="Переключить пометку передвижения" onClick={toggleHasMoved} style={{ display: checkIfCanMove() ? 'inline' : 'none' }}>
                    <IoMdMove />
                </button>
                <button key="toggleIsDeployed" title="Переключить пометку стационарного положения" onClick={toggleIsDeployed} style={{ display: checkIfCanDeploy() ? 'inline' : 'none' }}>
                    <FaLocationPinLock />
                </button>
                <button key="toggleIsMarked" title="Переключить пометку завершения действия" onClick={toggleIsMarked}>
                    <GiCheckMark />
                </button>
                <button key="toggleIsHidden" title="Переключить пометку маскировки" onClick={toggleIsHidden}>
                    {data.isHidden ? (<BiSolidShow />) : (<BiSolidHide />)}
                </button>
                {
                    getUnitFireGroups(data).map((group) => (
                        <>
                            {PossibleTargets(players, data).length > 0 && (<button key={group.key}
                                title={`Групповой огонь (${group.actors[0].equipment.name} x${group.actors.length})`}
                                onClick={() => {
                                    const possibleTargets = PossibleTargets(players, data);
                                    if (possibleTargets.length === 0) return;
                                    setModalData({
                                        open: true,
                                        actors: group.actors,
                                        targets: PossibleTargets(players, data),
                                        title: `Групповой огонь (${data.name}, ${group.actors[0].equipment.name})`,
                                        onConfirm: applyFireEffects,
                                        calculateEffect: CalculateFireEffects
                                    });
                                }}>
                                <TfiTarget />
                            </button>)}
                        </>
                    ))
                }
            </div >
            {
                personGeneratorOpen && (
                    <PersonGenerator onCancel={() => setPersonGeneratorOpen(false)} onConfirm={(newPerson) => { handleCreatePerson(newPerson); setPersonGeneratorOpen(false); }} />
                )
            }
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

            <label className="form-label">
                <span>Название:</span>
                <input name="name" type="text" value={data.name} onChange={(e) => onChange(e.target.name, e.target.value)} />
            </label>
            <label className="form-label">
                <span>Очки стресса:</span>
                <input min={0} name="stress" type="number" value={data.stress} onChange={(e) => onChange(e.target.name, Number(e.target.value))} />
            </label>
            <label className="form-label">
                <span>Очки усталости:</span>
                <input min={0} max={MinSkill(data, "FP")} name="fatigue" type="number" value={data.fatigue} onChange={(e) => onChange(e.target.name, Number(e.target.value))} />
            </label>
            <label className="form-label">
                <span>Очки корректировки:</span>
                <input min={0} max={5} name="correction" type="number" value={data.correction} onChange={(e) => onChange(e.target.name, Number(e.target.value))} />
            </label>
            <label className="form-label">
                <span>Транспортное средство:</span>
                <span style={{ textAlign: 'left' }}>{data.vehicle ? data.vehicle.name : "нет"}</span>
                <select name="vehicle" onChange={onSetVehicle} value="0">
                    <option key="0" value="0">Заменить...</option>
                    {Vehicles
                        // .filter((item) => {
                        //     const canUseBySkill = Level(currentSkills[item.skill] || 0) > 0;
                        //     const canUseByCategory = item.skill === "WPN_rifles";
                        //     const alreadyTaken = currentEquipment.includes(item.id);
                        //     return (canUseBySkill || canUseByCategory) && !alreadyTaken;
                        // })
                        .map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                </select>
                <button title="Бросить" onClick={() => onChange("vehicle", null)}>
                    <MdDelete />
                </button>
            </label>
            <label className="form-label">
                <span>Максимальная численность:</span>
                <input name="people" readOnly={true} type="number" value={3 * Level(MaxSkill(data, "LID"))} />
            </label>
            {
                data.vehicle ? (
                    <label className="form-label">
                        <span>Скорость перемещения:</span>
                        <input name="plain" readOnly={true} type="number" value={speed.plain} />
                        <span>По дороге:</span>
                        <input name="road" readOnly={true} type="number" value={speed.road} />
                    </label>
                ) : (
                    <>
                        <label className="form-label">
                            <span>Вес сняражения:</span>
                            <input name="weight" readOnly={true} type="number" value={TotalWeight(data) / 10} />кг
                        </label>
                        <label className="form-label">
                            <span>Грузоподъёмность:</span>
                            <input name="capacity" readOnly={true} type="number" value={TotalCapacity(data) / 10} />кг
                        </label>
                        <label className="form-label">
                            <span>Скорость перемещения:</span>
                            <input name="speed" readOnly={true} type="number" value={speed} />
                        </label>
                    </>)
            }
        </div >
    );
}