export class Title {
    name: string;
    lid: number;
    skillRolls: number;
    weaponSkillRolls: number;
    maxSkillRoll: number;

    constructor(name: string, lid: number, skillRolls: number, weaponSkillRolls: number, maxSkillRoll: number) {
        this.name = name;
        this.lid = lid;
        this.skillRolls = skillRolls;
        this.weaponSkillRolls = weaponSkillRolls;
        this.maxSkillRoll = maxSkillRoll;
    }
}

export const Titles = [
    new Title("Рядовой", 0, 1, 1, 10),
    new Title("Мл. сержант", 2, 1, 2, 20),
    new Title("Cержант", 4, 2, 2, 20),
    new Title("Лейтенант", 7, 3, 1, 14),
    new Title("Капитан", 12, 4, 3, 14),
    new Title("Майор", 15, 4, 4, 14),
    new Title("Полковник", 16, 4, 5, 14),
    new Title("Генерал", 20, 5, 5, 6)
]