import { format, isSameDay, isSameMonth } from 'date-fns';

export const safeFormatDate = (dateValue, formatString, fallbackText = 'Not available') => {
    try {
        if (dateValue && typeof dateValue.toDate === 'function') {
            return format(dateValue.toDate(), formatString);
        }
        if (dateValue instanceof Date) {
            return format(dateValue, formatString);
        }
        if (typeof dateValue === 'number') {
            return format(new Date(dateValue), formatString);
        }
        if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
                return format(parsedDate, formatString);
            }
        }
        return fallbackText;
    } catch (error) {
        console.log("Date formatting error:", error, "for value:", dateValue);
        return fallbackText;
    }
};

export const validateTime = (timeValue) => {
    if (!timeValue) return "Not scheduled";
    if (typeof timeValue !== 'string') return "Invalid time";
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/i.test(timeValue)) {
        return timeValue;
    }
    return "Invalid time format";
};

export const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
};

export const isDateBlocked = (date, blockedDates) => {
    return blockedDates.some(blocked => isSameDay(blocked.date, date));
};

export const isDateSelectable = (date, blockedDates) => {
    return !isDateInPast(date) && !isDateBlocked(date, blockedDates);
}; 