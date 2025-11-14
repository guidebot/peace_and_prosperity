import Select from 'react-select';
import { useState, useEffect } from 'react';
import { GiCancel, GiConfirmed } from 'react-icons/gi';
import { InfantryEquipment, CreateInfantryEquipment } from '../game/equipment';

export function EquipmentEditorModal({ isOpen, onClose, onSave, initialData }) {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const json = initialData
                ? JSON.stringify(initialData, null, 2)
                : JSON.stringify(CreateInfantryEquipment([InfantryEquipment[0].id])[0], null, 2);
            setJsonText(json);
            setError(null);
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonText);
            onSave(parsed);
            setError(null);
        } catch (e) {
            setError("Ошибка: " + e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-body" onClick={(e) => e.stopPropagation()}>
                <h3>{initialData ? "Редактировать снаряжение" : "Добавить снаряжение"}</h3>

                {!initialData && (
                    <div className="form-label">
                        <Select
                            options={InfantryEquipment.map(item => ({
                                value: item.id,
                                label: item.name,
                            }))}
                            placeholder="Выберите шаблон..."
                            noOptionsMessage={() => "Ничего не найдено"}
                            className="equipment-select" classNamePrefix="eq-select"
                            onChange={(opt) => {
                                if (opt) {
                                    const equipment = CreateInfantryEquipment([opt.value])[0];
                                    setJsonText(JSON.stringify(equipment, null, 2));
                                    setError(null);
                                }
                            }}
                            isSearchable
                            menuPlacement="auto"
                        />
                    </div>
                )}

                <textarea
                    title={error ? error : ""}
                    className={error ? "textarea error" : "textarea"}
                    value={jsonText}
                    onChange={(e) => {
                        setJsonText(e.target.value);
                        setError(null);
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button title="Так точно" onClick={handleSave}><GiConfirmed /></button>
                    <button title="Никак нет" onClick={onClose}><GiCancel /></button>
                </div>
            </div>
        </div>
    );
}