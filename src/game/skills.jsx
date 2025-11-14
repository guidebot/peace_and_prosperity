import { skill } from "./metadata"

export function Level(skillPoints) {
    const points = Number(skillPoints);

    if (isNaN(points) || points < 1) return 0;
    if (points <= 2) return 1;
    if (points <= 4) return 2;
    if (points <= 7) return 3;
    if (points <= 12) return 4;
    if (points <= 19) return 5;
    if (points >= 20) return 6;

    return 0;
}

export function MaxSkill(unitData, skillKey) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter(s => !s.isDead).reduce((maxPoints, soldier) => {
        const points = soldier.skills?.[skillKey] || 0;
        return Math.max(maxPoints, points);
    }, 0);
}

export function MinSkill(unitData, skillKey) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter(s => !s.isDead).reduce((maxPoints, soldier) => {
        const points = soldier.skills?.[skillKey] || 0;
        return Math.min(maxPoints, points);
    }, 999);
}

export function MedianSkill(unitData, skillKey) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    const skillValues = unitData.children
        .filter(soldier => !soldier.isDead)
        .map(soldier => soldier.skills?.[skillKey] || 0);

    if (skillValues.length === 0) return 0;

    skillValues.sort((a, b) => a - b);

    const n = skillValues.length;
    const mid = Math.floor(n / 2);

    if (n % 2 === 1) {
        return skillValues[mid];
    } else {
        return Math.round((skillValues[mid - 1] + skillValues[mid]) / 2);
    }
}

export const SkillCategories = {
    char: "Основные навыки",
    wpn: "Оружие",
    mex: "Техника"
}

export const Skills = [
    new skill("char", "LID", "ЛИД Лидерство"),
    new skill("char", "FP", "ФП Физическая Подготовка"),
    new skill("char", "TP", "ТП Тактическая Подготовка"),
    new skill("char", "MED", "МЕД Медицина"),
    new skill("char", "MSK", "МСК Маскировка"),
    new skill("wpn", "WPN_rifles", "ОРУЖ Лёгкое стрелковое"),
    new skill("wpn", "WPN_grenades", "ОРУЖ Гранаты"),
    new skill("wpn", "WPN_sniper", "ОРУЖ Снайперское оружие"),
    new skill("wpn", "WPN_mg", "ОРУЖ Пулемёты"),
    new skill("wpn", "WPN_at_launcher", "ОРУЖ Реактивные гранатомёты"),
    new skill("wpn", "WPN_gl", "ОРУЖ Гранатомёты"),
    new skill("wpn", "WPN_at_guided", "ОРУЖ ПТРК"),
    new skill("wpn", "WPN_mortars", "ОРУЖ Миномёты"),
    new skill("wpn", "WPN_uav", "ОРУЖ БПЛА"),
    new skill("wpn", "WPN_manpads", "ОРУЖ ПЗРК"),
    new skill("wpn", "WPN_ac", "ОРУЖ Автопушки"),
    new skill("wpn", "WPN_tank_guns", "ОРУЖ Танковые пушки"),
    new skill("wpn", "WPN_howitzers", "ОРУЖ Ствольная артиллерия"),
    new skill("wpn", "WPN_mlrs", "ОРУЖ РСЗО"),
    new skill("wpn", "WPN_explosives", "ОРУЖ Взрывные устройства и мины"),
    new skill("mex", "MEX_trucks", "МЕХ Автомобили"),
    new skill("mex", "MEX_wheeled", "МЕХ Колёсные БМ"),
    new skill("mex", "MEX_tracked", "МЕХ Гусеничные БМ")
]

export const SkillsByCategories = Skills.reduce((acc, item) => {
    if (!acc[item.category]) {
        acc[item.category] = [];
    }

    acc[item.category].push(item);

    return acc;
}, {});

export const SkillsCatalog = Skills.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});