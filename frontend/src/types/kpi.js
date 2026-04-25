export const getPerformanceLevel = (conversionRate) => {
    if (conversionRate >= 50)
        return 'excellent';
    if (conversionRate >= 25)
        return 'average';
    return 'poor';
};
export const getPerformanceColor = (level) => {
    switch (level) {
        case 'excellent': return 'text-green-600 bg-green-50';
        case 'average': return 'text-yellow-600 bg-yellow-50';
        case 'poor': return 'text-red-600 bg-red-50';
    }
};
