import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AssessScreen from './AssessScreen';
import QuizScreen from './QuizScreen';
import AssessmentReviewScreen from './AssessmentReviewScreen';

const Stack = createNativeStackNavigator();

const AssessStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Quizzes" component={AssessScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="AssessmentReview" component={AssessmentReviewScreen} />
        </Stack.Navigator>
    );
};

export default AssessStack;
