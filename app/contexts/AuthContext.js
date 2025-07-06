import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, ID } from 'appwrite';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { client, COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';

const account = new Account(client);

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const session = await account.get();
            if (session) {
                await loadUserData(session.$id);
            }
        } catch (error) {
            console.log('No active session');
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async (userId) => {
        try {
            console.log('Loading user data for userId:', userId);
            console.log('Database ID:', DATABASE_ID);
            console.log('Collection:', COLLECTIONS.USERS);
            
            const userDoc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            );
            
            const roleDoc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.ROLES,
                userDoc.role_id
            );

            const userData = {
                ...userDoc,
                role: roleDoc.role_name
            };

            setUser(userData);
            setUserRole(roleDoc.role_name);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Error loading user data:', error);
            await logout();
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const session = await account.createEmailPasswordSession(email, password);
            const userId = session.userId || session.$id;
            console.log('Login session userId:', userId);
            await loadUserData(userId);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            
            console.log('Starting registration for:', userData.email);
            
            // Create user account in Appwrite
            const userAccount = await account.create(
                ID.unique(),
                userData.email,
                userData.password,
                `${userData.first_name} ${userData.last_name}`
            );
            
            console.log('Account created with ID:', userAccount.$id);

            // Create user document in database
            const userDoc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userAccount.$id, // Use the account ID as document ID
                {
                    username: userData.username,
                    email: userData.email,
                    password_hash: userData.password, // In production, hash this
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone || '',
                    role_id: userData.role_id, // This should match the document ID in roles collection
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            );
            
            console.log('User document created with ID:', userDoc.$id);

            // Auto-login after registration
            await login(userData.email, userData.password);
            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await account.deleteSessions();
            await AsyncStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setUserRole(null);
        }
    };

    const hasPermission = (permission) => {
        if (!userRole) return false;
        
        switch (permission) {
            case 'admin':
                return userRole === 'admin';
            case 'inventory':
                return userRole === 'admin' || userRole === 'inventory';
            case 'create_movement':
                return userRole === 'admin' || userRole === 'inventory';
            case 'read':
                return userRole === 'admin' || userRole === 'inventory';
            case 'update':
                return userRole === 'admin';
            case 'delete':
                return userRole === 'admin';
            default:
                return false;
        }
    };

    const value = {
        user,
        userRole,
        loading,
        login,
        register,
        logout,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 