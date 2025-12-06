import { MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { GiStopSign, GiCheckMark, GiTruck, GiApc, GiTank, GiHealthNormal, GiSkullCrossedBones, GiInvisible } from 'react-icons/gi';
import { FaLocationPinLock } from "react-icons/fa6";
import { IoMdMove } from "react-icons/io";
import { BiSolidHide } from "react-icons/bi";
import { MaxTeamSize, MovementSpeed } from "../cards/utils";
import { GrUserPolice } from "react-icons/gr";

export function TreeNode({ node, style, dragHandle, tree, isSelected, handlePropertyChange }) {
    if (!node) return null;

    const renderGlyph = (node) => {
        if (!node.isLeaf) {
            return node.isOpen ? <MdArrowDropDown /> : <MdArrowRight />;
        }
    }

    return (
        <div className={`node-container ${isSelected ? 'selected' : !node.isEditing && ((node.data.type === "entity" && node.data.isDead) || (node.data.type === 'unit' && !node.data.isActive)) ? 'inactive' : node.data.type === 'unit' && node.data.isHidden && node.data.isActive ? 'hidden' : ''
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
                    {!node.isEditing && node.data.type === 'unit' && !node.data.isActive && (<span><GiInvisible /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isHidden && (<span><BiSolidHide /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "truck" && (<span><GiTruck /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "wheel" && (<span><GiApc /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.vehicle?.type === "track" && (<span><GiTank /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && !node.data.vehicle && MovementSpeed(node.data) === 0 && (<span style={{ color: 'red' }}><GiStopSign /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && MaxTeamSize(node.data) + 1 < node.data.children.filter(s => !s.isDead).length && (<span style={{ color: 'red' }}><GrUserPolice /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.hasMoved && (<span><IoMdMove /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isDeployed && (<span><FaLocationPinLock /></span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.isMarked && (<span><GiCheckMark /></span>)}
                    {!node.isEditing && node.data.type === "entity" && !node.data.isDead && (node.data.skills["MED"] ?? 0) > 0 && (<span><GiHealthNormal /></span>)}
                    {!node.isEditing && (<span>{node.data.name}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.stress > 0 && (<span style={{ color: 'red' }}> {node.data.stress}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.fatigue > 0 && (<span style={{ color: 'orange' }}> {node.data.fatigue}</span>)}
                    {!node.isEditing && node.data.type === 'unit' && node.data.correction > 0 && (<span style={{ color: 'green' }}> {node.data.correction}</span>)}
                </span>
            </div>
            <div className="node-actions">
                <div className="buttons-panel">
                    <button style={{ display: !node.isEditing && node.data.type === "entity" && !node.data.isDead ? 'inline' : 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyChange(node.id, "isDead", true);
                    }} title="Умер">
                        <GiSkullCrossedBones />
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
                    }} title={node.data.isActive ? "Не активен" : "Активен"}>
                        <GiInvisible />
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