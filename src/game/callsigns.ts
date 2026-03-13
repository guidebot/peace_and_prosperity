export const UNIT_CALLSIGNS = [
    "Алмаз", "Аркан", "Багира", "Барс", "Беркут",
    "Вепрь", "Викинг", "Волк", "Ворон", "Вымпел",
    "Гепард", "Град", "Гриф", "Гром", "Дозор",
    "Дракон", "Ермак", "Жнец", "Зубр", "Ирбис",
    "Казбек", "Кайман", "Кедр", "Комар", "Коршун",
    "Кречет", "Крот", "Крыс", "Кулон", "Куман",
    "Лесник", "Лис", "Лотос", "Лунь", "Марал",
    "Метеор", "Молот", "Морж", "Орёл", "Острог",
    "Парсек", "Перун", "Пилот", "Питон", "Плутон",
    "Поларис", "Посейдон", "Призма", "Протон", "Пума",
    "Радар", "Развед", "Ратник", "Резон", "Рейдер",
    "Риф", "Росич", "Рубеж", "Рубин", "Рысь",
    "Сапсан", "Сармат", "Сектор", "Селигер", "Скат",
    "Скорп", "Слав", "Следопыт", "Сокол", "Спектр",
    "Статус", "Створ", "Стелс", "Стриж", "Тайфун",
    "Тайга", "Талисман", "Таран", "Титан", "Топаз",
    "Трезуб", "Туман", "Тунгус", "Ураган", "Факел",
    "Фарватер", "Феникс", "Флагман", "Фобос", "Форпост",
    "Фрегат", "Хабар", "Харизма", "Хитин", "Холод",
    "Центр", "Циклон", "Часовой", "Чекин", "Челендж",
    "Черномор", "Черт", "Чиж", "Чук", "Шаман",
    "Шекспир", "Шершень", "Шквал", "Шторм", "Штиль",
    "Щит", "Эверест", "Экскалибур", "Эксперт", "Эридан",
    "Эталон", "Юпитер", "Юркий", "Ягуар", "Якорь",
    "Янтарь", "Ярослав", "Ястреб"
];

function parseCallsignNumber(name: string): number | null {
    const match = name.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    return parseInt(match[2], 10);
}

function getCallsignWord(name: string): string | null {
    const match = name.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    return match[1];
}

export function generateUnitName(existingUnitNames: string[]): string {
    const randomCallsign = UNIT_CALLSIGNS[Math.floor(Math.random() * UNIT_CALLSIGNS.length)];
    
    const usedNumbers = existingUnitNames
        .map(name => {
            const word = getCallsignWord(name);
            if (word !== randomCallsign) return null;
            return parseCallsignNumber(name);
        })
        .filter((num): num is number => num !== null)
        .sort((a, b) => a - b);
    
    let nextNumber = 1;
    for (const num of usedNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else if (num > nextNumber) {
            break;
        }
    }
    
    return `${randomCallsign}-${nextNumber}`;
}
