import { v4 as uuidv4 } from 'uuid';

export class entity {
    constructor(name, skills, equipment) {
        this.type = "entity";
        this.id = uuidv4();
        this.name = name;
        this.skills = skills;
        this.isDead = false;
        this.isThermal = true;
        this.equipment = equipment;
        this.defaultEquipment = equipment.length > 0 ? equipment[0].id : null;
    }
}