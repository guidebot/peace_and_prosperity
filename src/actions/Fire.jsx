import { Level, MinSkill, AverageArmorMod, EffectiveTP } from "../game/Skill";
import { CurrentUnit, RemoveEquipmentFromPerson, UpdateSuppressionStatusForPersons } from "../cards/utils";
import { ModifiedVisibilityData } from "../game/conditions";
import { SCALE_PREFIX } from "../game/Constants";
import { SortByPropertyWithRandomTies } from "../utils/sorting";

const INDIRECT_FIRE_CORRECTION = [
    { correction: 5, threshold: 1 },
    { correction: 4, threshold: 4 },
    { correction: 3, threshold: 8 },
    { correction: 2, threshold: 14 },
    { correction: 1, threshold: 19 },
    { correction: 0, threshold: 22 }
];

const VEHICLE_HIT_TABLE = {
    7: [{ ap: 11, result: 19 }, { ap: 10, result: 21 }, { ap: 9, result: 23 }, { ap: 8, result: 26 }],
    6: [{ ap: 11, result: 17 }, { ap: 10, result: 19 }, { ap: 9, result: 21 }, { ap: 8, result: 23 }, { ap: 7, result: 25 }],
    5: [{ ap: 11, result: 15 }, { ap: 10, result: 17 }, { ap: 9, result: 19 }, { ap: 8, result: 20 }, { ap: 7, result: 22 }, { ap: 6, result: 24 }],
    4: [{ ap: 11, result: 9 }, { ap: 10, result: 11 }, { ap: 9, result: 13 }, { ap: 8, result: 15 }, { ap: 7, result: 17 }, { ap: 6, result: 19 }, { ap: 5, result: 21 }],
    2: [{ ap: 11, result: 7 }, { ap: 10, result: 8 }, { ap: 9, result: 10 }, { ap: 8, result: 11 }, { ap: 7, result: 13 }, { ap: 6, result: 14 }, { ap: 5, result: 15 }, { ap: 4, result: 18 }, { ap: 3, result: 19 }],
    0: [{ ap: 5, result: 7 }, { ap: 4, result: 8 }, { ap: 3, result: 11 }, { ap: 2, result: 14 }, { ap: 1, result: 20 }]
};

const VEHICLE_SUPPRESSION_TABLE = {
    7: [{ ap: 11, result: 17 }, { ap: 10, result: 19 }, { ap: 9, result: 21 }, { ap: 8, result: 23 }],
    6: [{ ap: 11, result: 15 }, { ap: 10, result: 17 }, { ap: 9, result: 19 }, { ap: 8, result: 20 }, { ap: 7, result: 21 }],
    5: [{ ap: 11, result: 13 }, { ap: 10, result: 15 }, { ap: 9, result: 17 }, { ap: 8, result: 18 }, { ap: 7, result: 18 }, { ap: 6, result: 20 }],
    4: [{ ap: 11, result: 7 }, { ap: 10, result: 9 }, { ap: 9, result: 11 }, { ap: 8, result: 13 }, { ap: 7, result: 12 }, { ap: 6, result: 14 }, { ap: 5, result: 16 }],
    2: [{ ap: 10, result: 6 }, { ap: 9, result: 8 }, { ap: 8, result: 9 }, { ap: 7, result: 9 }, { ap: 6, result: 10 }, { ap: 5, result: 11 }, { ap: 4, result: 12 }, { ap: 3, result: 13 }],
    0: [{ ap: 7, result: 5 }, { ap: 6, result: 4 }, { ap: 4, result: 3 }, { ap: 3, result: 5 }, { ap: 2, result: 8 }, { ap: 1, result: 13 }]
};

const INFANTRY_HIT_SUPPRESSION_TABLE = {
    4: { hits: [{ result: 22, wounds: 3 }, { result: 19, wounds: 2 }, { result: 9, wounds: 1 }], suppression: [{ result: 20, stress: 4 }, { result: 19, stress: 3 }, { result: 16, stress: 2 }, { result: 6, stress: 1 }] },
    3: { hits: [{ result: 20, wounds: 2 }, { result: 11, wounds: 1 }], suppression: [{ result: 20, stress: 3 }, { result: 17, stress: 2 }, { result: 8, stress: 1 }] },
    2: { hits: [{ result: 21, wounds: 2 }, { result: 13, wounds: 1 }], suppression: [{ result: 20, stress: 2 }, { result: 11, stress: 1 }] },
    1: { hits: [{ result: 16, wounds: 1 }], suppression: [{ result: 15, stress: 1 }] }
};

