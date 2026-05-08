import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeInRight,
    ZoomIn,
} from 'react-native-reanimated';
import api from '../../services/api';

const QuizScreen = ({ navigation, route }: any) => {
    const { assessment } = route.params || {};
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (assessment) {
            let rawQuestions = [...(assessment.questions || [])];
            
            if (assessment.shuffle_questions) {
                rawQuestions.sort(() => Math.random() - 0.5);
            }

            const mappedQuestions = rawQuestions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                options: q.options.map((opt: string, optIdx: number) => ({
                    label: String.fromCharCode(65 + optIdx),
                    text: opt
                })),
                answer: q.correctOption,
                original_index: index // to track for results if needed
            }));

            setQuestions(mappedQuestions);
            setTimeRemaining((assessment.time_limit || 10) * 60);
            setTimerActive(true);
            setLoading(false);
        }
    }, [assessment]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive && !showResult && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, showResult, timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        const currentQ = questions[currentQuestion];
        const isCorrect = selectedOption === currentQ.answer;
        
        const newResults = [...results, {
            question_no: currentQuestion + 1,
            answered: selectedOption !== null ? selectedOption + 1 : null,
            correct: isCorrect
        }];
        setResults(newResults);

        let newScore = score;
        if (isCorrect) {
            newScore = score + 1;
            setScore(newScore);
        }

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
        } else {
            handleFinish(newScore, newResults);
        }
    };

    const handleFinish = async (finalScore?: number, finalResults?: any[]) => {
        setTimerActive(false);
        setShowResult(true);
        
        const fScore = finalScore !== undefined ? finalScore : score;
        const fResults = finalResults !== undefined ? finalResults : results;

        try {
            await api.post('/student/assessment/submit', {
                assessment_id: assessment.assessment_id,
                score: fScore,
                result: fResults,
                time_consumed: (assessment.time_limit * 60) - timeRemaining
            });
        } catch (error) {
            console.error('Error submitting assessment:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#557D84" />
            </View>
        );
    }

    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        const isPassed = percentage >= (assessment.passing_score || 80);

        return (
            <View style={styles.resultContainer}>
                {/* Result Header */}
                <Animated.View 
                    entering={FadeInDown.duration(800).delay(200)}
                    style={styles.resultHeader}
                >
                    <TouchableOpacity style={styles.resultHeaderBtn} disabled>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                    </TouchableOpacity>
                    <View style={styles.resultHeaderCenter}>
                        <Text style={styles.resultHeaderTitle}>ASSESSMENT RESULT</Text>
                    </View>
                    <View style={styles.resultHeaderIcon}>
                        <MaterialIcons name="military-tech" size={24} color="#557D84" />
                    </View>
                </Animated.View>

                {/* Result Main */}
                <ScrollView contentContainerStyle={styles.resultMain} showsVerticalScrollIndicator={false}>
                    <Animated.View 
                        entering={FadeInUp.duration(800).delay(400)}
                        style={styles.resultTitleSection}
                    >
                        <View style={styles.resultIconBox}>
                            <MaterialIcons name="emoji-events" size={36} color="#557D84" />
                        </View>
                        <Text style={styles.resultCourseName}>{assessment.assessment_title}</Text>
                    </Animated.View>

                    {/* Circular Score */}
                    <Animated.View 
                        entering={ZoomIn.duration(800).delay(600)}
                        style={styles.scoreCircleContainer}
                    >
                        <LinearGradient
                            colors={['#557D84', '#2DD4BF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.scoreCircleOuter}
                        >
                            <View style={styles.scoreCircleInner}>
                                <Text style={styles.scorePercentText}>{percentage}%</Text>
                                <Text style={styles.scoreSubText}>{isPassed ? 'GREAT JOB!' : 'KEEP TRYING!'}</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Statistics Box */}
                    <Animated.View 
                        entering={FadeInUp.duration(800).delay(800)}
                        style={styles.statBoxContainer}
                    >
                        {[
                            { label: 'Questions', value: `${questions.length}/${questions.length}`, icon: 'fact-check', color: '#233E4E', bg: '#f1f5f9' },
                            { label: 'Correct', value: `${score}`, icon: 'check-circle', color: '#059669', bg: '#ecfdf5' },
                            { label: 'Time Taken', value: formatTime((assessment.time_limit * 60) - timeRemaining), icon: 'schedule', color: '#557D84', bg: '#F1FCF8', last: true },
                        ].map((stat, index) => (
                            <Animated.View 
                                key={stat.label}
                                entering={FadeInUp.duration(600).delay(1000 + (index * 150))}
                                style={[styles.statItem, stat.last && { borderBottomWidth: 0 }]}
                            >
                                <View style={styles.statItemLeft}>
                                    <View style={[styles.statItemIcon, { backgroundColor: stat.bg }]}>
                                        <MaterialIcons name={stat.icon} size={22} color={stat.color} />
                                    </View>
                                    <Text style={styles.statItemLabel}>{stat.label}</Text>
                                </View>
                                <Text style={styles.statItemValue}>{stat.value}</Text>
                            </Animated.View>
                        ))}
                    </Animated.View>
                </ScrollView>

                {/* Result Actions */}
                <View style={styles.resultFooter}>
                    <TouchableOpacity 
                        style={styles.actionBtnPrimaryContainer} 
                        activeOpacity={0.9}
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={['#557D84', '#2DD4BF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.actionBtnPrimary}
                        >
                            <Text style={styles.actionBtnPrimaryText}>RETURN TO DASHBOARD</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    {assessment.show_results_immediately && (
                        <TouchableOpacity style={styles.actionBtnSecondary} activeOpacity={0.9}>
                            <Text style={styles.actionBtnSecondaryText}>REVIEW ANSWERS</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    const q = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View 
                entering={FadeInDown.duration(800).delay(200)}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{assessment.assessment_title}</Text>
                </View>
                <View style={styles.timerBadge}>
                    <MaterialIcons name="timer" size={18} color={timeRemaining < 60 ? "#EF4444" : "#233E4E"} />
                    <Text style={[styles.timerText, timeRemaining < 60 && { color: "#EF4444" }]}>{formatTime(timeRemaining)}</Text>
                </View>
            </Animated.View>

            <View style={styles.main}>
                {/* Progress Tracking */}
                <Animated.View 
                    entering={FadeInUp.duration(800).delay(400)}
                    style={styles.progressContainer}
                >
                    <View style={styles.progressTextContainer}>
                        <Text style={styles.progressLabel}>PROGRESS</Text>
                        <Text style={styles.progressValue}>
                            Question <Text style={{ color: '#557D84' }}>{currentQuestion + 1}</Text> of {questions.length}
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                </Animated.View>

                {/* Question Section */}
                <ScrollView contentContainerStyle={styles.questionSection} showsVerticalScrollIndicator={false}>
                    <Animated.Text 
                        entering={FadeInUp.duration(800).delay(600)}
                        style={styles.questionText}
                    >
                        {q.question}
                    </Animated.Text>

                    <View style={styles.optionsContainer}>
                        {q.options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            return (
                                <Animated.View 
                                    key={`${currentQuestion}-${index}`}
                                    entering={FadeInRight.duration(600).delay(800 + (index * 150))}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.optionCard,
                                            isSelected && styles.optionCardSelected
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedOption(index)}
                                    >
                                        <View style={[
                                            styles.optionLabelBox,
                                            isSelected && styles.optionLabelBoxSelected
                                        ]}>
                                            <Text style={[
                                                styles.optionLabelText,
                                                isSelected && styles.optionLabelTextSelected
                                            ]}>{option.label}</Text>
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected
                                        ]}>{option.text}</Text>
                                        
                                        {isSelected && (
                                            <View style={styles.optionCheckBadge}>
                                                <MaterialIcons name="check" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.nextBtnContainer}
                    activeOpacity={0.9}
                    onPress={handleNext}
                    disabled={selectedOption === null}
                >
                    <View style={[
                        styles.nextBtn,
                        selectedOption === null && styles.nextBtnDisabled
                    ]}>
                        <Text style={styles.nextBtnText}>{currentQuestion === questions.length - 1 ? 'FINISH ASSESSMENT' : 'NEXT QUESTION'}</Text>
                        <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>
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
    backBtn: {
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
        paddingHorizontal: 16,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '800',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(35, 62, 78, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(35, 62, 78, 0.1)',
    },
    timerText: {
        color: '#233E4E',
        fontSize: 12,
        fontWeight: '900',
    },
    main: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    progressContainer: {
        marginTop: 16,
        gap: 12,
    },
    progressTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    progressLabel: {
        color: 'rgba(85, 125, 132, 0.8)',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    progressValue: {
        color: '#233E4E',
        fontSize: 12,
        fontWeight: '900',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#557D84',
        borderRadius: 3,
    },
    questionSection: {
        marginTop: 32,
        paddingBottom: 160,
    },
    questionText: {
        color: '#233E4E',
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 32,
    },
    optionsContainer: {
        marginTop: 32,
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#f1f5f9',
    },
    optionCardSelected: {
        borderColor: '#557D84',
        backgroundColor: '#F8FAFB',
    },
    optionLabelBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabelBoxSelected: {
        backgroundColor: '#557D84',
    },
    optionLabelText: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '700',
    },
    optionLabelTextSelected: {
        color: '#fff',
    },
    optionText: {
        flex: 1,
        marginLeft: 16,
        color: '#4B5563',
        fontSize: 14,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#233E4E',
        fontWeight: '600',
        paddingRight: 16,
    },
    optionCheckBadge: {
        position: 'absolute',
        right: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#557D84',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    nextBtnContainer: {
        shadowColor: 'rgba(35, 62, 78, 0.12)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 6,
    },
    nextBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#233E4E',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Result Screen Styles
    resultContainer: {
        flex: 1,
        backgroundColor: '#F1FCF8',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 8,
        zIndex: 20,
    },
    resultHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        opacity: 0, // Hidden but keeps structure
    },
    resultHeaderCenter: {
        flex: 1,
        alignItems: 'center',
    },
    resultHeaderTitle: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '800',
        opacity: 0.6,
        letterSpacing: -0.5,
    },
    resultHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    resultMain: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 16,
        paddingBottom: 240,
    },
    resultTitleSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    resultIconBox: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: 'rgba(85, 125, 132, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    resultCourseName: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '700',
    },
    scoreCircleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    scoreCircleOuter: {
        width: 200,
        height: 200,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8, // Creates the border thickness
    },
    scoreCircleInner: {
        width: '100%',
        height: '100%',
        borderRadius: 92, // To keep the circle perfectly round inside the border
        backgroundColor: '#F1FCF8', // Matches the screen background so the center is hollow
        alignItems: 'center',
        justifyContent: 'center',
    },
    scorePercentText: {
        fontSize: 60,
        color: '#233E4E', // Replaces mesh gradient for compatibility
        fontWeight: '900',
    },
    scoreSubText: {
        color: '#557D84',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    statBoxContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 40,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226, 232, 240, 0.4)',
    },
    statItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    statItemLabel: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: '600',
    },
    statItemValue: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '800',
    },
    resultFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.5)',
        gap: 12,
    },
    actionBtnPrimaryContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    actionBtnPrimary: {
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    actionBtnSecondary: {
        width: '100%',
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.6)',
    },
    actionBtnSecondaryText: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default QuizScreen;
