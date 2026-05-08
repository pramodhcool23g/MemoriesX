import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeInRight,
    FadeOutUp,
    FadeOutDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';
const AWS_BUCKET_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com';


const CourseDetailScreen = ({ route, navigation }: any) => {
    const { courseId } = route.params;
    const isFocused = useIsFocused();
    const videoRef = useRef<any>(null);
    const [userPaused, setUserPaused] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // API States
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeLessonIndex, setActiveLessonIndex] = useState(0);
    const [completedLessons, setCompletedLessons] = useState<number[]>([]);
    const [completedTextLessons, setCompletedTextLessons] = useState<number[]>([]);
    const [showControls, setShowControls] = useState(true);
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchCourseDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/course/${courseId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            const result = await response.json();
            if (result.status) {
                setCourse(result.data);
            } else {
                Alert.alert('Error', result.msg || 'Failed to open course');
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            Alert.alert('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLearning = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const response = await fetch(`${API_URL}/student/learning/${courseId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.status && result.data && result.data.lesson_count) {
                setCompletedTextLessons(result.data.lesson_count);
            }
        } catch (error) {
            console.error('Error fetching learning progress:', error);
        }
    };

    useEffect(() => {
        if (courseId !== 'hero') {
            fetchCourseDetail();
            fetchLearning();
        } else {
            setLoading(false); // mock handling
        }
    }, [courseId]);

    // Used whenever screen comes back into focus so progress ticks update
    useEffect(() => {
        if (isFocused && courseId !== 'hero') {
            fetchLearning();
        }
    }, [isFocused]);

    const updateLearningProgress = async (newCompleted: number[]) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await fetch(`${API_URL}/student/learning/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: courseId,
                    lesson_count: newCompleted,
                    isQuiz: false
                })
            });
        } catch (error) {
            console.error('Failed to update progress', error);
        }
    };

    const formatTime = (timeInSeconds: number) => {
        if (!timeInSeconds || isNaN(timeInSeconds)) return "00:00";
        const hours = Math.floor(timeInSeconds / 3600);
        const mins = Math.floor((timeInSeconds % 3600) / 60);
        const secs = Math.floor(timeInSeconds % 60);

        if (hours > 0) {
            return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const resetControlsTimer = () => {
        if (controlsTimerRef.current) {
            clearTimeout(controlsTimerRef.current);
        }
        setShowControls(true);
        controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 2000); // Hide after 2 seconds as requested
    };

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        };
    }, []);

    const handleScreenTouch = () => {
        resetControlsTimer();
    };

    const handleLoad = (data: any) => {
        if (data && data.duration) {
            setDuration(data.duration);
        }
    };

    const handleProgress = (data: any) => {
        if (data && typeof data.currentTime === 'number') {
            setCurrentTime(data.currentTime);
        }

        // Some devices don't report duration in onLoad properly
        if (data && data.seekableDuration && (duration === 0 || isNaN(duration))) {
            setDuration(data.seekableDuration);
        }

        // Auto complete lesson if played more than 90%
        if (duration > 0 && (data.currentTime / duration) > 0.9) {
            if (!completedLessons.includes(activeLessonIndex)) {
                const updated = [...completedLessons, activeLessonIndex];
                setCompletedLessons(updated);
                updateLearningProgress(updated);
            }
        }
    };

    const togglePlayPause = () => setUserPaused(!userPaused);
    const toggleMute = () => setIsMuted(!isMuted);

    // Overall pause state: pause if user clicked pause, OR if screen is out of focus
    const actualPaused = userPaused || !isFocused;

    const skipForward = () => {
        if (videoRef.current) {
            videoRef.current.seek(currentTime + 10);
        }
    };

    const skipBackward = () => {
        if (videoRef.current) {
            videoRef.current.seek(currentTime - 10);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            videoRef.current.presentFullscreenPlayer();
        }
    };

    const progressPercentage = (duration > 0 && currentTime > 0)
        ? (Math.min(currentTime, duration) / duration) * 100
        : 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2DD4BF" />
                </View>
            </SafeAreaView>
        );
    }

    const allFiles = Array.isArray(course?.curriculum)
        ? course.curriculum.flatMap((m: any) => m.files || [])
        : (course?.curriculum?.files || []);

    const textLessons = Array.isArray(course?.curriculum)
        ? course.curriculum.flatMap((m: any) => m.lessons || [])
        : (course?.curriculum?.lessons || []);

    const lessons = allFiles.filter((f: any) => f.type === 'video');
    const resources = allFiles.filter((f: any) => f.type !== 'video');
    const activeLesson = lessons[activeLessonIndex] || null;

    const getFileUrl = (filename: string) => {
        if (!filename) return '';
        return filename.startsWith('courses/')
            ? `${AWS_BUCKET_URL}/${filename}`
            : `${AWS_BUCKET_URL}/courses/${filename}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Container */}
                <Animated.View
                    entering={FadeInDown.duration(800).delay(200)}
                    style={styles.header}
                >
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="chevron-left" size={24} color="#233E4E" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Course Detail</Text>
                    </View>
                    <TouchableOpacity style={styles.headerBtn}>
                        <MaterialIcons name="more-horiz" size={24} color="#233E4E" />
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Video Player Area */}
                    <Animated.View
                        entering={FadeInUp.duration(800).delay(400)}
                        style={styles.videoPlayerContainer}
                    >
                        {activeLesson ? (
                            <View style={styles.videoBackground}>
                                <Video
                                    ref={videoRef}
                                    source={{ uri: getFileUrl(activeLesson.filename) }}
                                    style={StyleSheet.absoluteFillObject}
                                    resizeMode="contain"
                                    repeat={true}
                                    paused={actualPaused}
                                    muted={isMuted}
                                    onLoad={handleLoad}
                                    onProgress={handleProgress}
                                    progressUpdateInterval={250}
                                />
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={styles.videoOverlay}
                                    onPress={handleScreenTouch}
                                >
                                    {/* Top Controls */}
                                    <Animated.View
                                        style={[styles.videoTopControls, { opacity: showControls ? 1 : 0 }]}
                                        pointerEvents={showControls ? 'auto' : 'none'}
                                    >
                                        <View style={styles.hdBadge}>
                                            <Text style={styles.hdBadgeText}>HD</Text>
                                        </View>
                                    </Animated.View>

                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        {/* Center Controls */}
                                        <Animated.View
                                            style={[styles.videoCenterControls, { opacity: showControls ? 1 : 0 }]}
                                            pointerEvents={showControls ? 'auto' : 'none'}
                                        >
                                            <TouchableOpacity style={styles.rewindBtn} onPress={skipBackward}>
                                                <MaterialIcons name="replay-10" size={32} color="#fff" />
                                            </TouchableOpacity>

                                            <TouchableOpacity activeOpacity={0.8} style={styles.playPauseBtnContainer} onPress={togglePlayPause}>
                                                <LinearGradient
                                                    colors={['#233E4E', '#557D84']}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                    style={styles.playPauseBtn}
                                                >
                                                    <MaterialIcons name={userPaused ? "play-arrow" : "pause"} size={36} color="#fff" />
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.forwardBtn} onPress={skipForward}>
                                                <MaterialIcons name="forward-10" size={32} color="#fff" />
                                            </TouchableOpacity>
                                        </Animated.View>
                                    </View>

                                    {/* Bottom Controls */}
                                    <View style={styles.videoBottomControls}>
                                        <View style={styles.progressBarContainer}>
                                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                            <View style={styles.progressBarTrack}>
                                                <LinearGradient
                                                    colors={['#2DD4BF', '#557D84']}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                                                />
                                                <View style={[styles.progressHandle, { left: `${progressPercentage}%` }]} />
                                            </View>
                                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                        </View>

                                        <View style={styles.videoFooterControls}>
                                            <View style={styles.leftFooterControls}>
                                                <TouchableOpacity style={{ marginRight: 16 }} onPress={toggleMute}>
                                                    <MaterialIcons name={isMuted ? "volume-off" : "volume-up"} size={20} color="rgba(255,255,255,0.9)" />
                                                </TouchableOpacity>
                                                <TouchableOpacity>
                                                    <MaterialIcons name="closed-caption" size={20} color="rgba(255,255,255,0.9)" />
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity onPress={handleFullscreen}>
                                                <MaterialIcons name="fullscreen" size={20} color="rgba(255,255,255,0.9)" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={[styles.videoBackground, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: '#64748B', fontWeight: '600' }}>No video content available</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Lesson Details Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.courseTitle}>{course?.course_title || 'Course Details'}</Text>
                        <Text style={styles.moduleText}>{course?.specialization_name || 'Specialization'}</Text>

                        {/* Course Assessment Section */}
                        {course?.assessments && course.assessments.length > 0 && (
                            <Animated.View
                                entering={FadeInUp.duration(800).delay(600)}
                                style={styles.assessmentSection}
                            >
                                <LinearGradient
                                    colors={['#233E4E', '#557D84']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.assessmentCard}
                                >
                                    <View style={styles.assessmentCardContent}>
                                        <View style={styles.assessmentTextContainer}>
                                            <Text style={styles.assessmentLabel}>COURSE QUIZ</Text>
                                            <Text style={styles.assessmentTitleCard}>{course.assessment_title || 'Final Knowledge Check'}</Text>
                                            <Text style={styles.assessmentDetail}>{course.assessments.length} Questions • {course.time_limit || 10} Mins</Text>
                                        </View>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={styles.startQuizBtnLarge}
                                            onPress={() => navigation.navigate('CourseQuiz', {
                                                courseId,
                                                assessments: course.assessments,
                                                title: course.assessment_title || course.course_title + ' Quiz',
                                                time_limit: course.time_limit || 10,
                                                passing_score: course.passing_score || 70,
                                                shuffle_questions: course.shuffle_questions,
                                                explanation: true, // Internal flag to enable feedback
                                                show_results_immediately: course.show_results_immediately
                                            })}
                                        >
                                            <Text style={styles.startQuizTextLarge}>START</Text>
                                            <MaterialIcons name="play-arrow" size={20} color="#2DD4BF" />
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {/* Text Lessons Study Plan */}
                        {textLessons.length > 0 && (
                            <Animated.View
                                entering={FadeInUp.duration(800).delay(900)}
                                style={styles.lessonsSection}
                            >
                                <Text style={styles.sectionTitle}>Study Plan</Text>
                                <View style={styles.lessonsList}>
                                    {textLessons.map((tLesson: any, index: number) => {
                                        const isLearned = completedTextLessons.includes(index);

                                        return (
                                            <Animated.View
                                                key={'text' + index}
                                                entering={FadeInUp.duration(600).delay(1100 + (index * 100))}
                                            >
                                                <TouchableOpacity activeOpacity={0.8} onPress={() => { navigation.navigate('LessonScreen', { lessonIndex: index, allLessons: textLessons, courseId, initialCompleted: completedTextLessons }) }}>
                                                    <View style={styles.lessonRow}>
                                                        <View style={[styles.lessonIconBox, isLearned ? { backgroundColor: '#10B981' } : { backgroundColor: '#f1f5f9' }]}>
                                                            <MaterialIcons name={isLearned ? "check" : "auto-stories"} size={24} color={isLearned ? "#fff" : "#94A3B8"} />
                                                        </View>
                                                        <View style={styles.lessonTextContent}>
                                                            <Text style={styles.lessonTitle} numberOfLines={1}>{tLesson.title}</Text>
                                                            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }} numberOfLines={1}>{tLesson.description || 'Lesson Module'}</Text>
                                                        </View>
                                                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                                                    </View>
                                                </TouchableOpacity>
                                            </Animated.View>
                                        )
                                    })}
                                </View>
                            </Animated.View>
                        )}
                    </View>
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
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Tab bar clearance
    },
    videoPlayerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    videoBackground: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 16,
    },
    videoTopControls: {
        alignItems: 'flex-end',
    },
    hdBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    hdBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    videoCenterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
    },
    rewindBtn: {
        opacity: 0.9,
    },
    forwardBtn: {
        opacity: 0.9,
    },
    playPauseBtnContainer: {
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
    },
    playPauseBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoBottomControls: {
        gap: 12,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
    },
    progressBarTrack: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressHandle: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#557D84',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        marginLeft: -6, // Center the handle
    },
    videoFooterControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftFooterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    courseTitle: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    moduleText: {
        color: '#557D84',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 4,
    },
    sectionTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    assessmentSection: {
        marginTop: 32,
    },
    assessmentCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: 'rgba(35, 62, 78, 0.2)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    assessmentCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    assessmentTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    assessmentLabel: {
        color: '#2DD4BF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    assessmentTitleCard: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 4,
    },
    assessmentDetail: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
    },
    startQuizBtnLarge: {
        backgroundColor: '#fff',
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startQuizTextLarge: {
        color: '#233E4E',
        fontSize: 12,
        fontWeight: '900',
    },
    resourceIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resourceTextContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    resourceName: {
        color: '#233E4E',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    resourceSize: {
        color: '#64748B',
        fontSize: 10,
    },
    downloadIconBtn: {
        padding: 4,
    },
    lessonsSection: {
        marginTop: 32,
    },
    lessonsList: {
        marginTop: 16,
        gap: 16,
    },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
        opacity: 0.8,
    },
    lessonRowActive: {
        backgroundColor: 'rgba(85, 125, 132, 0.05)',
        borderColor: 'rgba(85, 125, 132, 0.2)',
        borderWidth: 2,
        opacity: 1,
    },
    lessonIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lessonIconBoxActive: {
        backgroundColor: '#557D84',
    },
    lessonTextContent: {
        flex: 1,
        marginLeft: 16,
    },
    playingNowTag: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    lessonTitleActive: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    lessonDurationActive: {
        color: '#557D84',
        fontSize: 11,
        fontWeight: '700',
    },
    lessonTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '600',
    },
    upcomingTag: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },
    lessonDuration: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },
});

export default CourseDetailScreen;
