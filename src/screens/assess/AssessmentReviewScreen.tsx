import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
} from 'react-native-reanimated';
import api from '../../services/api';

const AssessmentReviewScreen = ({ navigation, route }: any) => {
    const { resultId } = route.params;
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/student/assessment-result/${resultId}`);
            if (response.data.status) {
                setResult(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching assessment result:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#557D84" />
                <Text style={styles.loadingText}>Fetching results...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Result not found.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const assessment = result.assessment_details || {};
    const questions = assessment.questions || [];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{assessment.assessment_title || 'Review'}</Text>
                    <Text style={styles.headerSubtitle}>SCORE: {result.score}/{result.result?.length} ({Math.round((result.score / result.result?.length) * 100)}%)</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {questions.map((q: any, index: number) => {
                    const studentAnswer = result.result?.find((r: any) => r.question_no === (index + 1));
                    const isCorrect = studentAnswer?.correct;
                    const studentOptionIndex = studentAnswer?.answered !== null ? studentAnswer.answered - 1 : -1;
                    const correctOptionIndex = q.correctOption;

                    return (
                        <Animated.View 
                            key={index}
                            entering={FadeInUp.duration(600).delay(index * 100)}
                            style={styles.questionCard}
                        >
                            <View style={styles.questionHeader}>
                                <View style={[styles.qNoBadge, { backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2' }]}>
                                    <Text style={[styles.qNoText, { color: isCorrect ? '#16a34a' : '#dc2626' }]}>Q{index + 1}</Text>
                                </View>
                                {isCorrect ? (
                                    <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                                ) : (
                                    <MaterialIcons name="cancel" size={20} color="#dc2626" />
                                )}
                            </View>

                            <Text style={styles.questionText}>{q.question}</Text>

                            <View style={styles.optionsList}>
                                {q.options.map((opt: string, optIdx: number) => {
                                    const isStudentChoice = optIdx === studentOptionIndex;
                                    const isCorrectChoice = optIdx === correctOptionIndex;
                                    
                                    let cardStyle = styles.optionCard;
                                    let labelBoxStyle = styles.optionLabelBox;
                                    let labelTextStyle = styles.optionLabelText;

                                    if (isCorrectChoice) {
                                        cardStyle = [styles.optionCard, styles.optionCorrect];
                                        labelBoxStyle = [styles.optionLabelBox, styles.optionLabelCorrect];
                                        labelTextStyle = [styles.optionLabelText, { color: '#fff' }];
                                    } else if (isStudentChoice && !isCorrect) {
                                        cardStyle = [styles.optionCard, styles.optionWrong];
                                        labelBoxStyle = [styles.optionLabelBox, styles.optionLabelWrong];
                                        labelTextStyle = [styles.optionLabelText, { color: '#fff' }];
                                    }

                                    return (
                                        <View key={optIdx} style={cardStyle}>
                                            <View style={labelBoxStyle}>
                                                <Text style={labelTextStyle}>{String.fromCharCode(65 + optIdx)}</Text>
                                            </View>
                                            <Text style={[styles.optionText, (isCorrectChoice || (isStudentChoice && !isCorrect)) && { fontWeight: '700' }]}>{opt}</Text>
                                            {isCorrectChoice && <MaterialIcons name="check" size={16} color="#16a34a" />}
                                            {isStudentChoice && !isCorrect && <MaterialIcons name="close" size={16} color="#dc2626" />}
                                        </View>
                                    );
                                })}
                            </View>

                            {q.explanation && (
                                <View style={styles.explanationBox}>
                                    <Text style={styles.explanationTitle}>Explanation:</Text>
                                    <Text style={styles.explanationText}>{q.explanation}</Text>
                                </View>
                            )}
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFB',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 16,
        marginBottom: 20,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#557D84',
        borderRadius: 8,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '800',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        marginLeft: 16,
        flex: 1,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
    },
    headerSubtitle: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    qNoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    qNoText: {
        fontSize: 11,
        fontWeight: '900',
    },
    questionText: {
        fontSize: 16,
        color: '#233E4E',
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 20,
    },
    optionsList: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#F8FAFC',
    },
    optionCorrect: {
        borderColor: '#16a34a',
        backgroundColor: '#f0fdf4',
    },
    optionWrong: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2',
    },
    optionLabelBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    optionLabelCorrect: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    optionLabelWrong: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    optionLabelText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
    },
    explanationBox: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#557D84',
    },
    explanationTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#233E4E',
        marginBottom: 4,
    },
    explanationText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});

export default AssessmentReviewScreen;
