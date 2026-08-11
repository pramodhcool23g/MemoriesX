import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';
const AWS_BUCKET_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com';

const HomeScreen = ({ navigation }: any) => {
    const [activeCourse, setActiveCourse] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const progress = useSharedValue(0);

    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) return 'GOOD MORNING';
            if (hour < 17) return 'GOOD AFTERNOON';
            return 'GOOD EVENING';
        };
        setGreeting(getGreeting());

        const fetchHomeData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const [learningRes, profileRes] = await Promise.all([
                    fetch(`${API_URL}/student/learning/active`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/student/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const learningResult = await learningRes.json();
                const profileResult = await profileRes.json();

                console.log("Active Course API Result:", learningResult);

                if (learningResult.status && learningResult.data && learningResult.data.course_id) {
                    const learning = learningResult.data;
                    const course = learning.course_details || {};
                    const totalLessons = course.curriculum?.reduce((acc: number, section: any) => acc + (section.lessons?.length || 0), 0) || 0;
                    const completedLessons = learning.lesson_count?.length || 0;
                    const perc = totalLessons > 0 ? (completedLessons / totalLessons) : 0;

                    setActiveCourse({
                        id: learning.course_id,
                        title: course.course_title || 'Active Course',
                        total: totalLessons,
                        completed: completedLessons,
                        percentage: perc * 100,
                        remaining: totalLessons - completedLessons
                    });

                    progress.value = withDelay(500, withTiming(perc, { duration: 1500 }));
                }

                if (profileResult.status && profileResult.data) {
                    setUserData(profileResult.data);
                }
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const animatedProgressStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value * 100}%`,
        };
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(800).delay(200)}
                style={styles.header}
            >
                <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: userData?.profile_image ? `${AWS_BUCKET_URL}/profile/${userData.profile_image}` : 'https://ui-avatars.com/api/?name=' + (userData?.first_name || 'User') + '&background=E5EEF0&color=233E4E&bold=true' }}
                        style={styles.profileImage}
                    />
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greetingText}>{greeting}</Text>
                    <Text style={styles.nameText}>{userData ? `${userData.first_name} ${userData.last_name || ''}` : 'Loading...'}</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
                    <MaterialIcons name="notifications" size={24} color="#233E4E" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Active Course */}
                {activeCourse && (
                    <Animated.View
                        entering={FadeInUp.duration(800).delay(400)}
                        style={styles.section}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.cardContainer}
                            onPress={() => navigation.navigate('Learn', {
                                screen: 'CourseDetail',
                                params: { courseId: activeCourse.id }
                            })}
                        >
                            <View style={styles.activeCourseHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionLabel}>ACTIVE COURSE</Text>
                                    <Text style={styles.courseTitle} numberOfLines={2}>{activeCourse.title}</Text>
                                </View>
                                <View style={styles.progressPercentageContainer}>
                                    <Text style={styles.progressPercentageText}>{Math.round(activeCourse.percentage)}%</Text>
                                </View>
                            </View>

                            <View style={styles.progressSection}>
                                <View style={styles.progressBarBackground}>
                                    <Animated.View style={[styles.progressBarFillContainer, animatedProgressStyle]}>
                                        <LinearGradient
                                            colors={['#557D84', '#2DD4BF']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.progressBarFill}
                                        />
                                    </Animated.View>
                                </View>
                                <View style={styles.progressLabels}>
                                    <Text style={styles.progressLabelText}>{activeCourse.completed} MODULES COMPLETED</Text>
                                    <Text style={styles.progressLabelText}>{activeCourse.remaining} REMAINING</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Certifications */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(600)}
                    style={styles.certSection}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Certifications</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScrollContainer}>
                        {[
                            { name: 'workspace-premium', color: '#f59e0b', label: 'TOP TIER', style: styles.certIconTopTier },
                            { name: 'psychology', color: '#a855f7', label: 'MASTER', style: styles.certIconMaster },
                            { name: 'medical-services', color: '#10b981', label: 'CLINICIAN', style: styles.certIconClinician },
                            { name: 'lock', color: '#cbd5e1', label: 'EXPERT', style: styles.certIconExpert, locked: true },
                        ].map((item, index) => (
                            <Animated.View
                                key={item.label}
                                entering={FadeInRight.duration(600).delay(800 + (index * 100))}
                                style={styles.certItem}
                            >
                                <View style={[styles.certIconContainer, item.style]}>
                                    <MaterialIcons name={item.name} size={item.name === 'lock' ? 24 : 32} color={item.color} />
                                </View>
                                <Text style={[styles.certLabel, item.locked && { color: '#94a3b8' }]}>{item.label}</Text>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Live Class */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(800)}
                    style={styles.liveClassSection}
                >
                    <View style={styles.liveClassCard}>
                        <View style={styles.liveClassImageContainer}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop' }}
                                style={styles.liveClassImage}
                            />
                            <View style={styles.liveNowBadge}>
                                <View style={styles.liveNowDot} />
                                <Text style={styles.liveNowText}>LIVE NOW</Text>
                            </View>
                        </View>

                        <View style={styles.liveClassContent}>
                            <View style={styles.liveClassHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.liveClassTitle}>Anatomy & Physiology</Text>
                                    <View style={styles.liveClassTimeContainer}>
                                        <MaterialIcons name="calendar-today" size={12} color="#557D84" style={{ opacity: 0.8 }} />
                                        <Text style={styles.liveClassTime}>10:00 — 11:30 AM</Text>
                                    </View>
                                </View>

                                <View style={styles.avatarsContainer}>
                                    <View style={[styles.avatar, { backgroundColor: '#f1f5f9', zIndex: 3 }]} />
                                    <View style={[styles.avatar, { backgroundColor: '#e2e8f0', zIndex: 2 }]} />
                                    <View style={[styles.avatar, { backgroundColor: '#E5EEF0', zIndex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={styles.avatarExtraText}>+42</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.liveClassDescription}>
                                Required clinical session on cardiovascular structures. Digital kits must be prepared for lab.
                            </Text>

                            <TouchableOpacity activeOpacity={0.9} style={styles.joinClassBtnContainer}>
                                <LinearGradient
                                    colors={['#557D84', '#2DD4BF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.joinClassBtn}
                                >
                                    <Text style={styles.joinClassBtnText}>JOIN CLASS</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Services */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(1000)}
                    style={styles.quickServicesSection}
                >
                    <Text style={styles.sectionTitle}>Quick Services</Text>
                    <View style={styles.quickServicesGrid}>
                        {[
                            { icon: 'collections', color: '#2563eb', bg: 'rgba(239, 246, 255, 0.8)', border: 'rgba(219, 234, 254, 0.5)', label: 'MEDICA 2D' },
                            { icon: 'view-in-ar', color: '#f97316', bg: 'rgba(255, 247, 237, 0.8)', border: 'rgba(255, 237, 213, 0.5)', label: 'MEDICA 3D' },
                            { icon: 'mic', color: '#0d9488', bg: 'rgba(240, 253, 250, 0.8)', border: 'rgba(204, 251, 241, 0.5)', label: 'Prof. G' },
                            { icon: 'verified-user', color: '#059669', bg: 'rgba(236, 253, 245, 0.8)', border: 'rgba(209, 250, 229, 0.5)', label: 'EXAMS' },
                            { icon: 'chat-bubble', color: '#ec4899', bg: 'rgba(253, 242, 248, 0.8)', border: 'rgba(252, 231, 243, 0.5)', label: 'SUPPORT' },
                        ].map((item, index) => (
                            <Animated.View
                                key={item.label}
                                entering={FadeInUp.duration(600).delay(1200 + (index * 100))}
                                style={styles.quickServiceItem}
                            >
                                <TouchableOpacity
                                    style={[styles.qsIconContainer, { backgroundColor: item.bg, borderColor: item.border }]}
                                    onPress={() => {
                                        if (item.label === 'MEDICA 2D') {
                                            navigation.navigate('LibraryStack', { screen: 'ImageLibrary' });
                                        } else if (item.label === 'MEDICA 3D') {
                                            navigation.navigate('LibraryStack');
                                        } else if (item.label === 'Prof. G') {
                                            navigation.navigate('LibraryStack', { screen: 'VoiceAgentOpenAI' });
                                        } else if (item.label === 'EXAMS') {
                                            navigation.navigate('Assess');
                                        } else if (item.label === 'SUPPORT') {
                                            navigation.navigate('ChatList');
                                        }
                                    }}
                                >
                                    <MaterialIcons name={item.icon} size={28} color={item.color} />
                                </TouchableOpacity>
                                <Text style={styles.qsLabel}>{item.label}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24, // Reduced for smaller top space
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 20,
    },
    profileContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        shadowColor: 'rgba(35, 62, 78, 0.08)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    headerTextContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    greetingText: {
        color: 'rgba(85, 125, 132, 0.7)',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    nameText: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    notificationBtn: {
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
    notificationBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        backgroundColor: '#EF4444',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 140, // Space for bottom tab + margin
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f8fafc',
        shadowColor: 'rgba(35, 62, 78, 0.08)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 25,
        elevation: 5,
    },
    activeCourseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    sectionLabel: {
        color: '#4B5563',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        opacity: 0.7,
    },
    courseTitle: {
        color: '#233E4E',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    progressPercentageContainer: {
        backgroundColor: 'rgba(229, 238, 240, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(161, 188, 190, 0.2)',
    },
    progressPercentageText: {
        color: '#233E4E',
        fontSize: 12,
        fontWeight: '900',
    },
    progressSection: {
        gap: 12,
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFillContainer: {
        height: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    progressLabelText: {
        fontSize: 10,
        color: 'rgba(75, 85, 99, 0.7)',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    certSection: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    viewAllText: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    certScrollContainer: {
        paddingHorizontal: 4,
        paddingBottom: 8,
        gap: 16,
    },
    certItem: {
        alignItems: 'center',
        gap: 12,
        minWidth: 80,
    },
    certIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    certIconTopTier: {
        backgroundColor: '#fffbeb',
        borderColor: 'rgba(253, 230, 138, 0.5)',
    },
    certIconMaster: {
        backgroundColor: '#faf5ff',
        borderColor: 'rgba(233, 213, 255, 0.5)',
    },
    certIconClinician: {
        backgroundColor: '#ecfdf5',
        borderColor: 'rgba(167, 243, 208, 0.5)',
    },
    certIconExpert: {
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
        borderColor: '#f1f5f9',
    },
    certLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#4B5563',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    liveClassSection: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    liveClassCard: {
        borderRadius: 40,
        backgroundColor: '#fff',
        shadowColor: 'rgba(35, 62, 78, 0.12)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f8fafc',
        overflow: 'hidden',
    },
    liveClassImageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        position: 'relative',
    },
    liveClassImage: {
        width: '100%',
        height: '100%',
    },
    liveNowBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(35, 62, 78, 0.95)',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    liveNowDot: {
        width: 6,
        height: 6,
        backgroundColor: '#2DD4BF',
        borderRadius: 3,
    },
    liveNowText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    liveClassContent: {
        padding: 32,
        gap: 20,
    },
    liveClassHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    liveClassTitle: {
        color: '#233E4E',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    liveClassTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveClassTime: {
        color: 'rgba(85, 125, 132, 0.8)',
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    avatarsContainer: {
        flexDirection: 'row',
        marginLeft: -10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#fff',
        marginLeft: -10,
    },
    avatarExtraText: {
        color: '#233E4E',
        fontSize: 9,
        fontWeight: '900',
    },
    liveClassDescription: {
        color: '#4B5563',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 20,
        opacity: 0.8,
    },
    joinClassBtnContainer: {
        marginTop: 8,
        shadowColor: 'rgba(85, 125, 132, 0.3)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 6,
    },
    joinClassBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    joinClassBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    quickServicesSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        marginBottom: 36,
    },
    quickServicesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 20,
        gap: 10,
    },
    quickServiceItem: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 60,
    },
    qsIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    qsLabel: {
        color: '#4B5563',
        fontSize: 9,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.7,
    },
});

export default HomeScreen;
