export class Title {
    name: string;
    leadership: number;
    skillRolls: number;
    weaponSkillRolls: number;
    maxSkillRoll: number;

    constructor(name: string, leadership: number, skillRolls: number, weaponSkillRolls: number, maxSkillRoll: number) {
        this.name = name;
        this.leadership = leadership;
        this.skillRolls = skillRolls;
        this.weaponSkillRolls = weaponSkillRolls;
        this.maxSkillRoll = maxSkillRoll;
    }
}

export const Titles = [
    new Title("Рядовой/Чернорабочий", 2, 1, 1, 10),
    new Title("Мл. сержант", 4, 1, 2, 20),
    new Title("Cержант/Прораб", 6, 2, 2, 20),
    new Title("Лейтенант/Специалист", 8, 2, 1, 14),
    new Title("Капитан/Руководитель", 11, 3, 3, 14),
    new Title("Майор", 14, 4, 3, 14),
    new Title("Полковник/Топ Менеджер", 17, 4, 3, 10),
    new Title("Генерал", 20, 5, 3, 6)
]