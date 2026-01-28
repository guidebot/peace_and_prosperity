export class VehicleTemplate {
    id: string;
    originalId: string;
    type: string;
    name: string;
    armor: number;
    equipment: string[];

    constructor(id: string, type: string, name: string, armor: number, equipment: string[]) {
        this.id = id;
        this.originalId = id;
        this.type = type;
        this.name = name;
        this.armor = armor;
        this.equipment = equipment;
    }
}