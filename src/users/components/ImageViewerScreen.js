import React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ImageViewerScreen = ({ route, navigation }) => {
  // Get the imageUrl from the navigation route params
  const { imageUrl } = route.params;

  return (
    <View style={styles.container}>
      {/* Header with a back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Image Viewer</Text>
      </View>

      {/* Full-screen image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Black background for full-screen image viewing
  },
  header: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1, // Ensure the header is above the image
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default ImageViewerScreen;