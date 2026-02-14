#!/bin/bash
# Fix remaining TypeScript errors with more patterns

FILES=$(pnpm exec tsc --noEmit 2>&1 | grep "error TS7006" | cut -d'(' -f1 | sort -u)

for file in $FILES; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Fix .map with 2 parameters
    sed -i -E "s/\.map\(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\) =>/\.map((\1: any, \2: any) =>/g" "$file"
    # Fix .sort with 2 parameters  
    sed -i -E "s/\.sort\(\(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\) =>/\.sort((\1: any, \2: any) =>/g" "$file"
    # Fix .reduce with 2 parameters
    sed -i -E "s/\.reduce\(\(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\) =>/\.reduce((\1: any, \2: any) =>/g" "$file"
    # Fix .filter with 1 parameter
    sed -i -E "s/\.filter\(([a-zA-Z_][a-zA-Z0-9_]*) =>/\.filter((\1: any) =>/g" "$file"
    # Fix .find with 1 parameter
    sed -i -E "s/\.find\(([a-zA-Z_][a-zA-Z0-9_]*) =>/\.find((\1: any) =>/g" "$file"
  fi
done

echo "Done!"
