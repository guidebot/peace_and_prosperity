import { Level, MaxSkill } from "../game/skills";

export function PossibleTargets(players, actor) {
    const allUnits = [];

    for (const player of players) {
        let skipPlayer = false;
        for (const unit of player.children) {
            if (unit.id === actor.id) { skipPlayer = true; continue; }
            if (unit.children?.some(person => person.id === actor.id)) skipPlayer = true;
        }

        if (!skipPlayer && player.children) {
            allUnits.push(...player.children.filter(u => u.isActive));
        }
    }

    return allUnits;
}

export function TotalWeight(unitData) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter(s => !s.isDead).reduce((total, soldier) => {
        const soldierWeight = soldier.equipment?.reduce((sum, item) => {
            return sum + (item.weight + item.ammo * item.ammoWeight);
        }, 0);

        return total + soldierWeight;
    }, 0);
};

export function TotalCapacity(unitData) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    const totalFpLevel = unitData.children.filter(s => !s.isDead).reduce((total, soldier) => {
        const fpPoints = soldier.skills["FP"] || 0;
        const level = Level(fpPoints);

        return total + level;
    }, 0);

    return totalFpLevel * 120;
};

export function MovementSpeed(unitData) {
    if (!unitData.children || unitData.children.length === 0) return 2;

    if (unitData.vehicle) {
        switch (unitData.vehicle.type) {
            case "truck":
                return { plain: 6, road: 20 };
            case "wheel":
                return { plain: 12, road: 16 };
            case "track":
                return { plain: 12, road: 16 };
            default:
                console.error(`Неизвестный тип транспортного средства ${unitData.vehicle.type}!`);
        }
    } else {
        const totalWeight = TotalWeight(unitData);
        const totalCapacity = TotalCapacity(unitData);
        if (totalWeight > totalCapacity) return 0;
        const loadout = totalWeight / totalCapacity;
        return loadout <= 0.25 ? 5 :
            loadout <= 0.5 ? 4 :
                loadout <= 0.75 ? 3 : 2;
    }
};

export function MaxTeamSize(unitData) {
    return 3 * Level(MaxSkill(unitData, "LID"));
}

export function CurrentUnit(players, actor) {
    for (const player of players) {
        for (const unit of player.children) {
            if (unit.children?.some(person => person.id === actor.id)) { return unit; }
        }
    }
}

export function UpdateCardProperty(nodes, id, property, value) {
    return nodes.map((node) => {
        if (node.id === id) {
            return { ...node, [property]: value };
        }

        if (node.equipment && node.equipment.some(eq => eq.id === id)) {
            const updatedEquipment = node.equipment.map(item =>
                item.id === id ? { ...item, [property]: value } : item
            );
            return { ...node, equipment: updatedEquipment };
        }

        if (node.vehicle?.equipment && node.vehicle.equipment.some(eq => eq.id === id)) {
            const updatedVehicle = {
                ...node.vehicle,
                equipment: node.vehicle.equipment.map(item =>
                    item.id === id ? { ...item, [property]: value } : item
                )
            };
            return { ...node, vehicle: updatedVehicle };
        }

        if (node.children) {
            return { ...node, children: UpdateCardProperty(node.children, id, property, value) };
        }

        return node;
    });
};