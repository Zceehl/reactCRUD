#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Inventory System Setup...\n');

// Run the setup script with optimized settings
const setupProcess = spawn('node', ['scripts/setup.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
});

setupProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Setup completed successfully!');
        console.log('🎉 You can now run "npm start" to launch the application');
    } else {
        console.log('\n❌ Setup failed with code:', code);
        console.log('💡 Please check your configuration and try again');
    }
});

setupProcess.on('error', (error) => {
    console.error('\n❌ Setup script error:', error.message);
    console.log('💡 Make sure you have Node.js installed and the scripts directory exists');
}); 