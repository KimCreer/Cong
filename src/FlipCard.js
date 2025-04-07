import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const FlipCard = ({ front, back, isFlipped }) => {
    const rotateY = useSharedValue(0);

    React.useEffect(() => {
        rotateY.value = withTiming(isFlipped ? 180 : 0, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
        });
    }, [isFlipped]);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY.value}deg` },
            ],
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY.value + 180}deg` },
            ],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.card, frontAnimatedStyle]}>
                {front}
            </Animated.View>
            <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
                {back}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 40,
        height: 400,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backfaceVisibility: "hidden",
        position: "absolute",
    },
    backCard: {
        backgroundColor: "#FFFFFF",
    },
});

export default FlipCard;