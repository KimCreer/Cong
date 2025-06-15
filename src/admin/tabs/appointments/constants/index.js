export const APPOINTMENT_TYPES = {
    COURTESY: { label: "Courtesy (VIP)", icon: "handshake", color: "#6c5ce7" },
    FINANCE: { label: "Finance/Medical", icon: "file-invoice-dollar", color: "#e84393" },
};

export const STATUS_COLUMNS = {
    pending: {
        title: 'Pending',
        statuses: ['Pending'],
        color: '#FFA000',
        description: 'New requests waiting for action'
    },
    confirmed: {
        title: 'Confirmed',
        statuses: ['Confirmed'],
        color: '#28a745',
        description: 'Scheduled appointments'
    },
    completed: {
        title: 'Completed',
        statuses: ['Completed'],
        color: '#6c5ce7',
        description: 'Completed appointments'
    },
    cancelled: {
        title: 'Cancelled',
        statuses: ['Cancelled', 'Rejected'],
        color: '#dc3545',
        description: 'Cancelled or rejected appointments'
    },
    history: {
        title: 'History',
        statuses: ['Completed', 'Cancelled', 'Rejected'],
        color: '#6c757d',
        description: 'Past appointments'
    }
};

export const STATUS_COLORS = {
    Pending: '#FFA000',
    Confirmed: '#28a745',
    Completed: '#6c5ce7',
    Cancelled: '#dc3545',
    Rejected: '#dc3545'
};

export const SORT_OPTIONS = [
    { id: 'date_asc', label: 'Time (Earliest First)', icon: 'arrow-down' },
    { id: 'date_desc', label: 'Time (Latest First)', icon: 'arrow-up' }
];

export const TAB_OPTIONS = [
    { id: 'pending', label: 'Pending' },
    { id: 'history', label: 'History' },
    { id: 'blocked', label: 'Blocked Dates' }
];

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; 