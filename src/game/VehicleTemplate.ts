export class VehicleTemplate {
    id: string;
    type: string;
    name: string;
    armor: number;
    equipment: string[];

    constructor(id: string, type: string, name: string, armor: number, equipment: string[]) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.armor = armor;
        this.equipment = equipment;
    }
}