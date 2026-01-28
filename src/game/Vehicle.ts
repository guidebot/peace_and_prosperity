import { v4 as uuidv4 } from 'uuid';
import { IVehicle } from './IVehicle';
import { IEquipment } from './IEquipment';

export class Vehicle implements IVehicle {
  id: string;
  type: string;
  name: string;
  armor: number;
  equipment: IEquipment[];

  constructor(type: string, name: string, armor: number, equipment: IEquipment[]) {
    this.id = uuidv4();
    this.type = type;
    this.name = name;
    this.armor = armor;
    this.equipment = equipment;
  }
}