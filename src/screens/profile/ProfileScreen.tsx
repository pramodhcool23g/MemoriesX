import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LogOut, BookOpen, Award, Settings, ChevronRight, User, Bell, Mail, Smartphone, Calendar, X } from 'lucide-react-native';
import { authService } from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const API_URL = 'https://lmsv1-36gytxtdoq-el.a.run.app/api';
const AWS_BUCKET_URL = 'https://medica-lms.s3.ap-south-1.amazonaws.com';

const ProfileScreen = ({ navigation }: any) => {
    const isFocused = useIsFocused();
    const [userData, setUserData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/student/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.status && result.data) {
                setUserData(result.data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (isFocused) {
            fetchProfile();
        }
    }, [isFocused]);

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Login');
    };

    const getInitials = (firstName: string, lastName: string) => {
        return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
    };

    return (
        <ScrollView 
            className="flex-1 bg-medical-bg"
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="bg-white px-6 pt-20 pb-10 items-center border-b border-slate-100">
                <View className="relative">
                    {userData?.profile_image ? (
                        <Image
                            source={{ uri: `${AWS_BUCKET_URL}/profile/${userData.profile_image}` }}
                            className="w-32 h-32 rounded-full border-4 border-teal-50"
                        />
                    ) : (
                        <View className="w-32 h-32 rounded-full bg-medical-teal items-center justify-center border-4 border-teal-50">
                            <Text className="text-4xl font-bold text-white">
                                {getInitials(userData?.first_name, userData?.last_name)}
                            </Text>
                        </View>
                    )}
                    <View className="absolute bottom-0 right-0 bg-medical-teal p-2 rounded-full border-4 border-white">
                        <Settings color="white" size={16} />
                    </View>
                </View>
                <Text className="text-2xl font-bold text-slate-900 mt-4">{userData ? `${userData.first_name} ${userData.last_name || ''}` : 'Loading...'}</Text>
                <Text className="text-slate-500">Student • {userData?.email}</Text>
            </View>

            <View className="p-6">
                <View className="flex-row items-center mb-8">
                    <View className="flex-1 bg-white p-4 rounded-3xl items-center border border-slate-100 shadow-sm mr-4">
                        <BookOpen color="#0F766E" size={24} />
                        <Text className="text-2xl font-bold text-slate-900 mt-2">{userData?.courses?.length || 0}</Text>
                        <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Courses Done</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-3xl items-center border border-slate-100 shadow-sm">
                        <Award color="#0F766E" size={24} />
                        <Text className="text-2xl font-bold text-slate-900 mt-2">-</Text>
                        <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Certificates</Text>
                    </View>
                </View>

                <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
                    <TouchableOpacity 
                        className="flex-row items-center p-5 border-b border-slate-50"
                        onPress={() => navigation.navigate('PersonalInfo', { userData })}
                    >
                        <View className="bg-slate-50 p-2 rounded-xl mr-4">
                            <User color="#64748B" size={20} />
                        </View>
                        <Text className="flex-1 text-slate-700 font-semibold">Personal Information</Text>
                        <ChevronRight color="#CBD5E1" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-row items-center p-5 border-b border-slate-50"
                        onPress={() => navigation.navigate('ChatList')}
                    >
                        <View style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)' }} className="p-2 rounded-xl mr-4">
                            <MaterialIcons name="smart-toy" size={20} color="#557D84" />
                        </View>
                        <Text className="flex-1 text-slate-700 font-semibold">Medica AI Assistant</Text>
                        <ChevronRight color="#CBD5E1" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center p-5 border-b border-slate-50">
                        <View className="bg-slate-50 p-2 rounded-xl mr-4">
                            <Bell color="#64748B" size={20} />
                        </View>
                        <Text className="flex-1 text-slate-700 font-semibold">Notifications</Text>
                        <ChevronRight color="#CBD5E1" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center p-5" onPress={handleLogout}>
                        <View className="bg-red-50 p-2 rounded-xl mr-4">
                            <LogOut color="#EF4444" size={20} />
                        </View>
                        <Text className="flex-1 text-red-500 font-semibold">Logout</Text>
                        <ChevronRight color="#EF4444" size={16} opacity={0.3} />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default ProfileScreen;
