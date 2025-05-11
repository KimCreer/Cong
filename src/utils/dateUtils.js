// Common date utility functions used across the app

export const formatDate = (date, formatStr = 'default') => {
    if (formatStr === 'default') {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const d = new Date(date);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return formatStr
        .replace('yyyy', d.getFullYear())
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('dd', String(d.getDate()).padStart(2, '0'))
        .replace('EEE', days[d.getDay() - 1] || '')
        .replace('MMM', months[d.getMonth()])
        .replace('d', d.getDate());
};

export const formatTimeAgo = (date) => {
    if (!date) return "Unknown date";
    
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
};

export const groupByDate = (items, dateField = 'createdAt') => {
    const grouped = {};
    
    items.forEach(item => {
        const itemDate = item[dateField]?.toDate?.() || new Date(item[dateField]);
        if (!itemDate) return;
        
        const dateStr = formatDate(itemDate);
        
        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        
        grouped[dateStr].push(item);
    });
    
    return grouped;
};

export const filterByDate = (items, filterDate, dateField = 'createdAt') => {
    return items.filter(item => {
        const itemDate = item[dateField]?.toDate?.() || new Date(item[dateField]);
        if (!itemDate) return false;
        
        return (
            itemDate.getDate() === filterDate.getDate() &&
            itemDate.getMonth() === filterDate.getMonth() &&
            itemDate.getFullYear() === filterDate.getFullYear()
        );
    });
};

export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

export const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
};

export const isValidTime = (time) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

export const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const hasTimeConflict = (existingTimes, newTime, bufferMinutes = 30) => {
    const newTimeMinutes = timeToMinutes(newTime);
    
    return existingTimes.some(existingTime => {
        const existingMinutes = timeToMinutes(existingTime);
        return Math.abs(newTimeMinutes - existingMinutes) < bufferMinutes;
    });
}; 