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

const IngredientsScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [ingredients, setIngredients] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredIngredients, setFilteredIngredients] = useState([]);

    useEffect(() => {
        loadIngredients();
    }, []);

    useEffect(() => {
        filterIngredients();
    }, [searchQuery, ingredients]);

    const loadIngredients = async () => {
        try {
            const result = await InventoryService.getIngredients();
            if (result.success) {
                setIngredients(result.data);
            } else {
                Alert.alert('Error', 'Failed to load ingredients');
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
            Alert.alert('Error', 'Failed to load ingredients');
        }
    };

    const filterIngredients = () => {
        const filtered = ingredients.filter(ingredient =>
            ingredient.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredIngredients(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadIngredients();
        setRefreshing(false);
    };

    const handleDeleteIngredient = (ingredient) => {
        Alert.alert(
            'Delete Ingredient',
            `Are you sure you want to delete "${ingredient.ingredient_name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await InventoryService.deleteIngredient(ingredient.$id);
                            if (result.success) {
                                await loadIngredients();
                                Alert.alert('Success', 'Ingredient deleted successfully');
                            } else {
                                Alert.alert('Error', 'Failed to delete ingredient');
                            }
                        } catch (error) {
                            console.error('Error deleting ingredient:', error);
                            Alert.alert('Error', 'Failed to delete ingredient');
                        }
                    }
                }
            ]
        );
    };

    const renderIngredientItem = ({ item }) => {
        const isLowStock = parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock);
        const stockValue = parseFloat(item.stock_quantity) * parseFloat(item.unit_cost);

        return (
            <TouchableOpacity
                style={[styles.ingredientCard, isLowStock && styles.lowStockCard]}
                onPress={() => router.push({
                    pathname: '/edit-ingredient',
                    params: { ingredient: JSON.stringify(item) }
                })}
            >
                <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientName}>{item.ingredient_name}</Text>
                    {isLowStock && (
                        <View style={styles.lowStockBadge}>
                            <Text style={styles.lowStockText}>LOW STOCK</Text>
                        </View>
                    )}
                </View>

                <View style={styles.ingredientDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Stock:</Text>
                        <Text style={[styles.detailValue, isLowStock && styles.lowStockText]}>
                            {parseFloat(item.stock_quantity).toFixed(2)} {item.unit}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Unit Cost:</Text>
                        <Text style={styles.detailValue}>
                            ${parseFloat(item.unit_cost).toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Min Stock:</Text>
                        <Text style={styles.detailValue}>
                            {parseFloat(item.minimum_stock).toFixed(2)} {item.unit}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Value:</Text>
                        <Text style={styles.detailValue}>
                            ${stockValue.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    {hasPermission('create_movement') && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push({
                                pathname: '/add-movement',
                                params: { ingredient: JSON.stringify(item) }
                            })}
                        >
                            <Text style={styles.actionButtonText}>Add Movement</Text>
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

                    {hasPermission('delete') && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteIngredient(item)}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Ingredients</Text>
                {hasPermission('admin') && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/add-ingredient')}
                    >
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredIngredients}
                renderItem={renderIngredientItem}
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
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
    ingredientCard: {
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
    lowStockCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    ingredientHeader: {
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
    lowStockBadge: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    lowStockText: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '600',
    },
    ingredientDetails: {
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
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default IngredientsScreen; 