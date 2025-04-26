// medcomps/utils/utils.js
export const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const groupByDate = (applications) => {
    const grouped = {};
    
    applications.forEach(app => {
        const appDate = app.createdAt?.toDate();
        if (!appDate) return;
        
        const dateStr = formatDate(appDate);
        
        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        
        grouped[dateStr].push(app);
    });
    
    return grouped;
};

export const filterByDate = (applications, filterDate) => {
    return applications.filter(app => {
        const appDate = app.createdAt?.toDate();
        if (!appDate) return false;
        
        return (
            appDate.getDate() === filterDate.getDate() &&
            appDate.getMonth() === filterDate.getMonth() &&
            appDate.getFullYear() === filterDate.getFullYear()
        );
    });
};

export const calculateStats = (applications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const stats = {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: applications.length
    };
    
    applications.forEach(app => {
        const appDate = app.createdAt?.toDate();
        if (!appDate) return;
        
        if (appDate >= today) stats.today++;
        if (appDate >= yesterday && appDate < today) stats.yesterday++;
        if (appDate >= thisWeek) stats.thisWeek++;
        if (appDate.getMonth() === today.getMonth()) stats.thisMonth++;
    });
    
    return stats;
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

export const getStatusColor = (status) => {
    if (!status) return '#9E9E9E';
    
    switch(status.toLowerCase()) {
        case 'pending': return '#FF9800';
        case 'approved': return '#4CAF50';
        case 'rejected': return '#F44336';
        default: return '#9E9E9E';
    }
};

export const formatStatusText = (status) => {
    if (!status) return 'Unknown';
    const lowerStatus = status.toLowerCase();
    return lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1);
};

// Add this default export at the bottom
export default {
    formatDate,
    groupByDate,
    filterByDate,
    calculateStats,
    formatTimeAgo,
    getStatusColor,
    formatStatusText
};