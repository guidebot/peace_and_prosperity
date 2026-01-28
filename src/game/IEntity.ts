import { IEquipment } from './IEquipment';

export interface IEntity {
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
}