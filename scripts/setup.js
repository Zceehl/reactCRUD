#!/usr/bin/env node

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Inventory System Setup\n');

const questions = [
    {
        name: 'endpoint',
        question: 'Enter your Appwrite endpoint (e.g., https://cloud.appwrite.io/v1): ',
        default: 'https://cloud.appwrite.io/v1'
    },
    {
        name: 'projectId',
        question: 'Enter your Appwrite project ID: ',
        required: true
    },
    {
        name: 'databaseId',
        question: 'Enter your database ID (default: inventory_system): ',
        default: 'inventory_system'
    },
    {
        name: 'rolesCollection',
        question: 'Enter roles collection ID (default: roles): ',
        default: 'roles'
    },
    {
        name: 'usersCollection',
        question: 'Enter users collection ID (default: users): ',
        default: 'users'
    },
    {
        name: 'ingredientsCollection',
        question: 'Enter ingredients collection ID (default: ingredients): ',
        default: 'ingredients'
    },
    {
        name: 'movementsCollection',
        question: 'Enter movements collection ID (default: ingredient_movements): ',
        default: 'ingredient_movements'
    }
];

const config = {};

async function askQuestion(questionObj) {
    return new Promise((resolve) => {
        rl.question(questionObj.question, (answer) => {
            if (!answer && questionObj.required) {
                console.log('❌ This field is required!');
                askQuestion(questionObj).then(resolve);
            } else {
                config[questionObj.name] = answer || questionObj.default;
                resolve();
            }
        });
    });
}

async function setup() {
    try {
        console.log('📝 Please provide your Appwrite configuration:\n');

        for (const question of questions) {
            await askQuestion(question);
        }

        // Update the appwrite config file
        const configPath = path.join(__dirname, '..', 'app', 'config', 'appwrite.js');
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Replace the placeholder values with actual configuration
        configContent = configContent.replace(
            /\.setEndpoint\('YOUR_APPWRITE_ENDPOINT'\)/,
            `.setEndpoint('${config.endpoint}')`
        );
        configContent = configContent.replace(
            /\.setProject\('YOUR_PROJECT_ID'\)/,
            `.setProject('${config.projectId}')`
        );
        configContent = configContent.replace(
            /export const DATABASE_ID = 'YOUR_DATABASE_ID'/,
            `export const DATABASE_ID = '${config.databaseId}'`
        );
        configContent = configContent.replace(
            /ROLES: 'YOUR_ROLES_COLLECTION'/,
            `ROLES: '${config.rolesCollection}'`
        );
        configContent = configContent.replace(
            /USERS: 'YOUR_USERS_COLLECTION'/,
            `USERS: '${config.usersCollection}'`
        );
        configContent = configContent.replace(
            /INGREDIENTS: 'YOUR_INGREDIENTS_COLLECTION'/,
            `INGREDIENTS: '${config.ingredientsCollection}'`
        );
        configContent = configContent.replace(
            /INGREDIENT_MOVEMENTS: 'YOUR_MOVEMENTS_COLLECTION'/,
            `INGREDIENT_MOVEMENTS: '${config.movementsCollection}'`
        );

        fs.writeFileSync(configPath, configContent);

        console.log('\n✅ Configuration updated successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Create your Appwrite database and collections');
        console.log('2. Set up the required attributes for each collection');
        console.log('3. Create admin and inventory roles');
        console.log('4. Run "npm start" to launch the application');
        console.log('\n📖 See README.md for detailed setup instructions');

    } catch (error) {
        console.error('❌ Error during setup:', error.message);
    } finally {
        rl.close();
    }
}

setup(); 