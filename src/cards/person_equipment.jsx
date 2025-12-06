import { useState } from 'react';
import { Level } from '../game/skills';
import { MdArrowRight, MdArrowDropDown, MdDelete } from "react-icons/md";
import { EquipmentEditorModal } from '../actions/equipment_editor';
import { RollModal } from '../actions/roll';
import { TfiTarget } from "react-icons/tfi";
import { CalculateFireEffects, ApplyFireEffects, CanFireInfantryEquipment } from '../actions/fire';
import { CanWatchEquipment } from '../actions/watch';
import { CiBookmark, CiBookmarkCheck } from "react-icons/ci";
import { GiSmokeBomb } from 'react-icons/gi';
import { PossibleTargets } from './utils';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions } from "../game/conditions";
import { PiBinocularsFill } from 'react-icons/pi';
import { MdSettingsSuggest, MdOutlineAdd } from 'react-icons/md';

import { RiTimerFlashLine } from 'react-icons/ri';

export function CollapsibleEquipmentGroup({ isOpen, toggle, players, actor, onPropertyChange, onOtherChange, addLogEntry }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();

    const handleRemoveEquipment = (equipment) => {
        const newEquipment = actor.equipment.filter(eq => eq.id !== equipment.id);
        if (newEquipment.length === 0) {
            onPropertyChange("defaultEquipment", null);
        }
        else if (equipment.id === actor.defaultEquipment) {
            onPropertyChange("defaultEquipment", newEquipment.find(eq => eq.skill !== "WPN_grenades")?.id);
        }

        onPropertyChange("equipment", newEquipment);
    };

    const [editorModal, setEditorModal] = useState({ open: false, equipment: null });

    const handleUpdateEquipment = (equipment) => {
        if (editorModal.equipment) {
            const updatedEquipment = actor.equipment.map(eq =>
                eq.id === editorModal.equipment.id ? equipment : eq
            );
            onPropertyChange("equipment", updatedEquipment);
        } else {
            const newEquipment = [...actor.equipment, equipment];
            onPropertyChange("equipment", newEquipment);
            if (!actor.defaultEquipment) {
                onPropertyChange("defaultEquipment", newEquipment.find(eq => eq.skill !== "WPN_grenades")?.id);
            }
        }

        setEditorModal({ open: false, equipment: null });
    };

    const applySmoke = (equipment) => {
        onOtherChange(equipment.id, "ammo", equipment.ammo - 1);
        addLogEntry(`${actor.name} установил дымовую завесу.`);
    };

    const applyWatchEffect = (players, rolls, result, actor, target) => {
        const effects = applyWatchEffectWithConditions(players, rolls, result, actor, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    function applyFireEffects(players, rolls, actors, target) {
        const effects = ApplyFireEffects(players, rolls, actors, target, onOtherChange);
        addLogEntry(effects[0].message);
        resetModalData();
    };

    function toggleDefaultEquipment(newDefaultEquipment) {
        if (actor.defaultEquipment === newDefaultEquipment.id) {
            onPropertyChange("defaultEquipment", null);
        }
        else {
            onPropertyChange("defaultEquipment", newDefaultEquipment.id);
        }
    }

    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    return (
        <div>
            <h2>
                <div className="buttons-panel">
                    <button onClick={toggle}>
                        {isOpen ? <MdArrowDropDown /> : <MdArrowRight />}
                        Снаряжение
                    </button>
                    {isOpen && (
                        <button title="Добавить" onClick={() => setEditorModal({ open: true, equipment: null })}>
                            <MdOutlineAdd />
                        </button>
                    )}
                </div>
            </h2>
            <EquipmentEditorModal
                isOpen={editorModal.open}
                onClose={() => setEditorModal({ open: false, equipment: null })}
                onSave={handleUpdateEquipment}
                initialData={editorModal.equipment}
            />
            {
                modalData?.open && (
                    <RollModal
                        players={players}
                        actors={[{ actor: actor, equipment: modalData?.equipment }]}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
                        title={modalData?.title}
                        onCancel={resetModalData}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }

            <table className="skills-table" style={{ display: isOpen && actor.equipment.length > 0 ? 'table' : 'none' }}>
                <thead>
                    <tr>
                        <td>Название</td>
                        <td className='big-table-header'>Вес</td>
                        <td className='big-table-header'>Уровень навыка</td>
                        <td className='big-table-header'>Минимальная дальность</td>
                        <td className='big-table-header'>Идеальная дальность</td>
                        <td className='big-table-header'>Эффективная дальность</td>
                        <td className='big-table-header'>Максимальная дальность</td>
                        <td className='big-table-header'>Бронебойность</td>
                        <td className='big-table-header'>Интенсивность огня</td>
                        <td className='big-table-header'>Боеприпасы</td>
                        <td className='big-table-header'>Время</td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    {actor.equipment.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{(item.weight + item.ammo * item.ammoWeight) / 10} кг</td>
                            <td>{Level(actor.skills[item.skill] || 0)}</td>
                            <td>{item.minRange > 0 ? item.minRange : "-"}</td>
                            <td>{item.bestRange > 0 ? item.bestRange : "-"}</td>
                            <td>{item.effectiveRange > 0 ? item.effectiveRange : "-"}</td>
                            <td>{item.maxRange > 0 ? item.maxRange : "-"}</td>
                            <td>{item.ap > 0 ? item.ap : "-"}</td>
                            <td>{item.he > 0 ? item.he : "-"}</td>
                            <td>
                                {item.ammoWeight > 0 && <input
                                    key={`ammo${item.id}`}
                                    name={`ammo${item.id}`}
                                    type="number"
                                    min={0}
                                    value={item.ammo || 0}
                                    onChange={(e) => {
                                        const newAmmo = Number(e.target.value);
                                        onOtherChange(item.id, "ammo", newAmmo);
                                    }}
                                />}
                            </td>
                            <td>
                                {item.counter > 0 && <input
                                    key={`counter${item.id}`}
                                    name={`counter${item.id}`}
                                    type="number"
                                    min={0}
                                    value={item.counter || 0}
                                    onChange={(e) => {
                                        const newCounter = Number(e.target.value);
                                        onOtherChange(item.id, "counter", newCounter);
                                    }}
                                />}
                                {item.defaultCounter > 0 && item.counter === 0 && <button title={`Активировать (${item.defaultCounter})`} onClick={() => onOtherChange(item.id, "counter", item.defaultCounter)} >
                                    <RiTimerFlashLine />
                                </button>}
                            </td>
                            <td>
                                <div className='buttons-panel'>
                                    {PossibleTargets(players, actor).length > 0 && CanFireInfantryEquipment(players, actor, item) && (<button title="Огонь!" onClick={() => setModalData({
                                        open: true,
                                        equipment: item,
                                        targets: PossibleTargets(players, actor),
                                        title: "Огонь",
                                        onConfirm: applyFireEffects,
                                        calculateEffect: CalculateFireEffects
                                    })} >
                                        <TfiTarget />
                                    </button>)}
                                    {PossibleTargets(players, actor).length > 0 && item.optic && CanWatchEquipment(players, actor, item) && (<button title="Наблюдение" onClick={() => setModalData({
                                        open: true,
                                        targets: PossibleTargets(players, actor),
                                        equipment: item,
                                        title: "Наблюдение",
                                        onConfirm: applyWatchEffect,
                                        calculateEffect: calculateWatchEffect
                                    })} >
                                        <PiBinocularsFill />
                                    </button>)}
                                    {item.skill !== "WPN_grenades" && item.skill !== "WPN_explosives" && item.skill !== "WPN_uav"
                                        && CanFireInfantryEquipment(players, actor, item) && (<button title="Установить основным" onClick={() => toggleDefaultEquipment(item)}>
                                            {actor.defaultEquipment === item.id ? (<CiBookmarkCheck />) : (<CiBookmark />)}
                                        </button>)}
                                    {item.name === "Дымовая шашка" && actor.skills[item.skill] > 0 && item.ammo > 0 && (<button title="Дымовая завеса" onClick={() => applySmoke(item)} >
                                        <GiSmokeBomb />
                                    </button>)}
                                    <button title="Редактировать" onClick={() => { setEditorModal({ open: true, equipment: item }); }}>
                                        <MdSettingsSuggest />
                                    </button>
                                    <button title="Убрать" onClick={() => handleRemoveEquipment(item)}>
                                        <MdDelete />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
}