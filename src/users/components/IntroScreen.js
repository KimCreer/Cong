import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Swiper from "react-native-swiper";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    title: "Welcome to MUNTINLUPA DISTRICT OFFICE",
    description: "Stay updated with the latest news, projects, and announcements from your local government.",
    image: require("../../../assets/intro1.png")
  },
  {
    title: "Get Involved in Your Community",
    description: "Submit concerns, participate in projects, and connect directly with local officials.",
    image: require("../../../assets/intro2.png")
  },
  {
    title: "Secure & Easy Access",
    description: "Sign in quickly with your phone number and a secure PIN for protected access to services.",
    image: require("../../../assets/intro3.png")
  }
];

export default function IntroScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSeenIntro, setCheckingSeenIntro] = useState(true);

  // Check if intro was already seen
  // IntroScreen.js - Update the useEffect
useEffect(() => {
  const checkIntroStatus = async () => {
    try {
      const hasSeenIntro = await AsyncStorage.getItem("hasSeenIntro");
      const hasLaunchedBefore = await AsyncStorage.getItem("hasLaunchedBefore");
      
      // If first launch, ensure hasSeenIntro is false
      if (hasLaunchedBefore !== "true") {
        await AsyncStorage.setItem("hasLaunchedBefore", "true");
        await AsyncStorage.setItem("hasSeenIntro", "false");
        return; // Stay on intro screen
      }
      
      // If not first launch and has seen intro, go to login
      if (hasSeenIntro === "true") {
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Failed to check intro status:", error);
      // On error, proceed to login as fallback
      navigation.replace("Login");
    } finally {
      setCheckingSeenIntro(false);
    }
  };

  checkIntroStatus();
}, [navigation]);

  const markIntroAsSeen = async () => {
    try {
      await AsyncStorage.setItem("hasSeenIntro", "true");
    } catch (error) {
      console.error("Failed to mark intro as seen:", error);
    }
  };
  

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await markIntroAsSeen();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      navigation.replace("Login");
    } catch (error) {
      console.error("Error in Get Started:", error);
      navigation.replace("Login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await markIntroAsSeen();
      navigation.replace("Login");
    } catch (error) {
      console.error("Error skipping intro:", error);
      navigation.replace("Login");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setCurrentIndex(0);
    }, [])
  );

  if (checkingSeenIntro) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        loop={false}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        onIndexChanged={(index) => setCurrentIndex(index)}
        showsButtons={false}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Image source={slide.image} style={styles.image} resizeMode="contain" />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>

            {index === slides.length - 1 && (
              <Button
                mode="contained"
                onPress={handleGetStarted}
                style={styles.button}
                labelStyle={styles.buttonText}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Get Started"}
              </Button>
            )}
          </View>
        ))}
      </Swiper>

      {currentIndex < slides.length - 1 && (
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          labelStyle={styles.skipText}
        >
          Skip
        </Button>
      )}
    </View>
  );
}


// ... (keep your existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003580",
    textAlign: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: "#606060",
    textAlign: "center",
    paddingHorizontal: 25,
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#003580",
    paddingVertical: 10,
    width: width * 0.7,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dot: {
    backgroundColor: "#D3D3D3",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    marginBottom: 50,
  },
  activeDot: {
    backgroundColor: "#003580",
    width: 20,
    height: 8,
    borderRadius: 4,
    marginBottom: 50,
  },
  skipButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  skipText: {
    color: "#003580",
    fontSize: 16,
  },
});