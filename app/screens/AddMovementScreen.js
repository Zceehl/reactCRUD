import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { InventoryService } from '../services/inventoryService';

const AddMovementScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { hasPermission } = useAuth();
    const [ingredients, setIngredients] = useState([]);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [movementData, setMovementData] = useState({
        ingredient_id: '',
        movement_type: 'in',
        quantity: '',
        reason: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadIngredients();
        if (params?.ingredient) {
            const ingredient = JSON.parse(params.ingredient);
            setSelectedIngredient(ingredient);
            setMovementData(prev => ({
                ...prev,
                ingredient_id: ingredient.$id
            }));
        }
    }, [params]);

    const loadIngredients = async () => {
        try {
            const result = await InventoryService.getIngredients();
            if (result.success) {
                setIngredients(result.data);
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    };

    const handleSubmit = async () => {
        if (!movementData.ingredient_id || !movementData.quantity) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (parseFloat(movementData.quantity) <= 0) {
            Alert.alert('Error', 'Quantity must be greater than 0');
            return;
        }

        // Validate stock out won't result in negative stock
        if (movementData.movement_type === 'out' && selectedIngredient) {
            const currentStock = parseFloat(selectedIngredient.stock_quantity);
            const movementQuantity = parseFloat(movementData.quantity);
            const newStock = currentStock - movementQuantity;
            
            if (newStock < 0) {
                Alert.alert(
                    'Insufficient Stock', 
                    `Cannot remove ${movementQuantity} ${selectedIngredient.unit} of ${selectedIngredient.ingredient_name}. Current stock is ${currentStock.toFixed(2)} ${selectedIngredient.unit}. Maximum quantity that can be removed is ${currentStock.toFixed(2)} ${selectedIngredient.unit}.`
                );
                return;
            }
        }

        setLoading(true);
        try {
            const result = await InventoryService.createMovement(movementData);
            if (result.success) {
                Alert.alert('Success', 'Movement added successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to add movement');
            }
        } catch (error) {
            console.error('Error adding movement:', error);
            Alert.alert('Error', 'Failed to add movement');
        } finally {
            setLoading(false);
        }
    };

    const updateMovementData = (field, value) => {
        setMovementData(prev => ({ ...prev, [field]: value }));
    };

    const IngredientSelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Ingredient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.ingredientList}>
                    {ingredients.map((ingredient) => (
                        <TouchableOpacity
                            key={ingredient.$id}
                            style={[
                                styles.ingredientOption,
                                selectedIngredient?.$id === ingredient.$id && styles.selectedIngredient
                            ]}
                            onPress={() => {
                                setSelectedIngredient(ingredient);
                                updateMovementData('ingredient_id', ingredient.$id);
                            }}
                        >
                            <Text style={[
                                styles.ingredientOptionText,
                                selectedIngredient?.$id === ingredient.$id && styles.selectedIngredientText
                            ]}>
                                {ingredient.ingredient_name}
                            </Text>
                            <Text style={[
                                styles.ingredientStock,
                                selectedIngredient?.$id === ingredient.$id && styles.selectedIngredientText
                            ]}>
                                {parseFloat(ingredient.stock_quantity).toFixed(2)} {ingredient.unit}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const MovementTypeSelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movement Type</Text>
            <View style={styles.typeButtons}>
                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        movementData.movement_type === 'in' && styles.typeButtonActive
                    ]}
                    onPress={() => updateMovementData('movement_type', 'in')}
                >
                    <Text style={[
                        styles.typeButtonText,
                        movementData.movement_type === 'in' && styles.typeButtonTextActive
                    ]}>
                        ➕ Stock In
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        movementData.movement_type === 'out' && styles.typeButtonActive
                    ]}
                    onPress={() => updateMovementData('movement_type', 'out')}
                >
                    <Text style={[
                        styles.typeButtonText,
                        movementData.movement_type === 'out' && styles.typeButtonTextActive
                    ]}>
                        ➖ Stock Out
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Movement</Text>
                    <View style={{ width: 50 }} />
                </View>

                <IngredientSelector />
                <MovementTypeSelector />

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter quantity"
                            value={movementData.quantity}
                            onChangeText={(value) => updateMovementData('quantity', value)}
                            keyboardType="numeric"
                        />
                        {selectedIngredient && (
                            <Text style={styles.unitText}>
                                Unit: {selectedIngredient.unit}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Purchased, Used for production, Waste"
                            value={movementData.reason}
                            onChangeText={(value) => updateMovementData('reason', value)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Additional notes..."
                            value={movementData.notes}
                            onChangeText={(value) => updateMovementData('notes', value)}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {selectedIngredient && (
                        <View style={styles.preview}>
                            <Text style={styles.previewTitle}>Movement Preview</Text>
                            <View style={styles.previewContent}>
                                <Text style={styles.previewText}>
                                    {movementData.movement_type === 'in' ? 'Adding' : 'Removing'} {' '}
                                    {movementData.quantity || '0'} {selectedIngredient.unit} of {' '}
                                    {selectedIngredient.ingredient_name}
                                </Text>
                                {movementData.quantity && (
                                    <>
                                        <Text style={styles.previewText}>
                                            New stock: {(
                                                parseFloat(selectedIngredient.stock_quantity) + 
                                                (movementData.movement_type === 'in' ? parseFloat(movementData.quantity) : -parseFloat(movementData.quantity))
                                            ).toFixed(2)} {selectedIngredient.unit}
                                        </Text>
                                        {movementData.movement_type === 'out' && 
                                         parseFloat(selectedIngredient.stock_quantity) - parseFloat(movementData.quantity) < 0 && (
                                            <Text style={styles.errorText}>
                                                ⚠️ Warning: This will result in negative stock!
                                            </Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Adding Movement...' : 'Add Movement'}
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
    section: {
        padding: 20,
        backgroundColor: 'white',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    ingredientList: {
        flexDirection: 'row',
        gap: 10,
    },
    ingredientOption: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 120,
    },
    selectedIngredient: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    ingredientOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    selectedIngredientText: {
        color: 'white',
    },
    ingredientStock: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    typeButtonTextActive: {
        color: 'white',
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    unitText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    preview: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    previewContent: {
        gap: 4,
    },
    previewText: {
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '600',
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddMovementScreen; 