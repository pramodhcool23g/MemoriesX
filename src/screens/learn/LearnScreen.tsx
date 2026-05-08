import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
} from 'react-native-reanimated';

const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';
const AWS_BUCKET_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com';

const LearnScreen = ({ navigation }: any) => {
    const isFocused = useIsFocused();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/student/courses`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.status) {
                setCourses(result.data || []);
            } else {
                Alert.alert('Error', result.msg || 'Failed to fetch courses');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Network request failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchCourses();
        }
    }, [isFocused]);

    const heroCourse = courses.length > 0 ? courses[0] : null;
    const remainingCourses = courses;
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <Animated.View 
                    entering={FadeInDown.duration(800).delay(200)}
                    style={styles.header}
                >
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerSubtitle}>EDUCATION</Text>
                        <Text style={styles.headerTitle}>Video Library</Text>
                    </View>
                    <View style={styles.headerActionContainer}>
                        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
                            <MaterialIcons name="search" size={24} color="#233E4E" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Loading State */}
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                            <ActivityIndicator size="large" color="#2DD4BF" />
                        </View>
                    ) : (
                        <>
                            {/* Continue Learning - Hero Card */}
                            {heroCourse && (
                            <Animated.View 
                                entering={FadeInUp.duration(800).delay(400)}
                                style={styles.heroSection}
                            >
                                <Text style={styles.sectionTitle}>Continue Learning</Text>
                                
                                <TouchableOpacity 
                                    activeOpacity={0.9} 
                                    style={styles.heroCard}
                                    onPress={() => navigation.navigate('CourseDetail', { courseId: heroCourse.course_id })}
                                >
                                    <View style={styles.heroImage}>
                                        <ImageBackground 
                                            source={{ uri: `${AWS_BUCKET_URL}/courses/${heroCourse.course_image}` }}
                                            style={StyleSheet.absoluteFillObject}
                                            resizeMode="cover"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(35, 62, 78, 0.4)', 'rgba(35, 62, 78, 0.9)']}
                                            style={styles.heroGradient}
                                        >
                                            <View style={styles.heroPlayContainer}>
                                                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('CourseDetail', { courseId: heroCourse.course_id })}>
                                                    <LinearGradient
                                                        colors={['#557D84', '#2DD4BF']}
                                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                        style={styles.playBtn}
                                                    >
                                                        <MaterialIcons name="play-arrow" size={36} color="#fff" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.heroContent}>
                                                <View style={styles.heroBadges}>
                                                    <View style={styles.ongoingBadge}>
                                                        <Text style={styles.ongoingBadgeText}>ONGOING</Text>
                                                    </View>
                                                    <Text style={styles.moduleText}>Start Learning</Text>
                                                </View>
                                                <Text style={styles.heroTitle}>{heroCourse.course_title}</Text>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                            )}


                    {/* Course Modules List */}
                    <View style={styles.modulesSection}>
                        <View style={styles.modulesHeader}>
                            <Text style={styles.sectionTitle}>Course Modules</Text>
                            <TouchableOpacity>
                                <Text style={styles.filterText}>FILTER</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modulesList}>
                            {remainingCourses.map((mod, index) => {
                                const badgeType = index % 3 === 0 ? 'purple' : index % 3 === 1 ? 'gold' : 'aqua';
                                const badgeText = 'Course Available';
                                return (
                                <Animated.View 
                                    key={mod.course_id}
                                    entering={FadeInUp.duration(600).delay(600 + (index * 150))}
                                >
                                    <TouchableOpacity 
                                        style={styles.moduleCard} 
                                        activeOpacity={0.9}
                                        onPress={() => navigation.navigate('CourseDetail', { courseId: mod.course_id })}
                                    >
                                        <View style={styles.moduleImageContainer}>
                                            <ImageBackground 
                                                source={{ uri: `${AWS_BUCKET_URL}/courses/${mod.course_image}` }}
                                                style={styles.moduleImage}
                                            >
                                                <View style={styles.durationBadge}>
                                                    <Text style={styles.durationText}>Module</Text>
                                                </View>
                                            </ImageBackground>
                                        </View>
                                        
                                        <View style={styles.moduleContent}>
                                            <View>
                                                <View style={styles.moduleTitleRow}>
                                                    <Text style={styles.moduleTitle} numberOfLines={1}>{mod.course_title}</Text>
                                                    <TouchableOpacity style={styles.bookmarkBtn}>
                                                        <MaterialIcons name="bookmark" size={18} color="rgba(85, 125, 132, 0.4)" />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.moduleDescription} numberOfLines={2}>{mod.description}</Text>
                                            </View>
                                            
                                            <View style={styles.moduleFooterRow}>
                                                <View style={[
                                                    styles.statusBadge, 
                                                    badgeType === 'purple' ? styles.statusBadgePurple : 
                                                    badgeType === 'gold' ? styles.statusBadgeGold : 
                                                    styles.statusBadgeAqua
                                                ]}>
                                                    <Text style={[
                                                        styles.statusBadgeText,
                                                        badgeType === 'purple' ? styles.statusBadgeTextPurple : 
                                                        badgeType === 'gold' ? styles.statusBadgeTextGold : 
                                                        styles.statusBadgeTextAqua
                                                    ]}>
                                                        {badgeText}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity style={styles.downloadBtn}>
                                                    <MaterialIcons name="download" size={18} color="#557D84" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            )})}
                        </View>
                    </View>
                    </>
                )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 20,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerSubtitle: {
        color: 'rgba(85, 125, 132, 0.7)',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerActionContainer: {
        width: 44,
        alignItems: 'flex-end',
    },
    searchBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(241, 245, 249, 0.5)',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
    },
    scrollContent: {
        paddingBottom: 120, // Space for bottom tab
    },
    sectionTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    heroSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    heroCard: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: 'rgba(35, 62, 78, 0.2)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 8,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 24,
    },
    heroPlayContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(45, 212, 191, 0.4)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
    },
    heroContent: {
        marginTop: 'auto',
    },
    heroBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    ongoingBadge: {
        backgroundColor: 'rgba(85, 125, 132, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ongoingBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    moduleText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 28,
    },
    modulesSection: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    modulesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 8, // Overrides sectionTitle's default 16
    },
    filterText: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    modulesList: {
        gap: 16,
    },
    moduleCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f8fafc',
        shadowColor: 'rgba(35, 62, 78, 0.06)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 3,
        gap: 16,
    },
    moduleImageContainer: {
        width: 110,
        height: 110,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
    },
    moduleImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 6,
    },
    durationBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        // Simple backdrop blur alternative for older RN versions
    },
    durationText: {
        color: '#233E4E',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    moduleContent: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    moduleTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    moduleTitle: {
        flex: 1,
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '800',
        lineHeight: 20,
        marginRight: 8,
    },
    bookmarkBtn: {
        padding: 2,
    },
    moduleDescription: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 16,
        marginTop: 4,
    },
    moduleFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadgePurple: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 0.05)',
    },
    statusBadgeGold: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.05)',
    },
    statusBadgeAqua: {
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        borderColor: 'rgba(45, 212, 191, 0.05)',
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: -0.2,
    },
    statusBadgeTextPurple: { color: '#a855f7' },
    statusBadgeTextGold: { color: '#f59e0b' },
    statusBadgeTextAqua: { color: '#2DD4BF' },
    
    downloadBtn: {
        padding: 4,
    },
});

export default LearnScreen;
