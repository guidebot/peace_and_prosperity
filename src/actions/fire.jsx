import { Level, MinSkill } from "../game/skills";
import { CurrentUnit } from "../cards/utils";

export function ApplyFireEffects(players, rolls, actors, target, onPropertyChange) {
    const effects = CalculateFireEffects(players, rolls, actors, target);

    if (!target) return effects;

    const newStress = target.stress + effects.reduce((acc, val) => {
        return acc + val.supression;
    }, 0);

    onPropertyChange(target.id, "stress", newStress);

    effects.filter(ef => ef.result).forEach(ef => {
        onPropertyChange(ef.actorData.equipment.id, "ammo", ef.actorData.equipment.ammo - 1);
    });

    return effects;
}

function CalculateFireEffect(players, roll, actorData, target) {
    let supression = 0;
    let hits = 0;

    if (!target) {
        return { result: false, actorData: actorData, supression: supression, hits: hits, message: `нет целей` }
    }

    const actor = actorData.actor;

    const unit = CurrentUnit(players, actor);

    const equipment = actorData.equipment;

    if (!unit.isDeployed && equipment.mustBeDeployed) {
        return { result: false, actorData: actorData, supression: supression, hits: hits, message: `${equipment.name} не готово к стрельбе` }
    }

    if (!unit.isDeployed && roll.indirectFire) {
        return { result: false, actorData: actorData, supression: supression, hits: hits, message: `${equipment.name} не готово к стрельбе непрямой наводкой` }
    }

    const deploymentMod = unit.isDeployed ? equipment.deployBonus : 0;

    const hasAmmo = (equipment.ammo ?? 0) > 0;

    if (!hasAmmo) {
        return { result: false, actorData: actorData, supression: supression, hits: hits, message: `У ${actor.name} нет боеприпасов для ${equipment.name}.` };
    }

    const wpnSkillPoints = actor.skills[equipment.skill] || 0;
    const wpnSkillLevel = Level(wpnSkillPoints);

    if (wpnSkillLevel < 1 && equipment.skill !== "WPN_rifles") {
        return { result: false, actorData: actorData, supression: supression, hits: hits, message: `${actor.name} не умеет пользоваться ${equipment.name}` }
    }

    const targetTpSkillPoints = MinSkill(target, "TP");
    const targetTpSkillLevel = Level(targetTpSkillPoints);

    const reactionFireMod = roll.reactionFire ? 2 : 0;
    const flankFireMod = roll.flankFire ? (target != null && target.vehicle && target.vehicle.armor > 0 ? 4 : 2) : 0;
    const blindFireMod = roll.blindFire ? 5 : 0;

    const bestRangeMod = 6;
    const effectiveRangeMod = deploymentMod;
    const maxRangeMod = -4;

    const distanceMod = equipment.bestRange === equipment.effectiveRange && equipment.effectiveRange === equipment.maxRange ?
        effectiveRangeMod :
        roll.selectedDistance === "0" ? bestRangeMod : roll.selectedDistance === "2" ? maxRangeMod : effectiveRangeMod;

    const skillMod = target != null && target.vehicle ?
        wpnSkillLevel :
        wpnSkillLevel * 2 - targetTpSkillLevel * 2;

    const correctionResult = roll.roll + skillMod;

    const unitCorrection = roll.blindFire ? 0 : unit.correction;

    const indirectHit =
        unitCorrection >= 5 ? true :
            unitCorrection >= 4 ? correctionResult >= 4 :
                unitCorrection >= 3 ? correctionResult >= 8 :
                    unitCorrection >= 2 ? correctionResult >= 14 :
                        unitCorrection >= 1 ? correctionResult >= 19 :
                            unitCorrection >= 0 ? correctionResult >= 22 : false;

    if (roll.indirectFire && !indirectHit) {
        return { result: true, actorData: actorData, supression: supression, hits: hits, message: `Стрельба непрямой наводкой ${actor.name} по ${target.name} (${equipment.name}): d20=${roll.roll}, результат ${correctionResult}, промах. Проверьте в радиусе ${(6 - unitCorrection) * equipment.dispersion}.` }
    }

    const modifiedResult = roll.roll + skillMod - blindFireMod - reactionFireMod + flankFireMod + distanceMod - Number(roll.selectedDef);

    if (target && target.vehicle) {
        const ap = equipment.ap;
        const armor = target.vehicle.armor;

        if (armor >= 7) {
            hits =
                ap >= 11 && modifiedResult >= 19 ? 1 :
                    ap >= 10 && modifiedResult >= 21 ? 1 :
                        ap >= 9 && modifiedResult >= 23 ? 1 :
                            ap >= 8 && modifiedResult >= 26 ? 1 :
                                0;

            supression = hits === 0 ?
                ap >= 11 && modifiedResult >= 17 ? ap - armor :
                    ap >= 10 && modifiedResult >= 19 ? ap - armor :
                        ap >= 9 && modifiedResult >= 21 ? ap - armor :
                            ap >= 8 && modifiedResult >= 23 ? ap - armor : 0 : 0;
        }
        else if (armor >= 6) {
            hits =
                ap >= 11 && modifiedResult >= 17 ? 1 :
                    ap >= 10 && modifiedResult >= 19 ? 1 :
                        ap >= 9 && modifiedResult >= 21 ? 1 :
                            ap >= 8 && modifiedResult >= 23 ? 1 :
                                ap >= 7 && modifiedResult >= 25 ? 1 :
                                    0;

            supression = hits === 0 ?
                ap >= 11 && modifiedResult >= 15 ? ap - armor :
                    ap >= 10 && modifiedResult >= 17 ? ap - armor :
                        ap >= 9 && modifiedResult >= 19 ? ap - armor :
                            ap >= 8 && modifiedResult >= 20 ? ap - armor :
                                ap >= 7 && modifiedResult >= 21 ? ap - armor : 0 : 0;
        }
        else if (armor >= 5) {
            hits =
                ap >= 11 && modifiedResult >= 15 ? 1 :
                    ap >= 10 && modifiedResult >= 17 ? 1 :
                        ap >= 9 && modifiedResult >= 19 ? 1 :
                            ap >= 8 && modifiedResult >= 20 ? 1 :
                                ap >= 7 && modifiedResult >= 22 ? 1 :
                                    ap >= 6 && modifiedResult >= 24 ? 1 :
                                        0;

            supression = hits === 0 ?
                ap >= 11 && modifiedResult >= 13 ? ap - armor :
                    ap >= 10 && modifiedResult >= 15 ? ap - armor :
                        ap >= 9 && modifiedResult >= 17 ? ap - armor :
                            ap >= 8 && modifiedResult >= 18 ? ap - armor :
                                ap >= 7 && modifiedResult >= 18 ? ap - armor :
                                    ap >= 6 && modifiedResult >= 20 ? ap - armor :
                                        0 : 0;
        }
        else if (armor >= 4) {
            hits =
                ap >= 11 && modifiedResult >= 9 ? 1 :
                    ap >= 10 && modifiedResult >= 11 ? 1 :
                        ap >= 9 && modifiedResult >= 13 ? 1 :
                            ap >= 8 && modifiedResult >= 15 ? 1 :
                                ap >= 7 && modifiedResult >= 17 ? 1 :
                                    ap >= 6 && modifiedResult >= 19 ? 1 :
                                        ap >= 5 && modifiedResult >= 21 ? 1 :
                                            0;

            supression = hits === 0 ?
                ap >= 11 && modifiedResult >= 7 ? ap - armor :
                    ap >= 10 && modifiedResult >= 9 ? ap - armor :
                        ap >= 9 && modifiedResult >= 11 ? ap - armor :
                            ap >= 8 && modifiedResult >= 13 ? ap - armor :
                                ap >= 7 && modifiedResult >= 12 ? ap - armor :
                                    ap >= 6 && modifiedResult >= 14 ? ap - armor :
                                        ap >= 5 && modifiedResult >= 16 ? ap - armor :
                                            0 : 0;
        }
        else if (armor >= 2) {
            hits =
                ap >= 11 && modifiedResult >= 7 ? 1 :
                    ap >= 10 && modifiedResult >= 8 ? 1 :
                        ap >= 9 && modifiedResult >= 10 ? 1 :
                            ap >= 8 && modifiedResult >= 11 ? 1 :
                                ap >= 7 && modifiedResult >= 13 ? 1 :
                                    ap >= 6 && modifiedResult >= 14 ? 1 :
                                        ap >= 5 && modifiedResult >= 15 ? 1 :
                                            ap >= 4 && modifiedResult >= 18 ? 1 :
                                                ap >= 3 && modifiedResult >= 19 ? 1 :
                                                    0;

            supression = hits === 0 ?
                ap >= 11 ? 0 :
                    ap >= 10 && modifiedResult >= 6 ? ap - armor :
                        ap >= 9 && modifiedResult >= 8 ? ap - armor :
                            ap >= 8 && modifiedResult >= 9 ? ap - armor :
                                ap >= 7 && modifiedResult >= 9 ? ap - armor :
                                    ap >= 6 && modifiedResult >= 10 ? ap - armor :
                                        ap >= 5 && modifiedResult >= 11 ? ap - armor :
                                            ap >= 4 && modifiedResult >= 12 ? ap - armor :
                                                ap >= 3 && modifiedResult >= 13 ? ap - armor :
                                                    0 : 0;
        }
        else if (armor >= 0) {
            hits =
                ap >= 5 && modifiedResult >= 7 ? 1 :
                    ap >= 4 && modifiedResult >= 8 ? 1 :
                        ap >= 3 && modifiedResult >= 11 ? 1 :
                            ap >= 2 && modifiedResult >= 14 ? 1 :
                                ap >= 1 && modifiedResult >= 20 ? 1 :
                                    0;

            supression = hits === 0 ?
                ap >= 8 ? 0 :
                    ap >= 7 && modifiedResult >= 5 ? ap - armor :
                        ap >= 6 && modifiedResult >= 4 ? ap - armor :
                            ap >= 4 && modifiedResult >= 3 ? ap - armor :
                                ap >= 3 && modifiedResult >= 5 ? ap - armor :
                                    ap >= 2 && modifiedResult >= 8 ? ap - armor :
                                        ap >= 1 && modifiedResult >= 13 ? ap - armor :
                                            0 : 0;
        }

        const message = hits > 0 ?
            `Стрельба ${actor.name} по ${target.name} (${equipment.name}): d20=${roll.roll}, результат ${modifiedResult}, транспортное средство уничтожено, требуется рассчёт поражения экипажа/десанта.` :
            `Стрельба ${actor.name} по ${target.name} (${equipment.name}): d20=${roll.roll}, результат ${modifiedResult}, ${supression} очков стресса.`;

        return { result: true, actorData: actorData, supression: supression, hits: hits, message: message };
    }
    else {
        const supressionModifiedResult = roll.roll + flankFireMod;

        if (equipment.he >= 4) {
            hits = modifiedResult >= 23 ? 3 :
                modifiedResult >= 20 ? 2 :
                    modifiedResult >= 10 ? 1 : 0;

            supression = supressionModifiedResult >= 20 ? 4 :
                supressionModifiedResult >= 19 ? 3 :
                    supressionModifiedResult >= 16 ? 2 :
                        supressionModifiedResult >= 6 ? 1 : 0;
        } else if (equipment.he >= 3) {
            hits = modifiedResult >= 21 ? 2 :
                modifiedResult >= 12 ? 1 : 0;

            supression = supressionModifiedResult >= 20 ? 3 :
                supressionModifiedResult >= 17 ? 2 :
                    supressionModifiedResult >= 8 ? 1 : 0;
        } else if (equipment.he >= 2) {
            hits = modifiedResult >= 23 ? 2 :
                modifiedResult >= 15 ? 1 : 0;

            supression = supressionModifiedResult >= 20 ? 2 :
                supressionModifiedResult >= 11 ? 1 : 0;
        }
        else if (equipment.he >= 1) {
            hits = modifiedResult >= 19 ? 1 : 0;

            supression = supressionModifiedResult >= 15 ? 1 : 0;
        }
        else {
            hits = modifiedResult >= 19 ? 1 : 0;
            supression = 0;
        }

        const message = `Стрельба ${actor.name} по ${target.name} (${equipment.name}): d20=${roll.roll}, результат ${modifiedResult}, ${hits} ранений и ${supression} очков стресса.`;

        return { result: true, actorData: actorData, supression: supression, hits: hits, message: message };
    }
}

export function CalculateFireEffects(players, rolls, actors, target) {
    return rolls.map(roll => CalculateFireEffect(players, roll, actors.find(a => a.actor.id === roll.id), target));
}

export function CanFireInfantryEquipment(players, actor, equipment) {
    return (Level(actor.skills[equipment.skill] || 0) > 0 || equipment.skill === "WPN_rifles")
        && ((equipment.mustBeDeployed && CurrentUnit(players, actor).isDeployed) || !equipment.mustBeDeployed)
        && equipment.name !== "Дымовая шашка"
        && (equipment.ammo > 0 || equipment.ammoWeight === 0)
        && (equipment.ap > 0 || equipment.he > 0);
}

export function CanFireVehicleEquipment(players, actor, equipment) {
    const unit = CurrentUnit(players, actor);
    return Level(actor.skills[equipment.skill] || 0) > 0
        && ((equipment.mustBeDeployed && unit.isDeployed) || !equipment.mustBeDeployed)
        && (equipment.ammo ?? 0) > 0;
}