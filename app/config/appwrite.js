import { Account, Client, Databases } from 'appwrite';

// Appwrite Configuration
const client = new Client()
    .setEndpoint('YOUR_APPWRITE_ENDPOINT') // Will be replaced by setup script
    .setProject('YOUR_PROJECT_ID'); // Will be replaced by setup script

export const databases = new Databases(client);
export const account = new Account(client);
export { client };

// Database and Collection IDs
export const DATABASE_ID = 'YOUR_DATABASE_ID'; // Will be replaced by setup script
export const COLLECTIONS = {
    ROLES: 'YOUR_ROLES_COLLECTION', // Will be replaced by setup script
    USERS: 'YOUR_USERS_COLLECTION', // Will be replaced by setup script
    INGREDIENTS: 'YOUR_INGREDIENTS_COLLECTION', // Will be replaced by setup script
    INGREDIENT_MOVEMENTS: 'YOUR_MOVEMENTS_COLLECTION' // Will be replaced by setup script
};

// Appwrite Collection Structure
export const COLLECTION_SCHEMAS = {
    ROLES: {
        name: 'Roles',
        permissions: ['read("team:admin")'],
        attributes: [
            { key: 'role_name', type: 'string', required: true, array: false },
            { key: 'created_at', type: 'datetime', required: true, array: false }
        ]
    },
    USERS: {
        name: 'Users',
        permissions: ['read("team:admin")', 'write("team:admin")'],
        attributes: [
            { key: 'username', type: 'string', required: true, array: false },
            { key: 'email', type: 'string', required: true, array: false },
            { key: 'password_hash', type: 'string', required: true, array: false },
            { key: 'first_name', type: 'string', required: true, array: false },
            { key: 'last_name', type: 'string', required: true, array: false },
            { key: 'phone', type: 'string', required: false, array: false },
            { key: 'role_id', type: 'string', required: true, array: false },
            { key: 'is_active', type: 'boolean', required: true, array: false },
            { key: 'created_at', type: 'datetime', required: true, array: false }
        ]
    },
    INGREDIENTS: {
        name: 'Ingredients',
        permissions: ['read("team:admin")', 'write("team:admin")'],
        attributes: [
            { key: 'ingredient_name', type: 'string', required: true, array: false },
            { key: 'unit', type: 'string', required: true, array: false },
            { key: 'stock_quantity', type: 'double', required: true, array: false },
            { key: 'unit_cost', type: 'double', required: true, array: false },
            { key: 'minimum_stock', type: 'double', required: true, array: false },
            { key: 'created_at', type: 'datetime', required: true, array: false },
            { key: 'updated_at', type: 'datetime', required: true, array: false }
        ]
    },
    INGREDIENT_MOVEMENTS: {
        name: 'Ingredient Movements',
        permissions: ['read("team:admin")', 'write("team:admin")'],
        attributes: [
            { key: 'ingredient_id', type: 'string', required: true, array: false },
            { key: 'movement_type', type: 'string', required: true, array: false },
            { key: 'quantity', type: 'double', required: true, array: false },
            { key: 'reason', type: 'string', required: false, array: false },
            { key: 'notes', type: 'string', required: false, array: false },
            { key: 'created_at', type: 'datetime', required: true, array: false }
        ]
    }
};

export default client; 