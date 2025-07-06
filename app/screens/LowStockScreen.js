import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { InventoryService } from '../services/inventoryService';

const LowStockScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [lowStockItems, setLowStockItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLowStockItems();
    }, []);

    const loadLowStockItems = async () => {
        try {
            const result = await InventoryService.getLowStockIngredients();
            if (result.success) {
                setLowStockItems(result.data);
            } else {
                Alert.alert('Error', 'Failed to load low stock items');
            }
        } catch (error) {
            console.error('Error loading low stock items:', error);
            Alert.alert('Error', 'Failed to load low stock items');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLowStockItems();
        setRefreshing(false);
    };

    const handleAddMovement = (ingredient) => {
        router.push({
            pathname: '/add-movement',
            params: { ingredient: JSON.stringify(ingredient) }
        });
    };

    const renderLowStockItem = ({ item }) => {
        const stockPercentage = (parseFloat(item.stock_quantity) / parseFloat(item.minimum_stock)) * 100;
        const isCritical = stockPercentage <= 50;

        return (
            <View style={[styles.itemCard, isCritical && styles.criticalCard]}>
                <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.ingredient_name}</Text>
                    {isCritical && (
                        <View style={styles.criticalBadge}>
                            <Text style={styles.criticalText}>CRITICAL</Text>
                        </View>
                    )}
                </View>

                <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Current Stock:</Text>
                        <Text style={[styles.detailValue, isCritical && styles.criticalText]}>
                            {parseFloat(item.stock_quantity).toFixed(2)} {item.unit}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Minimum Stock:</Text>
                        <Text style={styles.detailValue}>
                            {parseFloat(item.minimum_stock).toFixed(2)} {item.unit}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Stock Level:</Text>
                        <Text style={[styles.detailValue, isCritical && styles.criticalText]}>
                            {stockPercentage.toFixed(1)}%
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Unit Cost:</Text>
                        <Text style={styles.detailValue}>
                            ${parseFloat(item.unit_cost).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    {hasPermission('create_movement') && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleAddMovement(item)}
                        >
                            <Text style={styles.actionButtonText}>Add Stock</Text>
                        </TouchableOpacity>
                    )}

                    {hasPermission('update') && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push({
                                pathname: '/edit-ingredient',
                                params: { ingredient: JSON.stringify(item) }
                            })}
                        >
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Low Stock Items</Text>
                <View style={{ width: 50 }} />
            </View>

            {lowStockItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>🎉 All Good!</Text>
                    <Text style={styles.emptyStateText}>
                        No items are currently below their minimum stock levels.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={lowStockItems}
                    renderItem={renderLowStockItem}
                    keyExtractor={(item) => item.$id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
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
    listContainer: {
        padding: 20,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    criticalCard: {
        borderLeftColor: '#FF3B30',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    criticalBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    criticalText: {
        color: '#FF3B30',
        fontSize: 12,
        fontWeight: '600',
    },
    itemDetails: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#34C759',
        marginBottom: 10,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default LowStockScreen; 