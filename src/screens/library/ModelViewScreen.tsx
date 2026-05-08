import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FilamentScene, FilamentView, Model, Camera, DefaultLight, useCameraManipulator, useModel, ModelRenderer } from 'react-native-filament';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, FadeIn, FadeOut } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { height: viewHeight } = Dimensions.get('window');
const scale = 0.4;
const S3_BASE_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com/models/';

const FilamentContent = ({ modelSource, onModelLoaded }: { modelSource: any, onModelLoaded: () => void }) => {
    const model = useModel(modelSource);

    React.useEffect(() => {
        if (model.state === 'loaded') {
            onModelLoaded();
        }
    }, [model.state, onModelLoaded]);

    // Initialize the manipulator with ORBIT mode for touch interaction
    const cameraManipulator = useCameraManipulator({
        orbitHomePosition: [0, 0, 4], // Slightly elevated to see the robot better
        targetPosition: [0, -1, 0],
        orbitSpeed: [0.005, 0.005],
    });

    // Define the pan gesture for rotation
    const panGesture = Gesture.Pan()
        .onBegin((event) => {
            cameraManipulator?.grabBegin(event.x, viewHeight - event.y, false);
        })
        .onUpdate((event) => {
            cameraManipulator?.grabUpdate(event.x, viewHeight - event.y);
        })
        .onEnd(() => {
            cameraManipulator?.grabEnd();
        });

    return (
        <GestureDetector gesture={panGesture}>
            <FilamentView style={{ flex: 1 }}>
                <Camera cameraManipulator={cameraManipulator} />
                <DefaultLight />
                {model.state === 'loaded' && (
                    <ModelRenderer model={model} scale={[scale, scale, scale]} />
                )}
            </FilamentView>
        </GestureDetector>
    );
};

const ScanningLoader = () => {
    const translateY = useSharedValue(-200);

    React.useEffect(() => {
        translateY.value = withRepeat(
            withTiming(400, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View exiting={FadeOut} style={StyleSheet.absoluteFill}>
            <View style={styles.loaderContainer}>
                <Animated.View style={[styles.scanLineContainer, animatedStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(45, 212, 191, 0.3)', 'rgba(45, 212, 191, 0.1)', 'transparent']}
                        style={styles.scanLine}
                    />
                </Animated.View>
                <View style={styles.loaderOverlay}>
                    <View style={styles.loaderCenter}>
                        <MaterialIcons name="biotech" size={48} color="#557D84" style={{ marginBottom: 12 }} />
                        <Text style={styles.loaderText}>GENERATING 3D MODEL</Text>
                        <Text style={styles.loaderSubtext}>Analyzing anatomical structures...</Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

export default function ModelViewScreen({ route, navigation }: any) {
    const { modelData } = route.params;
    const [isLoading, setIsLoading] = React.useState(true);

    const modelSource = modelData.file_url
        ? { uri: S3_BASE_URL + modelData.file_url }
        : require('../../assets/models/robot.glb');

    return (
        <FilamentScene>
            <GestureHandlerRootView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{modelData.model_name}</Text>
                        <Text style={styles.headerSubtitle}>{modelData.category || 'Interactive Model'}</Text>
                    </View>
                </View>

                {/* Filament 3D View with Gestures */}
                <View style={styles.canvasContainer}>
                    <FilamentContent 
                        modelSource={modelSource} 
                        onModelLoaded={() => setIsLoading(false)} 
                    />
                    {isLoading && <ScanningLoader />}
                </View>

                {/* Info Section */}
                <ScrollView style={styles.infoSection} showsVerticalScrollIndicator={false}>
                    <View style={styles.titleRow}>
                        <Text style={styles.modelTitle}>{modelData.model_name}</Text>
                        <View style={styles.visibilityBadge}>
                            <Text style={styles.visibilityText}>{modelData.visibility}</Text>
                        </View>
                    </View>

                    {/* Tags / Points */}
                    {modelData.tags && modelData.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {modelData.tags.map((tag: string, index: number) => (
                                <View key={index} style={styles.tagBadge}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.sectionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{modelData.description}</Text>
                </ScrollView>
            </GestureHandlerRootView>
        </FilamentScene>
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
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        zIndex: 10,
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
    },
    canvasContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f6f6f6', // Best for 3D viewing, provides contrast
        position: 'relative',
    },

    canvasOverlayControls: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    canvasOverlayText: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    infoSection: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -20,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modelTitle: {
        color: '#233E4E',
        fontSize: 24,
        fontWeight: '900',
        flex: 1,
    },
    visibilityBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        marginLeft: 12,
    },
    visibilityText: {
        color: '#16a34a',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    tagBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tagText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '700',
    },
    sectionHeading: {
        color: '#233E4E',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    descriptionText: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 24,
        marginBottom: 32,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F8FAFC',
        zIndex: 20,
        overflow: 'hidden',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderCenter: {
        alignItems: 'center',
    },
    loaderText: {
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    loaderSubtext: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
        textTransform: 'uppercase',
    },
    scanLineContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 21,
    },
    scanLine: {
        flex: 1,
        height: 100,
    },
});
