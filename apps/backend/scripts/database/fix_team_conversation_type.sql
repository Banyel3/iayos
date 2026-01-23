-- Fix existing team conversations: Change 'TEAM' to 'TEAM_GROUP'
-- This fixes the issue where team_worker_assignments array is empty in API responses

-- Update all team conversations to use correct conversation_type
UPDATE profiles_conversation 
SET conversation_type = 'TEAM_GROUP' 
WHERE conversation_type = 'TEAM';

-- Verify the update
SELECT 
    c."conversationID",
    c.conversation_type,
    j."jobID",
    j.title as job_title,
    j.status as job_status,
    j.is_team_job
FROM profiles_conversation c
JOIN accounts_job j ON c."relatedJobPostingID" = j."jobID"
WHERE j.is_team_job = true
ORDER BY c."conversationID" DESC;
