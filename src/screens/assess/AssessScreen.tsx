import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import api from '../../services/api';

const AssessScreen = ({ navigation }: any) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    const [assessments, setAssessments] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ attended: 0, questions: 0, percentage: 0, correct: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assessRes, resultsRes] = await Promise.all([
                api.get('/student/assessments'),
                api.get('/student/assessment-results')
            ]);

            if (assessRes.data.status) {
                setAssessments(assessRes.data.data);
            }
            if (resultsRes.data.status) {
                setResults(resultsRes.data.data);
                calculateStats(resultsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching assessment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (userResults: any[]) => {
        let totalQuestions = 0;
        let totalCorrect = 0;
        let sumPercentages = 0;

        userResults.forEach(res => {
            const qCount = res.result?.length || 0;
            totalQuestions += qCount;
            totalCorrect += res.score || 0;
            if (qCount > 0) {
                sumPercentages += (res.score / qCount) * 100;
            }
        });

        const avgPercentage = userResults.length > 0 ? Math.round(sumPercentages / userResults.length) : 0;
        setStats({ attended: userResults.length, questions: totalQuestions, percentage: avgPercentage, correct: totalCorrect });
        setAnimatedScore(avgPercentage);
    };

    useEffect(() => {
        let currentScore = 0;
        const targetScore = stats.percentage;
        const duration = 1000; // 1 second
        const stepTime = 16; // Update every frame (~60fps)
        const increment = targetScore / (duration / stepTime);

        const timer = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                setAnimatedScore(targetScore);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.floor(currentScore));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [stats.percentage]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(800).delay(200)}
                style={styles.header}
            >
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Assessments</Text>
                    <Text style={styles.headerSubtitle}>EVALUATE YOUR KNOWLEDGE</Text>
                </View>
                <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8}>
                    <MaterialIcons name="history" size={24} color="#233E4E" />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View
                    entering={FadeInUp.duration(800).delay(400)}
                    style={styles.section}
                >
                    <View style={styles.statsCardContainer}>
                        <View style={styles.statsHeaderRow}>
                            <View style={styles.progressCircleContainer}>
                                <Svg width="100" height="100" viewBox="0 0 100 100">
                                    <Circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        stroke="#F1F5F9"
                                        strokeWidth="8"
                                        fill="transparent"
                                    />
                                    <Circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        stroke="#2DD4BF"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 42}
                                        strokeDashoffset={2 * Math.PI * 42 * (1 - animatedScore / 100)}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                    />
                                </Svg>
                                <View style={styles.progressTextContainer}>
                                    <Text style={styles.progressPercentValue}>{animatedScore}%</Text>
                                    <Text style={styles.progressPercentLabel}>SCORE</Text>
                                </View>
                            </View>

                            <View style={styles.statsMainInfo}>
                                <Text style={styles.statsStatus}>{stats.percentage >= 80 ? 'EXCELLENT' : stats.percentage >= 60 ? 'GOOD' : 'KEEP GOING'}</Text>
                                <Text style={styles.statsFeedback}>{stats.percentage >= 80 ? 'Mastering Content' : stats.percentage >= 60 ? 'Steady Progress' : 'Needs Focus'}</Text>
                                <View style={styles.statsBadge}>
                                    <MaterialIcons name="workspace-premium" size={14} color="#557D84" />
                                    <Text style={styles.statsBadgeText}>LEVEL {Math.floor(stats.attended / 5) + 1}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.statsCardsRow}>
                            <View style={styles.miniStatCard}>
                                <Text style={styles.miniStatValue}>{stats.attended}</Text>
                                <Text style={styles.miniStatLabel}>COMPLETED</Text>
                            </View>
                            <View style={styles.miniStatCard}>
                                <Text style={styles.miniStatValue}>{stats.questions}</Text>
                                <Text style={styles.miniStatLabel}>QUESTIONS</Text>
                            </View>
                            <View style={styles.miniStatCard}>
                                <Text style={styles.miniStatValue}>{stats.correct}</Text>
                                <Text style={styles.miniStatLabel}>CORRECT</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Pending Assessments */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(600)}
                    style={styles.pendingSection}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pending Assessments</Text>
                        <TouchableOpacity onPress={fetchData}>
                            <MaterialIcons name="refresh" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.assessmentsList}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#557D84" style={{ marginTop: 20 }} />
                        ) : assessments.filter(a => !results.some(r => r.assessment_id === a.assessment_id)).length > 0 ? (
                            assessments
                                .filter(a => !results.some(r => r.assessment_id === a.assessment_id))
                                .map((assess, index) => (
                                    <Animated.View
                                        key={assess.assessment_id}
                                        entering={FadeInRight.duration(600).delay(200 + (index * 100))}
                                        style={styles.assessmentCard}
                                    >
                                        <View style={styles.assessmentCardHeader}>
                                            <View style={[styles.assessmentIconContainer, { backgroundColor: '#eff6ff' }]}>
                                                <MaterialIcons name="assessment" size={24} color="#2563eb" />
                                            </View>
                                            <View style={styles.assessmentMetaContainer}>
                                                <Text style={styles.assessmentMetaText}>{assess.time_limit} MINS</Text>
                                                <Text style={styles.assessmentMetaText}>{assess.questions?.length || 0} QUESTIONS</Text>
                                            </View>
                                        </View>

                                        <View style={styles.assessmentInfoContainer}>
                                            <Text style={styles.assessmentTitle}>{assess.assessment_title}</Text>
                                            <Text style={styles.assessmentDesc}>{assess.course_title}</Text>
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            style={styles.startBtnContainer}
                                            onPress={() => navigation.navigate('Quiz', { assessment: assess })}
                                        >
                                            <LinearGradient
                                                colors={['#557D84', '#2DD4BF']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.startBtn}
                                            >
                                                <Text style={styles.startBtnText}>START ASSESSMENT</Text>
                                                <MaterialIcons name="play-arrow" size={16} color="rgba(255,255,255,0.9)" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No pending assessments.'}</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Completed Assessments */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(800)}
                    style={styles.completedSection}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Completed Assessments</Text>
                    </View>

                    <View style={styles.completedList}>
                        {results.length > 0 ? (
                            results.map((result, index) => {
                                const relatedAssess = assessments.find(a => a.assessment_id === result.assessment_id);
                                return (
                                    <Animated.View
                                        key={result.student_assessment_id}
                                        entering={FadeInRight.duration(600).delay(1000 + (index * 100))}
                                        style={styles.completedCard}
                                    >
                                        <TouchableOpacity 
                                            style={[styles.completedHeaderInfo, { flex: 1 }]}
                                            activeOpacity={0.7}
                                            onPress={() => navigation.navigate('AssessmentReview', { resultId: result.student_assessment_id })}
                                        >
                                            <View style={styles.completedIconContainer}>
                                                <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                                            </View>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.completedTitle} numberOfLines={1}>
                                                    {relatedAssess?.assessment_title || 'Assessment'}
                                                </Text>
                                                <Text style={styles.completedDate}>
                                                    COMPLETED
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        
                                        <View style={[
                                            styles.completedScoreBadge, 
                                            { 
                                                backgroundColor: result.score / (result.result?.length || 1) >= 0.8 ? '#ecfdf5' : '#fffbeb',
                                                borderColor: result.score / (result.result?.length || 1) >= 0.8 ? '#d1fae5' : '#fef3c7'
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.completedScoreText, 
                                                { color: result.score / (result.result?.length || 1) >= 0.8 ? '#059669' : '#d97706' }
                                            ]}>
                                                {Math.round((result.score / (result.result?.length || 1)) * 100)}%
                                            </Text>
                                        </View>
                                    </Animated.View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{loading ? '' : 'No completed assessments yet.'}</Text>
                            </View>
                        )}
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
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 20,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: 'rgba(85, 125, 132, 0.7)',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    historyBtn: {
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
        paddingBottom: 140,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    statsCardContainer: {
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
    statsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    progressCircleContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPercentValue: {
        color: '#233E4E',
        fontSize: 22,
        fontWeight: '900',
    },
    progressPercentLabel: {
        color: '#94A3B8',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1,
    },
    statsMainInfo: {
        flex: 1,
        gap: 4,
    },
    statsStatus: {
        color: '#2DD4BF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    statsFeedback: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        gap: 4,
    },
    statsBadgeText: {
        color: '#557D84',
        fontSize: 9,
        fontWeight: '900',
    },
    statsCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    miniStatCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    miniStatValue: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '900',
    },
    miniStatLabel: {
        color: '#64748B',
        fontSize: 8,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    pendingSection: {
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
    newBadge: {
        backgroundColor: '#E5EEF0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    newBadgeText: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    assessmentsList: {
        gap: 16,
    },
    assessmentCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: '#f8fafc',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
    },
    assessmentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    assessmentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    assessmentMetaContainer: {
        alignItems: 'flex-end',
    },
    assessmentMetaText: {
        color: 'rgba(75, 85, 99, 0.6)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    assessmentInfoContainer: {
        marginTop: 4,
    },
    assessmentTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    assessmentDesc: {
        color: '#4B5563',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    startBtnContainer: {
        marginTop: 8,
        shadowColor: 'rgba(85, 125, 132, 0.2)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 4,
    },
    startBtn: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    completedSection: {
        paddingHorizontal: 16,
        marginTop: 40,
        marginBottom: 20,
    },
    completedList: {
        gap: 12,
        marginTop: 20,
    },
    completedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    completedHeaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    completedIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    completedTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '700',
    },
    completedDate: {
        color: 'rgba(75, 85, 99, 0.7)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    completedScoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    completedScoreText: {
        fontSize: 12,
        fontWeight: '900',
    },
    emptyContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 14,
    },
});

export default AssessScreen;

