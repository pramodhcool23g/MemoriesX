import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Dimensions, 
    ScrollView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeInRight,
    ZoomIn,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';


const CourseQuizScreen = ({ navigation, route }: any) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [title, setTitle] = useState("Quiz");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0); // In seconds
    const [wasTimeUp, setWasTimeUp] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const { 
        time_limit = 10, 
        passing_score = 70, 
        shuffle_questions = false, 
        show_results_immediately = true 
    } = route.params || {};

    useEffect(() => {
        if (route.params?.assessments?.length > 0) {
            const passedTitle = route.params?.title || "Quiz";
            const passedAssessments = route.params.assessments;
            
            let rawQuestions = [];
            let quizTitle = passedTitle;

            if (passedAssessments[0]?.questions) {
                const assessment = passedAssessments[0];
                quizTitle = assessment.settings?.title || passedTitle;
                rawQuestions = assessment.questions || [];
            } else {
                rawQuestions = passedAssessments;
            }

            // Shuffle Logic
            if (shuffle_questions) {
                rawQuestions = [...rawQuestions].sort(() => Math.random() - 0.5);
            }

            const parsed = rawQuestions.map((q: any, i: number) => ({
                id: q.id || i,
                question: q.question || q.questionText || "Untitled Question",
                options: (q.options || []).map((optText: string, idx: number) => ({
                    id: String.fromCharCode(65 + idx), // A, B, C, D
                    text: optText
                })),
                correctAnswer: String.fromCharCode(65 + (q.correctOption > 0 ? q.correctOption - 1 : q.correctOption)),
                explanation: q.explanation || "The correct answer is " + String.fromCharCode(65 + (q.correctOption > 0 ? q.correctOption - 1 : q.correctOption)) + "."
            }));
            
            setTitle(quizTitle);
            setQuestions(parsed);
            setTimeRemaining(time_limit * 60); // Set countdown from minutes
        }
    }, [route.params]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isCompleted && questions.length > 0) {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setWasTimeUp(true);
                        setIsCompleted(true);
                        submitResults(score); // Submit wherever we are
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isCompleted, questions, score]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const submitResults = async (finalScore: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const percentage = Math.round((finalScore / questions.length) * 100);
            await fetch(`${API_URL}/student/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: route.params?.courseId,
                    score: finalScore,
                    total_questions: questions.length,
                    percentage: percentage,
                    passed: percentage >= passing_score,
                    time_consumed: (time_limit * 60) - timeRemaining,
                    submitted_at: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error submitting quiz', error);
        }
    };

    const handleNext = () => {
        if (selectedOption === null) return;

        if (!showFeedback) {
            // Evaluates answer and shows feedback
            let newScore = score;
            if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
                newScore = score + 1;
                setScore(newScore);
            }
            setShowFeedback(true);
        } else {
            // Moves to next or finishes
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
                setShowFeedback(false);
            } else {
                setIsCompleted(true);
                submitResults(score);
            }
        }
    };

    if (questions.length === 0) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2DD4BF" />
                <Text style={{ marginTop: 16, color: '#64748B' }}>Loading Assessment...</Text>
            </SafeAreaView>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const percentageScore = Math.round((score / questions.length) * 100);
    const isPassed = percentageScore >= passing_score;

    if (isCompleted) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.completionContainer}>
                    <Animated.View entering={ZoomIn.duration(800)}>
                        <View style={[styles.successIconCircle, !isPassed && { backgroundColor: '#FEE2E2' }]}>
                            <MaterialIcons 
                                name={wasTimeUp ? "timer-off" : (isPassed ? "emoji-events" : "sentiment-very-dissatisfied")} 
                                size={60} 
                                color={isPassed ? "#557D84" : "#EF4444"} 
                            />
                        </View>
                    </Animated.View>

                    <Animated.Text entering={FadeInUp.delay(400)} style={styles.completedTitle}>
                        {wasTimeUp ? "Time's Up!" : "Quiz Completed!"}
                    </Animated.Text>
                    
                    {show_results_immediately ? (
                        <>
                        <Animated.Text entering={FadeInUp.delay(600)} style={styles.completedSubTitle}>
                            You scored {score} out of {questions.length} ({percentageScore}%)
                        </Animated.Text>

                        <Animated.View entering={FadeInUp.delay(700)} style={[styles.statusBadge, isPassed ? styles.passBadge : styles.failBadge]}>
                            <Text style={styles.statusBadgeText}>{isPassed ? "PASSED" : "FAILED"}</Text>
                        </Animated.View>
                        </>
                    ) : (
                        <Animated.Text entering={FadeInUp.delay(600)} style={styles.completedSubTitle}>
                            Your assessment has been submitted for review.
                        </Animated.Text>
                    )}

                    <Animated.View entering={FadeInUp.delay(800)} style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Time Spent</Text>
                            <Text style={styles.statValue}>{formatTime((time_limit * 60) - timeRemaining)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Goal</Text>
                            <Text style={styles.statValue}>{passing_score}%</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(1000)} style={styles.footerCompletion}>
                        <TouchableOpacity 
                            style={styles.backBtnContainer}
                            activeOpacity={0.9}
                            onPress={() => navigation.goBack()}
                        >
                            <LinearGradient
                                colors={['#2DD4BF', '#557D84']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.backBtn}
                            >
                                <MaterialIcons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.backBtnText}>RETURN TO COURSE</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.container}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity 
                            style={styles.closeBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="close" size={24} color="#233E4E" />
                        </TouchableOpacity>
                        <Text style={styles.headerCourseTitle}>{title}</Text>
                        <View style={styles.timerBox}>
                            <MaterialIcons name="timer" size={20} color={timeRemaining < 60 ? "#EF4444" : "#557D84"} />
                            <Text style={[styles.timerText, timeRemaining < 60 && { color: "#EF4444" }]}>{formatTime(timeRemaining)}</Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.questionCounter}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
                            <Text style={styles.percentText}>{Math.round(progress)}% Complete</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <LinearGradient
                                colors={['#2DD4BF', '#557D84']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFill, { width: `${progress}%` }]}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Question */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInUp.duration(600).delay(200)}>
                        <Text style={styles.questionText}>
                            {currentQuestion.question}
                        </Text>
                        <View style={styles.accentLine} />
                    </Animated.View>

                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrect = option.id === currentQuestion.correctAnswer;
                            
                            let cardStyle = [styles.optionCard];
                            let labelStyle = [styles.optionLabel];
                            let textStyle = [styles.optionText];
                            
                            if (showFeedback) {
                                if (isCorrect) {
                                    cardStyle.push(styles.optionCardCorrect);
                                    labelStyle.push(styles.optionLabelCorrect);
                                    textStyle.push(styles.optionTextCorrect);
                                } else if (isSelected) {
                                    cardStyle.push(styles.optionCardWrong);
                                    labelStyle.push(styles.optionLabelWrong);
                                }
                            } else if (isSelected) {
                                cardStyle.push(styles.optionCardSelected);
                                labelStyle.push(styles.optionLabelSelected);
                                textStyle.push(styles.optionTextSelected);
                            }

                            return (
                                <Animated.View 
                                    key={option.id}
                                    entering={FadeInRight.duration(500).delay(400 + index * 100)}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => !showFeedback && setSelectedOption(option.id)}
                                        style={cardStyle}
                                        disabled={showFeedback}
                                    >
                                        <View style={labelStyle}>
                                            {showFeedback && isCorrect ? (
                                                <MaterialIcons name="check" size={20} color="#fff" />
                                            ) : showFeedback && isSelected && !isCorrect ? (
                                                <MaterialIcons name="close" size={20} color="#fff" />
                                            ) : isSelected && !showFeedback ? (
                                                <MaterialIcons name="check" size={20} color="#fff" />
                                            ) : (
                                                <Text style={[styles.optionLetter, (isSelected || (showFeedback && isCorrect)) && { color: '#fff' }]}>{option.id}</Text>
                                            )}
                                        </View>
                                        <Text style={textStyle}>
                                            {option.text}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {showFeedback && (
                        <Animated.View entering={FadeInUp.duration(600)} style={styles.explanationBox}>
                            <View style={styles.explanationHeader}>
                                <MaterialIcons name="lightbulb" size={20} color="#2DD4BF" />
                                <Text style={styles.explanationTitle}>Explanation</Text>
                            </View>
                            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                        </Animated.View>
                    )}
                </ScrollView>

                {/* Footer */}
                <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.submitBtnContainer, !selectedOption && styles.submitBtnDisabled]}
                        activeOpacity={0.9}
                        onPress={handleNext}
                        disabled={!selectedOption}
                    >
                        <LinearGradient
                            colors={selectedOption ? ['#233E4E', '#557D84'] : ['#CBD5E1', '#94A3B8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.submitBtn}
                        >
                            <Text style={styles.submitBtnText}>
                                {showFeedback 
                                    ? (currentQuestionIndex === questions.length - 1 ? 'FINISH QUIZ' : 'CONTINUE') 
                                    : 'SUBMIT ANSWER'}
                            </Text>
                            <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
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
    },
    header: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerCourseTitle: {
        color: '#557D84',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        flex: 1,
        textAlign: 'center',
    },
    timerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timerText: {
        color: '#557D84',
        fontSize: 14,
        fontWeight: '700',
    },
    progressSection: {
        gap: 12,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questionCounter: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '700',
    },
    percentText: {
        color: '#557D84',
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    questionText: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 32,
        marginBottom: 16,
    },
    accentLine: {
        width: 48,
        height: 6,
        backgroundColor: '#2DD4BF',
        borderRadius: 3,
    },
    optionsContainer: {
        marginTop: 32,
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    optionCardSelected: {
        borderColor: '#2DD4BF',
        backgroundColor: 'rgba(45, 212, 191, 0.05)',
        shadowColor: 'rgba(45, 212, 191, 0.2)',
        elevation: 4,
    },
    optionLabel: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionLabelSelected: {
        backgroundColor: '#2DD4BF',
        borderColor: '#2DD4BF',
    },
    optionLetter: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    optionText: {
        color: '#233E4E',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    optionTextSelected: {
        color: '#233E4E',
        fontWeight: '800',
    },
    optionCardCorrect: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    optionCardWrong: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    optionLabelCorrect: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    optionLabelWrong: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    optionTextCorrect: {
        color: '#059669',
    },
    explanationBox: {
        marginTop: 32,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    explanationTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '900',
    },
    explanationText: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        paddingBottom: StatusBar.currentHeight ? 40 : 24,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    submitBtnContainer: {
        width: '100%',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#233E4E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    submitBtnDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    completionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    successIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    completedTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#233E4E',
        marginBottom: 8,
    },
    completedSubTitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
    },
    statusBadge: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 20,
    },
    passBadge: {
        backgroundColor: '#10B981',
    },
    failBadge: {
        backgroundColor: '#EF4444',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 24,
        borderRadius: 24,
        width: '100%',
        marginBottom: 60,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: '#233E4E',
        fontSize: 20,
        fontWeight: '800',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#e2e8f0',
    },
    footerCompletion: {
        width: '100%',
        marginTop: 40,
    },
    backBtnContainer: {
        width: '100%',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: 'rgba(45, 212, 191, 0.2)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    backBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

export default CourseQuizScreen;
