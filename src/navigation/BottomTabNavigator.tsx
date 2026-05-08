import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import LearnStack from '../screens/learn/LearnStack';
import AssessStack from '../screens/assess/AssessStack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedTabIcon = ({ focused, iconName, label, color }: { focused: boolean, iconName: string, label: string, color: string }) => {
    const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
    
    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: focused ? 1.15 : 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [focused]);
    
    return (
        <Animated.View style={[styles.tabIconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <MaterialIcons name={iconName} size={28} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
        </Animated.View>
    );
};

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#557D84',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: styles.tabBar,
                headerShown: false,
                tabBarShowLabel: false, // We'll render custom labels
            }}
            detachInactiveScreens={true}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon focused={focused} iconName="home" label="HOME" color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Learn"
                component={LearnStack}
                options={({ route }) => ({
                    tabBarStyle: (() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? 'Courses';
                        if (routeName === 'CourseDetail' || routeName === 'CourseQuiz' || routeName === 'LessonScreen') {
                            return { display: 'none' };
                        }
                        return styles.tabBar;
                    })(),
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon focused={focused} iconName="school" label="LEARN" color={color} />
                    ),
                })}
            />
            <Tab.Screen
                name="Assess"
                component={AssessStack}
                options={({ route }) => ({
                    tabBarStyle: (() => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? 'Quizzes';
                        if (routeName === 'Quiz') {
                            return { display: 'none' };
                        }
                        return styles.tabBar;
                    })(),
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon focused={focused} iconName="fact-check" label="ASSESS" color={color} />
                    ),
                })}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon focused={focused} iconName="person" label="PROFILE" color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        height: 90,
        paddingBottom: 20,
        paddingTop: 10,
        shadowColor: 'rgba(35, 62, 78, 0.08)',
        shadowOffset: { width: 0, height: -15 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 20,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
    },
    tabLabel: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});

export default BottomTabNavigator;
