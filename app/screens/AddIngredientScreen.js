import { useRouter } from 'expo-router';
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
import { InventoryService } from '../services/inventoryService';

const AddIngredientScreen = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [loading, setLoading] = useState(false);
    const [ingredientData, setIngredientData] = useState({
        ingredient_name: '',
        unit: '',
        stock_quantity: '',
        unit_cost: '',
        minimum_stock: ''
    });

    const units = ['kg', 'g', 'liter', 'ml', 'piece', 'box', 'pack', 'bottle', 'can'];

    const handleSubmit = async () => {
        if (!ingredientData.ingredient_name || !ingredientData.unit || 
            !ingredientData.unit_cost || ingredientData.stock_quantity === '') {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (parseFloat(ingredientData.unit_cost) <= 0) {
            Alert.alert('Error', 'Unit cost must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            const result = await InventoryService.createIngredient(ingredientData);
            if (result.success) {
                Alert.alert('Success', 'Ingredient added successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to add ingredient');
            }
        } catch (error) {
            console.error('Error adding ingredient:', error);
            Alert.alert('Error', 'Failed to add ingredient');
        } finally {
            setLoading(false);
        }
    };

    const updateIngredientData = (field, value) => {
        setIngredientData(prev => ({ ...prev, [field]: value }));
    };

    const UnitSelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.unitList}>
                    {units.map((unit) => (
                        <TouchableOpacity
                            key={unit}
                            style={[
                                styles.unitOption,
                                ingredientData.unit === unit && styles.selectedUnit
                            ]}
                            onPress={() => updateIngredientData('unit', unit)}
                        >
                            <Text style={[
                                styles.unitOptionText,
                                ingredientData.unit === unit && styles.selectedUnitText
                            ]}>
                                {unit}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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
                    <Text style={styles.title}>Add Ingredient</Text>
                    <View style={{ width: 50 }} />
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ingredient Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter ingredient name"
                            value={ingredientData.ingredient_name}
                            onChangeText={(value) => updateIngredientData('ingredient_name', value)}
                        />
                    </View>

                    <UnitSelector />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Initial Stock Quantity</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            value={ingredientData.stock_quantity}
                            onChangeText={(value) => updateIngredientData('stock_quantity', value)}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Unit Cost *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            value={ingredientData.unit_cost}
                            onChangeText={(value) => updateIngredientData('unit_cost', value)}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Minimum Stock Level</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            value={ingredientData.minimum_stock}
                            onChangeText={(value) => updateIngredientData('minimum_stock', value)}
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Adding Ingredient...' : 'Add Ingredient'}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    unitList: {
        flexDirection: 'row',
        gap: 10,
    },
    unitOption: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 60,
        alignItems: 'center',
    },
    selectedUnit: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    unitOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    selectedUnitText: {
        color: 'white',
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
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
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

export default AddIngredientScreen; 