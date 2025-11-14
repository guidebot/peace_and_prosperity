import { useState, useEffect, useMemo } from 'react';
import { SkillCategories, SkillsByCategories } from '../game/skills';
import { CollapsibleEquipmentGroup } from './person_equipment';
import { CollapsibleDrivingGroup } from './person_driving';
import { CollapsibleSkillGroup } from './person_skills';
import { CurrentUnit } from './utils';

export function PersonForm({ players, data, onPropertyChange, onOtherChange, addLogEntry }) {
    const equipment = useMemo(() => data.equipment || [], [data.equipment]);
    const [totalWeight, setTotalWeight] = useState(0);

    useEffect(() => {
        const newWeight = equipment.reduce((sum, item) => {
            return sum + (item.weight + item.ammo * item.ammoWeight);
        }, 0);

        setTotalWeight(newWeight);
    }, [equipment, data]);

    const [openGroups, setOpenGroups] = useState({
        char: true,
        driving: data.vehicle,
        equipment: true,
        wpn: true,
        mex: true
    });

    const unit = CurrentUnit(players, data);

    if (!unit) return;

    const toggleGroup = (group) => {
        setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    return (
        <div>
            <label className="form-label" >
                <span>Имя:</span>
                <input name="name" type="text" value={data.name} onChange={(e) => onPropertyChange(e.target.name, e.target.value)} />
            </label>
            <label className="form-label" >
                <span>Вес снаряжения:</span>
                <input name="totalWeight" readOnly={true} type="number" value={totalWeight / 10} />кг
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
            {Object.entries(SkillsByCategories).map(([key, group]) => (
                <CollapsibleSkillGroup
                    players={players}
                    actor={data}
                    key={key}
                    title={SkillCategories[key]}
                    skills={group}
                    currentSkills={data.skills}
                    onPropertyChange={onPropertyChange}
                    onOtherChange={onOtherChange}
                    isOpen={openGroups[key]}
                    toggle={() => toggleGroup(key)}
                    addLogEntry={addLogEntry}
                />
            ))}
        </div>
    );
}