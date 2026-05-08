import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import api from '../../services/api';

const S3_BASE_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com/models/';

const LibraryListScreen = ({ navigation }: any) => {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await api.get('/student/library');
            if (response.data.status) {
                setModels(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching 3D models:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderModelCard = ({ item, index }: { item: any, index: number }) => (
        <Animated.View 
            entering={FadeInUp.duration(600).delay(index * 100)}
            style={styles.cardContainer}
        >
            <View style={styles.imagePlaceholder}>
                {item.image_url ? (
                    <Image 
                        source={{ uri: S3_BASE_URL + item.image_url }} 
                        style={styles.cardImage} 
                        resizeMode="cover"
                    />
                ) : (
                    <>
                        <MaterialIcons name="local-hospital" size={48} color="rgba(85, 125, 132, 0.2)" />
                        <MaterialIcons name="3d-rotation" size={24} color="#557D84" style={styles.placeholderIcon} />
                    </>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.modelTitle} numberOfLines={1}>{item.model_name}</Text>
                <Text style={styles.modelCategory}>{item.category || '3D Model'}</Text>
                
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    style={styles.viewBtnContainer}
                    onPress={() => navigation.navigate('ModelView', { modelData: item })}
                >
                    <LinearGradient
                        colors={['#557D84', '#2DD4BF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.viewBtn}
                    >
                        <Text style={styles.viewBtnText}>VIEW IN 3D</Text>
                        <MaterialIcons name="3d-rotation" size={14} color="rgba(255,255,255,0.9)" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#233E4E" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Medica 3D</Text>
                    <Text style={styles.headerSubtitle}>INTERACTIVE ANATOMY & TOOLS</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#557D84" />
                </View>
            ) : (
                <FlatList
                    data={models}
                    keyExtractor={(item) => item.library_id}
                    renderItem={renderModelCard}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="view-in-ar" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No 3D models available.</Text>
                        </View>
                    }
                />
            )}
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
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 16,
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardContainer: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    placeholderIcon: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        padding: 16,
    },
    modelTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#233E4E',
        marginBottom: 4,
    },
    modelCategory: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    viewBtnContainer: {
        shadowColor: 'rgba(85, 125, 132, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    viewBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LibraryListScreen;
