import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Linking
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from 'react-native-linear-gradient';

// Enhanced NLP-inspired help response system with medical focus
const INTENT_RESPONSES = {
    greeting: [
        "Mabuhay po! 👋 Ako po ang Muntinlupa AI Assistant ni Congressman Jaime R. Fresnedi. Paano ko po kayo matutulungan ngayon?",
        "Kumusta po! Welcome po sa Muntinlupa District Office digital services. Ano pong maitutulong ko sa inyo?",
        "Magandang araw po! Nandito po ako para tulungan kayo sa inyong mga kailangan sa distrito, lalo na po sa medical assistance."
    ],
    medical: {
        guarantee: {
            intro: "Para po sa Guarantee Letter assistance sa mga sumusunod na hospitals:",
            hospitals: [
                "• Medical Center Muntinlupa (MCM)",
                "• Ospital ng Muntinlupa",
                "• Las Piñas General Hospital",
                "• San Lorenzo Ruiz Women's Hospital"
            ],
            requirements: [
                "• Clinical Abstract (In-Patients) / Medical Certificate (Outpatients)",
                "• Certification of Unavailability",
                "• Laboratory Results",
                "• Social Case Study",
                "• Valid ID",
                "• Voter's ID",
                "• Certificate of Indigency"
            ],
            process: "Pumunta lang po sa aming office sa 3rd Floor ng Alabang Public Market ng may dalang complete requirements. Open po kami Monday to Friday, 8AM-5PM."
        },
        financial: {
            intro: "Available po ang medical financial assistance para sa mga sumusunod na DOH hospitals:",
            hospitals: [
                "• Philippine Heart Center",
                "• National Kidney and Transplant Institute (NKTI)",
                "• Dr. Jose N. Rodriguez Memorial Hospital",
                "• Amang Rodriguez Memorial Medical Center",
                "• 15+ other DOH hospitals"
            ],
            requirements: [
                "• Medical Certificate (within 3 months)",
                "• Quotation/Bill (All Pages)",
                "• Valid ID (Muntinlupa address)",
                "• Voter's ID/COMELEC Certification",
                "• Certificate of Indigency"
            ],
            amount: "Ang maximum assistance po ay depende sa assessment ng aming social worker. Karaniwan po ay ₱5,000-₱20,000 para sa major cases."
        },
        dswd: {
            intro: "Para po sa DSWD Medical Assistance, ito po ang requirements:",
            requirements: [
                "• DSWD Prescribed Request Form",
                "• Certificate of Indigency",
                "• Medical Certificate/Abstract",
                "• Prescription/Lab Request",
                "• Unpaid Hospital Bill",
                "• Social Case Study (for dialysis/cancer)"
            ],
            note: "Ang DSWD assistance po ay separate sa aming district medical aid. Pwede po kayong mag-apply sa pareho."
        }
    },
    appointment: {
        primary: "Para po sa appointment booking sa district office, narito po ang mga options:",
        steps: [
            "1. Piliin po ang uri ng consultation (personal, online, o phone)",
            "2. Pumili po ng preferred date at oras (Lunes hanggang Biyernes, 8AM-5PM)",
            "3. Magbigay po ng maikling description ng inyong concern"
        ],
        medicalPriority: "Priority po ang mga medical assistance requests. Pwede pong walk-in pero mas mabilis po kung may appointment.",
        contact: "Pwede rin po kayong mag-email sa appointment@fresnedi.gov.ph o tumawag sa (02) 8123-4567"
    },
    location: {
        primary: "Ang aming District Office po ay may dalawang locations:",
        districtOffice: {
            label: "🏢 District Office (Muntinlupa)",
            address: [
                "3rd Floor, Building A, Alabang Central Market",
                "1770, Muntinlupa City"
            ],
            map: "https://maps.app.goo.gl/fJRhAfEWSjfvjUVR7",
            phone: "(02) 8567-7431",
            email: "district.munticongress@gmail.com"
        },
        legislativeOffice: {
            label: "🏛 Legislative Office (Quezon City)",
            address: [
                "Room 425, South Wing Annex Building",
                "House of Representatives",
                "Constitution Hills 1126, Quezon City"
            ],
            map: "https://maps.app.goo.gl/Qm1i3EdXfxPr8jMWA",
            phone: "(02) 8442-4205",
            email: "jaime.fresnedi@house.gov.ph"
        },
        hours: "⏰ Office Hours: Monday - Friday, 8:00 AM - 5:00 PM"
    },
    contact: {
        primary: "Maaari niyo pong i-contact ang aming mga offices:",
        districtOffice: {
            label: "🏢 District Office (Muntinlupa)",
            phone: "(02) 8567-7431",
            email: "district.munticongress@gmail.com",
            map: "https://maps.app.goo.gl/fJRhAfEWSjfvjUVR7"
        },
        legislativeOffice: {
            label: "🏛 Legislative Office (Quezon City)",
            phone: "(02) 8442-4205",
            email: "jaime.fresnedi@house.gov.ph",
            map: "https://maps.app.goo.gl/Qm1i3EdXfxPr8jMWA"
        },
        hotlines: [
            "📞 Medical Assistance Hotline: 0917-123-4567",
            "📞 Grievance Officer: (02) 8123-4568"
        ],
        hours: "⏰ Office Hours: Monday - Friday, 8:00 AM - 5:00 PM"
    },
    gratitude: [
        "Walang anuman po! Kung may iba pa po kayong katanungan tungkol sa medical assistance, nandito lang po ako para tumulong.",
        "Salamat din po! Always happy to serve Muntinlupa constituents, lalo na po sa health concerns.",
        "My pleasure po! Para po yan sa kalusugan ng ating mga kababayan sa Muntinlupa."
    ]
};

