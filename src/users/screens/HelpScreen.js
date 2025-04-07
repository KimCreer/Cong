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
    StatusBar
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from 'react-native-linear-gradient';

// Enhanced NLP-inspired help response system with Taglish and politeness
const INTENT_RESPONSES = {
    greeting: [
        "Mabuhay po! 👋 Ako po ang Muntinlupa AI Assistant ni Congressman Jaime R. Fresnedi. Paano ko po kayo matutulungan ngayon?",
        "Kumusta po! Welcome po sa Muntinlupa District Office digital services. Ano pong maitutulong ko sa inyo?",
        "Magandang araw po! Nandito po ako para tulungan kayo sa inyong mga kailangan sa distrito."
    ],
    appointment: {
        primary: "Para po sa appointment booking, narito po ang mga options:",
        steps: [
            "Piliin po ang uri ng consultation (personal, online, o phone)",
            "Pumili po ng preferred date at oras (Lunes hanggang Biyernes, 8AM-5PM)",
            "Magbigay po ng maikling description ng inyong concern"
        ],
        additionalInfo: "Gusto niyo po bang gabayan ko kayo sa booking process? Pwede rin po kayong mag-email sa appointment@fresnedi.gov.ph"
    },
    laws: {
        intro: "Ang aming legal resources ay sumasakop sa:",
        categories: [
            "Mga bagong ordinansa (2023-2024)",
            "Pending bills sa city council",
            "Public service guidelines",
            "Community development programs"
        ],
        disclaimer: "Para sa pinaka-up-to-date na impormasyon, maaari pong bisitahin ang opisina ni Cong. Fresnedi sa 3rd Floor ng Alabang Public Market."
    },
    services: {
        categories: [
            "Educational Assistance Program (EAP)",
            "Medical and Burial Assistance",
            "Tulong Pangkabuhayan sa Ating Disadvantaged/Displaced Workers (TUPAD)",
            "Libreng Sakay Program para sa Senior Citizens at PWDs"
        ],
        prompt: "Ano pong serbisyo ang gusto ninyong malaman? Pwede ko pong ipaliwanag ang details."
    },
    contact: {
        primary: "Maaari niyo pong i-contact ang District Office ni Cong. Fresnedi:",
        details: {
            phone: [
                "Main Office: (02) 8123-4567",
                "Tulong Bayan Hotline: 0917-123-4567"
            ],
            email: [
                "General Inquiries: office@fresnedi.gov.ph",
                "Constituent Concerns: constituents@fresnedi.gov.ph"
            ],
            hours: "Lunes hanggang Biyernes, 8:00 AM - 5:00 PM (Walang lunch break)"
        },
        locations: [
            "Main Office: 3rd Floor, Alabang Public Market, Muntinlupa City",
            "Satellite Office: 123 Muntinlupa Boulevard, Brgy. Putatan"
        ],
        social: [
            "Facebook: @JaimeFresnediOfficial",
            "Twitter: @JRFresnedi"
        ]
    },
    gratitude: [
        "Walang anuman po! Kung may iba pa po kayong katanungan, nandito lang po ako para tumulong.",
        "Salamat din po! Always happy to serve Muntinlupa constituents.",
        "My pleasure po! Para po yan sa ating mga kababayan sa Muntinlupa."
    ]
};

// Enhanced AI-driven response generator with better matching
const generateResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Improved intent matching with Taglish support
    const intents = {
        greeting: ['hi', 'hello', 'hey', 'kumusta', 'magandang', 'mabuhay', 'good'],
        appointment: ['appointment', 'book', 'schedule', 'meeting', 'set', 'puntahan', 'punta', 'consult', 'konsulta'],
        laws: ['law', 'legal', 'batas', 'bill', 'ordinance', 'policy', 'patakaran', 'regulasyon'],
        services: ['service', 'project', 'program', 'help', 'tulong', 'serbisyo', 'benefits', 'benepisyo', 'assistance'],
        contact: ['contact', 'number', 'email', 'location', 'address', 'tawag', 'tawagan', 'social media', 'fb', 'facebook'],
        thanks: ['thank', 'salamat', 'maraming', 'appreciate']
    };

    // Advanced intent detection with context awareness
    const detectIntent = () => {
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return intent;
            }
        }
        return 'default';
    };

    const intent = detectIntent();

    switch (intent) {
        case 'greeting':
            return INTENT_RESPONSES.greeting[Math.floor(Math.random() * INTENT_RESPONSES.greeting.length)];
        
        case 'appointment':
            return [
                INTENT_RESPONSES.appointment.primary,
                ...INTENT_RESPONSES.appointment.steps.map(step => `• ${step}`),
                INTENT_RESPONSES.appointment.additionalInfo
            ].join('\n');
        
        case 'laws':
            return [
                INTENT_RESPONSES.laws.intro,
                ...INTENT_RESPONSES.laws.categories.map(cat => `• ${cat}`),
                INTENT_RESPONSES.laws.disclaimer
            ].join('\n');
        
        case 'services':
            return [
                "Ang aming mga serbisyo po para sa Muntinlupa constituents:",
                ...INTENT_RESPONSES.services.categories.map(service => `• ${service}`),
                INTENT_RESPONSES.services.prompt
            ].join('\n');
        
        case 'contact':
            return [
                INTENT_RESPONSES.contact.primary,
                "\n📞 Telepono:",
                ...INTENT_RESPONSES.contact.details.phone.map(phone => `• ${phone}`),
                "\n📧 Email:",
                ...INTENT_RESPONSES.contact.details.email.map(email => `• ${email}`),
                `\n🕒 Oras ng Opisina: ${INTENT_RESPONSES.contact.details.hours}`,
                "\n📍 Mga Lokasyon:",
                ...INTENT_RESPONSES.contact.locations.map(loc => `• ${loc}`),
                "\n🌐 Social Media:",
                ...INTENT_RESPONSES.contact.social.map(soc => `• ${soc}`)
            ].join('\n');
        
        case 'thanks':
            return INTENT_RESPONSES.gratitude[Math.floor(Math.random() * INTENT_RESPONSES.gratitude.length)];
        
        default:
            return "Pasensya na po, hindi ko masyadong naintindihan. Pwede po ba ninyong ulitin o dagdagan ang details? Nandito po ako para tumulong sa mga appointments, batas, serbisyo, at contact information ng opisina ni Cong. Fresnedi.";
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

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, [messages]);

    const renderMessage = ({ item }) => (
        <Animated.View 
            style={[
                styles.messageContainer, 
                item.sender === 'user' ? styles.userMessage : styles.botMessage,
                { opacity: fadeAnim }
            ]}
        >
            <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
                {item.text}
            </Text>
        </Animated.View>
    );

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