-- Alternative SQL Script - Simpler version without joins
-- Run this directly in your PostgreSQL database

-- Step 1: Check available profiles
SELECT * FROM accounts_profile LIMIT 5;

-- Step 2: Check if WorkerProfile already exists for profile 2
SELECT * FROM accounts_workerprofile;

-- Step 3: Create WorkerProfile for profile 2 (if it doesn't exist)
-- Adjust the column names based on your actual schema
INSERT INTO accounts_workerprofile (
    "profileID_id",
    description,
    "workerRating",
    "totalEarningGross",
    "availabilityStatus"
)
VALUES (
    2,  -- profileID
    'Test worker profile for availability testing',
    0,
    0.00,
    'OFFLINE'
)
ON CONFLICT DO NOTHING;

-- Step 4: Verify creation
SELECT * FROM accounts_workerprofile WHERE "profileID_id" = 2;
