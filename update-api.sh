#!/bin/bash

# Script to update all hardcoded API URLs in the codebase
echo "Updating API URLs in React components..."

# Find all TypeScript and TSX files with hardcoded localhost:5000
FILES=$(grep -l "http://localhost:5000" --include="*.tsx" --include="*.ts" -r ./src)

# Add the import statement to each file if it doesn't already have it
for file in $FILES; do
  # Skip apiConfig.ts
  if [[ "$file" == *"apiConfig.ts"* ]]; then
    continue
  fi
  
  echo "Processing $file"
  
  # Check if the file already has the import
  if ! grep -q "import.*getApiUrl.*from.*apiConfig" "$file"; then
    # Add the import after the last import statement
    sed -i '1,/^import/!b;/^import/ {
      :a
      n
      /^import/ {
        ba
      }
      i\
import { getApiUrl, getDefaultHeaders } from '\''@/utils/apiConfig'\'';
    }' "$file"
    echo "  Added import statement"
  fi
  
  # Replace fetch calls with hardcoded URLs
  sed -i 's|fetch(`http://localhost:5000\([^`]*\)`|fetch(getApiUrl("\1")|g' "$file"
  sed -i 's|fetch("http://localhost:5000\([^"]*\)"|fetch(getApiUrl("\1"))|g' "$file"
  sed -i "s|fetch('http://localhost:5000\([^']*\)'|fetch(getApiUrl('\1')|g" "$file"
  
  # Replace hardcoded Content-Type headers with getDefaultHeaders
  sed -i 's|headers: {[^}]*'\''Content-Type'\'': '\''application/json'\''[^}]*}|headers: getDefaultHeaders()|g' "$file"
  
  echo "  Updated API URLs"
done

echo "Done! Updated $(echo "$FILES" | wc -l) files."
