import { useCallback } from 'react';
import { vehicleTypes, VehicleType } from '../game/VehicleTypes';
import { BaseRollModal, ActorRoll } from './BaseRollModal';
import { Player } from '../game/Player';
import { Entity } from '../game/Entity';

interface DriveModalProps {
    isOpen: boolean;
    title: string;
    actor: Entity;
    players: Player[];
    onCancel: () => void;
    onConfirm: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, vehicleType: VehicleType) => void;
    calculateEffect: (players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, vehicleType: VehicleType) => Array<{ message: string; success: boolean; vehicleType: VehicleType }>;
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
    const initialExtra = { selectedVehicleType: vehicleTypes[0] };

    const getRollsCallback = useCallback((rolls: ActorRoll[]) => {
        return rolls;
    }, []);

    const wrappedCalculateEffect = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, extraData: unknown) => {
        const { selectedVehicleType } = extraData as { selectedVehicleType: VehicleType };
        return calculateEffect(players, rolls, actors, selectedVehicleType);
    }, [calculateEffect]);

    const wrappedOnConfirm = useCallback((players: Player[], rolls: ActorRoll[], actors: Array<{ actor: Entity }>, extraData: unknown) => {
        const { selectedVehicleType } = extraData as { selectedVehicleType: VehicleType };
        onConfirm(players, rolls, actors, selectedVehicleType);
    }, [onConfirm]);

    const renderExtraFields = ({ selectedExtra, setSelectedExtra }: { selectedExtra: unknown; setSelectedExtra: (extra: unknown) => void }) => {
        const { selectedVehicleType: currentVehicleType } = selectedExtra as { selectedVehicleType: VehicleType };

        return (
            <label className='form-label'>
                <span style={{ width: "150px" }}>Тип:</span>
                <select
                    value={currentVehicleType.id}
                    onChange={(e) => setSelectedExtra({ selectedVehicleType: vehicleTypes.find(vt => vt.id === e.target.value)! })}
                >
                    {vehicleTypes.map(vt => (
                        <option key={vt.id} value={vt.id}>
                            {vt.name}
                        </option>
                    ))}
                </select>
            </label>
        );
    };

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
            initialExtra={initialExtra}
            renderExtraFields={renderExtraFields}
        />
    );
}