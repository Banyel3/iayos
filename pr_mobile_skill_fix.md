## Summary
- fixed overlap/glitch in mobile Add Skill Requirement modal when selecting a specialization
- made modal content scrollable so expanded sections never render over each other
- wrapped specialization tags in a dedicated scroll area with stable 2-column sizing
- applied safe-area container for modal header/content rendering

## Scope Scan
- scanned skill requirement flows in mobile team jobs and agency hire screens
- only `app/jobs/create/team.tsx` had the non-scrollable expanding selector pattern causing overlap

## Validation
- get_errors: no errors in `apps/frontend_mobile/iayos_mobile/app/jobs/create/team.tsx`
