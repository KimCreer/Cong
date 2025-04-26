import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    pinScreenContainer: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#003580",
    },
    pinTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
        color: "#003580",
    },
    phoneNumberText: {
        fontSize: 16,
        color: "#003580",
        textAlign: "center",
        marginBottom: 30,
    },
    otpSentText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 10,
    },
    pinSubtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        marginBottom: 20,
    },
    button: {
        width: "100%",
        paddingVertical: 8,
        backgroundColor: "#003580",
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
    skipButton: {
        marginTop: 10,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    pinCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#003580',
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinCircleFilled: {
        backgroundColor: '#003580',
    },
    pinCircleActive: {
        borderWidth: 2,
        borderColor: '#002B5C',
    },
    pinCircleError:{
        borderColor: '#FF3B30',
    },
    pinCircleLoading: {
        borderColor: '#ccc',
    },
    pinDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    adminPinDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    pinActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    forgotPinButton: {
        paddingHorizontal: 0,
    },
    changeNumberButton: {
        paddingHorizontal: 0,
    },
    pinActionText: {
        color: "#003580",
        fontSize: 14,
    },
    changeNumberLink: {
        color: "#003580",
        textAlign: 'center',
        marginTop: 15,
        textDecorationLine: 'underline',
    },
    disabledLink: {
        color: '#ccc',
    },
    skipButtonText: {
        color: "#003580",
    },
    footerText: {
        marginTop: 20,
        fontSize: 12,
        color: "#666",
    },
    link: {
        color: "#003580",
        textDecorationLine: "underline",
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 300,
    },
    numberButton: {
        width: 80,
        height: 50,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        backgroundColor: '#f5f5f5',
    },
    adminNumberButton: {
        backgroundColor: '#ffebee',
    },
    emptyButton: {
        backgroundColor: 'transparent',
    },
    backspaceButton: {
        backgroundColor: '#f5f5f5',
    },
    disabledButton: {
        backgroundColor: '#f9f9f9',
    },
    numberText: {
        fontSize: 24,
        color: '#003580',
    },
    adminNumberText: {
        color: '#d32f2f',
    },
    disabledText: {
        color: '#ccc',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: "#003580",
        marginLeft: 5,
        fontSize: 16,
    },
    adminBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    adminBackButtonText: {
        color: "#d32f2f",
        marginLeft: 5,
        fontSize: 16,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    biometricText: {
        color: "#d32f2f",
        marginLeft: 10,
        fontSize: 16,
    },
});

export default styles;