// Enhanced AI-driven response generator with medical focus
const generateResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Improved intent matching with medical terms
    const intents = {
        greeting: ['hi', 'hello', 'hey', 'kumusta', 'magandang', 'mabuhay'],
        medical: [
            'medical', 'hospital', 'guarantee', 'financial aid', 'tulong medical', 
            'gamot', 'opera', 'dialysis', 'check-up', 'treatment', 'bill', 'bayarin',
            'pharmacy', 'botika', 'emergency', 'er', 'operation', 'surgery'
        ],
        appointment: ['appointment', 'book', 'schedule', 'puntahan', 'consult', 'konsulta'],
        location: ['location', 'address', 'map', 'punta', 'san', 'saan', 'office', 'opisin'],
        contact: ['contact', 'number', 'email', 'tawag', 'tawagan', 'social media'],
        thanks: ['thank', 'salamat', 'maraming', 'appreciate']
    };

    // Detect intent with priority on medical terms
    const detectIntent = () => {
        // Check for medical terms first
        if (intents.medical.some(term => input.includes(term))) {
            if (input.includes('guarantee') || input.includes('mcm') || input.includes('ospital ng muntinlupa')) {
                return 'medical-guarantee';
            }
            if (input.includes('dswd')) {
                return 'medical-dswd';
            }
            return 'medical-financial';
        }
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (intent !== 'medical' && keywords.some(keyword => input.includes(keyword))) {
                return intent;
            }
        }
        return 'default';
    };

    const intent = detectIntent();

    switch (intent) {
        case 'greeting':
            return INTENT_RESPONSES.greeting[Math.floor(Math.random() * INTENT_RESPONSES.greeting.length)];
        
        case 'medical-guarantee':
            return [
                INTENT_RESPONSES.medical.guarantee.intro,
                ...INTENT_RESPONSES.medical.guarantee.hospitals,
                "\nRequirements:",
                ...INTENT_RESPONSES.medical.guarantee.requirements,
                `\nProcess: ${INTENT_RESPONSES.medical.guarantee.process}`,
                "\nNeed more info? Call our Medical Hotline: 0917-123-4567"
            ].join('\n');
        
        case 'medical-financial':
            return [
                INTENT_RESPONSES.medical.financial.intro,
                ...INTENT_RESPONSES.medical.financial.hospitals.slice(0, 4),
                `• + ${INTENT_RESPONSES.medical.financial.hospitals.length - 4} more DOH hospitals`,
                "\nRequirements:",
                ...INTENT_RESPONSES.medical.financial.requirements,
                `\nAssistance Amount: ${INTENT_RESPONSES.medical.financial.amount}`,
                "\nPwede rin po kayong mag-inquire sa: medical@fresnedi.gov.ph"
            ].join('\n');
        
        case 'medical-dswd':
            return [
                INTENT_RESPONSES.medical.dswd.intro,
                ...INTENT_RESPONSES.medical.dswd.requirements,
                `\nNote: ${INTENT_RESPONSES.medical.dswd.note}`,
                "\nDSWD Office: Ground Floor, Alabang Public Market"
            ].join('\n');
        
        case 'appointment':
            return [
                INTENT_RESPONSES.appointment.primary,
                ...INTENT_RESPONSES.appointment.steps,
                `\nMedical Priority: ${INTENT_RESPONSES.appointment.medicalPriority}`,
                `\nContact: ${INTENT_RESPONSES.appointment.contact}`
            ].join('\n');
        
        case 'location':
            return [
                INTENT_RESPONSES.location.primary,
                "",
                INTENT_RESPONSES.location.districtOffice.label,
                ...INTENT_RESPONSES.location.districtOffice.address,
                `📞 ${INTENT_RESPONSES.location.districtOffice.phone}`,
                `📧 ${INTENT_RESPONSES.location.districtOffice.email}`,
                `🗺 Map: ${INTENT_RESPONSES.location.districtOffice.map}`,
                "",
                INTENT_RESPONSES.location.legislativeOffice.label,
                ...INTENT_RESPONSES.location.legislativeOffice.address,
                `📞 ${INTENT_RESPONSES.location.legislativeOffice.phone}`,
                `📧 ${INTENT_RESPONSES.location.legislativeOffice.email}`,
                `🗺 Map: ${INTENT_RESPONSES.location.legislativeOffice.map}`,
                "",
                INTENT_RESPONSES.location.hours
            ].join('\n');
        
        case 'contact':
            return [
                INTENT_RESPONSES.contact.primary,
                "",
                INTENT_RESPONSES.contact.districtOffice.label,
                `📞 ${INTENT_RESPONSES.contact.districtOffice.phone}`,
                `📧 ${INTENT_RESPONSES.contact.districtOffice.email}`,
                `🗺 ${INTENT_RESPONSES.contact.districtOffice.map}`,
                "",
                INTENT_RESPONSES.contact.legislativeOffice.label,
                `📞 ${INTENT_RESPONSES.contact.legislativeOffice.phone}`,
                `📧 ${INTENT_RESPONSES.contact.legislativeOffice.email}`,
                `🗺 ${INTENT_RESPONSES.contact.legislativeOffice.map}`,
                "",
                ...INTENT_RESPONSES.contact.hotlines,
                "",
                INTENT_RESPONSES.contact.hours
            ].join('\n');
        
        case 'thanks':
            return INTENT_RESPONSES.gratitude[Math.floor(Math.random() * INTENT_RESPONSES.gratitude.length)];
        
        default:
            return [
                "Pasensya na po, hindi ko masyadong naintindihan. Pwede po ba ninyong ulitin?",
                "Nandito po ako para tumulong sa:",
                "• Medical Assistance (Guarantee Letters, Financial Aid)",
                "• Hospital Requirements",
                "• Office Appointments",
                "• Location and Contact Information",
                "\nPaano ko po kayo matutulungan?"
            ].join('\n');
    }
};

