import { MdArrowRight, MdArrowDropDown, MdAdd } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { GiStopSign, GiCheckMark, GiTruck, GiApc, GiTank, GiHealthNormal, GiSkullCrossedBones } from 'react-icons/gi';
import { FaLocationPinLock } from "react-icons/fa6";
import { IoMdMove } from "react-icons/io";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import { MovementSpeed } from "../cards/utils";
import { PiDropFill, PiDropSlashFill } from "react-icons/pi";
import { TbPlayerPause, TbPlayerPlay } from "react-icons/tb";
import { BsEmojiDizzy, BsArrowsMove, BsSignStop } from "react-icons/bs";
import { RiTeamFill } from "react-icons/ri";
import { Unit } from "../game/Unit";
import { generateUnitName } from "../game/callsigns";
import { CiLocationOn, CiLocationOff } from "react-icons/ci";

export function TreeNode({ node, style, dragHandle, tree, isSelected, handlePropertyChange, players, setPlayers }) {
    if (!node) return null;

    const handleAddUnit = () => {
        const existingUnitNames = players.flatMap(player =>
            (player.children || []).map(unit => unit.name)
        );
        const newUnit = new Unit(generateUnitName(existingUnitNames), []);
        setPlayers((prevPlayers) => {
            return prevPlayers.map(player => {
                if (player.id === node.data.id) {
                    return {
                        ...player,
                        children: [...(player.children || []), newUnit]
                    };
                }
                return player;
            });
        });
    };

    const checkIfCanMove = () => {
        if (!node.data.children) return false;
        if (node.data.isDeployed) return false;
        if (MovementSpeed(node.data).plain === 0) return false;

        if (!node.data.vehicle) {
            const bleedingCount = node.data.children.filter(p => !p.isDead && p.isBleeding).length;
            const healthyCount = node.data.children.filter(p => !p.isDead && !p.isBleeding).length;
            if (bleedingCount > healthyCount) return false;
        }

        return true;
    };

    const checkIfCanDeploy = () => {
        if (!node.data.children) return false;
        if (node.data.hasMoved) return false;
        return true;
    };

    const renderGlyph = (node) => {
        if (!node.isLeaf) {
            return node.isOpen ? <MdArrowDropDown /> : <MdArrowRight />;
        }
    }

    return (
        <div className={`node-container ${isSelected ? 'selected' : !node.isEditing && ((node.data.type === "entity" && (node.data.isDead || node.data.isBleeding || node.data.isSuppressed)) || (node.data.type === 'unit' && !node.data.isActive)) ? 'inactive' : node.data.type === 'unit' && node.data.isHidden && node.data.isActive ? 'hidden' : ''
            } `} style={style} ref={dragHandle}>
            <div className="node-content">
                <span>
                    <span className="arrow" onClick={() => node.isInternal && node.toggle()}>{renderGlyph(node)}</span>
                    {node.isEditing && (
                        <div className="node-text-input">
                            <input
                                type="text"
                                defaultValue={node.data.name}
                                onFocus={(e) => { e.currentTarget.select(); }}
                                onBlur={() => { node.reset(); }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") node.reset();
                                    if (e.key === "Enter") node.submit(e.currentTarget.value);
                                }}
                                autoFocus
                            />
                        </div>
                    )}
                    {!node.isEditing && node.data.type === "entity" && node.data.isDead && (<span><GiSkullCrossedBones /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && !node.data.isActive && (<span><TbPlayerPause /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isHidden && (<span><BiSolidHide /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "truck" && (<span><GiTruck /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "wheel" && (<span><GiApc /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "track" && (<span><GiTank /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && !node.data.vehicle && MovementSpeed(node.data).plain === 0 && (<span style={{ color: 'red' }}><GiStopSign /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.hasMoved && (<span><IoMdMove /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isDeployed && (<span><FaLocationPinLock /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isMarked && (<span><GiCheckMark /></span>)}
                    {!node.isEditing && node.data.type === 'entity' && !node.data.isDead && node.data.isSuppressed && (<span style={{ color: 'red' }}><BsEmojiDizzy /></span>)}
                    {!node.isEditing && node.data.type === 'entity' && !node.data.isDead && node.data.isBleeding && (<span style={{ color: 'red' }}><PiDropFill /></span>)}
                    {!node.isEditing && node.data.type === "entity" && !node.data.isDead && (node.data.skills["MED"] ?? 0) > 0 && (<span><GiHealthNormal /></span>)}
                    {!node.isEditing && (<span>{node.data.name}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.stress > 0 && (<span style={{ color: 'red' }}> {node.data.stress.toFixed(1)}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.fatigue > 0 && (<span style={{ color: 'orange' }}> {node.data.fatigue}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.correction > 0 && (<span style={{ color: 'lightgreen' }}> {node.data.correction}</span>)}
                </span>
            </div>
            <div className="node-actions">
                <div className="buttons-panel">
                    <button style={{ display: !node.isEditing && node.data.type === "player" ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handleAddUnit();
                    }} title="Добавить отряд">
                        <RiTeamFill />
                    </button>
                    <button style={{ display: !node.isEditing && node.data.type === "unit" ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyChange(node.id, "isHidden", !node.data.isHidden);
                    }} title={node.data.isHidden ? "Демаскировать" : "Замаскировать"}>
                        {node.data.isHidden ? (<BiSolidShow />) : (<BiSolidHide />)}
                    </button>
                    {checkIfCanMove() && node.data.hasMoved && (
                        <button style={{ display: !node.isEditing && node.data.type === 'unit' ? 'inline' : 'none' }} onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyChange(node.id, "hasMoved", !node.data.hasMoved);
                        }} title="Переключить пометку передвижения">
                            {node.data.hasMoved ? (<BsSignStop />) : (<BsArrowsMove />)}
                        </button>
                    )}
                    <button style={{ display: !node.isEditing && node.data.type === 'unit' && checkIfCanDeploy() ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyChange(node.id, "isDeployed", !node.data.isDeployed);
                    }} title="Переключить пометку стационарного положения">
                        {node.data.isDeployed ? (<CiLocationOff />) : (<CiLocationOn />)}
                    </button>
                    <button style={{ display: !node.isEditing && node.data.type === "entity" && !node.data.isDead ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyChange(node.id, "isBleeding", !node.data.isBleeding);
                    }} title={node.data.isBleeding ? "Остановить кровотечение" : "Кровотечение"}>
                        {node.data.isBleeding ? (<PiDropSlashFill />) : (<PiDropFill />)}
                    </button>
                    <button style={{ display: !node.isEditing && node.data.type === 'unit' ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        if (node.data.isActive) {
                            node.close();
                        }
                        else {
                            node.open();
                        }
                        handlePropertyChange(node.id, "isActive", !node.data.isActive);
                    }} title={node.data.isActive ? "Скрыть из игры" : "Показать в игре"}>
                        {node.data.isActive ? (<TbPlayerPause />) : (<TbPlayerPlay />)}
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        tree.delete(node.id);
                    }} title="Удалить">
                        <RxCross2 />
                    </button>
                </div>
            </div>
        </div >
    );
};