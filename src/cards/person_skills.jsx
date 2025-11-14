import { useState } from 'react';
import { MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { GiHealing } from 'react-icons/gi';
import { Level } from '../game/skills';
import { RollModal } from '../actions/roll';
import { TbFilter, TbFilterOff } from 'react-icons/tb';
import { CurrentUnit } from './utils';
import { PiBinocularsFill } from 'react-icons/pi';
import { PossibleTargets } from './utils';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions } from "../game/conditions";

export function CollapsibleSkillGroup({ players, actor, title, skills, currentSkills, onPropertyChange, onOtherChange, isOpen, toggle, addLogEntry }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();
    const [filterSkills, setFilterSkills] = useState(true);
    const [modalData, setModalData] = useState({});
    const resetModalData = () => setModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    const applyWatchEffect = (players, rolls, result, actor, target) => {
        const effects = applyWatchEffectWithConditions(players, rolls, result, actor, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    function calculateHealEffect(players, rolls, actors, target) {
        const actor = actors[0].actor;
        const skill = Level(actor.skills["MED"]) || 0;
        const result = rolls[0].roll + skill;
        const effect = result >= 12 ? "кровотечение остановлено" : "эффекта нет";
        const message = `${actor.name} оказывает первую помощь, d20=${rolls[0].roll}, результат ${result}, ${effect}.`;
        return [{ message: message }];
    }

    function applyHealEffect(players, rolls, actors, target) {
        const actor = actors[0].actor;
        const effects = calculateHealEffect(players, rolls, actors, target);
        const unit = CurrentUnit(players, actor);
        onOtherChange(unit.id, "stress", unit.stress + 2);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    return (
        <div>
            <button onClick={toggle}>
                {isOpen ? <MdArrowDropDown /> : <MdArrowRight />} {title}
            </button>
            {isOpen && (
                <button onClick={() => setFilterSkills(!filterSkills)}>
                    {filterSkills ? <TbFilterOff /> : <TbFilter />}
                </button>)}

            {
                modalData?.open && (
                    <RollModal
                        players={players}
                        actors={[{ actor: actor, equipment: modalData?.equipment }]}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
                        title={modalData?.title}
                        onCancel={resetModalData}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }

            <table className="skills-table" style={{ display: isOpen ? 'table' : 'none' }}>
                <thead>
                    <tr>
                        <td width={"60%"}>Навык</td>
                        <td>Уровень</td>
                        <td>Очки тренированности</td>
                        <td width={"50px"}></td>
                    </tr>
                </thead>
                <tbody>
                    {skills.map((skill) => {
                        const skillValue = currentSkills[skill.id] || 0;
                        if (filterSkills && skillValue === 0) return "";
                        return (
                            <tr key={skill.id}>
                                <td>{skill.name}</td>
                                <td>{Level(skillValue)}</td>
                                <td>
                                    <input
                                        key={skill.id}
                                        name={skill.id}
                                        type="number"
                                        min={0}
                                        value={skillValue}
                                        onChange={(e) => {
                                            const { name, value } = e.target;
                                            const newSkills = { ...currentSkills, [name]: Number(value) };
                                            onPropertyChange("skills", newSkills);
                                        }}
                                    />
                                </td>
                                <td>
                                    <div className='buttons-panel'>
                                        {skill.id === "MED" && skillValue > 0 && (<button title="Первая помощь" onClick={() => setModalData({
                                            open: true,
                                            actors: [actor],
                                            equipment: null,
                                            targets: [],
                                            title: "Первая помощь",
                                            onConfirm: applyHealEffect,
                                            calculateEffect: calculateHealEffect
                                        })} >
                                            <GiHealing />
                                        </button>)}
                                        {PossibleTargets(players, actor).length > 0 && skill.id === "MSK" && (<button title="Наблюдение" onClick={() => setModalData({
                                            open: true,
                                            actors: [actor],
                                            targets: PossibleTargets(players, actor),
                                            title: "Наблюдение",
                                            onConfirm: applyWatchEffect,
                                            calculateEffect: calculateWatchEffect
                                        })} >
                                            <PiBinocularsFill />
                                        </button>)}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div >
    );
}