export interface IEquipment {
  id: string;
  originalId: string;
  type: string;
  counter: number;
  skill: string;
  name: string;
  weight: number;
  ammo: number;
  ammoWeight: number;
  minRange: number;
  bestRange: number;
  effectiveRange: number;
  maxRange: number;
  ap: number;
  he: number;
  deployBonus: number;
  mustBeDeployed: boolean;
  dispersion: number;
  optic?: boolean;
  defaultCounter: number;
}