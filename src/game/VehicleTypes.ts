export type VehicleType = {
    id: string;
    name: string;
    threshold: number;
};

export const vehicleTypes: VehicleType[] = [
    { id: 'car', name: 'Автомобиль', threshold: 25 },
    { id: 'wheel', name: 'Колёсная БМ', threshold: 18 },
    { id: 'track', name: 'Гусеничная БМ', threshold: 10 },
    { id: 'helicopter', name: 'Вертолёт', threshold: 15 },
    { id: 'plane', name: 'Самолёт', threshold: 13 }
];

export function getVehicleTypeById(id: string): VehicleType | undefined {
    return vehicleTypes.find(vt => vt.id === id);
}

export function getVehicleThreshold(vehicleTypeId: string): number {
    const vt = getVehicleTypeById(vehicleTypeId);
    return vt ? vt.threshold : 0;
}