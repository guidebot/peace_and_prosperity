import { IEquipment } from './IEquipment';

export interface IVehicle {
  id: string;
  type: string;
  name: string;
  armor: number;
  equipment: IEquipment[];
}