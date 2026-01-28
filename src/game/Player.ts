import { v4 as uuidv4 } from 'uuid';
import { Unit } from './Unit';

export class Player {
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