import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { User, Mail, Smartphone, Calendar, ChevronLeft } from 'lucide-react-native';

const PersonalInfoScreen = ({ navigation, route }: any) => {
    const { userData } = route.params;

    const InfoItem = ({ icon: Icon, label, value }: any) => (
        <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
                <Icon color="#0F766E" size={20} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '-'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ChevronLeft color="#233E4E" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <InfoItem icon={User} label="Full Name" value={`${userData?.first_name} ${userData?.last_name || ''}`} />
                    <View style={styles.separator} />
                    <InfoItem icon={Mail} label="Email Address" value={userData?.email} />
                    <View style={styles.separator} />
                    <InfoItem icon={Smartphone} label="Mobile Number" value={userData?.mobile_no} />
                    <View style={styles.separator} />
                    <InfoItem icon={Calendar} label="Date of Birth" value={userData?.dob} />
                </View>

                <View style={styles.noteBox}>
                    <MaterialIcons name="info-outline" size={16} color="#64748B" />
                    <Text style={styles.noteText}>To update your information, please contact the administration office.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#233E4E',
    },
    scrollContent: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: 'rgba(35, 62, 78, 0.05)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 2,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        backgroundColor: '#F0FDFA',
        padding: 12,
        borderRadius: 16,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '700',
        color: '#233E4E',
    },
    separator: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },
    noteBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(100, 116, 139, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        alignItems: 'center',
        gap: 12,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    }
});

export default PersonalInfoScreen;
