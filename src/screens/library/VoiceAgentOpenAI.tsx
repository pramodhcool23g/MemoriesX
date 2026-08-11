import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform, PermissionsAndroid, Image } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { RealtimeService } from '../../services/realtime';

const svgData = require('../../assets/data/image_library.json');
const { width: windowWidth } = Dimensions.get('window');
const SVG_VIEWBOX = svgData.viewBox;

const STATUS_LABEL: Record<string, string> = {
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: 'Live Voice',
    disconnecting: 'Ending session…',
};

function detectMediaFromText(text: string): { type: 'video' | 'image' | 'svg'; source?: any; title?: string } {
    if (!text) return { type: 'svg' };
    const clean = text.toLowerCase();

    // 1. Video detection: "blood circulation"
    if (/\b(?:blood\s+circulation|circulation\s+of\s+blood|circulating\s+blood|blood\s+flow|blood\s+move\s)\b/i.test(clean)) {
        return {
            type: 'video',
            source: require('../../assets/organs/blood_circulation.mp4'),
            title: 'Blood Circulation Video',
        };
    }

    // 2. Image detection for Left Atrium
    if (
        /\b(?:details?|detail|detailed\s+view|detail\s+view|deep\s+view|more\s+about|close\s*up|structure|inside|view\s+of|explanation\s+of)\s+(?:the\s+)?left\s+atrium\b/i.test(clean) ||
        (/\bleft\s+atrium\b/i.test(clean) && /\b(?:details?|detail|detailed|deep\s+view|structure|cross\s*section|microscopic|close\s*up|diagram|image|picture)\b/i.test(clean))
    ) {
        return {
            type: 'image',
            source: require('../../assets/organs/left_atrium.jpeg'),
            title: 'Left Atrium - Detailed View',
        };
    }

    // 3. Image detection for Left Ventricle
    if (
        /\b(?:details?|detail|detailed\s+view|detail\s+view|deep\s+view|more\s+about|close\s*up|structure|inside|view\s+of|explanation\s+of)\s+(?:the\s+)?left\s+ventricle\b/i.test(clean) ||
        (/\bleft\s+ventricle\b/i.test(clean) && /\b(?:details?|detail|detailed|deep\s+view|structure|cross\s*section|microscopic|close\s*up|diagram|image|picture)\b/i.test(clean))
    ) {
        return {
            type: 'image',
            source: require('../../assets/organs/left_ventricle.jpeg'),
            title: 'Left Ventricle - Detailed View',
        };
    }

    // 4. Image detection for Right Ventricle
    if (
        /\b(?:details?|detail|detailed\s+view|detail\s+view|deep\s+view|more\s+about|close\s*up|structure|inside|view\s+of|explanation\s+of)\s+(?:the\s+)?right\s+ventricle\b/i.test(clean) ||
        (/\bright\s+ventricle\b/i.test(clean) && /\b(?:details?|detail|detailed|deep\s+view|structure|cross\s*section|microscopic|close\s*up|diagram|image|picture)\b/i.test(clean))
    ) {
        return {
            type: 'image',
            source: require('../../assets/organs/right_ventricle.jpeg'),
            title: 'Right Ventricle - Detailed View',
        };
    }

    return { type: 'svg' };
}

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
    if (/\b(?:left\s+ventricle|left\s+ventricular)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('left ventricle'));
        if (item) return item.id;
    }
    if (/\b(?:right\s+ventricle|right\s+ventricular)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('right ventricle'));
        if (item) return item.id;
    }
    if (/\b(?:inferior\s+vena\s+cava|inferior\s+venacava)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('inferior venacava') || i.title?.toLowerCase().includes('inferior vena cava'));
        if (item) return item.id;
    }
    if (/\b(?:superior\s+vena\s+cava|superior\s+venacava)\b/i.test(cleanText)) {
        const item = items.find(i => i.title?.toLowerCase().includes('superior venacava') || i.title?.toLowerCase().includes('superior vena cava'));
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

// ─── Organ focal points in SVG viewBox coordinates (0 0 291.276 371.89) ─────
// Raw path coords have translate(-130,-263) applied: viewBox_x = raw_x - 130, viewBox_y = raw_y - 263.
// Initial state is 0 extra zoom (scale = 1.0). When matched to an organ, zoom is set to 1.5x - 1.6x.
const ORGAN_FOCUS_POINTS: Record<string, { cx: number; cy: number; zoom: number }> = {
    Path_9: { cx: 67, cy: 171, zoom: 1.6 },   // Right Atrium
    Path_20: { cx: 142, cy: 252, zoom: 1.5 },   // Ventricles
    Path_6: { cx: 186, cy: 125, zoom: 1.6 },   // Auricle of Left Atrium / Left Atrium
    Path_26: { cx: 252, cy: 247, zoom: 1.6 },   // Left Coronary Artery
    Path_29: { cx: 60, cy: 302, zoom: 1.6 },   // Inferior Venacava
    Path_38: { cx: 249, cy: 123, zoom: 1.6 },   // Left Pulmonary Veins
    Path_40: { cx: 22, cy: 207, zoom: 1.6 },   // Right Pulmonary Veins
    Path_45: { cx: 146, cy: 102, zoom: 1.5 },   // Pulmonary Artery
    Path_51: { cx: 85, cy: 86, zoom: 1.5 },   // Superior Venacava
    Path_53: { cx: 145, cy: 52, zoom: 1.5 },   // Aorta
};


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
                    <Text style={styles.subtitleBadgeText}>Prof. G</Text>
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
                {text || 'AI Tutor is responding...'}
            </Text>
        </Animated.View>
    );
}

