import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryListScreen from './LibraryListScreen';
import ModelViewScreen from './ModelViewScreen';

const Stack = createNativeStackNavigator();

const LibraryStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LibraryList" component={LibraryListScreen} />
            <Stack.Screen name="ModelView" component={ModelViewScreen} />
        </Stack.Navigator>
    );
};

export default LibraryStack;
