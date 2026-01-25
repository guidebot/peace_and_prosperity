import { v4 as uuidv4 } from 'uuid';

export class unit {
    constructor(name, soldiers) {
        this.isActive = true;
        this.type = "unit";
        this.id = uuidv4();
        this.name = name;
        this.stress = 0.0;
        this.fatigue = 0;
        this.children = soldiers;
        this.vehicle = null;
        this.hasMoved = false;
        this.isDeployed = false;
        this.isMarked = false;
        this.isHidden = true;
        this.correction = 0;
        this.position = null;
        this.alertness = 1;
    }
}