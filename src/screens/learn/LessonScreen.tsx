import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';

const LessonScreen = ({ route, navigation }: any) => {
    const { lessonIndex, allLessons, courseId, initialCompleted } = route.params;
    const [currentIndex, setCurrentIndex] = useState(lessonIndex);
    const [completed, setCompleted] = useState<number[]>(initialCompleted || []);

    const lesson = allLessons[currentIndex];

    // Trigger completion tracking on visit
    useEffect(() => {
        if (!completed.includes(currentIndex)) {
            const newCompleted = [...completed, currentIndex];
            setCompleted(newCompleted);
            
            AsyncStorage.getItem('token').then(token => {
                if (token) {
                    fetch(`${API_URL}/student/learning/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            course_id: courseId,
                            lesson_count: newCompleted,
                            isQuiz: false
                        })
                    }).catch(err => console.error(err));
                }
            });
        }
    }, [currentIndex]);

    const handleNext = () => { if (currentIndex < allLessons.length - 1) setCurrentIndex(currentIndex + 1); };
    const handlePrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

    if (!lesson) return null;

    const progress = ((currentIndex + 1) / allLessons.length) * 100;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
               <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                   <MaterialIcons name="chevron-left" size={28} color="#233E4E" />
               </TouchableOpacity>
               <View style={styles.headerTitleContainer}>
                   <Text style={styles.headerSubtitle}>MODULE {currentIndex + 1} OF {allLessons.length}</Text>
                   <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
               </View>
            </Animated.View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <LinearGradient
                    colors={['#2DD4BF', '#557D84']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
               <Animated.View entering={FadeInUp.duration(600).delay(200)}>
                   <Text style={styles.mainTitle}>{lesson.title}</Text>
                   <View style={styles.accentLine} />
                   <Text style={styles.mainDescription}>{lesson.description}</Text>
                   
                   {lesson.subTitles?.map((st: any, i: number) => (
                       <Animated.View key={i} entering={FadeInRight.duration(500).delay(400 + i * 100)} style={styles.subSection}>
                           <View style={styles.subTitleRow}>
                               <MaterialIcons name="play-arrow" size={20} color="#2DD4BF" />
                               <Text style={styles.subTitle}>{st.title}</Text>
                           </View>
                           <Text style={styles.subDesc}>{st.description}</Text>
                       </Animated.View>
                   ))}
               </Animated.View>
            </ScrollView>

            <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.footer}>
               <TouchableOpacity 
                   onPress={handlePrev} 
                   disabled={currentIndex === 0} 
                   style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
               >
                   <MaterialIcons name="arrow-back-ios" size={16} color={currentIndex === 0 ? "#94A3B8" : "#fff"} />
                   <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>PREVIOUS</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                   onPress={handleNext} 
                   disabled={currentIndex === allLessons.length - 1} 
                   style={[styles.navBtn, currentIndex === allLessons.length - 1 && styles.navBtnDisabled]}
               >
                   <Text style={[styles.navBtnText, currentIndex === allLessons.length - 1 && styles.navBtnTextDisabled]}>NEXT</Text>
                   <MaterialIcons name="arrow-forward-ios" size={16} color={currentIndex === allLessons.length - 1 ? "#94A3B8" : "#fff"} />
               </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerSubtitle: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 2,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#f1f5f9',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#233E4E',
        lineHeight: 36,
        marginBottom: 16,
    },
    accentLine: {
        width: 40,
        height: 6,
        backgroundColor: '#2DD4BF',
        borderRadius: 3,
        marginBottom: 24,
    },
    mainDescription: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
        fontWeight: '500',
        marginBottom: 32,
    },
    subSection: {
        marginBottom: 24,
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#557D84',
    },
    subTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#233E4E',
        flex: 1,
    },
    subDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        justifyContent: 'space-between',
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#233E4E',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 24,
        gap: 8,
    },
    navBtnDisabled: {
        backgroundColor: '#f1f5f9',
    },
    navBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    navBtnTextDisabled: {
        color: '#94A3B8',
    }
});

export default LessonScreen;
