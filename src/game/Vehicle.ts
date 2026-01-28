import { v4 as uuidv4 } from 'uuid';
import { Equipment } from './Equipment';

export class Vehicle {
  id: string;
  type: string;
  name: string;
  armor: number;
  equipment: Equipment[];

  constructor(type: string, name: string, armor: number, equipment: Equipment[]) {
    this.id = uuidv4();
    this.type = type;
    this.name = name;
    this.armor = armor;
    this.equipment = equipment;
  }
}