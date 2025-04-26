// Constants
export const CARD_MARGIN = 12;
export const AVATAR_SIZE = 40;
export const IMAGE_HEIGHT = 240;

export const NOTIFICATION_TYPES = {
  NEW_POST: 'new_post',
  IMPORTANT_ALERT: 'important_alert',
  SYSTEM_MESSAGE: 'system_message',
  EVENT_REMINDER: 'event_reminder'
};

export const PRIORITY_COLORS = {
  High: '#FF4444',
  Medium: '#FFBB33',
  Low: '#00C851'
};

export const PRIORITY_TEXT = {
  High: 'Urgent',
  Medium: 'Important',
  Low: 'Regular'
};

export const CATEGORIES = ['All', 'Announcement', 'Event', 'Maintenance', 'General'];

export const CATEGORY_ICONS = {
  All: 'view-grid-outline',
  Announcement: 'bullhorn-outline',
  Event: 'calendar-outline',
  Maintenance: 'wrench-outline',
  General: 'newspaper-variant-outline'
};

// Helper function
export const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
};