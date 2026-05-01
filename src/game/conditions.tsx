import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { BsFillSunFill } from 'react-icons/bs';
import { PiSunHorizonFill } from 'react-icons/pi';
import { MdNightlight } from 'react-icons/md';
import { FaCloudRain } from 'react-icons/fa6';
import { RiFoggyFill } from 'react-icons/ri';
import { ApplyWatchEffect, CalculateWatchEffect, WatchCandidate, WatchEffect, RollData } from '../actions/Watch';
import { ApplyFireEffects, CalculateFireEffects } from '../actions/Fire';
import { Equipment } from './Equipment';
import { Entity } from './Entity';
import { Unit } from './Unit';
import { Player } from './Player';

export interface VisibilityCondition {
    id: string;
    maxRange: number;
    value: number;
    pic: ReactNode;
    label: string;
}

const VisibilityConditions: VisibilityCondition[] =
    [
        { id: "day", maxRange: 160, value: 12, pic: <BsFillSunFill />, label: "День" },
        { id: "dawn", maxRange: 80, value: 7, pic: <PiSunHorizonFill />, label: "Сумерки" },
        { id: "night", maxRange: 16, value: 2, pic: <MdNightlight />, label: "Ночь" },
        { id: "rain", maxRange: 40, value: 8, pic: <FaCloudRain />, label: "Осадки" },
        { id: "fog", maxRange: 6, value: 7, pic: <RiFoggyFill />, label: "Туман" }
    ];

export const VisibilityConditionsCatalog: Record<string, VisibilityCondition> = VisibilityConditions.reduce((acc: Record<string, VisibilityCondition>, item) => {
    acc[item.id] = item;
    return acc;
}, {});

interface VisibilityConditionsContextType {
    activeConditionIds: string[];
    visibilityValue: number;
    maxRange: number;
    toggleCondition: (conditionId: string) => void;
    conditionsList: VisibilityCondition[];
}

const VisibilityConditionsContext = createContext<VisibilityConditionsContextType | undefined>(undefined);

export function VisibilityConditionsProvider({ children }: { children: ReactNode }) {
    const [activeConditionIds, setActiveConditionIds] = useState<string[]>(['day']);

    const visibilityValue = useMemo(() => {
        return activeConditionIds
            .map(id => VisibilityConditionsCatalog[id]?.value)
            .reduce((min, val) => Math.min(min, val ?? 999), 999);
    }, [activeConditionIds]);

    const maxRange = useMemo(() => {
        return activeConditionIds
            .map(id => VisibilityConditionsCatalog[id]?.maxRange)
            .reduce((min, val) => Math.min(min, val ?? 999), 999);
    }, [activeConditionIds]);

    const toggleCondition = (conditionId: string) => {
        setActiveConditionIds(prev => {
            const isDaytime = ["day", "dawn", "night"].includes(conditionId);
            const isWeather = ["rain", "fog"].includes(conditionId);

            const currentDaytime = prev.filter(id => ["day", "dawn", "night"].includes(id));
            const currentWeather = prev.filter(id => ["rain", "fog"].includes(id));

            if (isDaytime) {
                return [conditionId, ...currentWeather];
            }

            if (isWeather) {
                if (prev.includes(conditionId)) {
                    const newWeather = currentWeather.filter(id => id !== conditionId);
                    return [...currentDaytime, ...newWeather];
                } else {
                    return [...currentDaytime, conditionId, ...currentWeather];
                }
            }

            return prev;
        });
    };

    return (
        <VisibilityConditionsContext.Provider
            value={{
                activeConditionIds,
                visibilityValue,
                maxRange,
                toggleCondition,
                conditionsList: VisibilityConditions
            }}
        >
            {children}
        </VisibilityConditionsContext.Provider>
    );
}

export function useVisibilityConditions() {
    const context = useContext(VisibilityConditionsContext);
    if (!context) {
        throw new Error('useVisibilityConditions must be used within VisibilityConditionsProvider');
    }
    return context;
}

export function CalculateWatchEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players: Player[], rolls: RollData[], actors: WatchCandidate[], target: Unit): WatchEffect[] => {
        return CalculateWatchEffect(players, rolls, actors, target, activeConditionIds);
    };
}

export function ApplyWatchEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players: Player[], rolls: RollData[], actors: WatchCandidate[], target: Unit): WatchEffect[] => {
        return ApplyWatchEffect(players, rolls, [], actors[0], target, activeConditionIds);
    };
}

export function CalculateFireEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players: Player[], rolls: RollData[], actors: any[], target: Unit) => {
        return CalculateFireEffects(players, rolls, actors, target, activeConditionIds);
    };
}

export function ApplyFireEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();
    return (players: Player[], rolls: RollData[], actors: any[], target: Unit, onPropertyChange: (id: string, property: string, value: any) => void) => {
        return ApplyFireEffects(players, rolls, actors, target, onPropertyChange, activeConditionIds);
    };
}

export function ModifiedVisibilityData(equipment: Equipment | null, activeConditions: string[]) {
    const values = activeConditions.map(conditionId => {
        const condition = VisibilityConditionsCatalog[conditionId];
        const opticEntry = equipment?.optic as Record<string, { mod: number; maxRange: number }> | undefined;
        const optic = opticEntry?.[conditionId];
        return {
            visibility: condition.value + (optic?.mod ?? 0),
            maxRange: optic?.maxRange ?? condition.maxRange
        };
    });

    const minVisibility = Math.min(...values.map(v => v.visibility));
    const minMaxRange = Math.min(...values.map(v => v.maxRange));

    return {
        visibility: minVisibility,
        maxRange: minMaxRange
    };
}
