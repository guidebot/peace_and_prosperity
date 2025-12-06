import { Tree } from 'react-arborist';
import { useRef, useState, useLayoutEffect } from 'react';
import { TreeNode } from './node'
import useResizeObserver from '@react-hook/resize-observer';
import { forwardRef } from 'react';

export const ObjectsTree = forwardRef(({ players, setPlayers, selectedNode, setSelectedNode, handlePropertyChange }, ref) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(100);
    const [height, setHeight] = useState(500);

    useLayoutEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
            setHeight(containerRef.current.offsetHeight);
        }
    }, []);

    useResizeObserver(containerRef, (entry) => {
        if (entry) {
            setWidth(entry.contentRect.width);
            setHeight(entry.contentRect.height);
        }
    });

    const onSelect = (obj) => {
        setSelectedNode(obj?.[0]?.id || null);
    };

    const moveNode = (nodes, id, newParentId, newIndex) => {
        let movedNode = null;

        const removeNode = (arr) =>
            arr.reduce((acc, node) => {
                if (node.id === id) {
                    movedNode = node;
                    return acc;
                }

                if (node.children) {
                    const updatedChildren = removeNode(node.children);
                    node = { ...node, children: updatedChildren.length ? updatedChildren : [] };
                }

                acc.push(node);
                return acc;
            }, []);

        const insertNode = (arr, parentId) =>
            arr.reduce((acc, node) => {
                if (node.id === parentId && movedNode !== null) {
                    const children = [...(node.children || [])];
                    children.splice(newIndex, 0, movedNode);
                    acc.push({ ...node, children });
                    return acc;
                }

                if (node.children) {
                    const updatedChildren = insertNode(node.children, parentId);
                    acc.push({ ...node, children: updatedChildren });
                    return acc;
                }

                acc.push(node);
                return acc;
            }, []);

        const withoutNode = removeNode(nodes);

        if (!movedNode) {
            return nodes;
        }

        if (newParentId === undefined || newParentId === null) {
            withoutNode.splice(newIndex, 0, movedNode);
            return withoutNode;
        }

        return insertNode(withoutNode, newParentId);
    };

    const onMove = ({ dragIds, parentId, index }) => {
        const getNode = (id) => {
            for (const player of players) {
                if (player.id === id) {
                    return player;
                }

                for (const unit of player.children) {
                    if (unit.id === id) {
                        return unit;
                    }

                    for (const person of unit.children) {
                        if (person.id === id) {
                            return person;
                        }
                    }
                }
            }
        };

        const drag = getNode(dragIds[0]);

        if (!parentId && drag.type !== "player") return;

        if (parentId) {
            const parent = getNode(parentId);

            if (parent.type === "player" && drag.type === "entity") return;
            if (parent.type === "unit" && drag.type === "unit") return;
            if (drag.type === "player") return;
            if (parent.type === "entity") return;
        }

        setPlayers((prevData) => {
            const newData = moveNode([...prevData], dragIds[0], parentId, index);
            return newData;
        });
    };

    const onRename = ({ id, name }) => {
        handlePropertyChange(id, "name", name);
    };

    const onDelete = ({ ids }) => {
        setPlayers((prevData) => {
            const newData = prevData.filter((node) => !ids.includes(node.id)).map((node) => ({
                ...node,
                children: node.children ? node.children.filter((child) => !ids.includes(child.id)).map((node2) => ({
                    ...node2,
                    children: node2.children ? node2.children.filter((child2) => !ids.includes(child2.id)) : []
                })) : [],
            }));

            return newData;
        });
    };

    return (
        <div ref={containerRef}>
            <Tree
                ref={ref}
                disableMultiSelection={true}
                width={width}
                height={height}
                data={players}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                onSelect={onSelect}>
                {(props) => <TreeNode {...props} isSelected={props.node.id === selectedNode} handlePropertyChange={handlePropertyChange} />}
            </Tree>
        </div>
    );
});