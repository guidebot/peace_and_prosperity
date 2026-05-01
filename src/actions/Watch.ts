import { Level, MinSkill } from '../game/Skill';
import { CurrentUnit } from '../cards/utils';
import { VisibilityConditionsCatalog, ModifiedVisibilityData, VisibilityCondition } from '../game/conditions';
import { SCALE_PREFIX } from '../game/Constants';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';
import { Unit } from '../game/Unit';
import { Player } from '../game/Player';

export interface DetectionThreshold {
    threshold: number;
    detectionDistance: number;
}

export interface WatchCandidate {
    actor: Entity;
    equipment: Equipment | null;
    visibilityValue: number;
    totalScore: number;
}

export interface WatchEffect {
    value: number;
    message: string;
}

export interface RollData {
    roll: number;
    selectedDef: number;
}

const DETECTION_THRESHOLDS: DetectionThreshold[] = [
    { threshold: 42, detectionDistance: 320 },
    { threshold: 37, detectionDistance: 160 },
    { threshold: 32, detectionDistance: 80 },
    { threshold: 27, detectionDistance: 40 },
    { threshold: 22, detectionDistance: 20 },
    { threshold: 17, detectionDistance: 10 },
    { threshold: 10, detectionDistance: 3 }
];

const VEHICLE_AUTODETECT_DISTANCE = 3;

function calculateDetectionRoll(
    roll: number,
    visibilityModifier: number,
    observerStealth: number,
    observerUAV: number,
    targetStealth: number,
    hasCover: boolean,
    isVehicle: boolean,
    isUAV: boolean
): number {
    const observerBonus = isUAV ? (observerUAV + observerStealth) : (2 * observerStealth);
    if (isVehicle) {
        return roll + visibilityModifier + observerBonus;
    }
    return roll + visibilityModifier + observerBonus - 2 * targetStealth - (hasCover ? 5 : 0);
}

function getDistanceByRoll(
    modifiedRoll: number,
    isVehicle: boolean,
    maxVisibilityRange: number
): number | null {
    for (const { threshold, detectionDistance } of DETECTION_THRESHOLDS) {
        const distance = isVehicle ? detectionDistance * 2 : detectionDistance;
        const effectiveMaxRange = isVehicle ? maxVisibilityRange * 2 : maxVisibilityRange;
        if (modifiedRoll >= threshold) {
            return Math.min(effectiveMaxRange, distance);
        }
    }

    if (isVehicle) {
        return Math.min(maxVisibilityRange * 2, VEHICLE_AUTODETECT_DISTANCE);
    }

    return null;
}

export function BestActorForUnit(unit: Unit, activeConditions: string[]): WatchCandidate | null {
    const candidates: WatchCandidate[] = [];

    const evaluatePerson = (person: Entity) => {
        const baseSkillLevel = Level(person.skills["STE"]) || 0;
        const baseVisibility = Math.min(...activeConditions.map(c => VisibilityConditionsCatalog[c]?.value ?? 0));
        candidates.push({
            actor: person,
            equipment: null,
            visibilityValue: baseVisibility,
            totalScore: baseVisibility + 2 * baseSkillLevel
        });

        const equipmentList = Array.isArray(person.equipment) ? person.equipment : [];
        for (const eq of equipmentList.filter(eq => eq.optic)) {
            if (eq?.optic) {
                const visData = ModifiedVisibilityData(eq, activeConditions);
                const score = visData.visibility + 2 * baseSkillLevel;
                candidates.push({
                    actor: person,
                    equipment: eq,
                    visibilityValue: visData.visibility,
                    totalScore: score
                });
            }
        }
    };

    if (Array.isArray(unit.children)) {
        for (const child of unit.children) {
            evaluatePerson(child);
        }
    }

    if (candidates.length === 0) return null;

    const bestActor = candidates.reduce((best, curr) =>
        curr.totalScore > best.totalScore ? curr : best
    );

    return bestActor;
}

export function ApplyWatchEffect(
    players: Player[],
    rolls: RollData[],
    result: any,
    actor: WatchCandidate,
    target: Entity | Unit,
    activeConditions: string[]
): WatchEffect[] {
    const effects = CalculateWatchEffect(players, rolls, [actor], target as Unit, activeConditions);
    return effects;
}