function selectSoldiersForHit(unit, count) {
    if (!unit.children) return [];

    const candidates = unit.children.filter(p => !p.isDead && !p.isBleeding);
    const sorted = SortByPropertyWithRandomTies(candidates, (person) => EffectiveTP(person));

    return sorted.slice(0, count);
}

function calculateIndirectHit(correction, rollResult) {
    if (correction < 0) return false;

    const entry = INDIRECT_FIRE_CORRECTION.find(c => c.correction <= correction);
    if (!entry) return false;

    return rollResult >= entry.threshold;
}

function calculateVehicleDamage(ap, armor, modifiedResult) {
    const hitTable = VEHICLE_HIT_TABLE[armor];
    const suppressionTable = VEHICLE_SUPPRESSION_TABLE[armor];

    const hitEntry = hitTable.find(entry => ap >= entry.ap && modifiedResult >= entry.result);

    if (hitEntry) {
        return { hits: 1, suppression: 0 };
    }

    const suppressionEntry = suppressionTable.find(entry => ap >= entry.ap && modifiedResult >= entry.result);
    const suppression = suppressionEntry ? ap - armor : 0;

    return { hits: 0, suppression: suppression };
}

function calculateInfantryDamage(he, modifiedResult, suppressionModifiedResult) {
    const table = INFANTRY_HIT_SUPPRESSION_TABLE[he];

    const hitEntry = table.hits.find(entry => modifiedResult >= entry.result);
    const hits = hitEntry ? hitEntry.wounds : 0;

    const suppressionEntry = table.suppression.find(entry => suppressionModifiedResult >= entry.result);
    const suppression = suppressionEntry ? suppressionEntry.stress : 0;

    return { hits, suppression };
}

function calculateFireEffect(players, roll, actorData, target, activeConditions) {
    if (!target) {
        return { result: false, actorData, supression: 0, hits: 0, message: "нет целей" };
    }

    const actor = actorData.actor;
    const unit = CurrentUnit(players, actor);
    const equipment = actorData.equipment;
    const visData = ModifiedVisibilityData(equipment, activeConditions);

    if (!unit.isDeployed && equipment.mustBeDeployed) {
        return { result: false, actorData, supression: 0, hits: 0, message: `${equipment.name} не готово к стрельбе` };
    }

    if (!unit.isDeployed && roll.indirectFire) {
        return { result: false, actorData, supression: 0, hits: 0, message: `${equipment.name} не готово к стрельбе непрямой наводкой` };
    }

    const deploymentMod = unit.isDeployed ? equipment.deployBonus : 0;
    const hasAmmo = (equipment.ammo ?? 0) > 0;

    if (!hasAmmo) {
        return { result: false, actorData, supression: 0, hits: 0, message: `У ${actor.name} нет боеприпасов для ${equipment.name}.` };
    }

    const wpnSkillPoints = roll.indirectFire ? (actor.skills.WPN_artillery || 0) : actor.skills[equipment.skill] || 0;
    const wpnSkillLevel = Level(wpnSkillPoints);

    if (wpnSkillLevel < 1 && equipment.skill !== "WPN_rifles") {
        return { result: false, actorData, supression: 0, hits: 0, message: `${actor.name} не умеет пользоваться ${equipment.name}` };
    }

    const targetTpSkillLevel = Level(MinSkill(target, "TP"));
    const armorMod = AverageArmorMod(target);

    // Механика пробития брони: AP вычитает из armorMod
    // Если AP >= armorMod, броня пробита (effectiveArmorMod = 0)
    // Пример: плиты (armorMod=4) vs M4 (AP=1) → 4-1=3 защиты
    //         плиты (armorMod=4) vs РПГ (AP=8) → 4-8=0 → Math.max(0, -4) = 0
    const effectiveArmorMod = Math.max(0, armorMod - equipment.ap);

    const reactionFireMod = roll.reactionFire ? 2 : 0;
    const flankFireMod = roll.flankFire ? 4 : 0;
    const blindFireMod = roll.blindFire ? 6 : 0;

    const bestRangeMod = 6;
    const effectiveRangeMod = deploymentMod;
    const maxRangeMod = -4;

    const hasUniformRange = equipment.bestRange === equipment.effectiveRange && equipment.effectiveRange === equipment.maxRange;
    const distanceMod = hasUniformRange
        ? effectiveRangeMod
        : roll.selectedDistance === "0" ? bestRangeMod : roll.selectedDistance === "2" ? maxRangeMod : effectiveRangeMod;

    const skillMod = target.vehicle
        ? wpnSkillLevel
        : wpnSkillLevel * 2 - targetTpSkillLevel * 2;

    const correctionResult = roll.roll + skillMod - effectiveArmorMod;
    const unitCorrection = roll.blindFire ? 0 : unit.correction;
    const indirectHit = calculateIndirectHit(unitCorrection, correctionResult);

    if (roll.indirectFire && !indirectHit) {
        const dispersionRadius = (6 - unitCorrection) * equipment.dispersion;
        return {
            result: true,
            actorData,
            supression: 0,
            hits: 0,
            message: `Стрельба непрямой наводкой ${actor.name} по ${target.name} (${equipment.name}): d20=${roll.roll}, результат ${correctionResult}, промах. Проверьте в радиусе ${dispersionRadius}.`
        };
    }

    const modifiedResult = roll.roll + skillMod - blindFireMod - reactionFireMod + flankFireMod + distanceMod - Number(roll.selectedDef);
    const suppressionModifiedResult = roll.roll + flankFireMod;

    if (target.vehicle) {
        const { hits, suppression } = calculateVehicleDamage(equipment.ap, target.vehicle.armor, modifiedResult);

        const message = hits > 0
            ? `Стрельба ${actor.name} по ${target.name} (${equipment.name}, видимость ${visData.maxRange + SCALE_PREFIX}): d20=${roll.roll}, результат ${modifiedResult}, транспортное средство уничтожено, требуется рассчёт поражения экипажа/десанта.`
            : `Стрельба ${actor.name} по ${target.name} (${equipment.name}, видимость ${visData.maxRange + SCALE_PREFIX}): d20=${roll.roll}, результат ${modifiedResult}, ${suppression} очков стресса.`;

        return { result: true, actorData, supression: suppression, hits, message };
    } else {
        const { hits, suppression } = calculateInfantryDamage(equipment.he, modifiedResult, suppressionModifiedResult);

        const message = `Стрельба ${actor.name} по ${target.name} (${equipment.name}, видимость ${visData.maxRange + SCALE_PREFIX}): d20=${roll.roll}, результат ${modifiedResult}, ${hits} ранений и ${suppression} очков стресса.`;

        return { result: true, actorData, supression: suppression, hits, message };
    }
}

