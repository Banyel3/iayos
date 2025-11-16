#!/bin/bash

# Fix navigation route error - change "/(tabs)/" to just "/"
sed -i 's|"/(tabs)/"|"/"|g' app/\(tabs\)/my-jobs.tsx

# Fix undefined vs null errors - add nullish coalescing
sed -i 's/AsyncStorage\.setItem(\([^,]*\), \([^)]*\))/AsyncStorage.setItem(\1, \2 ?? "")/g' app/notifications/settings.tsx

echo "Quick fixes applied!"
