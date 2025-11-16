#!/bin/bash

# Add getNextPageParam to useTransaction
sed -i '/initialPageParam: 1,/a\    getNextPageParam: () => undefined,' lib/hooks/useTransactions.ts

echo "useTransaction fixed!"
