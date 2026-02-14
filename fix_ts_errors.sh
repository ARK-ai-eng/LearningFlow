#!/bin/bash
# Fix all implicit 'any' type errors by adding explicit (param: any) annotations

# Get all files with TS7006 errors
FILES=$(pnpm exec tsc --noEmit 2>&1 | grep "error TS7006" | cut -d'(' -f1 | sort -u)

for file in $FILES; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Replace common patterns
    sed -i "s/\.map(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.map((\1: any) =>/g" "$file"
    sed -i "s/\.filter(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.filter((\1: any) =>/g" "$file"
    sed -i "s/\.reduce(\([a-zA-Z_][a-zA-Z0-9_]*\), \([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.reduce((\1: any, \2: any) =>/g" "$file"
    sed -i "s/\.forEach(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.forEach((\1: any) =>/g" "$file"
    sed -i "s/\.find(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.find((\1: any) =>/g" "$file"
    sed -i "s/\.some(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.some((\1: any) =>/g" "$file"
    sed -i "s/\.every(\([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.every((\1: any) =>/g" "$file"
    sed -i "s/\.sort(\([a-zA-Z_][a-zA-Z0-9_]*\), \([a-zA-Z_][a-zA-Z0-9_]*\) =>/\.sort((\1: any, \2: any) =>/g" "$file"
  fi
done

echo "Done!"