export default function VoiceAgentOpenAIScreen({ navigation }: any) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnecting'>('idle');
    const [micEnabled, setMicEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [botSubtitle, setBotSubtitle] = useState('');
    const [isSubtitleMinimized, setIsSubtitleMinimized] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [mediaState, setMediaState] = useState<{
        mode: 'svg' | 'image' | 'video';
        source: any | null;
        title: string | null;
        isInitialHeart?: boolean;
    }>({
        mode: 'video',
        source: require('../../assets/organs/heart.mp4'),
        title: 'Heart',
        isInitialHeart: true,
    });

    const realtimeRef = useRef<RealtimeService | null>(null);
    const wordQueueRef = useRef<string[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const zoomToOrganRef = useRef<((id: string) => void) | null>(null);
    const lastZoomedOrganIdRef = useRef<string | null>(null);

    const selectableItems = useMemo(() => {
        return [...svgData.paths, ...svgData.ellipses].filter((item: any) => item.title);
    }, []);

    // Zoom & Pan Animations
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const handleItemPress = (id: string) => {
        setSelectedId(prev => prev === id ? null : id);
    };

    const resetCenterAndClearHighlights = useCallback(() => {
        setSelectedId(null);
        lastZoomedOrganIdRef.current = null;
        setMediaState({ mode: 'svg', source: null, title: null });
        scale.value = withSpring(1, { damping: 20, stiffness: 100 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

    const resetHighlight = () => {
        resetCenterAndClearHighlights();
    };

    const resetState = useCallback(() => {
        realtimeRef.current = null;
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        wordQueueRef.current = [];
        setSessionStatus('idle');
        setIsSpeaking(false);
        setMicEnabled(true);
        setUserQuestion('');
        setBotSubtitle('');
        setIsSubtitleMinimized(false);
        resetCenterAndClearHighlights();
    }, [resetCenterAndClearHighlights]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            realtimeRef.current?.disconnect();
        };
    }, []);

    // Speech-synced progressive text ticker effect (matches voice output cadence)
    useEffect(() => {
        const TICK_INTERVAL_MS = 180; // 180ms per token matches natural Indian English voice speed (~160 wpm)

        if (sessionStatus === 'connected') {
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    if (wordQueueRef.current.length > 0) {
                        const token = wordQueueRef.current.shift();
                        if (token !== undefined) {
                            setBotSubtitle(prev => {
                                const nextText = prev + token;
                                // Check if this new token / accumulated text matches an organ path
                                const matchedId = matchTextToPathId(nextText, selectableItems);
                                if (matchedId) {
                                    setSelectedId(matchedId);
                                    // Auto-zoom to the organ in real-time as the AI speaks its name
                                    zoomToOrganRef.current?.(matchedId);
                                }
                                // Detect if detailed image or video media mode should trigger
                                const detectedMedia = detectMediaFromText(nextText);
                                if (detectedMedia.type !== 'svg') {
                                    setMediaState({
                                        mode: detectedMedia.type,
                                        source: detectedMedia.source,
                                        title: detectedMedia.title || null,
                                    });
                                }
                                return nextText;
                            });
                        }
                    }
                }, TICK_INTERVAL_MS);
            }
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [sessionStatus, selectableItems]);

    // Enqueue incoming OpenAI text deltas into wordQueueRef
    const enqueueWords = useCallback((textChunk: string) => {
        if (!textChunk) return;
        const tokens = textChunk.match(/\S+|\s+/g) || [textChunk];
        wordQueueRef.current.push(...tokens);
    }, []);

    const processTranscript = useCallback((text: string, isUser: boolean) => {
        if (isUser) {
            // New user question turn — zoom out heart to center, remove all highlights, clear previous reply
            wordQueueRef.current = [];
            setBotSubtitle('');
            setIsSubtitleMinimized(false);
            resetCenterAndClearHighlights();

            if (!text) {
                setUserQuestion('');
                return;
            }
            setUserQuestion(text);
        } else {
            // Bot response delta — push into speech-synced queue
            enqueueWords(text);
        }
    }, [enqueueWords, resetCenterAndClearHighlights]);

    const handleStart = useCallback(async () => {
        if (realtimeRef.current || sessionStatus !== 'idle') return;
        setErrorMessage('');
        setSessionStatus('connecting');

        try {
            const service = new RealtimeService({
                onConnected: () => {
                    setSessionStatus('connected');
                },
                onTranscript: (text, isUser) => {
                    processTranscript(text, isUser);
                },
                onSpeakingChange: (speaking) => {
                    setIsSpeaking(speaking);
                    if (speaking) {
                        // Bot started speaking new response — reset subtitle and zoom out heart to center with no highlights
                        wordQueueRef.current = [];
                        setBotSubtitle('');
                        setIsSubtitleMinimized(false);
                        resetCenterAndClearHighlights();
                    }
                },
                onDisconnected: resetState,
                onError: (errMsg) => {
                    setErrorMessage(errMsg);
                },
            });

            realtimeRef.current = service;
            await service.connect();
        } catch (err: any) {
            console.error('[VoiceAgentOpenAI] Connect failed:', err);
            setErrorMessage(err?.message || 'Could not connect to OpenAI Realtime.');
            resetState();
        }
    }, [sessionStatus, resetState, processTranscript]);

    const handleToggleMic = useCallback(() => {
        const service = realtimeRef.current;
        if (!service || sessionStatus !== 'connected') return;
        const next = !micEnabled;
        service.setMicEnabled(next);
        setMicEnabled(next);
    }, [micEnabled, sessionStatus]);

    const handleStop = useCallback(async () => {
        const service = realtimeRef.current;
        if (!service) return;
        setSessionStatus('disconnecting');
        try {
            await service.disconnect();
        } finally {
            resetState();
        }
    }, [resetState]);

    const handleMicButtonClick = useCallback(() => {
        if (sessionStatus === 'idle') {
            handleStart();
        } else if (sessionStatus === 'connected') {
            handleToggleMic();
        }
    }, [sessionStatus, handleStart, handleToggleMic]);



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
            { scale: scale.value },
        ],
    }));

    const resetZoom = () => {
        lastZoomedOrganIdRef.current = null;
        scale.value = withSpring(1, { damping: 20, stiffness: 100 });
        savedScale.value = 1;
        translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
        savedTranslateX.value = 0;
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
        savedTranslateY.value = 0;
    };

    // Auto-zoom toward a specific organ when its name is mentioned in bot speech
    const zoomToOrgan = useCallback((organId: string) => {
        if (!organId) return;

        // Prevent redundant glitching animation if already zoomed to this organ
        if (lastZoomedOrganIdRef.current === organId) {
            return;
        }
        lastZoomedOrganIdRef.current = organId;

        const focal = ORGAN_FOCUS_POINTS[organId] || { cx: 145, cy: 185, zoom: 2.3 };

        // SVG rendered dimensions
        const svgW = windowWidth * 0.95;
        const svgH = svgW * (371.89 / 291.276);

        // Focal point in rendered pixels (SVG viewBox 0..291.276 x 0..371.89 → pixels)
        const focalPxX = (focal.cx / 291.276) * svgW;
        const focalPxY = (focal.cy / 371.89) * svgH;

        // Center of the display container
        const containerCX = svgW / 2;
        const containerCY = svgH / 2;

        const targetScale = Math.min(focal.zoom, 1.6);

        // Calculate translation needed so the focal point lands at exact container center
        const tx = targetScale * (containerCX - focalPxX);
        const ty = targetScale * (containerCY - focalPxY);

        // Smooth, stable spring animation directly to target focal point
        scale.value = withSpring(targetScale, { damping: 20, stiffness: 90 });
        translateX.value = withSpring(tx, { damping: 20, stiffness: 90 });
        translateY.value = withSpring(ty, { damping: 20, stiffness: 90 });

        savedScale.value = targetScale;
        savedTranslateX.value = tx;
        savedTranslateY.value = ty;
    }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

    // Keep zoomToOrganRef synced to the latest zoomToOrgan function
    useEffect(() => {
        zoomToOrganRef.current = zoomToOrgan;
    }, [zoomToOrgan]);

    // When a new user question begins, zoom out back to full-view centered heart position
    useEffect(() => {
        if (userQuestion) {
            lastZoomedOrganIdRef.current = null;
            scale.value = withSpring(1, { damping: 20, stiffness: 100 });
            translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
            savedScale.value = 1;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        }
    }, [userQuestion]);

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
            {/* Full-Screen Background Video */}
            {mediaState.mode === 'video' && mediaState.source && (
                <Animated.View entering={FadeIn.duration(300)} style={StyleSheet.absoluteFillObject}>
                    <Video
                        source={mediaState.source}
                        style={styles.fullScreenVideo}
                        resizeMode="cover"
                        repeat={!mediaState.isInitialHeart}
                        paused={false}
                        muted={false}
                        controls={false}
                        onEnd={() => {
                            if (mediaState.isInitialHeart) {
                                setMediaState({ mode: 'svg', source: null, title: null });
                            }
                        }}
                    />
                </Animated.View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Prof. G</Text>
                    <Text style={styles.headerSubtitle}>NEET BIOLOGY TUTOR</Text>
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

            {/* Top: Typewriter User Question */}
            <TypewriterUserQuestion text={userQuestion} />

            {!userQuestion && !botSubtitle && !isSpeaking && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.promptHintBanner}>
                    <MaterialIcons name="mic" size={16} color="#2DD4BF" />
                    <Text style={styles.promptHintText}>
                        Tap mic and ask: <Text style={{ fontWeight: '800', color: '#0F766E' }}>"What is the Left Atrium?"</Text>
                    </Text>
                </Animated.View>
            )}

            {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

            {/* SVG / Image / Video Interaction Area */}
            <View style={styles.svgContainer}>
                {/* {mediaState.mode !== 'svg' && (
                    <Animated.View entering={FadeInDown.duration(200)} style={styles.mediaTypeBadge}>
                        <MaterialIcons
                            name={mediaState.mode === 'video' ? 'videocam' : 'photo-library'}
                            size={16}
                            color="#2DD4BF"
                        />
                        <Text style={styles.mediaTypeBadgeText}>{mediaState.title?.toUpperCase()}</Text>
                        <TouchableOpacity
                            style={styles.switchSvgBtn}
                            onPress={() => setMediaState({ mode: 'svg', source: null, title: null })}
                        >
                            <MaterialIcons name="grid-view" size={14} color="#94A3B8" />
                            <Text style={styles.switchSvgText}>3D/SVG</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )} */}

                {mediaState.mode === 'svg' && (
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
                                                stroke={isSelected ? '#1a1818' : 'none'}
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
                                                stroke={isSelected ? '#1a1818' : 'none'}
                                                strokeWidth={isSelected ? 1.5 : 0}
                                            />
                                        );
                                    })}
                                </G>
                            </Svg>
                        </Animated.View>
                    </GestureDetector>
                )}

                {mediaState.mode === 'image' && mediaState.source && (
                    <GestureDetector gesture={composed}>
                        <Animated.View style={[animatedStyle, styles.imageWrapper]}>
                            <Image
                                source={mediaState.source}
                                style={styles.zoomableImage}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </GestureDetector>
                )}
            </View>

            {/* Bottom: AI Tutor Subtitle Overlay */}
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
    status_idle: { backgroundColor: '#F1F5F9' },
    status_connecting: { backgroundColor: '#FEF3C7' },
    status_connected: { backgroundColor: '#DCFCE7' },
    status_disconnecting: { backgroundColor: '#FEE2E2' },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94A3B8',
    },
    statusDotActive: { backgroundColor: '#22C55E' },
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
    minimizeBtn: { padding: 2 },
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
    micBtnDisabled: { opacity: 0.6 },
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
    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: windowWidth * 0.95,
        height: windowWidth * 0.75,
    },
    zoomableImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    fullScreenVideo: {
        width: '100%',
        height: '100%',
    },
    videoWrapper: {
        width: windowWidth * 0.95,
        height: windowWidth * 1.05,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    mediaVideo: {
        width: '100%',
        height: '100%',
    },
    mediaTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(45, 212, 191, 0.4)',
    },
    mediaTypeBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2DD4BF',
        letterSpacing: 0.8,
    },
    switchSvgBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(51, 65, 85, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 6,
        gap: 4,
    },
    switchSvgText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
    },
});
