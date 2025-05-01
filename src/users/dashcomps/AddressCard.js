// components/DualAddressCard.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const officeData = {
  legislative: {
    title: "Legislative Office",
    floor: "Room 425",
    location: "South Wing Annex Building",
    street: "House of Representatives, Constitution Hills",
    city: "Quezon City",
    zip: "1126",
    phone: "(02) 8442-4205",
    email: "jaime.fresnedi@house.gov.ph",
    hours: "Mon-Fri: 8:00 AM - 5:00 PM",
    streetViewUrl: "https://www.google.com/maps/place/South+Wing+Annex/@14.6919699,121.0953158,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgID4xP__LA!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAB5caB9n5fJ-BekZR5yAYmUhDFx9QIlT5OLdWVZ-eb2TZgKC2VYw03kmxlDZNf1nrE-nyqKVvlthWfzA-uXMvWSrn3a1bYNILZjlp8UMorY39gPyWwq6oeQs8acHg_71uJAm4MNvEU05%3Dw152-h86-k-no!7i1920!8i1080!4m6!3m5!1s0x3397ba115ef78d57:0xfe8fa4a8be29043d!8m2!3d14.691986!4d121.0948534!16s%2Fg%2F1hdztcv0b?entry=ttu&g_ep=EgoyMDI1MDQyOC4wIKXMDSoASAFQAw%3D%3D",
    // Extracted high-resolution image from the link
    streetViewImage: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB9n5fJ-BekZR5yAYmUhDFx9QIlT5OLdWVZ-eb2TZgKC2VYw03kmxlDZNf1nrE-nyqKVvlthWfzA-uXMvWSrn3a1bYNILZjlp8UMorY39gPyWwq6oeQs8acHg_71uJAm4MNvEU05=w1920-h1080-k-no",
    coordinates: { lat: 14.691986, lng: 121.0948534 }
  },
  district: {
    title: "District Office",
    floor: "3rd Floor",
    location: "Alabang Public Market",
    street: "123 Muntinlupa Boulevard",
    barangay: "Barangay Alabang",
    city: "Muntinlupa City",
    zip: "1780",
    phone: "(02) 8567-7431",
    email: "district.munticongress@gmail.com",
    hours: "Monday to Friday: 8:00 AM - 5:00 PM",
    streetViewUrl: "https://www.google.com/maps/@14.4192184,121.0444493,3a,60y,90t/data=!3m7!1e1!3m5!1sCQKQAcAQbMIIAjycGSWzcw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DCQKQAcAQbMIIAjycGSWzcw%26yaw%3D0!7i16384!8i8192?entry=ttu",
    streetViewImage: "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=CQKQAcAQbMIIAjycGSWzcw&cb_client=search.revgeo_and_fetch.gps&w=600&h=300&yaw=0&pitch=0",
    coordinates: { lat: 14.4192184, lng: 121.0444493 }
  }
};

const DualAddressCard = () => {
  const [activeOffice, setActiveOffice] = useState('legislative');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const address = officeData[activeOffice];

  const handleOpenMaps = () => {
    const url = Platform.select({
      ios: `maps://?q=${address.coordinates.lat},${address.coordinates.lng}`,
      android: `geo:${address.coordinates.lat},${address.coordinates.lng}?q=${address.coordinates.lat},${address.coordinates.lng}(${address.title})`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address.coordinates.lat},${address.coordinates.lng}`);
    });
  };

  const handleOpenStreetView = () => {
    Linking.openURL(address.streetViewUrl).catch(err => 
      console.error("Failed to open street view:", err)
    );
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <LinearGradient
      colors={['#003366', '#0275d8']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      {/* Office Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            activeOffice === 'legislative' && styles.activeToggle
          ]}
          onPress={() => setActiveOffice('legislative')}
        >
          <Text style={styles.toggleText}>Legislative</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            activeOffice === 'district' && styles.activeToggle
          ]}
          onPress={() => setActiveOffice('district')}
        >
          <Text style={styles.toggleText}>District</Text>
        </TouchableOpacity>
      </View>
      
      {/* Office Title */}
      <View style={styles.header}>
        <FontAwesome5 name="building" size={20} color="#FFFFFF" />
        <Text style={styles.title}>{address.title}</Text>
      </View>
      
      {/* Street View Preview */}
      <TouchableOpacity 
        onPress={handleOpenStreetView}
        activeOpacity={0.8}
        style={styles.streetViewContainer}
      >
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
        
        {imageError ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="map-marked-alt" size={40} color="#FFFFFF" />
            <Text style={styles.errorText}>Location Preview</Text>
          </View>
        ) : (
          <Image 
            source={{ uri: address.streetViewImage }} 
            style={styles.streetViewImage}
            resizeMode="cover"
            onLoadStart={() => {
              setImageLoading(true);
              setImageError(false);
            }}
            onLoadEnd={() => setImageLoading(false)}
            onError={handleImageError}
          />
        )}
        
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
          text={`${address.street}, ${address.city}${address.zip ? `, ${address.zip}` : ''}`} 
        />
        {address.barangay && (
          <AddressRow 
            icon="map-pin" 
            text={address.barangay} 
          />
        )}
        <AddressRow icon="phone-alt" text={address.phone} />
        <AddressRow icon="envelope" text={address.email} />
        <AddressRow icon="clock" text={address.hours} />
      </View>
      
      {/* Directions Button */}
      <TouchableOpacity 
        style={styles.directionsButton}
        onPress={handleOpenMaps}
        activeOpacity={0.8}
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
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  streetViewContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#e1e1e1',
  },
  streetViewImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003366',
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: 'bold',
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

export default DualAddressCard;