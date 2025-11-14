import { Level, MinSkill } from '../game/skills';
import { CurrentUnit } from '../cards/utils';
import { VisibilityConditionsCatalog } from '../game/conditions';

function getModifiedVisibilityData(equipment, activeConditions) {
    const values = activeConditions.map(conditionId => {
        const condition = VisibilityConditionsCatalog[conditionId];
        const optic = equipment?.optic?.[conditionId];
        return {
            visibility: condition.value + (optic?.mod ?? 0),
            maxRange: optic?.maxRange ?? condition.maxRange
        };
    });

    const minVisibility = Math.min(...values.map(v => v.visibility));
    const minMaxRange = Math.min(...values.map(v => v.maxRange));

    return {
        visibility: minVisibility,
        maxRange: minMaxRange
    };
}

function getBestActorForUnit(unit, activeConditions) {
    const candidates = [];

    const evaluatePerson = (person) => {
        const baseSkillLevel = Level(person.skills["MSK"]) || 0;
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
                const visData = getModifiedVisibilityData(eq, activeConditions);
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

    const bestActor = candidates.reduce((best, curr) =>
        curr.totalScore > best.totalScore ? curr : best
    );

    return bestActor;
}

export function ApplyWatchEffect(players, rolls, result, actor, target, activeConditions) {
    const effects = CalculateWatchEffect(players, rolls, result, actor, target, activeConditions);
    return effects;
};

export function CalculateWatchEffect(players, rolls, actors, target, activeConditions) {
    const actorData = actors[0].actor.type === "unit"
        ? getBestActorForUnit(actors[0].actor, activeConditions)
        : actors[0];

    const actor = actorData.actor;
    const equipment = actorData.equipment;

    const visData = getModifiedVisibilityData(equipment, activeConditions);

    const actorWatchSkillLevel = Level(actor.skills["MSK"]) || 0;
    const actorUavSkillLevel = Level(actor.skills["WPN_uav"]) || 0;

    const minTargetSkill = MinSkill(target, "MSK");
    const targetSkillLevel = Level(minTargetSkill);

    const infantryMod = rolls[0].roll + visData.visibility + actorWatchSkillLevel - 2 * targetSkillLevel - (rolls[0].selectedDef > 0 ? 5 : 0);

    const infantryWatchResult = equipment?.skill === "WPN_uav"
        ? infantryMod + actorUavSkillLevel
        : infantryMod + actorWatchSkillLevel;

    const vehicleMod = rolls[0].roll + visData.visibility + actorWatchSkillLevel + 6;

    const vehicleWatchResult = equipment?.skill === "WPN_uav"
        ? vehicleMod + actorUavSkillLevel
        : vehicleMod + actorWatchSkillLevel;

    const distance = target.vehicle
        ? vehicleWatchResult >= 42 && visData.maxRange * 2 >= 640 && (equipment?.minRange ?? 0) < 640 ? "контакт на расстоянии до 6400 м" :
            vehicleWatchResult >= 37 && visData.maxRange * 2 >= 320 && (equipment?.minRange ?? 0) < 320 ? "контакт на расстоянии до 3200 м" :
                vehicleWatchResult >= 32 && visData.maxRange * 2 >= 160 && (equipment?.minRange ?? 0) < 160 ? "контакт на расстоянии до 1600 м" :
                    vehicleWatchResult >= 27 && visData.maxRange * 2 >= 80 && (equipment?.minRange ?? 0) < 80 ? "контакт на расстоянии до 800 м" :
                        vehicleWatchResult >= 22 && visData.maxRange * 2 >= 40 && (equipment?.minRange ?? 0) < 40 ? "контакт на расстоянии до 400 м" :
                            vehicleWatchResult >= 17 && visData.maxRange * 2 >= 20 && (equipment?.minRange ?? 0) < 20 ? "контакт на расстоянии до 200 м" : "контакт на расстоянии до 60 м"
        : infantryWatchResult >= 42 && visData.maxRange >= 320 && (equipment?.minRange ?? 0) < 320 ? "контакт на расстоянии до 3200 м" :
            infantryWatchResult >= 37 && visData.maxRange >= 160 && (equipment?.minRange ?? 0) < 160 ? "контакт на расстоянии до 1600 м" :
                infantryWatchResult >= 32 && visData.maxRange >= 80 && (equipment?.minRange ?? 0) < 80 ? "контакт на расстоянии до 800 м" :
                    infantryWatchResult >= 27 && visData.maxRange >= 40 && (equipment?.minRange ?? 0) < 40 ? "контакт на расстоянии до 400 м" :
                        infantryWatchResult >= 22 && visData.maxRange >= 20 && (equipment?.minRange ?? 0) < 20 ? "контакт на расстоянии до 200 м" :
                            infantryWatchResult >= 17 && visData.maxRange >= 10 && (equipment?.minRange ?? 0) < 10 ? "контакт на расстоянии до 100 м" : "контакт на расстоянии до 30 м";

    const mineResult = equipment?.skill !== "WPN_uav" && (equipment?.minRange ?? 0) < 1 && infantryWatchResult >= 22 ? " (мины обнаружены)" : "";

    const message = `Наблюдение ${actor.name} за ${target.name}${equipment ? " (" + equipment.name + ")" : ""}: d20=${rolls[0].roll}, результат ${infantryWatchResult}, ${distance}${mineResult}.`;

    return [{ value: infantryWatchResult, message: message }];
}

export function CanWatchEquipment(players, actor, equipment) {
    return (Level(actor.skills[equipment.skill] || 0) > 0 || equipment.skill === "MSK")
        && ((equipment.mustBeDeployed && CurrentUnit(players, actor).isDeployed) || !equipment.mustBeDeployed)
        && equipment.optic;
}