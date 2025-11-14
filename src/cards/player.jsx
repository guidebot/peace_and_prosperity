import { unit } from "../game/unit";
import { RiTeamFill } from "react-icons/ri";

export function PlayerForm({ data, setPlayers, onChange }) {
    const handleCreateUnit = () => {
        const newUnit = new unit("Новый отряд", []);

        setPlayers((prevPlayers) => {
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
                <button title="Добавить отряд" onClick={handleCreateUnit}>
                    <RiTeamFill />
                </button>
            </div>
            <label className="form-label">
                <span>Название:</span>
                <input name="name" type="text" value={data.name} onChange={(e) => onChange(e.target.name, e.target.value)} />
            </label>
        </div>
    );
}