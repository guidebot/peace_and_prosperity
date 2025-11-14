import { PersonForm } from './person';
import { UnitForm } from './unit';
import { PlayerForm } from './player';
import { UpdateCardProperty } from './utils';

const TypeTitle = {
    entity: "Персонаж",
    unit: "Отряд",
    player: "Группа"
}

export function ObjectCard({ players, node, setPlayers, addLogEntry }) {
    const getData = (nodes, id) => {
        for (const element of nodes) {
            if (element.id === id)
                return element;

            if (element.children) {
                const el = getData(element.children, id);
                if (el) {
                    return el;
                }
            }
        }

        return null;
    }

    const data = getData(players, node);

    if (!data) return;

    const handlePropertyChange = (name, value) => {
        handleOtherPropertyChange(node, name, value);
    };

    const handleOtherPropertyChange = (id, name, value) => {
        setPlayers(prev => UpdateCardProperty(prev, id, name, value));
    };

    const renderForm = () => {
        switch (data.type) {
            case "entity":
                return <PersonForm
                    players={players}
                    data={data}
                    addLogEntry={addLogEntry}
                    onPropertyChange={handlePropertyChange}
                    onOtherChange={handleOtherPropertyChange} />;
            case 'unit':
                return <UnitForm
                    players={players}
                    data={data}
                    onChange={handlePropertyChange}
                    onOtherChange={handleOtherPropertyChange}
                    setPlayers={setPlayers}
                    addLogEntry={addLogEntry} />;
            case 'player':
                return <PlayerForm data={data} onChange={handlePropertyChange} setPlayers={setPlayers} addLogEntry={addLogEntry} />;
            default:
                console.error('Невозможно отбразить данные:', data);
        }
    };

    return (
        <div className='object-card'>
            <h1>{TypeTitle[data.type]}</h1>
            {renderForm()}
        </div>
    );
}