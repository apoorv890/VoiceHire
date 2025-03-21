/**
 * Script to update hardcoded API URLs in the codebase
 * 
 * This script replaces hardcoded localhost:5000 URLs with the apiConfig utility
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TypeScript and TSX files in the src directory
const srcDir = path.join(__dirname, '..', 'src');
const files = execSync(`find ${srcDir} -type f -name "*.ts*" | grep -v "apiConfig.ts"`, { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} TypeScript files to process`);

// Import statement to add to files that need it
const importStatement = `import { getApiUrl, getDefaultHeaders } from '@/utils/apiConfig';`;

// Process each file
let totalReplacements = 0;
let filesModified = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if file contains hardcoded URLs
  if (content.includes('http://localhost:5000')) {
    console.log(`Processing ${path.relative(process.cwd(), filePath)}`);
    
    // Replace fetch calls with hardcoded URLs
    const fetchRegex = /fetch\(`?http:\/\/localhost:5000(\/[^`"]*)`?/g;
    content = content.replace(fetchRegex, 'fetch(getApiUrl(\'$1\')');
    
    // Replace hardcoded URLs in other contexts
    content = content.replace(/['"]http:\/\/localhost:5000(\/[^'"]*)['"]/g, 'getApiUrl(\'$1\')');
    
    // Add import statement if not already present and if replacements were made
    if (content !== originalContent && !content.includes('import { getApiUrl')) {
      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportEndIndex = content.indexOf('\n', lastImportIndex);
      
      if (lastImportIndex !== -1) {
        // Insert after the last import
        content = 
          content.substring(0, lastImportEndIndex + 1) + 
          importStatement + '\n' + 
          content.substring(lastImportEndIndex + 1);
      } else {
        // Insert at the beginning of the file
        content = importStatement + '\n\n' + content;
      }
      
      // Count replacements
      const replacementCount = (originalContent.match(/http:\/\/localhost:5000/g) || []).length;
      totalReplacements += replacementCount;
      filesModified++;
      
      console.log(`  Made ${replacementCount} replacements`);
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log(`\nSummary:`);
console.log(`- Modified ${filesModified} files`);
console.log(`- Replaced ${totalReplacements} hardcoded URLs`);
console.log(`\nDone!`);
