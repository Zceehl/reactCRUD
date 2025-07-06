import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { InventoryService } from '../services/inventoryService';

const DashboardScreen = () => {
    const router = useRouter();
    const { user, userRole, logout, hasPermission } = useAuth();
    const [stats, setStats] = useState({
        totalIngredients: 0,
        lowStockCount: 0,
        totalValue: 0,
        recentMovements: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [ingredients, lowStock, stockValue, movements] = await Promise.all([
                InventoryService.getIngredients(),
                InventoryService.getLowStockIngredients(),
                InventoryService.getStockValue(),
                InventoryService.getMovements()
            ]);

            setStats({
                totalIngredients: ingredients.success ? ingredients.data.length : 0,
                lowStockCount: lowStock.success ? lowStock.data.length : 0,
                totalValue: stockValue.success ? stockValue.data : 0,
                recentMovements: movements.success ? movements.data.length : 0
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: logout, style: 'destructive' }
            ]
        );
    };

    const StatCard = ({ title, value, subtitle, color, onPress }) => (
        <TouchableOpacity 
            style={[styles.statCard, { borderLeftColor: color }]} 
            onPress={onPress}
        >
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
    );

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.first_name || 'User'}!</Text>
                    <Text style={styles.roleText}>{userRole?.toUpperCase()}</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <StatCard
                    title="Total Ingredients"
                    value={stats.totalIngredients}
                    subtitle="items in stock"
                    color="#007AFF"
                    onPress={() => router.push('/ingredients')}
                />
                <StatCard
                    title="Low Stock"
                    value={stats.lowStockCount}
                    subtitle="needs attention"
                    color="#FF9500"
                    onPress={() => router.push('/low-stock')}
                />
            </View>

            <View style={styles.statsContainer}>
                <StatCard
                    title="Total Value"
                    value={`$${stats.totalValue.toFixed(2)}`}
                    subtitle="inventory worth"
                    color="#34C759"
                    onPress={() => router.push('/analytics')}
                />
                <StatCard
                    title="Recent Movements"
                    value={stats.recentMovements}
                    subtitle="this period"
                    color="#AF52DE"
                    onPress={() => router.push('/movements')}
                />
            </View>

            <View style={styles.actionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                {hasPermission('create_movement') && (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/add-movement')}
                    >
                        <Text style={styles.actionButtonText}>➕ Add Movement</Text>
                    </TouchableOpacity>
                )}

                {hasPermission('admin') && (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/add-ingredient')}
                    >
                        <Text style={styles.actionButtonText}>➕ Add Ingredient</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/ingredients')}
                >
                    <Text style={styles.actionButtonText}>📋 View Ingredients</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/movements')}
                >
                    <Text style={styles.actionButtonText}>📊 View Movements</Text>
                </TouchableOpacity>

                {hasPermission('admin') && (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/users')}
                    >
                        <Text style={styles.actionButtonText}>👥 Manage Users</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/settings')}
                >
                    <Text style={styles.actionButtonText}>⚙️ Settings</Text>
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
    welcomeText: {
        fontSize: 16,
        color: '#666',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    roleText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 2,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    logoutText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#999',
    },
    actionsContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    actionButton: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});

export default DashboardScreen; 