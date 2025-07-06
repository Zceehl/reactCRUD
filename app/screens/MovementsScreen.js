import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { InventoryService } from '../services/inventoryService';

const MovementsScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [movements, setMovements] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMovements, setFilteredMovements] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterMovements();
    }, [searchQuery, movements]);

    const loadData = async () => {
        try {
            const [movementsResult, ingredientsResult] = await Promise.all([
                InventoryService.getMovements(),
                InventoryService.getIngredients()
            ]);

            if (movementsResult.success) {
                setMovements(movementsResult.data);
            }

            if (ingredientsResult.success) {
                setIngredients(ingredientsResult.data);
            }
        } catch (error) {
            console.error('Error loading movements:', error);
            Alert.alert('Error', 'Failed to load movements');
        }
    };

    const filterMovements = () => {
        const filtered = movements.filter(movement => {
            const ingredient = ingredients.find(ing => ing.$id === movement.ingredient_id);
            const ingredientName = ingredient ? ingredient.ingredient_name.toLowerCase() : '';
            const reason = movement.reason ? movement.reason.toLowerCase() : '';
            const notes = movement.notes ? movement.notes.toLowerCase() : '';
            const searchLower = searchQuery.toLowerCase();

            return ingredientName.includes(searchLower) || 
                   reason.includes(searchLower) || 
                   notes.includes(searchLower) ||
                   movement.movement_type.includes(searchLower);
        });
        setFilteredMovements(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleDeleteMovement = (movement) => {
        Alert.alert(
            'Delete Movement',
            `Are you sure you want to delete this movement?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await InventoryService.deleteMovement(movement.$id);
                            if (result.success) {
                                await loadData();
                                Alert.alert('Success', 'Movement deleted successfully');
                            } else {
                                Alert.alert('Error', 'Failed to delete movement');
                            }
                        } catch (error) {
                            console.error('Error deleting movement:', error);
                            Alert.alert('Error', 'Failed to delete movement');
                        }
                    }
                }
            ]
        );
    };

    const getIngredientName = (ingredientId) => {
        const ingredient = ingredients.find(ing => ing.$id === ingredientId);
        return ingredient ? ingredient.ingredient_name : 'Unknown Ingredient';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + 
               new Date(dateString).toLocaleTimeString();
    };

    const renderMovementItem = ({ item }) => {
        const ingredientName = getIngredientName(item.ingredient_id);
        const isStockIn = item.movement_type === 'in';

        return (
            <View style={[styles.movementCard, isStockIn ? styles.stockInCard : styles.stockOutCard]}>
                <View style={styles.movementHeader}>
                    <Text style={styles.ingredientName}>{ingredientName}</Text>
                    <View style={[
                        styles.movementTypeBadge,
                        isStockIn ? styles.stockInBadge : styles.stockOutBadge
                    ]}>
                        <Text style={styles.movementTypeText}>
                            {isStockIn ? 'STOCK IN' : 'STOCK OUT'}
                        </Text>
                    </View>
                </View>

                <View style={styles.movementDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>
                            {parseFloat(item.quantity).toFixed(2)}
                        </Text>
                    </View>

                    {item.reason && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reason:</Text>
                            <Text style={styles.detailValue}>{item.reason}</Text>
                        </View>
                    )}

                    {item.notes && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Notes:</Text>
                            <Text style={styles.detailValue}>{item.notes}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>

                {hasPermission('delete') && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteMovement(item)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Movements</Text>
                <View style={{ width: 50 }} />
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="Search movements..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredMovements}
                renderItem={renderMovementItem}
                keyExtractor={(item) => item.$id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
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
    searchInput: {
        margin: 20,
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    listContainer: {
        padding: 20,
    },
    movementCard: {
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
    },
    stockInCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
    },
    stockOutCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    movementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    ingredientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    movementTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    stockInBadge: {
        backgroundColor: '#34C759',
    },
    stockOutBadge: {
        backgroundColor: '#FF3B30',
    },
    movementTypeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    movementDetails: {
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
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default MovementsScreen; 