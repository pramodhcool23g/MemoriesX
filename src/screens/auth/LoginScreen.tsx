import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/student/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            setLoading(false);
            if (data.status) {
                setStep(2);
                Alert.alert('Success', data.msg || 'OTP sent successfully.');
            } else {
                Alert.alert('Error', data.msg || 'Failed to send OTP.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Network error. Please try again.');
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/student/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            setLoading(false);
            if (data.status) {
                await AsyncStorage.setItem('token', data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
                navigation.replace('Main');
            } else {
                Alert.alert('Invalid OTP', data.msg || 'The OTP you entered is incorrect.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Network error. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerSection}>
                        <View style={styles.logoBadge}>
                            <Image
                                source={require('../../assets/images/icon.png')}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={styles.brandName}>MEDICA</Text>
                        <Text style={styles.tagline}>ADVANCED MEDICAL LEARNING</Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="email" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="doctor@email.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={step === 1}
                                />
                            </View>
                        </View>

                        {step === 2 && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>ENTER OTP</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123456"
                                        placeholderTextColor="#94A3B8"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                            </View>
                        )}

                        {step === 1 && (
                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Login as Admin?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.loginBtnContainer}
                            onPress={step === 1 ? handleSendOTP : handleVerifyOTP}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#557D84', '#2DD4BF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.loginBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>{step === 1 ? 'SEND OTP' : 'VERIFY & SIGN IN'}</Text>
                                        <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />

                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity>
                            <Text style={styles.signUpText}>Join now</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoBadge: {
        width: 72,
        height: 72,
        borderRadius: 20,
        // backgroundColor: '#557D84',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        // shadowColor: 'rgba(85, 125, 132, 0.4)',
        // shadowOffset: { width: 0, height: 10 },
        // shadowOpacity: 1,
        // shadowRadius: 20,
        // elevation: 10,
    },
    logoImage: {
        width: 72,
        height: 72,
        resizeMode: 'contain',
    },
    brandName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#233E4E',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(85, 125, 132, 0.6)',
        letterSpacing: 2,
        marginTop: 4,
    },
    formSection: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#557D84',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#233E4E',
        fontSize: 14,
        fontWeight: '600',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: '#557D84',
        fontSize: 12,
        fontWeight: '700',
    },
    loginBtnContainer: {
        marginTop: 12,
        shadowColor: 'rgba(85, 125, 132, 0.3)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 6,
    },
    loginBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        paddingTop: 40,
    },
    footerText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
    },
    signUpText: {
        color: '#557D84',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default LoginScreen;
