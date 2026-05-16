import { useState, useEffect } from 'react';
import { Skills, GetLeadershipFromSkills } from '../game/Skill';
import { Entity } from '../game/Entity';
import { Titles } from '../game/Title';
import { CountriesData, generateNameForCountry, Genders } from '../game/names';
import { CreateInfantryEquipment, Equipment } from '../game/Equipment';
import { GiConfirmed, GiCancel } from 'react-icons/gi';

interface PersonGeneratorProps {
    onCancel: () => void;
    onConfirm: (person: Entity) => void;
}

type EquipmentItem = string | { id: string; count: number };

function assignEquipment(skills: Record<string, number>, isMilitary: boolean, hasWeapon: boolean): Equipment[] {
    const endurance = skills.END ?? 0;
    const maneuvering = skills.MNV ?? 0;
    const stealth = skills.STE ?? 0;
    const leadership = GetLeadershipFromSkills(skills);
    const grenadeSkill = skills.WPN_grenades ?? 0;
    const sniperSkill = skills.WPN_sniper ?? 0;

    const equipment: EquipmentItem[] = [];

    if (isMilitary && hasWeapon) {
        if (endurance >= 7 && (skills.WPN_heavy ?? 0) > 0) {
            equipment.push("ak12");
            equipment.push("rpg29");
        }
        else if (endurance >= 7 && (skills.WPN_mg ?? 0) > (skills.WPN_rifles ?? 0)) {
            equipment.push("lmg_pkm")
        }
        else if (endurance >= 3 && sniperSkill >= 7 && sniperSkill > (skills.WPN_rifles ?? 0)) {
            equipment.push("h&kg2810x")
        }
        else if (endurance >= 1) {
            if ((skills.TECH_mechanics ?? 0) >= 7) {
                equipment.push("aks74u");
            }
            else {
                if (endurance >= 3 && (skills.WPN_gl ?? 0) >= 3) {
                    equipment.push("ak12");
                    equipment.push("gp");
                }
                else if (maneuvering >= 3 && stealth >= 3) {
                    equipment.push("h&k416_silencer_collimator");
                }
                else {
                    equipment.push("ak12");
                }
            }
        }

        if (stealth >= 3 && endurance >= 1) {
            equipment.push("binoculars");
        }

        if (stealth >= 7 && endurance >= 3) {
            equipment.push("nvg");
        }

        if (grenadeSkill >= 3 && endurance >= 1) {
            equipment.push({ id: "grenades", count: 2 });
            equipment.push({ id: "smoke", count: 2 });
        } else if (grenadeSkill >= 1 && endurance >= 1) {
            equipment.push({ id: "smoke", count: 2 });
        }

        if (endurance >= 7 && (skills.TECH_uav ?? 0) >= 12) {
            equipment.push("uav_grenade");
        }
        else if (stealth >= 3 && endurance >= 3 && (skills.TECH_uav ?? 0) >= 7) {
            equipment.push("uav");
        }

        if (endurance >= 12 && maneuvering >= 7 && ((skills.TECH_mechanics ?? 0) < 7)) {
            equipment.push("vest_msv_full");
        }
        else if (endurance >= 7 && maneuvering >= 3) {
            equipment.push("vest_msv_plate");
        }
        else if (endurance >= 1 && (leadership >= 12 || maneuvering >= 3)) {
            equipment.push("vest_msv_base");
        }
    }

    if (!isMilitary && hasWeapon) {
        if (endurance >= 1 && (leadership >= 12 || maneuvering >= 3)) {
            equipment.push("vest_msv_base");
        }
    }

    if (isMilitary && leadership > 2) {
        equipment.push("baofeng");
        equipment.push("phone");
    }
    else {
        equipment.push("phone");
    }

    if (isMilitary && skills.MED > 0) {
        equipment.push({ id: "bandage", count: 2 });
    }

    return CreateInfantryEquipment(equipment);
}

