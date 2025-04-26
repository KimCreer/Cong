import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CategoryFilterItem from './CategoryFilterItem';
import { CATEGORIES } from './constants';

const CategoryFilter = React.memo(({ 
  categories = CATEGORIES, 
  activeCategory, 
  onSelect 
}) => (
  <View style={styles.filterWrapper}>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {categories.map((category) => (
        <CategoryFilterItem
          key={category}
          category={category}
          isActive={activeCategory === category}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
    <LinearGradient
      colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.filterGradientRight}
    />
  </View>
));

const styles = StyleSheet.create({
  filterWrapper: {
    position: 'relative',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
  },
});

export default CategoryFilter;