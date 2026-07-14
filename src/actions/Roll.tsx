import { useState, useCallback, useEffect, useMemo } from 'react';
import { CurrentUnit } from '../cards/utils';
import { SCALE_PREFIX } from '../game/Constants';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';

interface RollModalProps {
    players: Player[];
    actors: Array<{ actor: Entity; equipment?: Equipment }>;
    title: string;
    targets: Array<{ id: string; name: string; isHidden: boolean }>;
    isOpen: boolean;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => Array<{ message: string }>;
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => void;
}

export function RollModal({
    players,
    actors,
    title,
    targets = [],
    isOpen,
    calculateEffect,
    onCancel,
    onConfirm
}: RollModalProps) {
    const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.id || '');

    const currentUnit = CurrentUnit(players, actors[0].actor);
    const [reactionFire, setReactionFire] = useState((currentUnit?.fatigue ?? 0) > 0);

    const hasTargets = targets.length > 0;
    const target: { id: string; name: string; isHidden: boolean } | null = hasTargets ? targets.find(t => t.id === selectedTargetId) ?? null : null;

    const [blindFire, setBlindFire] = useState(hasTargets ? (target?.isHidden ?? false) : false);
    const [selectedDef, setSelectedDef] = useState("0");
    const [selectedDistance, setSelectedDistance] = useState("1");
    const [flankFire, setFlankFire] = useState(false);
    const [indirectFire, setIndirectFire] = useState(false);

    interface RollExtra {
        selectedTargetId: string;
        selectedDef: string;
        selectedDistance: string;
        flankFire: boolean;
        reactionFire: boolean;
        blindFire: boolean;
        indirectFire: boolean;
        target: { id: string; name: string; isHidden: boolean } | null;
    }

    const extra = useMemo<RollExtra>(() => ({
        selectedTargetId,
        selectedDef,
        selectedDistance,
        flankFire,
        reactionFire,
        blindFire,
        indirectFire,
        target
    }), [selectedTargetId, selectedDef, selectedDistance, flankFire, reactionFire, blindFire, indirectFire, target]);

    const getRollsCallback = useCallback((rolls: ActorRoll[]) => {
        return rolls.map(pr => ({
            ...pr,
            flankFire,
            reactionFire,
            blindFire,
            indirectFire,
            selectedDef: Number(selectedDef),
            selectedDistance
        }));
    }, [flankFire, reactionFire, blindFire, indirectFire, selectedDef, selectedDistance]);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, _extra: unknown) => {
        return calculateEffect(players, rolls, actors, target);
    }, [calculateEffect, target]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, _extra: unknown) => {
        onConfirm(players, getRollsCallback(rolls), actors, target);
    }, [onConfirm, getRollsCallback, target]);

    const renderExtraFields = ({ selectedExtra: _selectedExtra, setSelectedExtra }: { selectedExtra: unknown; setSelectedExtra: (extra: unknown) => void }) => {
        const extra = _selectedExtra as RollExtra;

        if (!hasTargets) return null;

        return (
            <>
                <label className="form-label">
                    <span>Цель:</span>
                    <select
                        value={extra.selectedTargetId}
                        onChange={(e) => setSelectedExtra({ ...extra, selectedTargetId: e.target.value })}
                    >
                        {targets.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </label>
                <label className="form-label">
                    <span>Укрытие:</span>
                    <select
                        value={extra.selectedDef}
                        onChange={(e) => setSelectedExtra({ ...extra, selectedDef: e.target.value })}
                    >
                        <option key="light_def" value="0">Отсутствует или маскирующее</option>
                        <option key="mid_def" value="2">Среднее</option>
                        <option key="strong_def" value="4">Надёжное</option>
                    </select>
                </label>
                {actors[0].equipment && ((actors[0].equipment.bestRange !== actors[0].equipment.effectiveRange && actors[0].equipment.bestRange > 0) || actors[0].equipment.effectiveRange !== actors[0].equipment.maxRange) && (
                    <label className="form-label">
                        <span>Дистанция:</span>
                        <select
                            value={extra.selectedDistance}
                            onChange={(e) => setSelectedExtra({ ...extra, selectedDistance: e.target.value })}
                        >
                            <option key="best_range" value="0">
                                Идеальная (до {actors[0].equipment.bestRange + SCALE_PREFIX})
                            </option>
                            <option key="effective_range" value="1">
                                Эффективная (от {actors[0].equipment.bestRange + SCALE_PREFIX} до {actors[0].equipment.effectiveRange + SCALE_PREFIX})
                            </option>
                            <option key="max_range" value="2">
                                Максимальная (от {actors[0].equipment.effectiveRange + SCALE_PREFIX} до {actors[0].equipment.maxRange + SCALE_PREFIX})
                            </option>
                        </select>
                    </label>
                )}
                {hasTargets && actors[0].equipment && (actors[0].equipment.he > 0 || actors[0].equipment.ap > 0) && (
                    <div>
                        <label className="form-label">
                            <span>Пристрелка артиллерии</span>
                            <input
                                title='Модификатор огня непрямой наводкой'
                                type="checkbox"
                                checked={extra.indirectFire}
                                onChange={() => setSelectedExtra({ ...extra, indirectFire: !extra.indirectFire, flankFire: !extra.indirectFire, reactionFire: extra.indirectFire })}
                            />
                        </label>
                        {!extra.indirectFire && (
                            <label className="form-label">
                                <span>Внезапный огонь</span>
                                <input
                                    title='Модификатор внезапного огня'
                                    type="checkbox"
                                    checked={extra.reactionFire}
                                    onChange={() => setSelectedExtra({ ...extra, reactionFire: !extra.reactionFire })}
                                />
                            </label>
                        )}
                        <label className="form-label">
                            <span>Фланговый огонь</span>
                            <input
                                title='Модификатор флангового огня'
                                type="checkbox"
                                checked={extra.flankFire}
                                onChange={() => setSelectedExtra({ ...extra, flankFire: !extra.flankFire })}
                            />
                        </label>
                        <label className="form-label">
                            <span>Огонь вслепую</span>
                            <input
                                title='Модификатор огня вслепую'
                                type="checkbox"
                                checked={extra.blindFire}
                                onChange={() => setSelectedExtra({ ...extra, blindFire: !extra.blindFire })}
                            />
                        </label>
                    </div>
                )}
            </>
        );
    };

    useEffect(() => {
        setBlindFire(target?.isHidden ?? false);
    }, [target]);

    return (
        <BaseRollModal
            isOpen={isOpen}
            title={title}
            actors={actors}
            players={players}
            onCancel={onCancel}
            onConfirm={wrappedOnConfirm}
            calculateEffect={wrappedCalculateEffect}
            getRollsCallback={getRollsCallback}
            initialExtra={extra}
            renderExtraFields={renderExtraFields}
        />
    );
}