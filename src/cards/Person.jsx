import { useState, useEffect, useMemo } from 'react';
import { Attributes, SkillsByAttributes, Level } from '../game/Skill';
import { CollapsibleEquipmentGroup } from './PersonEquipment';
import { CollapsibleDrivingGroup } from './PersonDriving';
import { SkillsTable, SkillsModalsWrapper } from './PersonSkills';
import { CurrentUnit, PossibleTargets } from './utils';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions } from "../game/conditions";
import { GiHealing } from 'react-icons/gi';
import { TbSteeringWheel } from 'react-icons/tb';
import { PiBinocularsFill } from 'react-icons/pi';

export function PersonForm({ players, data, onPropertyChange, onOtherChange, addLogEntry }) {
    const equipment = useMemo(() => data.equipment || [], [data.equipment]);
    const [totalWeight, setTotalWeight] = useState(0);

    const totalSkill = useMemo(() =>
        Object.values(data.skills || {}).reduce((sum, val) => sum + val, 0)
        , [data.skills]);

    useEffect(() => {
        const newWeight = equipment.reduce((sum, item) => {
            return sum + (item.weight + item.ammo * item.ammoWeight);
        }, 0);

        setTotalWeight(newWeight);
    }, [equipment, data]);

    const unit = CurrentUnit(players, data);

    if (!unit) return null;

    const [openGroups, setOpenGroups] = useState(() => {
        const initial = {
            equipment: true,
            driving: true
        };
        return initial;
    });

    const [filterZeroSkills, setFilterZeroSkills] = useState(true);
    const [skillsOpen, setSkillsOpen] = useState(true);
    const [skillsModalData, setSkillsModalData] = useState({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    const toggleGroup = (group) => {
        setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const calculateWatchEffectWithConditions = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();

    const groups = Object.entries(SkillsByAttributes).map(([key, group]) => ({
        title: Attributes[key],
        skills: group
    }));

    function calculateWatchEffect(players, rolls, result, actor, target) {
        const effects = applyWatchEffectWithConditions(players, rolls, result, actor, target);
        addLogEntry(effects[0].message);
        setSkillsModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });
    }

    function calculateHealEffect(players, rolls, actors, target) {
        const actor = actors[0].actor;
        const skill = Level(actor.skills["MED"]) || 0;
        const result = rolls[0].roll + skill;
        const effect = result >= 20 ? "кровотечение остановлено" : "эффекта нет";
        const message = `${actor.name} оказывает первую помощь, d20=${rolls[0].roll}, результат ${result}, ${effect}.`;
        return [{ message: message }];
    }

    function applyHealEffect(players, rolls, actors, target) {
        const effects = calculateHealEffect(players, rolls, actors, target);
        addLogEntry(effects[0].message);
        setSkillsModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });
    }

    function calculateMechanicsEffect(players, rolls, actors, vehicleType) {
        const actor = actors[0].actor;
        const skill = actor.skills["MCH"] || 0;
        const roll = rolls[0].roll;
        const result = roll + skill;
        const success = result >= vehicleType.threshold;
        const message = `${actor.name} управляет (${vehicleType.name}), d20=${roll}, результат ${result}: ${success ? 'успех' : 'неудача'}.`;
        return [{ message, success, vehicleType }];
    }

    function applyMechanicsEffect(players, rolls, actors, vehicleType) {
        const effects = calculateMechanicsEffect(players, rolls, actors, vehicleType);
        addLogEntry(effects[0].message);
        setSkillsModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });
    }

    const skillModals = (
        <SkillsModalsWrapper
            players={players}
            modalData={skillsModalData}
            setModalData={setSkillsModalData}
        />
    );

    return (
        <div>
            <label className="form-label" >
                <span>Имя персонажа:</span>
                <input name="name" type="text" value={data.name} onChange={(e) => onPropertyChange(e.target.name, e.target.value)} />
            </label>
            <label className="form-label" >
                <span>Вес снаряжения:</span>
                <input name="totalWeight" readOnly={true} type="number" value={totalWeight / 10} />кг
            </label>
            <label className="form-label" >
                <span>Очки тренированности:</span>
                <input name="totalSkill" readOnly={true} type="number" value={totalSkill} />
            </label>
            {unit.vehicle && (<CollapsibleDrivingGroup
                players={players}
                actor={data}
                isOpen={openGroups.driving}
                toggle={() => toggleGroup('driving')}
                onOtherChange={onOtherChange}
                addLogEntry={addLogEntry}
            />)}
            <CollapsibleEquipmentGroup
                players={players}
                actor={data}
                currentEquipment={equipment}
                isOpen={openGroups.equipment}
                toggle={() => toggleGroup('equipment')}
                onPropertyChange={onPropertyChange}
                onOtherChange={onOtherChange}
                addLogEntry={addLogEntry}
            />
            <SkillsTable
                groups={groups}
                isOpen={skillsOpen}
                toggle={() => setSkillsOpen(!skillsOpen)}
                filterZeroSkills={filterZeroSkills}
                setFilterZeroSkills={setFilterZeroSkills}
                players={players}
                actor={data}
                currentSkills={data.skills}
                onPropertyChange={onPropertyChange}
                onOtherChange={onOtherChange}
                addLogEntry={addLogEntry}
                modalData={skillsModalData}
                setModalData={setSkillsModalData}
            />
            {skillModals}
        </div>
    );
}