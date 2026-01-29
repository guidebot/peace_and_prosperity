import { Entity } from "./Entity";
import { Unit } from "./Unit";

export class Skill {
    category: string;
    id: string;
    name: string;

    constructor(category: string, id: string, name: string) {
        this.category = category;
        this.id = id;
        this.name = name;
    }
}

export function Level(SkillPoints: number) {
    const points = Number(SkillPoints);

    if (isNaN(points) || points < 1) return 0;
    if (points < 3) return 1;
    if (points < 7) return 2;
    if (points < 12) return 3;
    if (points < 16) return 4;
    if (points < 20) return 5;
    if (points >= 20) return 6;

    return 0;
}

export function MaxSkill(unitData: Unit, SkillKey: string) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter((s: Entity) => !s.isDead && !s.isBleeding).reduce((maxPoints: number, soldier: Entity) => {
        const points = soldier.skills?.[SkillKey] || 0;
        return Math.max(maxPoints, points);
    }, 0);
}

export function MinSkill(unitData: Unit, SkillKey: string) {
    if (!unitData || !unitData.children || unitData.children.length === 0) return 0;

    return unitData.children.filter((s: Entity) => !s.isDead && !s.isBleeding).reduce((maxPoints: number, soldier: Entity) => {
        const points = soldier.skills?.[SkillKey] || 0;
        return Math.min(maxPoints, points);
    }, 999);
}

export function MedianSkill(unitData: Unit, SkillKey: string) {
    if (!unitData.children || unitData.children.length === 0) return 0;

    const SkillValues = unitData.children
        .filter((soldier: Entity) => !soldier.isDead && !soldier.isBleeding)
        .map((soldier: Entity) => soldier.skills?.[SkillKey] || 0);

    if (SkillValues.length === 0) return 0;

    SkillValues.sort((a: number, b: number) => a - b);

    const n = SkillValues.length;
    const mid = Math.floor(n / 2);

    if (n % 2 === 1) {
        return SkillValues[mid];
    } else {
        return Math.round((SkillValues[mid - 1] + SkillValues[mid]) / 2);
    }
}

export const SkillCategories = {
    char: "Основные навыки",
    wpn: "Оружие",
    tech: "Техника"
}

export const Skills = [
    new Skill("char", "LID", "ЛИД Лидерство"),
    new Skill("char", "FP", "ФП Физическая Подготовка"),
    new Skill("char", "TP", "ТП Тактическая Подготовка"),
    new Skill("char", "MED", "МЕД Медицина"),
    new Skill("char", "MSK", "МСК Маскировка"),
    new Skill("wpn", "WPN_rifles", "Лёгкое стрелковое"),
    new Skill("wpn", "WPN_grenades", "Гранаты"),
    new Skill("wpn", "WPN_sniper", "Снайперское оружие"),
    new Skill("wpn", "WPN_mg", "Пулемёты"),
    new Skill("wpn", "WPN_heavy", "Тяжёлое вооружение"),
    new Skill("wpn", "WPN_guided", "Управляемые ракеты"),
    new Skill("wpn", "WPN_tank_guns", "Наводчик боевых машин"),
    new Skill("wpn", "WPN_artillery", "Артиллерия"),
    new Skill("tech", "TECH_explosives", "Взрывные устройства и мины"),
    new Skill("tech", "TECH_mechanics", "Механика"),
    new Skill("tech", "TECH_uav", "Управление дронами"),
    new Skill("tech", "TECH_electronics", "Электроника")
]

export const SkillsByCategories: Record<string, Skill[]> = Skills.reduce((acc: Record<string, Skill[]>, item: Skill) => {
    if (!acc[item.category]) {
        acc[item.category] = [];
    }

    acc[item.category].push(item);

    return acc;
}, {});

export const SkillsCatalog: Record<string, Skill> = Skills.reduce((acc: Record<string, Skill>, item: Skill) => {
    acc[item.id] = item;
    return acc;
}, {});