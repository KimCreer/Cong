import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return '#FFC107';
    case 'in progress': return '#2196F3';
    case 'resolved': return '#4CAF50';
    default: return '#757575';
  }
};

export const getCategoryIcon = (cat) => {
  switch (cat.toLowerCase()) {
    case 'road': return 'road-variant';
    case 'garbage': return 'trash-can';
    case 'water': return 'water';
    case 'electricity': return 'lightning-bolt';
    default: return 'alert-circle';
  }
};

export const getCategoryColor = (cat) => {
  switch (cat.toLowerCase()) {
    case 'road': return '#FF9800';
    case 'garbage': return '#795548';
    case 'water': return '#2196F3';
    case 'electricity': return '#FFC107';
    default: return '#9C27B0';
  }
};

export const statusFilters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" }
];

export const categories = ["General", "Road", "Garbage", "Water", "Electricity"];