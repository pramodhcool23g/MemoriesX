import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeInDown, FadeInRight, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as fetchPolyfill } from 'react-native-fetch-api';
import { TextDecoder } from 'text-encoding';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://medi-assistant-1079317970616.europe-west1.run.app/api/v1';
const API_KEY = '79c35c7dd011d88e21c2b1ef5f9f3da507d9f0a71430789f5aa41db2074e9bb5';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    time: string;
    isTyping?: boolean;
}

const ThinkingBubble = () => {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 600 }),
                withTiming(1, { duration: 600 })
            ),
            -1,
            false
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <View style={thinkingStyles.container}>
            <ActivityIndicator size="small" color="#557D84" style={thinkingStyles.spinner} />
            <Animated.Text style={[thinkingStyles.text, animStyle]}>Thinking...</Animated.Text>
        </View>
    );
};

const thinkingStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 2,
    },
    spinner: {
        transform: [{ scale: 0.75 }],
    },
    text: {
        fontSize: 14,
        fontWeight: '700',
        color: '#557D84',
        letterSpacing: 0.3,
    },
});

const ChatScreen = ({ navigation, route }: any) => {
    const { threadId, title, isNew } = route.params || {};

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(!isNew);
    const flatListRef = useRef<FlatList>(null);

    const getHeaders = async (accept?: string) => {
        const userDataStr = await AsyncStorage.getItem('user');
        if (!userDataStr) throw new Error('User not found in storage');
        const userData = JSON.parse(userDataStr);
        const headers: any = {
            'Content-Type': 'application/json',
            'X-User-ID': userData.userId,
            'X-API-Key': API_KEY,
        };
        if (accept) headers['Accept'] = accept;
        return { headers, userId: userData.userId };
    };

    // Load conversation history for existing threads
    useEffect(() => {
        if (!isNew && threadId) {
            loadHistory();
        }
    }, [threadId, isNew]);

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const { headers } = await getHeaders();
            const response = await fetch(`${BASE_URL}/history/${threadId}`, { headers });
            const data = await response.json();

            if (data.messages && Array.isArray(data.messages)) {
                const mapped: Message[] = data.messages.map((m: any) => ({
                    id: m.id || String(Date.now() + Math.random()),
                    text: m.content,
                    sender: m.role === 'user' ? 'user' : 'ai',
                    time: '',
                    isTyping: false,
                }));
                setMessages(mapped);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (inputText.trim() === '' || isLoading) return;

        const userMessageText = inputText.trim();
        const userMessageId = Date.now().toString();
        const newMessage: Message = {
            id: userMessageId,
            text: userMessageText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const { headers, userId } = await getHeaders('text/event-stream');

            // Initial AI message placeholder
            const aiMessageId = (Date.now() + 1).toString();
            const aiInitialMessage: Message = {
                id: aiMessageId,
                text: '',
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isTyping: true
            };
            setMessages(prev => [...prev, aiInitialMessage]);

            const response = await fetchPolyfill(`${BASE_URL}/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: userMessageText,
                    thread_id: threadId
                }),
                // @ts-ignore - react-native-fetch-api specific prop
                reactNative: { streaming: true }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let accumulatedText = '';
            let chunkCount = 0;

            try {
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;

                    if (value) {
                        chunkCount++;
                        let chunkStr = '';
                        const type = typeof value;
                        const isUint8 = value instanceof Uint8Array;

                        if (type === 'string') {
                            chunkStr = value;
                        } else if (type === 'number') {
                            chunkStr = String.fromCharCode(value);
                        } else if (isUint8) {
                            chunkStr = decoder.decode(value, { stream: true });
                        } else if (Array.isArray(value)) {
                            chunkStr = String.fromCharCode(...value);
                        } else if (value.buffer || (value.length !== undefined && typeof value[0] === 'number')) {
                            try {
                                chunkStr = decoder.decode(new Uint8Array(value), { stream: true });
                            } catch (e) {
                                try {
                                    chunkStr = String.fromCharCode(...Array.from(value as any) as number[]);
                                } catch (inner) {
                                    chunkStr = String(value);
                                }
                            }
                        } else {
                            chunkStr = value.text || value.data || String(value);
                        }

                        if (chunkStr && chunkStr !== '[object Object]') {
                            accumulatedText += chunkStr;
                        }

                        // Batch updates every 5 chunks for speed
                        if (chunkCount % 5 === 0 || done) {
                            await new Promise(r => setTimeout(r, 0));
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
                            ));
                        }
                    }
                }
            } catch (streamErr) {
                console.error('Stream reading error:', streamErr);
            }

            // Final decoder flush
            const finalChunk = decoder.decode();
            if (finalChunk) accumulatedText += finalChunk;

            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId ? { ...msg, text: accumulatedText, isTyping: false } : msg
            ));
        } catch (error) {
            console.error('Chat API Error:', error);
            setMessages(prev => {
                const withoutTyping = prev.filter(m => !m.isTyping);
                return [...withoutTyping, {
                    id: (Date.now() + 2).toString(),
                    text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
                    sender: 'ai',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isAI = item.sender === 'ai';
        return (
            <Animated.View
                entering={isAI ? FadeInUp.duration(400) : FadeInRight.duration(400)}
                style={[
                    styles.messageWrapper,
                    isAI ? styles.aiWrapper : styles.userWrapper
                ]}
            >
                {isAI && (
                    <View style={styles.aiAvatar}>
                        <MaterialIcons name="smart-toy" size={18} color="#557D84" />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isAI ? styles.aiBubble : styles.userBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isAI ? styles.aiText : styles.userText
                    ]}>
                        {item.text}
                        {isAI && item.isTyping && item.text.length > 0 && (
                            <Text style={styles.cursor}>▊</Text>
                        )}
                    </Text>
                    {isAI && item.isTyping && item.text.length === 0 && (
                        <ThinkingBubble />
                    )}
                    {item.time ? (
                        <Text style={[
                            styles.timeText,
                            isAI ? styles.aiTime : styles.userTime
                        ]}>
                            {item.time}
                        </Text>
                    ) : null}
                </View>
            </Animated.View>
        );
    };

    const displayTitle = title || 'New Chat';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="chevron-left" size={28} color="#233E4E" />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <View style={styles.headerAvatarWrapper}>
                            <View style={styles.headerAvatar}>
                                <MaterialIcons name="smart-toy" size={22} color="#557D84" />
                            </View>
                            <View style={styles.onlineBadge} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
                            <Text style={styles.headerStatus}>Medica AI • Online</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Messages List */}
                {historyLoading ? (
                    <View style={styles.historyLoading}>
                        <ActivityIndicator size="large" color="#557D84" />
                        <Text style={styles.historyLoadingText}>Loading conversation...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        extraData={messages}
                        contentContainerStyle={[
                            styles.listContent,
                            messages.length === 0 && styles.listContentEmpty
                        ]}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View style={styles.emptyChat}>
                                <View style={styles.emptyChatIconBg}>
                                    <MaterialIcons name="smart-toy" size={36} color="#557D84" />
                                </View>
                                <Text style={styles.emptyChatTitle}>Medica AI</Text>
                                <Text style={styles.emptyChatSubtitle}>Ask me anything about medicine,{'\n'}anatomy, pharmacology, or your courses.</Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <View style={styles.footer}>
                    <View style={styles.inputContainerWrapper}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask Medica anything..."
                                placeholderTextColor="#94A3B8"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                editable={!historyLoading}
                            />
                            <View style={styles.inputActions}>
                                <TouchableOpacity
                                    style={[styles.sendBtn, (inputText.trim() === '' || isLoading) && styles.sendBtnDisabled]}
                                    onPress={handleSend}
                                    disabled={inputText.trim() === '' || isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <MaterialIcons name="send" size={18} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: 'rgba(255,255,255,0.98)',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        gap: 10,
    },
    headerAvatarWrapper: {
        position: 'relative',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#233E4E',
    },
    headerStatus: {
        fontSize: 10,
        fontWeight: '600',
        color: '#10b981',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listContent: {
        padding: 16,
        gap: 20,
        paddingBottom: 20,
    },
    listContentEmpty: {
        flex: 1,
    },
    emptyChat: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 32,
    },
    emptyChatIconBg: {
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: 'rgba(85, 125, 132, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyChatTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#233E4E',
        marginBottom: 8,
    },
    emptyChatSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    historyLoading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    historyLoadingText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    messageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: '85%',
    },
    aiWrapper: {
        alignSelf: 'flex-start',
        gap: 10,
    },
    userWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    aiBubble: {
        backgroundColor: 'rgba(45, 212, 191, 0.12)',
        borderTopLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#233E4E',
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 22,
    },
    aiText: {
        color: '#233E4E',
    },
    userText: {
        color: '#FFFFFF',
    },
    cursor: {
        color: '#557D84',
        fontSize: 14,
        fontWeight: '900',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#557D84',
        opacity: 0.5,
    },
    dot1: { opacity: 0.3 },
    dot2: { opacity: 0.6 },
    dot3: { opacity: 0.9 },
    timeText: {
        fontSize: 9,
        fontWeight: '500',
        marginTop: 6,
    },
    aiTime: {
        color: 'rgba(35, 62, 78, 0.4)',
    },
    userTime: {
        color: 'rgba(255, 255, 255, 0.45)',
        textAlign: 'right',
    },
    footer: {
        backgroundColor: '#FFFFFF',
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    inputContainerWrapper: {
        paddingHorizontal: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 28,
        padding: 6,
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#233E4E',
        paddingVertical: 8,
        maxHeight: 100,
    },
    inputActions: {
        paddingRight: 2,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#233E4E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#233E4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    sendBtnDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default ChatScreen;