const HelpScreen = () => {
    const [messages, setMessages] = useState([
        { id: '0', text: INTENT_RESPONSES.greeting[0], sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));
    const flatListRef = useRef(null);

    const addMessage = useCallback((text, sender) => {
        const newMessage = {
            id: `${Date.now()}`,
            text,
            sender
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
    }, []);

    const handleSendMessage = useCallback(() => {
        if (inputText.trim() === '') return;

        // Add user message
        addMessage(inputText, 'user');

        // Generate AI response
        const botResponse = generateResponse(inputText);
        setTimeout(() => {
            addMessage(botResponse, 'bot');
        }, 500);

        // Clear input
        setInputText('');

        // Scroll to bottom
        setTimeout(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
            }
        }, 100);
    }, [inputText, addMessage]);

    const handleLinkPress = (url) => {
        Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    };

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, [messages]);

    const renderMessage = ({ item }) => {
        // Simple link detection for URLs
        const messageParts = item.text.split(/(https?:\/\/[^\s]+)/g);
        
        return (
            <Animated.View 
                style={[
                    styles.messageContainer, 
                    item.sender === 'user' ? styles.userMessage : styles.botMessage,
                    { opacity: fadeAnim }
                ]}
            >
                {messageParts.map((part, index) => {
                    if (part.match(/^https?:\/\//)) {
                        return (
                            <Text 
                                key={index} 
                                style={[item.sender === 'user' ? styles.userMessageText : styles.botMessageText, styles.linkText]}
                                onPress={() => handleLinkPress(part)}
                            >
                                {part}
                            </Text>
                        );
                    }
                    return (
                        <Text key={index} style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
                            {part}
                        </Text>
                    );
                })}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#012169" />
            <LinearGradient 
                colors={['#012169', '#0353A4']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Muntinlupa District Office</Text>
                        <Text style={styles.headerSubtitle}>AI Assistant ni Cong. Jaime R. Fresnedi</Text>
                    </View>
                </View>
            </LinearGradient>
            
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                inverted={false}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
                onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
            />

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.inputContainer}
                keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Magtanong po kayo tungkol sa mga serbisyo ng Muntinlupa..."
                        placeholderTextColor="#888"
                        multiline
                        maxHeight={120}
                        textAlignVertical="top"
                        returnKeyType="send"
                        onSubmitEditing={handleSendMessage}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !inputText.trim() && styles.disabledButton]} 
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 16,
    },
    messageContainer: {
        maxWidth: '85%',
        marginVertical: 6,
        padding: 14,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#0353A4',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    userMessageText: {
        color: 'white',
        fontSize: 15,
        lineHeight: 20,
    },
    botMessageText: {
        color: '#333333',
        fontSize: 15,
        lineHeight: 20,
    },
    linkText: {
        color: '#1E90FF',
        textDecorationLine: 'underline',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 12,
        marginRight: 10,
        maxHeight: 120,
        fontSize: 15,
        lineHeight: 20,
        color: '#333333',
    },
    sendButton: {
        backgroundColor: '#0353A4',
        borderRadius: 22,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
    },
});

export default HelpScreen;