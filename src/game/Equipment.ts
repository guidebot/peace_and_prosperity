import { v4 as uuidv4 } from 'uuid';
import { Vehicle } from './Vehicle';
import { VehicleTemplate } from './VehicleTemplate';
import infantryEquipment from './infantry_equipment.json';
import vehicleEquipment from './vehicle_equipment.json';

export class Equipment {
    id: string;
    originalId: string;
    type: string;
    counter: number;
    skill: string;
    name: string;
    weight: number;
    ammo: number;
    ammoWeight: number;
    minRange: number;
    bestRange: number;
    effectiveRange: number;
    maxRange: number;
    ap: number;
    he: number;
    deployBonus: number;
    mustBeDeployed: boolean;
    dispersion: number;
    optic?: boolean;
    defaultCounter: number;
    armorMod: number;

    constructor(
        id: string,
        skill: string,
        name: string,
        weight: number,
        ammo: number,
        ammoWeight: number,
        minRange: number,
        bestRange: number,
        effectiveRange: number,
        maxRange: number,
        ap: number,
        he: number,
        deployBonus: number,
        mustBeDeployed: boolean,
        dispersion: number,
        optic?: boolean,
        defaultCounter?: number,
        armorMod?: number
    ) {
        this.id = id;
        this.originalId = id;
        this.type = "equipment";
        this.counter = 0;
        this.skill = skill;
        this.name = name;
        this.weight = weight;
        this.ammo = ammo;
        this.ammoWeight = ammoWeight;
        this.minRange = minRange;
        this.bestRange = bestRange;
        this.effectiveRange = effectiveRange;
        this.maxRange = maxRange;
        this.ap = ap;
        this.he = he;
        this.deployBonus = deployBonus;
        this.mustBeDeployed = mustBeDeployed;
        this.dispersion = dispersion;
        this.optic = optic;
        this.defaultCounter = defaultCounter ?? 0;
        this.armorMod = armorMod ?? 0;
    }
}

export const InfantryEquipment = infantryEquipment.map((item: any) =>
    new Equipment(
        item.id,
        item.skill,
        item.name,
        item.weight,
        item.ammo,
        item.ammoWeight,
        item.minRange,
        item.bestRange,
        item.effectiveRange,
        item.maxRange,
        item.ap,
        item.he,
        item.deployBonus,
        item.mustBeDeployed,
        item.dispersion,
        item.optic,
        item.defaultCounter,
        item.armorMod
    ));

export const VehicleEquipment = vehicleEquipment.map((item: any) =>
    new Equipment(
        item.id,
        item.skill,
        item.name,
        item.weight,
        item.ammo,
        item.ammoWeight,
        item.minRange,
        item.bestRange,
        item.effectiveRange,
        item.maxRange,
        item.ap,
        item.he,
        item.deployBonus,
        item.mustBeDeployed,
        item.dispersion,
        item.optic,
        undefined,
        item.armorMod
    )
);

export const InfantryEquipmentCatalog: Record<string, Equipment> = InfantryEquipment.reduce((acc: Record<string, Equipment>, item: Equipment) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateInfantryEquipment(ids: (string | { id: string; count?: number })[]): Equipment[] {
    const result: Equipment[] = [];
    for (const item of ids) {
        const equipmentId = typeof item === 'string' ? item : item.id;
        const count = typeof item === 'string' ? 1 : (item.count ?? 1);
        
        const original = InfantryEquipmentCatalog[equipmentId];
        if (original) {
            result.push({ ...original, id: uuidv4(), ammo: original.ammo * count });
        }
    }
    return result;
}

export function RangeKey(equipment: Equipment): string {
    const { bestRange, effectiveRange, maxRange } = equipment;
    return `${bestRange}_${effectiveRange}_${maxRange}`;
}

export const VehicleEquipmentCatalog: Record<string, Equipment> = VehicleEquipment.reduce((acc: Record<string, Equipment>, item: Equipment) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateVehicleEquipment(ids: string[]): Equipment[] {
    return ids.map(id => {
        const original = VehicleEquipmentCatalog[id];
        return { ...original, id: uuidv4() };
    });
}

export const Vehicles = [
    new VehicleTemplate("truck", "truck", "Автомобиль", 0, []),
    new VehicleTemplate("fuchs", "wheel", "TPz Fuchs", 2, ["mmg"]),
    new VehicleTemplate("btr80", "wheel", "БТР 80", 2, ["hmg"]),
    new VehicleTemplate("btr82", "wheel", "БТР 82 А", 2, ["ac30"]),
    new VehicleTemplate("wifv", "track", "Marder 1A3", 4, ["ac20", "milan2"]),
    new VehicleTemplate("tank1", "track", "Т-62", 5, ["gun", "mmg"]),
    new VehicleTemplate("tank2", "track", "Т-72", 6, ["gun", "mmg"]),
    new VehicleTemplate("2a5", "track", "Leopard 2A5", 7, ["gun_thermal", "mmg"]),
    new VehicleTemplate("t90", "track", "Т-90", 7, ["gun_thermal", "mmg"]),
    new VehicleTemplate("m1a1", "track", "Abrams M1A1", 7, ["gun_thermal", "mmg"])
];

export const VehiclesCatalog: Record<string, VehicleTemplate> = Vehicles.reduce((acc: Record<string, VehicleTemplate>, item: VehicleTemplate) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateVehicle(ids: string[]) {
    return ids.map(id => {
        const original = VehiclesCatalog[id];
        return new Vehicle(
            original.type,
            original.name,
            original.armor,
            CreateVehicleEquipment(original.equipment)
        );
    });
}