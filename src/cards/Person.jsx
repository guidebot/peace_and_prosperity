import { useState, useEffect, useMemo } from 'react';
import { Attributes, SkillsByAttributes } from '../game/Skill';
import { CollapsibleEquipmentGroup } from './PersonEquipment';
import { CollapsibleDrivingGroup } from './PersonDriving';
import { CollapsibleSkillGroupTableBody, CollapsibleSkillGroupModals, SkillsTable } from './PersonSkills';
import { CurrentUnit } from './utils';

function createInitialSkillGroupStates() {
    const states = {};
    Object.keys(SkillsByAttributes).forEach(key => {
        states[key] = {
            filterSkills: true,
            modalData: { open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } },
        };
    });
    return states;
}

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

    const [openGroups, setOpenGroups] = useState(() => {
        const initial = {
            equipment: true,
            HEL: true,
            AGI: true,
            CHR: true,
            INT: true,
            MRK: true
        };

        Object.entries(SkillsByAttributes).forEach(([key, group]) => {
            const hasNonZeroSkill = group.some(skill => (data.skills?.[skill.id] || 0) > 0);
            initial[key] = hasNonZeroSkill;
        });

        return initial;
    });

    useEffect(() => {
        setOpenGroups((prev) => {
            const updated = { ...prev };

            Object.entries(SkillsByAttributes).forEach(([key, group]) => {
                const hasNonZeroSkill = group.some(skill => (data.skills?.[skill.id] || 0) > 0);
                updated[key] = hasNonZeroSkill;
            });

            return updated;
        });
    }, [data]);

    const [skillGroupStates, setSkillGroupStates] = useState(() => createInitialSkillGroupStates());

    const unit = CurrentUnit(players, data);

    if (!unit) return;

    const toggleGroup = (group) => {
        setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const updateSkillGroupState = (key, updater) => {
        setSkillGroupStates(prev => ({
            ...prev,
            [key]: { ...prev[key], ...updater(prev[key]) }
        }));
    };

    const skillGroupTableBodies = Object.entries(SkillsByAttributes).map(([key, group]) => {
        const state = skillGroupStates[key];
        const setFilterSkills = (value) => updateSkillGroupState(key, s => ({ ...s, filterSkills: value }));
        const setModalData = (value) => updateSkillGroupState(key, s => ({ ...s, modalData: value }));
        return (
            <CollapsibleSkillGroupTableBody
                players={players}
                actor={data}
                key={key}
                title={Attributes[key]}
                skills={group}
                currentSkills={data.skills}
                onPropertyChange={onPropertyChange}
                onOtherChange={onOtherChange}
                isOpen={openGroups[key]}
                toggle={() => toggleGroup(key)}
                addLogEntry={addLogEntry}
                filterSkills={state.filterSkills}
                setFilterSkills={setFilterSkills}
                modalData={state.modalData}
                setModalData={setModalData}
            />
        );
    });

    const skillGroupModals = Object.entries(SkillsByAttributes).map(([key, group]) => {
        const state = skillGroupStates[key];
        const setModalData = (value) => updateSkillGroupState(key, s => ({ ...s, modalData: value }));
        return (
            <CollapsibleSkillGroupModals
                players={players}
                actor={data}
                key={key}
                title={Attributes[key]}
                skills={group}
                currentSkills={data.skills}
                onPropertyChange={onPropertyChange}
                onOtherChange={onOtherChange}
                isOpen={openGroups[key]}
                toggle={() => toggleGroup(key)}
                addLogEntry={addLogEntry}
                modalData={state.modalData}
                setModalData={setModalData}
            />
        );
    });

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
            <SkillsTable groups={skillGroupTableBodies} />
            {skillGroupModals}
        </div>
    );
}