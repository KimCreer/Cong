// components/AppointmentCard.js
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  Linking
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { format, parseISO, isToday, isTomorrow, isAfter } from 'date-fns';

const AppointmentCard = ({ appointment, onViewDetails, isUpcoming }) => {
  const parsedDate = parseISO(appointment.date);
  
  // Format time display
  const displayTime = appointment.time || format(parsedDate, 'h:mm a');
  
  // Format service type
  const service = appointment.type || 'Appointment';
  
  // Clean up status
  const status = appointment.status?.trim() || 'Pending';

  // Add date context (today, tomorrow, or just the date)
  const getDateContext = () => {
    if (isToday(parsedDate)) return 'Today';
    if (isTomorrow(parsedDate)) return 'Tomorrow';
    return format(parsedDate, 'MMM d, yyyy');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'Confirmed':
        return { 
          color: '#4CAF50', 
          icon: 'check-circle',
          bgColor: '#E8F5E9',
          textColor: '#2E7D32',
          label: 'Confirmed'
        };
      case 'Pending':
        return { 
          color: '#FFC107', 
          icon: 'clock',
          bgColor: '#FFF8E1',
          textColor: '#FF8F00',
          label: 'Pending Approval'
        };
      case 'Cancelled':
        return { 
          color: '#F44336', 
          icon: 'times-circle',
          bgColor: '#FFEBEE',
          textColor: '#C62828',
          label: 'Cancelled'
        };
      case 'Completed':
        return { 
          color: '#9C27B0', 
          icon: 'check-double',
          bgColor: '#F3E5F5',
          textColor: '#7B1FA2',
          label: 'Completed'
        };
      default:
        return { 
          color: '#9E9E9E', 
          icon: 'question-circle',
          bgColor: '#FAFAFA',
          textColor: '#616161',
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={[styles.cardContainer, isUpcoming && styles.upcomingCard]}>
      {isUpcoming && (
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingBadgeText}>Upcoming</Text>
        </View>
      )}
      
      {/* Date Section with Gradient */}
      <LinearGradient
        colors={['#0275d8', '#003580']}
        style={styles.dateContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.dayText}>{format(parsedDate, 'EEE')}</Text>
        <Text style={styles.dateNumber}>{format(parsedDate, 'd')}</Text>
        <Text style={styles.monthText}>{format(parsedDate, 'MMM')}</Text>
        <Text style={styles.timeText}>{displayTime}</Text>
      </LinearGradient>

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        <View style={styles.serviceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceText} numberOfLines={1}>
              {service}
            </Text>
            <Text style={styles.dateContextText}>{getDateContext()}</Text>
          </View>
          <TouchableOpacity 
            onPress={onViewDetails}
            style={styles.viewButton}
          >
            <Text style={styles.viewButtonText}>View</Text>
            <FontAwesome5 name="chevron-right" size={12} color="#0275d8" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.purposeText} numberOfLines={2}>
            {appointment.purpose || "No purpose specified"}
          </Text>
        </View>
        
        <View style={[styles.statusContainer, { backgroundColor: statusConfig.bgColor }]}>
          <FontAwesome5 name={statusConfig.icon} size={12} color={statusConfig.textColor} />
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

AppointmentCard.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.string.isRequired,
    purpose: PropTypes.string,
    status: PropTypes.string,
    time: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  onViewDetails: PropTypes.func.isRequired,
  isUpcoming: PropTypes.bool,
};

AppointmentCard.defaultProps = {
  isUpcoming: false,
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
    position: 'relative',
  },
  upcomingCard: {
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  dateContainer: {
    width: 90,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  dateContextText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoContainer: {
    marginBottom: 10,
  },
  purposeText: {
    fontSize: 14,
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#0275d8',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default memo(AppointmentCard);