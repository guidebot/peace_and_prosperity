import { useState } from 'react';
import { RangeKey } from '../game/Equipment';
import { Level, MinSkill, MaxLeadership } from '../game/Skill';
import { RollModal } from '../actions/Roll';
import { GiBullseye, GiGunshot, GiWeight, GiTireTracks, GiFootsteps } from "react-icons/gi";
import { GiRun } from 'react-icons/gi';
import { PiBinocularsFill } from 'react-icons/pi';
import { FaRoad } from "react-icons/fa6";
import { TfiTarget } from "react-icons/tfi";
import { IoIosPersonAdd, IoMdMove } from "react-icons/io";
import { PersonGenerator } from '../actions/PersonGenerator';
import { BiSolidShow, BiSolidHide, BiShowAlt, BiPulse } from "react-icons/bi";
import { PossibleTargets, MovementSpeed, TotalWeight, TotalCapacity, UpdateSuppressionStatusForPersons } from './utils';
import { MdDelete, MdSettingsSuggest } from 'react-icons/md';
import { CalculateFireEffectWithConditions, ApplyFireEffectWithConditions } from '../game/conditions';
import { UnitMap } from './Emap';
import { GrUserPolice } from "react-icons/gr";
import { TbFlag } from 'react-icons/tb';
import { RiCheckboxIndeterminateLine, RiCheckboxLine } from 'react-icons/ri';
import { CiLocationOff, CiLocationOn } from 'react-icons/ci';
import { BsArrowsMove, BsSignStop } from 'react-icons/bs';
import { useVisibilityConditions } from '../game/conditions';
import { BestActorForUnit } from '../actions/Watch';
import { VehicleEditorModal } from '../actions/VehicleEditor';

