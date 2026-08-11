import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const svgData = require('../../assets/data/image_library.json');

const { width: windowWidth } = Dimensions.get('window');
const SVG_VIEWBOX = svgData.viewBox;

export default function ImageLibraryScreen({ navigation }: any) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Get all items that have a title for the chips
    const selectableItems = useMemo(() => {
        return [...svgData.paths, ...svgData.ellipses].filter(item => item.title);
    }, []);

    const selectedItem = useMemo(() => {
        if (!selectedId) return null;
        return [...svgData.paths, ...svgData.ellipses].find(item => item.id === selectedId);
    }, [selectedId]);

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

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Heart Anatomy</Text>
                    <Text style={styles.headerSubtitle}>Interactive 2D Model</Text>
                </View>
                <TouchableOpacity style={styles.voiceBtn} onPress={() => navigation.navigate('VoiceAgentOpenAI')}>
                    <MaterialIcons name="mic" size={16} color="#2DD4BF" />
                    <Text style={styles.voiceText}>VOICE AGENT</Text>
                </TouchableOpacity>
                {selectedId && (
                    <TouchableOpacity style={styles.resetBtn} onPress={resetHighlight}>
                        <MaterialIcons name="refresh" size={20} color="#557D84" />
                        <Text style={styles.resetText}>RESET</Text>
                    </TouchableOpacity>
                )}
                {!selectedId && (
                    <TouchableOpacity style={[styles.resetBtn, {marginLeft: 6}]} onPress={resetZoom}>
                        <MaterialIcons name="zoom-out-map" size={20} color="#557D84" />
                        <Text style={styles.resetText}>ZOOM</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Chips Container */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContent}
                    style={styles.chipsScroll}
                >
                    {selectableItems.map(item => {
                        const isSelected = selectedId === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => handleItemPress(item.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Hint text if nothing is selected */}
            {!selectedId && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.infoLabel}>
                    <MaterialIcons name="touch-app" size={18} color="#94A3B8" />
                    <Text style={styles.infoText}>Tap a label or part to highlight it</Text>
                </Animated.View>
            )}

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

            {/* Details Card */}
            {selectedItem && (
                <Animated.View
                    entering={SlideInDown.duration(300)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.detailsCardContainer}
                >
                    <View style={styles.detailsCard}>
                        <View style={styles.detailsIconContainer}>
                            <MaterialIcons name="science" size={24} color="#2DD4BF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailsTitle}>{selectedItem.title || selectedItem.name || selectedItem.id}</Text>
                            <Text style={styles.detailsDesc}>
                                {selectedItem.description || 'No detailed anatomical description available for this part.'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={resetHighlight} style={styles.closeDetailsBtn}>
                            <MaterialIcons name="close" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
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
        paddingBottom: 20,
        paddingHorizontal: 20,
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
    headerTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    headerTitle: {
        color: '#233E4E',
        fontSize: 20,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5EEF0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    resetText: {
        color: '#557D84',
        fontSize: 10,
        fontWeight: '800',
    },
    chipsScroll: {
        backgroundColor: '#fff',
        flexGrow: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    chipsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipSelected: {
        backgroundColor: '#2DD4BF',
        borderColor: '#14B8A6',
    },
    chipText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
    },
    chipTextSelected: {
        color: '#fff',
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#FAFAFB',
    },
    infoText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    svgContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        paddingBottom: 60,
    },
    detailsCardContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        shadowColor: 'rgba(35, 62, 78, 0.12)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f8fafc',
    },
    detailsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsTitle: {
        color: '#233E4E',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 6,
    },
    detailsDesc: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
    },
    closeDetailsBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    voiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCFBF1',
        marginRight: 6,
        gap: 4,
    },
    voiceText: {
        color: '#0F766E',
        fontSize: 9,
        fontWeight: '800',
    },
});
