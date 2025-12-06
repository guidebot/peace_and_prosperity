import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { GiCancel, GiConfirmed } from 'react-icons/gi';
import { CurrentUnit } from '../cards/utils';

export function RollModal({ players, actors, title, targets = [], isOpen, calculateEffect, onCancel, onConfirm }) {
    const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.id || '');

    const currentUnit = CurrentUnit(players, actors[0].actor);
    const [reactionFire, setReactionFire] = useState((currentUnit?.fatigue ?? 0) > 0);

    const hasTargets = targets.length > 0;
    const target = hasTargets ? targets.find(t => t.id === selectedTargetId) : null;

    const [blindFire, setBlindFire] = useState(hasTargets ? target.isHidden : false);

    const [selectedDef, setSelectedDef] = useState("0");
    const [selectedDistance, setSelectedDistance] = useState("1");
    const [flankFire, setFlankFire] = useState(false);
    const [indirectFire, setIndirectFire] = useState(false);
    const [pureRolls, setPureRolls] = useState(actors.map(actor => {
        const roll = Math.floor(Math.random() * 20) + 1;
        return { id: actor.actor.id, roll: roll };
    }));

    const getRollsCallback = useCallback(() => {
        return pureRolls.map(pr => { return { id: pr.id, roll: pr.roll, flankFire: flankFire, reactionFire: reactionFire, blindFire: blindFire, indirectFire: indirectFire, selectedDef: Number(selectedDef), selectedDistance: selectedDistance } });
    }, [pureRolls, flankFire, reactionFire, blindFire, indirectFire, selectedDef, selectedDistance]);

    const [effects, setEffects] = useState([{}]);

    useEffect(() => {
        setEffects(calculateEffect(players, getRollsCallback(), actors, target));
    }, [selectedDef, selectedDistance, selectedTargetId, reactionFire, flankFire, blindFire, indirectFire, pureRolls, calculateEffect, actors, getRollsCallback, players, target]);

    useEffect(() => {
        setBlindFire(target ? target.isHidden : false);
    }, [target]);

    if (!isOpen) return null;

    function setRoll(id, value) {
        setPureRolls(prevRolls => {
            return prevRolls.map(r => {
                if (r.id === id) {
                    return {
                        ...r,
                        roll: Number(value)
                    };
                }
                return r;
            });
        })
    }

    return (
        <div className='modal-overlay'>
            <h3>{title}</h3>
            <div className="modal-body">
                {
                    actors.map((actor, i) => (
                        <label key={actor.actor.id} className='form-label'>
                            <span style={{ width: "150px" }}>{actor.actor.name}</span>
                            <input
                                key={actor.actor.id}
                                name={actor.actor.id}
                                min={1}
                                max={20}
                                type="number"
                                value={pureRolls.find(r => r.id === actor.actor.id).roll}
                                onChange={(e) => setRoll(actor.actor.id, Number(e.target.value))}
                            />
                            {effects && effects.length > 0 && <span style={{ textAlign: "left", width: "100%", fontSize: "10px" }}>{effects[i]?.message}</span>}
                        </label>
                    ))
                }

                {hasTargets && (
                    <>
                        <label className="form-label">
                            <span>Цель:</span>
                            <select
                                value={selectedTargetId}
                                onChange={(e) => setSelectedTargetId(e.target.value)}
                            >
                                {targets.map((target) => (
                                    <option key={target.id} value={target.id}>
                                        {target.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-label">
                            <span>Укрытие:</span>
                            <select
                                value={selectedDef}
                                onChange={(e) => setSelectedDef(e.target.value)}
                            >
                                <option key="light_def" value="0">
                                    Отсутствует или маскирующее
                                </option>
                                <option key="mid_def" value="2">
                                    Среднее
                                </option>
                                <option key="strong_def" value="4">
                                    Надёжное
                                </option>
                            </select>
                        </label>
                        {actors[0].equipment && ((actors[0].equipment.bestRange !== actors[0].equipment.effectiveRange && actors[0].equipment.bestRange > 0) || actors[0].equipment.effectiveRange !== actors[0].equipment.maxRange) && (<label className="form-label">
                            <span>Дистанция:</span>
                            <select
                                value={selectedDistance}
                                onChange={(e) => setSelectedDistance(e.target.value)}
                            >
                                <option key="best_range" value="0">
                                    Идеальная (до {actors[0].equipment.bestRange})
                                </option>
                                <option key="effective_range" value="1">
                                    Эффективная (от {actors[0].equipment.bestRange} до {actors[0].equipment.effectiveRange})
                                </option>
                                <option key="max_range" value="2">
                                    Максимальная (от {actors[0].equipment.effectiveRange} до {actors[0].equipment.maxRange})
                                </option>
                            </select>
                        </label>)}
                    </>
                )}
                {hasTargets && actors[0].equipment && (actors[0].equipment.he > 0 || actors[0].equipment.ap > 0) && (
                    <div>
                        <label className="form-label">
                            <span>Пристрелка артиллерии</span>
                            <input title='Модификатор огня непрямой наводкой' type="checkbox" checked={indirectFire} onChange={() => { setIndirectFire(!indirectFire); if (!indirectFire) { setFlankFire(true); setReactionFire(false); } }} />
                        </label>
                        {!indirectFire && (<label className="form-label">
                            <span>Внезапный огонь</span>
                            <input title='Модификатор внезапного огня' type="checkbox" checked={reactionFire} onChange={() => setReactionFire(!reactionFire)} />
                        </label>)}
                        <label className="form-label">
                            <span>Фланговый огонь</span>
                            <input title='Модификатор флангового огня' type="checkbox" checked={flankFire} onChange={() => setFlankFire(!flankFire)} />
                        </label>
                        <label className="form-label">
                            <span>Огонь вслепую</span>
                            <input title='Модификатор огня вслепую' type="checkbox" checked={blindFire} onChange={() => setBlindFire(!blindFire)} />
                        </label>
                    </div>
                )}
            </div>

            <div className="buttons-panel" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button title="Так точно" onClick={() => onConfirm(players, getRollsCallback(), actors, hasTargets ? targets.find(t => t.id === selectedTargetId) : null)}><GiConfirmed /></button>
                <button title="Никак нет" onClick={onCancel}><GiCancel /></button>
            </div>
        </div>
    );
}