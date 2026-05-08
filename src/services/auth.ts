import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        // Mocking API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    token: "jwt_token_here",
                    user: {
                        name: "Dr. John",
                        email: "doctor@email.com"
                    }
                });
            }, 1000);
        });
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },

    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    }
};
