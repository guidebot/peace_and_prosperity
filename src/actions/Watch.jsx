import { Level, MinSkill } from '../game/Skill';
import { CurrentUnit } from '../cards/utils';
import { VisibilityConditionsCatalog, ModifiedVisibilityData } from '../game/conditions';
import { SCALE_PREFIX } from '../game/Constants';

export function BestActorForUnit(unit, activeConditions) {
    const candidates = [];

    const evaluatePerson = (person) => {
        const baseSkillLevel = Level(person.skills["STE"]) || 0;
        const baseVisibility = Math.min(...activeConditions.map(c => VisibilityConditionsCatalog[c].value));
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

export function ApplyWatchEffect(players, rolls, result, actor, target, activeConditions) {
    const effects = CalculateWatchEffect(players, rolls, result, actor, target, activeConditions);
    return effects;
};

export function CalculateVisibilityDistance(observerUnit, targetUnit, activeConditions, roll, isInDef, forceUAV = false) {
    const observerData = BestActorForUnit(observerUnit, activeConditions);

    if (!observerData) {
        return SCALE_PREFIX;
    }

    const visData = ModifiedVisibilityData(observerData.equipment, activeConditions);

    const observerStealth = Level(observerData.actor.skills["STE"]) || 0;
    const observerUAV = Level(observerData.actor.skills["TECH_uav"]) || 0;

    const minTargetStealth = MinSkill(targetUnit, "STE");
    const targetStealthLevel = Level(minTargetStealth) || 0;

    const isUAV = forceUAV || (observerData.equipment?.skill === "TECH_uav");
    const baseMod = isUAV ? (observerUAV + observerStealth) : (2 * observerStealth);

    const defMod = isInDef ? 5 : 0;

    const infantryResult = roll + visData.visibility + baseMod - 2 * targetStealthLevel - defMod;
    const vehicleResult = roll + visData.visibility + baseMod + 6;

    const isVehicle = targetUnit.vehicle;

    let maxDistance = SCALE_PREFIX;

    if (isVehicle) {
        if (vehicleResult >= 42 && visData.maxRange * 2 >= 640 + SCALE_PREFIX) maxDistance = 640 + SCALE_PREFIX;
        else if (vehicleResult >= 37 && visData.maxRange * 2 >= 320 + SCALE_PREFIX) maxDistance = 320 + SCALE_PREFIX;
        else if (vehicleResult >= 32 && visData.maxRange * 2 >= 160 + SCALE_PREFIX) maxDistance = 160 + SCALE_PREFIX;
        else if (vehicleResult >= 27 && visData.maxRange * 2 >= 80 + SCALE_PREFIX) maxDistance = 80 + SCALE_PREFIX;
        else if (vehicleResult >= 22 && visData.maxRange * 2 >= 40 + SCALE_PREFIX) maxDistance = 40 + SCALE_PREFIX;
        else if (vehicleResult >= 17 && visData.maxRange * 2 >= 20 + SCALE_PREFIX) maxDistance = 20 + SCALE_PREFIX;
    } else {
        if (infantryResult >= 42 && visData.maxRange >= 320 + SCALE_PREFIX) maxDistance = 320 + SCALE_PREFIX;
        else if (infantryResult >= 37 && visData.maxRange >= 160 + SCALE_PREFIX) maxDistance = 160 + SCALE_PREFIX;
        else if (infantryResult >= 32 && visData.maxRange >= 80 + SCALE_PREFIX) maxDistance = 80 + SCALE_PREFIX;
        else if (infantryResult >= 27 && visData.maxRange >= 40 + SCALE_PREFIX) maxDistance = 40 + SCALE_PREFIX;
        else if (infantryResult >= 22 && visData.maxRange >= 20 + SCALE_PREFIX) maxDistance = 20 + SCALE_PREFIX;
        else if (infantryResult >= 17 && visData.maxRange >= 10 + SCALE_PREFIX) maxDistance = 10 + SCALE_PREFIX;
    }

    return maxDistance * 3;
}

export function CalculateWatchEffect(players, rolls, actors, target, activeConditions) {
    const actorData = actors[0].actor.type === "unit"
        ? BestActorForUnit(actors[0].actor, activeConditions)
        : actors[0];

    const actor = actorData.actor;
    const equipment = actorData.equipment;

    const visData = ModifiedVisibilityData(equipment, activeConditions);

    const actorWatchSkillLevel = Level(actor.skills["STE"]) || 0;
    const actorUavSkillLevel = Level(actor.skills["TECH_uav"]) || 0;

    const minTargetStealth = MinSkill(target, "STE");
    const targetStealthLevel = Level(minTargetStealth);

    const infantryMod = rolls[0].roll + visData.visibility + actorWatchSkillLevel - 2 * targetStealthLevel - (rolls[0].selectedDef > 0 ? 5 : 0);

    const infantryWatchResult = equipment?.skill === "TECH_uav"
        ? infantryMod + actorUavSkillLevel
        : infantryMod + actorWatchSkillLevel;

    const vehicleMod = rolls[0].roll + visData.visibility + actorWatchSkillLevel + 6;

    const vehicleWatchResult = equipment?.skill === "TECH_uav"
        ? vehicleMod + actorUavSkillLevel
        : vehicleMod + actorWatchSkillLevel;

    const distance = target.vehicle
        ? vehicleWatchResult >= 42 && visData.maxRange * 2 >= 640 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 640 + SCALE_PREFIX ? `контакт на расстоянии до ${640 + SCALE_PREFIX} см` :
            vehicleWatchResult >= 37 && visData.maxRange * 2 >= 320 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 320 + SCALE_PREFIX ? `контакт на расстоянии до ${320 + SCALE_PREFIX} см` :
                vehicleWatchResult >= 32 && visData.maxRange * 2 >= 160 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 160 + SCALE_PREFIX ? `контакт на расстоянии до ${160 + SCALE_PREFIX} см` :
                    vehicleWatchResult >= 27 && visData.maxRange * 2 >= 80 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 80 + SCALE_PREFIX ? `контакт на расстоянии до ${80 + SCALE_PREFIX} см` :
                        vehicleWatchResult >= 22 && visData.maxRange * 2 >= 40 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 40 + SCALE_PREFIX ? `контакт на расстоянии до ${40 + SCALE_PREFIX} см` :
                            vehicleWatchResult >= 17 && visData.maxRange * 2 >= 20 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 20 + SCALE_PREFIX ? `контакт на расстоянии до ${20 + SCALE_PREFIX} см` :
                                vehicleWatchResult >= 10 && visData.maxRange * 2 >= 0 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 0 + SCALE_PREFIX ? `контакт на расстоянии до ${0 + SCALE_PREFIX} см` :
                                    `нет контакта`
        : infantryWatchResult >= 42 && visData.maxRange >= 320 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 320 + SCALE_PREFIX ? `контакт на расстоянии до ${320 + SCALE_PREFIX} см` :
            infantryWatchResult >= 37 && visData.maxRange >= 160 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 160 + SCALE_PREFIX ? `контакт на расстоянии до ${160 + SCALE_PREFIX} см` :
                infantryWatchResult >= 32 && visData.maxRange >= 80 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 80 + SCALE_PREFIX ? `контакт на расстоянии до ${80 + SCALE_PREFIX} см` :
                    infantryWatchResult >= 27 && visData.maxRange >= 40 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 40 + SCALE_PREFIX ? `контакт на расстоянии до ${40 + SCALE_PREFIX} см` :
                        infantryWatchResult >= 22 && visData.maxRange >= 20 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 20 + SCALE_PREFIX ? `контакт на расстоянии до ${20 + SCALE_PREFIX} см` :
                            infantryWatchResult >= 17 && visData.maxRange >= 10 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 10 + SCALE_PREFIX ? `контакт на расстоянии до ${10 + SCALE_PREFIX} см` :
                                infantryWatchResult >= 10 && visData.maxRange >= 0 + SCALE_PREFIX && (equipment?.minRange ?? 0) < 0 + SCALE_PREFIX ? `контакт на расстоянии до ${0 + SCALE_PREFIX} см` :
                                    `нет контакта`;

    const mineResult = equipment?.skill !== "TECH_uav" && (equipment?.minRange ?? 0) < 1 && infantryWatchResult >= 22 ? " (мины обнаружены)" : "";

    const message = `Наблюдение ${actor.name} за ${target.name}${equipment ? " (" + equipment.name + ")" : ""}: d20=${rolls[0].roll}, результат ${infantryWatchResult}, ${distance}${mineResult}.`;

    return [{ value: infantryWatchResult, message: message }];
}

export function CanWatchEquipment(players, actor, equipment) {
    return (Level(actor.skills[equipment.skill] || 0) > 0 || equipment.skill === "STE")
        && ((equipment.mustBeDeployed && CurrentUnit(players, actor).isDeployed) || !equipment.mustBeDeployed)
        && equipment.optic;
}