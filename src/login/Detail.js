import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Alert,
    StyleSheet,
    ScrollView,
    Text,
    Dimensions,
    Animated,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    StatusBar,
    Modal,
} from "react-native";
import { TextInput, RadioButton } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { height, width } = Dimensions.get("window");

export default function Detail({ route, navigation }) {
    const { uid } = route.params;
    
    // Updated state with firstName and lastName
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [barangay, setBarangay] = useState("");
    const [step, setStep] = useState(1);
    const scrollViewRef = useRef(null);

    // Date of Birth State
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear() - 18);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [tempDay, setTempDay] = useState(1);
    const [tempMonth, setTempMonth] = useState(0);
    const [tempYear, setTempYear] = useState(new Date().getFullYear() - 18);

    // Animation for step transitions
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];
    const progressAnim = useState(new Animated.Value(0.5))[0];
    const modalAnim = useState(new Animated.Value(0))[0];

    // Month names
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // List of barangays in Muntinlupa City
    const barangays = [
        "Alabang", "Ayala Alabang", "Bayanan", "Buli", "Cupang",
        "Poblacion", "Putatan", "Sucat", "Tunasan",
    ];

    // Generate days based on the selected month and year
    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Generate arrays for days, months, and years
    const [days, setDays] = useState(Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1));
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    // Update days array when month or year changes in the modal
    useEffect(() => {
        const daysInMonth = getDaysInMonth(tempMonth, tempYear);
        setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
        if (tempDay > daysInMonth) setTempDay(daysInMonth);
    }, [tempMonth, tempYear]);

    // Update progress animation when step changes
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: step === 1 ? 0.5 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [step]);

    // Scroll to top when step changes
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
    }, [step]);

    // Open date picker modal
    const openDateModal = () => {
        // Set temp values to current selections
        setTempDay(day);
        setTempMonth(month);
        setTempYear(year);
        
        setDateModalVisible(true);
        Animated.timing(modalAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Close date picker modal
    const closeDateModal = (save = false) => {
        Animated.timing(modalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (save) {
                // Save the temporary selections
                setDay(tempDay);
                setMonth(tempMonth);
                setYear(tempYear);
            }
            setDateModalVisible(false);
        });
    };

    // Validate inputs for each step
    const validateStep = () => {
        switch (step) {
            case 1:
                if (!firstName.trim()) {
                    showError("First name is required!");
                    return false;
                }
                if (!lastName.trim()) {
                    showError("Last name is required!");
                    return false;
                }
                if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
                    showError("Please enter a valid email address.");
                    return false;
                }
                return true;
            case 2:
                if (!["Male", "Female", "Other"].includes(gender)) {
                    showError("Please select a valid gender.");
                    return false;
                }
                if (address.trim().length < 3) {
                    showError("Address must be at least 3 characters long.");
                    return false;
                }
                if (!barangay.trim()) {
                    showError("Please select a barangay.");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    // Show error with animation
    const showError = (message) => {
        Alert.alert("Error", message);
    };

    // Handle next step with animation
    const handleNext = () => {
        if (validateStep()) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -width,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setStep(step + 1);
                fadeAnim.setValue(1);
                slideAnim.setValue(0);
            });
        }
    };

    // Handle previous step with animation
    const handleBack = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: width,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setStep(step - 1);
            fadeAnim.setValue(1);
            slideAnim.setValue(0);
        });
    };

    // Save details to Firestore
    const saveDetails = async () => {
        if (!validateStep()) return;

        try {
            const userData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dob: `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                gender: gender.trim(),
                address: address.trim(),
                barangay: barangay.trim(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (email.trim()) {
                userData.email = email.trim();
            }

            await firestore().collection("users").doc(uid).set(userData, { merge: true });

            Alert.alert(
                "Success", 
                "Your details have been saved successfully!", 
                [{ text: "Continue", onPress: () => navigation.navigate("Dashboard") }]
            );
        } catch (error) {
            console.error("Error saving details: ", error);
            Alert.alert("Error", "Failed to save details. Please try again.");
        }
    };

    // Format date of birth for display
    const getFormattedDate = () => {
        return `${day} ${monthNames[month]} ${year}`;
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
                
                {/* Header with Progress Bar */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backIcon} 
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your Profile</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View 
                                style={[
                                    styles.progressFill, 
                                    { width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })}
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>{step}/2</Text>
                    </View>
                </View>

                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Step 1: Personal Information */}
                    {step === 1 && (
                        <Animated.View 
                            style={[
                                { opacity: fadeAnim },
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                        >
                            <Text style={styles.title}>Personal Information</Text>
                            <Text style={styles.subtitle}>Please provide your basic details below</Text>
                            
                            {/* First Name Field */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    mode="outlined"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    style={styles.input}
                                    placeholder="ex. Juan"
                                    error={!firstName.trim()}
                                    left={<TextInput.Icon icon="account" color="#38BDF8" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#38BDF8", 
                                            background: "#FFFFFF",
                                            error: "#EF4444"
                                        } 
                                    }}
                                />
                                {!firstName.trim() && <Text style={styles.errorText}>First name is required</Text>}
                            </View>

                            {/* Last Name Field */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    mode="outlined"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    style={styles.input}
                                    placeholder="ex. Dela Cruz"
                                    error={!lastName.trim()}
                                    left={<TextInput.Icon icon="account-outline" color="#38BDF8" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#38BDF8", 
                                            background: "#FFFFFF",
                                            error: "#EF4444"
                                        } 
                                    }}
                                />
                                {!lastName.trim() && <Text style={styles.errorText}>Last name is required</Text>}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email Address <Text style={styles.optionalText}>(Optional)</Text></Text>
                                <TextInput
                                    mode="outlined"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    style={styles.input}
                                    placeholder="yourname@example.com"
                                    error={email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())}
                                    left={<TextInput.Icon icon="email" color="#38BDF8" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#38BDF8", 
                                            background: "#FFFFFF",
                                            error: "#EF4444"
                                        } 
                                    }}
                                />
                                {email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()) && (
                                    <Text style={styles.errorText}>Please enter a valid email</Text>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TouchableOpacity 
                                    style={styles.datePickerButton}
                                    onPress={openDateModal}
                                >
                                    <MaterialCommunityIcons name="calendar" size={22} color="#38BDF8" />
                                    <Text style={styles.datePickerButtonText}>
                                        {getFormattedDate()}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* Step 2: Combined Gender and Address */}
                    {step === 2 && (
                        <Animated.View 
                            style={[
                                { opacity: fadeAnim },
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                        >
                            <Text style={styles.title}>Gender and Address</Text>
                            <Text style={styles.subtitle}>Please provide your gender and address details</Text>
                            
                            {/* Gender Section */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderContainer}>
                                    {["Male", "Female", "Other"].map((value, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.genderOption,
                                                gender === value && styles.genderSelected
                                            ]}
                                            onPress={() => setGender(value)}
                                        >
                                            <View style={styles.radioWrapper}>
                                                <RadioButton
                                                    value={value}
                                                    status={gender === value ? 'checked' : 'unchecked'}
                                                    color="#38BDF8"
                                                    uncheckedColor="#6B7280"
                                                    onPress={() => setGender(value)}
                                                />
                                                <Text 
                                                    style={[
                                                        styles.genderText,
                                                        gender === value && styles.genderTextSelected
                                                    ]}
                                                    >
                                                        {value}
                                                    </Text>
                                                </View>
                                                <MaterialCommunityIcons
                                                    name={
                                                        value === "Male" ? "gender-male" :
                                                        value === "Female" ? "gender-female" :
                                                        "gender-non-binary"
                                                    }
                                                    size={20}
                                                    color={gender === value ? "#38BDF8" : "#6B7280"}
                                                    style={styles.genderIcon}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
    
                                {/* Address Section */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Street Address</Text>
                                    <TextInput
                                        mode="outlined"
                                        value={address}
                                        onChangeText={setAddress}
                                        style={styles.input}
                                        placeholder="Enter your complete street address"
                                        error={address.trim().length < 3}
                                        left={<TextInput.Icon icon="home" color="#38BDF8" />}
                                        theme={{ 
                                            colors: { 
                                                primary: "#38BDF8", 
                                                background: "#FFFFFF",
                                                error: "#EF4444"
                                            } 
                                        }}
                                        multiline
                                    />
                                    {address.trim().length < 3 && address.trim().length > 0 && (
                                        <Text style={styles.errorText}>Address must be at least 3 characters</Text>
                                    )}
                                </View>
    
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Barangay</Text>
                                    <View style={styles.barangayContainer}>
                                        {barangays.map((item, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.barangayOption,
                                                    barangay === item && styles.barangaySelected
                                                ]}
                                                onPress={() => setBarangay(item)}
                                            >
                                                <Text 
                                                    style={[
                                                        styles.barangayText,
                                                        barangay === item && styles.barangayTextSelected
                                                    ]}
                                                >
                                                    {item}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {!barangay.trim() && (
                                        <Text style={styles.errorText}>Please select a barangay</Text>
                                    )}
                                </View>
                            </Animated.View>
                        )}
                    </ScrollView>
    
                    {/* Bottom Action Buttons */}
                    <View style={styles.bottomActions}>
                        {step > 1 && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                            style={[styles.nextButton, step === 1 ? styles.nextButtonFull : {}]}
                            onPress={step < 2 ? handleNext : saveDetails}
                        >
                            <LinearGradient
                                colors={['#38BDF8', '#0284C7']}
                                style={styles.gradientButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.nextButtonText}>
                                    {step < 2 ? "Next" : "Save"}
                                </Text>
                                {step < 2 ? (
                                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                                ) : (
                                    <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
    
                    {/* Date Picker Modal */}
                    <Modal
                        visible={dateModalVisible}
                        transparent={true}
                        animationType="none"
                        onRequestClose={() => closeDateModal(false)}
                    >
                        <TouchableWithoutFeedback onPress={() => closeDateModal(false)}>
                            <View style={styles.modalOverlay}>
                                <TouchableWithoutFeedback>
                                    <Animated.View 
                                        style={[
                                            styles.modalContainer,
                                            {
                                                opacity: modalAnim,
                                                transform: [
                                                    { 
                                                        translateY: modalAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [300, 0]
                                                        }) 
                                                    }
                                                ]
                                            }
                                        ]}
                                    >
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Select Date of Birth</Text>
                                            <TouchableOpacity onPress={() => closeDateModal(false)}>
                                                <MaterialCommunityIcons name="close" size={24} color="#374151" />
                                            </TouchableOpacity>
                                        </View>
    
                                        <View style={styles.datePickerContainer}>
                                            {/* Day Picker */}
                                            <View style={styles.dateColumn}>
                                                <Text style={styles.dateColumnHeader}>Day</Text>
                                                <ScrollView 
                                                    showsVerticalScrollIndicator={false}
                                                    style={styles.dateScrollView}
                                                    contentContainerStyle={styles.dateScrollContent}
                                                >
                                                    {days.map((d) => (
                                                        <TouchableOpacity
                                                            key={`day-${d}`}
                                                            style={[
                                                                styles.dateItem,
                                                                tempDay === d && styles.dateItemSelected
                                                            ]}
                                                            onPress={() => setTempDay(d)}
                                                        >
                                                            <Text 
                                                                style={[
                                                                    styles.dateItemText,
                                                                    tempDay === d && styles.dateItemTextSelected
                                                                ]}
                                                            >
                                                                {d}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
    
                                            {/* Month Picker */}
                                            <View style={styles.dateColumn}>
                                                <Text style={styles.dateColumnHeader}>Month</Text>
                                                <ScrollView 
                                                    showsVerticalScrollIndicator={false}
                                                    style={styles.dateScrollView}
                                                    contentContainerStyle={styles.dateScrollContent}
                                                >
                                                    {monthNames.map((m, index) => (
                                                        <TouchableOpacity
                                                            key={`month-${index}`}
                                                            style={[
                                                                styles.dateItem,
                                                                tempMonth === index && styles.dateItemSelected
                                                            ]}
                                                            onPress={() => setTempMonth(index)}
                                                        >
                                                            <Text 
                                                                style={[
                                                                    styles.dateItemText,
                                                                    tempMonth === index && styles.dateItemTextSelected
                                                                ]}
                                                            >
                                                                {m}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
    
                                            {/* Year Picker */}
                                            <View style={styles.dateColumn}>
                                                <Text style={styles.dateColumnHeader}>Year</Text>
                                                <ScrollView 
                                                    showsVerticalScrollIndicator={false}
                                                    style={styles.dateScrollView}
                                                    contentContainerStyle={styles.dateScrollContent}
                                                >
                                                    {years.map((y) => (
                                                        <TouchableOpacity
                                                            key={`year-${y}`}
                                                            style={[
                                                                styles.dateItem,
                                                                tempYear === y && styles.dateItemSelected
                                                            ]}
                                                            onPress={() => setTempYear(y)}
                                                        >
                                                            <Text 
                                                                style={[
                                                                    styles.dateItemText,
                                                                    tempYear === y && styles.dateItemTextSelected
                                                                ]}
                                                            >
                                                                {y}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        </View>
    
                                        <View style={styles.modalFooter}>
                                            <TouchableOpacity 
                                                style={styles.cancelButton}
                                                onPress={() => closeDateModal(false)}
                                            >
                                                <Text style={styles.cancelButtonText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.confirmButton}
                                                onPress={() => closeDateModal(true)}
                                            >
                                                <Text style={styles.confirmButtonText}>Confirm</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        );
    }
    
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#F9FAFB",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 15,
            paddingBottom: 10,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
        },
        backIcon: {
            padding: 8,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: "#1F2937",
            marginLeft: 10,
        },
        progressContainer: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
        },
        progressBar: {
            height: 8,
            width: 100,
            backgroundColor: "#E5E7EB",
            borderRadius: 4,
            marginRight: 8,
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            backgroundColor: "#38BDF8",
            borderRadius: 4,
        },
        progressText: {
            fontSize: 14,
            fontWeight: "500",
            color: "#4B5563",
        },
        scrollContainer: {
            padding: 20,
            paddingBottom: 100,
        },
        title: {
            fontSize: 24,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: "#6B7280",
            marginBottom: 24,
        },
        inputContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 16,
            fontWeight: "500",
            color: "#4B5563",
            marginBottom: 8,
        },
        optionalText: {
            fontSize: 14,
            color: "#9CA3AF",
            fontWeight: "400",
        },
        input: {
            backgroundColor: "#FFFFFF",
        },
        errorText: {
            fontSize: 12,
            color: "#EF4444",
            marginTop: 4,
        },
        datePickerButton: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 4,
            padding: 12,
        },
        datePickerButtonText: {
            flex: 1,
            fontSize: 16,
            color: "#1F2937",
            marginLeft: 10,
        },
        genderContainer: {
            flexDirection: "column",
            gap: 10,
        },
        genderOption: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 8,
            padding: 12,
        },
        genderSelected: {
            borderColor: "#38BDF8",
            backgroundColor: "#F0F9FF",
        },
        radioWrapper: {
            flexDirection: "row",
            alignItems: "center",
        },
        genderText: {
            fontSize: 16,
            color: "#4B5563",
            marginLeft: 8,
        },
        genderTextSelected: {
            color: "#0284C7",
            fontWeight: "500",
        },
        genderIcon: {
            marginLeft: 10,
        },
        barangayContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
        },
        barangayOption: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 20,
        },
        barangaySelected: {
            borderColor: "#38BDF8",
            backgroundColor: "#F0F9FF",
        },
        barangayText: {
            fontSize: 14,
            color: "#4B5563",
        },
        barangayTextSelected: {
            color: "#0284C7",
            fontWeight: "500",
        },
        bottomActions: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            padding: 16,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
        },
        backButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 8,
            marginRight: 12,
        },
        backButtonText: {
            color: "#374151",
            fontWeight: "500",
            marginLeft: 8,
        },
        nextButton: {
            flex: 1,
            borderRadius: 8,
            overflow: "hidden",
        },
        nextButtonFull: {
            flex: 1,
        },
        gradientButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
        },
        nextButtonText: {
            color: "#FFFFFF",
            fontWeight: "600",
            fontSize: 16,
            marginRight: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
        },
        modalContainer: {
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 30,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: "#1F2937",
        },
        datePickerContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
        },
        dateColumn: {
            flex: 1,
            marginHorizontal: 5,
        },
        dateColumnHeader: {
            textAlign: "center",
            fontSize: 14,
            color: "#6B7280",
            marginBottom: 10,
            fontWeight: "500",
        },
        dateScrollView: {
            height: 200,
        },
        dateScrollContent: {
            paddingVertical: 10,
        },
        dateItem: {
            paddingVertical: 10,
            alignItems: "center",
            justifyContent: "center",
        },
        dateItemSelected: {
            backgroundColor: "#F0F9FF",
            borderRadius: 8,
        },
        dateItemText: {
            fontSize: 16,
            color: "#4B5563",
        },
        dateItemTextSelected: {
            color: "#0284C7",
            fontWeight: "600",
        },
        modalFooter: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 10,
        },
        cancelButton: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 8,
            marginRight: 12,
        },
        cancelButtonText: {
            color: "#374151",
            fontWeight: "500",
        },
        confirmButton: {
            backgroundColor: "#38BDF8",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
        },
        confirmButtonText: {
            color: "#FFFFFF",
            fontWeight: "500",
        },
        stepContent: {
            marginBottom: 20,
        },
        calendarIcon: {
            marginRight: 10,
        },
        formSection: {
            marginBottom: 24,
        },
        sectionHeader: {
            fontSize: 18,
            fontWeight: "600",
            color: "#1F2937",
            marginBottom: 16,
        },
        phoneInputContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        countryCodeContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 4,
            padding: 12,
            marginRight: 10,
            width: 100,
        },
        countryCodeText: {
            fontSize: 16,
            color: "#1F2937",
            marginLeft: 5,
        },
        phoneNumberInput: {
            flex: 1,
            backgroundColor: "#FFFFFF",
        },
    });

    // Helper functions for the component (outside the component but part of the module)
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validatePhone = (phone) => {
        // Basic validation for Philippines phone number (assumes 10 digits without country code)
        return /^\d{10}$/.test(phone);
    };

    const calculateAge = (birthdate) => {
        const today = new Date();
        const birthDate = new Date(birthdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    };

