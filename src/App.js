import './App.css';
import { useState, useRef, useEffect } from 'react';
import { MainMenu } from "./main_menu"
import { ObjectsTree } from './tree/tree';
import { ObjectCard } from './cards/card'
import { player } from "./game/metadata";
import { Unit } from './game/Unit';
import { GiCheckMark } from 'react-icons/gi';
import { UpdateCardProperty } from './cards/utils';
import { GenerateDefaultPerson } from './actions/person_generator';
import { VisibilityConditionsProvider } from './game/conditions';
import { Titles } from './game/titles';
import { MaxSkill } from './game/skills';

function App() {
  const soldiers = [
    GenerateDefaultPerson(true, true, Titles[4].name),
    GenerateDefaultPerson(true, true, Titles[6].name),
    GenerateDefaultPerson(true, true, Titles[2].name),
    GenerateDefaultPerson(true, true, Titles[2].name),
    GenerateDefaultPerson(true, true, Titles[1].name),
    GenerateDefaultPerson(true, true, Titles[1].name)
  ];

  const units = [
    new Unit("Captain", [soldiers[0]]),
    new Unit("Colonel", [soldiers[1]]),
    new Unit("Player1", [soldiers[2], soldiers[4]]),
    new Unit("Player2", [soldiers[3], soldiers[5]])
  ];

  units.forEach((unit, idx) => {
    unit.position = {
      x: 40 + (idx % 10) * 50,
      y: 40 + Math.floor(idx / 10) * 50
    };
  });

  const [players, setPlayers] = useState([
    new player("GM", [units[0], units[1]]),
    new player("Player1", [units[2]]),
    new player("Player2", [units[3]])
  ]);

  const handleOtherPropertyChange = (id, name, value) => {
    setPlayers(prev => UpdateCardProperty(prev, id, name, value));
  };

  const treeRef = useRef(null);

  useEffect(() => {
    if (treeRef.current && players.length > 0) {
      const closeInactiveNodes = (nodes) => {
        nodes.forEach(node => {
          if (node.isActive === false) {
            treeRef.current?.close(node.id);
          }
          if (node.children) {
            closeInactiveNodes(node.children);
          }
        });
      };

      const timer = setTimeout(() => {
        closeInactiveNodes(players);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [players]);

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
      const aLid = MaxSkill(a, "LID");
      const bLid = MaxSkill(b, "LID");
      return aLid === bLid ? 0.5 - randomN : bLid - aLid;
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
            {selectedNode && <ObjectCard
              players={players}
              node={selectedNode}
              setSelectedNode={handleInitiativeClick}
              setPlayers={setPlayers}
              addLogEntry={addLogEntry} />}
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
            <div className="log-controls">
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
                    <td>{MaxSkill(unit, "LID")}</td>
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
