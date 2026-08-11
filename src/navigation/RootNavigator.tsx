import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IntroScreen from '../screens/intro/IntroScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import LibraryStack from '../screens/library/LibraryStack';
import PersonalInfoScreen from '../screens/profile/PersonalInfoScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = ({ isAuthenticated, hasSeenIntro }: { isAuthenticated: boolean; hasSeenIntro: boolean }) => {
    let initialRoute: keyof RootStackParamList = "Login";
    if (isAuthenticated) {
        initialRoute = "Main";
    } else if (!hasSeenIntro) {
        initialRoute = "Intro";
    }

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={initialRoute}
        >
            <Stack.Screen name="Intro" component={IntroScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="LibraryStack" component={LibraryStack} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        </Stack.Navigator>
    );
};

export default RootNavigator;
