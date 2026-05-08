import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeOutLeft,
    SlideInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const BASE_URL = 'https://medi-assistant-1079317970616.europe-west1.run.app/api/v1';
const API_KEY = '79c35c7dd011d88e21c2b1ef5f9f3da507d9f0a71430789f5aa41db2074e9bb5';

interface Thread {
    thread_id: string;
    title: string;
    created_at: string | null;
    updated_at: string;
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

const ThreadItem = ({ item, index, onPress, onDelete }: { item: Thread; index: number; onPress: () => void; onDelete: () => void }) => {
    return (
        <Animated.View entering={FadeInRight.duration(400).delay(index * 60)}>
            <TouchableOpacity style={styles.threadCard} onPress={onPress} activeOpacity={0.7}>
                <View style={styles.threadIconContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color="#557D84" />
                </View>
                <View style={styles.threadContent}>
                    <Text style={styles.threadTitle} numberOfLines={2}>{item.title || 'New Conversation'}</Text>
                    <View style={styles.threadMeta}>
                        <MaterialIcons name="schedule" size={11} color="#94A3B8" />
                        <Text style={styles.threadDate}>{formatDate(item.updated_at)}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="delete-outline" size={20} color="#CBD5E1" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ChatListScreen = ({ navigation }: any) => {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const isFocused = useIsFocused();

    const fabScale = useSharedValue(0);
    const fabStyle = useAnimatedStyle(() => ({
        transform: [{ scale: fabScale.value }],
    }));

    const getHeaders = async () => {
        const userDataStr = await AsyncStorage.getItem('user');
        if (!userDataStr) throw new Error('User not found');
        const userData = JSON.parse(userDataStr);
        return {
            'Content-Type': 'application/json',
            'X-User-ID': userData.userId,
            'X-API-Key': API_KEY,
        };
    };

    const fetchThreads = useCallback(async () => {
        try {
            setLoading(true);
            const headers = await getHeaders();
            const response = await fetch(`${BASE_URL}/threads`, { headers });
            const data = await response.json();
            if (Array.isArray(data)) {
                setThreads(data);
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchThreads();
            fabScale.value = withSpring(1, { damping: 12, stiffness: 180 });
        } else {
            fabScale.value = withTiming(0, { duration: 200 });
        }
    }, [isFocused, fetchThreads]);

    const handleDeleteThread = (thread: Thread) => {
        Alert.alert(
            'Delete Conversation',
            `Are you sure you want to delete "${thread.title || 'this conversation'}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const headers = await getHeaders();
                            await fetch(`${BASE_URL}/threads/${thread.thread_id}`, {
                                method: 'DELETE',
                                headers,
                            });
                            setThreads(prev => prev.filter(t => t.thread_id !== thread.thread_id));
                        } catch (error) {
                            console.error('Error deleting thread:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAll = () => {
        if (threads.length === 0) return;
        Alert.alert(
            'Clear All History',
            'This will permanently delete all your conversations. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            const headers = await getHeaders();
                            await fetch(`${BASE_URL}/threads`, {
                                method: 'DELETE',
                                headers,
                            });
                            setThreads([]);
                        } catch (error) {
                            console.error('Error deleting all threads:', error);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleNewChat = async () => {
        const userDataStr = await AsyncStorage.getItem('user');
        if (!userDataStr) return;
        const userData = JSON.parse(userDataStr);
        const emailPrefix = userData.email.split('@')[0];
        const newThreadId = `${emailPrefix}-${Date.now()}`;
        navigation.navigate('Chat', { threadId: newThreadId, isNew: true });
    };

    const handleOpenThread = (thread: Thread) => {
        navigation.navigate('Chat', { threadId: thread.thread_id, title: thread.title, isNew: false });
    };

    const renderEmpty = () => (
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <MaterialIcons name="smart-toy" size={40} color="#557D84" />
            </View>
            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
            <Text style={styles.emptySubtitle}>Start a new chat with Medica AI{'\n'}to learn and explore medical topics</Text>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="chevron-left" size={28} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Medica AI</Text>
                    <Text style={styles.headerSubtitle}>CONVERSATION HISTORY</Text>
                </View>
                <TouchableOpacity
                    style={[styles.clearBtn, (threads.length === 0 || deleting) && styles.clearBtnDisabled]}
                    onPress={handleDeleteAll}
                    disabled={threads.length === 0 || deleting}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <MaterialIcons name="delete-sweep" size={22} color={threads.length === 0 ? '#CBD5E1' : '#EF4444'} />
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Stats Bar */}
            {threads.length > 0 && (
                <Animated.View entering={SlideInDown.duration(400).delay(200)} style={styles.statsBar}>
                    <MaterialIcons name="forum" size={14} color="#557D84" />
                    <Text style={styles.statsText}>{threads.length} conversation{threads.length !== 1 ? 's' : ''}</Text>
                </Animated.View>
            )}

            {/* Thread List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#557D84" />
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
            ) : (
                <FlatList
                    data={threads}
                    keyExtractor={item => item.thread_id}
                    renderItem={({ item, index }) => (
                        <ThreadItem
                            item={item}
                            index={index}
                            onPress={() => handleOpenThread(item)}
                            onDelete={() => handleDeleteThread(item)}
                        />
                    )}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={[styles.listContent, threads.length === 0 && { flex: 1 }]}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB - New Chat */}
            <Animated.View style={[styles.fab, fabStyle]}>
                <TouchableOpacity style={styles.fabBtn} onPress={handleNewChat} activeOpacity={0.85}>
                    <MaterialIcons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 54 : 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#233E4E',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginTop: 1,
    },
    clearBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearBtnDisabled: {
        backgroundColor: '#F8FAFC',
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(85, 125, 132, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    statsText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#557D84',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    threadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: 'rgba(35, 62, 78, 0.06)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 2,
    },
    threadIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(85, 125, 132, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    threadContent: {
        flex: 1,
        marginRight: 8,
    },
    threadTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#233E4E',
        lineHeight: 20,
        marginBottom: 6,
    },
    threadMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    threadDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIconBg: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: 'rgba(85, 125, 132, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#233E4E',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
    },
    fabBtn: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#233E4E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#233E4E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
});

export default ChatListScreen;
