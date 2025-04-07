import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { getFirestore, doc, updateDoc } from "@react-native-firebase/firestore"; // Added getFirestore
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SetPin() {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    
    // Initialize Firestore
    const firestore = getFirestore();

    const handleSetPin = async () => {
        // Validate PIN
        if (pin.length !== 4) {
            Alert.alert("Error", "PIN must be 4 digits long");
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert("Error", "PINs do not match");
            return;
        }

        try {
            setLoading(true);
            const { uid } = route.params;

            // Update user document with PIN
            const userRef = doc(firestore, "users", uid);
            await updateDoc(userRef, {
                pinCode: pin,
                pinSet: true
            });

            // Navigate to Dashboard
            navigation.navigate("Dashboard");
        } catch (error) {
            Alert.alert("Error", "Failed to set PIN. Please try again.");
            console.log("Set PIN Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set Your PIN</Text>
            <Text style={styles.description}>
                Create a 4-digit PIN to secure your account
            </Text>

            <TextInput
                label="Enter 4-digit PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                style={styles.input}
                maxLength={4}
            />

            <TextInput
                label="Confirm PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                secureTextEntry
                style={styles.input}
                maxLength={4}
            />

            <Button
                mode="contained"
                onPress={handleSetPin}
                disabled={loading}
                style={styles.button}
            >
                {loading ? "Setting PIN..." : "Set PIN"}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 15,
    },
});