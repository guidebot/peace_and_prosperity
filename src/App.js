import './App.css';
import { useState, useRef, useEffect } from 'react';
import { MainMenu } from "./main_menu"
import { ObjectsTree } from './tree/tree';
import { ObjectCard } from './cards/card'
import { player } from "./game/metadata"
import { unit } from './game/unit';
import { GiCheckMark } from 'react-icons/gi';
import { UpdateCardProperty } from './cards/utils';
import { GenerateDefaultPerson } from './actions/person_generator';
import { VisibilityConditionsProvider } from './game/conditions';

function App() {
  const soldiers = [
    GenerateDefaultPerson(true, true),
    GenerateDefaultPerson(true, true),
    GenerateDefaultPerson(true, true),
    GenerateDefaultPerson(true, true),
    GenerateDefaultPerson(true, true),
    GenerateDefaultPerson(true, true)
  ];

  const units = [
    new unit("Captain", [soldiers[0]]),
    new unit("Colonel", [soldiers[1]]),
    new unit("Player1", [soldiers[2], soldiers[4]]),
    new unit("Player2", [soldiers[3], soldiers[5]])
  ];

  const [players, setPlayers] = useState([
    new player("GM", [units[0], units[1]]),
    new player("Player1", [units[2]]),
    new player("Player2", [units[3]])
  ]);

  const handleOtherPropertyChange = (id, name, value) => {
    setPlayers(prev => UpdateCardProperty(prev, id, name, value));
  };

  const treeRef = useRef(null);

  const handleInitiativeClick = (unitId) => {
    if (treeRef.current) {
      treeRef.current.scrollTo(unitId, 'center');
      treeRef.current.select(unitId);
    }
  };

  const [selectedNode, setSelectedNode] = useState(null);
  const [log, setLog] = useState([]);
  const [randomN, setRandomN] = useState(Math.random());
  const [showInitiativeModal, setInitiativeModal] = useState(false);

  const addLogEntry = (message) => {
    if (message === 'Начинается новый ход.') {
      setRandomN(Math.random());
    }
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `${timestamp} - ${message}`]);
  };

  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  const getPlayOrder = () => {
    const order = [];

    players.forEach(player => {
      if (player.children) {
        player.children.forEach(unit => {
          order.push(unit);
        });
      }
    });

    return order.sort((a, b) => {
      return b.initiative === a.initiative ? 0.5 - randomN : b.initiative - a.initiative;
    });
  };

  return (
    <VisibilityConditionsProvider>
      <div className="app-container">
        <div className="left-panel">
          <MainMenu players={players} setPlayers={setPlayers} setSelectedNode={setSelectedNode} addLogEntry={addLogEntry} />
          <ObjectsTree ref={treeRef} players={players} setPlayers={setPlayers} selectedNode={selectedNode} setSelectedNode={setSelectedNode} handlePropertyChange={handleOtherPropertyChange} />
        </div>
        <div className="right-panel">
          <div className="content">
            {selectedNode && <ObjectCard players={players} node={selectedNode} setPlayers={setPlayers} addLogEntry={addLogEntry} />}
          </div>
          <div className="log-container">
            <div className="log-content" ref={logContainerRef}>
              {log.length === 0 ? (
                <span className="log-empty">Добро пожаловать.</span>
              ) : (
                log.map((entry, index) => (
                  <div key={index} className="log-entry">
                    {entry}
                  </div>
                ))
              )}
            </div>
            <button
              className="initiative-button"
              onClick={() => {
                setInitiativeModal(!showInitiativeModal);
              }}
            >
              Инициатива
            </button>
          </div>
        </div>
        {showInitiativeModal && (
          <div className="initiative-modal">
            <table className="initiative-table">
              <thead>
                <tr>
                  <th></th>
                  <th className='big-table-header'>Инициатива</th>
                  <th>Отряд</th>
                </tr>
              </thead>
              <tbody>
                {getPlayOrder().filter(unit => unit.isActive).map(unit => (
                  <tr key={unit.id}>
                    <td className="clickable_td" onClick={() => handleOtherPropertyChange(unit.id, "isMarked", !unit.isMarked)} >{unit.isMarked && (<GiCheckMark />)}</td>
                    <td>{unit.initiative}</td>
                    <td className={`clickable_td ${selectedNode === unit.id ? 'selected' : ''}`} onClick={() => handleInitiativeClick(unit.id)}>{unit.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        }
      </div >
    </VisibilityConditionsProvider>);
}

export default App;