export function ApplyFireEffects(players, rolls, actors, target, onPropertyChange, activeConditions) {
    const effects = CalculateFireEffects(players, rolls, actors, target, activeConditions);

    if (!target) return effects;

    const totalSuppression = effects.reduce((acc, val) => acc + val.supression, 0);
    const newStress = target.stress + totalSuppression;

    onPropertyChange(target.id, "stress", newStress);

    const totalHits = effects.reduce((acc, val) => acc + (val.hits || 0), 0);
    const hitSoldiers = totalHits > 0 ? selectSoldiersForHit(target, totalHits) : [];

    hitSoldiers.forEach(soldier => {
        onPropertyChange(soldier.id, "isBleeding", true);
    });

    const soldiersEligibleForSuppression = target.children.filter(soldier =>
        !hitSoldiers.some(hitSoldier => hitSoldier.id === soldier.id)
    );

    UpdateSuppressionStatusForPersons(soldiersEligibleForSuppression, newStress, onPropertyChange);

    effects.filter(ef => ef.result).forEach(ef => {
        const { equipment, actor } = ef.actorData;
        const isConsumable = equipment.ammo === 1 && equipment.weight === 0;

        if (isConsumable) {
            RemoveEquipmentFromPerson(actor, equipment, onPropertyChange);
        } else {
            onPropertyChange(equipment.id, "ammo", equipment.ammo - 1);
        }
    });

    return effects;
}

export function CalculateFireEffects(players, rolls, actors, target, activeConditions) {
    return rolls.map(roll => {
        const actorEntry = actors.find(a => a.actor.id === roll.id);
        return calculateFireEffect(players, roll, actorEntry, target, activeConditions);
    });
}

export function CanFireInfantryEquipment(players, actor, equipment) {
    if (equipment.armorMod > 0) return false;

    return (Level(actor.skills[equipment.skill] || 0) > 0 || equipment.skill === "WPN_rifles")
        && (!equipment.mustBeDeployed || CurrentUnit(players, actor).isDeployed)
        && equipment.name !== "Дымовая шашка"
        && (equipment.ammo > 0 || equipment.ammoWeight === 0)
        && (equipment.ap > 0 || equipment.he > 0);
}

export function CanFireVehicleEquipment(players, actor, equipment) {
    const unit = CurrentUnit(players, actor);
    return Level(actor.skills[equipment.skill] || 0) > 0
        && (!equipment.mustBeDeployed || unit.isDeployed)
        && (equipment.ammo ?? 0) > 0;
}
