import { v4 as uuidv4 } from 'uuid';
import { vehicle } from "./metadata"
import infantryEquipment from './infantry_equipment.json';
import vehicleEquipment from './vehicle_equipment.json';

export class equipment {
    constructor(id, skill, name, weight, ammo, ammoWeight, minRange, bestRange, effectiveRange, maxRange, ap, he, deployBonus, mustBeDeployed, dispersion, optic, defaultCounter) {
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
    }
}

export const InfantryEquipment = infantryEquipment.map(item =>
    new equipment(
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
        item.defaultCounter
    ));

export const VehicleEquipment = vehicleEquipment.map(item =>
    new equipment(
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
        item.optic
    )
);

export const InfantryEquipmentCatalog = InfantryEquipment.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateInfantryEquipment(ids) {
    return ids.map(id => {
        const original = InfantryEquipmentCatalog[id];
        return { ...original, id: uuidv4() };
    });
}

export function RangeKey(equipment) {
    const { bestRange, effectiveRange, maxRange } = equipment;
    if (bestRange === effectiveRange && effectiveRange === maxRange) {
        return `fixed_${maxRange}`;
    }
    return `${bestRange}_${effectiveRange}_${maxRange}`;
}

export const VehicleEquipmentCatalog = VehicleEquipment.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateVehicleEquipment(ids) {
    return ids.map(id => {
        const original = VehicleEquipmentCatalog[id];
        return { ...original, id: uuidv4() };
    });
}

export const Vehicles = [
    new vehicle("truck", "truck", "Автомобиль", 0, []),
    new vehicle("fuchs", "wheel", "TPz Fuchs", 2, ["mmg"]),
    new vehicle("btr80", "wheel", "БТР 80", 2, ["hmg"]),
    new vehicle("btr82", "wheel", "БТР 82 А", 2, ["ac30"]),
    new vehicle("wifv", "track", "Marder 1A3", 4, ["ac20", "milan2"]),
    new vehicle("tank1", "track", "Т-62", 5, ["gun", "mmg"]),
    new vehicle("tank2", "track", "Т-72", 6, ["gun", "mmg"]),
    new vehicle("2a5", "track", "Leopard 2A5", 7, ["gun_thermal", "mmg"]),
    new vehicle("t90", "track", "Т-90", 7, ["gun_thermal", "mmg"]),
    new vehicle("m1a1", "track", "Abrams M1A1", 7, ["gun_thermal", "mmg"])
]

export const VehiclesCatalog = Vehicles.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

export function CreateVehicle(ids) {
    return ids.map(id => {
        const original = VehiclesCatalog[id];
        return {
            ...original,
            id: uuidv4(),
            equipment: CreateVehicleEquipment(original.equipment)
        };
    });
}