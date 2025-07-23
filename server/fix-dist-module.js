// server/fix-dist-module.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build module fix...');

const distPath = path.join(__dirname, 'dist');
const packageJsonPath = path.join(distPath, 'package.json');

// Check if dist exists
if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist directory does not exist');
    console.error('   Make sure TypeScript compilation succeeded');
    process.exit(1);
}

// Create the package.json that tells Node.js how to interpret files in dist/
const packageContent = {
    type: "commonjs"
};

try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageContent, null, 2));
    console.log('✅ Created dist/package.json with CommonJS configuration');
    
    // Let's also verify what files are in dist
    const files = fs.readdirSync(distPath);
    console.log('📁 Files in dist directory:', files);
    
    // Extra check: make sure index.js exists
    if (!files.includes('index.js')) {
        console.warn('⚠️  Warning: index.js not found in dist directory');
        console.warn('   This might indicate a TypeScript compilation issue');
    }
} catch (error) {
    console.error('❌ Failed to create package.json:', error);
    process.exit(1);
}