import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const PIN_CIRCLE_SIZE = width > 380 ? 20 : 16;
const NUM_PAD_BUTTON_SIZE = width > 380 ? 70 : 60;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    headerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
    },
    logo: {
        width: 80,
        height: 80,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    lockIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0033A0',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#718096',
        marginBottom: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    pinCircleContainer: {
        padding: 5,
    },
    pinCircle: {
        width: PIN_CIRCLE_SIZE,
        height: PIN_CIRCLE_SIZE,
        borderRadius: PIN_CIRCLE_SIZE / 2,
        borderWidth: 1.5,
        borderColor: '#0033A0',
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    pinCircleFilled: {
        backgroundColor: '#0033A0',
        borderColor: '#0033A0',
    },
    pinCircleActive: {
        borderWidth: 2,
        borderColor: '#002B5C',
    },
    pinCircleError: {
        borderColor: '#E53E3E',
        backgroundColor: '#FFF5F5',
    },
    pinCircleLoading: {
        borderColor: '#A0AEC0',
    },
    pinDot: {
        width: PIN_CIRCLE_SIZE * 0.5,
        height: PIN_CIRCLE_SIZE * 0.5,
        borderRadius: PIN_CIRCLE_SIZE * 0.25,
        backgroundColor: '#fff',
    },
    footer: {
        marginBottom: 30,
        width: '100%',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#0033A0',
        borderRadius: 12,
        width: '100%',
    },
    buttonLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        marginTop: 15,
        width: '100%',
    },
    secondaryButtonText: {
        color: '#0033A0',
        fontSize: 14,
        fontWeight: '500',
    },
    forgotPinButton: {
        marginTop: 20,
        padding: 12,
    },
    forgotPinText: {
        color: '#0033A0',
        fontSize: 16,
        fontWeight: '500',
    },
    codeInput: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#FAFAFA',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 315,
        alignSelf: 'center',
    },
    numberButton: {
        width: NUM_PAD_BUTTON_SIZE,
        height: NUM_PAD_BUTTON_SIZE,
        borderRadius: NUM_PAD_BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        backgroundColor: '#F5F7FA',
    },
    emptyButton: {
        backgroundColor: 'transparent',
    },
    backspaceButton: {
        backgroundColor: '#EDF2F7',
    },
    disabledButton: {
        backgroundColor: '#F7FAFC',
    },
    numberText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#0033A0',
    },
    disabledText: {
        color: '#A0AEC0',
    },
    keyboardContainer: {
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default styles;