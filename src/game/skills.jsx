import { skill } from "./metadata"

export function Level(skillPoints) {
    const points = Number(skillPoints);

    if (isNaN(points) || points < 1) return 0;
    if (points < 3) return 1;
    if (points < 7) return 2;
    if (points < 12) return 3;
    if (points < 16) return 4;
    if (points < 20) return 5;
    if (points >= 20) return 6;

    return 0;
}

export function MaxSkill(unitData, skillKey) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter(s => !s.isDead && !s.isBleeding).reduce((maxPoints, soldier) => {
        const points = soldier.skills?.[skillKey] || 0;
        return Math.max(maxPoints, points);
    }, 0);
}

export function MinSkill(unitData, skillKey) {
    if (!unitData || !unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter(s => !s.isDead && !s.isBleeding).reduce((maxPoints, soldier) => {
        const points = soldier.skills?.[skillKey] || 0;
        return Math.min(maxPoints, points);
    }, 999);
}

export function MedianSkill(unitData, skillKey) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    const skillValues = unitData.children
        .filter(soldier => !soldier.isDead && !soldier.isBleeding)
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
    tech: "Техника"
}

export const Skills = [
    new skill("char", "LID", "ЛИД Лидерство"),
    new skill("char", "FP", "ФП Физическая Подготовка"),
    new skill("char", "TP", "ТП Тактическая Подготовка"),
    new skill("char", "MED", "МЕД Медицина"),
    new skill("char", "MSK", "МСК Маскировка"),
    new skill("wpn", "WPN_rifles", "Лёгкое стрелковое"),
    new skill("wpn", "WPN_grenades", "Гранаты"),
    new skill("wpn", "WPN_sniper", "Снайперское оружие"),
    new skill("wpn", "WPN_mg", "Пулемёты"),
    new skill("wpn", "WPN_heavy", "Тяжёлое вооружение"),
    new skill("wpn", "WPN_guided", "Управляемые ракеты"),
    new skill("wpn", "WPN_tank_guns", "Наводчик боевых машин"),
    new skill("wpn", "WPN_artillery", "Артиллерия"),
    new skill("tech", "TECH_explosives", "Взрывные устройства и мины"),
    new skill("tech", "TECH_mechanics", "Механика"),
    new skill("tech", "TECH_uav", "Управление дронами"),
    new skill("tech", "TECH_electronics", "Электроника")
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