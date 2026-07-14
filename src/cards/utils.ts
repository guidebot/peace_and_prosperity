import { Entity } from "../game/Entity";
import { Unit } from "../game/Unit";
import { Player } from "../game/Player";
import { Equipment } from "../game/Equipment";
import { Vehicle } from "../game/Vehicle";
import { Level } from "../game/Skill";
import { SortByPropertyWithRandomTies } from "../utils/sorting";

const DEFAULT_EQUIPMENT_SKILLS = ["WPN_rifles", "WPN_sniper", "WPN_mg", "WPN_heavy"] as const;

export function isDefaultEquipmentSkill(skill: string): boolean {
    return DEFAULT_EQUIPMENT_SKILLS.includes(skill as any);
}

export function findDefaultEquipment(equipment: Equipment[]): Equipment | undefined {
    return equipment.find(item => isDefaultEquipmentSkill(item.skill));
}

type NodeWithChildren = {
    id: string;
    children?: NodeWithChildren[];
    equipment?: Equipment[];
    vehicle?: Vehicle | null;
    [key: string]: any;
};

type EntityWithSkills = {
    id: string;
    skills?: Record<string, number>;
    isDead?: boolean;
    isBleeding?: boolean;
    equipment?: Equipment[];
    defaultEquipment?: string | null;
    [key: string]: any;
};

interface PropertyChangeHandler {
    (id: string, property: string, value: any): void;
}

export function PossibleTargets(players: Player[], actor: Entity | Unit): Unit[] {
    const allUnits: Unit[] = [];

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

export function TotalWeight(unitData: Unit): number {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.reduce((total, soldier) => {
        const soldierWeight = soldier.equipment?.reduce((sum, item) => {
            return sum + (item.weight + item.ammo * item.ammoWeight);
        }, 0) || 0;

        return total + soldierWeight;
    }, 0);
};

export function TotalCapacity(unitData: Unit): number {
    if (!unitData.children || unitData.children.length === 0) return 0;

    const totalFpLevel = unitData.children.filter(s => !s.isDead && !s.isBleeding).reduce((total, soldier) => {
        const fpPoints = soldier.skills?.["END"] ?? 0;
        const level = Level(fpPoints);

        return total + level;
    }, 0);

    return totalFpLevel * 120;
};

type MovementSpeedResult = { plain: number; road: number };

export function MovementSpeed(unitData: Unit): MovementSpeedResult {
    if (!unitData.children || unitData.children.length === 0) return { plain: 2, road: 2 };

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
                return { plain: 2, road: 2 };
        }
    } else {
        const totalWeight = TotalWeight(unitData);
        const totalCapacity = TotalCapacity(unitData);
        if (totalWeight > totalCapacity) return { plain: 0, road: 0 };
        const loadout = totalWeight / totalCapacity;
        const speed = loadout <= 0.25 ? 5 :
            loadout <= 0.5 ? 4 :
                loadout <= 0.75 ? 3 : 2;
        return { plain: speed, road: speed };
    }
};

export function CurrentUnit(players: Player[], actor: Entity): Unit | undefined {
    for (const player of players) {
        for (const unit of player.children) {
            if (unit.children?.some(person => person.id === actor.id)) { return unit; }
        }
    }
}

export function UpdateCardProperty(nodes: NodeWithChildren[], id: string, property: string, value: any): NodeWithChildren[] {
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

export function RemoveEquipmentFromPerson(person: EntityWithSkills, equipment: Equipment, onPropertyChange: PropertyChangeHandler): void {
    const newEquipment = person.equipment?.filter(eq => eq.id !== equipment.id) || [];
    if (newEquipment.length === 0) {
        onPropertyChange(person.id, "defaultEquipment", null);
    }
    else if (equipment.id === person.defaultEquipment) {
        onPropertyChange(person.id, "defaultEquipment", findDefaultEquipment(newEquipment)?.id);
    }

    onPropertyChange(person.id, "equipment", newEquipment);
}

export function UpdateSuppressionStatusForPersons(persons: EntityWithSkills[], stress: number, onPropertyChange: PropertyChangeHandler): void {
    const alivePersons = persons?.filter(p => !p.isDead && !p.isBleeding) || [];

    const sortedPersonsByLeadership = SortByPropertyWithRandomTies(alivePersons, (person) => Math.max(person.skills?.["LOG"] || 0, person.skills?.["IFL"] || 0));

    sortedPersonsByLeadership.forEach((person, index) => {
        onPropertyChange(person.id, "isSuppressed", index < stress);
    });
}
