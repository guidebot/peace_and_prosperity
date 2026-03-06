export function ShuffleArray<T>(array: T[]): T[] {
    if (!Array.isArray(array)) {
        return [];
    }

    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function SortByPropertyWithRandomTies<T>(array: T[], compareFn: (item: T) => number): T[] {
    if (!Array.isArray(array) || typeof compareFn !== 'function') {
        return Array.isArray(array) ? [...array] : [];
    }

    const sorted = [...array].sort((a, b) => {
        const valueA = compareFn(a);
        const valueB = compareFn(b);
        return valueA - valueB;
    });

    const result: T[] = [];
    let currentGroup: T[] = [];
    let currentValue: number | undefined = undefined;

    for (const item of sorted) {
        const itemValue = compareFn(item);

        if (currentValue === undefined || itemValue === currentValue) {
            currentGroup.push(item);
            currentValue = itemValue;
        } else {
            result.push(...ShuffleArray(currentGroup));
            currentGroup = [item];
            currentValue = itemValue;
        }
    }

    if (currentGroup.length > 0) {
        result.push(...ShuffleArray(currentGroup));
    }

    return result;
}
