import { v4 as uuidv4 } from 'uuid';
import { IUnit } from './IUnit';
import { IEntity } from './IEntity';
import { IVehicle } from './IVehicle';

export class Unit implements IUnit {
  isActive: boolean;
  type: string;
  id: string;
  name: string;
  stress: number;
  fatigue: number;
  children: IEntity[];
  vehicle: IVehicle | null;
  hasMoved: boolean;
  isDeployed: boolean;
  isMarked: boolean;
  isHidden: boolean;
  correction: number;
  position: { x: number; y: number } | null;
  alertness: number;

  constructor(name: string, soldiers: IEntity[]) {
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