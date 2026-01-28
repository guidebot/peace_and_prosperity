import { v4 as uuidv4 } from 'uuid';
import { IEntity } from './IEntity';
import { IEquipment } from './IEquipment';

export class Entity implements IEntity {
  type: string;
  id: string;
  name: string;
  skills: Record<string, number>;
  isDead: boolean;
  isThermal: boolean;
  isBleeding: boolean;
  isSuppressed: boolean;
  equipment: IEquipment[];
  defaultEquipment: string | null;

  constructor(name: string, skills: Record<string, number>, equipment: IEquipment[]) {
    this.type = "entity";
    this.id = uuidv4();
    this.name = name;
    this.skills = skills;
    this.isDead = false;
    this.isThermal = true;
    this.isBleeding = false;
    this.isSuppressed = false;
    this.equipment = equipment;
    this.defaultEquipment = equipment.length > 0 ? equipment[0].id : null;
  }
}