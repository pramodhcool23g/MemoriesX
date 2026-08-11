import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    FadeOut
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { createPipecatClient, OFFER_ENDPOINT } from '../../services/pipecatClient';

const svgData = require('../../assets/data/image_library.json');
const { width: windowWidth } = Dimensions.get('window');
const SVG_VIEWBOX = svgData.viewBox;

const STATUS_LABEL: Record<string, string> = {
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: 'Live Voice',
    disconnecting: 'Ending session…',
};

function matchTextToPathId(text: string, items: any[]): string | null {
    if (!text) return null;
    const cleanText = text.toLowerCase();

    if (/\b(?:left\s+atrium|left\s+atrial)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('left atrium'));
        if (item) return item.id;
    }
    if (/\b(?:right\s+atrium|right\s+atrial)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('right atrium'));
        if (item) return item.id;
    }
    if (/\b(?:inferior\s+vena\s+cava|inferior\s+venacava)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('inferior venacava'));
        if (item) return item.id;
    }
    if (/\b(?:superior\s+vena\s+cava|superior\s+venacava)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('superior venacava'));
        if (item) return item.id;
    }
    if (/\b(?:pulmonary\s+artery)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('pulmonary artery'));
        if (item) return item.id;
    }
    if (/\b(?:left\s+pulmonary\s+vein|left\s+pulmonary\s+veins)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('left pulmonary veins'));
        if (item) return item.id;
    }
    if (/\b(?:right\s+pulmonary\s+vein|right\s+pulmonary\s+veins)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('right pulmonary veins'));
        if (item) return item.id;
    }
    if (/\b(?:aorta|aortic)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('aorta'));
        if (item) return item.id;
    }
    if (/\b(?:ventricle|ventricles|ventricular)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('ventricle'));
        if (item) return item.id;
    }
    if (/\b(?:coronary\s+artery)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('coronary artery'));
        if (item) return item.id;
    }

    const sorted = [...items].sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    for (const item of sorted) {
        if (!item.title) continue;
        const titleLower = item.title.toLowerCase();
        if (cleanText.includes(titleLower)) {
            return item.id;
        }
    }
    return null;
}

// Top Component: Typewriter Animation for User Question
function TypewriterUserQuestion({ text }: { text: string }) {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!text) {
            setDisplayText('');
            return;
        }

        let i = 0;
        setDisplayText('');
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 25);

        return () => clearInterval(timer);
    }, [text]);

    if (!text) return null;

    return (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.userQuestionBox}>
            <View style={styles.userIconBadge}>
                <MaterialIcons name="person" size={13} color="#818CF8" />
                <Text style={styles.userBadgeText}>YOU</Text>
            </View>
            <Text style={styles.userQuestionText}>
                {displayText}
                <Text style={styles.typingCursor}>|</Text>
            </Text>
        </Animated.View>
    );
}

