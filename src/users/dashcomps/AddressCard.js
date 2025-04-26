// components/AddressCard.js
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Linking,
  Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { LinearGradient } from 'expo-linear-gradient';

const AddressCard = ({ address }) => {
  const handleOpenMaps = () => {
    const formattedAddress = `${address.street}, ${address.barangay}, ${address.city}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(formattedAddress)}`,
      android: `geo:0,0?q=${encodeURIComponent(formattedAddress)}`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`);
    });
  };

  const handleOpenStreetView = () => {
    Linking.openURL(address.streetViewUrl).catch(err => 
      console.error("Failed to open street view:", err)
    );
  };

  return (
    <LinearGradient
      colors={['#003366', '#0275d8']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.header}>
        <FontAwesome5 name="building" size={20} color="#FFFFFF" />
        <Text style={styles.title}>Muntinlupa District Office</Text>
      </View>
      
      {/* Street View Preview */}
      <TouchableOpacity 
        onPress={handleOpenStreetView}
        activeOpacity={0.8}
        accessibilityLabel="View street view of office location"
      >
        <Image 
          source={{ uri: address.streetViewImage }} 
          style={styles.streetViewImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.streetViewOverlay}
        >
          <FontAwesome5 name="street-view" size={16} color="#FFFFFF" />
          <Text style={styles.streetViewText}>View on Street View</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Address Details */}
      <View style={styles.detailsContainer}>
        <AddressRow 
          icon="building" 
          text={`${address.floor}, ${address.location}`} 
          highlight
        />
        <AddressRow 
          icon="map-marker-alt" 
          text={`${address.street}, ${address.barangay}, ${address.city}, ${address.zip}`} 
        />
        <AddressRow icon="phone-alt" text={address.phone} />
        <AddressRow icon="envelope" text={address.email} />
        <AddressRow icon="clock" text={address.hours} />
      </View>
      
      {/* Directions Button */}
      <TouchableOpacity 
        style={styles.directionsButton}
        onPress={handleOpenMaps}
        activeOpacity={0.8}
        accessibilityLabel="Get directions to office"
      >
        <FontAwesome5 name="directions" size={14} color="#FFFFFF" />
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const AddressRow = ({ icon, text, highlight = false }) => (
  <View style={styles.addressRow}>
    <FontAwesome5 
      name={icon} 
      size={14} 
      color="#FFFFFF" 
      style={styles.addressIcon} 
    />
    <Text 
      style={[
        styles.addressText, 
        highlight && styles.highlightText
      ]}
      numberOfLines={2}
    >
      {text}
    </Text>
  </View>
);

AddressCard.propTypes = {
  address: PropTypes.shape({
    floor: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    street: PropTypes.string.isRequired,
    barangay: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    zip: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    hours: PropTypes.string.isRequired,
    streetViewUrl: PropTypes.string.isRequired,
    streetViewImage: PropTypes.string.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  streetViewImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
  },
  streetViewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  streetViewText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressIcon: {
    width: 20,
    marginRight: 10,
    marginTop: 2,
  },
  addressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    lineHeight: 20,
  },
  highlightText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  directionsButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  directionsText: {
    color: '#003580',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default memo(AddressCard);