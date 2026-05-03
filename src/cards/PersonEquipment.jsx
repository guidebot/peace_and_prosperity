import { useState } from 'react';
import { Level } from '../game/Skill';
import { SCALE_PREFIX } from '../game/Constants';
import { MdArrowRight, MdArrowDropDown, MdDelete } from "react-icons/md";
import { EquipmentEditorModal } from '../actions/EquipmentEditor';
import { RollModal } from '../actions/Roll';
import { TfiTarget } from "react-icons/tfi";
import { CanFireInfantryEquipment } from '../actions/Fire';
import { CanWatchEquipment } from '../actions/Watch';
import { CiBookmark, CiBookmarkCheck } from "react-icons/ci";
import { GiSmokeBomb, GiConfirmed, GiCancel, GiHealing } from 'react-icons/gi';
import { PossibleTargets, RemoveEquipmentFromPerson } from './utils';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions, CalculateFireEffectWithConditions, ApplyFireEffectWithConditions } from "../game/conditions";
import { PiBinocularsFill } from 'react-icons/pi';
import { MdSettingsSuggest, MdOutlineAdd } from 'react-icons/md';

import { RiTimerFlashLine } from 'react-icons/ri';
import { TbArrowsExchange } from 'react-icons/tb';

export function findNodeById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function CollapsibleEquipmentGroup({ isOpen, toggle, players, actor, onPropertyChange, onOtherChange, addLogEntry }) {
    const [transferModal, setTransferModal] = useState({
        open: false,
        recipientId: null,
        selectedEquipmentIds: new Set()
    });

    function getAllPersons(nodes) {
        let result = [];
        for (const node of nodes) {
            if (node.type === 'unit') {
                for (const person of node.children) {
                    result.push({ unit: node, person: person });
                }
            } else {
                result = result.concat(getAllPersons(node.children));
            }
        }
        return result;
    }

    const handleRecipientChange = (e) => {
        const recipientId = e.target.value || null;
        setTransferModal(prev => ({ ...prev, recipientId }));
    };

    const toggleEquipmentSelection = (equipmentId) => {
        setTransferModal(prev => {
            const newSet = new Set(prev.selectedEquipmentIds);
            if (newSet.has(equipmentId)) {
                newSet.delete(equipmentId);
            } else {
                newSet.add(equipmentId);
            }
            return { ...prev, selectedEquipmentIds: newSet };
        });
    };

    const confirmTransfer = () => {
        const { recipientId, selectedEquipmentIds } = transferModal;
        if (!recipientId || selectedEquipmentIds.size === 0) return;

        const selectedEquipment = actor.equipment.filter(eq => selectedEquipmentIds.has(eq.id));

        const newOwnEquipment = actor.equipment.filter(eq => !selectedEquipmentIds.has(eq.id));
        onPropertyChange("equipment", newOwnEquipment);

        if (selectedEquipmentIds.has(actor.defaultEquipment)) {
            const newDefault = newOwnEquipment.find(eq => eq.skill !== "WPN_grenades")?.id || null;
            onPropertyChange("defaultEquipment", newDefault);
        }

        const recipientNode = findNodeById(players, recipientId);
        const recipientEquipment = recipientNode?.equipment || [];
        const newRecipientEquipment = [...recipientEquipment, ...selectedEquipment];

        onOtherChange(recipientId, "equipment", newRecipientEquipment);

        if (!recipientNode?.defaultEquipment) {
            const newDefaultForRecipient = newRecipientEquipment.find(eq => eq.skill !== "WPN_grenades")?.id;
            if (newDefaultForRecipient) {
                onOtherChange(recipientId, "defaultEquipment", newDefaultForRecipient);
            }
        }

        const names = selectedEquipment.map(eq => eq.name).join(", ");
        const recipientName = recipientNode?.name || "неизвестный";
        addLogEntry(`${actor.name} передал ${names} персонажу ${recipientName}.`);

        setTransferModal({ open: false, recipientId: null, selectedEquipmentIds: new Set() });
    };

    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();
    const calculateFireEffects = CalculateFireEffectWithConditions();
    const applyFireEffectsWithConditions = ApplyFireEffectWithConditions();

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

    const applyWatchEffect = (players, rolls, actor, target) => {
        const effects = applyWatchEffectWithConditions(players, rolls, actor, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    function applyFireEffects(players, rolls, actors, target) {
        const effects = applyFireEffectsWithConditions(players, rolls, actors, target, onOtherChange);
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

    function calculateHealEffect(players, rolls, actors, target) {
        const actor = actors[0].actor;
        const skill = Level(actor.skills["MED"]) || 0;
        const result = rolls[0].roll + skill;
        const effect = result >= 10 ? "кровотечение остановлено" : "эффекта нет";
        const message = `${actor.name} оказывает первую помощь, d20=${rolls[0].roll}, результат ${result}, ${effect}.`;
        return [{ message: message }];
    }

    function applyHealEffect(players, rolls, actors, target) {
        const effects = calculateHealEffect(players, rolls, actors, target);
        addLogEntry(effects[0].message);
        resetModalData();
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
                    {isOpen && actor.equipment.length > 0 && (
                        <button
                            title="Передать снаряжение"
                            onClick={() => setTransferModal({ open: true, recipientId: null, selectedEquipmentIds: new Set() })}
                        >
                            <TbArrowsExchange />
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

            {transferModal.open && (
                <div className="modal-overlay" onClick={() => setTransferModal({ open: false, recipientId: null, selectedEquipmentIds: new Set() })}>
                    <div className="modal-body" onClick={e => e.stopPropagation()}>
                        <h3>Передача снаряжения</h3>
                        <label className="form-label">
                            <span style={{ width: '50px', textAlign: 'left' }}>Кому:</span>
                            <select value={transferModal.recipientId || ''} onChange={handleRecipientChange}>
                                <option value="">Выберите персонажа...</option>
                                {getAllPersons(players)
                                    .filter(p => p.person.id !== actor.id)
                                    .map(p => (
                                        <option key={p.person.id} value={p.person.id}>{`${p.unit.name} - ${p.person.name}`}</option>
                                    ))}
                            </select>
                        </label>
                        <div>
                            {actor.equipment.length === 0 ? (
                                <p>Нет снаряжения</p>
                            ) : (
                                actor.equipment.map(eq => (
                                    <label className='form-label' key={eq.id} >
                                        <span>{eq.name} ({(eq.weight + eq.ammo * eq.ammoWeight) / 10} кг)</span>
                                        <input
                                            type="checkbox"
                                            checked={transferModal.selectedEquipmentIds.has(eq.id)}
                                            onChange={() => toggleEquipmentSelection(eq.id)}
                                        />
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="buttons-panel" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button title="Так точно" onClick={confirmTransfer} disabled={!transferModal.recipientId || transferModal.selectedEquipmentIds.size === 0}><GiConfirmed /></button>
                        <button title="Никак нет" onClick={() => setTransferModal({ open: false, recipientId: null, selectedEquipmentIds: new Set() })}><GiCancel /></button>
                    </div>

                </div>
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
                            <td>{item.minRange > 0 ? item.minRange + SCALE_PREFIX : "-"}</td>
                            <td>{item.bestRange > 0 ? item.bestRange + SCALE_PREFIX : "-"}</td>
                            <td>{item.effectiveRange > 0 ? item.effectiveRange >= 20000000 ? "∞" : item.effectiveRange + SCALE_PREFIX : "-"}</td>
                            <td>{item.maxRange > 0 ? item.maxRange >= 20000000 ? "∞" : item.maxRange + SCALE_PREFIX : "-"}</td>
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
                                <div className='buttons-panel' style={{ justifyContent: "center" }}>
                                    {PossibleTargets(players, actor).length > 0 && CanFireInfantryEquipment(players, actor, item) && (<button title="Огонь!" onClick={() => setModalData({
                                        open: true,
                                        equipment: item,
                                        targets: PossibleTargets(players, actor),
                                        title: "Огонь",
                                        onConfirm: applyFireEffects,
                                        calculateEffect: calculateFireEffects
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
                                    {item.skill !== "WPN_grenades" && item.skill !== "WPN_explosives" && item.skill !== "TECH_uav"
                                        && CanFireInfantryEquipment(players, actor, item) && (<button title="Установить основным" onClick={() => toggleDefaultEquipment(item)}>
                                            {actor.defaultEquipment === item.id ? (<CiBookmarkCheck />) : (<CiBookmark />)}
                                        </button>)}
                                    {item.name === "Дымовая шашка" && actor.skills[item.skill] > 0 && item.ammo > 0 && (<button title="Дымовая завеса" onClick={() => applySmoke(item)} >
                                        <GiSmokeBomb />
                                    </button>)}
                                    {item.skill === "MED" && actor.skills[item.skill] > 0 && item.ammo > 0 && (<button title="Первая помощь" onClick={() => setModalData({
                                        open: true,
                                        equipment: item,
                                        targets: [],
                                        title: "Первая помощь",
                                        onConfirm: applyHealEffect,
                                        calculateEffect: calculateHealEffect
                                    })} >
                                        <GiHealing />
                                    </button>)}
                                    <button title="Редактировать" onClick={() => { setEditorModal({ open: true, equipment: item }); }}>
                                        <MdSettingsSuggest />
                                    </button>
                                    <button title="Убрать" onClick={() => RemoveEquipmentFromPerson(actor, item, onOtherChange)}>
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