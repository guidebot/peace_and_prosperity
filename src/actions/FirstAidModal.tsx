import { useCallback, useMemo } from 'react';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';

interface FirstAidModalProps {
    players: Player[];
    actors: Array<{ actor: Entity; equipment?: Equipment }>;
    isOpen: boolean;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: null) => Array<{ message: string }>;
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, target: null) => void;
}

export function FirstAidModal({
    players,
    actors,
    isOpen,
    calculateEffect,
    onCancel,
    onConfirm
}: FirstAidModalProps) {
    const extra = useMemo(() => ({}), []);

    const getRollsCallback = useCallback((rolls: ActorRoll[], _extra: unknown) => {
        return rolls;
    }, []);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, _extra: unknown) => {
        return calculateEffect(players, rolls, actors, null);
    }, [calculateEffect]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, extra: unknown) => {
        onConfirm(players, getRollsCallback(rolls, extra), actors, null);
    }, [onConfirm, getRollsCallback]);

    return (
        <BaseRollModal
            isOpen={isOpen}
            title="Первая помощь"
            actors={actors}
            players={players}
            onCancel={onCancel}
            onConfirm={wrappedOnConfirm}
            calculateEffect={wrappedCalculateEffect}
            getRollsCallback={getRollsCallback}
            initialExtra={extra}
            renderExtraFields={() => null}
        />
    );
}