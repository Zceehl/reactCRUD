import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    // Registration form state
    const [regData, setRegData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        role_id: ''
    });

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.error);
        }
    };

    const handleRegister = async () => {
        if (!regData.username || !regData.email || !regData.password || 
            !regData.first_name || !regData.last_name || !regData.role_id) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (regData.password !== regData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const result = await register(regData);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Registration Failed', result.error);
        }
    };

    const updateRegData = (field, value) => {
        setRegData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Inventory System</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </Text>
                </View>

                <View style={styles.form}>
                    {isLogin ? (
                        // Login Form
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        // Registration Form
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                value={regData.username}
                                onChangeText={(value) => updateRegData('username', value)}
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={regData.email}
                                onChangeText={(value) => updateRegData('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="First Name"
                                value={regData.first_name}
                                onChangeText={(value) => updateRegData('first_name', value)}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Last Name"
                                value={regData.last_name}
                                onChangeText={(value) => updateRegData('last_name', value)}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone (optional)"
                                value={regData.phone}
                                onChangeText={(value) => updateRegData('phone', value)}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={regData.password}
                                onChangeText={(value) => updateRegData('password', value)}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                value={regData.confirmPassword}
                                onChangeText={(value) => updateRegData('confirmPassword', value)}
                                secureTextEntry
                            />
                            
                            <View style={styles.roleContainer}>
                                <Text style={styles.roleLabel}>Select Role:</Text>
                                <View style={styles.roleButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleButton,
                                            regData.role_id === 'admin' && styles.roleButtonActive
                                        ]}
                                        onPress={() => updateRegData('role_id', 'admin')}
                                    >
                                        <Text style={[
                                            styles.roleButtonText,
                                            regData.role_id === 'admin' && styles.roleButtonTextActive
                                        ]}>
                                            Admin
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleButton,
                                            regData.role_id === 'inventory' && styles.roleButtonActive
                                        ]}
                                        onPress={() => updateRegData('role_id', 'inventory')}
                                    >
                                        <Text style={[
                                            styles.roleButtonText,
                                            regData.role_id === 'inventory' && styles.roleButtonTextActive
                                        ]}>
                                            Inventory
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={styles.switchText}>
                            {isLogin 
                                ? "Don't have an account? Sign up" 
                                : "Already have an account? Sign in"
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        color: '#007AFF',
        fontSize: 14,
    },
    roleContainer: {
        marginBottom: 15,
    },
    roleLabel: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    roleButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    roleButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    roleButtonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    roleButtonTextActive: {
        color: 'white',
    },
});

export default LoginScreen; 