export function PersonGenerator({ onCancel, onConfirm }: PersonGeneratorProps) {
    const [selectedTitle, setSelectedTitle] = useState<string>(Titles[0].name);
    const [selectedCountry, setSelectedCountry] = useState<string>(CountriesData[0].CountryName);
    const [selectedGender, setSelectedGender] = useState<string>(Genders[0].id);
    const [isCharismatic, setIsCharismatic] = useState<boolean>(Math.random() < 0.5);
    const [isMilitary, setIsMilitary] = useState<boolean>(true);
    const [defaultWeapon, setDefaultWeapon] = useState<boolean>(true);
    const [name, setName] = useState<string>(generateNameForCountry(selectedCountry, selectedGender));

    useEffect(() => {
        setName(generateNameForCountry(selectedCountry, selectedGender));
        setIsCharismatic(Math.random() < 0.5);
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
                <span>Харизматичный</span>
                <input title='Выбор коммуникативной стратегии между логикой и харизматичным влиянием' type="checkbox" checked={isCharismatic} onChange={() => setIsCharismatic(!isCharismatic)} />
            </label>
            <label className="form-label">
                <span>Действующий солдат</span>
                <input title='Недавно проходил военные сборы или в настоящее время проходит службу' type="checkbox" checked={isMilitary} onChange={() => setIsMilitary(!isMilitary)} />
            </label>
            <label className="form-label">
                <span>Имеет оружие</span>
                <input title='Имеет оружие' type="checkbox" checked={defaultWeapon} onChange={() => setDefaultWeapon(!defaultWeapon)} />
            </label>

            <div className="buttons-panel" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button title="Так точно" onClick={() => {
                    const newPerson = GeneratePerson(selectedTitle, isMilitary, defaultWeapon, name, isCharismatic);
                    onConfirm(newPerson);
                }}><GiConfirmed /></button>
                <button title="Никак нет" onClick={onCancel}><GiCancel /></button>
            </div>
        </div>
    );
}

export function GenerateDefaultPerson(isMilitary: boolean, hasWeapon: boolean, titleName: string): Entity {
    const name = generateNameForCountry(CountriesData[0].CountryName, Genders[0].id);
    return GeneratePerson(titleName, isMilitary, hasWeapon, name);
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function GeneratePerson(titleName: string, isMilitary: boolean, hasWeapon: boolean, name: string, isCharismatic?: boolean): Entity {
    const title = Titles.find(title => title.name === titleName);

    if (!title) {
        throw new Error(`Title "${titleName}" not found`);
    }

    const [maxSkill, randomSkill] = (isCharismatic ?? (Math.random() < 0.5)) ? ["IFL", "LOG"] as const : ["LOG", "IFL"] as const;
    const skills: Record<string, number> = isMilitary
        ? { LOG: 0, IFL: 0, END: 8, MNV: 4, STE: 1, WPN_rifles: 5, WPN_grenades: 2 }
        : { LOG: 0, IFL: 0, END: 5 };
    skills[maxSkill] = title.leadership;
    skills[randomSkill] = Math.floor(Math.random() * (title.leadership + 1));

    const weaponSkillRolls = isMilitary ? title.weaponSkillRolls : 1;
    const skillRolls = title.skillRolls + title.weaponSkillRolls - weaponSkillRolls;

    const skillsForRoll = shuffleArray(Skills.filter(sk => sk.attribute !== "MRK" && sk.id !== "LOG" && sk.id !== "IFL"));
    const selectedSkills = skillsForRoll.slice(0, skillRolls);
    for (const skill of selectedSkills) {
        let valueRoll = Math.floor(Math.random() * title.maxSkillRoll) + 1;
        if (skill.id === "END") { valueRoll = Math.min(skills[skill.id] + valueRoll, 20); }
        skills[skill.id] = Math.max(skills[skill.id] ?? 0, valueRoll);
    }

    const weaponSkillsForRoll = shuffleArray(Skills.filter(sk => sk.attribute === "MRK"));
    const selectedWeaponSkills = weaponSkillsForRoll.slice(0, weaponSkillRolls);
    for (const skill of selectedWeaponSkills) {
        const valueRoll = Math.floor(Math.random() * title.maxSkillRoll) + 1;
        skills[skill.id] = Math.max(skills[skill.id] ?? 0, valueRoll);
    }

    const equipment = assignEquipment(skills, isMilitary, hasWeapon);

    const newPerson = new Entity(name, skills, equipment);
    return newPerson;
}
