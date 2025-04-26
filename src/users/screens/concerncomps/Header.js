import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native'; // Added Platform here
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';

const Header = ({ title, onBackPress, showForm, setShowForm }) => {
  return (
    <LinearGradient
      colors={['#0275d8', '#025aa5']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.headerContent}>
        {showForm ? (
          <TouchableOpacity 
            onPress={() => setShowForm(false)}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={onBackPress} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 40,
  },
});

export default Header;