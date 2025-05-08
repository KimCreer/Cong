export const APPOINTMENT_TYPES = {
    COURTESY: { label: "Courtesy (VIP)", icon: "handshake", color: "#6c5ce7" },
    FINANCE: { label: "Finance/Medical", icon: "file-invoice-dollar", color: "#e84393" },
    OTHER: { label: "Other", icon: "question-circle", color: "#636e72" }
};

export const STATUS_COLORS = {
    Pending: "#FFA000",
    Confirmed: "#28a745",
    Cancelled: "#dc3545",
    Completed: "#007bff",
    Rejected: "#6c757d"
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