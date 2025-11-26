-- Fix existing INVITE jobs that have null inviteStatus
-- These should be set to PENDING if they're ACTIVE and assigned

UPDATE jobs
SET "inviteStatus" = 'PENDING'
WHERE 
    "jobType" = 'INVITE'
    AND "inviteStatus" IS NULL
    AND status = 'ACTIVE'
    AND ("assignedWorkerID_id" IS NOT NULL OR "assignedAgencyFK_id" IS NOT NULL);

-- Show what was updated
SELECT 
    "jobID",
    title,
    "jobType",
    "inviteStatus",
    status,
    "assignedWorkerID_id",
    "assignedAgencyFK_id"
FROM jobs
WHERE 
    "jobType" = 'INVITE'
    AND status = 'ACTIVE';
