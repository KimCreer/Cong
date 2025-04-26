import React, { useState, useRef, useEffect, useCallback } from "react";
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
  useColorScheme,
  Linking,
} from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  principalAuthoredBills,
  coAuthoredBills,
  committeeMembership,
} from "../../../data/LawData";
import { Feather, MaterialIcons, AntDesign } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 150;
const TAB_UNDERLINE_WIDTH = 40;

export default function LawsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // State variables
  const [selectedSection, setSelectedSection] = useState(
    "Principal Authored Bills"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [savedItems, setSavedItems] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const scrollViewRef = useRef(null);
  const flatListRefs = useRef({});

  // Animated values
  const scrollX = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(HEADER_HEIGHT)).current;
  const tabUnderlineAnim = useRef(new Animated.Value(0)).current;

  // Data sections with their respective links
  const sections = {
    "Principal Authored Bills": {
      data: principalAuthoredBills,
      link: "https://congress.gov.ph/house-members/view/?member=K034&name=Fresnedi%2C+Jaime+R.&page=0",
    },
    "Co-Authored Bills": {
      data: coAuthoredBills,
      link: "https://congress.gov.ph/house-members/view/?member=K034&name=Fresnedi%2C+Jaime+R.&page=0",
    },
    "Committee Membership": {
      data: committeeMembership,
      link: "https://congress.gov.ph/house-members/view/?member=K034&name=Fresnedi%2C+Jaime+R.&page=0",
    },
  };

  const sectionKeys = Object.keys(sections);

  // Dynamic styles
  const dynamicStyles = {
    backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
    textColor: isDarkMode ? "#ffffff" : "#333333",
    cardBackgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
    cardTextColor: isDarkMode ? "#ffffff" : "#333333",
    headerColor: isDarkMode ? "#0a2d5a" : "#003366",
    actionButtonColor: isDarkMode ? "#4a90e2" : "#003366",
  };

  // Animated header style
  const animatedHeaderStyle = {
    height: headerHeight,
    backgroundColor: dynamicStyles.headerColor,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  };

  // Tab underline animation
  const tabUnderlinePosition = tabUnderlineAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: sectionKeys.map((_, index) => {
      const tabWidth = width / sectionKeys.length;
      return tabWidth * index + (tabWidth - TAB_UNDERLINE_WIDTH) / 2;
    }),
  });

  // Handle scroll events with debouncing
  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } }}],
      {
        useNativeDriver: false,
        listener: (event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const activeIndex = Math.round(offsetX / width);
          setSelectedSection(sectionKeys[activeIndex]);
        },
      }
    )
  ).current;

  // Handle tab press with smooth animations
  const handleTabPress = useCallback((section) => {
    const index = sectionKeys.indexOf(section);
    setSelectedSection(section);
    
    Animated.parallel([
      Animated.spring(tabUnderlineAnim, {
        toValue: index,
        useNativeDriver: true,
        tension: 30,
        friction: 8,
      }),
      Animated.spring(scrollX, {
        toValue: index * width,
        useNativeDriver: true,
        tension: 30,
        friction: 8,
      }),
    ]).start();
    
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  }, [sectionKeys]);

  // Simulate data fetching
  const fetchData = useCallback(async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.2) {
          reject("Failed to fetch data.");
        } else {
          resolve();
        }
      }, 1500);
    });
  }, []);

  // Load saved items from storage
  const loadSavedItems = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("savedItems");
      return jsonValue != null ? setSavedItems(JSON.parse(jsonValue)) : null;
    } catch (e) {
      Alert.alert("Loading Failed", "There was an error loading the saved items.");
    }
  }, []);

  // Initial data loading
  const initialLoad = useCallback(async () => {
    try {
      setLoading(true);
      await fetchData();
      setError(null);
      await loadSavedItems();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, loadSavedItems]);

  // Refresh control
  const onRefresh = useCallback(() => {
    const refreshData = async () => {
      try {
        setRefreshing(true);
        await fetchData();
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setRefreshing(false);
      }
    };
    refreshData();
  }, [fetchData]);

  useEffect(() => {
    initialLoad();
  }, [retryCount, initialLoad]);

  // Handle sharing
  const handleShare = useCallback(async (message) => {
    try {
      const result = await Share.share({
        message: message,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity type:", result.activityType);
        } else {
          console.log("Shared successfully!");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      Alert.alert("Sharing failed", error.message);
    }
  }, []);

  // Save item to storage
  const saveItem = useCallback(async (key, item) => {
    try {
      const newItem = { ...savedItems, [key]: item };
      const jsonValue = JSON.stringify(newItem);
      await AsyncStorage.setItem("savedItems", jsonValue);
      setSavedItems(newItem);
      Alert.alert("Item Saved", "This item has been saved successfully!");
    } catch (e) {
      Alert.alert("Saving Failed", "There was an error saving the item.");
    }
  }, [savedItems]);

  // Check if item is saved
  const isItemSaved = useCallback((key) => {
    return !!savedItems[key];
  }, [savedItems]);

  // Retry function
  const handleRetry = useCallback(() => {
    setRetryCount((prevCount) => prevCount + 1);
    setError(null);
  }, []);

  // Handle view more action for each section
  const handleViewMore = useCallback((section) => {
    Linking.openURL(sections[section].link).catch((err) =>
      Alert.alert("Error", "Could not open the link. Please try again later.")
    );
  }, [sections]);

  // Render item function for FlatList
  const renderItem = useCallback(({ item, section }) => (
    <Card
      style={[
        styles.card,
        { backgroundColor: dynamicStyles.cardBackgroundColor },
      ]}
    >
      <Card.Content>
        {section === "Committee Membership" ? (
          <>
            <Text
              style={[
                styles.committeeTitle,
                { color: dynamicStyles.cardTextColor },
              ]}
            >
              {item.committee}
            </Text>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Position:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {item.position || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Journal Number:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {item.journalNumber || "N/A"}
              </Text>
            </View>
            {item.additionalInfo && (
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: dynamicStyles.cardTextColor },
                  ]}
                >
                  Additional Info:
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: dynamicStyles.cardTextColor },
                  ]}
                >
                  {item.additionalInfo}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text
              style={[
                styles.lawTitle,
                { color: dynamicStyles.cardTextColor },
              ]}
            >
              {item.title}
            </Text>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Summary:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {item.summary || "No summary available."}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Significance:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {item.significance || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Date Filed:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {item.dateFiled || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                Principal Author/s:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: dynamicStyles.cardTextColor },
                ]}
              >
                {Array.isArray(item.principalAuthors) &&
                item.principalAuthors.length > 0
                  ? item.principalAuthors.join(", ")
                  : "N/A"}
              </Text>
            </View>
            {item.amendments && (
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailLabel,
                    { color: dynamicStyles.cardTextColor },
                  ]}
                >
                  Amendments:
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: dynamicStyles.cardTextColor },
                  ]}
                >
                  {item.amendments}
                </Text>
              </View>
            )}
          </>
        )}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDarkMode
                ? "rgba(74, 144, 226, 0.2)"
                : "rgba(0, 51, 102, 0.1)",
            },
          ]}
          onPress={() => handleShare(item.title)}
        >
          <Feather
            name="share-2"
            size={18}
            color={dynamicStyles.actionButtonColor}
          />
          <Text
            style={[
              styles.actionButtonText,
              { color: dynamicStyles.actionButtonColor },
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDarkMode
                ? "rgba(74, 144, 226, 0.2)"
                : "rgba(0, 51, 102, 0.1)",
            },
          ]}
          onPress={() => saveItem(item.title, item)}
          disabled={isItemSaved(item.title)}
        >
          <MaterialIcons
            name={
              isItemSaved(item.title)
                ? "bookmark"
                : "bookmark-outline"
            }
            size={20}
            color={dynamicStyles.actionButtonColor}
          />
          <Text
            style={[
              styles.actionButtonText,
              { color: dynamicStyles.actionButtonColor },
            ]}
          >
            {isItemSaved(item.title) ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  ), [dynamicStyles, handleShare, isDarkMode, isItemSaved, saveItem]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: dynamicStyles.backgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color={dynamicStyles.actionButtonColor} />
        <Text style={[styles.loadingText, { color: dynamicStyles.textColor }]}>
          Loading Laws...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: dynamicStyles.backgroundColor },
        ]}
      >
        <MaterialIcons
          name="error-outline"
          size={50}
          color="#ff4444"
          style={styles.errorIcon}
        />
        <Text style={[styles.errorText, { color: dynamicStyles.textColor }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={handleRetry}
          style={[
            styles.retryButton,
            { backgroundColor: dynamicStyles.actionButtonColor },
          ]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: dynamicStyles.backgroundColor },
      ]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: dynamicStyles.backgroundColor },
        ]}
      >
        {/* Animated Header */}
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <View style={styles.headerContent}>
            <Icon
              name="gavel"
              size={32}
              color="#ffffff"
              style={styles.headerIcon}
            />
            <Text style={[styles.headerTitle, { color: "#ffffff" }]}>
              Laws & Legislation
            </Text>
          </View>

          {/* Section Indicators */}
          <View style={styles.tabContainer}>
            {sectionKeys.map((section) => (
              <TouchableOpacity
                key={section}
                style={styles.tabButton}
                onPress={() => handleTabPress(section)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedSection === section && styles.activeTabText,
                  ]}
                >
                  {section.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
        
          </View>
        </Animated.View>

        {/* Scrollable content */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onMomentumScrollEnd={(e) => {
            const contentOffset = e.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffset / width);
            setSelectedSection(sectionKeys[index]);
          }}
          style={styles.contentScrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              enabled={!loading}
              progressBackgroundColor="#ffffff"
              colors={[dynamicStyles.actionButtonColor]}
              title="Refreshing..."
              titleColor={dynamicStyles.actionButtonColor}
              progressViewOffset={40}
            />
          }
        >
          {sectionKeys.map((section) => (
            <View key={section} style={styles.page}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: dynamicStyles.textColor },
                  ]}
                >
                  {section}
                </Text>
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => handleViewMore(section)}
                >
                  <Text 
                    style={[
                      styles.viewMoreText, 
                      { color: dynamicStyles.actionButtonColor }
                    ]}
                  >
                    View More
                  </Text>
                  <AntDesign
                    name="arrowright"
                    size={16}
                    color={dynamicStyles.actionButtonColor}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                ref={(ref) => (flatListRefs.current[section] = ref)}
                data={sections[section].data}
                keyExtractor={(item, index) => `${section}-${index}`}
                renderItem={({ item }) => renderItem({ item, section })}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
              />
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: 15,
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    position: 'relative',
  },
  tabButton: {
    paddingVertical: 8,
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: TAB_UNDERLINE_WIDTH,
    height: 3,
    borderRadius: 2,
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  page: {
    width: width,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewMoreText: {
    marginRight: 5,
    fontWeight: "500",
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lawTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 24,
  },
  committeeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontWeight: "bold",
    marginRight: 5,
  },
  detailValue: {
    flex: 1,
  },
  cardActions: {
    justifyContent: "space-around",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 6,
    fontWeight: "500",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 26,
  },
  retryButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});