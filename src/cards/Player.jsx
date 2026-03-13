import { Unit } from "../game/Unit";
import { RiTeamFill } from "react-icons/ri";
import { generateUnitName } from "../game/callsigns";

export function PlayerForm({ data, setPlayers, onChange }) {
    const handleCreateUnit = () => {
        setPlayers((prevPlayers) => {
            const existingUnitNames = prevPlayers.flatMap(player => 
                (player.children || []).map(unit => unit.name)
            );
            const newUnit = new Unit(generateUnitName(existingUnitNames), []);
            return prevPlayers.map(player => {
                if (player.id === data.id) {
                    return {
                        ...player,
                        children: [...(player.children || []), newUnit]
                    };
                }
                return player;
            });
        });
    };

    return (
        <div>
            <div className='buttons-panel'>
                <label className="form-label">
                    <span>Фракция:</span>
                    <input name="name" type="text" value={data.name} onChange={(e) => onChange(e.target.name, e.target.value)} />
                </label>
                <button title="Добавить отряд" onClick={handleCreateUnit}>
                    <RiTeamFill />
                </button>
            </div>
        </div>
    );
}