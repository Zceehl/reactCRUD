import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { account } from '../config/appwrite';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = () => {
    const router = useRouter();
    const { user, logout, hasPermission } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/');
                        } catch (error) {
                            console.error('Error logging out:', error);
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. Are you sure you want to delete your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await account.deleteSessions();
                            await logout();
                            router.replace('/');
                        } catch (error) {
                            console.error('Error deleting account:', error);
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ title, subtitle, onPress, showArrow = true, rightComponent }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingContent}>
                <View>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
                {rightComponent || (showArrow && <Text style={styles.arrow}>›</Text>)}
            </View>
        </TouchableOpacity>
    );

    const ToggleSetting = ({ title, subtitle, value, onValueChange }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingContent}>
                <View>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                />
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <SettingItem
                    title="Profile"
                    subtitle="View and edit your profile information"
                    onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
                />

                <SettingItem
                    title="Change Password"
                    subtitle="Update your account password"
                    onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon')}
                />

                <SettingItem
                    title="Role"
                    subtitle={user?.role_name || 'Unknown'}
                    onPress={() => {}}
                    showArrow={false}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <ToggleSetting
                    title="Notifications"
                    subtitle="Receive alerts for low stock items"
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                />

                <ToggleSetting
                    title="Dark Mode"
                    subtitle="Switch to dark theme"
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                />
            </View>

            {hasPermission('admin') && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Administration</Text>
                    
                    <SettingItem
                        title="Manage Users"
                        subtitle="View and manage user accounts"
                        onPress={() => router.push('/users')}
                    />

                    <SettingItem
                        title="System Settings"
                        subtitle="Configure system preferences"
                        onPress={() => Alert.alert('Coming Soon', 'System settings will be available soon')}
                    />
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                
                <SettingItem
                    title="Help & FAQ"
                    subtitle="Get help and find answers"
                    onPress={() => Alert.alert('Help', 'Contact support at support@inventory.com')}
                />

                <SettingItem
                    title="About"
                    subtitle="App version and information"
                    onPress={() => Alert.alert('About', 'Inventory Management System v1.0.0\n\nBuilt with React Native and Appwrite')}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Actions</Text>
                
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        marginTop: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        padding: 20,
        paddingBottom: 10,
    },
    settingItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    settingTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    arrow: {
        fontSize: 18,
        color: '#999',
        fontWeight: '300',
    },
    logoutButton: {
        backgroundColor: '#007AFF',
        margin: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SettingsScreen; 