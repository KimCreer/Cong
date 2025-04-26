import React, { useRef } from 'react'; // Added useRef import here
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CATEGORY_ICONS } from './constants'; // Added missing import

const CategoryFilterItem = React.memo(({ 
  category, 
  isActive, 
  onSelect 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 2,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onSelect(category)}
      activeOpacity={0.8}
    >
      <Animated.View style={[
        styles.filterItem,
        isActive && styles.filterItemActive,
        { 
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ] 
        }
      ]}>
        <View style={styles.filterItemContent}>
          <Icon 
            name={CATEGORY_ICONS[category]} 
            size={18} 
            color={isActive ? '#ffffff' : '#4a6da7'} 
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterText,
            isActive && styles.filterTextActive
          ]}>
            {category}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  filterItem: {
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterItemActive: {
    backgroundColor: '#4a6da7',
    borderColor: '#4a6da7',
    shadowColor: '#4a6da7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default CategoryFilterItem;