// Bottom Component: Video Subtitle Style Overlay for AI Bot Answer
function BotSubtitleOverlay({
    text,
    isSpeaking,
    isMinimized,
    onMinimize,
    onExpand,
}: {
    text: string;
    isSpeaking: boolean;
    isMinimized: boolean;
    onMinimize: () => void;
    onExpand: () => void;
}) {
    // If no text AND bot is not speaking/responding, don't show anything
    if (!text && !isSpeaking) return null;

    if (isMinimized) {
        return (
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={styles.minimizedFabContainer}
            >
                <TouchableOpacity
                    style={styles.minimizedFab}
                    onPress={onExpand}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="smart-toy" size={22} color="#2DD4BF" />
                    {isSpeaking && <View style={styles.minimizedDot} />}
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={SlideInDown.springify().damping(16)}
            exiting={SlideOutDown.duration(200)}
            style={styles.subtitleCard}
        >
            <View style={styles.subtitleHeader}>
                <View style={styles.subtitleBadge}>
                    <MaterialIcons name="smart-toy" size={14} color="#2DD4BF" />
                    <Text style={styles.subtitleBadgeText}>AI TUTOR</Text>
                </View>
                {isSpeaking ? (
                    <View style={styles.speakingWaveContainer}>
                        <View style={[styles.waveBar, styles.wave1]} />
                        <View style={[styles.waveBar, styles.wave2]} />
                        <View style={[styles.waveBar, styles.wave3]} />
                    </View>
                ) : (
                    <TouchableOpacity onPress={onMinimize} style={styles.minimizeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.subtitleText}>
                {text || "AI Tutor is responding..."}
            </Text>
        </Animated.View>
    );
}

export default function VoiceAgentScreen({ navigation }: any) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnecting'>('idle');
    const [micEnabled, setMicEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [botSubtitle, setBotSubtitle] = useState('');
    const [isSubtitleMinimized, setIsSubtitleMinimized] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const clientRef = useRef<any>(null);

    const selectableItems = useMemo(() => {
        return [...svgData.paths, ...svgData.ellipses].filter((item: any) => item.title);
    }, []);

    const handleItemPress = (id: string) => {
        if (selectedId === id) {
            setSelectedId(null);
        } else {
            setSelectedId(id);
        }
    };

    const resetHighlight = () => {
        setSelectedId(null);
    };

    const resetState = useCallback(() => {
        clientRef.current = null;
        setSessionStatus('idle');
        setIsSpeaking(false);
        setMicEnabled(true);
        setUserQuestion('');
        setBotSubtitle('');
        setIsSubtitleMinimized(false);
    }, []);

    useEffect(() => {
        return () => {
            clientRef.current?.disconnect();
        };
    }, []);

    const processTextResponse = useCallback((text: string, isUser: boolean) => {
        if (!text) return;
        if (isUser) {
            setUserQuestion(text);
            setBotSubtitle(''); // Instantly clear previous AI tutor response when a user asks a question
        } else {
            setBotSubtitle(prev => {
                const trimmedNew = text.trim();
                const trimmedPrev = prev.trim();
                if (!trimmedPrev) return trimmedNew;

                // Replace with full cumulative paragraph if new text starts with previous text
                if (trimmedNew.toLowerCase().startsWith(trimmedPrev.toLowerCase())) {
                    return trimmedNew;
                }
                // Retain previous text if it already contains the incoming chunk
                if (trimmedPrev.toLowerCase().includes(trimmedNew.toLowerCase())) {
                    return trimmedPrev;
                }
                // Append word/phrase to build full paragraph word-by-word as bot speaks
                return `${trimmedPrev} ${trimmedNew}`;
            });
        }
        const matchedId = matchTextToPathId(text, selectableItems);
        if (matchedId) {
            setSelectedId(matchedId);
        }
    }, [selectableItems]);

    const handleStart = useCallback(async () => {
        if (clientRef.current || sessionStatus !== 'idle') return;
        setErrorMessage('');
        setSessionStatus('connecting');

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ]);
                if (
                    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
                ) {
                    setErrorMessage('Microphone permission is required.');
                    resetState();
                    return;
                }
            } catch (err) {
                console.warn('Permission request error:', err);
            }
        }

        const client = createPipecatClient({
            onBotReady: () => {
                setSessionStatus('connected');
            },
            onUserTranscript: (data: any) => {
                const text = data?.text || data?.data?.text;
                processTextResponse(text, true);
            },
            onBotLlmText: (data: any) => {
                const text = data?.text || data?.data?.text;
                processTextResponse(text, false);
            },
            onBotTtsText: (data: any) => {
                const text = data?.text || data?.data?.text;
                processTextResponse(text, false);
            },
            onBotTtsStarted: () => {
                setIsSpeaking(true);
            },
            onBotTtsStopped: () => {
                setIsSpeaking(false);
            },
            onDisconnected: resetState,
            onError: (message: any) => {
                const errText = message?.data?.error || message?.message || 'Voice agent error occurred.';
                setErrorMessage(errText);
            },
        });

        // Direct RTVI event listeners to guarantee 100% capture of bot text
        client.on('bot-tts-text', (data: any) => {
            const text = data?.text || data?.data?.text;
            processTextResponse(text, false);
        });

        client.on('bot-llm-text', (data: any) => {
            const text = data?.text || data?.data?.text;
            processTextResponse(text, false);
        });

        client.on('user-transcript', (data: any) => {
            const text = data?.text || data?.data?.text;
            processTextResponse(text, true);
        });

        client.on('user-started-speaking', () => {
            setUserQuestion('');
            setBotSubtitle('');
            setIsSubtitleMinimized(false);
        });

        client.on('bot-started-speaking', () => {
            setBotSubtitle('');
            setIsSubtitleMinimized(false);
        });

        clientRef.current = client;

        try {
            await client.initDevices();
            await client.connect({ webrtcRequestParams: { endpoint: OFFER_ENDPOINT } });
        } catch (err: any) {
            console.error('Failed to connect to voice agent:', err);
            setErrorMessage('Could not reach the voice agent backend.');
            resetState();
        }
    }, [sessionStatus, resetState, processTextResponse]);

    const handleTogglePause = useCallback(() => {
        const client = clientRef.current;
        if (!client || sessionStatus !== 'connected') return;
        const next = !micEnabled;
        client.enableMic(next);
        setMicEnabled(next);
    }, [micEnabled, sessionStatus]);

    const handleStop = useCallback(async () => {
        const client = clientRef.current;
        if (!client) return;
        setSessionStatus('disconnecting');
        try {
            await client.disconnect();
        } finally {
            resetState();
        }
    }, [resetState]);

    const handleMicButtonClick = useCallback(() => {
        if (sessionStatus === 'idle') {
            handleStart();
        } else if (sessionStatus === 'connected') {
            handleTogglePause();
        }
    }, [sessionStatus, handleStart, handleTogglePause]);

    // Zoom & Pan Animations
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                savedTranslateX.value = 0;
                translateY.value = withSpring(0);
                savedTranslateY.value = 0;
            } else {
                savedScale.value = scale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (savedScale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    const resetZoom = () => {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        savedTranslateX.value = 0;
        translateY.value = withSpring(0);
        savedTranslateY.value = 0;
    };

    const isIdle = sessionStatus === 'idle';
    const isConnected = sessionStatus === 'connected';
    const isBusy = sessionStatus === 'connecting' || sessionStatus === 'disconnecting';
    const micMuted = isConnected && !micEnabled;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'connecting': return styles.status_connecting;
            case 'connected': return styles.status_connected;
            case 'disconnecting': return styles.status_disconnecting;
            default: return styles.status_idle;
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Voice Agent</Text>
                    <Text style={styles.headerSubtitle}>AI VOICE HIGHLIGHTING</Text>
                </View>
                <View style={[styles.statusPill, getStatusStyle(sessionStatus)]}>
                    <View style={[styles.statusDot, isConnected && isSpeaking && styles.statusDotActive]} />
                    <Text style={styles.statusText}>{STATUS_LABEL[sessionStatus]}</Text>
                </View>
                {selectedId ? (
                    <TouchableOpacity style={styles.resetBtn} onPress={resetHighlight}>
                        <MaterialIcons name="refresh" size={18} color="#557D84" />
                        <Text style={styles.resetText}>RESET</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.resetBtn, { marginLeft: 6 }]} onPress={resetZoom}>
                        <MaterialIcons name="zoom-out-map" size={18} color="#557D84" />
                        <Text style={styles.resetText}>ZOOM</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Top User Question Box (Typed Animation) */}
            <TypewriterUserQuestion text={userQuestion} />

            {!userQuestion && !botSubtitle && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.promptHintBanner}>
                    <MaterialIcons name="mic" size={16} color="#2DD4BF" />
                    <Text style={styles.promptHintText}>
                        Tap mic and ask: <Text style={{ fontWeight: '800', color: '#0F766E' }}>"What is the Left Atrium?"</Text>
                    </Text>
                </Animated.View>
            )}

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            {/* SVG Interaction Area */}
            <View style={styles.svgContainer}>
                <GestureDetector gesture={composed}>
                    <Animated.View style={animatedStyle}>
                        <Svg
                            viewBox={SVG_VIEWBOX}
                            width={windowWidth * 0.95}
                            height={windowWidth * 0.95 * (371.89 / 291.276)}
                        >
                            <G transform="translate(-130, -263)">
                                {svgData.paths.map((p: any) => {
                                    const isSelected = selectedId === p.id;
                                    const isNothingSelected = selectedId === null;
                                    const fill = p.fill === 'none' ? 'transparent' : p.fill;
                                    const opacity = isNothingSelected || isSelected ? 1 : 0.3;

                                    return (
                                        <Path
                                            key={p.id}
                                            d={p.d}
                                            fill={fill}
                                            opacity={opacity}
                                            onPress={() => handleItemPress(p.id)}
                                            stroke={isSelected ? "#1a1818" : "none"}
                                            strokeWidth={isSelected ? 1.5 : 0}
                                        />
                                    );
                                })}

                                {svgData.ellipses.map((e: any) => {
                                    const isSelected = selectedId === e.id;
                                    const isNothingSelected = selectedId === null;
                                    const fill = e.fill === 'none' ? 'transparent' : e.fill;
                                    const opacity = isNothingSelected || isSelected ? 1 : 0.3;

                                    return (
                                        <Ellipse
                                            key={e.id}
                                            cx={e.cx}
                                            cy={e.cy}
                                            rx={e.rx}
                                            ry={e.ry}
                                            fill={fill}
                                            opacity={opacity}
                                            transform={e.transform}
                                            onPress={() => handleItemPress(e.id)}
                                            stroke={isSelected ? "#1a1818" : "none"}
                                            strokeWidth={isSelected ? 1.5 : 0}
                                        />
                                    );
                                })}
                            </G>
                        </Svg>
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Bottom Subtitle Overlay for AI Answer */}
            <BotSubtitleOverlay
                text={botSubtitle}
                isSpeaking={isSpeaking}
                isMinimized={isSubtitleMinimized}
                onMinimize={() => setIsSubtitleMinimized(true)}
                onExpand={() => setIsSubtitleMinimized(false)}
            />

            {/* Mic FAB & Voice Controls */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[
                        styles.micBtn,
                        isConnected && styles.micBtnConnected,
                        micMuted && styles.micBtnMuted,
                        isBusy && styles.micBtnDisabled,
                    ]}
                    onPress={handleMicButtonClick}
                    disabled={isBusy}
                    activeOpacity={0.85}
                >
                    {isBusy ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <MaterialIcons
                            name={isIdle ? 'mic' : micMuted ? 'mic-off' : 'mic'}
                            size={28}
                            color="#fff"
                        />
                    )}
                </TouchableOpacity>

                {isConnected && (
                    <TouchableOpacity style={styles.endBtn} onPress={handleStop}>
                        <Text style={styles.endBtnText}>End Session</Text>
                    </TouchableOpacity>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '700',
        marginTop: 1,
        letterSpacing: 1,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        gap: 4,
    },
    status_idle: {
        backgroundColor: '#F1F5F9',
    },
    status_connecting: {
        backgroundColor: '#FEF3C7',
    },
    status_connected: {
        backgroundColor: '#DCFCE7',
    },
    status_disconnecting: {
        backgroundColor: '#FEE2E2',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94A3B8',
    },
    statusDotActive: {
        backgroundColor: '#22C55E',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#334155',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5EEF0',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 2,
    },
    resetText: {
        color: '#557D84',
        fontSize: 9,
        fontWeight: '800',
    },

    /* Top User Question Box Styles */
    userQuestionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        gap: 8,
    },
    userIconBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    userBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4338CA',
        letterSpacing: 0.5,
    },
    userQuestionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#1E1B4B',
    },
    typingCursor: {
        color: '#6366F1',
        fontWeight: '900',
    },

    promptHintBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#CCFBF1',
        gap: 8,
    },
    promptHintText: {
        color: '#0F766E',
        fontSize: 12,
        fontWeight: '600',
    },

    /* Bottom Subtitle Overlay Styles */
    subtitleCard: {
        position: 'absolute',
        bottom: 96,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.8)',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 10,
        gap: 8,
    },
    subtitleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subtitleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(45, 212, 191, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderColor: '#0D9488',
        borderWidth: 0.5,
    },
    subtitleBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2DD4BF',
        letterSpacing: 0.8,
    },
    speakingWaveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    waveBar: {
        width: 3,
        height: 12,
        backgroundColor: '#2DD4BF',
        borderRadius: 2,
    },
    wave1: { height: 10 },
    wave2: { height: 16 },
    wave3: { height: 12 },

    subtitleText: {
        color: '#F8FAFC',
        fontSize: 13.5,
        fontWeight: '600',
        lineHeight: 20,
    },

    errorBanner: {
        backgroundColor: '#FEF2F2',
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        padding: 8,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        textAlign: 'center',
    },
    svgContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        paddingBottom: 120,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        alignItems: 'center',
        gap: 8,
    },
    micBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#557D84',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#557D84',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    micBtnConnected: {
        backgroundColor: '#2DD4BF',
        shadowColor: '#2DD4BF',
    },
    micBtnMuted: {
        backgroundColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },
    micBtnDisabled: {
        opacity: 0.6,
    },
    endBtn: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    endBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    minimizedFabContainer: {
        position: 'absolute',
        bottom: 96,
        left: 20,
        zIndex: 10,
    },
    minimizedFab: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#2DD4BF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    minimizedDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2DD4BF',
    },
    minimizeBtn: {
        padding: 2,
    },
});
