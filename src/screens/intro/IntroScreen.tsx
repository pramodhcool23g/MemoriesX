import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export default function IntroScreen({ navigation }: any) {
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const markIntroSeenAndNavigate = useCallback(async () => {
        try {
            await AsyncStorage.setItem('@has_seen_intro', 'true');
        } catch (e) {
            console.error('Error setting intro seen flag:', e);
        }
        navigation.replace('Login');
    }, [navigation]);

    const handleVideoEnd = () => {
        setIsVideoEnded(true);
    };

    // Countdown logic after video plays
    useEffect(() => {
        if (!isVideoEnded) return;

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    markIntroSeenAndNavigate();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isVideoEnded, markIntroSeenAndNavigate]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
            
            {/* Portrait Full Width, Vertically Centered Video */}
            <View style={styles.videoWrapper}>
                <Video
                    source={require('../../assets/videos/intro.mp4')}
                    style={styles.video}
                    resizeMode="cover"
                    controls={false}
                    paused={paused}
                    onEnd={handleVideoEnd}
                    repeat={false}
                />
            </View>

            {/* Bottom Controls - Login Button & 5s Counter */}
            {isVideoEnded && (
                <Animated.View 
                    entering={FadeInUp.duration(600)} 
                    exiting={FadeOutDown.duration(400)} 
                    style={styles.bottomOverlay}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)', '#000000']}
                        style={styles.gradient}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.loginBtnContainer}
                            onPress={markIntroSeenAndNavigate}
                        >
                            <LinearGradient
                                colors={['#557D84', '#2DD4BF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.loginBtn}
                            >
                                <Text style={styles.loginBtnText}>LOG IN</Text>
                                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.counterContainer}>
                            <MaterialIcons name="timer" size={14} color="#94A3B8" />
                            <Text style={styles.counterText}>
                                Redirecting to Login in <Text style={styles.counterHighlight}>{countdown}s</Text>
                            </Text>
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    videoWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    video: {
        width: windowWidth,
        height: windowHeight,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    gradient: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 36,
        alignItems: 'center',
    },
    loginBtnContainer: {
        width: '100%',
        shadowColor: 'rgba(45, 212, 191, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 16,
    },
    loginBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    counterText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
    },
    counterHighlight: {
        color: '#2DD4BF',
        fontWeight: '900',
    },
});
