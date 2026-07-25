import { useState } from 'react';
import { MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { GiHealing } from 'react-icons/gi';
import { Level } from '../game/Skill';
import { DriveModal } from '../actions/DriveModal';
import { WatchModal } from '../actions/WatchModal';
import { FirstAidModal } from '../actions/FirstAidModal';
import { TbFilter, TbFilterOff, TbSteeringWheel } from 'react-icons/tb';
import { PiBinocularsFill } from 'react-icons/pi';
import { PossibleTargets } from './utils';
import { CalculateWatchEffectWithConditions, ApplyWatchEffectWithConditions } from "../game/conditions";

function SkillsHeader({ isOpen, toggle, filterZeroSkills, setFilterZeroSkills }) {
    return (
        <div className="skills-header">
            <div className="buttons-panel">
                <button onClick={toggle}>
                    {isOpen ? <MdArrowDropDown /> : <MdArrowRight />} Навыки
                </button>
                {isOpen && (
                    <button onClick={() => setFilterZeroSkills(!filterZeroSkills)}>
                        {filterZeroSkills ? <TbFilterOff /> : <TbFilter />}
                    </button>
                )}
            </div>
        </div>
    );
}

function SkillsTableHeader() {
    return (
        <thead>
            <tr>
                <td className='big-table-header'>Действия</td>
                <td className='big-table-header'>Наименование</td>
                <td className='big-table-header'>Очки<br/>тренированности</td>
                <td className='big-table-header'>Уровень</td>
            </tr>
        </thead>
    );
}

function AttributeHeader({ title }) {
    return (
        <tr className="skill-group-header">
            <td colSpan={4}>
                <div className="buttons-panel">
                    <span className="attribute-title">{title}</span>
                </div>
            </td>
        </tr>
    );
}

function SkillRows({ players, actor, skills, currentSkills, onPropertyChange, filterZeroSkills, modalData, setModalData, addLogEntry, resetModalData }) {
    const calculateWatchEffect = CalculateWatchEffectWithConditions();
    const applyWatchEffectWithConditions = ApplyWatchEffectWithConditions();

    const applyWatchEffect = (players, rolls, result, actor, target) => {
        const effects = applyWatchEffectWithConditions(players, rolls, result, actor, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    function calculateHealEffect(players, rolls, actors, target) {
        const actor = actors[0].actor;
        const skill = Level(actor.skills["MED"]) || 0;
        const result = rolls[0].roll + skill;
        const effect = result >= 20 ? "кровотечение остановлено" : "эффекта нет";
        const message = `${actor.name} оказывает первую помощь, d20=${rolls[0].roll}, результат ${result}, ${effect}.`;
        return [{ message: message }];
    }

    function applyHealEffect(players, rolls, actors, target) {
        const effects = calculateHealEffect(players, rolls, actors, target);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    function calculateMechanicsEffect(players, rolls, actors, vehicleType) {
        const actor = actors[0].actor;
        const skill = actor.skills["MCH"] || 0;
        const roll = rolls[0].roll;
        const result = roll + skill;
        const success = result >= vehicleType.threshold;
        const message = `${actor.name} управляет (${vehicleType.name}), d20=${roll}, результат ${result}: ${success ? 'успех' : 'неудача'}.`;
        return [{ message, success, vehicleType }];
    }

    function applyMechanicsEffect(players, rolls, actors, vehicleType) {
        const effects = calculateMechanicsEffect(players, rolls, actors, vehicleType);
        addLogEntry(effects[0].message);
        resetModalData();
    }

    return (
        <>
            {skills.map((skill) => {
                const skillValue = currentSkills[skill.id] || 0;
                if (filterZeroSkills && skillValue === 0) return null;
                return (
                    <tr key={skill.id}>
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
                                {skill.id === "MCH" && skillValue > 0 && (<button title="Управление транспортом" onClick={() => setModalData({
                                    open: true,
                                    type: 'mechanics',
                                    actor: actor,
                                    title: "Управление транспортом",
                                    onConfirm: applyMechanicsEffect,
                                    calculateEffect: calculateMechanicsEffect
                                })} >
                                    <TbSteeringWheel />
                                </button>)}
                                {PossibleTargets(players, actor).length > 0 && skill.id === "STE" && (<button title="Наблюдение" onClick={() => setModalData({
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
                        <td>{skill.name}</td>
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
                        <td>{Level(skillValue)}</td>
                    </tr>
                );
            })}
        </>
    );
}

function SkillsModals({ players, modalData, setModalData }) {
    const onCancel = () => setModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });
    return (
        <>
            {
                modalData?.open && modalData?.type === 'mechanics' && (
                    <DriveModal
                        isOpen={modalData?.open || false}
                        title={modalData?.title}
                        onCancel={onCancel}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                        actor={modalData?.actor}
                        players={players}
                    />
                )
            }
            {
                modalData?.open && modalData?.title === "Наблюдение" && (
                    <WatchModal
                        players={players}
                        actors={[{ actor: modalData?.actors?.[0] }]}
                        targets={modalData?.targets}
                        isOpen={modalData?.open || false}
                        onCancel={onCancel}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }
            {
                modalData?.open && modalData?.title === "Первая помощь" && (
                    <FirstAidModal
                        players={players}
                        actors={[{ actor: modalData?.actors?.[0] }]}
                        isOpen={modalData?.open || false}
                        onCancel={onCancel}
                        onConfirm={modalData?.onConfirm}
                        calculateEffect={modalData?.calculateEffect}
                    />
                )
            }
        </>
    );
}

export function SkillsTable({
    groups,
    isOpen,
    toggle,
    filterZeroSkills,
    setFilterZeroSkills,
    players,
    actor,
    currentSkills,
    onPropertyChange,
    onOtherChange,
    addLogEntry,
    modalData,
    setModalData
}) {
    const resetModalData = () => setModalData({ open: false, title: "", targets: [], onConfirm: () => { }, calculateEffect: () => { } });

    return (
        <div className="skills-table-wrapper">
            <SkillsHeader
                isOpen={isOpen}
                toggle={toggle}
                filterZeroSkills={filterZeroSkills}
                setFilterZeroSkills={setFilterZeroSkills}
            />
            <table className="skills-table" style={{ display: isOpen ? 'table' : 'none' }}>
                <SkillsTableHeader />
                <tbody>
                    {groups.map((group) => (
                        <>
                            <AttributeHeader title={group.title} key={`attr-${group.title}`} />
                            <SkillRows
                                players={players}
                                actor={actor}
                                skills={group.skills}
                                currentSkills={currentSkills}
                                onPropertyChange={onPropertyChange}
                                filterZeroSkills={filterZeroSkills}
                                modalData={modalData}
                                setModalData={setModalData}
                                addLogEntry={addLogEntry}
                                resetModalData={resetModalData}
                            />
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkillsModalsWrapper({ players, modalData, setModalData }) {
    return <SkillsModals players={players} modalData={modalData} setModalData={setModalData} />;
}