export function UnitForm({ players, data, onChange, onOtherChange, setSelectedNode, setPlayers, addLogEntry, mapBackgroundImage, setMapBackgroundImage }) {
    const calculateFireEffect = CalculateFireEffectWithConditions();
    const applyFireEffectsWithConditions = ApplyFireEffectWithConditions();
    const { activeConditionIds } = useVisibilityConditions();
    const [personGeneratorOpen, setPersonGeneratorOpen] = useState(false);
    const [vehicleEditorOpen, setVehicleEditorOpen] = useState(false);
    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    function checkIfCanRun() {
        if (!data.children) return false;

        if (!checkIfCanMove()) return false;

        if (data.vehicle) return false;

        const totalWeight = TotalWeight(data);
        const totalCapacity = TotalCapacity(data);

        if (totalWeight > totalCapacity) return false;

        const loadout = totalWeight / totalCapacity;

        if (loadout > 0.75) return false;

        const minFpLevel = Level(MinSkill(data, "END"));

        return data.fatigue < minFpLevel;
    }

    function checkIfCanMove() {
        if (!data.children) return false;
        if (data.isDeployed) return false;
        if (MovementSpeed(data) === 0) return false;

        if (!data.vehicle) {
            const bleedingCount = data.children.filter(p => !p.isDead && p.isBleeding).length;
            const healthyCount = data.children.filter(p => !p.isDead && !p.isBleeding).length;
            if (bleedingCount > healthyCount) return false;
        }

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
        const effects = applyFireEffectsWithConditions(players, rolls, actors, target, onOtherChange);
        addLogEntry(`Групповой огонь ${data.name} по ${target.name} (${actors[0].equipment.name}).`);
        effects.forEach(element => {
            addLogEntry(element.message);
        });
        resetModalData();
    };

    function getUnitFireGroups(unit) {
        if (!unit?.children) return [];

        const shooters = unit.children.filter(p => !p.isDead && !p.isBleeding && !p.isSuppressed && p.defaultEquipment);

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

    const applyAlertnessRoll = (players, rolls, actors, target) => {
        const effects = getAlertnessRoll(players, rolls, actors, target);

        const effectMap = new Map();
        effects.forEach(effect => {
            addLogEntry(effect.message);
            effectMap.set(effect.id, effect);
        });

        const updatedPlayers = players.map(player => {
            return {
                ...player,
                children: player.children?.map(unit => {
                    if (effectMap.has(unit.id)) {
                        const effect = effectMap.get(unit.id);
                        return {
                            ...unit,
                            alertness: effect.alertness
                        };
                    }
                    return unit;
                }) || []
            };
        });

        setPlayers(updatedPlayers);

        resetModalData();
    };


    function getAlertnessRoll(players, rolls, actors, target) {
        return rolls.map(roll => {
            const unit = actors.filter(a => a.actor.id === roll.id)[0].actor;

            const unitData = BestActorForUnit(unit, activeConditionIds);

            return { id: roll.id, alertness: roll.roll, message: `Наблюдение ${unit.name}: ${unitData?.actor.name}${unitData?.equipment ? " (" + unitData.equipment.name + ")" : ""}: d20=${roll.roll}.` };
        });
    }

    return (
        <div>
            {
                personGeneratorOpen && (
                    <PersonGenerator onCancel={() => setPersonGeneratorOpen(false)} onConfirm={(newPerson) => { handleCreatePerson(newPerson); setPersonGeneratorOpen(false); }} />
                )
            }
            {
                vehicleEditorOpen && (
                    <VehicleEditorModal
                        isOpen={vehicleEditorOpen}
                        onClose={() => setVehicleEditorOpen(false)}
                        onSave={(vehicle) => {
                            onChange("vehicle", vehicle);
                            setVehicleEditorOpen(false);
                        }}
                        initialData={data.vehicle}
                    />
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
            <div className="unit-form-content">
                {players && (
                    <div className="unit-map-wrapper">
                        <UnitMap
                            players={players}
                            currentUnitId={data.id}
                            activeConditions={activeConditionIds}
                            setSelectedNode={setSelectedNode}
                            onOtherChange={onOtherChange}
                            backgroundImage={mapBackgroundImage}
                            setBackgroundImage={setMapBackgroundImage}
                        />
                    </div>
                )}
                <div className="unit-form-fields">
                    <label className="form-label">
                        <input name="name" type="text" value={data.name} onChange={(e) => onChange(e.target.name, e.target.value)} />
                    </label>
                    <div className="buttons-panel">
                        <TbFlag />
                        <label className="form-label">
                            <input
                                name="stress"
                                min="0"
                                type="number"
                                step="0.1"
                                inputmode="decimal"
                                value={data.stress.toFixed(1)}
                                onChange={(e) => {
                                    const newStress = Number(e.target.value);
                                    onChange("stress", newStress);
                                    UpdateSuppressionStatusForPersons(data.children, newStress, onOtherChange);
                                }}
                            />
                        </label>
                        <button key="toggleIsMarked" title="Переключить пометку завершения действия" onClick={toggleIsMarked}>
                            {data.isMarked ? (<RiCheckboxIndeterminateLine />) : (<RiCheckboxLine />)}
                        </button>
                    </div>
                    <div className="buttons-panel">
                        <BiShowAlt />
                        <button key="toggleIsHidden" title="Переключить пометку маскировки" onClick={toggleIsHidden}>
                            {data.isHidden ? (<BiSolidShow />) : (<BiSolidHide />)}
                        </button>
                        {PossibleTargets(players, data).length > 0 && (<button key="watch" title="Наблюдать" onClick={() => setModalData({ open: true, actors: [{ actor: data }], targets: [], onConfirm: applyAlertnessRoll, calculateEffect: getAlertnessRoll })}>
                            <PiBinocularsFill />
                        </button>)}
                    </div>
                    {
                        getUnitFireGroups(data).map((group) => (
                            <div className="buttons-panel">
                                <GiGunshot />
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
                                            calculateEffect: calculateFireEffect
                                        });
                                    }}>
                                    <TfiTarget />
                                </button>)}
                                {group.actors[0].equipment.name} x{group.actors.length}
                            </div >
                        ))}
                    <div className="buttons-panel">
                        {data.vehicle ? (<GiTireTracks />) : (<GiFootsteps />)}
                        <button
                            title={data.vehicle ? "Редактировать транспорт" : "Выбрать транспорт"}
                            onClick={() => setVehicleEditorOpen(true)}
                        >
                            <MdSettingsSuggest />
                        </button>
                        {data.vehicle && (
                            <button
                                title="Удалить транспорт"
                                onClick={() => onChange("vehicle", null)}
                            >
                                <MdDelete />
                            </button>
                        )}
                        <span>
                            {data.vehicle ? data.vehicle.name : "Пешком"}
                        </span>
                    </div>
                    <div className="buttons-panel">
                        {
                            data.vehicle ? (
                                <>
                                    <IoMdMove />
                                    <label className="form-label">
                                        <input name="plain" readOnly={true} type="number" value={speed.plain} />
                                    </label>
                                    <FaRoad />
                                    <label className="form-label">
                                        <input name="road" readOnly={true} type="number" value={speed.road} />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <IoMdMove />
                                    <label className="form-label">
                                        <input name="speed" readOnly={true} type="number" value={speed} />
                                    </label>
                                </>)
                        }
                        {checkIfCanMove() && data.hasMoved && (
                            <button key="toggleHasMoved" title="Переключить пометку передвижения" onClick={toggleHasMoved}>
                                {data.hasMoved ? (<BsSignStop />) : (<BsArrowsMove />)}
                            </button>)}
                        <button key="toggleIsDeployed" title="Переключить пометку стационарного положения" onClick={toggleIsDeployed} style={{ display: checkIfCanDeploy() ? 'inline' : 'none' }}>
                            {data.isDeployed ? (<CiLocationOff />) : (<CiLocationOn />)}
                        </button>
                    </div>
                    <div className="buttons-panel">
                        <BiPulse />
                        <label className="form-label">
                            <input min={0} max={MinSkill(data, "END")} name="fatigue" type="number" value={data.fatigue} onChange={(e) => onChange(e.target.name, Number(e.target.value))} />
                        </label>
                        {checkIfCanRun() && (
                            <button key="run" title="Бежать" onClick={run}>
                                <GiRun />
                            </button>)}
                    </div>
                    <div className="buttons-panel">
                        <GiBullseye />
                        <label className="form-label">
                            <input min={0} max={5} name="correction" type="number" value={data.correction} onChange={(e) => onChange(e.target.name, Number(e.target.value))} />
                        </label>
                    </div>
                    <div className="buttons-panel">
                        <GrUserPolice />
                        <label className="form-label">
                            <input name="current_people" readOnly={true} type="number" value={data.children?.length ?? 0} />
                        </label>
                        <button key="addPerson" title="Добавить персонаж" onClick={() => setPersonGeneratorOpen(true)}>
                            <IoIosPersonAdd />
                        </button>
                    </div>
                    <div className="buttons-panel">
                        <GiWeight />
                        <label className="form-label">
                            <input name="weight" readOnly={true} type="number" value={TotalWeight(data) / 10} />
                        </label>
                        /
                        <label className="form-label">
                            <input name="capacity" readOnly={true} type="number" value={TotalCapacity(data) / 10} />
                        </label>
                    </div>
                </div>
            </div>
        </div >
    );
}