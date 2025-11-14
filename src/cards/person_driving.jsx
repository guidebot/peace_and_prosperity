import { useState } from 'react';
import { Level } from '../game/skills';
import { MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { RollModal } from '../actions/roll';
import { TfiTarget } from "react-icons/tfi";
import { CalculateFireEffects, ApplyFireEffects, CanFireVehicleEquipment } from '../actions/fire';
import { PossibleTargets, CurrentUnit } from './utils';
import { CanWatchEquipment } from '../actions/watch';
import { PiBinocularsFill } from 'react-icons/pi';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions } from "../game/conditions";

export function CollapsibleDrivingGroup({ isOpen, toggle, players, actor, onOtherChange, addLogEntry }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();

    const applyFireEffects = (players, rolls, actors, target) => {
        const effects = ApplyFireEffects(players, rolls, actors, target, onOtherChange);
        addLogEntry(effects[0].message);
        resetModalData();
    };

    const applyWatchEffect = (players, rolls, result, actor, target) => {
        const effects = applyWatchEffectWithConditions(players, rolls, result, actor, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    const unit = CurrentUnit(players, actor);

    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ equipment: null, open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    return (
        <div>
            <h2>
                <button onClick={toggle}>
                    {isOpen ? <MdArrowDropDown /> : <MdArrowRight />}
                    Транспортное средство
                </button>
            </h2>
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

            {unit.vehicle && unit.vehicle.equipment.length > 0 && (
                <table className="skills-table" style={{ display: isOpen ? 'table' : 'none' }}>
                    <thead>
                        <tr>
                            <td>Название</td>
                            <td className='big-table-header'>Уровень навыка</td>
                            <td className='big-table-header'>Минимальная дальность</td>
                            <td className='big-table-header'>Идеальная дальность</td>
                            <td className='big-table-header'>Эффективная дальность</td>
                            <td className='big-table-header'>Максимальная дальность</td>
                            <td className='big-table-header'>Бронебойность</td>
                            <td className='big-table-header'>Интенсивность огня</td>
                            <td className='big-table-header'>Боеприпасы</td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {unit.vehicle.equipment.map((item) => (
                            <tr key={item}>
                                <td>{item.name}</td>
                                <td>{Level(actor.skills[item.skill] || 0)}</td>
                                <td>{item.minRange > 0 && (item.minRange)}</td>
                                <td>{item.bestRange}</td>
                                <td>{item.effectiveRange}</td>
                                <td>{item.maxRange}</td>
                                <td>{item.ap}</td>
                                <td>{item.he}</td>
                                <td>
                                    <input
                                        key={item.id}
                                        name={item.id}
                                        type="number"
                                        min={0}
                                        value={item.ammo || 0}
                                        onChange={(e) => {
                                            const newAmmo = Number(e.target.value);
                                            onOtherChange(item.id, "ammo", newAmmo);
                                        }}
                                    />
                                </td>
                                <td>
                                    <div className='buttons-panel'>
                                        {PossibleTargets(players, actor).length > 0 && CanFireVehicleEquipment(players, actor, item) && (
                                            <button title="Огонь!" onClick={() => setModalData({
                                                open: true,
                                                equipment: item,
                                                targets: PossibleTargets(players, actor),
                                                title: "Огонь",
                                                onConfirm: applyFireEffects,
                                                calculateEffect: CalculateFireEffects
                                            })} >
                                                <TfiTarget />
                                            </button>
                                        )}
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
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div >
    );
}