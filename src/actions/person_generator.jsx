import { useState, useEffect } from 'react';
import { Skills } from '../game/skills';
import { entity } from '../game/person';
import { Titles } from '../game/titles';
import { CountriesData, generateNameForCountry, Genders } from '../game/names';
import { CreateInfantryEquipment } from '../game/equipment';

function assignEquipment(skills) {
    const FP = skills.FP ?? 0;
    const MSK = skills.MSK ?? 0;
    const grenadeSkill = skills.WPN_grenades ?? 0;

    const equipment = [];

    if (FP >= 4 && (skills.WPN_at_launcher ?? 0) > 0) {
        equipment.push("rifle");
        equipment.push("rpg29");
    }
    else if (FP >= 4 && (skills.WPN_mg ?? 0) > (skills.WPN_rifles ?? 0)) {
        equipment.push("lmg_pkm")
    }
    else if (FP >= 3 && (skills.WPN_sniper ?? 0) > (skills.WPN_rifles ?? 0)) {
        equipment.push("h&kg2810x")
    }
    else if (FP >= 1) {
        const mexSkills = ["MEX_wheeled", "MEX_tracked"];
        const hasHighMex = mexSkills.some(skillId => (skills[skillId] ?? 0) >= 5);
        if (hasHighMex) {
            equipment.push("short_rifle");
        }
        else {
            equipment.push("rifle");
            if (FP >= 3 && (skills.WPN_gl ?? 0) >= 3) {
                equipment.push("gp");
            }
        }
    }

    if (MSK >= 3 && FP >= 1) {
        equipment.push("binoculars");
    }

    if (MSK >= 8 && FP >= 2) {
        equipment.push("nvg");
    }

    if (grenadeSkill >= 2 && FP >= 1) {
        equipment.push("grenades");
        equipment.push("smoke");
    } else if (grenadeSkill >= 1 && FP >= 1) {
        equipment.push("smoke");
    }

    if (MSK >= 3 && FP >= 3 && (skills.WPN_uav ?? 0) >= 3) {
        equipment.push("uav");
    }

    return CreateInfantryEquipment(equipment);
}

export function PersonGenerator({ onCancel, onConfirm }) {
    const [selectedTitle, setSelectedTitle] = useState(Titles[0].name);
    const [selectedCountry, setSelectedCountry] = useState(CountriesData[0].CountryName);
    const [selectedGender, setSelectedGender] = useState(Genders[0].id);
    const [isMilitary, setIsMilitary] = useState(true);
    const [defaultWeapon, setDefaultWeapon] = useState(true);
    const [name, setName] = useState(generateNameForCountry(selectedCountry, selectedGender));

    useEffect(() => {
        setName(generateNameForCountry(selectedCountry, selectedGender));
    }, [selectedCountry, selectedGender]);

    return (
        <div className='modal-overlay'>
            <h3>Генератор персонажа</h3>
            <label className="form-label">
                <span>Страна:</span>
                <select
                    value={selectedCountry}
                    onChange={(e) => {
                        setSelectedCountry(e.target.value);
                    }}
                >
                    {CountriesData.map((data) => (
                        <option key={data.CountryName} value={data.CountryName}>
                            {data.CountryName}
                        </option>
                    ))}
                </select>
            </label>
            <label className="form-label">
                <span>Пол:</span>
                <select
                    value={selectedGender}
                    onChange={(e) => {
                        setSelectedGender(e.target.value);
                    }}
                >
                    {Genders.map((gender) => (
                        <option key={gender.id} value={gender.id}>
                            {gender.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="form-label">
                <span>Имя:</span>
                <input name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="form-label">
                <span>Уровень:</span>
                <select
                    value={selectedTitle}
                    onChange={(e) => {
                        setSelectedTitle(e.target.value);
                    }}
                >
                    {Titles.map((title) => (
                        <option key={title.name} value={title.name}>
                            {title.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="form-label">
                <span>Действующий солдат</span>
                <input title='Недавно проходил военные сборы или в настоящее время проходит службу' type="checkbox" checked={isMilitary} onChange={() => setIsMilitary(!isMilitary)} />
            </label>
            <label className="form-label">
                <span>Имеет оружие</span>
                <input title='Имеет оружие' type="checkbox" checked={defaultWeapon} onChange={() => setDefaultWeapon(!defaultWeapon)} />
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={onCancel}>Отмена</button>
                <button onClick={() => {
                    const newPerson = GeneratePerson(selectedTitle, isMilitary, defaultWeapon, name);

                    onConfirm(newPerson);
                }}>Применить</button>
            </div>
        </div>
    );
}

export function GenerateDefaultPerson(isMilitary, hasWeapon) {
    const titleName = Titles[1].name;
    const name = generateNameForCountry(CountriesData[0].CountryName, Genders[0].id);
    return GeneratePerson(titleName, isMilitary, hasWeapon, name);
}

export function GeneratePerson(titleName, isMilitary, hasWeapon, name) {
    const title = Titles.find(title => title.name === titleName);
    const skills = isMilitary ? { LID: title.lid, FP: 4, TP: 3, MSK: 1, WPN_rifles: 3, WPN_grenades: 1 } : { LID: title.lid, FP: 3 };
    const skillsForRoll = Skills.filter(sk => !sk.id.startsWith("WPN_") && sk.id !== "LID");
    for (let sr = 0; sr < title.skillRolls; sr++) {
        const skillRoll = Math.floor(Math.random() * skillsForRoll.length);
        const valueRoll = Math.floor(Math.random() * (isMilitary ? title.maxSkillRoll : 4)) + 1;
        skills[skillsForRoll[skillRoll].id] = Math.max(skills[skillsForRoll[skillRoll].id] ?? 0, valueRoll);
    }
    const weaponSkillsForRoll = Skills.filter(sk => sk.id.startsWith("WPN_"));
    for (let sr = 0; sr < title.weaponSkillRolls; sr++) {
        const skillRoll = Math.floor(Math.random() * weaponSkillsForRoll.length);
        const valueRoll = Math.floor(Math.random() * (isMilitary ? title.maxSkillRoll : 6)) + 1;
        skills[weaponSkillsForRoll[skillRoll].id] = Math.max(skills[weaponSkillsForRoll[skillRoll].id] ?? 0, valueRoll);
    }

    const equipment = hasWeapon ? assignEquipment(skills) : [];

    const newPerson = new entity(name, skills, equipment);
    return newPerson;
}
