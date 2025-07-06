#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Inventory System Setup...\n');

// Run the setup script
const setupProcess = spawn('node', ['scripts/setup.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

setupProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Setup completed successfully!');
    } else {
        console.log('\n❌ Setup failed with code:', code);
    }
}); 