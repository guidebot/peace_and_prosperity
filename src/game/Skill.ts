import { Entity } from "./Entity";
import { Unit } from "./Unit";

export class Skill {
    attribute: string;
    id: string;
    name: string;

    constructor(attribute: string, id: string, name: string) {
        this.attribute = attribute;
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

export function MaxLeadership(unitData: Unit) {
    return Math.max(MaxSkill(unitData, "LOG") ?? 0, MaxSkill(unitData, "IFL") ?? 0);
}

export function GetLeadershipFromSkills(skills: Record<string, number>): number {
    return Math.max(skills?.["LOG"] || 0, skills?.["IFL"] || 0);
}

export function MaxLeadershipFromPersons(persons: Entity[]): number {
    if (!persons || persons.length === 0) return 0;
    return Math.max(...persons.map(p => GetLeadershipFromSkills(p.skills || {})));
}

export function EffectiveManeuvering(soldier: Entity): number {
    const baseTP = soldier.skills["MNV"] || 0;
    return baseTP + GetArmorMod(soldier);
}

export function GetArmorMod(soldier: Entity): number {
    if (!soldier.equipment || soldier.equipment.length === 0) return 0;
    return Math.max(...soldier.equipment.map((item: { armorMod: any; }) => item.armorMod || 0));
}

export function AverageArmorMod(unitData: Unit): number {
    if (!unitData || !unitData.children || unitData.children.length === 0) return 0;

    const alive = unitData.children.filter((s: Entity) => !s.isDead && !s.isBleeding);
    if (alive.length === 0) return 0;

    const totalArmor = alive.reduce((sum, s) => {
        return sum + GetArmorMod(s);
    }, 0);

    return Math.floor(totalArmor / alive.length);
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

export const Attributes = {
    HEL: "Здоровье",
    AGI: "Ловкость",
    MRK: "Меткость",
    INT: "Интеллект",
    CHR: "Харизма"
}

export const Skills = [
    new Skill("HEL", "END", "[ВНС] Выносливость"),

    new Skill("AGI", "MNV", "[МНВ] Маневрирование"),
    new Skill("AGI", "STE", "[МСК] Маскировка"),

    new Skill("CHR", "IFL", "[ВЛН] Влияние"),

    new Skill("INT", "LOG", "[ЛГК] Логика"),
    new Skill("INT", "MED", "[МЕД] Медицина"),
    new Skill("INT", "MCH", "[МЕХ] Механика"),
    new Skill("INT", "EL", "[ЭЛ] Электроника"),
    new Skill("INT", "TECH_explosives", "[ВЗР] Взрывчатые вещества"),
    new Skill("INT", "WPN_artillery", "[ОП] Огневая поддержка"),

    new Skill("MRK", "WPN_grenades", "[ГРН] Метательное оружие (гранаты)"),
    new Skill("MRK", "WPN_rifles", "[ЛС] Лёгкое стрелковое оружие"),
    new Skill("MRK", "WPN_sniper", "[СН] Снайперское оружие"),
    new Skill("MRK", "WPN_mg", "[ПЛМ] Пулемёты"),
    new Skill("MRK", "WPN_guided", "[УР] Управляемые ракеты"),
    new Skill("MRK", "TECH_uav", "[ДРН] Управляемые дроны"),
    new Skill("MRK", "WPN_heavy", "[ТВ] Тяжёлое вооружение")
]

export const SkillsByAttributes: Record<string, Skill[]> = Skills.reduce((acc: Record<string, Skill[]>, item: Skill) => {
    if (!acc[item.attribute]) {
        acc[item.attribute] = [];
    }

    acc[item.attribute].push(item);

    return acc;
}, {});

export const SkillsCatalog: Record<string, Skill> = Skills.reduce((acc: Record<string, Skill>, item: Skill) => {
    acc[item.id] = item;
    return acc;
}, {});