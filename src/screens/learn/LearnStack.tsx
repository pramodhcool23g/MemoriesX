import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LearnScreen from './LearnScreen';
import CourseDetailScreen from './CourseDetailScreen';
import CourseQuizScreen from './CourseQuizScreen';
import LessonScreen from './LessonScreen';
import { LearnStackParamList } from '../../navigation/types';

const Stack = createNativeStackNavigator<LearnStackParamList>();

const LearnStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Courses" component={LearnScreen} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="CourseQuiz" component={CourseQuizScreen} />
            <Stack.Screen name="LessonScreen" component={LessonScreen} />
        </Stack.Navigator>
    );
};

export default LearnStack;
