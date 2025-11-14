import { v4 as uuidv4 } from 'uuid';

export class skill {
    constructor(category, id, name) {
        this.category = category;
        this.id = id;
        this.name = name;
    }
}

export class vehicle {
    constructor(id, type, name, armor, equipment) {
        this.id = id;
        this.originalId = id;
        this.type = type;
        this.name = name;
        this.armor = armor;
        this.equipment = equipment;
    }
}

export class player {
    constructor(name, units) {
        this.type = "player";
        this.id = uuidv4();
        this.name = name;
        this.children = units;
    }
}

export class title {
    constructor(name, lid, skillRolls, weaponSkillRolls, maxSkillRoll) {
        this.name = name;
        this.lid = lid;
        this.skillRolls = skillRolls;
        this.weaponSkillRolls = weaponSkillRolls;
        this.maxSkillRoll = maxSkillRoll;
    }
}