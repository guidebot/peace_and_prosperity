import { v4 as uuidv4 } from 'uuid';
import { Entity } from './Entity';
import { Vehicle } from './Vehicle';

export class Unit {
  isActive: boolean;
  type: string;
  id: string;
  name: string;
  stress: number;
  fatigue: number;
  children: Entity[];
  vehicle: Vehicle | null;
  hasMoved: boolean;
  isDeployed: boolean;
  isMarked: boolean;
  isHidden: boolean;
  correction: number;
  position: { x: number; y: number } | null;
  alertness: number;
  checkpoints: { x: number; y: number }[];

  constructor(name: string, soldiers: Entity[]) {
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
    this.checkpoints = [];
  }
}