import { useState, useEffect } from 'react';
import { GiConfirmed, GiCancel } from 'react-icons/gi';
import { vehicleTypes, VehicleType } from '../game/VehicleTypes';

interface Props {
    isOpen: boolean;
    title: string;
    onCancel: () => void;
    onConfirm: (players: unknown, rolls: Array<{ id: string; roll: number }>, actors: Array<{ actor: unknown }>, vehicleType: VehicleType) => void;
    calculateEffect: (players: unknown, rolls: Array<{ id: string; roll: number }>, actors: Array<{ actor: unknown }>, vehicleType: VehicleType) => Array<{ message: string; success: boolean; vehicleType: VehicleType }>;
    actor: unknown;
    players: unknown;
}

export function DriveModal({ isOpen, title, onCancel, onConfirm, calculateEffect, actor, players }: Props) {
    if (!isOpen) return null;

    const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(vehicleTypes[0]);
    const [roll, setRoll] = useState(() => Math.floor(Math.random() * 20) + 1);
    const [effect, setEffect] = useState<{ message: string; success: boolean; vehicleType: VehicleType } | null>(null);

    const rolls = [{ id: (actor as { id: string }).id, roll }];

    useEffect(() => {
        const eff = calculateEffect(players, rolls, [{ actor }], selectedVehicleType);
        setEffect(eff[0]);
    }, [roll, selectedVehicleType, calculateEffect, actor, players]);

    const handleConfirm = () => {
        onConfirm(players, rolls, [{ actor }], selectedVehicleType);
    };

    return (
        <div className='modal-overlay'>
            <h3>{title}</h3>
            <div className="modal-body">
                <label className='form-label'>
                    <span style={{ width: "150px" }}>Тип:</span>
                    <select
                        value={selectedVehicleType.id}
                        onChange={(e) => setSelectedVehicleType(vehicleTypes.find(vt => vt.id === e.target.value)!)}
                    >
                        {vehicleTypes.map(vt => (
                            <option key={vt.id} value={vt.id}>
                                {vt.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='form-label'>
                    <span style={{ width: "150px" }}>Бросок d20:</span>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={roll}
                        onChange={(e) => setRoll(Math.max(1, Math.min(20, Number(e.target.value))))}
                    />
                    {effect && (
                        <span style={{ textAlign: "left", width: "100%", fontSize: "10px" }}>{effect.message}</span>
                    )}
                </label>
            </div>
            <div className="buttons-panel" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button title="Так точно" onClick={handleConfirm}><GiConfirmed /></button>
                <button title="Никак нет" onClick={onCancel}><GiCancel /></button>
            </div>
        </div>
    );
}