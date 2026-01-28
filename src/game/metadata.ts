import { v4 as uuidv4 } from 'uuid';
import { Unit } from './Unit';

export const SCALE_PREFIX = 4;

export class skill {
    category: string;
    id: string;
    name: string;

    constructor(category: string, id: string, name: string) {
        this.category = category;
        this.id = id;
        this.name = name;
    }
}

export class player {
    type: string;
    id: string;
    name: string;
    children: Unit[];

    constructor(name: string, units: Unit[]) {
        this.type = "player";
        this.id = uuidv4();
        this.name = name;
        this.children = units;
    }
}

export class title {
    name: string;
    lid: number;
    skillRolls: number;
    weaponSkillRolls: number;
    maxSkillRoll: number;

    constructor(name: string, lid: number, skillRolls: number, weaponSkillRolls: number, maxSkillRoll: number) {
        this.name = name;
        this.lid = lid;
        this.skillRolls = skillRolls;
        this.weaponSkillRolls = weaponSkillRolls;
        this.maxSkillRoll = maxSkillRoll;
    }
}