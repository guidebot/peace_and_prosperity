import { useState, useCallback, useEffect } from 'react';
import { GiCancel, GiConfirmed } from 'react-icons/gi';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { Equipment } from '../game/Equipment';

export interface ActorRoll {
    id: string;
    roll: number;
    [key: string]: unknown;
}

export interface BaseModalProps {
    isOpen: boolean;
    title: string;
    actors: Array<{ actor: Entity; equipment?: Equipment }>;
    players: Player[];
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, extra: unknown) => void;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity; equipment?: Equipment }>, extra: unknown) => Array<{ message: string }>;
    children?: React.ReactNode;
    renderExtraFields?: (params: {
        rolls: ActorRoll[];
        setRolls: React.Dispatch<React.SetStateAction<ActorRoll[]>>;
        effects: Array<{ message: string }>;
        selectedExtra: unknown;
        setSelectedExtra: React.Dispatch<React.SetStateAction<unknown>>;
    }) => React.ReactNode;
    getRollsCallback?: (rolls: ActorRoll[], extra: unknown) => ActorRoll[];
    initialExtra?: unknown;
}

export function BaseRollModal({
    isOpen,
    title,
    actors,
    players,
    onCancel,
    onConfirm,
    calculateEffect,
    children,
    renderExtraFields,
    getRollsCallback,
    initialExtra = null
}: BaseModalProps) {
    const [rolls, setRolls] = useState<ActorRoll[]>(() =>
        actors.map(actor => ({
            id: actor.actor.id,
            roll: Math.floor(Math.random() * 20) + 1
        }))
    );

    const [selectedExtra, setSelectedExtra] = useState<unknown>(initialExtra);
    const [effects, setEffects] = useState<Array<{ message: string }>>([{ message: '' }]);

    const getRolls = useCallback(() => {
        if (getRollsCallback) {
            return getRollsCallback(rolls, selectedExtra);
        }
        return rolls;
    }, [rolls, selectedExtra, getRollsCallback]);

    useEffect(() => {
        if (isOpen) {
            setEffects(calculateEffect(players, getRolls(), actors, selectedExtra));
        }
    }, [players, getRolls, actors, selectedExtra, calculateEffect, isOpen]);

    if (!isOpen) return null;

    const handleRollChange = (id: string, value: number) => {
        setRolls(prev => prev.map(r =>
            r.id === id ? { ...r, roll: Math.max(1, Math.min(20, value)) } : r
        ));
    };

    const handleConfirm = () => {
        onConfirm(players, getRolls(), actors, selectedExtra);
    };

    return (
        <div className='modal-overlay'>
            <h3>{title}</h3>
            <div className="modal-body">
                {actors.map((actor, i) => (
                    <label key={actor.actor.id} className='form-label'>
                        <span style={{ width: "150px" }}>{actor.actor.name}</span>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={rolls.find(r => r.id === actor.actor.id)?.roll ?? 1}
                            onChange={(e) => handleRollChange(actor.actor.id, Number(e.target.value))}
                        />
                        {effects && effects.length > 0 && (
                            <span style={{ textAlign: "left", width: "100%", fontSize: "10px" }}>
                                {effects[i]?.message}
                            </span>
                        )}
                    </label>
                ))}

                {renderExtraFields && renderExtraFields({
                    rolls,
                    setRolls,
                    effects,
                    selectedExtra,
                    setSelectedExtra
                })}

                {children}
            </div>
            <div className="buttons-panel" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button title="Так точно" onClick={handleConfirm}><GiConfirmed /></button>
                <button title="Никак нет" onClick={onCancel}><GiCancel /></button>
            </div>
        </div>
    );
}