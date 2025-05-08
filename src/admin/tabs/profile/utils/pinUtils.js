import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export const PIN_LENGTH = 6;

export const handlePinInput = (pin, num) => {
    if (pin.length < PIN_LENGTH) {
        return pin + num;
    }
    return pin;
};

export const handlePinBackspace = (pin) => {
    if (pin.length > 0) {
        return pin.slice(0, -1);
    }
    return pin;
};

export const generateDeviceSalt = async () => {
    try {
        let salt = await SecureStore.getItemAsync('deviceSalt');
        if (!salt) {
            const randomBytes = new Uint8Array(16);
            await Crypto.getRandomValues(randomBytes);
            salt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            await SecureStore.setItemAsync('deviceSalt', salt);
        }
        return salt;
    } catch (error) {
        console.error("Salt generation error:", error);
        throw error;
    }
};

export const hashPin = async (pin, salt, userId) => {
    try {
        const encoder = new TextEncoder();
        const keyMaterial = await Crypto.digest(
            'SHA-256',
            encoder.encode(pin + salt + userId)
        );
        return Array.from(new Uint8Array(keyMaterial)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error("Hashing error:", error);
        throw error;
    }
};

export const verifyCurrentPin = async (currentPin) => {
    try {
        const userId = await SecureStore.getItemAsync('userUid');
        if (!userId) {
            throw new Error("User session expired");
        }

        const salt = await generateDeviceSalt();
        const storedPinHash = await SecureStore.getItemAsync(`adminPinHash_${userId}`);
        const currentPinHash = await hashPin(currentPin, salt, userId);

        if (currentPinHash !== storedPinHash) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("PIN verification error:", error);
        throw error;
    }
};

export const updatePin = async (newPin) => {
    try {
        const userId = await SecureStore.getItemAsync('userUid');
        if (!userId) {
            throw new Error("User session expired");
        }

        const salt = await generateDeviceSalt();
        const newPinHash = await hashPin(newPin, salt, userId);
        await SecureStore.setItemAsync(`adminPinHash_${userId}`, newPinHash);
    } catch (error) {
        console.error("Error updating PIN:", error);
        throw error;
    }
}; 