export function CalculateVisibilityDistance(
    observerUnit: Unit,
    targetUnit: Unit,
    activeConditions: string[],
    roll: number,
    isInDef: boolean,
    forceUAV = false
): number | null {
    const observerData = BestActorForUnit(observerUnit, activeConditions);

    if (!observerData) {
        return null;
    }

    const visData = ModifiedVisibilityData(observerData.equipment, activeConditions);

    const observerStealth = Level(observerData.actor.skills["STE"]) || 0;
    const observerUAV = Level(observerData.actor.skills["TECH_uav"]) || 0;

    const minTargetStealth = MinSkill(targetUnit, "STE");
    const targetStealthLevel = Level(minTargetStealth);

    const isUAV = forceUAV || (observerData.equipment?.skill === "TECH_uav");
    const isVehicle = !!targetUnit.vehicle;

    const modifiedRoll = calculateDetectionRoll(roll, visData.visibility, observerStealth, observerUAV, targetStealthLevel, isInDef, isVehicle, isUAV);
    const distance = getDistanceByRoll(modifiedRoll, isVehicle, visData.maxRange);

    return distance !== null
        ? (distance + SCALE_PREFIX) * 3
        : null;
}

export function CalculateWatchEffect(
    players: Player[],
    rolls: RollData[],
    actors: (WatchCandidate | { actor: Entity | Unit; equipment: Equipment | null })[],
    target: Unit,
    activeConditions: string[]
): WatchEffect[] {
    const firstActor = actors[0];
    const actorData = 'actor' in firstActor && firstActor.actor.type === "unit" && 'children' in firstActor.actor
        ? BestActorForUnit(firstActor.actor as Unit, activeConditions)
        : firstActor as WatchCandidate;

    if (!actorData) {
        return [];
    }

    const actor = actorData.actor;
    const equipment = actorData.equipment;

    const visData = ModifiedVisibilityData(equipment, activeConditions);

    const actorWatchSkillLevel = Level(actor.skills["STE"]) || 0;
    const actorUavSkillLevel = Level(actor.skills["TECH_uav"]) || 0;

    const minTargetStealth = MinSkill(target, "STE");
    const targetStealthLevel = Level(minTargetStealth);

    const isUAV = equipment?.skill === "TECH_uav";
    const isVehicle = !!target.vehicle;
    const hasCover = rolls[0].selectedDef > 0;

    const modifiedRoll = calculateDetectionRoll(rolls[0].roll, visData.visibility, actorWatchSkillLevel, actorUavSkillLevel, targetStealthLevel, hasCover, isVehicle, isUAV);
    const detectedDistance = getDistanceByRoll(modifiedRoll, isVehicle, visData.maxRange);

    const modifiedRollForMineDetection = calculateDetectionRoll(rolls[0].roll, visData.visibility, actorWatchSkillLevel, actorUavSkillLevel, 0, false, isVehicle, isUAV);
    const mineDetected = !isUAV && (equipment?.minRange ?? 0) < 1 && modifiedRollForMineDetection >= 22;

    const distance = detectedDistance !== null
        ? `контакт на расстоянии до ${detectedDistance + SCALE_PREFIX} см`
        : `нет контакта`;

    const mineResult = mineDetected ? " (мины обнаружены)" : "";

    const message = `${actor.name} наблюдает за ${target.name} ${equipment ? " используя " + equipment.name : " не используя снаряжение"}: d20=${rolls[0].roll}, результат ${modifiedRoll}, ${distance}${mineResult}.`;

    return [{ value: modifiedRoll, message }];
}

export function CanWatchEquipment(players: Player[], actor: Entity, equipment: Equipment): boolean {
    const currentUnit = CurrentUnit(players, actor);
    return (Level(actor.skills[equipment.skill] || 0) > 0 || equipment.skill === "STE")
        && ((equipment.mustBeDeployed && currentUnit?.isDeployed) || !equipment.mustBeDeployed)
        && !!equipment.optic;
}
