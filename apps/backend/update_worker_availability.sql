-- Update all existing workers to be AVAILABLE for testing
UPDATE accounts_workerprofile 
SET "availabilityStatus" = 'AVAILABLE'
WHERE "availabilityStatus" = 'OFFLINE';

-- Check the updated workers
SELECT 
    wp."profileID_id",
    p."firstName",
    p."lastName", 
    wp."availabilityStatus"
FROM accounts_workerprofile wp
JOIN accounts_profile p ON wp."profileID_id" = p."profileID"
LIMIT 10;
