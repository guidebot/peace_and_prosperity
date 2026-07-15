import { useState, useCallback, useEffect, useMemo } from 'react';
import { CurrentUnit } from '../cards/utils';
import { SCALE_PREFIX } from '../game/Constants';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';

interface FireModalProps {
    players: Player[];
    actors: Array<{ actor: Entity; equipment?: Equipment }>;
    targets: Array<{ id: string; name: string; isHidden: boolean }>;
    isOpen: boolean;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => Array<{ message: string }>;
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => void;
}

interface FireExtra {
    selectedTargetId: string;
    selectedDef: string;
    selectedDistance: string;
    flankFire: boolean;
    reactionFire: boolean;
    blindFire: boolean;
    indirectFire: boolean;
    target: { id: string; name: string; isHidden: boolean } | null;
}

function createInitialExtra(players: Player[], targets: Array<{ id: string; name: string; isHidden: boolean }>, actors: Array<{ actor: Entity; equipment?: Equipment }>): FireExtra {
    const hasTargets = targets.length > 0;
    const target = hasTargets ? targets[0] : null;
    const currentUnit = CurrentUnit(players, actors[0].actor);
    const reactionFire = (currentUnit?.fatigue ?? 0) > 0;
    const blindFire = hasTargets ? (target?.isHidden ?? false) : false;

    return {
        selectedTargetId: targets[0]?.id || '',
        selectedDef: "0",
        selectedDistance: "1",
        flankFire: false,
        reactionFire,
        blindFire,
        indirectFire: false,
        target
    };
}

export function FireModal({
    players,
    actors,
    targets = [],
    isOpen,
    calculateEffect,
    onCancel,
    onConfirm
}: FireModalProps) {
    const hasTargets = targets.length > 0;
    const target = hasTargets ? targets[0] : null;

    const getRollsCallback = useCallback((rolls: ActorRoll[], extra: unknown) => {
        const e = (extra as FireExtra) ?? createInitialExtra(players, targets, actors);
        return rolls.map(pr => ({
            ...pr,
            flankFire: e.flankFire,
            reactionFire: e.reactionFire,
            blindFire: e.blindFire,
            indirectFire: e.indirectFire,
            selectedDef: Number(e.selectedDef),
            selectedDistance: e.selectedDistance
        }));
    }, [players, targets, actors]);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, _extra: unknown) => {
        const extra = _extra as FireExtra;
        return calculateEffect(players, rolls, actors, extra.target);
    }, [calculateEffect]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, extra: unknown) => {
        onConfirm(players, getRollsCallback(rolls, extra as FireExtra), actors, (extra as FireExtra).target);
    }, [onConfirm, getRollsCallback]);

    const renderFireModifiers = ({ selectedExtra, setSelectedExtra }: { selectedExtra: FireExtra; setSelectedExtra: (extra: FireExtra) => void }) => {
        return (
            <div>
                <label className="form-label">
                    <span>Пристрелка артиллерии</span>
                    <input
                        title='Модификатор огня непрямой наводкой'
                        type="checkbox"
                        checked={selectedExtra.indirectFire}
                        onChange={() => setSelectedExtra({ ...selectedExtra, indirectFire: !selectedExtra.indirectFire, flankFire: !selectedExtra.indirectFire })}
                    />
                </label>
                <label className="form-label">
                    <span>Внезапный огонь</span>
                    <input
                        title='Модификатор внезапного огня'
                        type="checkbox"
                        checked={selectedExtra.reactionFire}
                        onChange={() => setSelectedExtra({ ...selectedExtra, reactionFire: !selectedExtra.reactionFire })}
                    />
                </label>
                <label className="form-label">
                    <span>Фланговый огонь</span>
                    <input
                        title='Модификатор флангового огня (всегда при непрямой наводке)'
                        type="checkbox"
                        checked={selectedExtra.flankFire}
                        disabled={selectedExtra.indirectFire}
                        onChange={() => setSelectedExtra({ ...selectedExtra, flankFire: !selectedExtra.flankFire })}
                    />
                </label>
                <label className="form-label">
                    <span>Огонь вслепую</span>
                    <input
                        title='Модификатор огня вслепую'
                        type="checkbox"
                        checked={selectedExtra.blindFire}
                        onChange={() => setSelectedExtra({ ...selectedExtra, blindFire: !selectedExtra.blindFire })}
                    />
                </label>
            </div>
        );
    };

    const renderExtraFields = ({ selectedExtra, setSelectedExtra }: { selectedExtra: unknown; setSelectedExtra: (extra: unknown) => void }) => {
        const extra = selectedExtra as FireExtra;

        if (!hasTargets) return null;

        const selectedTarget = targets.find(t => t.id === extra.selectedTargetId) ?? targets[0];

        return (
            <>
                <label className="form-label">
                    <span>Цель:</span>
                    <select
                        value={extra.selectedTargetId}
                        onChange={(e) => {
                            const newTarget = targets.find(t => t.id === e.target.value) ?? targets[0];
                            setSelectedExtra({ ...extra, selectedTargetId: e.target.value, target: newTarget, blindFire: newTarget.isHidden });
                        }}
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
                {hasTargets && actors[0].equipment && (
                    renderFireModifiers({ selectedExtra: extra, setSelectedExtra: setSelectedExtra as (extra: FireExtra) => void })
                )}
            </>
        );
    };

    const initialExtra = useMemo(() => createInitialExtra(players, targets, actors), [players, targets, actors]);

    return (
        <BaseRollModal
            isOpen={isOpen}
            title="Стрельба"
            actors={actors}
            players={players}
            onCancel={onCancel}
            onConfirm={wrappedOnConfirm}
            calculateEffect={wrappedCalculateEffect}
            getRollsCallback={getRollsCallback}
            initialExtra={initialExtra}
            renderExtraFields={renderExtraFields}
        />
    );
}