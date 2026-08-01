import { useCallback, useMemo } from 'react';
import { vehicleTypes, VehicleType, getVehicleTypeById } from '../game/VehicleTypes';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';
import { CurrentUnit } from '../cards/utils';

interface DriveModalProps {
    isOpen: boolean;
    title: string;
    actor: Entity;
    players: Player[];
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, vehicleType: VehicleType) => void;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, vehicleType: VehicleType) => Array<{ message: string; success: boolean; vehicleType: VehicleType }>;
}

function getVehicleTypeFromUnit(actor: Entity, players: Player[]): VehicleType {
    const unit = CurrentUnit(players, actor);
    if (unit?.vehicle?.type) {
        const vehicleType = getVehicleTypeById(unit.vehicle.type);
        if (vehicleType) return vehicleType;
    }
    return vehicleTypes[0];
}

export function DriveModal({
    isOpen,
    title,
    actor,
    players,
    onCancel,
    onConfirm,
    calculateEffect
}: DriveModalProps) {
    const vehicleType = useMemo(() => getVehicleTypeFromUnit(actor, players), [actor, players]);

    const getRollsCallback = useCallback((rolls: ActorRoll[]) => {
        return rolls;
    }, []);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>) => {
        return calculateEffect(players, rolls, actors, vehicleType);
    }, [calculateEffect, vehicleType]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>) => {
        onConfirm(players, rolls, actors, vehicleType);
    }, [onConfirm, vehicleType]);

    return (
        <BaseRollModal
            isOpen={isOpen}
            title={title}
            actors={[{ actor }]}
            players={players}
            onCancel={onCancel}
            onConfirm={wrappedOnConfirm}
            calculateEffect={wrappedCalculateEffect}
            getRollsCallback={getRollsCallback}
        />
    );
}