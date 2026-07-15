import { useCallback, useMemo } from 'react';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';
import { SCALE_PREFIX } from '../game/Constants';

interface WatchModalProps {
    players: Player[];
    actors: Array<{ actor: Entity; equipment?: Equipment }>;
    targets: Array<{ id: string; name: string; isHidden: boolean }>;
    isOpen: boolean;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => Array<{ message: string }>;
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: { id: string; name: string; isHidden: boolean } | null) => void;
}

interface WatchExtra {
    selectedTargetId: string;
    selectedDef: string;
    selectedDistance: string;
    target: { id: string; name: string; isHidden: boolean } | null;
}

function createInitialWatchExtra(targets: Array<{ id: string; name: string; isHidden: boolean }>): WatchExtra {
    return {
        selectedTargetId: targets[0]?.id || '',
        selectedDef: "0",
        selectedDistance: "1",
        target: targets[0] ?? null
    };
}

export function WatchModal({
    players,
    actors,
    targets = [],
    isOpen,
    calculateEffect,
    onCancel,
    onConfirm
}: WatchModalProps) {
    const hasTargets = targets.length > 0;
    const target = hasTargets ? targets[0] : null;

    const getRollsCallback = useCallback((rolls: ActorRoll[], extra: unknown) => {
        const e = (extra as WatchExtra) ?? createInitialWatchExtra(targets);
        return rolls.map(pr => ({
            ...pr,
            selectedDef: Number(e.selectedDef),
            selectedDistance: e.selectedDistance
        }));
    }, [targets]);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, _extra: unknown) => {
        const extra = _extra as WatchExtra;
        return calculateEffect(players, rolls, actors, extra.target);
    }, [calculateEffect]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, extra: unknown) => {
        onConfirm(players, getRollsCallback(rolls, extra as WatchExtra), actors, (extra as WatchExtra).target);
    }, [onConfirm, getRollsCallback]);

    const renderExtraFields = ({ selectedExtra, setSelectedExtra }: { selectedExtra: unknown; setSelectedExtra: (extra: unknown) => void }) => {
        const extra = selectedExtra as WatchExtra;

        if (!hasTargets) return null;

        const selectedTarget = targets.find(t => t.id === extra.selectedTargetId) ?? targets[0];

        return (
            <>
                <label className="form-label">
                    <span>Цель:</span>
                    <select
                        value={extra.selectedTargetId}
                        onChange={(e) => setSelectedExtra({ ...extra, selectedTargetId: e.target.value, target: selectedTarget })}
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
            </>
        );
    };

    const initialExtra = useMemo(() => createInitialWatchExtra(targets), [targets]);

    return (
        <BaseRollModal
            isOpen={isOpen}
            title="Наблюдение"
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