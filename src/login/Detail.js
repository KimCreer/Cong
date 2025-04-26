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
    BackHandler,
    Linking
} from "react-native";
import { TextInput, RadioButton } from "react-native-paper";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import styles from './styles/DetailStyles';

const { height, width } = Dimensions.get("window");

export default function Detail({ route, navigation }) {
    const { uid } = route.params;
    
    // Disable swipe back gesture
    React.useLayoutEffect(() => {
        navigation.setOptions({
            gestureEnabled: false,
        });
    }, [navigation]);

    // State variables
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [barangay, setBarangay] = useState("");
    const [step, setStep] = useState(1);
    const [acceptedPrivacyAgreement, setAcceptedPrivacyAgreement] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const scrollViewRef = useRef(null);

    // Date of Birth State
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear() - 18);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [tempDay, setTempDay] = useState(1);
    const [tempMonth, setTempMonth] = useState(0);
    const [tempYear, setTempYear] = useState(new Date().getFullYear() - 18);

    // Animation refs
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];
    const progressAnim = useState(new Animated.Value(0.5))[0];
    const modalAnim = useState(new Animated.Value(0))[0];
    const privacyModalAnim = useState(new Animated.Value(0))[0];

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

    // Prevent hardware back button
    useEffect(() => {
        const backAction = () => {
            if (step === 1) {
                return true;
            } else {
                handleBack();
                return true;
            }
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [step]);

    // Open date picker modal
    const openDateModal = () => {
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

    // Open privacy policy modal
    const openPrivacyModal = () => {
        setShowPrivacyModal(true);
        Animated.timing(privacyModalAnim, {
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
                setDay(tempDay);
                setMonth(tempMonth);
                setYear(tempYear);
            }
            setDateModalVisible(false);
        });
    };

    // Close privacy policy modal
    const closePrivacyModal = () => {
        Animated.timing(privacyModalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowPrivacyModal(false);
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
                if (!acceptedPrivacyAgreement) {
                    showError("Please accept the data privacy agreement to continue");
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

    // Save details to Firestore and navigate to Dashboard
    const saveDetails = async () => {
        if (!validateStep()) return;
    
        try {
            const userData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                dob: `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                gender: gender.trim(),
                address: address.trim(),
                barangay: barangay.trim(),
                privacyAgreementAccepted: true,
                privacyAgreementDate: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
    
            const db = getFirestore();
            await setDoc(doc(collection(db, "users"), uid), userData, { merge: true });
    
            navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
            });
            
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
                    <View style={{ width: 24 }} />
                    <Text style={styles.headerTitle}>Constituent Profile</Text>
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
                                    left={<TextInput.Icon icon="account" color="#1E3A8A" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#1E3A8A", 
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
                                    left={<TextInput.Icon icon="account-outline" color="#1E3A8A" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#1E3A8A", 
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
                                    left={<TextInput.Icon icon="email" color="#1E3A8A" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#1E3A8A", 
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
                                    <MaterialCommunityIcons name="calendar" size={22} color="#1E3A8A" />
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
                                                    color="#1E3A8A"
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
                                                color={gender === value ? "#1E3A8A" : "#6B7280"}
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
                                    left={<TextInput.Icon icon="home" color="#1E3A8A" />}
                                    theme={{ 
                                        colors: { 
                                            primary: "#1E3A8A", 
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

                            {/* Privacy Agreement Section */}
                            <View style={styles.privacyContainer}>
                                <TouchableOpacity 
                                    style={styles.checkboxContainer}
                                    onPress={() => setAcceptedPrivacyAgreement(!acceptedPrivacyAgreement)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        acceptedPrivacyAgreement && styles.checkboxChecked
                                    ]}>
                                        {acceptedPrivacyAgreement && (
                                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                    <Text style={styles.privacyText}>
                                        I consent to the processing of my personal data by the Office of Congressman Jaime R. Fresnedi in accordance with the {' '}
                                        <Text 
                                            style={styles.privacyLink}
                                            onPress={openPrivacyModal}
                                        >
                                            District Office Privacy Policy
                                        </Text> and Republic Act 10173.
                                    </Text>
                                </TouchableOpacity>
                                {!acceptedPrivacyAgreement && (
                                    <Text style={styles.errorText}>You must accept the privacy agreement to continue</Text>
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
                            colors={['#1E3A8A', '#1E40AF']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.nextButtonText}>
                                {step < 2 ? "Next" : "Submit"}
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

                {/* Privacy Policy Modal */}
                <Modal
                    visible={showPrivacyModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closePrivacyModal}
                >
                    <View style={styles.privacyModalContainer}>
                        <Animated.View 
                            style={[
                                styles.privacyModalContent,
                                {
                                    transform: [{
                                        translateY: privacyModalAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [500, 0]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <View style={styles.privacyModalHeader}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <MaterialCommunityIcons name="shield-account" size={24} color="#1E3A8A" style={{marginRight: 10}} />
                                    <Text style={styles.privacyModalTitle}>Muntinlupa District Office Privacy Policy</Text>
                                </View>
                                <TouchableOpacity onPress={closePrivacyModal}>
                                    <MaterialCommunityIcons name="close" size={22} color="#374151" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.privacyScrollView}>
                                <Text style={styles.privacyIntroText}>
                                    This privacy policy governs how the Office of Congressman Jaime R. Fresnedi collects, uses, maintains, and discloses information collected from users of this constituent services application.
                                </Text>
                                
                                <Text style={styles.privacySectionTitle}>1. Information We Collect</Text>
                                <Text style={styles.privacyText}>
                                    We collect the following personal data to serve you better:
                                    {"\n\n"}• Full name and contact details
                                    {"\n"}• Address and barangay information
                                    {"\n"}• Constituent concerns and requests
                                    {"\n"}• Service utilization records
                                </Text>
                                
                                <Text style={styles.privacySectionTitle}>2. Purpose of Data Collection</Text>
                                <Text style={styles.privacyText}>
                                    Your information helps us:
                                    {"\n\n"}• Process your constituent requests
                                    {"\n"}• Deliver district services efficiently
                                    {"\n"}• Improve public service delivery
                                    {"\n"}• Communicate important district updates
                                    {"\n"}• Maintain records for legislative purposes
                                </Text>
                                
                                <Text style={styles.privacySectionTitle}>3. Data Protection Measures</Text>
                                <Text style={styles.privacyText}>
                                    We implement security protocols including:
                                    {"\n\n"}• Secure database encryption
                                    {"\n"}• Limited access to authorized personnel only
                                    {"\n"}• Regular system security audits
                                    {"\n"}• Compliance with Data Privacy Act of 2012 (RA 10173)
                                </Text>
                                
                                <Text style={styles.privacySectionTitle}>4. Your Rights as a Constituent</Text>
                                <Text style={styles.privacyText}>
                                    Under Philippine law, you have the right to:
                                    {"\n\n"}• Request access to your data
                                    {"\n"}• Correct inaccurate information
                                    {"\n"}• Request deletion of your data
                                    {"\n"}• File complaints with the National Privacy Commission
                                </Text>
                                
                                <Text style={styles.privacySectionTitle}>5. Contact Information</Text>
                                <Text style={styles.privacyText}>
                                    For privacy concerns, contact:
                                    {"\n\n"}Congressman Jaime R. Fresnedi District Office
                                    {"\n"}Muntinlupa City Hall Compound
                                    {"\n"}Phone: (02) 8862-2565
                                    {"\n"}Email: fresnedi.districtoffice@muntinlupa.gov.ph
                                    {"\n\n"}Data Protection Officer:
                                    {"\n"}Atty. Juan Dela Cruz
                                    {"\n"}DPO@fresnedi-district.com
                                </Text>
                            </ScrollView>
                            
                            <TouchableOpacity 
                                style={styles.privacyCloseButton}
                                onPress={closePrivacyModal}
                            >
                                <Text style={styles.privacyCloseButtonText}>I Understand</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            </View>
        </TouchableWithoutFeedback>
    );
}