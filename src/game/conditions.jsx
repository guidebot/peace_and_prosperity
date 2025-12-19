import { createContext, useContext, useState, useMemo } from 'react';
import { BsFillSunFill } from 'react-icons/bs';
import { PiSunHorizonFill } from 'react-icons/pi';
import { MdNightlight } from 'react-icons/md';
import { FaCloudRain } from 'react-icons/fa6';
import { RiFoggyFill } from 'react-icons/ri';
import { ApplyWatchEffect, CalculateWatchEffect } from '../actions/watch';
import { ApplyFireEffects, CalculateFireEffects } from '../actions/fire';

const VisibilityConditions =
    [
        { id: "day", maxRange: 160, value: 12, pic: <BsFillSunFill />, label: "День" },
        { id: "dawn", maxRange: 160, value: 7, pic: <PiSunHorizonFill />, label: "Сумерки" },
        { id: "night", maxRange: 20, value: 2, pic: <MdNightlight />, label: "Ночь" },
        { id: "rain", maxRange: 80, value: 8, pic: <FaCloudRain />, label: "Осадки" },
        { id: "fog", maxRange: 10, value: 7, pic: <RiFoggyFill />, label: "Туман" }
    ]

export const VisibilityConditionsCatalog = VisibilityConditions.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

const VisibilityConditionsContext = createContext();

export function VisibilityConditionsProvider({ children }) {
    const [activeConditionIds, setActiveConditionIds] = useState(['day']);

    const visibilityValue = useMemo(() => {
        return activeConditionIds
            .map(id => VisibilityConditionsCatalog[id]?.value)
            .reduce((min, val) => Math.min(min, val), 999);
    }, [activeConditionIds]);

    const maxRange = useMemo(() => {
        return activeConditionIds
            .map(id => VisibilityConditionsCatalog[id]?.maxRange
            )
            .reduce((min, val) => Math.min(min, val), 999);
    }, [activeConditionIds]);

    const toggleCondition = (conditionId) => {
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

    return (players, rolls, actors, target) => {
        return CalculateWatchEffect(players, rolls, actors, target, activeConditionIds);
    };
}

export function ApplyWatchEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players, rolls, actors, target) => {
        return ApplyWatchEffect(players, rolls, actors, target, activeConditionIds);
    };
}

export function CalculateFireEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players, rolls, actors, target) => {
        return CalculateFireEffects(players, rolls, actors, target, activeConditionIds);
    };
}

export function ApplyFireEffectWithConditions() {
    const { activeConditionIds } = useVisibilityConditions();

    return (players, rolls, actors, target) => {
        return ApplyFireEffects(players, rolls, actors, target, activeConditionIds);
    };
}

export function ModifiedVisibilityData(equipment, activeConditions) {
    const values = activeConditions.map(conditionId => {
        const condition = VisibilityConditionsCatalog[conditionId];
        const optic = equipment?.optic?.[conditionId];
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