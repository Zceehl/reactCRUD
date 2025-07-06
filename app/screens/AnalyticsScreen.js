import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { InventoryService } from '../services/inventoryService';

const AnalyticsScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [stats, setStats] = useState({
        totalIngredients: 0,
        lowStockCount: 0,
        totalValue: 0,
        averageCost: 0,
        topIngredients: [],
        recentMovements: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [ingredients, lowStock, stockValue, movements] = await Promise.all([
                InventoryService.getIngredients(),
                InventoryService.getLowStockIngredients(),
                InventoryService.getStockValue(),
                InventoryService.getMovements()
            ]);

            if (ingredients.success) {
                const totalValue = stockValue.success ? stockValue.data : 0;
                const averageCost = ingredients.data.length > 0 
                    ? totalValue / ingredients.data.length 
                    : 0;

                // Get top 5 ingredients by value
                const topIngredients = ingredients.data
                    .map(ingredient => ({
                        ...ingredient,
                        totalValue: parseFloat(ingredient.stock_quantity) * parseFloat(ingredient.unit_cost)
                    }))
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .slice(0, 5);

                setStats({
                    totalIngredients: ingredients.data.length,
                    lowStockCount: lowStock.success ? lowStock.data.length : 0,
                    totalValue: totalValue,
                    averageCost: averageCost,
                    topIngredients: topIngredients,
                    recentMovements: movements.success ? movements.data.length : 0
                });
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnalytics();
        setRefreshing(false);
    };

    const StatCard = ({ title, value, subtitle, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
    );

    const TopIngredientCard = ({ ingredient, index }) => (
        <View style={styles.topIngredientCard}>
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.ingredient_name}</Text>
                <Text style={styles.ingredientDetails}>
                    {parseFloat(ingredient.stock_quantity).toFixed(2)} {ingredient.unit} • 
                    ${parseFloat(ingredient.unit_cost).toFixed(2)}/unit
                </Text>
            </View>
            <Text style={styles.totalValue}>${ingredient.totalValue.toFixed(2)}</Text>
        </View>
    );

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Analytics</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.statsContainer}>
                <StatCard
                    title="Total Value"
                    value={`$${stats.totalValue.toFixed(2)}`}
                    subtitle="inventory worth"
                    color="#34C759"
                />
                <StatCard
                    title="Total Items"
                    value={stats.totalIngredients}
                    subtitle="ingredients"
                    color="#007AFF"
                />
            </View>

            <View style={styles.statsContainer}>
                <StatCard
                    title="Low Stock"
                    value={stats.lowStockCount}
                    subtitle="items need attention"
                    color="#FF9500"
                />
                <StatCard
                    title="Avg Cost"
                    value={`$${stats.averageCost.toFixed(2)}`}
                    subtitle="per ingredient"
                    color="#AF52DE"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top 5 Ingredients by Value</Text>
                {stats.topIngredients.map((ingredient, index) => (
                    <TopIngredientCard 
                        key={ingredient.$id} 
                        ingredient={ingredient} 
                        index={index} 
                    />
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/ingredients')}
                >
                    <Text style={styles.actionButtonText}>📋 View All Ingredients</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push('/movements')}
                >
                    <Text style={styles.actionButtonText}>📊 View All Movements</Text>
                </TouchableOpacity>

                {hasPermission('create_movement') && (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/add-movement')}
                    >
                        <Text style={styles.actionButtonText}>➕ Add Movement</Text>
                    </TouchableOpacity>
                )}
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
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    topIngredientCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    rankBadge: {
        backgroundColor: '#007AFF',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rankText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    ingredientDetails: {
        fontSize: 12,
        color: '#666',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#34C759',
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

export default AnalyticsScreen; 