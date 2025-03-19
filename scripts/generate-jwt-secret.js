import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// Generate a secure random string for JWT_SECRET
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Check if .env file exists
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  // File doesn't exist, create it
  console.log('Creating new .env file');
}

// Check if JWT_SECRET already exists in the .env file
if (envContent.includes('JWT_SECRET=')) {
  // Replace the existing JWT_SECRET
  envContent = envContent.replace(/JWT_SECRET=.*(\r?\n|$)/, `JWT_SECRET=${jwtSecret}$1`);
} else {
  // Add JWT_SECRET to the .env file
  envContent += `\nJWT_SECRET=${jwtSecret}`;
}

// Write the updated content back to the .env file
fs.writeFileSync(envPath, envContent);

console.log('JWT_SECRET has been generated and added to your .env file');
console.log('Please make sure to keep this secret secure and never commit it to version control');
