-- SQL Script to create a WorkerProfile for profileID 2
-- Run this directly in your PostgreSQL database

-- First, check if the profile exists and is a WORKER
SELECT 
    p."profileID",
    p."firstName",
    p."lastName",
    p."profileType",
    a.email
FROM accounts_profile p
JOIN accounts_accounts a ON p."accountFK_id" = a."accountID"
WHERE p."profileID" = 2;

-- Check if WorkerProfile already exists
SELECT * FROM accounts_workerprofile WHERE "profileID_id" = 2;

-- If it doesn't exist, create it
-- Note: Replace the profileID_id value if your profile has a different ID
INSERT INTO accounts_workerprofile (
    "profileID_id",
    description,
    "workerRating",
    "totalEarningGross",
    "availabilityStatus"
)
SELECT 
    2,  -- profileID
    'Test worker profile for availability testing',  -- description
    0,  -- workerRating
    0.00,  -- totalEarningGross
    'OFFLINE'  -- availabilityStatus
WHERE NOT EXISTS (
    SELECT 1 FROM accounts_workerprofile WHERE "profileID_id" = 2
);

-- Verify the creation
SELECT 
    wp.*,
    p."firstName",
    p."lastName",
    a.email
FROM accounts_workerprofile wp
JOIN accounts_profile p ON wp."profileID_id" = p."profileID"
JOIN accounts_accounts a ON p."accountFK_id" = a."accountID"
WHERE wp."profileID_id" = 2;
