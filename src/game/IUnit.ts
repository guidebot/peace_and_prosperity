import { IEntity } from './IEntity';
import { IVehicle } from './IVehicle';

export interface IUnit {
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
}