import { ID, Query } from 'appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';

export class InventoryService {
    // Ingredient CRUD Operations
    static async getIngredients() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.INGREDIENTS
            );
            return { success: true, data: response.documents };
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            return { success: false, error: error.message };
        }
    }

    static async getIngredient(ingredientId) {
        try {
            const response = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENTS,
                ingredientId
            );
            return { success: true, data: response };
        } catch (error) {
            console.error('Error fetching ingredient:', error);
            return { success: false, error: error.message };
        }
    }

    static async createIngredient(ingredientData) {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENTS,
                ID.unique(),
                {
                    ingredient_name: ingredientData.ingredient_name,
                    unit: ingredientData.unit,
                    stock_quantity: parseFloat(ingredientData.stock_quantity) || 0,
                    unit_cost: parseFloat(ingredientData.unit_cost),
                    minimum_stock: parseFloat(ingredientData.minimum_stock) || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            );
            return { success: true, data: response };
        } catch (error) {
            console.error('Error creating ingredient:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateIngredient(ingredientId, ingredientData) {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENTS,
                ingredientId,
                {
                    ingredient_name: ingredientData.ingredient_name,
                    unit: ingredientData.unit,
                    stock_quantity: parseFloat(ingredientData.stock_quantity) || 0,
                    unit_cost: parseFloat(ingredientData.unit_cost),
                    minimum_stock: parseFloat(ingredientData.minimum_stock) || 0,
                    updated_at: new Date().toISOString()
                }
            );
            return { success: true, data: response };
        } catch (error) {
            console.error('Error updating ingredient:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteIngredient(ingredientId) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENTS,
                ingredientId
            );
            return { success: true };
        } catch (error) {
            console.error('Error deleting ingredient:', error);
            return { success: false, error: error.message };
        }
    }

    // Movement CRUD Operations
    static async getMovements() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.INGREDIENT_MOVEMENTS,
                [
                    Query.orderDesc('created_at')
                ]
            );
            return { success: true, data: response.documents };
        } catch (error) {
            console.error('Error fetching movements:', error);
            return { success: false, error: error.message };
        }
    }

    static async getMovementsByIngredient(ingredientId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.INGREDIENT_MOVEMENTS,
                [
                    Query.equal('ingredient_id', ingredientId),
                    Query.orderDesc('created_at')
                ]
            );
            return { success: true, data: response.documents };
        } catch (error) {
            console.error('Error fetching movements by ingredient:', error);
            return { success: false, error: error.message };
        }
    }

    static async createMovement(movementData) {
        try {
            // Validate stock out won't result in negative stock
            if (movementData.movement_type === 'out') {
                const ingredient = await this.getIngredient(movementData.ingredient_id);
                if (ingredient.success) {
                    const currentStock = parseFloat(ingredient.data.stock_quantity);
                    const movementQuantity = parseFloat(movementData.quantity);
                    const newStock = currentStock - movementQuantity;
                    
                    if (newStock < 0) {
                        return { 
                            success: false, 
                            error: `Insufficient stock. Current stock: ${currentStock.toFixed(2)}. Cannot remove ${movementQuantity}.` 
                        };
                    }
                }
            }

            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENT_MOVEMENTS,
                ID.unique(),
                {
                    ingredient_id: movementData.ingredient_id,
                    movement_type: movementData.movement_type, // 'in' or 'out'
                    quantity: parseFloat(movementData.quantity),
                    reason: movementData.reason || '',
                    notes: movementData.notes || '',
                    created_at: new Date().toISOString()
                }
            );

            // Update ingredient stock quantity
            const ingredient = await this.getIngredient(movementData.ingredient_id);
            if (ingredient.success) {
                const currentStock = parseFloat(ingredient.data.stock_quantity);
                const movementQuantity = parseFloat(movementData.quantity);
                const newStock = movementData.movement_type === 'in' 
                    ? currentStock + movementQuantity 
                    : currentStock - movementQuantity;

                await this.updateIngredient(movementData.ingredient_id, {
                    ...ingredient.data,
                    stock_quantity: newStock
                });
            }

            return { success: true, data: response };
        } catch (error) {
            console.error('Error creating movement:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteMovement(movementId) {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.INGREDIENT_MOVEMENTS,
                movementId
            );
            return { success: true };
        } catch (error) {
            console.error('Error deleting movement:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility Methods
    static async getLowStockIngredients() {
        try {
            const ingredients = await this.getIngredients();
            if (ingredients.success) {
                const lowStock = ingredients.data.filter(
                    ingredient => parseFloat(ingredient.stock_quantity) <= parseFloat(ingredient.minimum_stock)
                );
                return { success: true, data: lowStock };
            }
            return ingredients;
        } catch (error) {
            console.error('Error fetching low stock ingredients:', error);
            return { success: false, error: error.message };
        }
    }

    static async getStockValue() {
        try {
            const ingredients = await this.getIngredients();
            if (ingredients.success) {
                const totalValue = ingredients.data.reduce(
                    (total, ingredient) => {
                        const stockValue = parseFloat(ingredient.stock_quantity) * parseFloat(ingredient.unit_cost);
                        return total + stockValue;
                    }, 0
                );
                return { success: true, data: totalValue };
            }
            return ingredients;
        } catch (error) {
            console.error('Error calculating stock value:', error);
            return { success: false, error: error.message };
        }
    }
} 