import { useState } from 'react';
import { Level } from '../game/Skill';
import { SCALE_PREFIX } from '../game/Constants';
import { MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { FireModal } from '../actions/FireModal';
import { WatchModal } from '../actions/WatchModal';
import { TfiTarget } from "react-icons/tfi";
import { CanFireVehicleEquipment } from '../actions/Fire';
import { PossibleTargets, CurrentUnit } from './utils';
import { CanWatchEquipment } from '../actions/Watch';
import { PiBinocularsFill } from 'react-icons/pi';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions, CalculateFireEffectWithConditions, ApplyFireEffectWithConditions } from "../game/conditions";

export function CollapsibleDrivingGroup({ isOpen, toggle, players, actor, onOtherChange, addLogEntry }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();
    const calculateFireEffect = CalculateFireEffectWithConditions();
    const applyFireEffect = ApplyFireEffectWithConditions();

    const applyFireEffects = (players, rolls, actors, target) => {
        const effects = applyFireEffect(players, rolls, actors, target, onOtherChange);
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
                modalData?.open && modalData.title === "Огонь" && (
                    <FireModal
                        players={players}
                        actors={[{ actor: actor, equipment: modalData?.equipment }]}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
                        onCancel={resetModalData}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }
            {
                modalData?.open && modalData.title === "Наблюдение" && (
                    <WatchModal
                        players={players}
                        actors={[{ actor: actor, equipment: modalData?.equipment }]}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
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
                            <td className='big-table-header'>Действия</td>
                            <td className='big-table-header'>Наименование</td>
                            <td className='big-table-header'>Боеприпасы</td>
                            <td className='big-table-header'>Уровень навыка</td>
                        </tr>
                    </thead>
                    <tbody>
                        {unit.vehicle.equipment.map((item) => (
                            <tr key={item}>
                                <td>
                                    <div className='buttons-panel'>
                                        {PossibleTargets(players, actor).length > 0 && CanFireVehicleEquipment(players, actor, item) && (
                                            <button title="Огонь!" onClick={() => setModalData({
                                                open: true,
                                                equipment: item,
                                                targets: PossibleTargets(players, actor),
                                                title: "Огонь",
                                                onConfirm: applyFireEffects,
                                                calculateEffect: calculateFireEffect
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
                                <td>{item.name}</td>
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
                                <td>{Level(actor.skills[item.skill] || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div >
    );
}