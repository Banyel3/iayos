--
-- PostgreSQL database dump
--

\restrict aQMALhd4olXkPhLHJpv62BXtaanPFuaoOhKISkTJ2OFxhttC0NGf1yX7ngudssx

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.worker_portfolio DROP CONSTRAINT IF EXISTS "worker_portfolio_workerID_id_010518a8_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.worker_materials DROP CONSTRAINT IF EXISTS "worker_materials_workerID_id_98c651ce_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.worker_materials DROP CONSTRAINT IF EXISTS "worker_materials_categoryID_id_bb83eace_fk_specializ";
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS "worker_certification_workerID_id_e709a48d_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS worker_certification_verified_by_id_84b6e673_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS "worker_certification_specializationID_id_9076ff05_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_social_user_id_8146e70c_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_social_app_id_636a42d7_fk_socialacc;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_social_account_id_951f210e_fk_socialacc;
ALTER TABLE IF EXISTS ONLY public.review_skill_tags DROP CONSTRAINT IF EXISTS "review_skill_tags_workerSpecialization_ce661cf0_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.review_skill_tags DROP CONSTRAINT IF EXISTS "review_skill_tags_reviewID_id_5092dbb6_fk_job_reviews_reviewID";
ALTER TABLE IF EXISTS ONLY public.profiles_workerproduct DROP CONSTRAINT IF EXISTS "profiles_workerprodu_workerID_id_79c64228_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.profiles_workerproduct DROP CONSTRAINT IF EXISTS "profiles_workerprodu_categoryID_id_05fd3863_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS "message_sender_id_a2a2e825_fk_accounts_profile_profileID";
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS "message_senderAgency_id_1e392f6f_fk_accounts_agency_agencyId";
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS "message_conversationID_id_bc59843b_fk_conversat";
ALTER TABLE IF EXISTS ONLY public.message_attachment DROP CONSTRAINT IF EXISTS "message_attachment_messageID_id_4b72e1bb_fk_message_messageID";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_clientID_id_f35c16c3_fk_accounts_clientprofile_id";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_categoryID_id_70143f40_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_cashPaymentApprovedB_7ed3ab69_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_assignedWorkerID_id_9fab1ae7_fk_accounts_workerprofile_id";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_assignedEmployeeID_i_0654ee21_fk_agency_em";
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS "jobs_assignedAgencyFK_id_e16077b8_fk_accounts_agency_agencyId";
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS "job_worker_assignments_jobID_id_7e0fd5c3_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS "job_worker_assignmen_workerID_id_0998a652_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS "job_worker_assignmen_skillSlotID_id_ebcc166e_fk_job_skill";
ALTER TABLE IF EXISTS ONLY public.job_skill_slots DROP CONSTRAINT IF EXISTS "job_skill_slots_specializationID_id_9552b385_fk_specializ";
ALTER TABLE IF EXISTS ONLY public.job_skill_slots DROP CONSTRAINT IF EXISTS "job_skill_slots_jobID_id_da790968_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_reviewerID_id_f663e256_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_revieweeProfileID_id_b7d3247a_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_revieweeID_id_dd84a739_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_revieweeEmployeeID_i_675563af_fk_agency_em";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_revieweeAgencyID_id_9e4a1f26_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_jobID_id_faafb0c7_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_flaggedBy_id_a320e7dc_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_photos DROP CONSTRAINT IF EXISTS "job_photos_jobID_id_7a20d525_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_logs DROP CONSTRAINT IF EXISTS "job_logs_jobID_id_98d5ee9f_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_logs DROP CONSTRAINT IF EXISTS "job_logs_changedBy_id_c84def83_fk_accounts_accounts_accountID";
ALTER TABLE IF EXISTS ONLY public.job_employee_assignments DROP CONSTRAINT IF EXISTS "job_employee_assignments_job_id_73ae29a2_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_employee_assignments DROP CONSTRAINT IF EXISTS job_employee_assignm_employee_id_494ec9c6_fk_agency_em;
ALTER TABLE IF EXISTS ONLY public.job_employee_assignments DROP CONSTRAINT IF EXISTS "job_employee_assignm_assignedBy_id_177295a3_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_disputes DROP CONSTRAINT IF EXISTS "job_disputes_jobID_id_13a7964a_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS "job_applications_workerID_id_218ce27c_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS "job_applications_jobID_id_af6552d1_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS job_applications_applied_skill_slot_i_12f3ea43_fk_job_skill;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.dispute_evidence DROP CONSTRAINT IF EXISTS "dispute_evidence_uploadedBy_id_17b30546_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.dispute_evidence DROP CONSTRAINT IF EXISTS "dispute_evidence_disputeID_id_92feccbf_fk_job_dispu";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_worker_id_c1fa5961_fk_accounts_profile_profileID";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_partici_skill_slot_id_27792a70_fk_job_skill;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_partici_profile_id_f750bb98_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_partici_conversation_id_58e662d4_fk_conversat;
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_lastMessageSender_id_212ad3fe_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_client_id_6121652e_fk_accounts_profile_profileID";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId";
ALTER TABLE IF EXISTS ONLY public.certification_logs DROP CONSTRAINT IF EXISTS "certification_logs_workerID_id_c8ce1c5a_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.certification_logs DROP CONSTRAINT IF EXISTS "certification_logs_reviewedBy_id_37abefe3_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.agency_employees DROP CONSTRAINT IF EXISTS agency_employees_agency_id_cea6dc3f_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.agency_agencykycfile DROP CONSTRAINT IF EXISTS "agency_agencykycfile_agencyKyc_id_0fdb3a43_fk_agency_ag";
ALTER TABLE IF EXISTS ONLY public.agency_agencykyc DROP CONSTRAINT IF EXISTS "agency_agencykyc_reviewedBy_id_46ba9427_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.agency_agencykyc DROP CONSTRAINT IF EXISTS "agency_agencykyc_accountFK_id_0f3bd1fa_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_userreport DROP CONSTRAINT IF EXISTS "adminpanel_userrepor_reviewedBy_id_2238d296_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_userreport DROP CONSTRAINT IF EXISTS "adminpanel_userrepor_reporterFK_id_719fb23f_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_userreport DROP CONSTRAINT IF EXISTS "adminpanel_userrepor_reportedUserFK_id_b0aee279_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_systemroles DROP CONSTRAINT IF EXISTS "adminpanel_systemrol_accountID_id_b80596d8_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticket DROP CONSTRAINT IF EXISTS "adminpanel_supportti_userFK_id_7f238b84_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticketreply DROP CONSTRAINT IF EXISTS "adminpanel_supportti_ticketFK_id_68cec9a2_fk_adminpane";
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticketreply DROP CONSTRAINT IF EXISTS "adminpanel_supportti_senderFK_id_be761933_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticket DROP CONSTRAINT IF EXISTS "adminpanel_supportti_assignedTo_id_ec7f4077_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_platformsettings DROP CONSTRAINT IF EXISTS "adminpanel_platforms_updatedBy_id_99ff4e3b_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_kyclogs DROP CONSTRAINT IF EXISTS "adminpanel_kyclogs_reviewedBy_id_7b3b6785_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_kyclogs DROP CONSTRAINT IF EXISTS "adminpanel_kyclogs_accountFK_id_cc292720_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_cannedresponse DROP CONSTRAINT IF EXISTS "adminpanel_cannedres_createdBy_id_69f34ba6_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_auditlog DROP CONSTRAINT IF EXISTS "adminpanel_auditlog_adminFK_id_4eefb86e_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.adminpanel_adminaccount DROP CONSTRAINT IF EXISTS "adminpanel_adminacco_accountFK_id_eeb69271_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_workerspecialization DROP CONSTRAINT IF EXISTS "accounts_workerspeci_workerID_id_11bc9350_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_workerspecialization DROP CONSTRAINT IF EXISTS "accounts_workerspeci_specializationID_id_a72faa78_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_workerprofile DROP CONSTRAINT IF EXISTS "accounts_workerprofi_profileID_id_dde1700c_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_wallet DROP CONSTRAINT IF EXISTS "accounts_wallet_accountFK_id_29a5de9e_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_userpaymentmethod DROP CONSTRAINT IF EXISTS "accounts_userpayment_accountFK_id_2c4e9955_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_transaction DROP CONSTRAINT IF EXISTS "accounts_transaction_walletID_id_9ee06035_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_transaction DROP CONSTRAINT IF EXISTS "accounts_transaction_relatedJobPosting_id_84d00915_fk_jobs_jobI";
ALTER TABLE IF EXISTS ONLY public.accounts_pushtoken DROP CONSTRAINT IF EXISTS "accounts_pushtoken_accountFK_id_dd0aaf60_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_profile DROP CONSTRAINT IF EXISTS "accounts_profile_accountFK_id_52ee2884_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_notificationsettings DROP CONSTRAINT IF EXISTS "accounts_notificatio_accountFK_id_97e2deff_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_notification DROP CONSTRAINT IF EXISTS "accounts_notificatio_accountFK_id_83e15b07_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_kycfiles DROP CONSTRAINT IF EXISTS "accounts_kycfiles_kycID_id_9ce3c182_fk_accounts_kyc_kycID";
ALTER TABLE IF EXISTS ONLY public.accounts_kyc DROP CONSTRAINT IF EXISTS "accounts_kyc_reviewedBy_id_c6f62ceb_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_kyc DROP CONSTRAINT IF EXISTS "accounts_kyc_accountFK_id_564123ac_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_interestedjobs DROP CONSTRAINT IF EXISTS "accounts_interestedj_specializationID_id_de8a5af8_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_interestedjobs DROP CONSTRAINT IF EXISTS "accounts_interestedj_clientID_id_dac08b1c_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_clientprofile DROP CONSTRAINT IF EXISTS "accounts_clientprofi_profileID_id_fa8b1900_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_barangay DROP CONSTRAINT IF EXISTS "accounts_barangay_city_id_9f1a1154_fk_accounts_city_cityID";
ALTER TABLE IF EXISTS ONLY public.accounts_agency DROP CONSTRAINT IF EXISTS "accounts_agency_accountFK_id_00b00793_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_user_permissions DROP CONSTRAINT IF EXISTS accounts_accounts_us_permission_id_7df1f232_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_user_permissions DROP CONSTRAINT IF EXISTS accounts_accounts_us_accounts_id_001e820c_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_groups DROP CONSTRAINT IF EXISTS accounts_accounts_groups_group_id_d2af1629_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_groups DROP CONSTRAINT IF EXISTS accounts_accounts_gr_accounts_id_a094314b_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts DROP CONSTRAINT IF EXISTS accounts_accounts_banned_by_id_9d6a0a86_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.account_emailconfirmation DROP CONSTRAINT IF EXISTS account_emailconfirm_email_address_id_5b7f8c58_fk_account_e;
ALTER TABLE IF EXISTS ONLY public.account_emailaddress DROP CONSTRAINT IF EXISTS account_emailaddress_user_id_2c513194_fk_accounts_;
DROP INDEX IF EXISTS public."worker_portfolio_workerID_id_010518a8";
DROP INDEX IF EXISTS public."worker_port_workerI_7d29c4_idx";
DROP INDEX IF EXISTS public."worker_materials_workerID_id_98c651ce";
DROP INDEX IF EXISTS public."worker_materials_categoryID_id_bb83eace";
DROP INDEX IF EXISTS public."worker_mate_workerI_77a627_idx";
DROP INDEX IF EXISTS public."worker_mate_workerI_082c93_idx";
DROP INDEX IF EXISTS public.worker_mate_name_b9fee4_idx;
DROP INDEX IF EXISTS public."worker_certifications_workerID_id_e709a48d";
DROP INDEX IF EXISTS public.worker_certifications_verified_by_id_84b6e673;
DROP INDEX IF EXISTS public."worker_certifications_specializationID_id_9076ff05";
DROP INDEX IF EXISTS public."worker_cert_workerI_6b96e2_idx";
DROP INDEX IF EXISTS public.worker_cert_expiry__fe5d02_idx;
DROP INDEX IF EXISTS public.unique_verified_email;
DROP INDEX IF EXISTS public.unique_primary_email;
DROP INDEX IF EXISTS public.unique_non_team_job_application;
DROP INDEX IF EXISTS public.socialaccount_socialtoken_app_id_636a42d7;
DROP INDEX IF EXISTS public.socialaccount_socialtoken_account_id_951f210e;
DROP INDEX IF EXISTS public.socialaccount_socialaccount_user_id_8146e70c;
DROP INDEX IF EXISTS public."review_skill_tags_workerSpecializationID_id_ce661cf0";
DROP INDEX IF EXISTS public."review_skill_tags_reviewID_id_5092dbb6";
DROP INDEX IF EXISTS public."review_skil_workerS_587697_idx";
DROP INDEX IF EXISTS public."review_skil_reviewI_f86a86_idx";
DROP INDEX IF EXISTS public."profiles_workerproduct_workerID_id_79c64228";
DROP INDEX IF EXISTS public."profiles_workerproduct_categoryID_id_05fd3863";
DROP INDEX IF EXISTS public.message_sender_id_a2a2e825;
DROP INDEX IF EXISTS public.message_sender__33ec43_idx;
DROP INDEX IF EXISTS public."message_senderAgency_id_1e392f6f";
DROP INDEX IF EXISTS public."message_isRead_b20976_idx";
DROP INDEX IF EXISTS public."message_conversationID_id_bc59843b";
DROP INDEX IF EXISTS public.message_convers_1671b3_idx;
DROP INDEX IF EXISTS public."message_attachment_messageID_id_4b72e1bb";
DROP INDEX IF EXISTS public.kyc_ai_status_idx;
DROP INDEX IF EXISTS public.jobs_urgency_b2dcee_idx;
DROP INDEX IF EXISTS public.jobs_status_9d014c_idx;
DROP INDEX IF EXISTS public."jobs_clientI_03c7a0_idx";
DROP INDEX IF EXISTS public."jobs_clientID_id_f35c16c3";
DROP INDEX IF EXISTS public."jobs_categoryID_id_70143f40";
DROP INDEX IF EXISTS public.jobs_categor_d47dee_idx;
DROP INDEX IF EXISTS public."jobs_cashPaymentApprovedBy_id_7ed3ab69";
DROP INDEX IF EXISTS public."jobs_assignedWorkerID_id_9fab1ae7";
DROP INDEX IF EXISTS public."jobs_assignedEmployeeID_id_0654ee21";
DROP INDEX IF EXISTS public."jobs_assignedAgencyFK_id_e16077b8";
DROP INDEX IF EXISTS public.jobs_assigne_cc625f_idx;
DROP INDEX IF EXISTS public."job_worker_assignments_workerID_id_0998a652";
DROP INDEX IF EXISTS public."job_worker_assignments_skillSlotID_id_ebcc166e";
DROP INDEX IF EXISTS public."job_worker_assignments_jobID_id_7e0fd5c3";
DROP INDEX IF EXISTS public."job_worker__workerI_574455_idx";
DROP INDEX IF EXISTS public."job_worker__skillSl_c608db_idx";
DROP INDEX IF EXISTS public."job_worker__jobID_i_aacfe5_idx";
DROP INDEX IF EXISTS public."job_skill_slots_specializationID_id_9552b385";
DROP INDEX IF EXISTS public."job_skill_slots_jobID_id_da790968";
DROP INDEX IF EXISTS public.job_skill_s_special_8c143c_idx;
DROP INDEX IF EXISTS public."job_skill_s_jobID_i_04a042_idx";
DROP INDEX IF EXISTS public.job_reviews_status_d2c214_idx;
DROP INDEX IF EXISTS public."job_reviews_reviewerID_id_f663e256";
DROP INDEX IF EXISTS public."job_reviews_revieweeProfileID_id_b7d3247a";
DROP INDEX IF EXISTS public."job_reviews_revieweeID_id_dd84a739";
DROP INDEX IF EXISTS public."job_reviews_revieweeEmployeeID_id_675563af";
DROP INDEX IF EXISTS public."job_reviews_revieweeAgencyID_id_9e4a1f26";
DROP INDEX IF EXISTS public.job_reviews_reviewe_f47e2e_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_c3a832_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_67461b_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_504347_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_1276ae_idx;
DROP INDEX IF EXISTS public."job_reviews_jobID_id_faafb0c7";
DROP INDEX IF EXISTS public."job_reviews_jobID_i_fe8bbe_idx";
DROP INDEX IF EXISTS public."job_reviews_isFlagg_8bb65d_idx";
DROP INDEX IF EXISTS public."job_reviews_flaggedBy_id_a320e7dc";
DROP INDEX IF EXISTS public."job_photos_jobID_id_7a20d525";
DROP INDEX IF EXISTS public."job_logs_newStat_d67ac4_idx";
DROP INDEX IF EXISTS public."job_logs_jobID_id_98d5ee9f";
DROP INDEX IF EXISTS public."job_logs_jobID_i_b5c46a_idx";
DROP INDEX IF EXISTS public."job_logs_changedBy_id_c84def83";
DROP INDEX IF EXISTS public.job_employee_assignments_job_id_73ae29a2;
DROP INDEX IF EXISTS public.job_employee_assignments_employee_id_494ec9c6;
DROP INDEX IF EXISTS public."job_employee_assignments_assignedBy_id_177295a3";
DROP INDEX IF EXISTS public.job_employe_job_id_2d7113_idx;
DROP INDEX IF EXISTS public.job_employe_employe_5d922f_idx;
DROP INDEX IF EXISTS public."job_disputes_jobID_id_13a7964a";
DROP INDEX IF EXISTS public.job_dispute_status_3f7a05_idx;
DROP INDEX IF EXISTS public.job_dispute_priorit_40a747_idx;
DROP INDEX IF EXISTS public."job_dispute_jobID_i_5435ed_idx";
DROP INDEX IF EXISTS public.job_assign_emp_status_idx;
DROP INDEX IF EXISTS public."job_applications_workerID_id_218ce27c";
DROP INDEX IF EXISTS public."job_applications_jobID_id_af6552d1";
DROP INDEX IF EXISTS public.job_applications_applied_skill_slot_id_12f3ea43;
DROP INDEX IF EXISTS public."job_applica_workerI_027e10_idx";
DROP INDEX IF EXISTS public.job_applica_status_08790f_idx;
DROP INDEX IF EXISTS public."job_applica_jobID_i_c676f8_idx";
DROP INDEX IF EXISTS public.job_applica_applied_237261_idx;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public."dispute_evidence_uploadedBy_id_17b30546";
DROP INDEX IF EXISTS public."dispute_evidence_disputeID_id_92feccbf";
DROP INDEX IF EXISTS public.conversation_worker_id_c1fa5961;
DROP INDEX IF EXISTS public."conversation_relatedJobPosting_id_e787baf8";
DROP INDEX IF EXISTS public.conversation_participants_skill_slot_id_27792a70;
DROP INDEX IF EXISTS public.conversation_participants_profile_id_f750bb98;
DROP INDEX IF EXISTS public.conversation_participants_conversation_id_58e662d4;
DROP INDEX IF EXISTS public."conversation_lastMessageSender_id_212ad3fe";
DROP INDEX IF EXISTS public.conversation_client_id_6121652e;
DROP INDEX IF EXISTS public.conversation_agency_id_5b03fc82;
DROP INDEX IF EXISTS public.conversatio_worker__cc2b64_idx;
DROP INDEX IF EXISTS public.conversatio_status_7e2047_idx;
DROP INDEX IF EXISTS public.conversatio_related_6f5495_idx;
DROP INDEX IF EXISTS public.conversatio_profile_7a3caa_idx;
DROP INDEX IF EXISTS public.conversatio_convers_763591_idx;
DROP INDEX IF EXISTS public.conversatio_client__5b2f1f_idx;
DROP INDEX IF EXISTS public.conversatio_agency__90e6b8_idx;
DROP INDEX IF EXISTS public."certification_logs_workerID_id_c8ce1c5a";
DROP INDEX IF EXISTS public."certification_logs_reviewedBy_id_37abefe3";
DROP INDEX IF EXISTS public."certificati_workerI_adad02_idx";
DROP INDEX IF EXISTS public.certificati_certifi_eead3c_idx;
DROP INDEX IF EXISTS public.certificati_action_ea4a2f_idx;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
DROP INDEX IF EXISTS public.agency_employees_agency_id_cea6dc3f;
DROP INDEX IF EXISTS public."agency_empl_totalJo_532418_idx";
DROP INDEX IF EXISTS public.agency_empl_rating_2ae8be_idx;
DROP INDEX IF EXISTS public.agency_empl_agency__8ae1c3_idx;
DROP INDEX IF EXISTS public.agency_empl_agency__4dc656_idx;
DROP INDEX IF EXISTS public."agency_agencykycfile_agencyKyc_id_0fdb3a43";
DROP INDEX IF EXISTS public."agency_agencykyc_reviewedBy_id_46ba9427";
DROP INDEX IF EXISTS public."agency_agencykyc_accountFK_id_0f3bd1fa";
DROP INDEX IF EXISTS public."adminpanel_userreport_reviewedBy_id_2238d296";
DROP INDEX IF EXISTS public."adminpanel_userreport_reporterFK_id_719fb23f";
DROP INDEX IF EXISTS public."adminpanel_userreport_reportedUserFK_id_b0aee279";
DROP INDEX IF EXISTS public."adminpanel_systemroles_accountID_id_b80596d8";
DROP INDEX IF EXISTS public."adminpanel_supportticketreply_ticketFK_id_68cec9a2";
DROP INDEX IF EXISTS public."adminpanel_supportticketreply_senderFK_id_be761933";
DROP INDEX IF EXISTS public."adminpanel_supportticket_userFK_id_7f238b84";
DROP INDEX IF EXISTS public."adminpanel_supportticket_assignedTo_id_ec7f4077";
DROP INDEX IF EXISTS public."adminpanel_platformsettings_updatedBy_id_99ff4e3b";
DROP INDEX IF EXISTS public."adminpanel_kyclogs_reviewedBy_id_7b3b6785";
DROP INDEX IF EXISTS public."adminpanel_kyclogs_accountFK_id_cc292720";
DROP INDEX IF EXISTS public."adminpanel_cannedresponse_createdBy_id_69f34ba6";
DROP INDEX IF EXISTS public."adminpanel_auditlog_adminFK_id_4eefb86e";
DROP INDEX IF EXISTS public.adminpanel__status_bb623a_idx;
DROP INDEX IF EXISTS public.adminpanel__status_694d0c_idx;
DROP INDEX IF EXISTS public.adminpanel__role_aca1c5_idx;
DROP INDEX IF EXISTS public.adminpanel__reviewe_a8552e_idx;
DROP INDEX IF EXISTS public."adminpanel__reportT_47a4b1_idx";
DROP INDEX IF EXISTS public.adminpanel__priorit_cb784b_idx;
DROP INDEX IF EXISTS public."adminpanel__isActiv_aca720_idx";
DROP INDEX IF EXISTS public."adminpanel__entityT_aea4a2_idx";
DROP INDEX IF EXISTS public."adminpanel__entityT_72b6c5_idx";
DROP INDEX IF EXISTS public.adminpanel__created_8a9f85_idx;
DROP INDEX IF EXISTS public.adminpanel__created_3c5926_idx;
DROP INDEX IF EXISTS public.adminpanel__created_301685_idx;
DROP INDEX IF EXISTS public.adminpanel__categor_11a477_idx;
DROP INDEX IF EXISTS public.adminpanel__assigne_460e54_idx;
DROP INDEX IF EXISTS public."adminpanel__adminFK_d93624_idx";
DROP INDEX IF EXISTS public.adminpanel__action_ffbe16_idx;
DROP INDEX IF EXISTS public.adminpanel__action_fac12d_idx;
DROP INDEX IF EXISTS public.adminpanel__account_0675e3_idx;
DROP INDEX IF EXISTS public."accounts_workerspecialization_workerID_id_11bc9350";
DROP INDEX IF EXISTS public."accounts_workerspecialization_specializationID_id_a72faa78";
DROP INDEX IF EXISTS public.accounts_wa_account_5c6166_idx;
DROP INDEX IF EXISTS public."accounts_userpaymentmethod_accountFK_id_2c4e9955";
DROP INDEX IF EXISTS public."accounts_transaction_xenditInvoiceID_6f1c3fe4_like";
DROP INDEX IF EXISTS public."accounts_transaction_walletID_id_9ee06035";
DROP INDEX IF EXISTS public."accounts_transaction_relatedJobPosting_id_84d00915";
DROP INDEX IF EXISTS public."accounts_tr_xenditI_348817_idx";
DROP INDEX IF EXISTS public."accounts_tr_xenditE_a6ad2c_idx";
DROP INDEX IF EXISTS public."accounts_tr_walletI_417c5f_idx";
DROP INDEX IF EXISTS public.accounts_tr_transac_c2a5d5_idx;
DROP INDEX IF EXISTS public.accounts_tr_status_c95c77_idx;
DROP INDEX IF EXISTS public.accounts_tr_referen_0f1695_idx;
DROP INDEX IF EXISTS public."accounts_pushtoken_pushToken_e1af6fba_like";
DROP INDEX IF EXISTS public."accounts_pushtoken_accountFK_id_dd0aaf60";
DROP INDEX IF EXISTS public."accounts_pu_pushTok_d919a9_idx";
DROP INDEX IF EXISTS public.accounts_pu_account_956577_idx;
DROP INDEX IF EXISTS public."accounts_profile_accountFK_id_52ee2884";
DROP INDEX IF EXISTS public."accounts_notification_accountFK_id_83e15b07";
DROP INDEX IF EXISTS public.accounts_no_account_992e61_idx;
DROP INDEX IF EXISTS public.accounts_no_account_225939_idx;
DROP INDEX IF EXISTS public."accounts_kycfiles_kycID_id_9ce3c182";
DROP INDEX IF EXISTS public."accounts_kyc_reviewedBy_id_c6f62ceb";
DROP INDEX IF EXISTS public."accounts_kyc_accountFK_id_564123ac";
DROP INDEX IF EXISTS public."accounts_interestedjobs_specializationID_id_de8a5af8";
DROP INDEX IF EXISTS public."accounts_interestedjobs_clientID_id_dac08b1c";
DROP INDEX IF EXISTS public.accounts_city_name_f214d25a_like;
DROP INDEX IF EXISTS public.accounts_ci_provinc_3bc3e1_idx;
DROP INDEX IF EXISTS public.accounts_ci_name_3741a5_idx;
DROP INDEX IF EXISTS public.accounts_barangay_city_id_9f1a1154;
DROP INDEX IF EXISTS public.accounts_ba_name_b64a2f_idx;
DROP INDEX IF EXISTS public.accounts_ba_city_id_e22fce_idx;
DROP INDEX IF EXISTS public."accounts_agency_accountFK_id_00b00793";
DROP INDEX IF EXISTS public.accounts_accounts_user_permissions_permission_id_7df1f232;
DROP INDEX IF EXISTS public.accounts_accounts_user_permissions_accounts_id_001e820c;
DROP INDEX IF EXISTS public.accounts_accounts_groups_group_id_d2af1629;
DROP INDEX IF EXISTS public.accounts_accounts_groups_accounts_id_a094314b;
DROP INDEX IF EXISTS public.accounts_accounts_email_da8a4382_like;
DROP INDEX IF EXISTS public.accounts_accounts_banned_by_id_9d6a0a86;
DROP INDEX IF EXISTS public.account_emailconfirmation_key_f43612bd_like;
DROP INDEX IF EXISTS public.account_emailconfirmation_email_address_id_5b7f8c58;
DROP INDEX IF EXISTS public.account_emailaddress_user_id_2c513194;
DROP INDEX IF EXISTS public.account_emailaddress_email_03be32b2_like;
DROP INDEX IF EXISTS public.account_emailaddress_email_03be32b2;
ALTER TABLE IF EXISTS ONLY public.worker_portfolio DROP CONSTRAINT IF EXISTS worker_portfolio_pkey;
ALTER TABLE IF EXISTS ONLY public.worker_materials DROP CONSTRAINT IF EXISTS worker_materials_pkey;
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS worker_certifications_pkey;
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS unique_worker_per_job;
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS unique_slot_position;
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS unique_job_skill_slot_application;
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS unique_job_conversation;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS unique_conversation_participant;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_socialtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialapp DROP CONSTRAINT IF EXISTS socialaccount_socialapp_pkey;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_socialaccount_provider_uid_fc810c6e_uniq;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_socialaccount_pkey;
ALTER TABLE IF EXISTS ONLY public.review_skill_tags DROP CONSTRAINT IF EXISTS "review_skill_tags_reviewID_id_workerSpecia_87b0b8fc_uniq";
ALTER TABLE IF EXISTS ONLY public.review_skill_tags DROP CONSTRAINT IF EXISTS review_skill_tags_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles_workerproduct DROP CONSTRAINT IF EXISTS profiles_workerproduct_pkey;
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS message_pkey;
ALTER TABLE IF EXISTS ONLY public.message_attachment DROP CONSTRAINT IF EXISTS message_attachment_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_worker_assignments DROP CONSTRAINT IF EXISTS job_worker_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.job_skill_slots DROP CONSTRAINT IF EXISTS job_skill_slots_pkey;
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS job_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.job_photos DROP CONSTRAINT IF EXISTS job_photos_pkey;
ALTER TABLE IF EXISTS ONLY public.job_logs DROP CONSTRAINT IF EXISTS job_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_employee_assignments DROP CONSTRAINT IF EXISTS job_employee_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.job_employee_assignments DROP CONSTRAINT IF EXISTS job_employee_assignments_job_id_employee_id_458658f4_uniq;
ALTER TABLE IF EXISTS ONLY public.job_disputes DROP CONSTRAINT IF EXISTS job_disputes_pkey;
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS job_applications_pkey;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.dispute_evidence DROP CONSTRAINT IF EXISTS dispute_evidence_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS conversation_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.certification_logs DROP CONSTRAINT IF EXISTS certification_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
ALTER TABLE IF EXISTS ONLY public.agency_employees DROP CONSTRAINT IF EXISTS agency_employees_pkey;
ALTER TABLE IF EXISTS ONLY public.agency_agencykycfile DROP CONSTRAINT IF EXISTS agency_agencykycfile_pkey;
ALTER TABLE IF EXISTS ONLY public.agency_agencykyc DROP CONSTRAINT IF EXISTS agency_agencykyc_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_userreport DROP CONSTRAINT IF EXISTS adminpanel_userreport_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_systemroles DROP CONSTRAINT IF EXISTS adminpanel_systemroles_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticketreply DROP CONSTRAINT IF EXISTS adminpanel_supportticketreply_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_supportticket DROP CONSTRAINT IF EXISTS adminpanel_supportticket_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_platformsettings DROP CONSTRAINT IF EXISTS adminpanel_platformsettings_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_kyclogs DROP CONSTRAINT IF EXISTS adminpanel_kyclogs_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_faq DROP CONSTRAINT IF EXISTS adminpanel_faq_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_cannedresponse DROP CONSTRAINT IF EXISTS adminpanel_cannedresponse_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_auditlog DROP CONSTRAINT IF EXISTS adminpanel_auditlog_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_adminaccount DROP CONSTRAINT IF EXISTS adminpanel_adminaccount_pkey;
ALTER TABLE IF EXISTS ONLY public.adminpanel_adminaccount DROP CONSTRAINT IF EXISTS "adminpanel_adminaccount_accountFK_id_key";
ALTER TABLE IF EXISTS ONLY public.accounts_workerspecialization DROP CONSTRAINT IF EXISTS accounts_workerspecialization_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_workerprofile DROP CONSTRAINT IF EXISTS "accounts_workerprofile_profileID_id_key";
ALTER TABLE IF EXISTS ONLY public.accounts_workerprofile DROP CONSTRAINT IF EXISTS accounts_workerprofile_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_wallet DROP CONSTRAINT IF EXISTS accounts_wallet_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_wallet DROP CONSTRAINT IF EXISTS "accounts_wallet_accountFK_id_key";
ALTER TABLE IF EXISTS ONLY public.accounts_userpaymentmethod DROP CONSTRAINT IF EXISTS accounts_userpaymentmethod_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_transaction DROP CONSTRAINT IF EXISTS "accounts_transaction_xenditInvoiceID_key";
ALTER TABLE IF EXISTS ONLY public.accounts_transaction DROP CONSTRAINT IF EXISTS accounts_transaction_pkey;
ALTER TABLE IF EXISTS ONLY public.specializations DROP CONSTRAINT IF EXISTS accounts_specializations_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_pushtoken DROP CONSTRAINT IF EXISTS "accounts_pushtoken_pushToken_key";
ALTER TABLE IF EXISTS ONLY public.accounts_pushtoken DROP CONSTRAINT IF EXISTS accounts_pushtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_profile DROP CONSTRAINT IF EXISTS accounts_profile_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_notificationsettings DROP CONSTRAINT IF EXISTS accounts_notificationsettings_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_notificationsettings DROP CONSTRAINT IF EXISTS "accounts_notificationsettings_accountFK_id_key";
ALTER TABLE IF EXISTS ONLY public.accounts_notification DROP CONSTRAINT IF EXISTS accounts_notification_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_kycfiles DROP CONSTRAINT IF EXISTS accounts_kycfiles_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_kyc DROP CONSTRAINT IF EXISTS accounts_kyc_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_interestedjobs DROP CONSTRAINT IF EXISTS accounts_interestedjobs_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_clientprofile DROP CONSTRAINT IF EXISTS "accounts_clientprofile_profileID_id_key";
ALTER TABLE IF EXISTS ONLY public.accounts_clientprofile DROP CONSTRAINT IF EXISTS accounts_clientprofile_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_city DROP CONSTRAINT IF EXISTS accounts_city_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_city DROP CONSTRAINT IF EXISTS accounts_city_name_key;
ALTER TABLE IF EXISTS ONLY public.accounts_barangay DROP CONSTRAINT IF EXISTS accounts_barangay_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_barangay DROP CONSTRAINT IF EXISTS accounts_barangay_name_city_id_abb1e7d9_uniq;
ALTER TABLE IF EXISTS ONLY public.accounts_agency DROP CONSTRAINT IF EXISTS accounts_agency_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_user_permissions DROP CONSTRAINT IF EXISTS accounts_accounts_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_user_permissions DROP CONSTRAINT IF EXISTS accounts_accounts_user_p_accounts_id_permission_i_310c5a2e_uniq;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts DROP CONSTRAINT IF EXISTS accounts_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_groups DROP CONSTRAINT IF EXISTS accounts_accounts_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts_groups DROP CONSTRAINT IF EXISTS accounts_accounts_groups_accounts_id_group_id_fe616882_uniq;
ALTER TABLE IF EXISTS ONLY public.accounts_accounts DROP CONSTRAINT IF EXISTS accounts_accounts_email_key;
ALTER TABLE IF EXISTS ONLY public.account_emailconfirmation DROP CONSTRAINT IF EXISTS account_emailconfirmation_pkey;
ALTER TABLE IF EXISTS ONLY public.account_emailconfirmation DROP CONSTRAINT IF EXISTS account_emailconfirmation_key_key;
ALTER TABLE IF EXISTS ONLY public.account_emailaddress DROP CONSTRAINT IF EXISTS account_emailaddress_user_id_email_987c8728_uniq;
ALTER TABLE IF EXISTS ONLY public.account_emailaddress DROP CONSTRAINT IF EXISTS account_emailaddress_pkey;
DROP TABLE IF EXISTS public.worker_portfolio;
DROP TABLE IF EXISTS public.worker_materials;
DROP TABLE IF EXISTS public.worker_certifications;
DROP TABLE IF EXISTS public.socialaccount_socialtoken;
DROP TABLE IF EXISTS public.socialaccount_socialapp;
DROP TABLE IF EXISTS public.socialaccount_socialaccount;
DROP TABLE IF EXISTS public.review_skill_tags;
DROP TABLE IF EXISTS public.profiles_workerproduct;
DROP TABLE IF EXISTS public.message_attachment;
DROP TABLE IF EXISTS public.message;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.job_worker_assignments;
DROP TABLE IF EXISTS public.job_skill_slots;
DROP TABLE IF EXISTS public.job_reviews;
DROP TABLE IF EXISTS public.job_photos;
DROP TABLE IF EXISTS public.job_logs;
DROP TABLE IF EXISTS public.job_employee_assignments;
DROP TABLE IF EXISTS public.job_disputes;
DROP TABLE IF EXISTS public.job_applications;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.dispute_evidence;
DROP TABLE IF EXISTS public.conversation_participants;
DROP TABLE IF EXISTS public.conversation;
DROP TABLE IF EXISTS public.certification_logs;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP TABLE IF EXISTS public.agency_employees;
DROP TABLE IF EXISTS public.agency_agencykycfile;
DROP TABLE IF EXISTS public.agency_agencykyc;
DROP TABLE IF EXISTS public.adminpanel_userreport;
DROP TABLE IF EXISTS public.adminpanel_systemroles;
DROP TABLE IF EXISTS public.adminpanel_supportticketreply;
DROP TABLE IF EXISTS public.adminpanel_supportticket;
DROP TABLE IF EXISTS public.adminpanel_platformsettings;
DROP TABLE IF EXISTS public.adminpanel_kyclogs;
DROP TABLE IF EXISTS public.adminpanel_faq;
DROP TABLE IF EXISTS public.adminpanel_cannedresponse;
DROP TABLE IF EXISTS public.adminpanel_auditlog;
DROP TABLE IF EXISTS public.adminpanel_adminaccount;
DROP TABLE IF EXISTS public.accounts_workerspecialization;
DROP TABLE IF EXISTS public.accounts_workerprofile;
DROP TABLE IF EXISTS public.accounts_wallet;
DROP TABLE IF EXISTS public.accounts_userpaymentmethod;
DROP TABLE IF EXISTS public.accounts_transaction;
DROP TABLE IF EXISTS public.specializations;
DROP TABLE IF EXISTS public.accounts_pushtoken;
DROP TABLE IF EXISTS public.accounts_profile;
DROP TABLE IF EXISTS public.accounts_notificationsettings;
DROP TABLE IF EXISTS public.accounts_notification;
DROP TABLE IF EXISTS public.accounts_kycfiles;
DROP TABLE IF EXISTS public.accounts_kyc;
DROP TABLE IF EXISTS public.accounts_interestedjobs;
DROP TABLE IF EXISTS public.accounts_clientprofile;
DROP TABLE IF EXISTS public.accounts_city;
DROP TABLE IF EXISTS public.accounts_barangay;
DROP TABLE IF EXISTS public.accounts_agency;
DROP TABLE IF EXISTS public.accounts_accounts_user_permissions;
DROP TABLE IF EXISTS public.accounts_accounts_groups;
DROP TABLE IF EXISTS public.accounts_accounts;
DROP TABLE IF EXISTS public.account_emailconfirmation;
DROP TABLE IF EXISTS public.account_emailaddress;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pg_trgm;
--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_emailaddress; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.account_emailaddress (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    verified boolean NOT NULL,
    "primary" boolean NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.account_emailaddress OWNER TO iayos_user;

--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.account_emailaddress ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.account_emailaddress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: account_emailconfirmation; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.account_emailconfirmation (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    sent timestamp with time zone,
    key character varying(64) NOT NULL,
    email_address_id integer NOT NULL
);


ALTER TABLE public.account_emailconfirmation OWNER TO iayos_user;

--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.account_emailconfirmation ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.account_emailconfirmation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_accounts; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_accounts (
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    "accountID" bigint NOT NULL,
    email character varying(64) NOT NULL,
    password character varying(128) NOT NULL,
    "isVerified" boolean NOT NULL,
    is_active boolean NOT NULL,
    is_staff boolean NOT NULL,
    "verifyToken" character varying(255),
    "verifyTokenExpiry" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    province character varying(100) NOT NULL,
    street_address character varying(255) NOT NULL,
    "KYCVerified" boolean NOT NULL,
    banned_at timestamp with time zone,
    banned_by_id bigint,
    banned_reason text,
    is_banned boolean NOT NULL,
    is_suspended boolean NOT NULL,
    suspended_reason text,
    suspended_until timestamp with time zone
);


ALTER TABLE public.accounts_accounts OWNER TO iayos_user;

--
-- Name: accounts_accounts_accountID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_accounts ALTER COLUMN "accountID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_accounts_accountID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_accounts_groups; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_accounts_groups (
    id bigint NOT NULL,
    accounts_id bigint NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.accounts_accounts_groups OWNER TO iayos_user;

--
-- Name: accounts_accounts_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_accounts_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_accounts_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_accounts_user_permissions; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_accounts_user_permissions (
    id bigint NOT NULL,
    accounts_id bigint NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.accounts_accounts_user_permissions OWNER TO iayos_user;

--
-- Name: accounts_accounts_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_accounts_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_accounts_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_agency; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_agency (
    "agencyId" bigint NOT NULL,
    "businessName" character varying(50) NOT NULL,
    "businessDesc" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    province character varying(100) NOT NULL,
    street_address character varying(255) NOT NULL,
    "contactNumber" character varying(11) NOT NULL
);


ALTER TABLE public.accounts_agency OWNER TO iayos_user;

--
-- Name: accounts_agency_agencyId_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_agency ALTER COLUMN "agencyId" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_agency_agencyId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_barangay; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_barangay (
    "barangayID" integer NOT NULL,
    name character varying(100) NOT NULL,
    "zipCode" character varying(10),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    city_id integer NOT NULL
);


ALTER TABLE public.accounts_barangay OWNER TO iayos_user;

--
-- Name: accounts_barangay_barangayID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_barangay ALTER COLUMN "barangayID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_barangay_barangayID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_city; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_city (
    "cityID" integer NOT NULL,
    name character varying(100) NOT NULL,
    province character varying(100) NOT NULL,
    region character varying(100) NOT NULL,
    "zipCode" character varying(10),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.accounts_city OWNER TO iayos_user;

--
-- Name: accounts_city_cityID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_city ALTER COLUMN "cityID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_city_cityID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_clientprofile; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_clientprofile (
    id bigint NOT NULL,
    description character varying(350) NOT NULL,
    "totalJobsPosted" integer NOT NULL,
    "clientRating" integer NOT NULL,
    "profileID_id" bigint NOT NULL,
    "activeJobsCount" integer NOT NULL
);


ALTER TABLE public.accounts_clientprofile OWNER TO iayos_user;

--
-- Name: accounts_clientprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_clientprofile ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_clientprofile_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_interestedjobs; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_interestedjobs (
    id bigint NOT NULL,
    "clientID_id" bigint NOT NULL,
    "specializationID_id" bigint NOT NULL
);


ALTER TABLE public.accounts_interestedjobs OWNER TO iayos_user;

--
-- Name: accounts_interestedjobs_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_interestedjobs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_interestedjobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_kyc; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_kyc (
    "kycID" bigint NOT NULL,
    kyc_status character varying(10) NOT NULL,
    "reviewedAt" timestamp with time zone NOT NULL,
    notes text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    "reviewedBy_id" bigint,
    "rejectionCategory" character varying(30),
    "rejectionReason" text NOT NULL,
    "resubmissionCount" integer NOT NULL,
    "maxResubmissions" integer NOT NULL
);


ALTER TABLE public.accounts_kyc OWNER TO iayos_user;

--
-- Name: accounts_kyc_kycID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_kyc ALTER COLUMN "kycID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_kyc_kycID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_kycfiles; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_kycfiles (
    "kycFileID" bigint NOT NULL,
    "idType" character varying(20),
    "fileURL" character varying(255) NOT NULL,
    "fileName" character varying(255),
    "fileSize" integer,
    "uploadedAt" timestamp with time zone NOT NULL,
    "kycID_id" bigint NOT NULL,
    ai_verification_status character varying(20) NOT NULL,
    face_detected boolean,
    face_count integer,
    face_confidence double precision,
    ocr_text text,
    ocr_confidence double precision,
    quality_score double precision,
    ai_confidence_score double precision,
    ai_rejection_reason character varying(50),
    ai_rejection_message character varying(500),
    ai_warnings jsonb,
    ai_details jsonb,
    verified_at timestamp with time zone
);


ALTER TABLE public.accounts_kycfiles OWNER TO iayos_user;

--
-- Name: accounts_kycfiles_kycFileID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_kycfiles ALTER COLUMN "kycFileID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_kycfiles_kycFileID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_notification; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_notification (
    "notificationID" bigint NOT NULL,
    "notificationType" character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    "isRead" boolean NOT NULL,
    "relatedKYCLogID" bigint,
    "createdAt" timestamp with time zone NOT NULL,
    "readAt" timestamp with time zone,
    "accountFK_id" bigint NOT NULL,
    "relatedJobID" bigint,
    "relatedApplicationID" bigint
);


ALTER TABLE public.accounts_notification OWNER TO iayos_user;

--
-- Name: accounts_notification_notificationID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_notification ALTER COLUMN "notificationID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_notification_notificationID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_notificationsettings; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_notificationsettings (
    "settingsID" bigint NOT NULL,
    "pushEnabled" boolean NOT NULL,
    "soundEnabled" boolean NOT NULL,
    "jobUpdates" boolean NOT NULL,
    messages boolean NOT NULL,
    payments boolean NOT NULL,
    reviews boolean NOT NULL,
    "kycUpdates" boolean NOT NULL,
    "doNotDisturbStart" time without time zone,
    "doNotDisturbEnd" time without time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL
);


ALTER TABLE public.accounts_notificationsettings OWNER TO iayos_user;

--
-- Name: accounts_notificationsettings_settingsID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_notificationsettings ALTER COLUMN "settingsID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_notificationsettings_settingsID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_profile; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_profile (
    "profileID" bigint NOT NULL,
    "profileImg" character varying(500),
    "firstName" character varying(24) NOT NULL,
    "lastName" character varying(24) NOT NULL,
    "contactNum" character varying(11) NOT NULL,
    "birthDate" date NOT NULL,
    "profileType" character varying(10),
    "accountFK_id" bigint NOT NULL,
    "middleName" character varying(24),
    latitude numeric(10,8),
    location_sharing_enabled boolean NOT NULL,
    location_updated_at timestamp with time zone,
    longitude numeric(11,8)
);


ALTER TABLE public.accounts_profile OWNER TO iayos_user;

--
-- Name: accounts_profile_profileID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_profile ALTER COLUMN "profileID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_profile_profileID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_pushtoken; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_pushtoken (
    "tokenID" bigint NOT NULL,
    "pushToken" character varying(500) NOT NULL,
    "deviceType" character varying(20) NOT NULL,
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "lastUsed" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL
);


ALTER TABLE public.accounts_pushtoken OWNER TO iayos_user;

--
-- Name: accounts_pushtoken_tokenID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_pushtoken ALTER COLUMN "tokenID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_pushtoken_tokenID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: specializations; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.specializations (
    "specializationID" bigint NOT NULL,
    "specializationName" character varying(250) NOT NULL,
    "averageProjectCostMax" numeric(10,2) NOT NULL,
    "averageProjectCostMin" numeric(10,2) NOT NULL,
    description text,
    "minimumRate" numeric(10,2) NOT NULL,
    "rateType" character varying(20) NOT NULL,
    "skillLevel" character varying(20) NOT NULL
);


ALTER TABLE public.specializations OWNER TO iayos_user;

--
-- Name: accounts_specializations_specializationID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.specializations ALTER COLUMN "specializationID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_specializations_specializationID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_transaction; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_transaction (
    "transactionID" bigint NOT NULL,
    "transactionType" character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    "balanceAfter" numeric(10,2) NOT NULL,
    status character varying(15) NOT NULL,
    description character varying(255),
    "referenceNumber" character varying(100),
    "paymentMethod" character varying(20),
    "createdAt" timestamp with time zone NOT NULL,
    "completedAt" timestamp with time zone,
    "relatedJobPosting_id" bigint,
    "walletID_id" bigint NOT NULL,
    "invoiceURL" character varying(500),
    "xenditExternalID" character varying(255),
    "xenditInvoiceID" character varying(255),
    "xenditPaymentChannel" character varying(50),
    "xenditPaymentID" character varying(255),
    "xenditPaymentMethod" character varying(50)
);


ALTER TABLE public.accounts_transaction OWNER TO iayos_user;

--
-- Name: accounts_transaction_transactionID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_transaction ALTER COLUMN "transactionID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_transaction_transactionID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_userpaymentmethod; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_userpaymentmethod (
    id bigint NOT NULL,
    "methodType" character varying(10) NOT NULL,
    "accountName" character varying(255) NOT NULL,
    "accountNumber" character varying(50) NOT NULL,
    "bankName" character varying(100),
    "isPrimary" boolean NOT NULL,
    "isVerified" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL
);


ALTER TABLE public.accounts_userpaymentmethod OWNER TO iayos_user;

--
-- Name: accounts_userpaymentmethod_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_userpaymentmethod ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_userpaymentmethod_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_wallet; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_wallet (
    "walletID" bigint NOT NULL,
    balance numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    "reservedBalance" numeric(10,2) NOT NULL,
    "pendingEarnings" numeric(10,2) NOT NULL
);


ALTER TABLE public.accounts_wallet OWNER TO iayos_user;

--
-- Name: accounts_wallet_walletID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_wallet ALTER COLUMN "walletID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."accounts_wallet_walletID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_workerprofile; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_workerprofile (
    id bigint NOT NULL,
    description character varying(350) NOT NULL,
    "workerRating" integer NOT NULL,
    "totalEarningGross" numeric(10,2) NOT NULL,
    availability_status character varying(10) NOT NULL,
    "profileID_id" bigint NOT NULL,
    bio character varying(200) NOT NULL,
    hourly_rate numeric(10,2),
    profile_completion_percentage integer NOT NULL,
    soft_skills text NOT NULL
);


ALTER TABLE public.accounts_workerprofile OWNER TO iayos_user;

--
-- Name: accounts_workerprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_workerprofile ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_workerprofile_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: accounts_workerspecialization; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.accounts_workerspecialization (
    id bigint NOT NULL,
    "experienceYears" integer NOT NULL,
    certification character varying(120) NOT NULL,
    "specializationID_id" bigint NOT NULL,
    "workerID_id" bigint NOT NULL
);


ALTER TABLE public.accounts_workerspecialization OWNER TO iayos_user;

--
-- Name: accounts_workerspecialization_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.accounts_workerspecialization ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accounts_workerspecialization_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_adminaccount; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_adminaccount (
    "adminID" bigint NOT NULL,
    role character varying(15) NOT NULL,
    permissions jsonb NOT NULL,
    "isActive" boolean NOT NULL,
    "lastLogin" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL
);


ALTER TABLE public.adminpanel_adminaccount OWNER TO iayos_user;

--
-- Name: adminpanel_adminaccount_adminID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_adminaccount ALTER COLUMN "adminID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_adminaccount_adminID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_auditlog; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_auditlog (
    "auditLogID" bigint NOT NULL,
    "adminEmail" character varying(64) NOT NULL,
    action character varying(30) NOT NULL,
    "entityType" character varying(20) NOT NULL,
    "entityID" character varying(50) NOT NULL,
    details jsonb NOT NULL,
    "beforeValue" jsonb,
    "afterValue" jsonb,
    "ipAddress" inet,
    "userAgent" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "adminFK_id" bigint
);


ALTER TABLE public.adminpanel_auditlog OWNER TO iayos_user;

--
-- Name: adminpanel_auditlog_auditLogID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_auditlog ALTER COLUMN "auditLogID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_auditlog_auditLogID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_cannedresponse; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_cannedresponse (
    "responseID" bigint NOT NULL,
    title character varying(100) NOT NULL,
    content text NOT NULL,
    category character varying(20) NOT NULL,
    shortcuts jsonb NOT NULL,
    "usageCount" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "createdBy_id" bigint
);


ALTER TABLE public.adminpanel_cannedresponse OWNER TO iayos_user;

--
-- Name: adminpanel_cannedresponse_responseID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_cannedresponse ALTER COLUMN "responseID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_cannedresponse_responseID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_faq; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_faq (
    "faqID" bigint NOT NULL,
    question character varying(500) NOT NULL,
    answer text NOT NULL,
    category character varying(20) NOT NULL,
    "sortOrder" integer NOT NULL,
    "viewCount" integer NOT NULL,
    "isPublished" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.adminpanel_faq OWNER TO iayos_user;

--
-- Name: adminpanel_faq_faqID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_faq ALTER COLUMN "faqID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_faq_faqID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_kyclogs; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_kyclogs (
    "kycLogID" bigint NOT NULL,
    action character varying(10) NOT NULL,
    "reviewedAt" timestamp with time zone NOT NULL,
    reason text NOT NULL,
    "userEmail" character varying(64) NOT NULL,
    "userAccountID" bigint NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    "kycID" bigint NOT NULL,
    "reviewedBy_id" bigint,
    "kycType" character varying(10) NOT NULL
);


ALTER TABLE public.adminpanel_kyclogs OWNER TO iayos_user;

--
-- Name: adminpanel_kyclogs_logID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_kyclogs ALTER COLUMN "kycLogID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_kyclogs_logID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_platformsettings; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_platformsettings (
    "settingsID" bigint NOT NULL,
    "platformFeePercentage" numeric(5,2) NOT NULL,
    "escrowHoldingDays" integer NOT NULL,
    "maxJobBudget" numeric(12,2) NOT NULL,
    "minJobBudget" numeric(12,2) NOT NULL,
    "workerVerificationRequired" boolean NOT NULL,
    "autoApproveKYC" boolean NOT NULL,
    "kycDocumentExpiryDays" integer NOT NULL,
    "maintenanceMode" boolean NOT NULL,
    "sessionTimeoutMinutes" integer NOT NULL,
    "maxUploadSizeMB" integer NOT NULL,
    "lastUpdated" timestamp with time zone NOT NULL,
    "updatedBy_id" bigint
);


ALTER TABLE public.adminpanel_platformsettings OWNER TO iayos_user;

--
-- Name: adminpanel_platformsettings_settingsID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_platformsettings ALTER COLUMN "settingsID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_platformsettings_settingsID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_supportticket; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_supportticket (
    "ticketID" bigint NOT NULL,
    subject character varying(200) NOT NULL,
    category character varying(20) NOT NULL,
    priority character varying(10) NOT NULL,
    status character varying(15) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "lastReplyAt" timestamp with time zone,
    "resolvedAt" timestamp with time zone,
    "assignedTo_id" bigint,
    "userFK_id" bigint NOT NULL
);


ALTER TABLE public.adminpanel_supportticket OWNER TO iayos_user;

--
-- Name: adminpanel_supportticket_ticketID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_supportticket ALTER COLUMN "ticketID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_supportticket_ticketID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_supportticketreply; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_supportticketreply (
    "replyID" bigint NOT NULL,
    content text NOT NULL,
    "isSystemMessage" boolean NOT NULL,
    "attachmentURL" character varying(500),
    "createdAt" timestamp with time zone NOT NULL,
    "senderFK_id" bigint NOT NULL,
    "ticketFK_id" bigint NOT NULL
);


ALTER TABLE public.adminpanel_supportticketreply OWNER TO iayos_user;

--
-- Name: adminpanel_supportticketreply_replyID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_supportticketreply ALTER COLUMN "replyID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_supportticketreply_replyID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_systemroles; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_systemroles (
    "systemRoleID" bigint NOT NULL,
    "systemRole" character varying(10) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountID_id" bigint NOT NULL
);


ALTER TABLE public.adminpanel_systemroles OWNER TO iayos_user;

--
-- Name: adminpanel_systemroles_systemRoleID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_systemroles ALTER COLUMN "systemRoleID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_systemroles_systemRoleID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: adminpanel_userreport; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.adminpanel_userreport (
    "reportID" bigint NOT NULL,
    "reportType" character varying(10) NOT NULL,
    reason character varying(20) NOT NULL,
    description text NOT NULL,
    "relatedContentID" bigint,
    status character varying(15) NOT NULL,
    "adminNotes" text NOT NULL,
    "actionTaken" character varying(20) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "resolvedAt" timestamp with time zone,
    "reportedUserFK_id" bigint,
    "reporterFK_id" bigint NOT NULL,
    "reviewedBy_id" bigint
);


ALTER TABLE public.adminpanel_userreport OWNER TO iayos_user;

--
-- Name: adminpanel_userreport_reportID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.adminpanel_userreport ALTER COLUMN "reportID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."adminpanel_userreport_reportID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: agency_agencykyc; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.agency_agencykyc (
    "agencyKycID" bigint NOT NULL,
    status character varying(10) NOT NULL,
    "reviewedAt" timestamp with time zone,
    notes character varying(511) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    "reviewedBy_id" bigint,
    "rejectionCategory" character varying(30),
    "rejectionReason" text NOT NULL,
    "resubmissionCount" integer NOT NULL,
    "maxResubmissions" integer NOT NULL
);


ALTER TABLE public.agency_agencykyc OWNER TO iayos_user;

--
-- Name: agency_agencykyc_agencyKycID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.agency_agencykyc ALTER COLUMN "agencyKycID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."agency_agencykyc_agencyKycID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: agency_agencykycfile; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.agency_agencykycfile (
    "fileID" bigint NOT NULL,
    "fileType" character varying(30),
    "fileURL" character varying(1000) NOT NULL,
    "fileName" character varying(255),
    "fileSize" integer,
    "uploadedAt" timestamp with time zone NOT NULL,
    "agencyKyc_id" bigint NOT NULL
);


ALTER TABLE public.agency_agencykycfile OWNER TO iayos_user;

--
-- Name: agency_agencykycfile_fileID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.agency_agencykycfile ALTER COLUMN "fileID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."agency_agencykycfile_fileID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: agency_employees; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.agency_employees (
    "employeeID" bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(100) NOT NULL,
    avatar character varying(1000),
    rating numeric(3,2),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    agency_id bigint NOT NULL,
    "employeeOfTheMonth" boolean NOT NULL,
    "employeeOfTheMonthDate" timestamp with time zone,
    "employeeOfTheMonthReason" text NOT NULL,
    "isActive" boolean NOT NULL,
    "lastRatingUpdate" timestamp with time zone,
    "totalEarnings" numeric(10,2) NOT NULL,
    "totalJobsCompleted" integer NOT NULL
);


ALTER TABLE public.agency_employees OWNER TO iayos_user;

--
-- Name: agency_employees_employeeID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.agency_employees ALTER COLUMN "employeeID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."agency_employees_employeeID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO iayos_user;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO iayos_user;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO iayos_user;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certification_logs; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.certification_logs (
    "certLogID" bigint NOT NULL,
    "certificationID" bigint NOT NULL,
    action character varying(20) NOT NULL,
    "reviewedAt" timestamp with time zone NOT NULL,
    reason text NOT NULL,
    "workerEmail" character varying(254) NOT NULL,
    "workerAccountID" bigint NOT NULL,
    "certificationName" character varying(255) NOT NULL,
    "reviewedBy_id" bigint,
    "workerID_id" bigint NOT NULL
);


ALTER TABLE public.certification_logs OWNER TO iayos_user;

--
-- Name: certification_logs_certLogID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.certification_logs ALTER COLUMN "certLogID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."certification_logs_certLogID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: conversation; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.conversation (
    "conversationID" bigint NOT NULL,
    "lastMessageText" text,
    "lastMessageTime" timestamp with time zone,
    "unreadCountClient" integer NOT NULL,
    "unreadCountWorker" integer NOT NULL,
    status character varying(15) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    client_id bigint NOT NULL,
    "lastMessageSender_id" bigint,
    "relatedJobPosting_id" bigint NOT NULL,
    worker_id bigint,
    "archivedByClient" boolean NOT NULL,
    "archivedByWorker" boolean NOT NULL,
    agency_id bigint,
    conversation_type character varying(15) NOT NULL
);


ALTER TABLE public.conversation OWNER TO iayos_user;

--
-- Name: conversation_conversationID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.conversation ALTER COLUMN "conversationID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."conversation_conversationID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.conversation_participants (
    "participantID" bigint NOT NULL,
    participant_type character varying(10) NOT NULL,
    unread_count integer NOT NULL,
    is_archived boolean NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    last_read_at timestamp with time zone,
    conversation_id bigint NOT NULL,
    profile_id bigint NOT NULL,
    skill_slot_id bigint
);


ALTER TABLE public.conversation_participants OWNER TO iayos_user;

--
-- Name: conversation_participants_participantID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.conversation_participants ALTER COLUMN "participantID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."conversation_participants_participantID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dispute_evidence; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.dispute_evidence (
    "evidenceID" bigint NOT NULL,
    "imageURL" character varying(500) NOT NULL,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "disputeID_id" bigint NOT NULL,
    "uploadedBy_id" bigint
);


ALTER TABLE public.dispute_evidence OWNER TO iayos_user;

--
-- Name: dispute_evidence_evidenceID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.dispute_evidence ALTER COLUMN "evidenceID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."dispute_evidence_evidenceID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id bigint NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO iayos_user;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO iayos_user;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO iayos_user;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO iayos_user;

--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_applications (
    "applicationID" bigint NOT NULL,
    "proposalMessage" text NOT NULL,
    "proposedBudget" numeric(10,2) NOT NULL,
    "estimatedDuration" character varying(100),
    "budgetOption" character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL,
    "workerID_id" bigint NOT NULL,
    applied_skill_slot_id bigint
);


ALTER TABLE public.job_applications OWNER TO iayos_user;

--
-- Name: job_applications_applicationID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_applications ALTER COLUMN "applicationID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_applications_applicationID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_disputes; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_disputes (
    "disputeID" bigint NOT NULL,
    "disputedBy" character varying(20) NOT NULL,
    reason character varying(200) NOT NULL,
    description text NOT NULL,
    status character varying(20) NOT NULL,
    priority character varying(20) NOT NULL,
    "jobAmount" numeric(10,2) NOT NULL,
    "disputedAmount" numeric(10,2) NOT NULL,
    resolution text,
    "resolvedDate" timestamp with time zone,
    "assignedTo" character varying(200),
    "openedDate" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL,
    termsaccepted boolean DEFAULT false,
    termsversion character varying(20),
    termsacceptedat timestamp without time zone,
    "backjobStarted" boolean NOT NULL,
    "backjobStartedAt" timestamp with time zone,
    "clientConfirmedBackjob" boolean NOT NULL,
    "clientConfirmedBackjobAt" timestamp with time zone,
    "workerMarkedBackjobComplete" boolean NOT NULL,
    "workerMarkedBackjobCompleteAt" timestamp with time zone,
    "termsAccepted" boolean NOT NULL,
    "termsVersion" character varying(20),
    "termsAcceptedAt" timestamp with time zone,
    "adminRejectedAt" timestamp with time zone,
    "adminRejectionReason" text
);


ALTER TABLE public.job_disputes OWNER TO iayos_user;

--
-- Name: job_disputes_disputeID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_disputes ALTER COLUMN "disputeID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_disputes_disputeID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_employee_assignments; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_employee_assignments (
    "assignmentID" bigint NOT NULL,
    "assignedAt" timestamp with time zone NOT NULL,
    notes text NOT NULL,
    "isPrimaryContact" boolean NOT NULL,
    status character varying(15) NOT NULL,
    "employeeMarkedComplete" boolean NOT NULL,
    "employeeMarkedCompleteAt" timestamp with time zone,
    "completionNotes" text NOT NULL,
    "assignedBy_id" bigint,
    employee_id bigint NOT NULL,
    job_id bigint NOT NULL
);


ALTER TABLE public.job_employee_assignments OWNER TO iayos_user;

--
-- Name: job_employee_assignments_assignmentID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_employee_assignments ALTER COLUMN "assignmentID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_employee_assignments_assignmentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_logs; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_logs (
    "logID" bigint NOT NULL,
    "oldStatus" character varying(30),
    "newStatus" character varying(30) NOT NULL,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "changedBy_id" bigint,
    "jobID_id" bigint NOT NULL
);


ALTER TABLE public.job_logs OWNER TO iayos_user;

--
-- Name: job_logs_logID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_logs ALTER COLUMN "logID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_logs_logID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_photos; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_photos (
    "photoID" bigint NOT NULL,
    "photoURL" character varying(255) NOT NULL,
    "fileName" character varying(255),
    "uploadedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL
);


ALTER TABLE public.job_photos OWNER TO iayos_user;

--
-- Name: job_photos_photoID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_photos ALTER COLUMN "photoID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_photos_photoID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_reviews; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_reviews (
    "reviewID" bigint NOT NULL,
    "reviewerType" character varying(10) NOT NULL,
    rating numeric(3,2) NOT NULL,
    comment text NOT NULL,
    status character varying(10) NOT NULL,
    "isFlagged" boolean NOT NULL,
    "flagReason" text,
    "flaggedAt" timestamp with time zone,
    "helpfulCount" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "flaggedBy_id" bigint,
    "jobID_id" bigint NOT NULL,
    "revieweeID_id" bigint,
    "reviewerID_id" bigint NOT NULL,
    "revieweeAgencyID_id" bigint,
    "revieweeEmployeeID_id" bigint,
    "revieweeProfileID_id" bigint,
    rating_communication numeric(3,2),
    rating_professionalism numeric(3,2),
    rating_punctuality numeric(3,2),
    rating_quality numeric(3,2)
);


ALTER TABLE public.job_reviews OWNER TO iayos_user;

--
-- Name: job_reviews_reviewID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_reviews ALTER COLUMN "reviewID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_reviews_reviewID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_skill_slots; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_skill_slots (
    "skillSlotID" bigint NOT NULL,
    workers_needed integer NOT NULL,
    budget_allocated numeric(10,2) NOT NULL,
    skill_level_required character varying(15) NOT NULL,
    status character varying(20) NOT NULL,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL,
    "specializationID_id" bigint NOT NULL,
    CONSTRAINT job_skill_slots_workers_needed_check CHECK ((workers_needed >= 0))
);


ALTER TABLE public.job_skill_slots OWNER TO iayos_user;

--
-- Name: job_skill_slots_skillSlotID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_skill_slots ALTER COLUMN "skillSlotID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_skill_slots_skillSlotID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: job_worker_assignments; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.job_worker_assignments (
    "assignmentID" bigint NOT NULL,
    slot_position integer NOT NULL,
    assignment_status character varying(15) NOT NULL,
    worker_marked_complete boolean NOT NULL,
    worker_marked_complete_at timestamp with time zone,
    completion_notes text,
    individual_rating numeric(3,2),
    "assignedAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL,
    "skillSlotID_id" bigint NOT NULL,
    "workerID_id" bigint NOT NULL,
    client_confirmed_arrival boolean NOT NULL,
    client_confirmed_arrival_at timestamp with time zone,
    CONSTRAINT job_worker_assignments_slot_position_check CHECK ((slot_position >= 0))
);


ALTER TABLE public.job_worker_assignments OWNER TO iayos_user;

--
-- Name: job_worker_assignments_assignmentID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.job_worker_assignments ALTER COLUMN "assignmentID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."job_worker_assignments_assignmentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.jobs (
    "jobID" bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    budget numeric(10,2) NOT NULL,
    location character varying(255) NOT NULL,
    "expectedDuration" character varying(100),
    urgency character varying(10) NOT NULL,
    "preferredStartDate" date,
    "materialsNeeded" jsonb NOT NULL,
    status character varying(15) NOT NULL,
    "completedAt" timestamp with time zone,
    "cancellationReason" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "assignedWorkerID_id" bigint,
    "categoryID_id" bigint,
    "clientID_id" bigint NOT NULL,
    "clientMarkedComplete" boolean NOT NULL,
    "clientMarkedCompleteAt" timestamp with time zone,
    "workerMarkedComplete" boolean NOT NULL,
    "workerMarkedCompleteAt" timestamp with time zone,
    "escrowAmount" numeric(10,2) NOT NULL,
    "escrowPaid" boolean NOT NULL,
    "escrowPaidAt" timestamp with time zone,
    "remainingPayment" numeric(10,2) NOT NULL,
    "remainingPaymentPaid" boolean NOT NULL,
    "remainingPaymentPaidAt" timestamp with time zone,
    "finalPaymentMethod" character varying(20),
    "cashPaymentProofUrl" character varying(500),
    "paymentMethodSelectedAt" timestamp with time zone,
    "cashProofUploadedAt" timestamp with time zone,
    "cashPaymentApproved" boolean NOT NULL,
    "cashPaymentApprovedAt" timestamp with time zone,
    "cashPaymentApprovedBy_id" bigint,
    "assignedAgencyFK_id" bigint,
    "jobType" character varying(10) NOT NULL,
    "inviteRejectionReason" text,
    "inviteRespondedAt" timestamp with time zone,
    "inviteStatus" character varying(10),
    "clientConfirmedWorkStarted" boolean NOT NULL,
    "clientConfirmedWorkStartedAt" timestamp with time zone,
    "assignedEmployeeID_id" bigint,
    "assignmentNotes" text,
    "employeeAssignedAt" timestamp with time zone,
    is_team_job boolean NOT NULL,
    budget_allocation_type character varying(20) NOT NULL,
    team_job_start_threshold numeric(5,2) NOT NULL,
    "paymentReleaseDate" timestamp with time zone,
    "paymentReleasedToWorker" boolean NOT NULL,
    "paymentReleasedAt" timestamp with time zone,
    "paymentHeldReason" character varying(20),
    job_scope character varying(20) NOT NULL,
    skill_level_required character varying(15) NOT NULL,
    work_environment character varying(10) NOT NULL
);


ALTER TABLE public.jobs OWNER TO iayos_user;

--
-- Name: jobs_jobID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.jobs ALTER COLUMN "jobID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."jobs_jobID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: message; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.message (
    "messageID" bigint NOT NULL,
    "messageText" text NOT NULL,
    "messageType" character varying(10) NOT NULL,
    "locationAddress" character varying(500),
    "locationLandmark" character varying(255),
    "locationLatitude" numeric(10,7),
    "locationLongitude" numeric(10,7),
    "isRead" boolean NOT NULL,
    "readAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "conversationID_id" bigint NOT NULL,
    sender_id bigint,
    "senderAgency_id" bigint
);


ALTER TABLE public.message OWNER TO iayos_user;

--
-- Name: message_attachment; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.message_attachment (
    "attachmentID" bigint NOT NULL,
    "fileURL" character varying(255) NOT NULL,
    "fileName" character varying(255),
    "fileSize" integer,
    "fileType" character varying(50),
    "uploadedAt" timestamp with time zone NOT NULL,
    "messageID_id" bigint NOT NULL
);


ALTER TABLE public.message_attachment OWNER TO iayos_user;

--
-- Name: message_attachment_attachmentID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.message_attachment ALTER COLUMN "attachmentID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."message_attachment_attachmentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: message_messageID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.message ALTER COLUMN "messageID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."message_messageID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: profiles_workerproduct; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.profiles_workerproduct (
    "productID" bigint NOT NULL,
    "productName" character varying(200) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "priceUnit" character varying(20) NOT NULL,
    "inStock" boolean NOT NULL,
    "stockQuantity" integer,
    "productImage" character varying(500),
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "categoryID_id" bigint,
    "workerID_id" bigint NOT NULL
);


ALTER TABLE public.profiles_workerproduct OWNER TO iayos_user;

--
-- Name: profiles_workerproduct_productID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.profiles_workerproduct ALTER COLUMN "productID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."profiles_workerproduct_productID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: review_skill_tags; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.review_skill_tags (
    "tagID" bigint NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "reviewID_id" bigint NOT NULL,
    "workerSpecializationID_id" bigint NOT NULL
);


ALTER TABLE public.review_skill_tags OWNER TO iayos_user;

--
-- Name: review_skill_tags_tagID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.review_skill_tags ALTER COLUMN "tagID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."review_skill_tags_tagID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: socialaccount_socialaccount; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.socialaccount_socialaccount (
    id integer NOT NULL,
    provider character varying(200) NOT NULL,
    uid character varying(191) NOT NULL,
    last_login timestamp with time zone NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    extra_data jsonb NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.socialaccount_socialaccount OWNER TO iayos_user;

--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.socialaccount_socialaccount ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.socialaccount_socialaccount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: socialaccount_socialapp; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.socialaccount_socialapp (
    id integer NOT NULL,
    provider character varying(30) NOT NULL,
    name character varying(40) NOT NULL,
    client_id character varying(191) NOT NULL,
    secret character varying(191) NOT NULL,
    key character varying(191) NOT NULL,
    provider_id character varying(200) NOT NULL,
    settings jsonb NOT NULL
);


ALTER TABLE public.socialaccount_socialapp OWNER TO iayos_user;

--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.socialaccount_socialapp ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.socialaccount_socialapp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: socialaccount_socialtoken; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.socialaccount_socialtoken (
    id integer NOT NULL,
    token text NOT NULL,
    token_secret text NOT NULL,
    expires_at timestamp with time zone,
    account_id integer NOT NULL,
    app_id integer
);


ALTER TABLE public.socialaccount_socialtoken OWNER TO iayos_user;

--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.socialaccount_socialtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.socialaccount_socialtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: worker_certifications; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.worker_certifications (
    "certificationID" bigint NOT NULL,
    name character varying(255) NOT NULL,
    issuing_organization character varying(255) NOT NULL,
    issue_date date,
    expiry_date date,
    certificate_url character varying(1000) NOT NULL,
    is_verified boolean NOT NULL,
    verified_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    verified_by_id bigint,
    "workerID_id" bigint NOT NULL,
    "specializationID_id" bigint NOT NULL
);


ALTER TABLE public.worker_certifications OWNER TO iayos_user;

--
-- Name: worker_certifications_certificationID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.worker_certifications ALTER COLUMN "certificationID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."worker_certifications_certificationID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: worker_materials; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.worker_materials (
    "materialID" bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    unit character varying(50) NOT NULL,
    image_url character varying(1000) NOT NULL,
    is_available boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "workerID_id" bigint NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "categoryID_id" bigint
);


ALTER TABLE public.worker_materials OWNER TO iayos_user;

--
-- Name: worker_materials_materialID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.worker_materials ALTER COLUMN "materialID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."worker_materials_materialID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: worker_portfolio; Type: TABLE; Schema: public; Owner: iayos_user
--

CREATE TABLE public.worker_portfolio (
    "portfolioID" bigint NOT NULL,
    image_url character varying(1000) NOT NULL,
    caption text NOT NULL,
    display_order integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "workerID_id" bigint NOT NULL
);


ALTER TABLE public.worker_portfolio OWNER TO iayos_user;

--
-- Name: worker_portfolio_portfolioID_seq; Type: SEQUENCE; Schema: public; Owner: iayos_user
--

ALTER TABLE public.worker_portfolio ALTER COLUMN "portfolioID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."worker_portfolio_portfolioID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: account_emailaddress; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.account_emailaddress (id, email, verified, "primary", user_id) FROM stdin;
\.


--
-- Data for Name: account_emailconfirmation; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.account_emailconfirmation (id, created, sent, key, email_address_id) FROM stdin;
\.


--
-- Data for Name: accounts_accounts; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_accounts (last_login, is_superuser, "accountID", email, password, "isVerified", is_active, is_staff, "verifyToken", "verifyTokenExpiry", "createdAt", "updatedAt", city, country, postal_code, province, street_address, "KYCVerified", banned_at, banned_by_id, banned_reason, is_banned, is_suspended, suspended_reason, suspended_until) FROM stdin;
\N	f	28	edrisbaks@gmail.com	pbkdf2_sha256$1000000$d6Y9nLKVsupgwNAmO05UEd$PGbN9w0b1+O7UpvwNcBSPSGrJsJPkkwgOTR7p8a4wcI=	t	t	f	\N	\N	2025-11-14 12:41:33.512251+00	2025-11-14 12:43:10.946418+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	San Roque Zamboanga City	f	\N	\N	\N	f	f	\N	\N
\N	f	2	admin@example.com	pbkdf2_sha256$1000000$aGZ52BDFhZIBSxr8mTQXPR$qytSNA0Xmd5N2xqkabZwWEbmVHeCr8Ug181ya6+aEIU=	t	t	f	\N	\N	2025-09-30 11:25:53.632938+00	2025-09-30 11:25:53.74142+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	29	edris.bakaun@one.uz.edu.ph	pbkdf2_sha256$1000000$TJzBlljcCHgICNRFy5LLHR$T4TV4d5pVoDEJPJ908AQER3JouXM7qoiwneB8hU6QN4=	t	t	f	\N	\N	2025-11-14 13:40:19.495534+00	2025-11-14 13:41:30.343951+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	San Roque Zamboanga City	f	\N	\N	\N	f	f	\N	\N
\N	f	23	ririka.ruu@gmail.com	pbkdf2_sha256$1000000$yRgbghaG8HktbecsULdxUL$JSa0WB1KbBcD8hT5sbTyQPC5lH8ZncxaAYRzkvKA9CQ=	t	t	f	\N	\N	2025-10-20 08:54:18.197708+00	2025-10-22 05:13:18.930636+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	30	testjobs422@example.com	pbkdf2_sha256$1000000$LVOQWsPzcaVRG6Br5NASUU$cbd1is9JdAwq/6qxM6vv7TEynZnUfMv/aTjdX5WgV1U=	f	t	f	aab30083e2fc5c79f27f8a64b93d6ed9d64a59e535ebcc4f3f38c906295344a6	2025-11-20 19:19:48.112351+00	2025-11-19 19:19:48.031717+00	2025-11-19 19:19:48.112472+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	24	testworker@example.com	pbkdf2_sha256$1000000$bn5rvHIoZi7HSxU0Qb2jYS$DrHiYOVDQD/MS0hpK/DAsIXEFkQdzn9hrQAigHRlTr8=	t	t	f	\N	\N	2025-11-08 18:19:42.437191+00	2025-11-08 18:19:42.437201+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	31	testjobs423@example.com	pbkdf2_sha256$1000000$kDHS4KeXRIm9CtXPctHtd6$F4X9FUWRlHlCMiu6SRwJBLj4nm7rRhTmH2yklZj4j8k=	f	t	f	88e6fee2353f4b12f7874029782a624d862f8523a2f07e45d451c966d8a88b42	2025-11-20 19:20:06.161818+00	2025-11-19 19:20:06.098456+00	2025-11-19 19:20:06.161927+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	32	testjobs424@example.com	pbkdf2_sha256$1000000$fbafMyCk5qAbzzwlP4CpI4$vfsv1aCZuoPysqai51sZQTHVnFgKzPLmfrLUIa0Qu2k=	t	t	f	\N	\N	2025-11-19 19:20:31.759321+00	2025-11-19 19:20:51.318037+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	26	daraemoon21@gmail.com	pbkdf2_sha256$1000000$A6MIMEh4oB4ktDL8G7aCxs$pbwexwaQrlGO4NVnRPxwc86MNhEmFfBke/rcF0yLw3c=	t	t	f	\N	\N	2025-11-14 09:18:41.867348+00	2025-11-14 11:12:36.498337+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	511 Kristina Homes Phase 2	t	\N	\N	\N	f	f	\N	\N
\N	f	25	modillasgabriel@gmail.com	pbkdf2_sha256$1000000$2wXPL5KH7TT8MgFSeh6Ez5$HJmHnafkDyDu3gJwP/WP+h/stXSztupnP3UJPUT2sHE=	t	t	f	\N	\N	2025-11-12 01:04:23.57575+00	2025-11-24 09:05:34.642442+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	yuhyuhyuudsg	t	\N	\N	\N	f	f	\N	\N
\N	f	27	daraemoon2127@gmail.com	pbkdf2_sha256$1000000$wqbiVhSkx2MaG9ZFjEb0BM$Tr0G7lCB0455Pfm7pO+h21uDrSRnjW/sJXIg0ecz8qg=	t	t	f	\N	\N	2025-11-14 12:39:15.959996+00	2025-11-30 11:51:00.733637+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	7	cornelio.vaniel38@gmail.com	pbkdf2_sha256$1200000$ykyBvd6NTDelWm5fiXHiA4$UvvLEFMQR9qlNs+s6T0r6P6xH1h3cMIde1q81/e60hk=	t	t	f	\N	\N	2025-10-03 10:40:27.706664+00	2025-10-12 14:27:31.048969+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	37	worker@test.com	pbkdf2_sha256$1200000$4qVn2rD1WoxdkjU4iBT6W5$dS2eS8lIgBLz0Iyixht/1jE+Hd2zqVhVMd3CLYngucE=	t	t	f	\N	\N	2025-12-09 11:37:47.181397+00	2025-12-09 11:37:47.421896+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	13	superadmin@gmail.com	pbkdf2_sha256$1200000$mFQOyeB7xPHvubKf5IjIKn$6EtYfwpii2iWBUOCuIDmuvqhdWXHAaC52m5A4cZIHFw=	t	t	f	\N	\N	2025-10-06 04:47:14.655428+00	2025-10-06 04:47:14.72765+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	38	certtest@example.com	pbkdf2_sha256$1200000$c5GNwxeWk47cGe35jOTqLh$4jF78uS2viGZNd5OXUYzvMjc88gRzDeBkV95Iu+7qIY=	t	t	f	\N	\N	2025-12-10 13:22:31.375243+00	2025-12-10 13:22:49.177449+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	39	testclient_1765374573@example.com	pbkdf2_sha256$1200000$CZsGpEyfuhddVEM1S3hSEJ$lOMofO9dgVhP96oZzq/bzO2jhCMCbZH8+oEMuNtyUJ4=	f	t	f	bbddff8e06a81a831c2aa77ac4a11317c1117616739adda0050b735a00a0bd13	2025-12-11 13:49:33.813892+00	2025-12-10 13:49:33.800831+00	2025-12-10 13:49:33.814029+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	40	testclient_1765374579@example.com	pbkdf2_sha256$1200000$6939VOh3zfCVnjwNShX9OY$+D1qU8DWZY2HoOJDUQffY9HDnhnGHGH+Ikz8+Yljajg=	f	t	f	f8a72149d1c5a0f75f6637d3dffbc7c1f065842b638daa698d46dcc9ff533416	2025-12-11 13:49:39.562791+00	2025-12-10 13:49:39.558563+00	2025-12-10 13:49:39.562903+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	41	testclient_1765374583@example.com	pbkdf2_sha256$1200000$iYxcHZRQvNW5LtwUonPIaN$cKgut+UfEH7u3llrERRisjXXJcp2bCIe3sI7Nsjkrqo=	f	t	f	a58484ba1323534f1dfdc566d432cdc8676ce5546137c76add230640f3661772	2025-12-11 13:49:50.084717+00	2025-12-10 13:49:50.080242+00	2025-12-10 13:49:50.084861+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	42	testclient_139543@example.com	pbkdf2_sha256$1200000$lx8jvKrmKgIUmgbux1NVIJ$Tw+isNLA4o/TMYe9Fd5ZM8KAHP7Nk0On3aOxa1Od+m4=	f	t	f	edc4a67c7b680eca2d7c4a15b8aaefb786ab25da111a5f4d310453168ab377d3	2025-12-11 13:50:26.167435+00	2025-12-10 13:50:26.162228+00	2025-12-10 13:50:26.167529+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	43	testclient_224214@example.com	pbkdf2_sha256$1200000$PXURiG8W3sV0baj2LtgVDs$LR5yQBGbb3+Xl0VqgXFIeGd9cXtEWmmuQnUU78cK92Y=	f	t	f	65ba46019606db3a55cf28f31b90a33bb9911be62abc9f0f8ba92f80df182869	2025-12-11 13:50:38.442056+00	2025-12-10 13:50:38.437067+00	2025-12-10 13:50:38.442232+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	44	test_20251210215055_3493@test.com	pbkdf2_sha256$1200000$i3WokoR3EqKM6wQsMtmUWL$XCBA8+DtgYCF9dbvBtoHDZ12oDXBtX1/pXfVCpMBh90=	f	t	f	eed20706586c467a4e70b28560281ab9b9de4ee1395f3d9fdd7678ea7efc4292	2025-12-11 13:50:55.649972+00	2025-12-10 13:50:55.645015+00	2025-12-10 13:50:55.65009+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	45	test_20251210215108@test.com	pbkdf2_sha256$1200000$XgekM4zqlCiqNklaC7EtST$X1YHxovRm9p8EsifR5CDHSYV88cB2D0f8OcDW691lWg=	t	t	f	4ab05ffd73e958052f8c97b3bb0a88cddc2876d213352bb7843eb2955069f220	2025-12-11 13:51:29.843381+00	2025-12-10 13:51:29.838958+00	2025-12-10 13:52:14.06849+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	46	testworker_20251210215315@test.com	pbkdf2_sha256$1200000$iBgoCrnMwTRahTRP6otFFq$hGmVmooIrnftfLBUI2DoJz/7RwNET9MdQjQGPz+uuts=	t	t	f	050fc5c3fbd684b0d836b82215ae4b96dcff33e00e53a03b3f70340327afa4ce	2025-12-11 13:53:35.554436+00	2025-12-10 13:53:35.55007+00	2025-12-10 13:53:56.402294+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	456 Worker St	f	\N	\N	\N	f	f	\N	\N
\N	f	47	testclient_rev@test.com	pbkdf2_sha256$1200000$FdZIjGMisNuBwOQSm9Wabe$ZiNgnpXRHcjwS4eDIK3Wbl+GmXXX1uAQr64NY8KmfpQ=	f	t	f	01e00280e69a977edfab2c420f5c039c447275f7eb12e10789c20290c8f34894	2025-12-11 14:45:03.009034+00	2025-12-10 14:45:02.99258+00	2025-12-10 14:45:03.009273+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	6	new.cornelio.vaniel38@gmail.com	pbkdf2_sha256$1200000$G9NJxtoMSErNbT2VekE89J$/NB5ALwqwefPT25xuGS9VkZBzAImzTy7tJalU0P9FpU=	t	t	f	\N	\N	2025-10-01 10:57:38.698752+00	2025-11-24 03:17:36.437062+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	36	dump.temp.27@gmail.com	pbkdf2_sha256$1200000$xGnMUqSmpwXrg3LTHwoHdw$vBueJmenkDzywNe3JcqwfB2mxGCiDcvSA0qy+VaWk7Y=	t	t	f	\N	\N	2025-11-21 23:21:17.527548+00	2025-11-24 09:05:00.517853+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	shshsbbwnwksnxnx	t	\N	\N	\N	f	f	\N	\N
\N	f	54	testclient@iayos.com	pbkdf2_sha256$1200000$HM2P2tGzeDRd26EF9ngLMY$hVEwIrX4PY7shh9LN6XEYjaUvhewatPfHMio8BU33AI=	t	t	f	\N	\N	2025-12-11 16:30:20.449498+00	2025-12-16 01:47:08.560879+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	66	testclient@teamtest.com	pbkdf2_sha256$1200000$jSLtzn0x6H11pM04WhzUiX$HOB5wbUaG8782T5KBpQX/NSC/QTgrP2pRpgSebp/NfI=	t	t	f	\N	\N	2025-12-12 17:02:16.898228+00	2025-12-12 17:03:55.597321+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	67	testworker1@teamtest.com	pbkdf2_sha256$1200000$BTu6X2XC5bRsCneX5augyu$c/uWr24zuma0N4V9cAoKyLYQfbRcAdzWesY6dNfgYN8=	t	t	f	\N	\N	2025-12-12 17:02:17.17323+00	2025-12-12 17:03:56.07979+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	68	testworker2@teamtest.com	pbkdf2_sha256$1200000$6mrTPr701wsfbMGR1VfGU6$uWfxOcrgzakuWsFJreFfGNJ37LHHayXb5/jIy+ElBlk=	t	t	f	\N	\N	2025-12-12 17:02:17.417896+00	2025-12-12 17:03:56.56748+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	48	client_20251210224656@test.com	pbkdf2_sha256$1200000$XIz5Xidnzy2xM2apWxIRJq$Z6Dj3IYbohSaNGJI84g74EcWPu7+epStHHnY9BmjJCM=	t	t	f	62e5ae2be8ada3d19c8ce1c798db7cbd65b1ee120ed5fb7eae6626308110752a	2025-12-11 14:46:56.814584+00	2025-12-10 14:46:56.810369+00	2025-12-10 14:53:43.508963+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test St	f	\N	\N	\N	f	f	\N	\N
\N	f	49	worker_20251210224757@test.com	pbkdf2_sha256$1200000$Yl17kfqJMktaA06BJpt4AE$KPAXF8m3wr0FLJlbYz3TKbLV7xUS2hv5FhuJiYi1Bqg=	t	t	f	1857915d5b8a5ab0c77095797ae3d9c93982c1fc4ef94ee8fc35edca5dff7705	2025-12-11 14:47:57.701134+00	2025-12-10 14:47:57.695925+00	2025-12-10 14:53:43.515779+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	456 Worker Ave	f	\N	\N	\N	f	f	\N	\N
\N	f	50	testclient_team@test.com	pbkdf2_sha256$1200000$Fw56sNcdTgkyFxIhuyhe2N$zE6IJ/a8TdRESh7+CLTorWKD4V06BF1NwsVsBkL8/BQ=	t	t	f	\N	\N	2025-12-10 16:44:21.618457+00	2025-12-16 01:48:49.66228+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	59	testclient20251212075613@test.com	pbkdf2_sha256$1200000$kgSgznXRF1ZS4UFqdWB0wZ$bq3ezL1pHAzei3XS3Rc18fUCwOcoaGRP5NWChsoiqT0=	f	t	f	910bcca19911435cb2244ac483c7457d4074fb45310b2c335e30172b1af3558f	2025-12-13 07:56:13.522583+00	2025-12-12 07:56:13.500154+00	2025-12-12 07:56:13.522827+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 Test Street	f	\N	\N	\N	f	f	\N	\N
\N	f	70	testworker1@iayos.test	pbkdf2_sha256$1200000$0W8ur9CGzgkptRkdtQSgYQ$qH8KouYFpLdERlDrk2e7fKD8JrmdJM++XGhYjj/R2DI=	t	t	f	\N	\N	2025-12-12 20:17:40.176774+00	2025-12-12 20:17:40.176782+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	55	testworker@iayos.com	pbkdf2_sha256$1200000$wuXrF2EbQHylLWu7KkWErh$+wx+yUTrq+TDnJx783wTMiDW79hJlzLX9Fx35Ro1eQ4=	t	t	f	\N	\N	2025-12-11 16:30:40.131953+00	2025-12-12 09:19:55.502349+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	56	kyctest@test.com	pbkdf2_sha256$1200000$nzAhGUdmT4q36kQu0Y2rUe$lUJca7C+lnjs7cuXh3D4PQFBvrMzaoLfhg1lSd87qtg=	t	t	f	\N	\N	2025-12-11 17:39:08.929066+00	2025-12-11 17:39:08.929075+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	60	testworker20251212075613@test.com	pbkdf2_sha256$1200000$9zZrgfZQNLNGLtVjv05rYq$Ws10cJ7C8lFk4vFnESMwW0QZc55fy1K7FU6LDJUotYY=	f	t	f	8ff5805e720fc214a713d18a529223516b175a340f0c8b1982dc0ca7e72dbf16	2025-12-13 07:56:13.806178+00	2025-12-12 07:56:13.801744+00	2025-12-12 07:56:13.80634+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	456 Worker Ave	f	\N	\N	\N	f	f	\N	\N
\N	f	69	testworker3@teamtest.com	pbkdf2_sha256$1200000$yDXIoW8HN1bpWjDJbhCuz3$CdWi29EJsUOywWaHG9Dq5aQk8yK2fz40sY53PyzWOlo=	t	t	f	\N	\N	2025-12-12 17:02:17.667096+00	2025-12-12 17:03:57.05177+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	61	testdefault20251212075613@test.com	pbkdf2_sha256$1200000$8YIDytPr41Be5uPmGTJtzT$HWTbY+QRihU0ojFB+gUIYCcb5jQT63cQ2ghm6WnNfvo=	f	t	f	006ed1b715f605855af63e93f9283c9dafe314d5198a6d2f890b5e7964de6205	2025-12-13 07:56:14.579301+00	2025-12-12 07:56:14.575052+00	2025-12-12 07:56:14.579452+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	789 Default St	f	\N	\N	\N	f	f	\N	\N
\N	t	57	admin@iayos.com	pbkdf2_sha256$1200000$WeLfptFe05bsSICNJvmmOy$L02hixaEPOE6a1x+dcYze52TZysahUG14mQAiaIQifA=	t	t	t	\N	\N	2025-12-11 18:30:17.057493+00	2025-12-12 13:15:51.350407+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	62	testclient@team.test	pbkdf2_sha256$1200000$IP9SEqSjTUqgoSOYUPWuib$fgN/Ldjb5KSRvTUVSRbo0BhlrPzuccmu61V9QKI68IU=	t	t	f	\N	\N	2025-12-12 17:01:07.541362+00	2025-12-12 17:01:29.87417+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	58	gamerofgames76@gmail.com	pbkdf2_sha256$1200000$Ocx9lmQodxe1C9WrKhUFL1$WvX6DPXyELPQtqphC8f/FbmWyzCGWGmDczcIYyiSML0=	t	t	f	\N	\N	2025-12-12 04:17:38.326069+00	2025-12-12 20:17:53.226418+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	ZONE 4	t	\N	\N	\N	f	f	\N	\N
\N	f	63	testworker1@team.test	pbkdf2_sha256$1200000$neYuDOTZ6Cv7IR86GjAqoA$PfcmBQ9N/QMG8mNnm8v+HsFNrQU6zXyQWoREQ1x27m0=	t	t	f	\N	\N	2025-12-12 17:01:30.127564+00	2025-12-12 17:01:30.127573+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	64	testworker2@team.test	pbkdf2_sha256$1200000$GA804PuBMe4q7GnRQ5UKSV$nINNN5SrXi6VevYoNZXCWvU56/NjZlwRsxmjQCEJ+yk=	t	t	f	\N	\N	2025-12-12 17:01:30.375195+00	2025-12-12 17:01:30.375235+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	65	testworker3@team.test	pbkdf2_sha256$1200000$VovSB0IZwGdMpwM6ZvQ7j2$zTw8F4ADWtwQ0kmK6fchfYM6PckQPlcIYNuJNUoPYoI=	t	t	f	\N	\N	2025-12-12 17:01:30.619612+00	2025-12-12 17:01:30.619621+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	51	testworker1_team@test.com	pbkdf2_sha256$1200000$RjsEW8APXHXl4DNtq2Jzle$nvEq5vf6PrgKQiuNgEURvB0cx4wju9ecoNQtyi8pU1c=	t	t	f	\N	\N	2025-12-10 16:44:47.419901+00	2025-12-12 20:38:10.741955+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	52	testworker2_team@test.com	pbkdf2_sha256$1200000$DnmY27mXEty1H6GVJXoBmq$UQslxyvWmoYN+V/XmPBral0Q5hHd8CaY3K1pOVWKsFc=	t	t	f	\N	\N	2025-12-10 16:44:58.435567+00	2025-12-12 20:38:10.981739+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	53	testworker3_team@test.com	pbkdf2_sha256$1200000$WrBOvtBMAqTj5xhKt9vjuD$X/OsWJP0pmvD25PfJ+po0NiUirI8XvHPwgCY8dICMGw=	t	t	f	\N	\N	2025-12-10 16:45:10.702946+00	2025-12-12 20:38:11.21801+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\.


--
-- Data for Name: accounts_accounts_groups; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_accounts_groups (id, accounts_id, group_id) FROM stdin;
\.


--
-- Data for Name: accounts_accounts_user_permissions; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_accounts_user_permissions (id, accounts_id, permission_id) FROM stdin;
\.


--
-- Data for Name: accounts_agency; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_agency ("agencyId", "businessName", "businessDesc", "createdAt", "accountFK_id", city, country, postal_code, province, street_address, "contactNumber") FROM stdin;
8	Devante	Devante is the company behind iayos	2025-10-20 08:54:18.325219+00	23		Philippines				09998500312
9	Bubbles Agency	im da best in the world	2025-11-14 12:39:16.129437+00	27		Philippines				143
\.


--
-- Data for Name: accounts_barangay; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_barangay ("barangayID", name, "zipCode", "createdAt", "updatedAt", city_id) FROM stdin;
1	Arena Blanco	7000	2025-11-19 10:32:13.192355+00	2025-11-19 10:32:13.192366+00	1
2	Ayala	7000	2025-11-19 10:32:13.920518+00	2025-11-19 10:32:13.920532+00	1
3	Baliwasan	7000	2025-11-19 10:32:14.606803+00	2025-11-19 10:32:14.606815+00	1
4	Baluno	7000	2025-11-19 10:32:15.312795+00	2025-11-19 10:32:15.312809+00	1
5	Boalan	7000	2025-11-19 10:32:15.9822+00	2025-11-19 10:32:15.982212+00	1
6	Bolong	7000	2025-11-19 10:32:16.595588+00	2025-11-19 10:32:16.595599+00	1
7	Buenavista	7000	2025-11-19 10:32:17.238141+00	2025-11-19 10:32:17.238153+00	1
8	Bunguiao	7000	2025-11-19 10:32:17.899029+00	2025-11-19 10:32:17.899041+00	1
9	Busay	7000	2025-11-19 10:32:18.508369+00	2025-11-19 10:32:18.508381+00	1
10	Cabaluay	7000	2025-11-19 10:32:19.101874+00	2025-11-19 10:32:19.101885+00	1
11	Cabatangan	7000	2025-11-19 10:32:19.746345+00	2025-11-19 10:32:19.746357+00	1
12	Cacao	7000	2025-11-19 10:32:20.435971+00	2025-11-19 10:32:20.435983+00	1
13	Calabasa	7000	2025-11-19 10:32:21.125276+00	2025-11-19 10:32:21.12529+00	1
14	Calarian	7000	2025-11-19 10:32:21.808052+00	2025-11-19 10:32:21.808068+00	1
15	Camino Nuevo	7000	2025-11-19 10:32:22.422604+00	2025-11-19 10:32:22.422621+00	1
16	Campo Islam	7000	2025-11-19 10:32:23.037283+00	2025-11-19 10:32:23.037295+00	1
17	Canelar	7000	2025-11-19 10:32:23.62506+00	2025-11-19 10:32:23.625072+00	1
18	Capisan	7000	2025-11-19 10:32:24.300388+00	2025-11-19 10:32:24.300409+00	1
19	Cawit	7000	2025-11-19 10:32:25.05128+00	2025-11-19 10:32:25.051294+00	1
20	Culianan	7000	2025-11-19 10:32:25.77568+00	2025-11-19 10:32:25.775692+00	1
21	Curuan	7000	2025-11-19 10:32:26.498056+00	2025-11-19 10:32:26.498067+00	1
22	Dita	7000	2025-11-19 10:32:27.221811+00	2025-11-19 10:32:27.221823+00	1
23	Divisoria	7000	2025-11-19 10:32:27.947784+00	2025-11-19 10:32:27.9478+00	1
24	Dulian	7000	2025-11-19 10:32:28.678572+00	2025-11-19 10:32:28.678584+00	1
25	Guisao	7000	2025-11-19 10:32:29.397862+00	2025-11-19 10:32:29.397876+00	1
26	Guiwan	7000	2025-11-19 10:32:30.092626+00	2025-11-19 10:32:30.092637+00	1
27	Kasanyangan	7000	2025-11-19 10:32:30.736771+00	2025-11-19 10:32:30.736782+00	1
28	La Paz	7000	2025-11-19 10:32:31.452272+00	2025-11-19 10:32:31.45229+00	1
29	Labuan	7000	2025-11-19 10:32:32.130962+00	2025-11-19 10:32:32.130973+00	1
30	Lamisahan	7000	2025-11-19 10:32:32.774583+00	2025-11-19 10:32:32.774596+00	1
31	Landang Gua	7000	2025-11-19 10:32:33.411854+00	2025-11-19 10:32:33.411872+00	1
32	Landang Laum	7000	2025-11-19 10:32:34.037957+00	2025-11-19 10:32:34.037974+00	1
33	Lanzones	7000	2025-11-19 10:32:34.729642+00	2025-11-19 10:32:34.729654+00	1
34	Lapakan	7000	2025-11-19 10:32:35.391251+00	2025-11-19 10:32:35.391263+00	1
35	Latuan	7000	2025-11-19 10:32:36.089611+00	2025-11-19 10:32:36.089622+00	1
36	Licomo	7000	2025-11-19 10:32:36.793296+00	2025-11-19 10:32:36.793309+00	1
37	Limaong	7000	2025-11-19 10:32:37.418644+00	2025-11-19 10:32:37.418655+00	1
38	Limpapa	7000	2025-11-19 10:32:38.018874+00	2025-11-19 10:32:38.018887+00	1
39	Lubigan	7000	2025-11-19 10:32:38.678184+00	2025-11-19 10:32:38.678196+00	1
40	Lumayang	7000	2025-11-19 10:32:39.367907+00	2025-11-19 10:32:39.36792+00	1
41	Lumbangan	7000	2025-11-19 10:32:40.030261+00	2025-11-19 10:32:40.030272+00	1
42	Lunzuran	7000	2025-11-19 10:32:40.641906+00	2025-11-19 10:32:40.641917+00	1
43	Maasin	7000	2025-11-19 10:32:41.244566+00	2025-11-19 10:32:41.244577+00	1
44	Malagutay	7000	2025-11-19 10:32:41.87049+00	2025-11-19 10:32:41.870501+00	1
45	Mampang	7000	2025-11-19 10:32:42.548179+00	2025-11-19 10:32:42.548192+00	1
46	Manalipa	7000	2025-11-19 10:32:43.159719+00	2025-11-19 10:32:43.159732+00	1
47	Mangusu	7000	2025-11-19 10:32:43.796887+00	2025-11-19 10:32:43.796899+00	1
48	Manicahan	7000	2025-11-19 10:32:44.427947+00	2025-11-19 10:32:44.427959+00	1
49	Mariki	7000	2025-11-19 10:32:45.050319+00	2025-11-19 10:32:45.050331+00	1
50	Mercedes	7000	2025-11-19 10:32:45.716527+00	2025-11-19 10:32:45.71654+00	1
51	Muti	7000	2025-11-19 10:32:46.384088+00	2025-11-19 10:32:46.384099+00	1
52	Pamucutan	7000	2025-11-19 10:32:47.092772+00	2025-11-19 10:32:47.092788+00	1
53	Pangapuyan	7000	2025-11-19 10:32:47.817018+00	2025-11-19 10:32:47.817029+00	1
54	Panubigan	7000	2025-11-19 10:32:48.461364+00	2025-11-19 10:32:48.461382+00	1
55	Pasilmanta	7000	2025-11-19 10:32:49.156567+00	2025-11-19 10:32:49.156579+00	1
56	Pasobolong	7000	2025-11-19 10:32:49.788465+00	2025-11-19 10:32:49.788477+00	1
57	Pasonanca	7000	2025-11-19 10:32:50.448016+00	2025-11-19 10:32:50.448026+00	1
58	Patalon	7000	2025-11-19 10:32:51.114573+00	2025-11-19 10:32:51.114584+00	1
59	Paulan	7000	2025-11-19 10:32:51.802138+00	2025-11-19 10:32:51.80215+00	1
60	Pilar	7000	2025-11-19 10:32:52.481074+00	2025-11-19 10:32:52.481092+00	1
61	Pitogo	7000	2025-11-19 10:32:53.091807+00	2025-11-19 10:32:53.091832+00	1
62	Putik	7000	2025-11-19 10:32:53.682186+00	2025-11-19 10:32:53.682197+00	1
63	Quiniput	7000	2025-11-19 10:32:54.295095+00	2025-11-19 10:32:54.295114+00	1
64	Recodo	7000	2025-11-19 10:32:54.904616+00	2025-11-19 10:32:54.904627+00	1
65	Rio Hondo	7000	2025-11-19 10:32:55.47702+00	2025-11-19 10:32:55.477038+00	1
66	Salaan	7000	2025-11-19 10:32:56.015082+00	2025-11-19 10:32:56.015093+00	1
67	San Jose Cawa-cawa	7000	2025-11-19 10:32:56.607632+00	2025-11-19 10:32:56.607649+00	1
68	San Jose Gusu	7000	2025-11-19 10:32:57.156928+00	2025-11-19 10:32:57.15694+00	1
69	San Roque	7000	2025-11-19 10:32:57.662634+00	2025-11-19 10:32:57.66265+00	1
70	Sangali	7000	2025-11-19 10:32:58.158696+00	2025-11-19 10:32:58.15873+00	1
71	Santa Barbara	7000	2025-11-19 10:32:58.656547+00	2025-11-19 10:32:58.656558+00	1
72	Santa Catalina	7000	2025-11-19 10:32:59.150382+00	2025-11-19 10:32:59.150394+00	1
73	Santa Maria	7000	2025-11-19 10:32:59.751153+00	2025-11-19 10:32:59.751165+00	1
74	Santo Ni├▒o	7000	2025-11-19 10:33:00.337853+00	2025-11-19 10:33:00.337871+00	1
75	Sibulao	7000	2025-11-19 10:33:00.877914+00	2025-11-19 10:33:00.877925+00	1
76	Sinubung	7000	2025-11-19 10:33:01.446733+00	2025-11-19 10:33:01.446751+00	1
77	Sinunoc	7000	2025-11-19 10:33:02.066318+00	2025-11-19 10:33:02.066333+00	1
78	Tagasilay	7000	2025-11-19 10:33:02.650638+00	2025-11-19 10:33:02.650654+00	1
79	Taguiti	7000	2025-11-19 10:33:03.17368+00	2025-11-19 10:33:03.173692+00	1
80	Talabaan	7000	2025-11-19 10:33:03.729573+00	2025-11-19 10:33:03.729585+00	1
81	Talisayan	7000	2025-11-19 10:33:04.321651+00	2025-11-19 10:33:04.321664+00	1
82	Taluksangay	7000	2025-11-19 10:33:04.900542+00	2025-11-19 10:33:04.900555+00	1
83	Talon-talon	7000	2025-11-19 10:33:05.477831+00	2025-11-19 10:33:05.477843+00	1
84	Tetuan	7000	2025-11-19 10:33:06.028389+00	2025-11-19 10:33:06.028401+00	1
85	Tictapul	7000	2025-11-19 10:33:06.644774+00	2025-11-19 10:33:06.64479+00	1
86	Tigbalabag	7000	2025-11-19 10:33:07.258956+00	2025-11-19 10:33:07.258967+00	1
87	Tigtabon	7000	2025-11-19 10:33:07.901598+00	2025-11-19 10:33:07.90161+00	1
88	Tolosa	7000	2025-11-19 10:33:08.494272+00	2025-11-19 10:33:08.494283+00	1
89	Tulungatung	7000	2025-11-19 10:33:09.104587+00	2025-11-19 10:33:09.1046+00	1
90	Tumaga	7000	2025-11-19 10:33:09.66675+00	2025-11-19 10:33:09.666762+00	1
91	Tumalutab	7000	2025-11-19 10:33:10.27835+00	2025-11-19 10:33:10.278363+00	1
92	Tumitus	7000	2025-11-19 10:33:10.898695+00	2025-11-19 10:33:10.898707+00	1
93	Victoria	7000	2025-11-19 10:33:11.44878+00	2025-11-19 10:33:11.448792+00	1
94	Vitali	7000	2025-11-19 10:33:12.013768+00	2025-11-19 10:33:12.01378+00	1
95	Zambowood	7000	2025-11-19 10:33:12.534843+00	2025-11-19 10:33:12.534856+00	1
96	Zone I	7000	2025-11-19 10:33:13.07944+00	2025-11-19 10:33:13.079452+00	1
97	Zone II	7000	2025-11-19 10:33:13.563109+00	2025-11-19 10:33:13.563121+00	1
98	Zone III	7000	2025-11-19 10:33:14.089519+00	2025-11-19 10:33:14.089531+00	1
99	Zone IV	7000	2025-11-19 10:33:14.619033+00	2025-11-19 10:33:14.619044+00	1
\.


--
-- Data for Name: accounts_city; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_city ("cityID", name, province, region, "zipCode", "createdAt", "updatedAt") FROM stdin;
1	Zamboanga City	Zamboanga Peninsula	Region IX	7000	2025-11-19 10:32:12.482036+00	2025-11-19 10:32:12.482051+00
\.


--
-- Data for Name: accounts_clientprofile; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_clientprofile (id, description, "totalJobsPosted", "clientRating", "profileID_id", "activeJobsCount") FROM stdin;
1		0	0	3	0
2		0	0	12	0
3		0	0	14	0
4		0	0	22	0
5		0	0	34	0
6		0	0	37	0
8		0	0	41	0
10		0	0	45	0
12		0	0	47	0
13		0	0	48	0
15	Test client for team job testing	0	0	56	0
\.


--
-- Data for Name: accounts_interestedjobs; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_interestedjobs (id, "clientID_id", "specializationID_id") FROM stdin;
\.


--
-- Data for Name: accounts_kyc; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_kyc ("kycID", kyc_status, "reviewedAt", notes, "createdAt", "updatedAt", "accountFK_id", "reviewedBy_id", "rejectionCategory", "rejectionReason", "resubmissionCount", "maxResubmissions") FROM stdin;
9	APPROVED	2025-11-14 11:12:36.425846+00	Re-submitted	2025-11-14 10:31:00.060948+00	2025-11-14 11:12:36.425892+00	26	\N	\N		0	3
12	APPROVED	2025-11-24 09:05:00.456721+00		2025-11-23 02:55:00.023446+00	2025-11-24 09:05:00.456728+00	36	\N	\N		0	3
10	APPROVED	2025-11-24 09:05:34.581492+00		2025-11-16 14:46:18.005164+00	2025-11-24 09:05:34.581497+00	25	\N	\N		0	3
13	REJECTED	2025-12-11 17:41:21.194294+00	Auto-rejected by AI verification: FRONTID: No face detected in ID document. Please upload a clear photo of your ID showing your face.	2025-12-11 17:40:28.478199+00	2025-12-11 17:41:21.194304+00	56	\N	\N		0	3
15	PENDING	2025-12-12 05:38:35.149811+00	Re-submitted	2025-12-12 05:11:59.734849+00	2025-12-12 05:38:35.149825+00	50	\N	\N		0	3
14	APPROVED	2025-12-12 07:36:47.536535+00	Re-submitted	2025-12-12 05:01:26.111257+00	2025-12-12 07:36:47.536541+00	58	\N	\N		0	3
\.


--
-- Data for Name: accounts_kycfiles; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_kycfiles ("kycFileID", "idType", "fileURL", "fileName", "fileSize", "uploadedAt", "kycID_id", ai_verification_status, face_detected, face_count, face_confidence, ocr_text, ocr_confidence, quality_score, ai_confidence_score, ai_rejection_reason, ai_rejection_message, ai_warnings, ai_details, verified_at) FROM stdin;
34	PASSPORT	user_26/kyc/frontid_passport_f3788eab7df14f60a182b8e7baae34e4.jpg	frontid_passport_f3788eab7df14f60a182b8e7baae34e4.jpg	440295	2025-11-14 10:52:22.184891+00	9	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
35	PASSPORT	user_26/kyc/backid_passport_653e3fdfeb9147578c44f46a6d09e3d0.jpg	backid_passport_653e3fdfeb9147578c44f46a6d09e3d0.jpg	440295	2025-11-14 10:52:24.377186+00	9	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
36	POLICE	user_26/kyc/clearance_police_42c85272a013402a971d5749d4cb4b36.jpg	clearance_police_42c85272a013402a971d5749d4cb4b36.jpg	440295	2025-11-14 10:52:26.853229+00	9	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
37	\N	user_26/kyc/selfie_selfie_df63878f43e14e4bb536ddec653d640b.jpg	selfie_selfie_df63878f43e14e4bb536ddec653d640b.jpg	440295	2025-11-14 10:52:29.18996+00	9	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
38	NATIONALID	user_25/kyc/frontid_nationalid_00ee211afdf946139836265884249d47.png	frontid_nationalid_00ee211afdf946139836265884249d47.png	1623123	2025-11-16 14:46:22.301694+00	10	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
39	NATIONALID	user_25/kyc/backid_nationalid_ae4640466c974fd5a87f1805b4676994.png	backid_nationalid_ae4640466c974fd5a87f1805b4676994.png	1499369	2025-11-16 14:46:26.381694+00	10	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
40	NBI	user_25/kyc/clearance_nbi_a25b5cc87a8d4601b17ccff157aef058.png	clearance_nbi_a25b5cc87a8d4601b17ccff157aef058.png	1499369	2025-11-16 14:46:28.258106+00	10	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
41	\N	user_25/kyc/selfie_selfie_2235f5918a9945bb9ef3afcebd2045ea.jpg	selfie_selfie_2235f5918a9945bb9ef3afcebd2045ea.jpg	60361	2025-11-16 14:46:30.140456+00	10	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
46	DRIVERSLICENSE	user_36/kyc/frontid_driverslicense_bf6def74be37446db915b635898c6f95.jpg	frontid_driverslicense_bf6def74be37446db915b635898c6f95.jpg	75410	2025-11-23 02:55:01.970833+00	12	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
47	DRIVERSLICENSE	user_36/kyc/backid_driverslicense_625bf8b02a874c059454500721aec14b.jpg	backid_driverslicense_625bf8b02a874c059454500721aec14b.jpg	165058	2025-11-23 02:55:03.054987+00	12	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
48	NBI	user_36/kyc/clearance_nbi_a1c5384cc0ab47979dce2f581ecaab96.jpg	clearance_nbi_a1c5384cc0ab47979dce2f581ecaab96.jpg	77617	2025-11-23 02:55:04.402929+00	12	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
49	\N	user_36/kyc/selfie_selfie_f135dcb158094984af5b2a30fe0d8340.jpg	selfie_selfie_f135dcb158094984af5b2a30fe0d8340.jpg	436865	2025-11-23 02:55:06.432865+00	12	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	[]	{}	\N
53	NATIONALID	user_56/kyc/frontid_nationalid_fb3b9316559d444e87fb5a1bf5dafc83.jpg	frontid_nationalid_fb3b9316559d444e87fb5a1bf5dafc83.jpg	15814	2025-12-11 17:41:20.455706+00	13	FAILED	f	0	0	\N	\N	0.6592592592592592	0	NO_FACE_DETECTED	FRONTID: No face detected in ID document. Please upload a clear photo of your ID showing your face.	["Low resolution image (640x480)"]	{"quality": {"score": 0.6592592592592592, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (640x480)"], "blur_score": 1.0, "resolution_score": 0.14814814814814814}, "resolution": "640x480", "face_detection": {"count": 0, "reason": "CompreFace service not available", "skipped": true, "detected": false, "confidence": 0}}	2025-12-11 17:41:20.454575+00
54	NBI	user_56/kyc/clearance_nbi_743c478eacd043b0908851afc7a297eb.jpg	clearance_nbi_743c478eacd043b0908851afc7a297eb.jpg	45360	2025-12-11 17:41:21.190559+00	13	PASSED	f	0	\N	REPUBLIC OF THE PHILIPPINES\nNBI CLEARANCE\nNATIONAL BUREAU OF INVESTIGATION\nName: TEST USER\nDate: 2025-01-01	0.9053333333333333	0.6925925925925925	0.8793777777777778	\N	\N	["Low resolution image (800x600)"]	{"ocr": {"confidence": 0.9053333333333333, "text_length": 107}, "quality": {"score": 0.6925925925925925, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (800x600)"], "blur_score": 1.0, "resolution_score": 0.23148148148148148}, "resolution": "800x600", "keyword_check": {"passed": true, "document_type": "NBI", "found_keywords": ["NBI", "CLEARANCE"], "missing_groups": []}}	2025-12-11 17:41:21.189366+00
123	DRIVERSLICENSE	user_58/kyc/frontid_driverslicense_754fe59b49e04bdda2369a42e3225a05.jpg	frontid_driverslicense_754fe59b49e04bdda2369a42e3225a05.jpg	172604	2025-12-12 07:34:45.067154+00	14	PASSED	t	1	0.9914873838424683	’ REPUBLIC OF THE PHILIPPINES\nDEPARTMENT OF TRANSPORTATION : B\nLAND TRANSPORTATION OFFICE N\\’ /)\nDRIVER'S LICENSE Nt\nWg‘; Last Narne, Fiest Hame, hicdie Hame\nR “i’g& CORNELIO, VANIEL JOHN GARCIA\n3 Th Nauonally  Ses  Date o) B Weight (kg)  Heightim P\n© PHL M 2005/02/02 50 1.60 F\nAddress\nZONE 4, PASOBOLONG. Z2M1ECANGA CITY.\nZAMBOANGA DEL SUR ~\nLicense No a\n104-22-000377 2027/02/02 jo4\no p Bloed Type Eyes Color\n# 95 | - BLAGK / /L‘/"\n) \\' o e DI Godes Conditions 7;‘\\ :’j//' -\n% A58 B Am[/mox/f MENDOZA 1\nSrgnall}re of Linensee ssiatant Secretacy	0.592906976744186	0.7296354166666666	0.7933576715602431	\N	\N	["Low resolution image (1026x655)"]	{"ocr": {"error": null, "reason": null, "skipped": false, "confidence": 0.592906976744186, "text_length": 547}, "quality": {"score": 0.7296354166666666, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (1026x655)"], "blur_score": 1.0, "resolution_score": 0.3240885416666667}, "resolution": "1026x655", "keyword_check": {"passed": true, "document_type": "DRIVERSLICENSE", "found_keywords": ["DRIVER", "PHILIPPINES"], "missing_groups": []}, "face_detection": {"count": 1, "faces": [{"box": {"x_max": 302, "x_min": 137, "y_max": 442, "y_min": 232, "probability": 0.9914873838424683}, "probability": 0.9914873838424683}], "detected": true, "confidence": 0.9914873838424683, "face_too_small": false}}	2025-12-12 07:34:45.065455+00
124	DRIVERSLICENSE	user_58/kyc/backid_driverslicense_cab6db58a0f84559b2aa73a5b47bece8.jpg	backid_driverslicense_cab6db58a0f84559b2aa73a5b47bece8.jpg	172604	2025-12-12 07:34:46.726442+00	14	PASSED	t	1	0.9914873838424683	’ REPUBLIC OF THE PHILIPPINES\nDEPARTMENT OF TRANSPORTATION : B\nLAND TRANSPORTATION OFFICE N\\’ /)\nDRIVER'S LICENSE Nt\nWg‘; Last Narne, Fiest Hame, hicdie Hame\nR “i’g& CORNELIO, VANIEL JOHN GARCIA\n3 Th Nauonally  Ses  Date o) B Weight (kg)  Heightim P\n© PHL M 2005/02/02 50 1.60 F\nAddress\nZONE 4, PASOBOLONG. Z2M1ECANGA CITY.\nZAMBOANGA DEL SUR ~\nLicense No a\n104-22-000377 2027/02/02 jo4\no p Bloed Type Eyes Color\n# 95 | - BLAGK / /L‘/"\n) \\' o e DI Godes Conditions 7;‘\\ :’j//' -\n% A58 B Am[/mox/f MENDOZA 1\nSrgnall}re of Linensee ssiatant Secretacy	0.592906976744186	0.7296354166666666	0.7933576715602431	\N	\N	["Low resolution image (1026x655)"]	{"ocr": {"error": null, "reason": null, "skipped": false, "confidence": 0.592906976744186, "text_length": 547}, "quality": {"score": 0.7296354166666666, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (1026x655)"], "blur_score": 1.0, "resolution_score": 0.3240885416666667}, "resolution": "1026x655", "keyword_check": {"passed": true, "document_type": "DRIVERSLICENSE", "found_keywords": ["DRIVER", "PHILIPPINES"], "missing_groups": []}, "face_detection": {"count": 1, "faces": [{"box": {"x_max": 302, "x_min": 137, "y_max": 442, "y_min": 232, "probability": 0.9914873838424683}, "probability": 0.9914873838424683}], "detected": true, "confidence": 0.9914873838424683, "face_too_small": false}}	2025-12-12 07:34:46.724884+00
125	NBI	user_58/kyc/clearance_nbi_9105b32e4994494c8a421da8bd6f2dd8.jpg	clearance_nbi_9105b32e4994494c8a421da8bd6f2dd8.jpg	46698	2025-12-12 07:34:47.410496+00	14	PASSED	f	0	\N	REPUBLIKANG PILIPINAS\n\nNATIONAL BUREAUOF INVESTIGATION\nNBICLEARANGE\n\nThisistocartity thatne parson\n\nWhoss ame appoars horson has o\ndorogatory record on il\n\nName: VANIELCORNELIO.\n\nDato of it January 1, 1995\n‘CLEARANCE NUMBER NBI-2025-12345\nNBI CLEARANCECERTIFICATE	0.52	0.8083333333333333	0.7985000000000001	\N	\N	["Low resolution image (1200x900)"]	{"ocr": {"error": null, "reason": null, "skipped": false, "confidence": 0.52, "text_length": 263}, "quality": {"score": 0.8083333333333333, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (1200x900)"], "blur_score": 1.0, "resolution_score": 0.5208333333333334}, "resolution": "1200x900", "keyword_check": {"passed": true, "document_type": "NBI", "found_keywords": ["NBI", "CLEARANCE"], "missing_groups": []}}	2025-12-12 07:34:47.408585+00
126	\N	user_58/kyc/selfie_selfie_80db6f797d8445539e375ff715435b99.jpg	selfie_selfie_80db6f797d8445539e375ff715435b99.jpg	172604	2025-12-12 07:34:47.448351+00	14	PASSED	f	0	\N	\N	\N	0.7296354166666666	0.918890625	\N	\N	["Low resolution image (1026x655)"]	{"quality": {"score": 0.7296354166666666, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (1026x655)"], "blur_score": 1.0, "resolution_score": 0.3240885416666667}, "resolution": "1026x655"}	2025-12-12 07:34:47.44688+00
87	NATIONALID	user_50/kyc/frontid_nationalid_998862a656ae4669b654962cb61fea6a.jpg	frontid_nationalid_998862a656ae4669b654962cb61fea6a.jpg	51129	2025-12-12 05:38:35.245338+00	15	FAILED	f	0	0	\N	\N	0.6771604938271605	0	NO_FACE_DETECTED	FRONTID: No face detected in ID document. Please upload a clear photo of your ID showing your face.	["Low resolution image (800x500)"]	{"quality": {"score": 0.6771604938271605, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (800x500)"], "blur_score": 1.0, "resolution_score": 0.19290123456790123}, "resolution": "800x500", "face_detection": {"count": 0, "error": "API error: 400", "detected": false, "confidence": 0}}	2025-12-12 05:38:35.243571+00
88	NATIONALID	user_50/kyc/backid_nationalid_0d8547356b3442fcb1906814a19bed40.jpg	backid_nationalid_0d8547356b3442fcb1906814a19bed40.jpg	51129	2025-12-12 05:38:35.329827+00	15	FAILED	f	0	0	\N	\N	0.6771604938271605	0	NO_FACE_DETECTED	BACKID: No face detected in ID document. Please upload a clear photo of your ID showing your face.	["Low resolution image (800x500)"]	{"quality": {"score": 0.6771604938271605, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (800x500)"], "blur_score": 1.0, "resolution_score": 0.19290123456790123}, "resolution": "800x500", "face_detection": {"count": 0, "error": "API error: 400", "detected": false, "confidence": 0}}	2025-12-12 05:38:35.328191+00
89	POLICE	user_50/kyc/clearance_police_5272ff4430ac409fbe660e6b19b1cde1.jpg	clearance_police_5272ff4430ac409fbe660e6b19b1cde1.jpg	89797	2025-12-12 05:38:36.478435+00	15	PASSED	f	0	\N	REPUBLIC OF THE PHILIPPINES\nPOLICE CLEARANCE\nThis is to certify that:\nName: JUAN DELA CRUZ\nAddress: 123 Main Street, Manila, Philippines\nDate of Birth: January 1, 1990\nPlace of Birth: Manila, Philippines\nhas no derogatory record on file as of this date.\nPurpose: EMPLOYMENT\nValid Until: December 31, 2025\nControl No: PC-2025-123456\nIssued by: Philippine National Police\nDate Issued: January 1, 2025\nAuthorized Signature	0.91640625	0.754320987654321	0.9012181712962963	\N	\N	["Low resolution image (800x1000)"]	{"ocr": {"confidence": 0.91640625, "text_length": 419}, "quality": {"score": 0.754320987654321, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (800x1000)"], "blur_score": 1.0, "resolution_score": 0.38580246913580246}, "resolution": "800x1000", "keyword_check": {"passed": true, "document_type": "POLICE", "found_keywords": ["POLICE", "CLEARANCE"], "missing_groups": []}}	2025-12-12 05:38:36.476946+00
90	\N	user_50/kyc/selfie_selfie_cf0c4501f8584dafb080483b7f0bbc6b.jpg	selfie_selfie_cf0c4501f8584dafb080483b7f0bbc6b.jpg	30216	2025-12-12 05:38:36.507289+00	15	PASSED	f	0	\N	\N	\N	0.6925925925925925	0.9077777777777778	\N	\N	["Low resolution image (600x800)"]	{"quality": {"score": 0.6925925925925925, "reason": null, "status": "PASSED", "warnings": ["Low resolution image (600x800)"], "blur_score": 1.0, "resolution_score": 0.23148148148148148}, "resolution": "600x800"}	2025-12-12 05:38:36.505763+00
\.


--
-- Data for Name: accounts_notification; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_notification ("notificationID", "notificationType", title, message, "isRead", "relatedKYCLogID", "createdAt", "readAt", "accountFK_id", "relatedJobID", "relatedApplicationID") FROM stdin;
1	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	t	2	2025-10-08 01:50:59.061436+00	2025-10-08 01:59:56.334588+00	6	\N	\N
2	KYC_APPROVED	KYC Verification Approved! Γ£à	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	t	3	2025-10-12 05:38:16.202254+00	2025-10-12 05:44:45.661582+00	6	\N	\N
3	KYC_APPROVED	KYC Verification Approved! Γ£à	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	t	4	2025-10-12 14:27:31.186104+00	2025-10-12 14:30:43.530151+00	7	\N	\N
4	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	f	5	2025-10-21 16:25:35.701262+00	\N	23	\N	\N
5	AGENCY_KYC_APPROVED	Agency KYC Verification Approved Γ£à	Your agency KYC verification has been approved.	f	6	2025-10-22 04:28:46.610757+00	\N	23	\N	\N
6	AGENCY_KYC_APPROVED	Agency KYC Verification Approved Γ£à	Your agency KYC verification has been approved.	f	7	2025-10-22 05:13:18.866717+00	\N	23	\N	\N
7	KYC_APPROVED	KYC Verification Approved! ├ó┼ôΓÇª	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	t	8	2025-11-14 11:12:36.64768+00	2025-11-14 11:13:30.462077+00	26	\N	\N
8	AGENCY_KYC_APPROVED	Agency KYC Verification Approved ├ó┼ôΓÇª	Your agency KYC verification has been approved.	f	9	2025-11-14 12:47:56.043934+00	\N	27	\N	\N
22	SYSTEM	Certification Added	Successfully added certification: Certified Bumbay	t	\N	2025-11-23 04:14:27.969435+00	2025-11-23 04:22:13.464635+00	36	\N	\N
23	SYSTEM	Material Added	Successfully added material: Cement	t	\N	2025-11-23 05:22:56.500502+00	2025-11-23 07:38:24.023213+00	36	\N	\N
25	ESCROW_PAID	Worker Requested	You've hired Vaniel Cornelio for 'KSLSKDNEME'. Escrow payment of Γé▒250.00 has been deducted from your wallet.	t	\N	2025-11-23 10:05:29.977849+00	2025-11-23 10:30:50.255893+00	7	33	\N
27	ESCROW_PAID	Worker Requested	You've hired Vaniel Cornelio for 'KSLSKDNEME'. Escrow payment of Γé▒250.00 has been deducted from your wallet.	t	\N	2025-11-23 10:06:13.204057+00	2025-11-23 10:30:50.255893+00	7	34	\N
20	JOB_ASSIGNED	You've been hired!	You've been directly hired for: NSKSKSMS	t	\N	2025-11-19 16:26:29.002385+00	2025-11-23 15:51:13.438678+00	6	29	\N
24	JOB_ASSIGNED	You've been hired!	You've been directly hired for: KSLSKDNEME	t	\N	2025-11-23 10:05:29.472117+00	2025-11-23 15:51:13.438678+00	6	33	\N
26	JOB_ASSIGNED	You've been hired!	You've been directly hired for: KSLSKDNEME	t	\N	2025-11-23 10:06:12.649658+00	2025-11-23 15:51:13.438678+00	6	34	\N
30	JOB_COMPLETED_CLIENT	Job Completion Approved! ≡ƒÄë	Vaniel Cornelio has approved the completion of 'Hi Gab'. Awaiting final payment.	t	\N	2025-11-23 15:17:43.192785+00	2025-11-23 15:51:13.438678+00	6	7	\N
31	KYC_APPROVED	KYC Verification Approved! ├ó┼ôΓÇª	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	f	10	2025-11-24 09:05:00.68752+00	\N	36	\N	\N
32	KYC_APPROVED	KYC Verification Approved! ├ó┼ôΓÇª	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	f	11	2025-11-24 09:05:34.763633+00	\N	25	\N	\N
28	APPLICATION_RECEIVED	New Application for 'Hi Dar'	Vaniel Cornelio applied for your job posting. Review their proposal and qualifications.	t	\N	2025-11-23 11:40:00.093123+00	2025-11-26 00:57:11.204548+00	7	8	25
29	APPLICATION_RECEIVED	New Application for 'Hi Gab'	Vaniel Cornelio applied for your job posting. Review their proposal and qualifications.	t	\N	2025-11-23 12:03:47.191799+00	2025-11-26 00:57:11.204548+00	7	7	26
33	JOB_INVITE_REJECTED	Vaniel Cornelio Declined Your Invitation	Vaniel Cornelio has declined your invitation for 'NSKSKSMS'. Your escrow payment has been refunded.	f	\N	2025-11-26 01:36:37.417987+00	\N	7	29	\N
35	JOB_INVITE_ACCEPTED	Vaniel Cornelio Accepted Your Invitation	Vaniel Cornelio has accepted your invitation for 'KSLSKDNEME'. The job is now active!	f	\N	2025-11-26 01:36:49.888295+00	\N	7	34	\N
40	REMAINING_PAYMENT_PAID	Payment Confirmed	Your cash payment proof for 'KSLSKDNEME' was uploaded successfully. Please leave a review!	f	\N	2025-11-26 04:44:26.40192+00	\N	7	34	\N
42	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Vaniel Cornelio has marked 'HELLO HELO' as complete. Please review the work and approve if satisfied.	f	\N	2025-11-26 05:44:01.492988+00	\N	7	12	\N
45	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of Γé▒199.99 for 'HELLO HELO' was successful. Please leave a review!	f	\N	2025-11-26 05:44:30.68256+00	\N	7	12	\N
34	JOB_INVITE_REJECTED_CONFIRM	Job Declined: NSKSKSMS	You've declined the job invitation for 'NSKSKSMS'.	t	\N	2025-11-26 01:36:37.47979+00	2025-11-26 06:15:15.295998+00	6	29	\N
36	JOB_INVITE_ACCEPTED_CONFIRM	Job Accepted: KSLSKDNEME	You've accepted the job invitation for 'KSLSKDNEME'. Start working on the project!	t	\N	2025-11-26 01:36:49.956926+00	2025-11-26 06:15:15.295998+00	6	34	\N
37	WORK_STARTED_CONFIRMED	Work Start Confirmed	Vaniel Cornelio has confirmed you have arrived and started work on 'KSLSKDNEME'. You can now mark the job as complete when finished.	t	\N	2025-11-26 04:22:52.434933+00	2025-11-26 06:15:15.295998+00	6	34	\N
38	JOB_COMPLETED_CLIENT	Job Completion Approved! ≡ƒÄë	Vaniel Cornelio has approved the completion of 'KSLSKDNEME'. Awaiting final payment.	t	\N	2025-11-26 04:44:25.878876+00	2025-11-26 06:15:15.295998+00	6	34	\N
39	PAYMENT_RELEASED	Payment Received! ≡ƒÆ░	You received Γé▒500.00 for 'KSLSKDNEME': Γé▒250.000 added to wallet + Γé▒250.00 cash payment confirmed.	t	\N	2025-11-26 04:44:26.207178+00	2025-11-26 06:15:15.295998+00	6	34	\N
41	WORK_STARTED_CONFIRMED	Work Start Confirmed	Vaniel Cornelio has confirmed you have arrived and started work on 'HELLO HELO'. You can now mark the job as complete when finished.	t	\N	2025-11-26 05:43:34.458847+00	2025-11-26 06:15:15.295998+00	6	12	\N
43	JOB_COMPLETED_CLIENT	Job Completion Approved! ≡ƒÄë	Vaniel Cornelio has approved the completion of 'HELLO HELO'. Awaiting final payment.	t	\N	2025-11-26 05:44:30.035299+00	2025-11-26 06:15:15.295998+00	6	12	\N
44	PAYMENT_RELEASED	Payment Received! ≡ƒÆ░	You received Γé▒399.98 for 'HELLO HELO'. The full amount has been added to your wallet!	t	\N	2025-11-26 05:44:30.61038+00	2025-11-26 06:15:15.295998+00	6	12	\N
46	ESCROW_PAID	Agency Requested	You've invited Devante for 'GEST AGENCY SHT'. Escrow payment of Γé▒250.00 has been deducted from your wallet.	f	\N	2025-11-26 06:36:18.704909+00	\N	7	44	\N
47	JOB_INVITE_ACCEPTED	Devante Accepted Your Invitation	Devante has accepted your invitation for 'GEST AGENCY SHT'. The job is now active!	f	\N	2025-11-26 06:36:36.200468+00	\N	7	44	\N
48	JOB_INVITE_ACCEPTED_CONFIRM	Job Accepted: GEST AGENCY SHT	You've accepted the job invitation for 'GEST AGENCY SHT'. Start working on the project!	f	\N	2025-11-26 06:36:36.25939+00	\N	23	44	\N
49	AGENCY_ASSIGNED_WORKER	Worker Assigned to Your Job	Devante has assigned Gabriel Modillas to work on "GEST AGENCY SHT".	f	\N	2025-11-26 08:58:31.142722+00	\N	7	44	\N
50	EMPLOYEE_OF_MONTH_SET	Employee of the Month: Gabriel Modillas	Gabriel Modillas has been selected as Employee of the Month! Reason: Only Employee	f	\N	2025-11-30 02:14:12.246065+00	\N	23	\N	\N
51	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Gabriel Modillas has marked 'GEST AGENCY SHT' as complete. Please review the work and approve if satisfied.	f	\N	2025-11-30 05:25:10.513588+00	\N	7	44	\N
52	PAYMENT_RELEASED	Payment Received! ≡ƒÆ░	Your agency received Γé▒500.00 for 'GEST AGENCY SHT'. The full amount has been added to your agency wallet!	f	\N	2025-11-30 05:25:22.922233+00	\N	23	44	\N
53	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of Γé▒250.00 for 'GEST AGENCY SHT' was successful. Please leave a review!	f	\N	2025-11-30 05:25:22.985444+00	\N	7	44	\N
54	ESCROW_PAID	Agency Requested	You've invited Devante for 'BUILD PAYA'. Escrow payment of Γé▒750.00 has been deducted from your wallet.	f	\N	2025-11-30 07:21:34.988672+00	\N	7	45	\N
55	JOB_INVITE_ACCEPTED	Devante Accepted Your Invitation	Devante has accepted your invitation for 'BUILD PAYA'. The job is now active!	f	\N	2025-11-30 07:50:11.020832+00	\N	7	45	\N
56	JOB_INVITE_ACCEPTED_CONFIRM	Job Accepted: BUILD PAYA	You've accepted the job invitation for 'BUILD PAYA'. Start working on the project!	f	\N	2025-11-30 07:50:11.088372+00	\N	23	45	\N
57	AGENCY_ASSIGNED_WORKER	Team Assigned to Your Job	Devante has assigned 2 workers to "BUILD PAYA". Team lead: Gabriel Modillas.	f	\N	2025-11-30 08:36:20.739472+00	\N	7	45	\N
58	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Gabriel Modillas has marked 'BUILD PAYA' as complete. Please review the work and approve if satisfied.	f	\N	2025-11-30 09:13:50.061867+00	\N	7	45	\N
59	PAYMENT_RELEASED	Payment Received! ≡ƒÆ░	Your agency received Γé▒1500.00 for 'BUILD PAYA'. The full amount has been added to your agency wallet!	f	\N	2025-11-30 09:14:00.137304+00	\N	23	45	\N
60	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of Γé▒750.00 for 'BUILD PAYA' was successful. Please leave a review!	f	\N	2025-11-30 09:14:00.205996+00	\N	7	45	\N
61	JOB_ASSIGNED	You've been hired!	You've been directly hired for: Fix Table	f	\N	2025-11-30 10:56:35.915065+00	\N	6	46	\N
62	ESCROW_PAID	Worker Requested	You've hired Vaniel Cornelio for 'Fix Table'. Escrow payment of Γé▒250.00 has been deducted from your wallet.	f	\N	2025-11-30 10:56:36.151726+00	\N	7	46	\N
63	JOB_INVITE_ACCEPTED	Vaniel Cornelio Accepted Your Invitation	Vaniel Cornelio has accepted your invitation for 'Fix Table'. The job is now active!	f	\N	2025-11-30 10:58:13.099834+00	\N	7	46	\N
64	JOB_INVITE_ACCEPTED_CONFIRM	Job Accepted: Fix Table	You've accepted the job invitation for 'Fix Table'. Start working on the project!	f	\N	2025-11-30 10:58:13.163303+00	\N	6	46	\N
65	WORK_STARTED_CONFIRMED	Work Start Confirmed	Vaniel Cornelio has confirmed you have arrived and started work on 'Fix Table'. You can now mark the job as complete when finished.	f	\N	2025-11-30 10:59:09.17565+00	\N	6	46	\N
66	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Vaniel Cornelio has marked 'Fix Table' as complete. Please review the work and approve if satisfied.	f	\N	2025-11-30 10:59:36.601777+00	\N	7	46	\N
67	JOB_COMPLETED_CLIENT	Job Completion Approved! ≡ƒÄë	Vaniel Cornelio has approved the completion of 'Fix Table'. Awaiting final payment.	f	\N	2025-11-30 11:00:16.180963+00	\N	6	46	\N
68	PAYMENT_RELEASED	Payment Received! ≡ƒÆ░	You received Γé▒500.00 for 'Fix Table'. The full amount has been added to your wallet!	f	\N	2025-11-30 11:00:16.753769+00	\N	6	46	\N
69	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of Γé▒250.00 for 'Fix Table' was successful. Please leave a review!	f	\N	2025-11-30 11:00:16.817439+00	\N	7	46	\N
70	AGENCY_KYC_REJECTED	Agency KYC Verification Rejected	Your agency KYC was not approved. Reason: Agency documents did not meet verification requirements. You may resubmit your documents.	f	12	2025-11-30 11:51:00.666775+00	\N	27	\N	\N
71	JOB_INVITE_REJECTED	Vaniel Cornelio Declined Your Invitation	Vaniel Cornelio has declined your invitation for 'KSLSKDNEME'. Your escrow payment has been refunded.	f	\N	2025-12-01 03:06:16.858886+00	\N	7	33	\N
72	JOB_INVITE_REJECTED_CONFIRM	Job Declined: KSLSKDNEME	You've declined the job invitation for 'KSLSKDNEME'.	f	\N	2025-12-01 03:06:16.927435+00	\N	6	33	\N
73	ESCROW_PAID	Agency Requested	You've invited Devante for 'KSKSKSNSNSN'. Escrow payment of ₱250.00 has been deducted from your wallet.	f	\N	2025-12-01 16:57:21.496956+00	\N	7	47	\N
74	JOB_INVITE_ACCEPTED	Devante Accepted Your Invitation	Devante has accepted your invitation for 'KSKSKSNSNSN'. The job is now active!	f	\N	2025-12-01 16:58:11.848458+00	\N	7	47	\N
75	JOB_INVITE_ACCEPTED_CONFIRM	Job Accepted: KSKSKSNSNSN	You've accepted the job invitation for 'KSKSKSNSNSN'. Start working on the project!	f	\N	2025-12-01 16:58:11.850884+00	\N	23	47	\N
76	AGENCY_ASSIGNED_WORKER	Team Assigned to Your Job	Devante has assigned 1 workers to "KSKSKSNSNSN". Team lead: Gabriel Modillas.	f	\N	2025-12-01 16:58:18.292619+00	\N	7	47	\N
77	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Gabriel Modillas has marked 'KSKSKSNSNSN' as complete. Please review the work and approve if satisfied.	f	\N	2025-12-01 16:58:54.943855+00	\N	7	47	\N
78	JOB_POSTED	Job Posted Successfully	Your job 'ANANANSNSNWNE WN' is now live! ₱84.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-09 11:08:04.482049+00	\N	7	48	\N
79	SYSTEM	Certification Added	Successfully added certification: Test Upload	f	\N	2025-12-09 15:52:21.076896+00	\N	6	\N	\N
80	SYSTEM	Certification Added	Successfully added certification: Test Upload	f	\N	2025-12-09 15:55:18.281659+00	\N	6	\N	\N
81	SYSTEM	Certification Added	Successfully added certification: Test Safety Certificate	f	\N	2025-12-10 13:26:50.892119+00	\N	38	\N	\N
82	SYSTEM	Certification Added	Successfully added certification: Test Safety Certificate	f	\N	2025-12-10 13:26:55.530272+00	\N	38	\N	\N
83	JOB_POSTED	Job Posted Successfully	Your job 'Test Multi-Criteria Review Job' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-10 14:59:38.173791+00	\N	48	49	\N
84	JOB_POSTED	Job Posted Successfully	Your job 'Test Multi-Criteria Review Job' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-10 14:59:44.074948+00	\N	48	50	\N
85	JOB_POSTED	Job Posted Successfully	Your job 'Test Multi-Criteria Review Job' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-10 14:59:50.389241+00	\N	48	51	\N
86	APPLICATION_RECEIVED	New Application for 'Test Multi-Criteria Review Job'	Test Worker applied for your job posting. Review their proposal and qualifications.	f	\N	2025-12-10 15:03:42.137715+00	\N	48	51	28
87	ESCROW_PAID	Payment Processed	₱900.0000 has been deducted from your wallet for 'Test Multi-Criteria Review Job' (₱750.00 escrow + ₱150.0000 platform fee).	f	\N	2025-12-10 15:04:19.089213+00	\N	48	51	\N
88	WORK_STARTED_CONFIRMED	Work Start Confirmed	Test Client has confirmed you have arrived and started work on 'Test Multi-Criteria Review Job'. You can now mark the job as complete when finished.	f	\N	2025-12-10 15:05:20.240449+00	\N	49	51	\N
89	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Test Worker has marked 'Test Multi-Criteria Review Job' as complete. Please review the work and approve if satisfied.	f	\N	2025-12-10 15:05:30.823135+00	\N	48	51	\N
90	JOB_COMPLETED_CLIENT	Job Completion Approved! 🎉	Test Client has approved the completion of 'Test Multi-Criteria Review Job'. Awaiting final payment.	f	\N	2025-12-10 15:05:48.64802+00	\N	49	51	\N
91	PAYMENT_RELEASED	Payment Received! 💰	You received ₱1500.00 for 'Test Multi-Criteria Review Job'. The full amount has been added to your wallet!	f	\N	2025-12-10 15:05:48.681973+00	\N	49	51	\N
92	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of ₱750.00 for 'Test Multi-Criteria Review Job' was successful. Please leave a review!	f	\N	2025-12-10 15:05:48.685523+00	\N	48	51	\N
93	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386358'	f	\N	2025-12-10 17:05:58.586389+00	\N	50	57	\N
94	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386358'	f	\N	2025-12-10 17:05:58.633099+00	\N	50	57	\N
95	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386431'	f	\N	2025-12-10 17:07:11.80598+00	\N	50	58	\N
96	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386431'	f	\N	2025-12-10 17:07:11.85484+00	\N	50	58	\N
97	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386485'	f	\N	2025-12-10 17:08:05.563926+00	\N	50	59	\N
98	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386485'	f	\N	2025-12-10 17:08:05.610787+00	\N	50	59	\N
99	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386528'	f	\N	2025-12-10 17:08:48.945048+00	\N	50	60	\N
100	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386528'	f	\N	2025-12-10 17:08:48.992749+00	\N	50	60	\N
101	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386590'	f	\N	2025-12-10 17:09:51.04576+00	\N	50	61	\N
102	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386590'	f	\N	2025-12-10 17:09:51.098816+00	\N	50	61	\N
103	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765386652'	f	\N	2025-12-10 17:10:53.094385+00	\N	50	62	\N
104	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765386652'	f	\N	2025-12-10 17:10:53.142259+00	\N	50	62	\N
105	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765387060'	f	\N	2025-12-10 17:17:40.421009+00	\N	50	63	\N
106	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765387060'	f	\N	2025-12-10 17:17:40.467539+00	\N	50	63	\N
107	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765387184'	f	\N	2025-12-10 17:19:44.514478+00	\N	50	64	\N
108	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765387184'	f	\N	2025-12-10 17:19:44.566898+00	\N	50	64	\N
109	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765387872'	f	\N	2025-12-10 17:31:12.781276+00	\N	50	65	\N
110	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765387872'	f	\N	2025-12-10 17:31:12.832516+00	\N	50	65	\N
111	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765387872'	f	\N	2025-12-10 17:31:12.936157+00	\N	52	65	\N
112	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765387872'	f	\N	2025-12-10 17:31:12.998239+00	\N	51	65	\N
113	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765388024'	f	\N	2025-12-10 17:33:44.297588+00	\N	50	66	\N
114	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765388024'	f	\N	2025-12-10 17:33:44.343069+00	\N	50	66	\N
115	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765388024'	f	\N	2025-12-10 17:33:44.442359+00	\N	52	66	\N
116	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765388024'	f	\N	2025-12-10 17:33:44.503627+00	\N	51	66	\N
117	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765388047'	f	\N	2025-12-10 17:34:07.379986+00	\N	50	67	\N
118	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765388047'	f	\N	2025-12-10 17:34:07.430933+00	\N	50	67	\N
119	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765388047'	f	\N	2025-12-10 17:34:07.542501+00	\N	52	67	\N
120	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765388047'	f	\N	2025-12-10 17:34:07.61197+00	\N	51	67	\N
121	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765388168'	f	\N	2025-12-10 17:36:08.983042+00	\N	50	68	\N
122	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765388168'	f	\N	2025-12-10 17:36:09.029058+00	\N	50	68	\N
123	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765388168'	f	\N	2025-12-10 17:36:09.130308+00	\N	52	68	\N
124	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765388168'	f	\N	2025-12-10 17:36:09.193802+00	\N	51	68	\N
125	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Accept/Reject Test Job 1765388708'	f	\N	2025-12-10 17:45:08.461961+00	\N	50	70	\N
126	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'Accept/Reject Test Job 1765388708'	f	\N	2025-12-10 17:45:08.513391+00	\N	50	70	\N
127	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'Accept/Reject Test Job 1765388708'	f	\N	2025-12-10 17:45:08.563783+00	\N	50	70	\N
128	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Accept/Reject Test Job 1765388708'	f	\N	2025-12-10 17:45:08.634697+00	\N	51	70	\N
129	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Accept/Reject Test Job 1765388708'	f	\N	2025-12-10 17:45:08.736968+00	\N	53	70	\N
130	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Accept/Reject Test 1765388904'	f	\N	2025-12-10 17:48:24.860362+00	\N	50	71	\N
131	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'Accept/Reject Test 1765388904'	f	\N	2025-12-10 17:48:24.907539+00	\N	50	71	\N
132	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'Accept/Reject Test 1765388904'	f	\N	2025-12-10 17:48:24.956125+00	\N	50	71	\N
133	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Accept/Reject Test 1765388904'	f	\N	2025-12-10 17:48:25.022121+00	\N	51	71	\N
134	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Accept/Reject Test 1765388904'	f	\N	2025-12-10 17:48:25.088119+00	\N	53	71	\N
135	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Accept/Reject Test 1765389499'	f	\N	2025-12-10 17:58:19.866803+00	\N	50	72	\N
136	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'Accept/Reject Test 1765389499'	f	\N	2025-12-10 17:58:19.924975+00	\N	50	72	\N
137	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'Accept/Reject Test 1765389499'	f	\N	2025-12-10 17:58:19.980224+00	\N	50	72	\N
138	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Accept/Reject Test 1765389499'	f	\N	2025-12-10 17:58:20.051117+00	\N	51	72	\N
139	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Accept/Reject Test 1765389499'	f	\N	2025-12-10 17:58:20.124272+00	\N	53	72	\N
140	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Accept/Reject Test 1765389569'	f	\N	2025-12-10 17:59:29.813462+00	\N	50	73	\N
141	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'Accept/Reject Test 1765389569'	f	\N	2025-12-10 17:59:29.863883+00	\N	50	73	\N
142	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'Accept/Reject Test 1765389569'	f	\N	2025-12-10 17:59:29.914852+00	\N	50	73	\N
143	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Accept/Reject Test 1765389569'	f	\N	2025-12-10 17:59:29.981556+00	\N	51	73	\N
144	TEAM_APPLICATION_REJECTED	Application Not Accepted	Your application for Plumbing position in 'Accept/Reject Test 1765389569' was not accepted.	f	\N	2025-12-10 17:59:30.033405+00	\N	52	73	\N
145	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Accept/Reject Test 1765389569'	f	\N	2025-12-10 17:59:30.100558+00	\N	53	73	\N
148	JOB_POSTED	Job Posted Successfully	Your job 'Fix Kitchen Faucet' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-11 16:32:35.805468+00	\N	54	75	\N
149	APPLICATION_RECEIVED	New Application for 'Fix Kitchen Faucet'	Test Worker applied for your job posting. Review their proposal and qualifications.	f	\N	2025-12-11 16:35:06.718449+00	\N	54	75	65
150	ESCROW_PAID	Payment Processed	₱900.0000 has been deducted from your wallet for 'Fix Kitchen Faucet' (₱750.00 escrow + ₱150.0000 platform fee).	f	\N	2025-12-11 16:35:28.697653+00	\N	54	75	\N
151	WORK_STARTED_CONFIRMED	Work Start Confirmed	Test Client has confirmed you have arrived and started work on 'Fix Kitchen Faucet'. You can now mark the job as complete when finished.	f	\N	2025-12-11 16:36:02.975906+00	\N	55	75	\N
152	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Test Worker has marked 'Fix Kitchen Faucet' as complete. Please review the work and approve if satisfied.	f	\N	2025-12-11 16:36:10.252604+00	\N	54	75	\N
153	JOB_COMPLETED_CLIENT	Job Completion Approved! 🎉	Test Client has approved the completion of 'Fix Kitchen Faucet'. Awaiting final payment.	f	\N	2025-12-11 16:36:15.701175+00	\N	55	75	\N
154	PAYMENT_PENDING	Payment Pending - ₱1500.00 💰	You earned ₱1500.00 for 'Fix Kitchen Faucet'. Payment will be released on December 18, 2025 at 04:36 PM (7 days).	f	\N	2025-12-11 16:36:15.74207+00	\N	55	75	\N
155	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of ₱750.00 for 'Fix Kitchen Faucet' was successful. Please leave a review!	f	\N	2025-12-11 16:36:15.752393+00	\N	54	75	\N
156	CERTIFICATION_APPROVED	Certification Approved! ✅	Your certification 'Updated Safety Certificate' has been verified and approved.	f	2	2025-12-11 18:31:11.597048+00	\N	38	\N	\N
157	CERTIFICATION_REJECTED	Certification Requires Update ⚠️	Your certification 'Test Safety Certificate' needs revision. Reason: Test rejection: Certificate image unclear	f	3	2025-12-11 18:31:16.071156+00	\N	38	\N	\N
158	JOB_POSTED	Job Posted Successfully	Your job 'Fix leaking Pipes' is now live! ₱150.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 04:11:35.565969+00	\N	7	77	\N
159	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765513798'	f	\N	2025-12-12 04:29:58.867366+00	\N	50	78	\N
160	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765513798'	f	\N	2025-12-12 04:29:58.917488+00	\N	50	78	\N
161	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765513798'	f	\N	2025-12-12 04:29:59.031093+00	\N	52	78	\N
162	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765513798'	f	\N	2025-12-12 04:29:59.096922+00	\N	51	78	\N
163	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	f	13	2025-12-12 05:42:42.096216+00	\N	58	\N	\N
164	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	f	14	2025-12-12 06:05:55.969613+00	\N	58	\N	\N
165	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	f	15	2025-12-12 06:48:24.287642+00	\N	58	\N	\N
166	KYC_REJECTED	KYC Verification Rejected	Your KYC verification was not approved. Reason: Documents did not meet verification requirements. You can resubmit your documents with the correct information.	f	16	2025-12-12 06:53:02.014485+00	\N	58	\N	\N
167	KYC_APPROVED	KYC Verification Approved! âœ…	Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.	f	17	2025-12-12 07:36:47.551514+00	\N	58	\N	\N
168	JOB_POSTED	Job Posted Successfully	Your job 'Fix Leaking Faucet - Test 090653' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 09:06:53.499676+00	\N	54	80	\N
169	NEW_TEAM_APPLICATION	New Team Application	Test Worker applied for Plumbing position in 'Team Mode Test - 091443'	f	\N	2025-12-12 09:14:44.299223+00	\N	54	84	\N
170	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Team Mode Test - 091443'	f	\N	2025-12-12 09:14:44.362001+00	\N	55	84	\N
171	NEW_TEAM_APPLICATION	New Team Application	Test Worker applied for Plumbing position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:52.617434+00	\N	54	85	\N
172	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:52.912+00	\N	54	85	\N
173	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.204268+00	\N	54	85	\N
174	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.261085+00	\N	55	85	\N
175	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.318765+00	\N	51	85	\N
176	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.377815+00	\N	52	85	\N
177	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171752' has started. Please begin your work.	f	\N	2025-12-12 09:17:53.433238+00	\N	55	85	\N
178	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171752' has started. Please begin your work.	f	\N	2025-12-12 09:17:53.435294+00	\N	51	85	\N
179	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171752' has started. Please begin your work.	f	\N	2025-12-12 09:17:53.436477+00	\N	52	85	\N
180	TEAM_WORKER_COMPLETE	Team Member Completed Work	Test Worker has completed their Plumbing work for 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.485139+00	\N	54	85	\N
181	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.535912+00	\N	54	85	\N
182	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Complete Team Flow Test - 171752'	f	\N	2025-12-12 09:17:53.583146+00	\N	54	85	\N
183	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171752'. Payment is being processed.	f	\N	2025-12-12 09:17:53.651258+00	\N	55	85	\N
184	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171752'. Payment is being processed.	f	\N	2025-12-12 09:17:53.656777+00	\N	51	85	\N
185	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171752'. Payment is being processed.	f	\N	2025-12-12 09:17:53.661397+00	\N	52	85	\N
186	NEW_TEAM_APPLICATION	New Team Application	Test Worker applied for Plumbing position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:04.484523+00	\N	54	86	\N
187	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:04.793595+00	\N	54	86	\N
188	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.101832+00	\N	54	86	\N
189	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.163727+00	\N	55	86	\N
190	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.230494+00	\N	51	86	\N
191	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.30064+00	\N	52	86	\N
192	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171904' has started. Please begin your work.	f	\N	2025-12-12 09:19:05.354906+00	\N	55	86	\N
193	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171904' has started. Please begin your work.	f	\N	2025-12-12 09:19:05.35672+00	\N	51	86	\N
194	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171904' has started. Please begin your work.	f	\N	2025-12-12 09:19:05.357988+00	\N	52	86	\N
195	TEAM_WORKER_COMPLETE	Team Member Completed Work	Test Worker has completed their Plumbing work for 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.406252+00	\N	54	86	\N
196	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.458159+00	\N	54	86	\N
197	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Complete Team Flow Test - 171904'	f	\N	2025-12-12 09:19:05.508538+00	\N	54	86	\N
198	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171904'. Payment is being processed.	f	\N	2025-12-12 09:19:05.58139+00	\N	55	86	\N
199	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171904'. Payment is being processed.	f	\N	2025-12-12 09:19:05.587311+00	\N	51	86	\N
200	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171904'. Payment is being processed.	f	\N	2025-12-12 09:19:05.591775+00	\N	52	86	\N
201	NEW_TEAM_APPLICATION	New Team Application	Test Worker applied for Plumbing position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:56.776156+00	\N	54	87	\N
202	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.070443+00	\N	54	87	\N
203	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.363722+00	\N	54	87	\N
204	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.421675+00	\N	55	87	\N
243	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:21.843935+00	\N	66	106	\N
205	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.479896+00	\N	51	87	\N
206	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.537166+00	\N	52	87	\N
207	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171956' has started. Please begin your work.	f	\N	2025-12-12 09:19:57.589797+00	\N	55	87	\N
208	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171956' has started. Please begin your work.	f	\N	2025-12-12 09:19:57.591798+00	\N	51	87	\N
209	TEAM_JOB_STARTED	Team Job Started!	'Complete Team Flow Test - 171956' has started. Please begin your work.	f	\N	2025-12-12 09:19:57.592857+00	\N	52	87	\N
210	TEAM_WORKER_COMPLETE	Team Member Completed Work	Test Worker has completed their Plumbing work for 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.640331+00	\N	54	87	\N
211	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.688128+00	\N	54	87	\N
212	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Complete Team Flow Test - 171956'	f	\N	2025-12-12 09:19:57.736892+00	\N	54	87	\N
213	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171956'. Payment is being processed.	f	\N	2025-12-12 09:19:57.807586+00	\N	55	87	\N
214	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171956'. Payment is being processed.	f	\N	2025-12-12 09:19:57.813897+00	\N	51	87	\N
215	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Complete Team Flow Test - 171956'. Payment is being processed.	f	\N	2025-12-12 09:19:57.819515+00	\N	52	87	\N
216	NEW_TEAM_APPLICATION	New Team Application	Test Worker applied for Plumbing position in 'RN Test - Team Job 172409'	f	\N	2025-12-12 09:24:10.026732+00	\N	54	88	\N
217	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Test - Team Job 172409'	f	\N	2025-12-12 09:24:10.128475+00	\N	55	88	\N
226	JOB_POSTED	Job Posted Successfully	Your job 'Payment Buffer API Test - 21:09:43' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 13:09:43.31439+00	\N	54	97	\N
227	JOB_POSTED	Job Posted Successfully	Your job 'Payment Buffer API Test - 21:12:40' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 13:12:41.073308+00	\N	54	98	\N
228	JOB_POSTED	Job Posted Successfully	Your job 'Payment Buffer API Test - 21:13:44' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 13:13:44.97039+00	\N	54	99	\N
229	JOB_POSTED	Job Posted Successfully	Your job 'Payment Buffer API Test - 21:16:02' is now live! ₱900.000 has been reserved from your wallet (will be charged when a worker is accepted).	f	\N	2025-12-12 13:16:02.366627+00	\N	54	100	\N
230	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Quick Home Repair'	f	\N	2025-12-12 15:37:43.661385+00	\N	50	101	\N
231	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Quick Home Repair'	f	\N	2025-12-12 15:37:57.296405+00	\N	53	101	\N
232	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559198'	f	\N	2025-12-12 17:06:38.471677+00	\N	66	104	\N
233	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559198'	f	\N	2025-12-12 17:06:38.522338+00	\N	66	104	\N
234	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559198'	f	\N	2025-12-12 17:06:38.571932+00	\N	66	104	\N
235	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559198'	f	\N	2025-12-12 17:06:38.68262+00	\N	69	104	\N
236	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559198'	f	\N	2025-12-12 17:06:38.754966+00	\N	68	104	\N
237	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559202'	f	\N	2025-12-12 17:06:42.69392+00	\N	66	105	\N
238	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559202'	f	\N	2025-12-12 17:06:42.74853+00	\N	66	105	\N
239	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559202'	f	\N	2025-12-12 17:06:42.810475+00	\N	66	105	\N
240	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559202'	f	\N	2025-12-12 17:06:42.923844+00	\N	69	105	\N
241	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559202'	f	\N	2025-12-12 17:06:42.989485+00	\N	68	105	\N
242	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:21.791788+00	\N	66	106	\N
244	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:21.898298+00	\N	66	106	\N
245	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:22.012928+00	\N	69	106	\N
246	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:22.086916+00	\N	68	106	\N
247	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559301' has started. Please begin your work.	f	\N	2025-12-12 17:08:22.66945+00	\N	68	106	\N
248	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559301' has started. Please begin your work.	f	\N	2025-12-12 17:08:22.672338+00	\N	69	106	\N
249	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:22.875839+00	\N	66	106	\N
250	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559301'	f	\N	2025-12-12 17:08:22.980712+00	\N	66	106	\N
251	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559301'. Payment is being processed.	f	\N	2025-12-12 17:08:23.062124+00	\N	68	106	\N
252	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559301'. Payment is being processed.	f	\N	2025-12-12 17:08:23.068803+00	\N	69	106	\N
253	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:24.581721+00	\N	66	107	\N
254	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:24.630769+00	\N	66	107	\N
255	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:24.678552+00	\N	66	107	\N
256	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:24.802421+00	\N	69	107	\N
257	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:24.869391+00	\N	68	107	\N
258	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559364' has started. Please begin your work.	f	\N	2025-12-12 17:09:25.785141+00	\N	68	107	\N
259	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559364' has started. Please begin your work.	f	\N	2025-12-12 17:09:25.787585+00	\N	69	107	\N
260	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:25.975302+00	\N	66	107	\N
261	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559364'	f	\N	2025-12-12 17:09:26.068723+00	\N	66	107	\N
262	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559364'. Payment is being processed.	f	\N	2025-12-12 17:09:26.14898+00	\N	68	107	\N
263	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559364'. Payment is being processed.	f	\N	2025-12-12 17:09:26.155676+00	\N	69	107	\N
264	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:29.885841+00	\N	66	108	\N
265	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:29.936734+00	\N	66	108	\N
266	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:29.984658+00	\N	66	108	\N
267	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:30.097089+00	\N	69	108	\N
268	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:30.162347+00	\N	68	108	\N
269	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559429' has started. Please begin your work.	f	\N	2025-12-12 17:10:30.983001+00	\N	68	108	\N
270	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559429' has started. Please begin your work.	f	\N	2025-12-12 17:10:30.984965+00	\N	69	108	\N
271	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:31.164592+00	\N	66	108	\N
272	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559429'	f	\N	2025-12-12 17:10:31.256077+00	\N	66	108	\N
273	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559429'. Payment is being processed.	f	\N	2025-12-12 17:10:31.33648+00	\N	68	108	\N
274	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559429'. Payment is being processed.	f	\N	2025-12-12 17:10:31.342596+00	\N	69	108	\N
275	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:35.864684+00	\N	66	109	\N
276	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:35.91993+00	\N	66	109	\N
277	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:35.967695+00	\N	66	109	\N
278	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:36.074334+00	\N	69	109	\N
279	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:36.13799+00	\N	68	109	\N
280	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559495' has started. Please begin your work.	f	\N	2025-12-12 17:11:36.933242+00	\N	68	109	\N
281	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559495' has started. Please begin your work.	f	\N	2025-12-12 17:11:36.935208+00	\N	69	109	\N
282	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:37.134978+00	\N	66	109	\N
283	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559495'	f	\N	2025-12-12 17:11:37.224188+00	\N	66	109	\N
284	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559495'. Payment is being processed.	f	\N	2025-12-12 17:11:37.301766+00	\N	68	109	\N
285	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559495'. Payment is being processed.	f	\N	2025-12-12 17:11:37.307944+00	\N	69	109	\N
286	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:08.786269+00	\N	66	110	\N
287	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:08.835227+00	\N	66	110	\N
288	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:08.88285+00	\N	66	110	\N
289	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:08.987723+00	\N	69	110	\N
290	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:09.051278+00	\N	68	110	\N
291	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559528' has started. Please begin your work.	f	\N	2025-12-12 17:12:09.530317+00	\N	68	110	\N
292	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559528' has started. Please begin your work.	f	\N	2025-12-12 17:12:09.532523+00	\N	69	110	\N
293	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:09.707203+00	\N	66	110	\N
294	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559528'	f	\N	2025-12-12 17:12:09.793569+00	\N	66	110	\N
295	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559528'. Payment is being processed.	f	\N	2025-12-12 17:12:09.867194+00	\N	68	110	\N
296	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559528'. Payment is being processed.	f	\N	2025-12-12 17:12:09.87435+00	\N	69	110	\N
297	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:56.658644+00	\N	66	111	\N
298	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:56.704782+00	\N	66	111	\N
299	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:56.751758+00	\N	66	111	\N
300	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:56.858858+00	\N	69	111	\N
301	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:56.92292+00	\N	68	111	\N
302	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559576' has started. Please begin your work.	f	\N	2025-12-12 17:12:57.753318+00	\N	68	111	\N
303	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559576' has started. Please begin your work.	f	\N	2025-12-12 17:12:57.755433+00	\N	69	111	\N
304	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:57.93881+00	\N	66	111	\N
305	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559576'	f	\N	2025-12-12 17:12:58.030576+00	\N	66	111	\N
306	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559576'. Payment is being processed.	f	\N	2025-12-12 17:12:58.108949+00	\N	68	111	\N
307	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559576'. Payment is being processed.	f	\N	2025-12-12 17:12:58.115512+00	\N	69	111	\N
308	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:42.76709+00	\N	66	112	\N
309	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:42.8209+00	\N	66	112	\N
310	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:42.87019+00	\N	66	112	\N
311	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:42.980272+00	\N	69	112	\N
312	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:43.042414+00	\N	68	112	\N
313	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559682' has started. Please begin your work.	f	\N	2025-12-12 17:14:43.589047+00	\N	68	112	\N
314	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559682' has started. Please begin your work.	f	\N	2025-12-12 17:14:43.591115+00	\N	69	112	\N
315	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:43.77535+00	\N	66	112	\N
316	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559682'	f	\N	2025-12-12 17:14:43.866398+00	\N	66	112	\N
317	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559682'. Payment is being processed.	f	\N	2025-12-12 17:14:43.943349+00	\N	68	112	\N
318	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559682'. Payment is being processed.	f	\N	2025-12-12 17:14:43.950393+00	\N	69	112	\N
319	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:53.713469+00	\N	66	113	\N
320	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:53.76123+00	\N	66	113	\N
321	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:53.808206+00	\N	66	113	\N
322	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:53.922187+00	\N	69	113	\N
323	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:53.990847+00	\N	68	113	\N
324	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559993' has started. Please begin your work.	f	\N	2025-12-12 17:19:54.882911+00	\N	68	113	\N
325	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765559993' has started. Please begin your work.	f	\N	2025-12-12 17:19:54.885006+00	\N	69	113	\N
326	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:55.062949+00	\N	66	113	\N
327	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765559993'	f	\N	2025-12-12 17:19:55.149829+00	\N	66	113	\N
328	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559993'. Payment is being processed.	f	\N	2025-12-12 17:19:55.228215+00	\N	68	113	\N
329	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765559993'. Payment is being processed.	f	\N	2025-12-12 17:19:55.234762+00	\N	69	113	\N
330	NEW_TEAM_APPLICATION	New Team Application	Worker One applied for Carpentry position in 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:27.946544+00	\N	66	114	\N
331	NEW_TEAM_APPLICATION	New Team Application	Worker Two applied for Carpentry position in 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:27.992082+00	\N	66	114	\N
332	NEW_TEAM_APPLICATION	New Team Application	Worker Three applied for Appliance Repair position in 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:28.037651+00	\N	66	114	\N
333	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:28.140637+00	\N	69	114	\N
334	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Carpentry position in 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:28.204871+00	\N	68	114	\N
335	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765560027' has started. Please begin your work.	f	\N	2025-12-12 17:20:29.126565+00	\N	68	114	\N
336	TEAM_JOB_STARTED	Team Job Started!	'Team Mode Test Job #1765560027' has started. Please begin your work.	f	\N	2025-12-12 17:20:29.128758+00	\N	69	114	\N
337	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Two has completed their Carpentry work for 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:29.308197+00	\N	66	114	\N
338	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker Three has completed their Appliance Repair work for 'Team Mode Test Job #1765560027'	f	\N	2025-12-12 17:20:29.399492+00	\N	66	114	\N
339	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765560027'. Payment is being processed.	f	\N	2025-12-12 17:20:29.476598+00	\N	68	114	\N
340	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Team Mode Test Job #1765560027'. Payment is being processed.	f	\N	2025-12-12 17:20:29.482823+00	\N	69	114	\N
341	APPLICATION_RECEIVED	New Application for 'Fix THIS SHITTT NOWWWW'	Vaniel Cornelio applied for your job posting. Review their proposal and qualifications.	f	\N	2025-12-12 17:51:12.852587+00	\N	7	115	113
342	ESCROW_PAID	Payment Processed	₱14.0000 has been deducted from your wallet for 'Fix THIS SHITTT NOWWWW' (₱0.00 escrow + ₱14.0000 platform fee).	f	\N	2025-12-12 17:52:05.218842+00	\N	7	115	\N
343	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765562644'	f	\N	2025-12-12 18:04:04.246522+00	\N	50	116	\N
344	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765562644'	f	\N	2025-12-12 18:04:04.311201+00	\N	50	116	\N
345	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765562644'	f	\N	2025-12-12 18:04:04.424471+00	\N	52	116	\N
346	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765562644'	f	\N	2025-12-12 18:04:04.485662+00	\N	51	116	\N
347	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.067587+00	\N	50	118	\N
348	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.114941+00	\N	50	118	\N
349	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.169799+00	\N	50	118	\N
350	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.279495+00	\N	53	118	\N
351	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.340937+00	\N	52	118	\N
352	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562710'	f	\N	2025-12-12 18:05:11.400721+00	\N	51	118	\N
353	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562710' has started. Please begin your work.	f	\N	2025-12-12 18:05:11.637779+00	\N	53	118	\N
354	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562710' has started. Please begin your work.	f	\N	2025-12-12 18:05:11.639628+00	\N	51	118	\N
355	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562710' has started. Please begin your work.	f	\N	2025-12-12 18:05:11.640914+00	\N	52	118	\N
356	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:57.943914+00	\N	50	119	\N
357	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:57.993566+00	\N	50	119	\N
358	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:58.041683+00	\N	50	119	\N
359	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:58.143503+00	\N	53	119	\N
360	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:58.205835+00	\N	52	119	\N
361	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562817'	f	\N	2025-12-12 18:06:58.272267+00	\N	51	119	\N
362	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562817' has started. Please begin your work.	f	\N	2025-12-12 18:06:58.509744+00	\N	53	119	\N
363	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562817' has started. Please begin your work.	f	\N	2025-12-12 18:06:58.512802+00	\N	51	119	\N
364	TEAM_JOB_STARTED	Team Job Started!	'Conversation Test 1765562817' has started. Please begin your work.	f	\N	2025-12-12 18:06:58.514293+00	\N	52	119	\N
365	APPLICATION_RECEIVED	New Application for 'Fix leaking Pipes'	Vaniel Cornelio applied for your job posting. Review their proposal and qualifications.	f	\N	2025-12-12 18:22:00.660102+00	\N	7	77	122
366	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'RN Flow Test - Home Renovation 041910'	f	\N	2025-12-12 20:19:11.503085+00	\N	7	121	\N
367	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'RN Flow Test - Home Renovation 041910'	f	\N	2025-12-12 20:19:11.554002+00	\N	7	121	\N
368	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'RN Flow Test - Home Renovation 041910'	f	\N	2025-12-12 20:19:11.609668+00	\N	7	121	\N
369	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'RN Flow Test - Home Renovation 041910'	f	\N	2025-12-12 20:19:11.731181+00	\N	53	121	\N
370	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Flow Test - Home Renovation 041910'	f	\N	2025-12-12 20:19:11.857885+00	\N	51	121	\N
371	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:28.961492+00	\N	7	122	\N
372	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.012785+00	\N	7	122	\N
373	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.058988+00	\N	7	122	\N
374	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.159269+00	\N	53	122	\N
375	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.225132+00	\N	52	122	\N
376	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.289219+00	\N	51	122	\N
377	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042128' has started. Please begin your work.	f	\N	2025-12-12 20:21:29.372558+00	\N	52	122	\N
378	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042128' has started. Please begin your work.	f	\N	2025-12-12 20:21:29.374488+00	\N	51	122	\N
379	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042128' has started. Please begin your work.	f	\N	2025-12-12 20:21:29.375612+00	\N	53	122	\N
380	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'RN Flow Test - Home Renovation 042128'	f	\N	2025-12-12 20:21:29.813576+00	\N	7	122	\N
381	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.341885+00	\N	7	123	\N
382	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Plumbing position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.391557+00	\N	7	123	\N
383	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Electrical position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.492544+00	\N	7	123	\N
384	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.596447+00	\N	53	123	\N
385	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.657921+00	\N	52	123	\N
386	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:12.716878+00	\N	51	123	\N
387	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042211' has started. Please begin your work.	f	\N	2025-12-12 20:22:12.792145+00	\N	52	123	\N
388	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042211' has started. Please begin your work.	f	\N	2025-12-12 20:22:12.794327+00	\N	51	123	\N
389	TEAM_JOB_STARTED	Team Job Started!	'RN Flow Test - Home Renovation 042211' has started. Please begin your work.	f	\N	2025-12-12 20:22:12.795708+00	\N	53	123	\N
390	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Plumbing work for 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:13.278825+00	\N	7	123	\N
391	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:13.330781+00	\N	7	123	\N
392	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Electrical work for 'RN Flow Test - Home Renovation 042211'	f	\N	2025-12-12 20:22:13.387128+00	\N	7	123	\N
393	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Vaniel Cornelio has approved the team job 'RN Flow Test - Home Renovation 042211'. Payment is being processed.	f	\N	2025-12-12 20:22:13.465859+00	\N	52	123	\N
394	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Vaniel Cornelio has approved the team job 'RN Flow Test - Home Renovation 042211'. Payment is being processed.	f	\N	2025-12-12 20:22:13.472594+00	\N	51	123	\N
395	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Vaniel Cornelio has approved the team job 'RN Flow Test - Home Renovation 042211'. Payment is being processed.	f	\N	2025-12-12 20:22:13.478596+00	\N	53	123	\N
396	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765571915'	f	\N	2025-12-12 20:38:35.595569+00	\N	50	127	\N
397	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765571915'	f	\N	2025-12-12 20:38:35.644247+00	\N	50	127	\N
398	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765571915'	f	\N	2025-12-12 20:38:35.747319+00	\N	52	127	\N
399	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765571915'	f	\N	2025-12-12 20:38:35.811157+00	\N	51	127	\N
400	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:32.655767+00	\N	50	128	\N
401	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:32.703787+00	\N	50	128	\N
402	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:32.810757+00	\N	52	128	\N
403	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:32.873352+00	\N	51	128	\N
404	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:33.338751+00	\N	50	128	\N
405	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765571972'	f	\N	2025-12-12 20:39:33.407285+00	\N	53	128	\N
406	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:21.613373+00	\N	50	129	\N
407	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:21.663118+00	\N	50	129	\N
408	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:21.767883+00	\N	52	129	\N
409	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:21.830232+00	\N	51	129	\N
410	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:22.255711+00	\N	50	129	\N
411	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:22.316099+00	\N	53	129	\N
412	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572141' has started. Please begin your work.	f	\N	2025-12-12 20:42:22.444748+00	\N	51	129	\N
413	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572141' has started. Please begin your work.	f	\N	2025-12-12 20:42:22.446725+00	\N	53	129	\N
414	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572141' has started. Please begin your work.	f	\N	2025-12-12 20:42:22.447841+00	\N	52	129	\N
415	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765572141'	f	\N	2025-12-12 20:42:22.557533+00	\N	50	129	\N
416	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:26.359647+00	\N	50	130	\N
417	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:26.408454+00	\N	50	130	\N
418	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:26.512744+00	\N	52	130	\N
419	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:26.574815+00	\N	51	130	\N
420	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:27.041239+00	\N	50	130	\N
421	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:27.109272+00	\N	53	130	\N
422	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572326' has started. Please begin your work.	f	\N	2025-12-12 20:45:27.242461+00	\N	51	130	\N
423	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572326' has started. Please begin your work.	f	\N	2025-12-12 20:45:27.244223+00	\N	53	130	\N
424	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572326' has started. Please begin your work.	f	\N	2025-12-12 20:45:27.245621+00	\N	52	130	\N
425	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:27.358134+00	\N	50	130	\N
426	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Plumbing work for 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:27.411933+00	\N	50	130	\N
427	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Home Renovation TEST 1765572326'	f	\N	2025-12-12 20:45:27.467495+00	\N	50	130	\N
428	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572326'. Payment is being processed.	f	\N	2025-12-12 20:45:27.546333+00	\N	51	130	\N
429	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572326'. Payment is being processed.	f	\N	2025-12-12 20:45:27.552979+00	\N	53	130	\N
430	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572326'. Payment is being processed.	f	\N	2025-12-12 20:45:27.557933+00	\N	52	130	\N
431	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:24.293753+00	\N	50	131	\N
432	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:24.34155+00	\N	50	131	\N
433	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:24.441114+00	\N	52	131	\N
434	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:24.502264+00	\N	51	131	\N
435	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:25.075944+00	\N	50	131	\N
436	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:25.135832+00	\N	53	131	\N
437	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572564' has started. Please begin your work.	f	\N	2025-12-12 20:49:25.277979+00	\N	51	131	\N
438	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572564' has started. Please begin your work.	f	\N	2025-12-12 20:49:25.280302+00	\N	53	131	\N
439	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572564' has started. Please begin your work.	f	\N	2025-12-12 20:49:25.281706+00	\N	52	131	\N
440	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:25.389536+00	\N	50	131	\N
441	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Plumbing work for 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:25.440385+00	\N	50	131	\N
442	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Home Renovation TEST 1765572564'	f	\N	2025-12-12 20:49:25.491018+00	\N	50	131	\N
443	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572564'. Payment is being processed.	f	\N	2025-12-12 20:49:25.570976+00	\N	51	131	\N
444	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572564'. Payment is being processed.	f	\N	2025-12-12 20:49:25.577729+00	\N	53	131	\N
445	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572564'. Payment is being processed.	f	\N	2025-12-12 20:49:25.582764+00	\N	52	131	\N
446	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.01474+00	\N	50	132	\N
447	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.064896+00	\N	50	132	\N
448	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.16798+00	\N	52	132	\N
449	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.231+00	\N	51	132	\N
450	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.836096+00	\N	50	132	\N
451	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:05.896824+00	\N	53	132	\N
452	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572604' has started. Please begin your work.	f	\N	2025-12-12 20:50:06.021815+00	\N	51	132	\N
453	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572604' has started. Please begin your work.	f	\N	2025-12-12 20:50:06.023647+00	\N	53	132	\N
454	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765572604' has started. Please begin your work.	f	\N	2025-12-12 20:50:06.02482+00	\N	52	132	\N
455	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:06.305397+00	\N	50	132	\N
456	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Plumbing work for 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:06.358621+00	\N	50	132	\N
457	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Home Renovation TEST 1765572604'	f	\N	2025-12-12 20:50:06.410113+00	\N	50	132	\N
458	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572604'. Payment is being processed.	f	\N	2025-12-12 20:50:06.502936+00	\N	51	132	\N
459	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572604'. Payment is being processed.	f	\N	2025-12-12 20:50:06.511497+00	\N	53	132	\N
460	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765572604'. Payment is being processed.	f	\N	2025-12-12 20:50:06.517392+00	\N	52	132	\N
464	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:28.278872+00	\N	50	164	\N
465	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:28.332704+00	\N	50	164	\N
466	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:28.475917+00	\N	52	164	\N
467	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:28.540346+00	\N	51	164	\N
468	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:29.169233+00	\N	50	164	\N
469	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:29.228452+00	\N	53	164	\N
470	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594288' has started. Please begin your work.	f	\N	2025-12-13 02:51:29.356102+00	\N	51	164	\N
471	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594288' has started. Please begin your work.	f	\N	2025-12-13 02:51:29.358131+00	\N	53	164	\N
472	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594288' has started. Please begin your work.	f	\N	2025-12-13 02:51:29.359288+00	\N	52	164	\N
473	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:29.632288+00	\N	50	164	\N
474	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Plumbing work for 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:29.683728+00	\N	50	164	\N
475	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Home Renovation TEST 1765594288'	f	\N	2025-12-13 02:51:29.735845+00	\N	50	164	\N
476	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594288'. Payment is being processed.	f	\N	2025-12-13 02:51:29.808952+00	\N	51	164	\N
477	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594288'. Payment is being processed.	f	\N	2025-12-13 02:51:29.81516+00	\N	53	164	\N
478	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594288'. Payment is being processed.	f	\N	2025-12-13 02:51:29.820112+00	\N	52	164	\N
479	NEW_TEAM_APPLICATION	New Team Application	Worker1 Test applied for Plumbing position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:39.422707+00	\N	50	165	\N
480	NEW_TEAM_APPLICATION	New Team Application	Worker2 Test applied for Electrical position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:39.468045+00	\N	50	165	\N
481	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:39.564278+00	\N	52	165	\N
482	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:39.621008+00	\N	51	165	\N
483	NEW_TEAM_APPLICATION	New Team Application	Worker3 Test applied for Plumbing position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:40.200629+00	\N	50	165	\N
484	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:40.257552+00	\N	53	165	\N
485	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594419' has started. Please begin your work.	f	\N	2025-12-13 02:53:40.37618+00	\N	51	165	\N
486	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594419' has started. Please begin your work.	f	\N	2025-12-13 02:53:40.377924+00	\N	53	165	\N
487	TEAM_JOB_STARTED	Team Job Started!	'Home Renovation TEST 1765594419' has started. Please begin your work.	f	\N	2025-12-13 02:53:40.379055+00	\N	52	165	\N
488	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker1 Test has completed their Plumbing work for 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:40.650794+00	\N	50	165	\N
489	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker3 Test has completed their Plumbing work for 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:40.701393+00	\N	50	165	\N
490	TEAM_WORKER_COMPLETE	Team Member Completed Work	Worker2 Test has completed their Electrical work for 'Home Renovation TEST 1765594419'	f	\N	2025-12-13 02:53:40.750191+00	\N	50	165	\N
491	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594419'. Payment is being processed.	f	\N	2025-12-13 02:53:40.824566+00	\N	51	165	\N
492	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594419'. Payment is being processed.	f	\N	2025-12-13 02:53:40.830696+00	\N	53	165	\N
493	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Test Client has approved the team job 'Home Renovation TEST 1765594419'. Payment is being processed.	f	\N	2025-12-13 02:53:40.835514+00	\N	52	165	\N
494	ESCROW_PAID	Payment Processed	₱150.0000 has been deducted from your wallet for 'Fix leaking Pipes' (₱125.00 escrow + ₱25.0000 platform fee).	f	\N	2025-12-13 04:36:58.72897+00	\N	7	77	\N
495	WORK_STARTED_CONFIRMED	Work Start Confirmed	Vaniel Cornelio has confirmed you have arrived and started work on 'Fix leaking Pipes'. You can now mark the job as complete when finished.	f	\N	2025-12-13 04:37:08.738206+00	\N	6	77	\N
496	JOB_COMPLETED_WORKER	Job Completion Pending Approval	Vaniel Cornelio has marked 'Fix leaking Pipes' as complete. Please review the work and approve if satisfied.	f	\N	2025-12-13 04:37:29.607307+00	\N	7	77	\N
497	JOB_COMPLETED_CLIENT	Job Completion Approved! 🎉	Vaniel Cornelio has approved the completion of 'Fix leaking Pipes'. Awaiting final payment.	f	\N	2025-12-13 04:38:02.278998+00	\N	6	77	\N
498	PAYMENT_PENDING	Payment Pending - ₱250.00 💰	You earned ₱250.00 for 'Fix leaking Pipes'. Payment will be released on December 20, 2025 at 04:38 AM (7 days).	f	\N	2025-12-13 04:38:02.301999+00	\N	6	77	\N
499	REMAINING_PAYMENT_PAID	Payment Confirmed	Your final payment of ₱125.00 for 'Fix leaking Pipes' was successful. Please leave a review!	f	\N	2025-12-13 04:38:02.310937+00	\N	7	77	\N
500	SYSTEM	Certification Added	Successfully added certification: FCK THIS SHT	f	\N	2025-12-15 02:46:57.354589+00	\N	6	\N	\N
501	SYSTEM	Certification Removed	Certification "FCK THIS SHT" has been removed from your profile	f	\N	2025-12-15 03:04:09.573802+00	\N	6	\N	\N
502	SYSTEM	Certification Added	Successfully added certification: FIX	f	\N	2025-12-15 03:27:09.797879+00	\N	6	\N	\N
503	SYSTEM	Profile Updated	Your profile has been updated. Profile completion: 57%	f	\N	2025-12-15 04:12:12.32524+00	\N	6	\N	\N
504	SYSTEM	Certification Added	Successfully added certification: ELECTRICIAN	f	\N	2025-12-16 00:50:38.520906+00	\N	36	\N	\N
505	CERTIFICATION_APPROVED	Certification Approved! ✅	Your certification 'ELECTRICIAN' has been verified and approved.	f	4	2025-12-16 01:01:54.381617+00	\N	36	\N	\N
506	NEW_TEAM_APPLICATION	New Team Application	Hutao Hutao applied for Plumbing position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:26:28.433959+00	\N	50	117	\N
507	NEW_TEAM_APPLICATION	New Team Application	Vaniel Cornelio applied for Electrical position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:28:55.465603+00	\N	50	117	\N
508	NEW_TEAM_APPLICATION	New Team Application	Vaniel Cornelio applied for Plumbing position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:41:08.282285+00	\N	50	117	\N
509	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:49:31.577561+00	\N	36	117	\N
510	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Electrical position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:49:37.484016+00	\N	6	117	\N
511	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Plumbing position in 'Conversation Test 1765562689'	f	\N	2025-12-16 01:49:41.528647+00	\N	7	117	\N
512	TEAM_JOB_READY	Team Ready!	All positions have been filled. Your team is ready to start!	f	\N	2025-12-16 02:11:55.246332+00	\N	50	117	\N
513	NEW_TEAM_APPLICATION	New Team Application	Vaniel Cornelio applied for Appliance Repair position in 'FIX CAR AT HOME'	f	\N	2025-12-16 02:28:10.705374+00	\N	7	166	\N
514	NEW_TEAM_APPLICATION	New Team Application	Hutao Hutao applied for Appliance Repair position in 'FIX CAR AT HOME'	f	\N	2025-12-16 02:28:42.794869+00	\N	7	166	\N
515	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'FIX CAR AT HOME'	f	\N	2025-12-16 02:29:06.843401+00	\N	36	166	\N
516	TEAM_APPLICATION_ACCEPTED	Application Accepted!	You've been accepted for Appliance Repair position in 'FIX CAR AT HOME'	f	\N	2025-12-16 02:29:09.351275+00	\N	6	166	\N
517	TEAM_JOB_READY	Team Ready!	All positions for 'FIX CAR AT HOME' have been filled. Your team is ready to start!	f	\N	2025-12-16 02:29:09.369187+00	\N	7	166	\N
518	TEAM_JOB_READY	Team Complete!	The team for 'FIX CAR AT HOME' is now complete. Waiting for client to confirm work start.	f	\N	2025-12-16 02:29:09.370351+00	\N	36	166	\N
519	TEAM_JOB_READY	Team Complete!	The team for 'FIX CAR AT HOME' is now complete. Waiting for client to confirm work start.	f	\N	2025-12-16 02:29:09.371509+00	\N	6	166	\N
520	ARRIVAL_CONFIRMED	Client Confirmed Your Arrival	Client has confirmed you arrived at the job site for 'FIX CAR AT HOME'	f	\N	2025-12-16 04:33:32.287832+00	\N	36	166	\N
521	ARRIVAL_CONFIRMED	Client Confirmed Your Arrival	Client has confirmed you arrived at the job site for 'FIX CAR AT HOME'	f	\N	2025-12-16 04:33:38.092107+00	\N	6	166	\N
522	TEAM_WORKER_COMPLETE	Team Member Completed Work	Hutao Hutao has completed their Appliance Repair work for 'FIX CAR AT HOME'	f	\N	2025-12-16 04:44:52.989123+00	\N	7	166	\N
523	TEAM_WORKER_COMPLETE	Team Member Completed Work	Vaniel Cornelio has completed their Appliance Repair work for 'FIX CAR AT HOME'	f	\N	2025-12-16 04:45:18.299658+00	\N	7	166	\N
524	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Vaniel Cornelio has approved the team job 'FIX CAR AT HOME'. Payment is being processed.	f	\N	2025-12-16 04:46:12.291794+00	\N	36	166	\N
525	TEAM_JOB_COMPLETED	Team Job Completed! 🎉	Vaniel Cornelio has approved the team job 'FIX CAR AT HOME'. Payment is being processed.	f	\N	2025-12-16 04:46:12.297092+00	\N	6	166	\N
\.


--
-- Data for Name: accounts_notificationsettings; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_notificationsettings ("settingsID", "pushEnabled", "soundEnabled", "jobUpdates", messages, payments, reviews, "kycUpdates", "doNotDisturbStart", "doNotDisturbEnd", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
1	t	t	t	t	t	t	t	\N	\N	2025-11-19 19:50:59.953506+00	2025-11-19 19:50:59.953518+00	7
2	t	t	t	t	t	t	t	\N	\N	2025-11-26 06:15:20.720404+00	2025-11-26 06:15:20.720415+00	6
\.


--
-- Data for Name: accounts_profile; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_profile ("profileID", "profileImg", "firstName", "lastName", "contactNum", "birthDate", "profileType", "accountFK_id", "middleName", latitude, location_sharing_enabled, location_updated_at, longitude) FROM stdin;
11	\N	Gabriel	Modillas	09268448694	2003-12-24	WORKER	25	Beligolo	\N	f	\N	\N
12	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_26/profileImage/avatar.png/12eccbee_1763118838	Sandara	Pasa	09976087745	2000-07-06	CLIENT	26		6.91350567	f	2025-11-14 11:13:38.350833+00	122.11304144
13	\N	Edris	Bakaun	09569986983	2006-06-09	WORKER	28		6.93698560	t	2025-11-14 12:48:30.117956+00	122.05096960
14	\N	Edriss	Bakaunn	09569986982	2003-02-04	CLIENT	29		\N	f	\N	\N
15	\N	Test	Jobs	09123456789	1990-01-01	\N	30		\N	f	\N	\N
16	\N	Test	Jobs	09123456789	1990-01-01	\N	31		\N	f	\N	\N
17	\N	Test	Jobs	09123456789	1990-01-01	\N	32		\N	f	\N	\N
21	\N	Hutao	Hutao	09998500347	2003-09-22	WORKER	36		\N	f	\N	\N
22	\N	Hutao	Hutao	09998500347	2003-09-22	CLIENT	36		\N	f	\N	\N
25	\N	Test	Worker	09171234567	1990-01-01	WORKER	37	\N	\N	f	\N	\N
3	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/profileImage/avatar.png/6edc0488_1763056019	Vaniel	Cornelio	9998500312	2005-02-02	CLIENT	7	\N	6.97922890	t	2025-12-09 16:38:46.306302+00	122.12852598
27	\N	Test	Worker		1990-01-01	WORKER	38	\N	\N	f	\N	\N
28	\N	Test	Client	09171234567	1990-01-15	CLIENT	39		\N	f	\N	\N
29	\N	Test	Client	09171234567	1990-01-15	CLIENT	40		\N	f	\N	\N
30	\N	Test	Client	09171234567	1990-01-15	CLIENT	41		\N	f	\N	\N
31	\N	Test	Client	09171234567	1990-01-15	CLIENT	42		\N	f	\N	\N
32	\N	Test	Client	09171234567	1990-01-15	CLIENT	43		\N	f	\N	\N
33	\N	Test	Client	09171234567	1990-01-15	CLIENT	44		\N	f	\N	\N
34	\N	Test	Client	09171234567	1990-01-15	CLIENT	45		\N	f	\N	\N
35	\N	Test	Worker	09171234568	1990-01-15	\N	46		\N	f	\N	\N
36	\N	Test	Client	09171234567	1990-01-15	CLIENT	47		\N	f	\N	\N
37	\N	Test	Client	09171234567	1990-01-15	CLIENT	48		\N	f	\N	\N
38	\N	Test	Worker	09187654321	1992-05-20	WORKER	49		\N	f	\N	\N
40	\N	Worker3	Test	0917103333	1990-01-03	WORKER	53	\N	\N	f	\N	\N
41	\N	Test	Client	09170001111	1990-01-01	CLIENT	50	\N	\N	f	\N	\N
42	\N	Worker1	Test	09171001111	1990-01-01	WORKER	51	\N	\N	f	\N	\N
43	\N	Worker2	Test	09172002222	1990-01-02	WORKER	52	\N	\N	f	\N	\N
44	\N	Test	Worker	09177654321	1990-01-01	WORKER	55	\N	\N	f	\N	\N
45	\N	Test	Client	09171234567	1990-01-01	CLIENT	54	\N	\N	f	\N	\N
47	\N	KYC	Tester		1990-01-01	CLIENT	56	\N	\N	f	\N	\N
49	\N	TestClient	User	09171234567	1995-01-15	CLIENT	59		\N	f	\N	\N
50	\N	TestWorker	User	09181234567	1990-06-20	WORKER	60		\N	f	\N	\N
51	\N	TestDefault	User	09191234567	1992-03-10	CLIENT	61		\N	f	\N	\N
52	\N	Test	Client	09171111111	1990-01-01	CLIENT	62	\N	\N	f	\N	\N
53	\N	Worker	One	09172222222	1990-01-01	WORKER	63	\N	\N	f	\N	\N
54	\N	Worker	Two	09173333333	1990-01-01	WORKER	64	\N	\N	f	\N	\N
55	\N	Worker	Three	09174444444	1990-01-01	WORKER	65	\N	\N	f	\N	\N
56	\N	Test	Client	09171111111	1990-01-01	CLIENT	66	\N	\N	f	\N	\N
57	\N	Worker	One	09172222222	1990-01-01	WORKER	67	\N	\N	f	\N	\N
58	\N	Worker	Two	09173333333	1990-01-01	WORKER	68	\N	\N	f	\N	\N
59	\N	Worker	Three	09174444444	1990-01-01	WORKER	69	\N	\N	f	\N	\N
60	\N	nikki	nekki	09998500312	2005-11-12	WORKER	58		\N	f	\N	\N
48	\N	nikki	nekki	09998500312	2005-11-12	CLIENT	58		6.97923523	t	2025-12-12 18:24:40.556624+00	122.12852796
2	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/762E2F62-3FA2-4243-B53C-957C4BBF1955.jpg	Vaniel	Cornelio	9998500312	2005-02-02	WORKER	6	\N	9.96000000	t	2025-10-13 16:01:40.431961+00	126.01000000
62	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/profileImage/avatar.png/6edc0488_1763056019	Vaniel	Cornelio	9998500312	2005-02-02	WORKER	7	\N	\N	f	\N	\N
\.


--
-- Data for Name: accounts_pushtoken; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_pushtoken ("tokenID", "pushToken", "deviceType", "isActive", "createdAt", "updatedAt", "lastUsed", "accountFK_id") FROM stdin;
\.


--
-- Data for Name: accounts_transaction; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_transaction ("transactionID", "transactionType", amount, "balanceAfter", status, description, "referenceNumber", "paymentMethod", "createdAt", "completedAt", "relatedJobPosting_id", "walletID_id", "invoiceURL", "xenditExternalID", "xenditInvoiceID", "xenditPaymentChannel", "xenditPaymentID", "xenditPaymentMethod") FROM stdin;
1	DEPOSIT	500.00	0.00	PENDING	GCash Deposit - Γé▒500.0	\N	GCASH	2025-10-18 16:14:37.20198+00	\N	\N	1	\N	\N	\N	\N	\N	\N
2	DEPOSIT	500.00	0.00	PENDING	GCash Deposit - Γé▒500.0	\N	GCASH	2025-10-18 16:19:37.542164+00	\N	\N	1	https://checkout-staging.xendit.co/web/68f3be210500c69fd8d64f99	IAYOS-DEP-2-7d8a6c07	68f3be210500c69fd8d64f99	GCASH	\N	EWALLET
3	DEPOSIT	1000.00	0.00	PENDING	GCash Deposit - Γé▒1000.0	\N	GCASH	2025-10-18 16:20:00.3675+00	\N	\N	1	https://checkout-staging.xendit.co/web/68f3be370500c69fd8d64fd7	IAYOS-DEP-3-e9abc817	68f3be370500c69fd8d64fd7	GCASH	\N	EWALLET
4	DEPOSIT	500.00	0.00	PENDING	GCash Deposit - Γé▒500.0	\N	GCASH	2025-10-18 16:36:45.320714+00	\N	\N	1	https://checkout-staging.xendit.co/web/68f3c2250500c69fd8d65463	IAYOS-DEP-4-8a18c4a4	68f3c2250500c69fd8d65463	GCASH	\N	EWALLET
57	DEPOSIT	100.00	1350.01	COMPLETED	TOP UP via GCASH - Γé▒100.0	\N	GCASH	2025-11-26 04:24:58.438421+00	2025-11-26 04:24:58.437998+00	\N	1	https://checkout-staging.xendit.co/web/6926811a9101a99ffda0ca5d	IAYOS-DEP-57-c04006be	6926811a9101a99ffda0ca5d	GCASH	\N	EWALLET
5	DEPOSIT	1000.00	0.00	PENDING	GCash Deposit - Γé▒1000.0	\N	GCASH	2025-10-18 18:49:40.44697+00	\N	\N	1	https://checkout-staging.xendit.co/web/68f3e14c0500c69fd8d67776	IAYOS-DEP-5-b34af1e8	68f3e14c0500c69fd8d67776	GCASH	\N	EWALLET
58	EARNINGS	250.00	250.00	COMPLETED	Downpayment escrow released for job: KSLSKDNEME	JOB-34-EARNINGS-ESCROW-20251126044426	WALLET	2025-11-26 04:44:26.076519+00	\N	34	2	\N	\N	\N	\N	\N	\N
6	DEPOSIT	1000.00	0.00	PENDING	GCash Deposit - Γé▒1000.0	\N	GCASH	2025-10-18 18:55:58.57655+00	\N	\N	1	https://checkout-staging.xendit.co/web/68f3e2c60500c69fd8d67916	IAYOS-DEP-6-46ff6021	68f3e2c60500c69fd8d67916	GCASH	\N	EWALLET
7	DEPOSIT	500.00	500.00	COMPLETED	Wallet Top-up - Γé▒500.0	\N	GCASH	2025-10-18 19:06:40.653786+00	2025-10-18 19:06:40.653464+00	\N	1	\N	\N	\N	\N	\N	\N
59	EARNINGS	250.00	250.00	COMPLETED	Cash payment received for job: KSLSKDNEME (physical cash - not wallet deposit)	JOB-34-CASH-PAYMENT-20251126044426	WALLET	2025-11-26 04:44:26.142287+00	\N	34	2	\N	\N	\N	\N	\N	\N
8	DEPOSIT	500.00	1000.00	COMPLETED	Wallet Top-up - Γé▒500.0	\N	GCASH	2025-10-18 19:11:51.397079+00	2025-10-18 19:11:51.396701+00	\N	1	https://checkout-staging.xendit.co/web/68f3e67f0500c69fd8d67d3f	IAYOS-DEP-8-73be017c	68f3e67f0500c69fd8d67d3f	GCASH	\N	EWALLET
9	DEPOSIT	500.00	1500.00	COMPLETED	GCash Deposit - Γé▒500.0	\N	GCASH	2025-10-18 19:16:39.752177+00	2025-10-18 19:16:39.751779+00	\N	1	https://checkout-staging.xendit.co/web/68f3e79f0500c69fd8d67e60	IAYOS-DEP-9-a62cf522	68f3e79f0500c69fd8d67e60	GCASH	\N	EWALLET
10	DEPOSIT	2000.00	3500.00	COMPLETED	TOP UP via GCASH - Γé▒2000.0	\N	GCASH	2025-10-20 04:05:42.149598+00	2025-10-20 04:05:42.149101+00	\N	1	\N	\N	\N	\N	\N	\N
11	DEPOSIT	2000.00	5500.00	COMPLETED	TOP UP via GCASH - Γé▒2000.0	\N	GCASH	2025-10-20 04:06:02.216203+00	2025-10-20 04:06:02.215958+00	\N	1	https://checkout-staging.xendit.co/web/68f5b52ae7c6f90f8cfe067a	IAYOS-DEP-11-5f7d9810	68f5b52ae7c6f90f8cfe067a	GCASH	\N	EWALLET
12	DEPOSIT	1000.00	6500.00	COMPLETED	TOP UP via GCASH - Γé▒1000.0	\N	GCASH	2025-10-20 04:16:43.415287+00	2025-10-20 04:16:43.415022+00	\N	1	https://checkout-staging.xendit.co/web/68f5b7abe7c6f90f8cfe0bf8	IAYOS-DEP-12-b1202086	68f5b7abe7c6f90f8cfe0bf8	GCASH	\N	EWALLET
13	DEPOSIT	1000.00	7500.00	COMPLETED	TOP UP via GCASH - Γé▒1000.0	\N	GCASH	2025-11-05 14:02:48.657488+00	2025-11-05 14:02:48.657008+00	\N	1	https://checkout-staging.xendit.co/web/690b5909b6b78faccd63cf00	IAYOS-DEP-13-79d699da	690b5909b6b78faccd63cf00	GCASH	\N	EWALLET
14	PAYMENT	250.00	7250.00	COMPLETED	Escrow payment (50% downpayment) for job: PC Maintenance	ESCROW-5-20251105151624	WALLET	2025-11-05 15:16:24.103172+00	\N	5	1	\N	\N	\N	\N	\N	\N
15	PAYMENT	250.00	7250.00	PENDING	Escrow payment (50% downpayment) for job: PC FIX	ESCROW-6-20251105152155	WALLET	2025-11-05 15:21:55.35643+00	\N	6	1	https://checkout-staging.xendit.co/web/690b6b94b6b78faccd63db05	IAYOS-DEP-15-5e65fcef	690b6b94b6b78faccd63db05	GCASH	\N	EWALLET
16	DEPOSIT	500.00	7750.00	COMPLETED	TOP UP via GCASH - Γé▒500.0	\N	GCASH	2025-11-05 19:04:06.639021+00	2025-11-05 19:04:06.638666+00	\N	1	https://checkout-staging.xendit.co/web/690b9fa7b6b78faccd640a65	IAYOS-DEP-16-812901b0	690b9fa7b6b78faccd640a65	GCASH	\N	EWALLET
17	PAYMENT	250.00	7750.00	PENDING	Escrow payment (50% downpayment) for job: Hi Gab	ESCROW-7-20251105192903	WALLET	2025-11-05 19:29:03.956095+00	\N	7	1	https://checkout-staging.xendit.co/web/690ba580b6b78faccd640dea	IAYOS-DEP-17-45728932	690ba580b6b78faccd640dea	GCASH	\N	EWALLET
19	PAYMENT	3874.99	7750.00	PENDING	Escrow payment (50% downpayment) for job: Test Payment	ESCROW-9-20251105193357	WALLET	2025-11-05 19:33:57.910237+00	\N	9	1	https://checkout-staging.xendit.co/web/690ba6a6b6b78faccd640f1e	IAYOS-DEP-19-86a5204d	690ba6a6b6b78faccd640f1e	GCASH	\N	EWALLET
20	PAYMENT	3875.00	3875.00	COMPLETED	Escrow payment (50% downpayment) for job: TESTTT	ESCROW-10-20251105194152	WALLET	2025-11-05 19:41:52.921377+00	2025-11-05 19:41:52.921047+00	10	1	\N	\N	\N	\N	\N	\N
21	PAYMENT	1937.50	3875.00	PENDING	Escrow payment (50% downpayment) for job: TERST @2	ESCROW-11-20251105195643	WALLET	2025-11-05 19:56:43.620122+00	\N	11	1	https://checkout-staging.xendit.co/web/690babfcb6b78faccd641279	IAYOS-DEP-21-0b53d481	690babfcb6b78faccd641279	GCASH	\N	EWALLET
22	PAYMENT	3875.00	3875.00	COMPLETED	Remaining payment for job: TESTTT (GCash)	JOB-10-FINAL-GCASH-20251106051004	WALLET	2025-11-06 05:10:04.886742+00	2025-11-06 05:12:50.734912+00	10	1	\N	\N	\N	\N	\N	\N
23	PAYMENT	199.99	3675.01	COMPLETED	Escrow payment (50% downpayment) for job: HELLO HELO	ESCROW-12-20251106080649	WALLET	2025-11-06 08:06:49.893184+00	2025-11-06 08:06:49.892871+00	12	1	\N	\N	\N	\N	\N	\N
25	PAYMENT	250.00	3175.01	COMPLETED	[JOB DELETED] HEY U	ESCROW-14-20251119111322	WALLET	2025-11-19 11:13:22.947091+00	2025-11-19 11:13:22.946726+00	\N	1	\N	\N	\N	\N	\N	\N
24	PAYMENT	250.00	3425.01	COMPLETED	[JOB DELETED] FIX TV	ESCROW-13-20251119111058	WALLET	2025-11-19 11:10:58.509681+00	2025-11-19 11:10:58.509132+00	\N	1	\N	\N	\N	\N	\N	\N
28	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] Jahshsbs	ESCROW-17-20251119122235	WALLET	2025-11-19 12:22:35.0656+00	\N	\N	1	https://checkout-staging.xendit.co/web/691db68cc08d0a3d176cd9f3	IAYOS-DEP-28-cf55ac53	691db68cc08d0a3d176cd9f3	GCASH	\N	EWALLET
29	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] Jahshsbs	ESCROW-18-20251119122341	WALLET	2025-11-19 12:23:41.197221+00	\N	\N	1	https://checkout-staging.xendit.co/web/691db6cdc08d0a3d176cda37	IAYOS-DEP-29-4967577e	691db6cdc08d0a3d176cda37	GCASH	\N	EWALLET
30	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] HAHSBDBENKE	ESCROW-19-20251119122454	WALLET	2025-11-19 12:24:54.414334+00	\N	\N	1	https://checkout-staging.xendit.co/web/691db717c08d0a3d176cda9f	IAYOS-DEP-30-aa2e9c90	691db717c08d0a3d176cda9f	GCASH	\N	EWALLET
32	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] MZNCNCNXM	ESCROW-21-20251119124640	WALLET	2025-11-19 12:46:40.430515+00	\N	\N	1	https://checkout-staging.xendit.co/web/691dbc3133d31f4b1295661b	IAYOS-DEP-32-984fb04a	691dbc3133d31f4b1295661b	GCASH	\N	EWALLET
31	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] MZNCNCNXM	ESCROW-20-20251119124312	WALLET	2025-11-19 12:43:12.543378+00	\N	\N	1	https://checkout-staging.xendit.co/web/691dbb61c08d0a3d176cdfc3	IAYOS-DEP-31-e95350ac	691dbb61c08d0a3d176cdfc3	GCASH	\N	EWALLET
56	DEPOSIT	500.00	750.01	COMPLETED	TOP UP via GCASH - Γé▒500.0	\N	GCASH	2025-11-26 00:57:31.634088+00	2025-11-26 00:57:31.633675+00	\N	1	https://checkout-staging.xendit.co/web/6926507b9101a99ffda076a2	IAYOS-DEP-56-49710168	6926507b9101a99ffda076a2	GCASH	\N	EWALLET
121	ESCROW	5000.00	10750.00	COMPLETED	Team job escrow (50%) for: Accept/Reject Test 1765389569 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-10 17:59:29.695198+00	\N	73	13	\N	\N	\N	\N	\N	\N
54	PAYMENT	2500.00	250.01	PENDING	[JOB DELETED] TEST HIRE AGENCY	ESCROW-42-20251126002136	WALLET	2025-11-26 00:21:36.765484+00	\N	\N	1	https://checkout-staging.xendit.co/web/692648119101a99ffda05835	IAYOS-DEP-54-6b7f50a2	692648119101a99ffda05835	GCASH	\N	EWALLET
40	PAYMENT	500.00	275.01	COMPLETED	Escrow payment (50% downpayment) for job: NSKSKSMS	ESCROW-29-20251119162629	WALLET	2025-11-19 16:26:29.064882+00	2025-11-19 16:26:29.06428+00	29	1	\N	\N	\N	\N	\N	\N
41	DEPOSIT	500.00	775.01	COMPLETED	TOP UP via GCASH - Γé▒500.0	\N	GCASH	2025-11-19 22:41:01.524584+00	2025-11-19 22:41:01.524074+00	\N	1	https://checkout-staging.xendit.co/web/691e477ec08d0a3d176db1b1	IAYOS-DEP-41-681d4d87	691e477ec08d0a3d176db1b1	GCASH	\N	EWALLET
72	WITHDRAWAL	250.00	0.00	PENDING	Withdrawal to GCash - 09998500312	\N	GCASH	2025-11-26 05:35:54.843218+00	\N	\N	2	\N	IAYOS-WITHDRAW-72-17d3c06c	692691bccd1cd15c100f112c	GCASH	\N	DISBURSEMENT
73	PAYMENT	199.99	1150.02	COMPLETED	Remaining payment for job: HELLO HELO (Wallet)	JOB-12-FINAL-WALLET-20251126054430	WALLET	2025-11-26 05:44:30.22598+00	\N	12	1	\N	\N	\N	\N	\N	\N
45	PAYMENT	250.00	512.51	COMPLETED	Escrow payment (50% downpayment) for job: KSLSKDNEME	ESCROW-33-20251123100529	WALLET	2025-11-23 10:05:29.664511+00	2025-11-23 10:05:29.664227+00	33	1	\N	\N	\N	\N	\N	\N
46	PAYMENT	250.00	250.01	COMPLETED	Escrow payment (50% downpayment) for job: KSLSKDNEME	ESCROW-34-20251123100612	WALLET	2025-11-23 10:06:12.835771+00	2025-11-23 10:06:12.83543+00	34	1	\N	\N	\N	\N	\N	\N
26	PAYMENT	275.00	2900.01	COMPLETED	[JOB DELETED] FUSJSJSHSHEH	ESCROW-15-20251119113107	WALLET	2025-11-19 11:31:07.672032+00	2025-11-19 11:31:07.671651+00	\N	1	\N	\N	\N	\N	\N	\N
37	PAYMENT	500.00	1850.01	COMPLETED	[JOB DELETED] ISKDNENEN	ESCROW-26-20251119150745	WALLET	2025-11-19 15:07:45.241783+00	2025-11-19 15:07:45.241246+00	\N	1	\N	\N	\N	\N	\N	\N
44	PAYMENT	250.00	775.01	PENDING	[JOB DELETED] KSLSKDNEME	ESCROW-32-20251123100519	WALLET	2025-11-23 10:05:19.72952+00	\N	\N	1	https://checkout-staging.xendit.co/web/6922dc6047eed06a2ce0c104	IAYOS-DEP-44-3ae54ea6	6922dc6047eed06a2ce0c104	GCASH	\N	EWALLET
27	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] Jahshsbs	ESCROW-16-20251119122209	WALLET	2025-11-19 12:22:09.928172+00	\N	\N	1	https://checkout-staging.xendit.co/web/691db67333d31f4b12955f85	IAYOS-DEP-27-c50e341f	691db67333d31f4b12955f85	GCASH	\N	EWALLET
49	PAYMENT	250.00	250.01	PENDING	Escrow payment (50% downpayment) for job: JAOSKENENWNSN	ESCROW-37-20251125235727	WALLET	2025-11-25 23:57:27.926715+00	\N	37	1	https://checkout-staging.xendit.co/web/692642689101a99ffda04b35	IAYOS-DEP-49-3a2c4be4	692642689101a99ffda04b35	GCASH	\N	EWALLET
43	PAYMENT	250.00	775.01	PENDING	[JOB DELETED] KSLSKDNEME	ESCROW-31-20251123100346	WALLET	2025-11-23 10:03:46.322901+00	\N	\N	1	https://checkout-staging.xendit.co/web/6922dc0247eed06a2ce0c083	IAYOS-DEP-43-d1845e6f	6922dc0247eed06a2ce0c083	GCASH	\N	EWALLET
33	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] JSJSBSBSB	ESCROW-22-20251119124807	WALLET	2025-11-19 12:48:07.804782+00	\N	\N	1	https://checkout-staging.xendit.co/web/691dbc88c08d0a3d176ce18f	IAYOS-DEP-33-34d95bd8	691dbc88c08d0a3d176ce18f	GCASH	\N	EWALLET
42	PAYMENT	250.00	775.01	PENDING	[JOB DELETED] KSLSKDNEME	ESCROW-30-20251123100329	WALLET	2025-11-23 10:03:29.663437+00	\N	\N	1	https://checkout-staging.xendit.co/web/6922dbf29101a99ffd9ae6e7	IAYOS-DEP-42-07d990fa	6922dbf29101a99ffd9ae6e7	GCASH	\N	EWALLET
74	EARNINGS	399.98	399.98	COMPLETED	Payment received for job: HELLO HELO	JOB-12-EARNINGS-20251126054430	WALLET	2025-11-26 05:44:30.417926+00	\N	12	2	\N	\N	\N	\N	\N	\N
38	PAYMENT	500.00	1325.01	COMPLETED	[JOB DELETED] HSHSHSBEBBR DUCUCXHBDDB	ESCROW-27-20251119160426	WALLET	2025-11-19 16:04:26.372609+00	2025-11-19 16:04:26.37226+00	\N	1	\N	\N	\N	\N	\N	\N
50	PAYMENT	250.00	250.01	PENDING	Escrow payment (50% downpayment) for job: JAOSKENENWNSN	ESCROW-38-20251125235843	WALLET	2025-11-25 23:58:43.577021+00	\N	38	1	https://checkout-staging.xendit.co/web/692642b49101a99ffda04b8d	IAYOS-DEP-50-20825db2	692642b49101a99ffda04b8d	GCASH	\N	EWALLET
34	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] MZNXBXBSBDBSBDB	ESCROW-23-20251119125031	WALLET	2025-11-19 12:50:31.499094+00	\N	\N	1	https://checkout-staging.xendit.co/web/691dbd1833d31f4b12956735	IAYOS-DEP-34-b2dfa2cf	691dbd1833d31f4b12956735	GCASH	\N	EWALLET
35	PAYMENT	250.00	2900.01	PENDING	[JOB DELETED] NXMXMXLSMZM	ESCROW-24-20251119132843	WALLET	2025-11-19 13:28:43.519497+00	\N	\N	1	https://checkout-staging.xendit.co/web/691dc60c33d31f4b1295703e	IAYOS-DEP-35-431e781d	691dc60c33d31f4b1295703e	GCASH	\N	EWALLET
55	PAYMENT	250.00	250.01	PENDING	[JOB DELETED] TEST AGENCY	ESCROW-43-20251126002750	WALLET	2025-11-26 00:27:50.057017+00	\N	\N	1	https://checkout-staging.xendit.co/web/692649869101a99ffda05d61	IAYOS-DEP-55-1c74a719	692649869101a99ffda05d61	GCASH	\N	EWALLET
36	PAYMENT	500.00	2375.01	COMPLETED	[JOB DELETED] ISKDNENEN	ESCROW-25-20251119143113	WALLET	2025-11-19 14:31:13.558456+00	2025-11-19 14:31:13.558069+00	\N	1	\N	\N	\N	\N	\N	\N
75	PAYMENT	250.00	850.02	COMPLETED	Escrow payment (50% downpayment) for job: GEST AGENCY SHT	ESCROW-44-20251126063618	WALLET	2025-11-26 06:36:18.517053+00	2025-11-26 06:36:18.516417+00	44	1	\N	\N	\N	\N	\N	\N
39	PAYMENT	500.00	800.01	COMPLETED	[JOB DELETED] HDBBFRBEHEHSB	ESCROW-28-20251119161756	WALLET	2025-11-19 16:17:56.132548+00	2025-11-19 16:17:56.132126+00	\N	1	\N	\N	\N	\N	\N	\N
53	PAYMENT	250.00	250.01	PENDING	[JOB DELETED] HAHSBSBSBDBBEBEBWBWBAJAJ	ESCROW-41-20251126001958	WALLET	2025-11-26 00:19:58.919976+00	\N	\N	1	https://checkout-staging.xendit.co/web/692647b19101a99ffda056f6	IAYOS-DEP-53-c4457c13	692647b19101a99ffda056f6	GCASH	\N	EWALLET
47	PAYMENT	250.00	250.01	PENDING	Escrow payment (50% downpayment) for job: JAOSKENENWNSN	ESCROW-35-20251125235023	WALLET	2025-11-25 23:50:23.706318+00	\N	35	1	https://checkout-staging.xendit.co/web/692640c09101a99ffda048aa	IAYOS-DEP-47-0722a302	692640c09101a99ffda048aa	GCASH	\N	EWALLET
76	FEE	50.00	850.02	COMPLETED	Platform fee (10% of budget) for job: GEST AGENCY SHT	FEE-44-20251126063618	WALLET	2025-11-26 06:36:18.5798+00	2025-11-26 06:36:18.579489+00	44	1	\N	\N	\N	\N	\N	\N
48	PAYMENT	250.00	250.01	PENDING	Escrow payment (50% downpayment) for job: JAOSKENENWNSN	ESCROW-36-20251125235045	WALLET	2025-11-25 23:50:45.524938+00	\N	36	1	https://checkout-staging.xendit.co/web/692640d59101a99ffda048c6	IAYOS-DEP-48-12f89108	692640d59101a99ffda048c6	GCASH	\N	EWALLET
77	PAYMENT	250.00	600.02	COMPLETED	Remaining payment for job: GEST AGENCY SHT (Wallet)	JOB-44-FINAL-WALLET-20251130052522	WALLET	2025-11-30 05:25:22.404925+00	\N	44	1	\N	\N	\N	\N	\N	\N
78	EARNINGS	500.00	500.00	COMPLETED	Payment received for job: GEST AGENCY SHT (Agency: Devante)	JOB-44-EARNINGS-20251130052522	WALLET	2025-11-30 05:25:22.731381+00	\N	44	3	\N	\N	\N	\N	\N	\N
52	PAYMENT	250.00	250.01	PENDING	[JOB DELETED] JAIAJSJSHSBDBSBSB	ESCROW-40-20251126000624	WALLET	2025-11-26 00:06:24.726748+00	\N	\N	1	https://checkout-staging.xendit.co/web/692644819101a99ffda04f13	IAYOS-DEP-52-459cd8eb	692644819101a99ffda04f13	GCASH	\N	EWALLET
51	PAYMENT	250.00	250.01	PENDING	[JOB DELETED] ISIDJDHDBSBSBSB	ESCROW-39-20251126000030	WALLET	2025-11-26 00:00:30.892735+00	\N	\N	1	https://checkout-staging.xendit.co/web/6926431f9101a99ffda04cd5	IAYOS-DEP-51-87fdea92	6926431f9101a99ffda04cd5	GCASH	\N	EWALLET
79	WITHDRAWAL	250.00	250.00	PENDING	Withdrawal to GCash - 09998500312	\N	GCASH	2025-11-30 07:15:37.842502+00	\N	\N	3	\N	IAYOS-WITHDRAW-79-4e860664	692bef1da6e5f2d968307ea3	GCASH	\N	DISBURSEMENT
80	DEPOSIT	2000.00	2600.02	COMPLETED	TOP UP via GCASH - Γé▒2000.0	\N	GCASH	2025-11-30 07:20:51.627665+00	2025-11-30 07:20:51.627308+00	\N	1	https://checkout-staging.xendit.co/web/692bf053a6e5f2d968307f48	IAYOS-DEP-80-f6fdee97	692bf053a6e5f2d968307f48	GCASH	\N	EWALLET
81	PAYMENT	750.00	1700.02	COMPLETED	Escrow payment (50% downpayment) for job: BUILD PAYA	ESCROW-45-20251130072134	WALLET	2025-11-30 07:21:34.796593+00	2025-11-30 07:21:34.79623+00	45	1	\N	\N	\N	\N	\N	\N
82	FEE	150.00	1700.02	COMPLETED	Platform fee (10% of budget) for job: BUILD PAYA	FEE-45-20251130072134	WALLET	2025-11-30 07:21:34.860437+00	2025-11-30 07:21:34.860145+00	45	1	\N	\N	\N	\N	\N	\N
83	PAYMENT	750.00	950.02	COMPLETED	Remaining payment for job: BUILD PAYA (Wallet)	JOB-45-FINAL-WALLET-20251130091359	WALLET	2025-11-30 09:13:59.577247+00	\N	45	1	\N	\N	\N	\N	\N	\N
84	EARNINGS	1500.00	1750.00	COMPLETED	Payment received for job: BUILD PAYA (Agency: Devante)	JOB-45-EARNINGS-20251130091359	WALLET	2025-11-30 09:13:59.93233+00	\N	45	3	\N	\N	\N	\N	\N	\N
85	PAYMENT	250.00	650.02	COMPLETED	Escrow payment (50% downpayment) for job: Fix Table	ESCROW-46-20251130105635	WALLET	2025-11-30 10:56:35.974284+00	2025-11-30 10:56:35.973888+00	46	1	\N	\N	\N	\N	\N	\N
86	FEE	50.00	650.02	COMPLETED	Platform fee (10% of budget) for job: Fix Table	FEE-46-20251130105636	WALLET	2025-11-30 10:56:36.033428+00	2025-11-30 10:56:36.033118+00	46	1	\N	\N	\N	\N	\N	\N
87	PAYMENT	250.00	400.02	COMPLETED	Remaining payment for job: Fix Table (Wallet)	JOB-46-FINAL-WALLET-20251130110016	WALLET	2025-11-30 11:00:16.3722+00	\N	46	1	\N	\N	\N	\N	\N	\N
88	EARNINGS	500.00	899.98	COMPLETED	Payment received for job: Fix Table	JOB-46-EARNINGS-20251130110016	WALLET	2025-11-30 11:00:16.562813+00	\N	46	2	\N	\N	\N	\N	\N	\N
89	WITHDRAWAL	500.00	399.98	PENDING	Withdrawal to GCash - 09998500312	\N	GCASH	2025-11-30 11:01:41.496429+00	\N	\N	2	\N	IAYOS-WITHDRAW-89-7f204b54	692c241693cb592c78a89ec4	GCASH	\N	DISBURSEMENT
90	PAYMENT	250.00	350.02	COMPLETED	Escrow payment (50% downpayment) for job: KSKSKSNSNSN	ESCROW-47-20251201165720	WALLET	2025-12-01 16:57:20.739351+00	2025-12-01 16:57:20.73889+00	47	1	\N	\N	\N	\N	\N	\N
91	FEE	50.00	350.02	COMPLETED	Platform fee (10% of budget) for job: KSKSKSNSNSN	FEE-47-20251201165721	WALLET	2025-12-01 16:57:21.49505+00	2025-12-01 16:57:21.494707+00	47	1	\N	\N	\N	\N	\N	\N
92	PAYMENT	70.00	350.02	PENDING	Escrow payment (50% downpayment) for job: ANANANSNSNWNE WN	ESCROW-48-20251209110804	WALLET	2025-12-09 11:08:04.474352+00	\N	48	1	\N	\N	\N	\N	\N	\N
93	FEE	14.00	350.02	PENDING	Platform fee (10% of budget) for job: ANANANSNSNWNE WN	FEE-48-20251209110804	WALLET	2025-12-09 11:08:04.479544+00	\N	48	1	\N	\N	\N	\N	\N	\N
94	PAYMENT	750.00	10000.00	PENDING	Escrow payment (50% downpayment) for job: Test Multi-Criteria Review Job	ESCROW-49-20251210145938	WALLET	2025-12-10 14:59:38.163654+00	\N	49	11	\N	\N	\N	\N	\N	\N
95	FEE	150.00	10000.00	PENDING	Platform fee (10% of budget) for job: Test Multi-Criteria Review Job	FEE-49-20251210145938	WALLET	2025-12-10 14:59:38.171112+00	\N	49	11	\N	\N	\N	\N	\N	\N
96	PAYMENT	750.00	10000.00	PENDING	Escrow payment (50% downpayment) for job: Test Multi-Criteria Review Job	ESCROW-50-20251210145944	WALLET	2025-12-10 14:59:44.071084+00	\N	50	11	\N	\N	\N	\N	\N	\N
97	FEE	150.00	10000.00	PENDING	Platform fee (10% of budget) for job: Test Multi-Criteria Review Job	FEE-50-20251210145944	WALLET	2025-12-10 14:59:44.073202+00	\N	50	11	\N	\N	\N	\N	\N	\N
98	PAYMENT	750.00	9100.00	COMPLETED	Escrow payment (50% downpayment) for job: Test Multi-Criteria Review Job	ESCROW-51-20251210145950	WALLET	2025-12-10 14:59:50.384725+00	2025-12-10 15:04:19.084527+00	51	11	\N	\N	\N	\N	\N	\N
99	FEE	150.00	9100.00	COMPLETED	Platform fee (10% of budget) for job: Test Multi-Criteria Review Job	FEE-51-20251210145950	WALLET	2025-12-10 14:59:50.38701+00	2025-12-10 15:04:19.088106+00	51	11	\N	\N	\N	\N	\N	\N
100	PAYMENT	750.00	8350.00	COMPLETED	Remaining payment for job: Test Multi-Criteria Review Job (Wallet)	JOB-51-FINAL-WALLET-20251210150548	WALLET	2025-12-10 15:05:48.659007+00	\N	51	11	\N	\N	\N	\N	\N	\N
101	EARNINGS	1500.00	1500.00	COMPLETED	Payment received for job: Test Multi-Criteria Review Job	JOB-51-EARNINGS-20251210150548	WALLET	2025-12-10 15:05:48.672587+00	\N	51	12	\N	\N	\N	\N	\N	\N
103	ESCROW	7500.00	42125.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386233 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:03:53.248915+00	\N	55	13	\N	\N	\N	\N	\N	\N
104	ESCROW	7500.00	34250.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386297 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:04:57.547913+00	\N	56	13	\N	\N	\N	\N	\N	\N
105	ESCROW	7500.00	26375.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386358 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:05:58.48221+00	\N	57	13	\N	\N	\N	\N	\N	\N
106	ESCROW	7500.00	18500.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386431 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:07:11.695641+00	\N	58	13	\N	\N	\N	\N	\N	\N
107	ESCROW	7500.00	10625.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386485 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:08:05.455903+00	\N	59	13	\N	\N	\N	\N	\N	\N
108	ESCROW	7500.00	2750.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386528 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:08:48.830409+00	\N	60	13	\N	\N	\N	\N	\N	\N
109	ESCROW	7500.00	92125.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386590 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:09:50.914078+00	\N	61	13	\N	\N	\N	\N	\N	\N
110	ESCROW	7500.00	84250.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765386652 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:10:52.9742+00	\N	62	13	\N	\N	\N	\N	\N	\N
111	ESCROW	7500.00	76375.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765387060 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:17:40.317295+00	\N	63	13	\N	\N	\N	\N	\N	\N
112	ESCROW	7500.00	68500.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765387184 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:19:44.406642+00	\N	64	13	\N	\N	\N	\N	\N	\N
113	ESCROW	7500.00	60625.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765387872 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:31:12.670972+00	\N	65	13	\N	\N	\N	\N	\N	\N
114	ESCROW	7500.00	52750.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765388024 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:33:44.19734+00	\N	66	13	\N	\N	\N	\N	\N	\N
115	ESCROW	7500.00	44875.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765388047 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:34:07.25634+00	\N	67	13	\N	\N	\N	\N	\N	\N
116	ESCROW	7500.00	37000.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765388168 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-10 17:36:08.880683+00	\N	68	13	\N	\N	\N	\N	\N	\N
117	ESCROW	5000.00	31750.00	COMPLETED	Team job escrow (50%) for: Accept/Reject Test Job 1765388672 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-10 17:44:32.9412+00	\N	69	13	\N	\N	\N	\N	\N	\N
118	ESCROW	5000.00	26500.00	COMPLETED	Team job escrow (50%) for: Accept/Reject Test Job 1765388708 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-10 17:45:08.343383+00	\N	70	13	\N	\N	\N	\N	\N	\N
119	ESCROW	5000.00	21250.00	COMPLETED	Team job escrow (50%) for: Accept/Reject Test 1765388904 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-10 17:48:24.755251+00	\N	71	13	\N	\N	\N	\N	\N	\N
120	ESCROW	5000.00	16000.00	COMPLETED	Team job escrow (50%) for: Accept/Reject Test 1765389499 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-10 17:58:19.743945+00	\N	72	13	\N	\N	\N	\N	\N	\N
124	PAYMENT	750.00	9100.00	COMPLETED	Escrow payment (50% downpayment) for job: Fix Kitchen Faucet	ESCROW-75-20251211163235	WALLET	2025-12-11 16:32:35.797422+00	2025-12-11 16:35:28.693783+00	75	15	\N	\N	\N	\N	\N	\N
125	FEE	150.00	9100.00	COMPLETED	Platform fee (10% of budget) for job: Fix Kitchen Faucet	FEE-75-20251211163235	WALLET	2025-12-11 16:32:35.803593+00	2025-12-11 16:35:28.6966+00	75	15	\N	\N	\N	\N	\N	\N
126	PAYMENT	750.00	8350.00	COMPLETED	Remaining payment for job: Fix Kitchen Faucet (Wallet)	JOB-75-FINAL-WALLET-20251211163615	WALLET	2025-12-11 16:36:15.726916+00	\N	75	15	\N	\N	\N	\N	\N	\N
127	PENDING_EARNING	1500.00	0.00	PENDING	Pending payment for job: Fix Kitchen Faucet (releases Dec 18, 2025)	JOB-75-PENDING-20251211163615	WALLET	2025-12-11 16:36:15.737878+00	\N	75	16	\N	\N	\N	\N	\N	\N
130	ESCROW	7500.00	2875.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765513798 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 04:29:58.727319+00	\N	78	13	\N	\N	\N	\N	\N	\N
131	ESCROW	2500.00	250.00	COMPLETED	Team job escrow (50%) for: TEST - Team Job API Check (Platform fee: ₱125.0000)	\N	WALLET	2025-12-12 05:04:24.143188+00	\N	79	13	\N	\N	\N	\N	\N	\N
132	PAYMENT	750.00	8350.00	PENDING	Escrow payment (50% downpayment) for job: Fix Leaking Faucet - Test 090653	ESCROW-80-20251212090653	WALLET	2025-12-12 09:06:53.491014+00	\N	80	15	\N	\N	\N	\N	\N	\N
133	FEE	150.00	8350.00	PENDING	Platform fee (10% of budget) for job: Fix Leaking Faucet - Test 090653	FEE-80-20251212090653	WALLET	2025-12-12 09:06:53.497572+00	\N	80	15	\N	\N	\N	\N	\N	\N
134	ESCROW	7500.00	475.00	COMPLETED	Team job escrow (50%) for: Home Renovation Team - Test 090653 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 09:06:53.554542+00	\N	81	15	\N	\N	\N	\N	\N	\N
135	ESCROW	5000.00	44750.00	COMPLETED	Team job escrow (50%) for: Team Mode Test - 091242 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-12 09:12:42.320265+00	\N	82	15	\N	\N	\N	\N	\N	\N
136	ESCROW	5000.00	44750.00	COMPLETED	Team job escrow (50%) for: Team Mode Test - 091358 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-12 09:13:58.27614+00	\N	83	15	\N	\N	\N	\N	\N	\N
137	ESCROW	5000.00	39500.00	COMPLETED	Team job escrow (50%) for: Team Mode Test - 091443 (Platform fee: ₱250.0000)	\N	WALLET	2025-12-12 09:14:43.917408+00	\N	84	15	\N	\N	\N	\N	\N	\N
138	ESCROW	4500.00	95275.00	COMPLETED	Team job escrow (50%) for: Complete Team Flow Test - 171752 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 09:17:52.268555+00	\N	85	15	\N	\N	\N	\N	\N	\N
139	ESCROW	4500.00	95275.00	COMPLETED	Team job escrow (50%) for: Complete Team Flow Test - 171904 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 09:19:04.130687+00	\N	86	15	\N	\N	\N	\N	\N	\N
140	ESCROW	4500.00	95275.00	COMPLETED	Team job escrow (50%) for: Complete Team Flow Test - 171956 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 09:19:56.431467+00	\N	87	15	\N	\N	\N	\N	\N	\N
141	ESCROW	6000.00	88975.00	COMPLETED	Team job escrow (50%) for: RN Test - Team Job 172409 (Platform fee: ₱300.0000)	\N	WALLET	2025-12-12 09:24:09.661191+00	\N	88	15	\N	\N	\N	\N	\N	\N
150	PAYMENT	750.00	88975.00	PENDING	Escrow payment (50% downpayment) for job: Payment Buffer API Test - 21:09:43	ESCROW-97-20251212130943	WALLET	2025-12-12 13:09:43.310876+00	\N	97	15	\N	\N	\N	\N	\N	\N
151	FEE	150.00	88975.00	PENDING	Platform fee (10% of budget) for job: Payment Buffer API Test - 21:09:43	FEE-97-20251212130943	WALLET	2025-12-12 13:09:43.31281+00	\N	97	15	\N	\N	\N	\N	\N	\N
152	PAYMENT	750.00	88975.00	PENDING	Escrow payment (50% downpayment) for job: Payment Buffer API Test - 21:12:40	ESCROW-98-20251212131241	WALLET	2025-12-12 13:12:41.069524+00	\N	98	15	\N	\N	\N	\N	\N	\N
153	FEE	150.00	88975.00	PENDING	Platform fee (10% of budget) for job: Payment Buffer API Test - 21:12:40	FEE-98-20251212131241	WALLET	2025-12-12 13:12:41.071581+00	\N	98	15	\N	\N	\N	\N	\N	\N
154	PAYMENT	750.00	88975.00	PENDING	Escrow payment (50% downpayment) for job: Payment Buffer API Test - 21:13:44	ESCROW-99-20251212131344	WALLET	2025-12-12 13:13:44.966046+00	\N	99	15	\N	\N	\N	\N	\N	\N
155	FEE	150.00	88975.00	PENDING	Platform fee (10% of budget) for job: Payment Buffer API Test - 21:13:44	FEE-99-20251212131344	WALLET	2025-12-12 13:13:44.968378+00	\N	99	15	\N	\N	\N	\N	\N	\N
156	PAYMENT	750.00	88975.00	PENDING	Escrow payment (50% downpayment) for job: Payment Buffer API Test - 21:16:02	ESCROW-100-20251212131602	WALLET	2025-12-12 13:16:02.36219+00	\N	100	15	\N	\N	\N	\N	\N	\N
157	FEE	150.00	88975.00	PENDING	Platform fee (10% of budget) for job: Payment Buffer API Test - 21:16:02	FEE-100-20251212131602	WALLET	2025-12-12 13:16:02.364605+00	\N	100	15	\N	\N	\N	\N	\N	\N
158	ESCROW	225.00	13.75	COMPLETED	Team job escrow (50%) for: Quick Home Repair (Platform fee: ₱11.2500)	\N	WALLET	2025-12-12 15:36:04.958753+00	\N	101	13	\N	\N	\N	\N	\N	\N
160	ESCROW	7500.00	42125.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559043 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:04:03.62112+00	\N	103	18	\N	\N	\N	\N	\N	\N
161	ESCROW	7500.00	34250.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559198 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:06:38.358593+00	\N	104	18	\N	\N	\N	\N	\N	\N
162	ESCROW	7500.00	26375.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559202 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:06:42.558922+00	\N	105	18	\N	\N	\N	\N	\N	\N
163	ESCROW	7500.00	18500.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559301 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:08:21.677847+00	\N	106	18	\N	\N	\N	\N	\N	\N
164	ESCROW	7500.00	10625.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559364 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:09:24.472766+00	\N	107	18	\N	\N	\N	\N	\N	\N
165	ESCROW	7500.00	2750.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559429 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:10:29.774659+00	\N	108	18	\N	\N	\N	\N	\N	\N
166	ESCROW	7500.00	92125.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559495 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:11:35.755478+00	\N	109	18	\N	\N	\N	\N	\N	\N
167	ESCROW	7500.00	84250.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559528 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:12:08.676351+00	\N	110	18	\N	\N	\N	\N	\N	\N
168	ESCROW	7500.00	76375.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559576 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:12:56.554343+00	\N	111	18	\N	\N	\N	\N	\N	\N
169	ESCROW	7500.00	68500.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559682 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:14:42.65233+00	\N	112	18	\N	\N	\N	\N	\N	\N
170	ESCROW	7500.00	60625.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765559993 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:19:53.605556+00	\N	113	18	\N	\N	\N	\N	\N	\N
171	ESCROW	7500.00	52750.00	COMPLETED	Team job escrow (50%) for: Team Mode Test Job #1765560027 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 17:20:27.837938+00	\N	114	18	\N	\N	\N	\N	\N	\N
172	ESCROW	70.00	145.27	COMPLETED	Team job escrow (50%) for: Fix THIS SHITTT NOWWWW (Platform fee: ₱3.5000)	\N	WALLET	2025-12-12 17:27:29.271634+00	\N	115	1	\N	\N	\N	\N	\N	\N
128	PAYMENT	125.00	74650.00	COMPLETED	Escrow payment (50% downpayment) for job: Fix leaking Pipes	ESCROW-77-20251212041135	WALLET	2025-12-12 04:11:35.557532+00	2025-12-13 04:36:58.725054+00	77	1	\N	\N	\N	\N	\N	\N
173	ESCROW	7500.00	12125.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765562644 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 18:04:04.142365+00	\N	116	13	\N	\N	\N	\N	\N	\N
174	ESCROW	4500.00	7400.00	COMPLETED	Team job escrow (50%) for: Conversation Test 1765562689 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 18:04:49.094416+00	\N	117	13	\N	\N	\N	\N	\N	\N
175	ESCROW	4500.00	2675.00	COMPLETED	Team job escrow (50%) for: Conversation Test 1765562710 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 18:05:10.797038+00	\N	118	13	\N	\N	\N	\N	\N	\N
176	ESCROW	4500.00	45275.00	COMPLETED	Team job escrow (50%) for: Conversation Test 1765562817 (Platform fee: ₱225.0000)	\N	WALLET	2025-12-12 18:06:57.666683+00	\N	119	13	\N	\N	\N	\N	\N	\N
159	ESCROW	125.00	218.77	COMPLETED	[JOB DELETED] Create my children playground	\N	WALLET	2025-12-12 16:59:43.198218+00	\N	\N	1	\N	\N	\N	\N	\N	\N
177	ESCROW	6000.00	93700.00	COMPLETED	Team job escrow (50%) for: RN Flow Test - Home Renovation 041808 (Platform fee: ₱300.0000)	\N	WALLET	2025-12-12 20:18:08.757144+00	\N	120	1	\N	\N	\N	\N	\N	\N
178	ESCROW	6000.00	87400.00	COMPLETED	Team job escrow (50%) for: RN Flow Test - Home Renovation 041910 (Platform fee: ₱300.0000)	\N	WALLET	2025-12-12 20:19:10.547263+00	\N	121	1	\N	\N	\N	\N	\N	\N
179	ESCROW	6000.00	81100.00	COMPLETED	Team job escrow (50%) for: RN Flow Test - Home Renovation 042128 (Platform fee: ₱300.0000)	\N	WALLET	2025-12-12 20:21:28.067678+00	\N	122	1	\N	\N	\N	\N	\N	\N
180	ESCROW	6000.00	74800.00	COMPLETED	Team job escrow (50%) for: RN Flow Test - Home Renovation 042211 (Platform fee: ₱300.0000)	\N	WALLET	2025-12-12 20:22:11.454852+00	\N	123	1	\N	\N	\N	\N	\N	\N
181	ESCROW	7500.00	37400.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765571557 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:32:37.921535+00	\N	124	13	\N	\N	\N	\N	\N	\N
182	ESCROW	7500.00	29525.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765571637 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:33:57.700653+00	\N	125	13	\N	\N	\N	\N	\N	\N
183	ESCROW	7500.00	21650.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765571867 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:37:48.049974+00	\N	126	13	\N	\N	\N	\N	\N	\N
184	ESCROW	7500.00	13775.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765571915 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:38:35.492538+00	\N	127	13	\N	\N	\N	\N	\N	\N
185	ESCROW	7500.00	5900.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765571972 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:39:32.552103+00	\N	128	13	\N	\N	\N	\N	\N	\N
186	ESCROW	7500.00	42125.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765572141 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:42:21.515313+00	\N	129	13	\N	\N	\N	\N	\N	\N
187	ESCROW	7500.00	34250.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765572326 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:45:26.259432+00	\N	130	13	\N	\N	\N	\N	\N	\N
188	ESCROW	7500.00	26375.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765572564 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:49:24.190355+00	\N	131	13	\N	\N	\N	\N	\N	\N
189	ESCROW	7500.00	18500.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765572604 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-12 20:50:04.913266+00	\N	132	13	\N	\N	\N	\N	\N	\N
221	ESCROW	7500.00	10625.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765594288 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-13 02:51:28.168205+00	\N	164	13	\N	\N	\N	\N	\N	\N
222	ESCROW	7500.00	2750.00	COMPLETED	Team job escrow (50%) for: Home Renovation TEST 1765594419 (Platform fee: ₱375.0000)	\N	WALLET	2025-12-13 02:53:39.327379+00	\N	165	13	\N	\N	\N	\N	\N	\N
129	FEE	25.00	74650.00	COMPLETED	Platform fee (10% of budget) for job: Fix leaking Pipes	FEE-77-20251212041135	WALLET	2025-12-12 04:11:35.563694+00	2025-12-13 04:36:58.727465+00	77	1	\N	\N	\N	\N	\N	\N
223	PAYMENT	125.00	74525.00	COMPLETED	Remaining payment for job: Fix leaking Pipes (Wallet)	JOB-77-FINAL-WALLET-20251213043802	WALLET	2025-12-13 04:38:02.291327+00	\N	77	1	\N	\N	\N	\N	\N	\N
224	PENDING_EARNING	250.00	399.98	PENDING	Pending payment for job: Fix leaking Pipes (releases Dec 20, 2025)	JOB-77-PENDING-20251213043802	WALLET	2025-12-13 04:38:02.298494+00	\N	77	2	\N	\N	\N	\N	\N	\N
225	ESCROW	5060.00	69212.00	COMPLETED	Team job escrow (50%) for: FIX CAR AT HOME (Platform fee: ₱253.0000)	\N	WALLET	2025-12-16 02:27:12.972116+00	\N	166	1	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: accounts_userpaymentmethod; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_userpaymentmethod (id, "methodType", "accountName", "accountNumber", "bankName", "isPrimary", "isVerified", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
1	GCASH	Vaniel Cornelio	09998500312	\N	t	f	2025-11-26 02:49:38.119406+00	2025-11-26 02:49:38.119421+00	6
2	GCASH	Vaniel Cornelio	09998500312	\N	t	f	2025-11-26 04:24:50.148184+00	2025-11-26 04:24:50.148195+00	7
3	GCASH	Ririka Ruii	09998500312	\N	t	f	2025-11-30 04:41:05.359022+00	2025-11-30 04:41:05.359036+00	23
\.


--
-- Data for Name: accounts_wallet; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_wallet ("walletID", balance, "createdAt", "updatedAt", "accountFK_id", "reservedBalance", "pendingEarnings") FROM stdin;
3	1750.00	2025-10-20 08:55:36.800751+00	2025-11-30 09:13:59.863754+00	23	0.00	0.00
4	0.00	2025-11-12 01:05:54.023277+00	2025-11-12 01:05:54.023306+00	25	0.00	0.00
5	0.00	2025-11-14 09:24:14.775446+00	2025-11-14 09:24:14.775526+00	26	0.00	0.00
7	0.00	2025-11-14 13:42:09.448713+00	2025-11-14 13:42:09.448744+00	29	0.00	0.00
8	0.00	2025-11-21 23:25:16.410326+00	2025-11-21 23:25:16.410341+00	36	0.00	0.00
9	0.00	2025-12-09 11:43:24.177993+00	2025-12-09 11:43:24.178002+00	37	0.00	0.00
10	0.00	2025-12-10 13:53:08.828501+00	2025-12-10 13:53:08.828511+00	45	0.00	0.00
18	52750.00	2025-12-12 17:03:30.059229+00	2025-12-12 17:20:27.836883+00	66	90000.00	0.00
11	8350.00	2025-12-10 14:58:33.568199+00	2025-12-10 15:05:48.655166+00	48	1800.00	0.00
12	1500.00	2025-12-10 15:05:48.664991+00	2025-12-10 15:05:48.668867+00	49	0.00	0.00
22	0.00	2025-12-12 18:03:58.054782+00	2025-12-12 18:03:58.054794+00	52	0.00	0.00
23	0.00	2025-12-12 18:03:58.300141+00	2025-12-12 18:03:58.300151+00	53	0.00	0.00
14	0.00	2025-12-10 17:41:10.020441+00	2025-12-10 17:41:10.020451+00	51	0.00	0.00
6	2500.00	2025-11-14 12:43:43.633791+00	2025-12-10 19:25:39.824063+00	28	0.00	0.00
13	2750.00	2025-12-10 16:56:36.621148+00	2025-12-13 02:53:39.326313+00	50	243725.00	0.00
17	0.00	2025-12-12 04:18:58.527594+00	2025-12-12 04:18:58.527604+00	58	0.00	0.00
2	399.98	2025-10-19 15:37:39.965893+00	2025-12-13 04:38:02.297698+00	6	0.00	250.00
1	69212.00	2025-10-18 15:52:55.329513+00	2025-12-16 02:27:12.970036+00	7	29255.00	0.00
16	4000.00	2025-12-11 16:36:15.735372+00	2025-12-12 13:05:30.490506+00	55	0.00	500.00
15	88975.00	2025-12-11 16:32:09.940394+00	2025-12-12 13:16:02.356776+00	54	46500.00	0.00
19	50000.00	2025-12-12 17:03:56.085194+00	2025-12-12 17:03:56.085204+00	67	0.00	0.00
20	50000.00	2025-12-12 17:03:56.572638+00	2025-12-12 17:03:56.572648+00	68	0.00	0.00
21	50000.00	2025-12-12 17:03:57.056676+00	2025-12-12 17:03:57.056685+00	69	0.00	0.00
\.


--
-- Data for Name: accounts_workerprofile; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_workerprofile (id, description, "workerRating", "totalEarningGross", availability_status, "profileID_id", bio, hourly_rate, profile_completion_percentage, soft_skills) FROM stdin;
4		0	0.00	AVAILABLE	11		\N	0	
6		0	0.00	OFFLINE	25	Test worker for skills refactoring	500.00	0	
7		0	0.00	OFFLINE	27		\N	14	
8	Test worker description	0	0.00	OFFLINE	38	Test worker	100.00	0	
9		0	0.00	OFFLINE	40		\N	0	
10		0	0.00	OFFLINE	42		\N	0	
11		0	0.00	OFFLINE	43		\N	0	
12		0	0.00	OFFLINE	13		\N	0	
13		0	0.00	OFFLINE	44	Experienced plumber with 5 years of experience	500.00	0	
14		0	0.00	OFFLINE	57		\N	0	
15		0	0.00	OFFLINE	58		\N	0	
16		0	0.00	OFFLINE	59		\N	0	
17		0	0.00	OFFLINE	60		\N	0	
2	Test worker profile for availability testing	0	0.00	AVAILABLE	2		\N	57	Team Player, Fast Learner, Reliable
5		0	0.00	OFFLINE	21		\N	28	
18		0	0.00	OFFLINE	62		\N	0	
\.


--
-- Data for Name: accounts_workerspecialization; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.accounts_workerspecialization (id, "experienceYears", certification, "specializationID_id", "workerID_id") FROM stdin;
1	5		1	6
2	3		13	6
3	4		3	2
5	4		2	5
\.


--
-- Data for Name: adminpanel_adminaccount; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_adminaccount ("adminID", role, permissions, "isActive", "lastLogin", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_auditlog; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_auditlog ("auditLogID", "adminEmail", action, "entityType", "entityID", details, "beforeValue", "afterValue", "ipAddress", "userAgent", "createdAt", "adminFK_id") FROM stdin;
1	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-01 18:43:52.37571+00	7
2	superadmin@gmail.com	user_login	user	13	{"email": "superadmin@gmail.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-01 18:44:25.056415+00	13
3	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-02 01:27:45.137547+00	7
4	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-02 04:14:14.124716+00	6
5	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-02 04:52:32.000004+00	6
6	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-02 05:03:37.909679+00	6
7	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 11:07:37.342489+00	7
8	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 11:43:19.895762+00	37
9	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 11:59:44.568519+00	37
10	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 12:21:14.006686+00	37
11	superadmin@gmail.com	user_login	user	13	{"email": "superadmin@gmail.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-09 13:20:25.000085+00	13
12	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 15:06:13.501865+00	37
13	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 16:12:39.837592+00	7
14	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 16:30:02.421229+00	37
15	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 16:31:30.173456+00	7
16	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 16:33:35.71547+00	7
17	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-09 16:42:19.304667+00	37
18	certtest@example.com	user_login	user	38	{"email": "certtest@example.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:24:23.253677+00	38
19	certtest@example.com	user_login	user	38	{"email": "certtest@example.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:24:30.078747+00	38
20	certtest@example.com	user_login	user	38	{"email": "certtest@example.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:26:34.506904+00	38
21	test_20251210215108@test.com	user_login	user	45	{"email": "test_20251210215108@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:52:19.115552+00	45
22	testworker_20251210215315@test.com	user_login	user	46	{"email": "testworker_20251210215315@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:54:05.624772+00	46
23	testworker_20251210215315@test.com	user_login	user	46	{"email": "testworker_20251210215315@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 13:54:53.29949+00	46
24	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:54:14.591285+00	48
25	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:54:49.366143+00	48
26	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:56:47.347359+00	49
27	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:57:50.092415+00	48
28	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:57:50.458009+00	49
29	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:57:59.140361+00	49
30	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:58:09.368334+00	49
31	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 14:58:16.034797+00	49
32	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:00:25.448208+00	49
33	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:03:55.222655+00	48
34	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:04:53.226361+00	49
35	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:05:20.129566+00	48
36	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:05:30.695415+00	49
37	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:05:48.436411+00	48
38	client_20251210224656@test.com	user_login	user	48	{"email": "client_20251210224656@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:08:48.032707+00	48
39	worker_20251210224757@test.com	user_login	user	49	{"email": "worker_20251210224757@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 15:09:23.133049+00	49
40	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:50:11.762515+00	50
41	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:50:13.600631+00	51
42	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:50:13.85955+00	52
43	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:50:14.119786+00	53
44	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:51:11.108038+00	50
45	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:51:11.368322+00	51
46	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:51:11.627366+00	52
47	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:51:11.893371+00	53
48	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:52:14.034549+00	50
49	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:52:14.299418+00	51
50	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:52:14.598539+00	52
51	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:52:14.857514+00	53
52	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:55:55.699007+00	50
53	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:55:55.967561+00	51
54	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:55:56.230228+00	52
55	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:55:56.493145+00	53
56	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:57:11.24575+00	50
57	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:57:11.595457+00	51
58	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:57:11.883709+00	52
59	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 16:57:12.178306+00	53
60	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:14.033709+00	50
61	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:14.30416+00	51
62	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:14.56697+00	52
63	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:14.855229+00	53
64	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:42.967011+00	50
65	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:43.231329+00	51
66	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:43.49642+00	52
67	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:01:43.784246+00	53
68	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:02:30.768754+00	50
69	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:02:31.037439+00	51
70	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:02:31.304328+00	52
71	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:02:31.572227+00	53
72	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:07.736041+00	50
73	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:08.046683+00	51
74	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:08.319082+00	52
75	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:08.588927+00	53
76	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:52.270892+00	50
77	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:52.54245+00	51
78	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:52.812963+00	52
79	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:03:53.082642+00	53
80	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:04:56.673218+00	50
81	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:04:56.943708+00	51
82	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:04:57.207658+00	52
83	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:04:57.472561+00	53
84	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:05:57.617345+00	50
85	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:05:57.887404+00	51
86	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:05:58.148358+00	52
87	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:05:58.408738+00	53
88	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:07:10.705056+00	50
89	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:07:10.973822+00	51
90	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:07:11.248731+00	52
91	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:07:11.531244+00	53
92	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:04.501222+00	50
93	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:04.768245+00	51
94	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:05.029691+00	52
95	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:05.300556+00	53
96	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:47.845546+00	50
97	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:48.113634+00	51
98	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:48.40668+00	52
99	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:08:48.672204+00	53
100	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:23.440335+00	50
101	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:23.709176+00	51
102	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:23.977574+00	52
103	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:24.257521+00	53
104	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:50.041371+00	50
105	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:50.309636+00	51
106	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:50.577094+00	52
107	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:09:50.839552+00	53
108	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:10:51.945206+00	50
109	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:10:52.279104+00	51
110	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:10:52.547048+00	52
111	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:10:52.80958+00	53
112	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:17:39.445965+00	50
113	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:17:39.716066+00	51
114	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:17:39.979555+00	52
115	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:17:40.242087+00	53
116	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:19:43.549116+00	50
117	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:19:43.812929+00	51
118	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:19:44.073896+00	52
119	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:19:44.334578+00	53
120	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:31:11.809153+00	50
121	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:31:12.073996+00	51
122	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:31:12.335722+00	52
123	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:31:12.596428+00	53
124	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:33:43.324958+00	50
125	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:33:43.607809+00	51
126	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:33:43.867698+00	52
127	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:33:44.126022+00	53
128	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:34:06.292869+00	50
129	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:34:06.562729+00	51
130	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:34:06.828958+00	52
131	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:34:07.091657+00	53
132	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:36:07.922347+00	50
133	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:36:08.196734+00	51
134	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:36:08.458862+00	52
135	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:36:08.721529+00	53
136	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:41:09.393483+00	50
137	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:41:09.656722+00	51
138	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:41:23.728467+00	50
139	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:41:23.986292+00	51
140	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:42:28.739864+00	50
141	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:42:29.004048+00	51
142	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:44:32.096587+00	50
143	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:44:32.360663+00	51
144	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:44:32.62541+00	52
145	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:44:32.890033+00	53
146	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:45:07.357524+00	50
147	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:45:07.620086+00	51
148	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:45:07.916915+00	52
149	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:45:08.283894+00	53
150	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:48:23.922249+00	50
151	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:48:24.185087+00	51
152	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:48:24.443885+00	52
153	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:48:24.706884+00	53
154	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:49:59.148436+00	50
155	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:49:59.417322+00	51
156	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:58:18.884772+00	50
157	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:58:19.151853+00	51
158	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:58:19.420774+00	52
159	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:58:19.686023+00	53
160	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:59:28.806962+00	50
161	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:59:29.071959+00	51
162	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:59:29.340773+00	52
163	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-10 17:59:29.639596+00	53
164	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-11 01:03:23.902191+00	37
165	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-11 01:04:46.333402+00	37
166	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 01:05:17.414614+00	37
167	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 01:05:51.904064+00	37
168	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 01:06:22.854691+00	37
169	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 01:07:01.874393+00	37
170	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:30:55.13777+00	54
171	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:32:09.687192+00	54
172	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:32:15.12563+00	54
173	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:32:20.897143+00	54
174	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:32:35.74387+00	54
175	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:33:01.276115+00	55
176	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:33:06.488698+00	55
177	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:33:40.630147+00	55
178	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:33:49.049743+00	55
179	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:34:02.38561+00	55
180	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:34:08.205865+00	55
181	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:34:52.48194+00	55
182	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:35:06.660478+00	55
183	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:35:12.15636+00	54
184	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:35:28.632767+00	54
185	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:35:49.462534+00	54
186	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:35:57.277324+00	54
187	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:36:02.920086+00	54
188	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:36:10.193772+00	55
189	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:36:15.607828+00	54
190	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:38:56.258855+00	54
191	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:38:56.57925+00	55
192	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:39:02.289962+00	54
193	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:39:02.639996+00	55
194	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:39:11.03564+00	54
195	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-11 16:39:11.306876+00	55
196	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 17:39:26.680471+00	56
197	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 17:39:35.140323+00	56
198	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 17:39:40.135049+00	56
199	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 17:39:47.686724+00	56
200	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 18:17:42.597434+00	56
201	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 18:20:10.245788+00	56
202	kyctest@test.com	user_login	user	56	{"email": "kyctest@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-11 18:20:15.247357+00	56
203	admin@iayos.com	user_login	user	57	{"email": "admin@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	curl/8.16.0	2025-12-11 18:30:58.429177+00	57
204	admin@iayos.com	certification_approval	certification	11	{"cert_name": "Updated Safety Certificate", "worker_email": "certtest@example.com"}	{"is_verified": false}	{"is_verified": true}	172.18.0.1	curl/8.16.0	2025-12-11 18:31:11.60336+00	57
205	admin@iayos.com	certification_rejection	certification	10	{"reason": "Test rejection: Certificate image unclear", "cert_name": "Test Safety Certificate", "worker_email": "certtest@example.com"}	{}	{"rejected": true}	172.18.0.1	curl/8.16.0	2025-12-11 18:31:16.075361+00	57
206	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 03:51:59.107877+00	7
207	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:04:17.156023+00	7
208	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:06:22.274426+00	6
209	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:08:16.491077+00	7
210	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:18:52.553238+00	58
211	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:29:57.761355+00	50
212	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:29:58.065376+00	51
213	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:29:58.353615+00	52
214	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 04:29:58.636385+00	53
215	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:03:14.782942+00	50
216	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:04:19.988589+00	50
217	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:11:59.595916+00	50
218	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:12:29.892609+00	50
219	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:13:24.071337+00	50
220	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:15:59.596862+00	50
221	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:17:07.381922+00	50
222	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:23:37.184699+00	50
223	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:32:35.217456+00	50
224	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:38:35.05817+00	50
225	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:41:37.910432+00	7
226	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 05:42:11.809805+00	58
227	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 06:47:02.449962+00	58
228	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 07:21:56.598275+00	58
229	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 07:22:29.821363+00	58
230	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 07:28:16.140728+00	58
231	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 07:32:12.3775+00	58
232	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 07:34:43.043109+00	58
233	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 08:16:11.066993+00	58
234	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:06:53.294719+00	54
235	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:09:32.719108+00	54
236	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:10:12.917715+00	54
237	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:11:40.291725+00	54
238	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:12:42.266697+00	54
239	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:13:58.218562+00	54
240	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:13:58.594811+00	55
241	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:14:43.863634+00	54
242	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:14:44.245717+00	55
243	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:17:52.215383+00	54
244	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:17:52.570368+00	55
245	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:17:52.86481+00	51
246	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:17:53.159126+00	52
247	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:04.07257+00	54
248	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:04.43695+00	55
249	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:04.74223+00	51
250	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:05.051256+00	52
251	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:56.375424+00	54
252	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:56.729506+00	55
253	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:57.024558+00	51
254	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:19:57.316112+00	52
255	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:24:09.611613+00	54
256	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:24:09.977775+00	55
257	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:32:30.478024+00	54
258	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:32:30.749207+00	55
259	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:35:11.953778+00	54
260	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 09:35:12.220827+00	55
261	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-12 13:09:21.901434+00	54
262	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-12 13:09:29.370545+00	54
263	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:09:42.609123+00	54
264	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:09:42.890074+00	55
265	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-12 13:10:00.85044+00	54
266	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:12:40.381742+00	54
267	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:12:40.650712+00	55
268	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; en-US) PowerShell/7.5.4	2025-12-12 13:12:58.473714+00	54
269	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:13:44.282135+00	54
270	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:13:44.543651+00	55
271	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:16:01.604178+00	54
272	testworker@iayos.com	user_login	user	55	{"email": "testworker@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:16:01.931859+00	55
273	admin@iayos.com	user_login	user	57	{"email": "admin@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:16:02.202038+00	57
274	admin@iayos.com	user_login	user	57	{"email": "admin@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-12 13:16:02.920089+00	57
275	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:34:52.228715+00	7
276	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:34:53.082753+00	50
277	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:34:53.857005+00	53
278	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:35:12.33748+00	50
279	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:35:16.809243+00	50
280	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 15:36:36.603053+00	53
281	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 16:38:05.135365+00	7
282	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:02:34.367571+00	66
283	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:02:34.661211+00	67
284	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:02:34.939847+00	68
285	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:02:35.207255+00	69
286	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:02:41.682186+00	66
287	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:04:02.699622+00	66
288	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:04:02.977359+00	67
289	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:04:03.264897+00	68
290	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:04:03.542656+00	69
291	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:37.460193+00	66
292	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:37.733377+00	67
293	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:38.012557+00	68
294	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:38.282786+00	69
295	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:41.589073+00	66
296	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:41.857347+00	67
297	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:42.144618+00	68
298	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:06:42.44504+00	69
299	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:08:20.747663+00	66
300	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:08:21.034015+00	67
301	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:08:21.321973+00	68
302	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:08:21.601761+00	69
303	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:09:23.417555+00	66
304	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:09:23.709497+00	67
305	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:09:24.013062+00	68
306	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:09:24.307959+00	69
307	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:10:28.77232+00	66
308	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:10:29.061089+00	67
309	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:10:29.33881+00	68
310	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:10:29.616602+00	69
311	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:02.954446+00	66
312	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:03.242482+00	67
313	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:03.520495+00	68
314	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:03.798559+00	69
315	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:34.876678+00	66
316	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:35.137917+00	67
317	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:35.417103+00	68
318	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:11:35.675667+00	69
319	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:07.772857+00	66
320	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:08.054343+00	67
321	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:08.327858+00	68
322	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:08.601881+00	69
323	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:55.580726+00	66
324	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:55.842316+00	67
325	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:56.126262+00	68
326	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:12:56.399661+00	69
327	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:14:41.751079+00	66
328	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:14:42.028429+00	67
329	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:14:42.287498+00	68
330	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:14:42.565669+00	69
331	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:19:52.63346+00	66
332	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:19:52.904185+00	67
333	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:19:53.175114+00	68
334	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:19:53.452768+00	69
335	testclient@teamtest.com	user_login	user	66	{"email": "testclient@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:20:26.898951+00	66
336	testworker1@teamtest.com	user_login	user	67	{"email": "testworker1@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:20:27.158463+00	67
337	testworker2@teamtest.com	user_login	user	68	{"email": "testworker2@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:20:27.419411+00	68
338	testworker3@teamtest.com	user_login	user	69	{"email": "testworker3@teamtest.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:20:27.688795+00	69
339	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:42:55.646421+00	7
340	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:49:30.725219+00	50
341	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:49:41.118363+00	50
342	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:50:09.060671+00	50
343	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:50:09.930154+00	53
344	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:50:15.711097+00	50
345	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:50:16.520105+00	53
346	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:50:51.018688+00	6
347	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:51:57.757588+00	7
348	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:52:25.803985+00	6
349	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 17:55:11.466531+00	7
350	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:02:50.386991+00	50
351	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:02:51.153095+00	53
352	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:03:11.266094+00	50
353	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:03:12.090216+00	53
354	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:03.270673+00	50
355	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:03.533623+00	51
356	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:03.791938+00	52
357	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:04.055846+00	53
358	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:48.195058+00	50
359	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:48.466077+00	51
360	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:48.732087+00	52
361	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:49.02104+00	53
362	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:04:56.911615+00	51
363	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:09.959574+00	50
364	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:10.218274+00	51
365	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:10.477897+00	52
366	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:10.745909+00	53
367	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:22.07095+00	50
368	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:05:42.521863+00	50
369	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:22.924917+00	50
370	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:23.183566+00	51
371	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:23.443295+00	52
372	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:23.700758+00	53
373	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:24.221479+00	50
374	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:24.495213+00	51
375	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:24.760029+00	52
376	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:25.020238+00	53
377	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:34.497898+00	50
378	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:34.7657+00	51
379	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:35.02816+00	52
380	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:35.295836+00	53
381	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:56.819019+00	50
382	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:57.079988+00	51
383	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:57.342392+00	52
384	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:06:57.608686+00	53
385	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:08:40.339424+00	6
386	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:09:21.474792+00	6
387	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:09:49.848797+00	7
388	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:21:39.126042+00	6
389	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:22:39.653945+00	37
390	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:23:07.018399+00	58
391	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:24:06.823806+00	6
392	gamerofgames76@gmail.com	user_login	user	58	{"email": "gamerofgames76@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:24:38.410289+00	58
393	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:25:15.057112+00	6
394	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:35:00.091418+00	36
395	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 18:35:51.145499+00	7
396	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:17:11.54519+00	7
397	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:18:08.666089+00	7
398	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:18:09.098771+00	51
399	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:18:09.368781+00	52
400	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:18:09.632903+00	53
401	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:19:10.462943+00	7
402	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:19:10.877431+00	51
403	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:19:11.167863+00	52
404	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:19:11.440532+00	53
405	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:21:27.989394+00	7
406	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:21:28.384615+00	51
407	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:21:28.644751+00	52
408	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:21:28.904462+00	53
409	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:22:11.37886+00	7
410	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:22:11.761515+00	51
411	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:22:12.023918+00	52
412	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:22:12.285919+00	53
413	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:32:37.039364+00	50
414	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:33:56.868015+00	50
415	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:37:47.167881+00	50
416	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:38:34.606513+00	50
417	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:38:34.869728+00	51
418	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:38:35.144181+00	52
419	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:38:35.414906+00	53
420	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:39:31.676106+00	50
421	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:39:31.941016+00	51
422	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:39:32.214742+00	52
423	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:39:32.476822+00	53
424	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:40:44.982767+00	50
425	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:40:45.266796+00	51
426	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:40:45.536747+00	52
427	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:40:45.807116+00	53
428	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:42:20.645963+00	50
429	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:42:20.911854+00	51
430	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:42:21.17575+00	52
431	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:42:21.439715+00	53
432	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:45:25.398147+00	50
433	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:45:25.661824+00	51
434	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:45:25.922143+00	52
435	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:45:26.184633+00	53
436	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:49:23.229995+00	50
437	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:49:23.500343+00	51
438	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:49:23.770499+00	52
439	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:49:24.031233+00	53
440	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:50:04.044833+00	50
441	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:50:04.308594+00	51
442	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:50:04.573549+00	52
443	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-12 20:50:04.836684+00	53
469	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:39:39.063829+00	7
470	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:51:27.205235+00	50
471	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:51:27.468517+00	51
472	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:51:27.733746+00	52
473	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:51:27.995737+00	53
474	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:53:38.407406+00	50
475	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:53:38.670745+00	51
476	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:53:38.921927+00	52
477	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:53:39.173921+00	53
478	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:54:48.292375+00	50
479	testworker1_team@test.com	user_login	user	51	{"email": "testworker1_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:54:48.549183+00	51
480	testworker2_team@test.com	user_login	user	52	{"email": "testworker2_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:54:48.803152+00	52
481	testworker3_team@test.com	user_login	user	53	{"email": "testworker3_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:54:49.053963+00	53
482	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:55:03.916025+00	50
483	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:55:09.297629+00	50
484	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:55:17.134926+00	50
485	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:55:25.569494+00	50
486	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 02:55:33.11598+00	50
487	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 03:12:46.040258+00	6
488	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:21:59.394413+00	7
489	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:22:10.444912+00	6
490	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:36:44.245894+00	7
491	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:37:21.535297+00	6
492	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:37:42.56185+00	6
493	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:37:55.865141+00	7
494	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 04:38:37.001715+00	6
495	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 05:48:45.555755+00	6
496	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-13 06:51:00.789133+00	6
497	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-14 13:56:26.464775+00	6
498	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-14 15:16:25.769444+00	6
499	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-15 02:45:40.679794+00	6
500	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-15 03:51:57.161958+00	6
501	new.cornelio.vaniel38@gmail.com	profile_update	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "updated_fields": ["firstName", "lastName", "contactNum"]}	{"lastName": "Cornelio", "birthDate": "2005-02-02", "firstName": "Vaniel", "contactNum": "9998500312"}	{"lastName": "Cornelio", "firstName": "Vaniel", "contactNum": "9998500312"}	172.18.0.1	Expo/1017756 CFNetwork/3860.200.71 Darwin/25.1.0	2025-12-15 04:11:11.702742+00	6
502	new.cornelio.vaniel38@gmail.com	profile_update	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "updated_fields": ["firstName", "lastName", "contactNum"]}	{"lastName": "Cornelio", "birthDate": "2005-02-02", "firstName": "Vaniel", "contactNum": "9998500312"}	{"lastName": "Cornelio", "firstName": "Vaniel", "contactNum": "9998500312"}	172.18.0.1	Expo/1017756 CFNetwork/3860.200.71 Darwin/25.1.0	2025-12-15 04:12:12.251509+00	6
503	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 00:43:32.926477+00	37
504	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 00:44:30.661559+00	36
505	superadmin@gmail.com	certification_approval	certification	14	{"cert_name": "ELECTRICIAN", "worker_email": "dump.temp.27@gmail.com"}	{"is_verified": false}	{"is_verified": true}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-16 01:01:54.385974+00	13
506	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 01:27:56.352776+00	6
507	worker@test.com	user_login	user	37	{"email": "worker@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 01:29:46.613492+00	37
508	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 01:30:24.872549+00	7
509	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 01:47:30.370394+00	54
510	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 01:49:13.76367+00	50
511	testclient_team@test.com	user_login	user	50	{"email": "testclient_team@test.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 02:19:00.892302+00	50
512	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 02:25:30.162214+00	7
513	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 02:27:30.10484+00	6
514	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 02:28:29.288185+00	36
515	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 02:28:52.88014+00	7
516	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 03:20:33.554034+00	36
517	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 03:24:38.050626+00	6
518	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-16 03:40:06.256839+00	54
519	testclient@iayos.com	user_login	user	54	{"email": "testclient@iayos.com", "action": "login"}	{}	{"logged_in": true}	172.18.0.1	python-requests/2.32.5	2025-12-16 03:40:20.664464+00	54
520	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 03:59:10.739872+00	7
521	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 04:33:57.650994+00	36
522	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 04:45:09.171687+00	6
523	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 04:45:32.384679+00	7
524	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 05:00:21.594752+00	36
525	dump.temp.27@gmail.com	user_login	user	36	{"email": "dump.temp.27@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 05:10:39.758248+00	36
526	new.cornelio.vaniel38@gmail.com	user_login	user	6	{"email": "new.cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 05:13:11.856041+00	6
527	cornelio.vaniel38@gmail.com	user_login	user	7	{"email": "cornelio.vaniel38@gmail.com", "action": "login"}	{}	{"logged_in": true}	\N		2025-12-16 05:25:17.277146+00	7
\.


--
-- Data for Name: adminpanel_cannedresponse; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_cannedresponse ("responseID", title, content, category, shortcuts, "usageCount", "createdAt", "updatedAt", "createdBy_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_faq; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_faq ("faqID", question, answer, category, "sortOrder", "viewCount", "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: adminpanel_kyclogs; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_kyclogs ("kycLogID", action, "reviewedAt", reason, "userEmail", "userAccountID", "createdAt", "accountFK_id", "kycID", "reviewedBy_id", "kycType") FROM stdin;
1	Rejected	2025-10-06 12:10:06.195207+00	Documents did not meet verification requirements	cornelio.vaniel38@gmail.com	7	2025-10-06 12:10:06.329729+00	7	3	\N	USER
2	Rejected	2025-10-08 01:50:58.858576+00	Documents did not meet verification requirements	new.cornelio.vaniel38@gmail.com	6	2025-10-08 01:50:58.991204+00	6	5	\N	USER
3	APPROVED	2025-10-12 05:38:15.989799+00	KYC documents verified and approved	new.cornelio.vaniel38@gmail.com	6	2025-10-12 05:38:16.125215+00	6	6	\N	USER
4	APPROVED	2025-10-12 14:27:30.981408+00	KYC documents verified and approved	cornelio.vaniel38@gmail.com	7	2025-10-12 14:27:31.114644+00	7	7	\N	USER
5	Rejected	2025-10-21 16:25:35.518449+00	Documents did not meet verification requirements	ririka.ruu@gmail.com	23	2025-10-21 16:25:35.636013+00	23	8	\N	USER
7	APPROVED	2025-10-22 05:13:18.739574+00	Agency KYC documents verified and approved	ririka.ruu@gmail.com	23	2025-10-22 05:13:18.801071+00	23	2	\N	AGENCY
8	APPROVED	2025-11-14 11:12:36.425846+00	KYC documents verified and approved	daraemoon21@gmail.com	26	2025-11-14 11:12:36.572824+00	26	9	\N	USER
9	APPROVED	2025-11-14 12:47:55.885883+00	Agency KYC documents verified and approved	daraemoon2127@gmail.com	27	2025-11-14 12:47:55.961408+00	27	3	\N	AGENCY
10	APPROVED	2025-11-24 09:05:00.456721+00	KYC documents verified and approved	dump.temp.27@gmail.com	36	2025-11-24 09:05:00.579484+00	36	12	\N	USER
11	APPROVED	2025-11-24 09:05:34.581492+00	KYC documents verified and approved	modillasgabriel@gmail.com	25	2025-11-24 09:05:34.703123+00	25	10	\N	USER
12	Rejected	2025-11-30 11:51:00.522951+00	Agency documents did not meet verification requirements	daraemoon2127@gmail.com	27	2025-11-30 11:51:00.590328+00	27	3	\N	AGENCY
13	Rejected	2025-12-12 05:42:42.077318+00	Documents did not meet verification requirements	gamerofgames76@gmail.com	58	2025-12-12 05:42:42.088619+00	58	14	\N	USER
14	Rejected	2025-12-12 06:05:55.950569+00	Documents did not meet verification requirements	gamerofgames76@gmail.com	58	2025-12-12 06:05:55.962193+00	58	14	\N	USER
15	Rejected	2025-12-12 06:48:24.274766+00	Documents did not meet verification requirements	gamerofgames76@gmail.com	58	2025-12-12 06:48:24.282334+00	58	14	\N	USER
16	Rejected	2025-12-12 06:53:01.996779+00	Documents did not meet verification requirements	gamerofgames76@gmail.com	58	2025-12-12 06:53:02.006581+00	58	14	\N	USER
17	APPROVED	2025-12-12 07:36:47.536535+00	KYC documents verified and approved	gamerofgames76@gmail.com	58	2025-12-12 07:36:47.545647+00	58	14	\N	USER
\.


--
-- Data for Name: adminpanel_platformsettings; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_platformsettings ("settingsID", "platformFeePercentage", "escrowHoldingDays", "maxJobBudget", "minJobBudget", "workerVerificationRequired", "autoApproveKYC", "kycDocumentExpiryDays", "maintenanceMode", "sessionTimeoutMinutes", "maxUploadSizeMB", "lastUpdated", "updatedBy_id") FROM stdin;
1	5.00	7	100000.00	100.00	t	f	365	f	60	10	2025-12-12 13:05:30.325529+00	\N
\.


--
-- Data for Name: adminpanel_supportticket; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_supportticket ("ticketID", subject, category, priority, status, "createdAt", "updatedAt", "lastReplyAt", "resolvedAt", "assignedTo_id", "userFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_supportticketreply; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_supportticketreply ("replyID", content, "isSystemMessage", "attachmentURL", "createdAt", "senderFK_id", "ticketFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_systemroles; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_systemroles ("systemRoleID", "systemRole", "createdAt", "updatedAt", "accountID_id") FROM stdin;
1	ADMIN	2025-09-30 11:25:53.809975+00	2025-09-30 11:25:53.809988+00	2
2	ADMIN	2025-10-06 04:47:14.787939+00	2025-10-06 04:47:14.78795+00	13
\.


--
-- Data for Name: adminpanel_userreport; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.adminpanel_userreport ("reportID", "reportType", reason, description, "relatedContentID", status, "adminNotes", "actionTaken", "createdAt", "updatedAt", "resolvedAt", "reportedUserFK_id", "reporterFK_id", "reviewedBy_id") FROM stdin;
\.


--
-- Data for Name: agency_agencykyc; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.agency_agencykyc ("agencyKycID", status, "reviewedAt", notes, "createdAt", "updatedAt", "accountFK_id", "reviewedBy_id", "rejectionCategory", "rejectionReason", "resubmissionCount", "maxResubmissions") FROM stdin;
2	APPROVED	2025-10-22 05:13:18.739574+00		2025-10-22 05:12:47.584874+00	2025-10-22 05:13:18.73982+00	23	\N	\N		0	3
3	REJECTED	2025-11-30 11:51:00.522951+00	Agency documents did not meet verification requirements	2025-11-14 12:42:01.071834+00	2025-11-30 11:51:00.80024+00	27	\N	\N		0	3
\.


--
-- Data for Name: agency_agencykycfile; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.agency_agencykycfile ("fileID", "fileType", "fileURL", "fileName", "fileSize", "uploadedAt", "agencyKyc_id") FROM stdin;
16	BUSINESS_PERMIT	agency_23/kyc/business_permit_c9f274b0215c4bedaa225d3140096d4e.jfif	business_permit_c9f274b0215c4bedaa225d3140096d4e.jfif	67483	2025-10-22 05:12:49.471376+00	2
17	REP_ID_FRONT	agency_23/kyc/rep_id_front_89c710b840bf40ad8841ca5f6e12acde.jfif	rep_id_front_89c710b840bf40ad8841ca5f6e12acde.jfif	31390	2025-10-22 05:12:50.017915+00	2
18	REP_ID_BACK	agency_23/kyc/rep_id_back_245d618da7194c9f80c9c4d49de5ebb0.jpg	rep_id_back_245d618da7194c9f80c9c4d49de5ebb0.jpg	502636	2025-10-22 05:12:51.098294+00	2
19	ADDRESS_PROOF	agency_23/kyc/address_proof_b5c68a0d5c5b43ecb1bd0a0b916a88c5.jpg	address_proof_b5c68a0d5c5b43ecb1bd0a0b916a88c5.jpg	123585	2025-10-22 05:12:51.922254+00	2
20	AUTH_LETTER	agency_23/kyc/auth_letter_100eea70a80047bb9aebdb4f84b58ec1.jfif	auth_letter_100eea70a80047bb9aebdb4f84b58ec1.jfif	67483	2025-10-22 05:12:52.719722+00	2
21	BUSINESS_PERMIT	agency_27/kyc/business_permit_bc856713af57418ab4c54831c140cb42.jpg	business_permit_bc856713af57418ab4c54831c140cb42.jpg	440295	2025-11-14 12:42:04.503629+00	3
22	REP_ID_FRONT	agency_27/kyc/rep_id_front_d3b91df847e74afab573f5a3cabcb4ba.jpg	rep_id_front_d3b91df847e74afab573f5a3cabcb4ba.jpg	440295	2025-11-14 12:42:05.872047+00	3
23	REP_ID_BACK	agency_27/kyc/rep_id_back_b30b7c46c9144afb868968c315c62321.jpg	rep_id_back_b30b7c46c9144afb868968c315c62321.jpg	440295	2025-11-14 12:42:12.367769+00	3
24	ADDRESS_PROOF	agency_27/kyc/address_proof_f7c9c5e254aa47149c58c4c0053864c7.jpg	address_proof_f7c9c5e254aa47149c58c4c0053864c7.jpg	440295	2025-11-14 12:42:23.379576+00	3
25	AUTH_LETTER	agency_27/kyc/auth_letter_6558da73d644441ab0d9c4c4d04fb677.jpg	auth_letter_6558da73d644441ab0d9c4c4d04fb677.jpg	440295	2025-11-14 12:42:25.779765+00	3
\.


--
-- Data for Name: agency_employees; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.agency_employees ("employeeID", name, email, role, avatar, rating, "createdAt", "updatedAt", agency_id, "employeeOfTheMonth", "employeeOfTheMonthDate", "employeeOfTheMonthReason", "isActive", "lastRatingUpdate", "totalEarnings", "totalJobsCompleted") FROM stdin;
1	Gabriel Modillas	modillasgabriel@gmail.com	Carpentry	\N	5.00	2025-10-30 04:50:46.337643+00	2025-11-30 09:36:55.376183+00	23	t	2025-11-30 02:14:12.184372+00	Only Employee	t	\N	0.00	0
2	Vaniel Cornelio	new.cornelio.vaniel38@gmail.com	Welding	\N	5.00	2025-11-30 02:14:37.905079+00	2025-11-30 09:36:55.513327+00	23	f	\N		t	\N	0.00	0
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add content type	4	add_contenttype
14	Can change content type	4	change_contenttype
15	Can delete content type	4	delete_contenttype
16	Can view content type	4	view_contenttype
17	Can add session	5	add_session
18	Can change session	5	change_session
19	Can delete session	5	delete_session
20	Can view session	5	view_session
21	Can add specializations	6	add_specializations
22	Can change specializations	6	change_specializations
23	Can delete specializations	6	delete_specializations
24	Can view specializations	6	view_specializations
25	Can add accounts	7	add_accounts
26	Can change accounts	7	change_accounts
27	Can delete accounts	7	delete_accounts
28	Can view accounts	7	view_accounts
29	Can add agency	8	add_agency
30	Can change agency	8	change_agency
31	Can delete agency	8	delete_agency
32	Can view agency	8	view_agency
33	Can add profile	9	add_profile
34	Can change profile	9	change_profile
35	Can delete profile	9	delete_profile
36	Can view profile	9	view_profile
37	Can add client profile	10	add_clientprofile
38	Can change client profile	10	change_clientprofile
39	Can delete client profile	10	delete_clientprofile
40	Can view client profile	10	view_clientprofile
41	Can add interested jobs	11	add_interestedjobs
42	Can change interested jobs	11	change_interestedjobs
43	Can delete interested jobs	11	delete_interestedjobs
44	Can view interested jobs	11	view_interestedjobs
45	Can add worker profile	12	add_workerprofile
46	Can change worker profile	12	change_workerprofile
47	Can delete worker profile	12	delete_workerprofile
48	Can view worker profile	12	view_workerprofile
49	Can add worker specialization	13	add_workerspecialization
50	Can change worker specialization	13	change_workerspecialization
51	Can delete worker specialization	13	delete_workerspecialization
52	Can view worker specialization	13	view_workerspecialization
53	Can add email address	14	add_emailaddress
54	Can change email address	14	change_emailaddress
55	Can delete email address	14	delete_emailaddress
56	Can view email address	14	view_emailaddress
57	Can add email confirmation	15	add_emailconfirmation
58	Can change email confirmation	15	change_emailconfirmation
59	Can delete email confirmation	15	delete_emailconfirmation
60	Can view email confirmation	15	view_emailconfirmation
61	Can add social account	16	add_socialaccount
62	Can change social account	16	change_socialaccount
63	Can delete social account	16	delete_socialaccount
64	Can view social account	16	view_socialaccount
65	Can add social application	17	add_socialapp
66	Can change social application	17	change_socialapp
67	Can delete social application	17	delete_socialapp
68	Can view social application	17	view_socialapp
69	Can add social application token	18	add_socialtoken
70	Can change social application token	18	change_socialtoken
71	Can delete social application token	18	delete_socialtoken
72	Can view social application token	18	view_socialtoken
73	Can add system roles	19	add_systemroles
74	Can change system roles	19	change_systemroles
75	Can delete system roles	19	delete_systemroles
76	Can view system roles	19	view_systemroles
77	Can add kyc files	20	add_kycfiles
78	Can change kyc files	20	change_kycfiles
79	Can delete kyc files	20	delete_kycfiles
80	Can view kyc files	20	view_kycfiles
81	Can add kyc	21	add_kyc
82	Can change kyc	21	change_kyc
83	Can delete kyc	21	delete_kyc
84	Can view kyc	21	view_kyc
85	Can add KYC Log	22	add_kyclogs
86	Can change KYC Log	22	change_kyclogs
87	Can delete KYC Log	22	delete_kyclogs
88	Can view KYC Log	22	view_kyclogs
89	Can add notification	23	add_notification
90	Can change notification	23	change_notification
91	Can delete notification	23	delete_notification
92	Can view notification	23	view_notification
93	Can add job posting	24	add_jobposting
94	Can change job posting	24	change_jobposting
95	Can delete job posting	24	delete_jobposting
96	Can view job posting	24	view_jobposting
97	Can add job posting photo	25	add_jobpostingphoto
98	Can change job posting photo	25	change_jobpostingphoto
99	Can delete job posting photo	25	delete_jobpostingphoto
100	Can view job posting photo	25	view_jobpostingphoto
101	Can add conversation	26	add_conversation
102	Can change conversation	26	change_conversation
103	Can delete conversation	26	delete_conversation
104	Can view conversation	26	view_conversation
105	Can add message	27	add_message
106	Can change message	27	change_message
107	Can delete message	27	delete_message
108	Can view message	27	view_message
109	Can add message attachment	28	add_messageattachment
110	Can change message attachment	28	change_messageattachment
111	Can delete message attachment	28	delete_messageattachment
112	Can view message attachment	28	view_messageattachment
113	Can add wallet	29	add_wallet
114	Can change wallet	29	change_wallet
115	Can delete wallet	29	delete_wallet
116	Can view wallet	29	view_wallet
117	Can add transaction	30	add_transaction
118	Can change transaction	30	change_transaction
119	Can delete transaction	30	delete_transaction
120	Can view transaction	30	view_transaction
121	Can add worker product	31	add_workerproduct
122	Can change worker product	31	change_workerproduct
123	Can delete worker product	31	delete_workerproduct
124	Can view worker product	31	view_workerproduct
125	Can add worker product	32	add_workerproduct
126	Can change worker product	32	change_workerproduct
127	Can delete worker product	32	delete_workerproduct
128	Can view worker product	32	view_workerproduct
129	Can add agency kyc file	33	add_agencykycfile
130	Can change agency kyc file	33	change_agencykycfile
131	Can delete agency kyc file	33	delete_agencykycfile
132	Can view agency kyc file	33	view_agencykycfile
133	Can add agency kyc	34	add_agencykyc
134	Can change agency kyc	34	change_agencykyc
135	Can delete agency kyc	34	delete_agencykyc
136	Can view agency kyc	34	view_agencykyc
137	Can add agency employee	35	add_agencyemployee
138	Can change agency employee	35	change_agencyemployee
139	Can delete agency employee	35	delete_agencyemployee
140	Can view agency employee	35	view_agencyemployee
141	Can add job	36	add_job
142	Can change job	36	change_job
143	Can delete job	36	delete_job
144	Can view job	36	view_job
145	Can add job log	37	add_joblog
146	Can change job log	37	change_joblog
147	Can delete job log	37	delete_joblog
148	Can view job log	37	view_joblog
149	Can add job photo	38	add_jobphoto
150	Can change job photo	38	change_jobphoto
151	Can delete job photo	38	delete_jobphoto
152	Can view job photo	38	view_jobphoto
153	Can add job application	39	add_jobapplication
154	Can change job application	39	change_jobapplication
155	Can delete job application	39	delete_jobapplication
156	Can view job application	39	view_jobapplication
157	Can add job dispute	40	add_jobdispute
158	Can change job dispute	40	change_jobdispute
159	Can delete job dispute	40	delete_jobdispute
160	Can view job dispute	40	view_jobdispute
161	Can add job review	41	add_jobreview
162	Can change job review	41	change_jobreview
163	Can delete job review	41	delete_jobreview
164	Can view job review	41	view_jobreview
165	Can add conversation	42	add_conversation
166	Can change conversation	42	change_conversation
167	Can delete conversation	42	delete_conversation
168	Can view conversation	42	view_conversation
169	Can add message	43	add_message
170	Can change message	43	change_message
171	Can delete message	43	delete_message
172	Can view message	43	view_message
173	Can add message attachment	44	add_messageattachment
174	Can change message attachment	44	change_messageattachment
175	Can delete message attachment	44	delete_messageattachment
176	Can view message attachment	44	view_messageattachment
177	Can add agency job request	45	add_agencyjobrequest
178	Can change agency job request	45	change_agencyjobrequest
179	Can delete agency job request	45	delete_agencyjobrequest
180	Can view agency job request	45	view_agencyjobrequest
181	Can add worker certification	46	add_workercertification
182	Can change worker certification	46	change_workercertification
183	Can delete worker certification	46	delete_workercertification
184	Can view worker certification	46	view_workercertification
185	Can add worker portfolio	47	add_workerportfolio
186	Can change worker portfolio	47	change_workerportfolio
187	Can delete worker portfolio	47	delete_workerportfolio
188	Can view worker portfolio	47	view_workerportfolio
189	Can add notification settings	48	add_notificationsettings
190	Can change notification settings	48	change_notificationsettings
191	Can delete notification settings	48	delete_notificationsettings
192	Can view notification settings	48	view_notificationsettings
193	Can add push token	49	add_pushtoken
194	Can change push token	49	change_pushtoken
195	Can delete push token	49	delete_pushtoken
196	Can view push token	49	view_pushtoken
197	Can add barangay	50	add_barangay
198	Can change barangay	50	change_barangay
199	Can delete barangay	50	delete_barangay
200	Can view barangay	50	view_barangay
201	Can add city	51	add_city
202	Can change city	51	change_city
203	Can delete city	51	delete_city
204	Can view city	51	view_city
205	Can add worker material	52	add_workermaterial
206	Can change worker material	52	change_workermaterial
207	Can delete worker material	52	delete_workermaterial
208	Can view worker material	52	view_workermaterial
209	Can add Payment Method	53	add_userpaymentmethod
210	Can change Payment Method	53	change_userpaymentmethod
211	Can delete Payment Method	53	delete_userpaymentmethod
212	Can view Payment Method	53	view_userpaymentmethod
213	Can add job employee assignment	54	add_jobemployeeassignment
214	Can change job employee assignment	54	change_jobemployeeassignment
215	Can delete job employee assignment	54	delete_jobemployeeassignment
216	Can view job employee assignment	54	view_jobemployeeassignment
217	Can add FAQ	55	add_faq
218	Can change FAQ	55	change_faq
219	Can delete FAQ	55	delete_faq
220	Can view FAQ	55	view_faq
221	Can add Canned Response	56	add_cannedresponse
222	Can change Canned Response	56	change_cannedresponse
223	Can delete Canned Response	56	delete_cannedresponse
224	Can view Canned Response	56	view_cannedresponse
225	Can add Support Ticket	57	add_supportticket
226	Can change Support Ticket	57	change_supportticket
227	Can delete Support Ticket	57	delete_supportticket
228	Can view Support Ticket	57	view_supportticket
229	Can add Ticket Reply	58	add_supportticketreply
230	Can change Ticket Reply	58	change_supportticketreply
231	Can delete Ticket Reply	58	delete_supportticketreply
232	Can view Ticket Reply	58	view_supportticketreply
233	Can add User Report	59	add_userreport
234	Can change User Report	59	change_userreport
235	Can delete User Report	59	delete_userreport
236	Can view User Report	59	view_userreport
237	Can add Audit Log	60	add_auditlog
238	Can change Audit Log	60	change_auditlog
239	Can delete Audit Log	60	delete_auditlog
240	Can view Audit Log	60	view_auditlog
241	Can add Platform Settings	61	add_platformsettings
242	Can change Platform Settings	61	change_platformsettings
243	Can delete Platform Settings	61	delete_platformsettings
244	Can view Platform Settings	61	view_platformsettings
245	Can add Admin Account	62	add_adminaccount
246	Can change Admin Account	62	change_adminaccount
247	Can delete Admin Account	62	delete_adminaccount
248	Can view Admin Account	62	view_adminaccount
249	Can add dispute evidence	63	add_disputeevidence
250	Can change dispute evidence	63	change_disputeevidence
251	Can delete dispute evidence	63	delete_disputeevidence
252	Can view dispute evidence	63	view_disputeevidence
253	Can add review skill tag	64	add_reviewskilltag
254	Can change review skill tag	64	change_reviewskilltag
255	Can delete review skill tag	64	delete_reviewskilltag
256	Can view review skill tag	64	view_reviewskilltag
257	Can add certification log	65	add_certificationlog
258	Can change certification log	65	change_certificationlog
259	Can delete certification log	65	delete_certificationlog
260	Can view certification log	65	view_certificationlog
261	Can add job skill slot	66	add_jobskillslot
262	Can change job skill slot	66	change_jobskillslot
263	Can delete job skill slot	66	delete_jobskillslot
264	Can view job skill slot	66	view_jobskillslot
265	Can add job worker assignment	67	add_jobworkerassignment
266	Can change job worker assignment	67	change_jobworkerassignment
267	Can delete job worker assignment	67	delete_jobworkerassignment
268	Can view job worker assignment	67	view_jobworkerassignment
269	Can add conversation participant	68	add_conversationparticipant
270	Can change conversation participant	68	change_conversationparticipant
271	Can delete conversation participant	68	delete_conversationparticipant
272	Can view conversation participant	68	view_conversationparticipant
\.


--
-- Data for Name: certification_logs; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.certification_logs ("certLogID", "certificationID", action, "reviewedAt", reason, "workerEmail", "workerAccountID", "certificationName", "reviewedBy_id", "workerID_id") FROM stdin;
1	7	APPROVED	2025-12-09 14:42:02.510886+00	Certification documents verified and approved	worker@test.com	37	Electrical Safety Certificate	13	6
2	11	APPROVED	2025-12-11 18:31:11.582887+00	Test approval from API testing	certtest@example.com	38	Updated Safety Certificate	57	7
3	10	REJECTED	2025-12-11 18:31:16.065186+00	Test rejection: Certificate image unclear	certtest@example.com	38	Test Safety Certificate	57	7
4	14	APPROVED	2025-12-16 01:01:54.370744+00	Certification documents verified and approved	dump.temp.27@gmail.com	36	ELECTRICIAN	13	5
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.conversation ("conversationID", "lastMessageText", "lastMessageTime", "unreadCountClient", "unreadCountWorker", status, "createdAt", "updatedAt", client_id, "lastMessageSender_id", "relatedJobPosting_id", worker_id, "archivedByClient", "archivedByWorker", agency_id, conversation_type) FROM stdin;
10	\N	\N	0	0	COMPLETED	2025-11-30 07:50:10.762144+00	2025-11-30 09:13:59.262557+00	3	\N	45	\N	f	f	8	ONE_ON_ONE
7	yeah	2025-11-26 04:23:03.616799+00	0	0	COMPLETED	2025-11-26 01:36:49.612011+00	2025-11-26 04:44:25.747445+00	3	3	34	2	f	f	\N	ONE_ON_ONE
2	ULOL	2025-11-03 12:03:25.661164+00	0	0	ACTIVE	2025-11-03 11:32:20.741569+00	2025-11-03 12:03:25.978824+00	3	2	4	2	f	t	\N	ONE_ON_ONE
4	Thanks for accepting the job	2025-11-06 03:40:05.644197+00	0	0	ACTIVE	2025-11-06 03:39:13.226553+00	2025-11-06 03:40:06.252105+00	3	2	10	2	f	t	\N	ONE_ON_ONE
3	done	2025-11-05 19:01:01.793318+00	0	0	ACTIVE	2025-11-05 18:58:41.02263+00	2025-11-05 19:01:01.923939+00	3	2	6	2	f	t	\N	ONE_ON_ONE
6	bey	2025-11-23 12:38:34.03333+00	0	0	ACTIVE	2025-11-23 12:04:59.849655+00	2025-11-23 12:38:34.225916+00	3	2	7	2	f	f	\N	ONE_ON_ONE
22	\N	\N	0	0	ACTIVE	2025-12-10 17:17:40.323027+00	2025-12-10 17:17:40.323035+00	41	\N	63	\N	f	f	\N	TEAM_GROUP
23	\N	\N	0	0	ACTIVE	2025-12-10 17:19:44.411896+00	2025-12-10 17:19:44.411904+00	41	\N	64	\N	f	f	\N	TEAM_GROUP
24	\N	\N	0	0	ACTIVE	2025-12-10 17:31:12.677233+00	2025-12-10 17:31:12.677241+00	41	\N	65	\N	f	f	\N	TEAM_GROUP
25	\N	\N	0	0	ACTIVE	2025-12-10 17:33:44.202211+00	2025-12-10 17:33:44.202219+00	41	\N	66	\N	f	f	\N	TEAM_GROUP
26	\N	\N	0	0	ACTIVE	2025-12-10 17:34:07.26176+00	2025-12-10 17:34:07.261768+00	41	\N	67	\N	f	f	\N	TEAM_GROUP
43	\N	\N	0	0	COMPLETED	2025-12-12 09:19:56.436528+00	2025-12-12 09:19:57.788924+00	45	\N	87	\N	f	f	\N	TEAM_GROUP
27	Welcome team! Looking forward to working with you all. Please coordinate your schedules. 👍	2025-12-10 17:36:09.574918+00	0	1	ACTIVE	2025-12-10 17:36:08.886273+00	2025-12-10 17:36:09.579754+00	41	41	68	\N	f	f	\N	TEAM_GROUP
28	\N	\N	0	0	ACTIVE	2025-12-10 17:44:32.947074+00	2025-12-10 17:44:32.947083+00	41	\N	69	\N	f	f	\N	TEAM_GROUP
29	\N	\N	0	0	ACTIVE	2025-12-10 17:45:08.350346+00	2025-12-10 17:45:08.350356+00	41	\N	70	\N	f	f	\N	TEAM_GROUP
30	\N	\N	0	0	ACTIVE	2025-12-10 17:48:24.761202+00	2025-12-10 17:48:24.76121+00	41	\N	71	\N	f	f	\N	TEAM_GROUP
31	\N	\N	0	0	ACTIVE	2025-12-10 17:58:19.750222+00	2025-12-10 17:58:19.75023+00	41	\N	72	\N	f	f	\N	TEAM_GROUP
32	\N	\N	0	0	ACTIVE	2025-12-10 17:59:29.702087+00	2025-12-10 17:59:29.702095+00	41	\N	73	\N	f	f	\N	TEAM_GROUP
64	Team job 'Home Renovation TEST 1765572141' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-12 20:42:22.441047+00	0	1	ACTIVE	2025-12-12 20:42:22.42562+00	2025-12-12 20:42:22.443001+00	41	41	129	\N	f	f	\N	TEAM_GROUP
33	Application accepted! You can now chat about the job: Fix Kitchen Faucet	2025-12-11 16:35:28.724273+00	0	1	COMPLETED	2025-12-11 16:35:28.71853+00	2025-12-11 16:36:15.693376+00	45	45	75	44	f	f	\N	ONE_ON_ONE
34	\N	\N	0	0	ACTIVE	2025-12-11 18:26:08.969861+00	2025-12-11 18:26:08.969869+00	47	\N	76	\N	f	f	\N	TEAM_GROUP
5	Hey man u ready?	2025-11-09 20:38:57.210409+00	0	0	COMPLETED	2025-11-09 20:38:41.031269+00	2025-11-26 05:44:29.905028+00	3	3	12	2	f	f	\N	ONE_ON_ONE
35	Welcome team! Looking forward to working with you all. Please coordinate your schedules. 👍	2025-12-12 04:29:59.532914+00	0	1	ACTIVE	2025-12-12 04:29:58.734133+00	2025-12-12 04:29:59.539075+00	41	41	78	\N	f	f	\N	TEAM_GROUP
36	\N	\N	0	0	ACTIVE	2025-12-12 05:04:24.148467+00	2025-12-12 05:04:24.148474+00	41	\N	79	\N	f	f	\N	TEAM_GROUP
37	\N	\N	0	0	ACTIVE	2025-12-12 09:06:53.566161+00	2025-12-12 09:06:53.566169+00	45	\N	81	\N	f	f	\N	TEAM_GROUP
38	\N	\N	0	0	ACTIVE	2025-12-12 09:12:42.325307+00	2025-12-12 09:12:42.325313+00	45	\N	82	\N	f	f	\N	TEAM_GROUP
9	wait what	2025-11-30 05:12:02.995378+00	0	0	COMPLETED	2025-11-30 03:05:43.912381+00	2025-11-30 05:25:22.147405+00	3	3	44	\N	f	f	8	ONE_ON_ONE
39	\N	\N	0	0	ACTIVE	2025-12-12 09:13:58.281766+00	2025-12-12 09:13:58.281777+00	45	\N	83	\N	f	f	\N	TEAM_GROUP
40	\N	\N	0	0	ACTIVE	2025-12-12 09:14:43.92273+00	2025-12-12 09:14:43.922738+00	45	\N	84	\N	f	f	\N	TEAM_GROUP
41	\N	\N	0	0	COMPLETED	2025-12-12 09:17:52.272814+00	2025-12-12 09:17:53.63381+00	45	\N	85	\N	f	f	\N	TEAM_GROUP
42	\N	\N	0	0	COMPLETED	2025-12-12 09:19:04.135563+00	2025-12-12 09:19:05.563887+00	45	\N	86	\N	f	f	\N	TEAM_GROUP
12		2025-12-01 17:30:55.761195+00	0	0	ACTIVE	2025-12-01 16:58:11.84275+00	2025-12-01 17:30:57.146578+00	3	\N	47	\N	f	f	\N	ONE_ON_ONE
13	Application accepted! You can now chat about the job: Test Multi-Criteria Review Job	2025-12-10 15:04:19.115466+00	0	1	COMPLETED	2025-12-10 15:04:19.109882+00	2025-12-10 15:05:48.639501+00	37	37	51	38	f	f	\N	ONE_ON_ONE
14	\N	\N	0	0	ACTIVE	2025-12-10 17:03:53.258334+00	2025-12-10 17:03:53.258362+00	41	\N	55	\N	f	f	\N	TEAM_GROUP
15	\N	\N	0	0	ACTIVE	2025-12-10 17:04:57.554167+00	2025-12-10 17:04:57.554176+00	41	\N	56	\N	f	f	\N	TEAM_GROUP
16	\N	\N	0	0	ACTIVE	2025-12-10 17:05:58.487394+00	2025-12-10 17:05:58.487402+00	41	\N	57	\N	f	f	\N	TEAM_GROUP
17	\N	\N	0	0	ACTIVE	2025-12-10 17:07:11.701763+00	2025-12-10 17:07:11.701771+00	41	\N	58	\N	f	f	\N	TEAM_GROUP
18	\N	\N	0	0	ACTIVE	2025-12-10 17:08:05.461561+00	2025-12-10 17:08:05.461569+00	41	\N	59	\N	f	f	\N	TEAM_GROUP
19	\N	\N	0	0	ACTIVE	2025-12-10 17:08:48.838267+00	2025-12-10 17:08:48.838275+00	41	\N	60	\N	f	f	\N	TEAM_GROUP
20	\N	\N	0	0	ACTIVE	2025-12-10 17:09:50.921471+00	2025-12-10 17:09:50.921479+00	41	\N	61	\N	f	f	\N	TEAM_GROUP
21	\N	\N	0	0	ACTIVE	2025-12-10 17:10:52.97984+00	2025-12-10 17:10:52.979847+00	41	\N	62	\N	f	f	\N	TEAM_GROUP
44	\N	\N	0	0	ACTIVE	2025-12-12 09:24:09.666862+00	2025-12-12 09:24:09.666871+00	45	\N	88	\N	f	f	\N	TEAM_GROUP
45	\N	\N	0	0	ACTIVE	2025-12-12 15:36:04.967724+00	2025-12-12 15:36:04.967733+00	41	\N	101	\N	f	f	\N	TEAM_GROUP
47	Welcome team! Let's coordinate our work. 👋	2025-12-12 17:04:03.893203+00	0	1	ACTIVE	2025-12-12 17:04:03.627577+00	2025-12-12 17:04:03.905113+00	56	56	103	\N	f	f	\N	TEAM_GROUP
50	Worker 2 here! Ready to start. 🔧	2025-12-12 17:08:22.442915+00	0	1	COMPLETED	2025-12-12 17:08:21.683224+00	2025-12-12 17:08:23.041175+00	56	58	106	\N	f	f	\N	TEAM_GROUP
48	Worker 2 here! Ready to start. 🔧	2025-12-12 17:06:39.096906+00	0	1	ACTIVE	2025-12-12 17:06:38.364543+00	2025-12-12 17:06:39.101988+00	56	58	104	\N	f	f	\N	TEAM_GROUP
49	Worker 2 here! Ready to start. 🔧	2025-12-12 17:06:43.329482+00	0	1	ACTIVE	2025-12-12 17:06:42.567526+00	2025-12-12 17:06:43.334579+00	56	58	105	\N	f	f	\N	TEAM_GROUP
51	Worker 2 here! Ready to start. 🔧	2025-12-12 17:09:25.23483+00	0	1	COMPLETED	2025-12-12 17:09:24.478197+00	2025-12-12 17:09:26.128502+00	56	58	107	\N	f	f	\N	TEAM_GROUP
52	Worker 2 here! Ready to start. 🔧	2025-12-12 17:10:30.503349+00	0	1	COMPLETED	2025-12-12 17:10:29.779869+00	2025-12-12 17:10:31.316521+00	56	58	108	\N	f	f	\N	TEAM_GROUP
53	Worker 2 here! Ready to start. 🔧	2025-12-12 17:11:36.473923+00	0	1	COMPLETED	2025-12-12 17:11:35.76088+00	2025-12-12 17:11:37.282351+00	56	58	109	\N	f	f	\N	TEAM_GROUP
54	Worker 2 here! Ready to start. 🔧	2025-12-12 17:12:09.393147+00	0	1	COMPLETED	2025-12-12 17:12:08.681018+00	2025-12-12 17:12:09.848354+00	56	58	110	\N	f	f	\N	TEAM_GROUP
55	Worker 2 here! Ready to start. 🔧	2025-12-12 17:12:57.282922+00	0	1	COMPLETED	2025-12-12 17:12:56.559964+00	2025-12-12 17:12:58.089239+00	56	58	111	\N	f	f	\N	TEAM_GROUP
56	Worker 2 here! Ready to start. 🔧	2025-12-12 17:14:43.445562+00	0	1	COMPLETED	2025-12-12 17:14:42.659407+00	2025-12-12 17:14:43.922899+00	56	58	112	\N	f	f	\N	TEAM_GROUP
57	Worker 2 here! Ready to start. 🔧	2025-12-12 17:19:54.430189+00	0	1	COMPLETED	2025-12-12 17:19:53.611338+00	2025-12-12 17:19:55.208012+00	56	58	113	\N	f	f	\N	TEAM_GROUP
58	Worker 2 here! Ready to start. 🔧	2025-12-12 17:20:28.675721+00	0	1	COMPLETED	2025-12-12 17:20:27.842994+00	2025-12-12 17:20:29.456537+00	56	58	114	\N	f	f	\N	TEAM_GROUP
59	Hello team! This is the client. Looking forward to working with everyone! 👋	2025-12-12 20:19:12.169964+00	0	3	ACTIVE	2025-12-12 17:27:29.277901+00	2025-12-12 20:19:12.175915+00	3	3	115	\N	f	f	\N	TEAM_GROUP
60	Team job 'Conversation Test 1765562710' has started! Team members: Worker3 Test, Worker1 Test, Worke	2025-12-12 18:05:11.633563+00	0	1	ACTIVE	2025-12-12 18:05:11.617642+00	2025-12-12 18:05:11.63582+00	41	41	118	\N	f	f	\N	TEAM_GROUP
61	Team job 'Conversation Test 1765562817' has started! Team members: Worker3 Test, Worker1 Test, Worke	2025-12-12 18:06:58.505544+00	0	1	ACTIVE	2025-12-12 18:06:58.487078+00	2025-12-12 18:06:58.507297+00	41	41	119	\N	f	f	\N	TEAM_GROUP
65	Team job 'Home Renovation TEST 1765572326' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-12 20:45:27.239193+00	0	1	COMPLETED	2025-12-12 20:45:27.224036+00	2025-12-12 20:45:27.525332+00	41	41	130	\N	f	f	\N	TEAM_GROUP
66	Team job 'Home Renovation TEST 1765572564' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-12 20:49:25.273157+00	0	1	COMPLETED	2025-12-12 20:49:25.256139+00	2025-12-12 20:49:25.54966+00	41	41	131	\N	f	f	\N	TEAM_GROUP
67	Team job 'Home Renovation TEST 1765572604' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-12 20:50:06.01874+00	0	1	COMPLETED	2025-12-12 20:50:06.004445+00	2025-12-12 20:50:06.477491+00	41	41	132	\N	f	f	\N	TEAM_GROUP
62	Hi everyone! testworker2_team here. Ready to start work! 🔧	2025-12-12 20:21:29.663803+00	0	2	ACTIVE	2025-12-12 20:21:29.352188+00	2025-12-12 20:21:29.668594+00	3	43	122	\N	f	f	\N	TEAM_GROUP
63	Hi everyone! testworker2_team here. Ready to start work! 🔧	2025-12-12 20:22:13.08521+00	0	2	COMPLETED	2025-12-12 20:22:12.773814+00	2025-12-12 20:22:13.445866+00	3	43	123	\N	f	f	\N	TEAM_GROUP
99	Team job 'Home Renovation TEST 1765594288' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-13 02:51:29.353023+00	0	1	COMPLETED	2025-12-13 02:51:29.338093+00	2025-12-13 02:51:29.790392+00	41	41	164	\N	f	f	\N	TEAM_GROUP
100	Team job 'Home Renovation TEST 1765594419' has started! Team members: Worker1 Test, Worker3 Test, Wo	2025-12-13 02:53:40.373138+00	0	1	COMPLETED	2025-12-13 02:53:40.359715+00	2025-12-13 02:53:40.805381+00	41	41	165	\N	f	f	\N	TEAM_GROUP
11	Thanks for the opporutnity	2025-11-30 11:01:12.589402+00	0	0	COMPLETED	2025-11-30 10:58:12.850789+00	2025-11-30 11:01:12.703793+00	3	2	46	2	f	f	\N	ONE_ON_ONE
102	\N	\N	0	0	ACTIVE	2025-12-16 02:11:24.737675+00	2025-12-16 02:11:24.737684+00	41	\N	117	\N	f	f	\N	TEAM_GROUP
103	Start?	2025-12-16 03:24:52.577854+00	0	0	COMPLETED	2025-12-16 02:29:09.356888+00	2025-12-16 04:46:12.270885+00	3	2	166	\N	f	f	\N	TEAM_GROUP
101	i will fix it biy	2025-12-13 04:37:27.442417+00	0	0	COMPLETED	2025-12-13 04:36:58.747373+00	2025-12-13 04:38:02.272091+00	3	2	77	2	f	f	\N	ONE_ON_ONE
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.conversation_participants ("participantID", participant_type, unread_count, is_archived, joined_at, last_read_at, conversation_id, profile_id, skill_slot_id) FROM stdin;
1	CLIENT	0	f	2025-12-10 17:03:53.261385+00	\N	14	41	\N
2	CLIENT	0	f	2025-12-10 17:04:57.555776+00	\N	15	41	\N
3	CLIENT	0	f	2025-12-10 17:05:58.488532+00	\N	16	41	\N
4	CLIENT	0	f	2025-12-10 17:07:11.703604+00	\N	17	41	\N
5	CLIENT	0	f	2025-12-10 17:08:05.462951+00	\N	18	41	\N
6	CLIENT	0	f	2025-12-10 17:08:48.839979+00	\N	19	41	\N
7	CLIENT	0	f	2025-12-10 17:09:50.922704+00	\N	20	41	\N
8	CLIENT	0	f	2025-12-10 17:10:52.981155+00	\N	21	41	\N
9	CLIENT	0	f	2025-12-10 17:17:40.32413+00	\N	22	41	\N
10	CLIENT	0	f	2025-12-10 17:19:44.413017+00	\N	23	41	\N
11	CLIENT	0	f	2025-12-10 17:31:12.678558+00	\N	24	41	\N
12	WORKER	0	f	2025-12-10 17:31:12.934357+00	\N	24	43	28
13	WORKER	0	f	2025-12-10 17:31:12.996139+00	\N	24	42	27
14	CLIENT	0	f	2025-12-10 17:33:44.203169+00	\N	25	41	\N
15	WORKER	0	f	2025-12-10 17:33:44.440535+00	\N	25	43	30
16	WORKER	0	f	2025-12-10 17:33:44.501754+00	\N	25	42	29
17	CLIENT	0	f	2025-12-10 17:34:07.262896+00	\N	26	41	\N
18	WORKER	0	f	2025-12-10 17:34:07.540366+00	\N	26	43	32
19	WORKER	0	f	2025-12-10 17:34:07.610131+00	\N	26	42	31
20	CLIENT	0	f	2025-12-10 17:36:08.88744+00	\N	27	41	\N
21	WORKER	0	f	2025-12-10 17:36:09.128319+00	\N	27	43	34
22	WORKER	0	f	2025-12-10 17:36:09.191905+00	\N	27	42	33
23	CLIENT	0	f	2025-12-10 17:44:32.948394+00	\N	28	41	\N
24	CLIENT	0	f	2025-12-10 17:45:08.351972+00	\N	29	41	\N
25	WORKER	0	f	2025-12-10 17:45:08.632378+00	\N	29	42	37
26	WORKER	0	f	2025-12-10 17:45:08.732193+00	\N	29	40	38
27	CLIENT	0	f	2025-12-10 17:48:24.762248+00	\N	30	41	\N
28	WORKER	0	f	2025-12-10 17:48:25.019959+00	\N	30	42	39
29	WORKER	0	f	2025-12-10 17:48:25.086266+00	\N	30	40	40
30	CLIENT	0	f	2025-12-10 17:58:19.75193+00	\N	31	41	\N
31	WORKER	0	f	2025-12-10 17:58:20.048255+00	\N	31	42	41
32	WORKER	0	f	2025-12-10 17:58:20.121511+00	\N	31	40	42
33	CLIENT	0	f	2025-12-10 17:59:29.703805+00	\N	32	41	\N
34	WORKER	0	f	2025-12-10 17:59:29.97969+00	\N	32	42	43
35	WORKER	0	f	2025-12-10 17:59:30.098669+00	\N	32	40	44
36	CLIENT	0	f	2025-12-11 18:26:08.972396+00	\N	34	47	\N
37	CLIENT	0	f	2025-12-12 04:29:58.739773+00	\N	35	41	\N
38	WORKER	0	f	2025-12-12 04:29:59.029274+00	\N	35	43	47
39	WORKER	0	f	2025-12-12 04:29:59.095265+00	\N	35	42	46
40	CLIENT	0	f	2025-12-12 05:04:24.149962+00	\N	36	41	\N
41	CLIENT	0	f	2025-12-12 09:06:53.57014+00	\N	37	45	\N
42	CLIENT	0	f	2025-12-12 09:12:42.326549+00	\N	38	45	\N
43	CLIENT	0	f	2025-12-12 09:13:58.282842+00	\N	39	45	\N
44	CLIENT	0	f	2025-12-12 09:14:43.924351+00	\N	40	45	\N
45	WORKER	0	f	2025-12-12 09:14:44.360183+00	\N	40	44	55
46	CLIENT	0	f	2025-12-12 09:17:52.273792+00	\N	41	45	\N
47	WORKER	0	f	2025-12-12 09:17:53.259724+00	\N	41	44	57
48	WORKER	0	f	2025-12-12 09:17:53.317383+00	\N	41	42	57
49	WORKER	0	f	2025-12-12 09:17:53.37634+00	\N	41	43	58
50	CLIENT	0	f	2025-12-12 09:19:04.136592+00	\N	42	45	\N
51	WORKER	0	f	2025-12-12 09:19:05.16163+00	\N	42	44	59
52	WORKER	0	f	2025-12-12 09:19:05.228446+00	\N	42	42	59
53	WORKER	0	f	2025-12-12 09:19:05.298948+00	\N	42	43	60
54	CLIENT	0	f	2025-12-12 09:19:56.437816+00	\N	43	45	\N
55	WORKER	0	f	2025-12-12 09:19:57.420223+00	\N	43	44	61
56	WORKER	0	f	2025-12-12 09:19:57.478279+00	\N	43	42	61
57	WORKER	0	f	2025-12-12 09:19:57.535808+00	\N	43	43	62
58	CLIENT	0	f	2025-12-12 09:24:09.667858+00	\N	44	45	\N
59	WORKER	0	f	2025-12-12 09:24:10.126685+00	\N	44	44	63
60	CLIENT	0	f	2025-12-12 15:36:04.97018+00	\N	45	41	\N
61	WORKER	0	f	2025-12-12 15:37:57.29469+00	\N	45	40	65
63	CLIENT	0	f	2025-12-12 17:04:03.628912+00	\N	47	56	\N
64	CLIENT	0	f	2025-12-12 17:06:38.366157+00	\N	48	56	\N
65	WORKER	0	f	2025-12-12 17:06:38.68085+00	\N	48	59	70
66	WORKER	0	f	2025-12-12 17:06:38.752981+00	\N	48	58	71
67	CLIENT	0	f	2025-12-12 17:06:42.569706+00	\N	49	56	\N
68	WORKER	0	f	2025-12-12 17:06:42.921992+00	\N	49	59	72
69	WORKER	0	f	2025-12-12 17:06:42.987669+00	\N	49	58	73
70	CLIENT	0	f	2025-12-12 17:08:21.68441+00	\N	50	56	\N
71	WORKER	0	f	2025-12-12 17:08:22.010617+00	\N	50	59	74
72	WORKER	0	f	2025-12-12 17:08:22.084234+00	\N	50	58	75
73	CLIENT	0	f	2025-12-12 17:09:24.479502+00	\N	51	56	\N
74	WORKER	0	f	2025-12-12 17:09:24.800418+00	\N	51	59	76
75	WORKER	0	f	2025-12-12 17:09:24.867346+00	\N	51	58	77
76	CLIENT	0	f	2025-12-12 17:10:29.781034+00	\N	52	56	\N
77	WORKER	0	f	2025-12-12 17:10:30.095214+00	\N	52	59	78
78	WORKER	0	f	2025-12-12 17:10:30.159886+00	\N	52	58	79
79	CLIENT	0	f	2025-12-12 17:11:35.76222+00	\N	53	56	\N
80	WORKER	0	f	2025-12-12 17:11:36.072414+00	\N	53	59	80
81	WORKER	0	f	2025-12-12 17:11:36.136323+00	\N	53	58	81
82	CLIENT	0	f	2025-12-12 17:12:08.681916+00	\N	54	56	\N
83	WORKER	0	f	2025-12-12 17:12:08.986062+00	\N	54	59	82
84	WORKER	0	f	2025-12-12 17:12:09.049382+00	\N	54	58	83
85	CLIENT	0	f	2025-12-12 17:12:56.561042+00	\N	55	56	\N
86	WORKER	0	f	2025-12-12 17:12:56.856944+00	\N	55	59	84
87	WORKER	0	f	2025-12-12 17:12:56.921012+00	\N	55	58	85
88	CLIENT	0	f	2025-12-12 17:14:42.660842+00	\N	56	56	\N
89	WORKER	0	f	2025-12-12 17:14:42.978537+00	\N	56	59	86
90	WORKER	0	f	2025-12-12 17:14:43.040674+00	\N	56	58	87
91	CLIENT	0	f	2025-12-12 17:19:53.612618+00	\N	57	56	\N
92	WORKER	0	f	2025-12-12 17:19:53.920583+00	\N	57	59	88
93	WORKER	0	f	2025-12-12 17:19:53.988731+00	\N	57	58	89
94	CLIENT	0	f	2025-12-12 17:20:27.84403+00	\N	58	56	\N
95	WORKER	0	f	2025-12-12 17:20:28.138934+00	\N	58	59	90
96	WORKER	0	f	2025-12-12 17:20:28.202882+00	\N	58	58	91
97	CLIENT	0	f	2025-12-12 17:27:29.279814+00	\N	59	3	\N
98	CLIENT	0	f	2025-12-12 18:05:11.619184+00	\N	60	41	\N
99	WORKER	0	f	2025-12-12 18:05:11.62821+00	\N	60	40	97
100	WORKER	0	f	2025-12-12 18:05:11.629973+00	\N	60	42	97
101	WORKER	0	f	2025-12-12 18:05:11.631751+00	\N	60	43	98
102	CLIENT	0	f	2025-12-12 18:06:58.488032+00	\N	61	41	\N
103	WORKER	0	f	2025-12-12 18:06:58.498992+00	\N	61	40	99
104	WORKER	0	f	2025-12-12 18:06:58.50205+00	\N	61	42	99
105	WORKER	0	f	2025-12-12 18:06:58.504498+00	\N	61	43	100
106	CLIENT	0	f	2025-12-12 20:21:29.353628+00	\N	62	3	\N
107	WORKER	0	f	2025-12-12 20:21:29.364426+00	\N	62	43	105
108	WORKER	0	f	2025-12-12 20:21:29.366259+00	\N	62	42	105
109	WORKER	0	f	2025-12-12 20:21:29.367815+00	\N	62	40	106
110	CLIENT	0	f	2025-12-12 20:22:12.775147+00	\N	63	3	\N
111	WORKER	0	f	2025-12-12 20:22:12.784263+00	\N	63	43	107
112	WORKER	0	f	2025-12-12 20:22:12.786011+00	\N	63	42	107
113	WORKER	0	f	2025-12-12 20:22:12.787779+00	\N	63	40	108
114	CLIENT	0	f	2025-12-12 20:42:22.427029+00	\N	64	41	\N
115	WORKER	0	f	2025-12-12 20:42:22.436637+00	\N	64	42	119
116	WORKER	0	f	2025-12-12 20:42:22.438423+00	\N	64	40	119
117	WORKER	0	f	2025-12-12 20:42:22.440156+00	\N	64	43	120
118	CLIENT	0	f	2025-12-12 20:45:27.225293+00	\N	65	41	\N
119	WORKER	0	f	2025-12-12 20:45:27.234566+00	\N	65	42	121
120	WORKER	0	f	2025-12-12 20:45:27.236839+00	\N	65	40	121
121	WORKER	0	f	2025-12-12 20:45:27.238519+00	\N	65	43	122
122	CLIENT	0	f	2025-12-12 20:49:25.258065+00	\N	66	41	\N
123	WORKER	0	f	2025-12-12 20:49:25.268487+00	\N	66	42	123
124	WORKER	0	f	2025-12-12 20:49:25.270532+00	\N	66	40	123
125	WORKER	0	f	2025-12-12 20:49:25.272242+00	\N	66	43	124
126	CLIENT	0	f	2025-12-12 20:50:06.005418+00	\N	67	41	\N
127	WORKER	0	f	2025-12-12 20:50:06.014376+00	\N	67	42	125
128	WORKER	0	f	2025-12-12 20:50:06.01619+00	\N	67	40	125
129	WORKER	0	f	2025-12-12 20:50:06.017974+00	\N	67	43	126
155	CLIENT	0	f	2025-12-13 02:51:29.339578+00	\N	99	41	\N
156	WORKER	0	f	2025-12-13 02:51:29.34919+00	\N	99	42	156
157	WORKER	0	f	2025-12-13 02:51:29.350704+00	\N	99	40	156
158	WORKER	0	f	2025-12-13 02:51:29.35221+00	\N	99	43	157
159	CLIENT	0	f	2025-12-13 02:53:40.360587+00	\N	100	41	\N
160	WORKER	0	f	2025-12-13 02:53:40.369257+00	\N	100	42	158
161	WORKER	0	f	2025-12-13 02:53:40.370778+00	\N	100	40	158
162	WORKER	0	f	2025-12-13 02:53:40.372371+00	\N	100	43	159
163	CLIENT	0	f	2025-12-16 02:11:55.209934+00	\N	102	41	\N
164	WORKER	0	f	2025-12-16 02:11:55.230387+00	\N	102	21	95
165	WORKER	0	f	2025-12-16 02:11:55.235566+00	\N	102	62	95
166	WORKER	0	f	2025-12-16 02:11:55.240116+00	\N	102	2	96
167	CLIENT	0	f	2025-12-16 02:29:09.358176+00	\N	103	3	\N
168	WORKER	0	f	2025-12-16 02:29:09.366102+00	\N	103	21	160
169	WORKER	0	f	2025-12-16 02:29:09.36781+00	\N	103	2	160
\.


--
-- Data for Name: dispute_evidence; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.dispute_evidence ("evidenceID", "imageURL", description, "createdAt", "disputeID_id", "uploadedBy_id") FROM stdin;
4	/media/iayos_files/disputes/dispute_4/backjob_4_0_20251202_014133.jpg	Evidence image 1	2025-12-02 01:41:33.047669+00	4	7
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	contenttypes	contenttype
5	sessions	session
6	accounts	specializations
7	accounts	accounts
8	accounts	agency
9	accounts	profile
10	accounts	clientprofile
11	accounts	interestedjobs
12	accounts	workerprofile
13	accounts	workerspecialization
14	account	emailaddress
15	account	emailconfirmation
16	socialaccount	socialaccount
17	socialaccount	socialapp
18	socialaccount	socialtoken
19	adminpanel	systemroles
20	accounts	kycfiles
21	accounts	kyc
22	adminpanel	kyclogs
23	accounts	notification
24	accounts	jobposting
25	accounts	jobpostingphoto
26	accounts	conversation
27	accounts	message
28	accounts	messageattachment
29	accounts	wallet
30	accounts	transaction
31	accounts	workerproduct
32	profiles	workerproduct
33	agency	agencykycfile
34	agency	agencykyc
35	agency	agencyemployee
36	accounts	job
37	accounts	joblog
38	accounts	jobphoto
39	accounts	jobapplication
40	accounts	jobdispute
41	accounts	jobreview
42	profiles	conversation
43	profiles	message
44	profiles	messageattachment
45	accounts	agencyjobrequest
46	accounts	workercertification
47	accounts	workerportfolio
48	accounts	notificationsettings
49	accounts	pushtoken
50	accounts	barangay
51	accounts	city
52	accounts	workermaterial
53	accounts	userpaymentmethod
54	accounts	jobemployeeassignment
55	adminpanel	faq
56	adminpanel	cannedresponse
57	adminpanel	supportticket
58	adminpanel	supportticketreply
59	adminpanel	userreport
60	adminpanel	auditlog
61	adminpanel	platformsettings
62	adminpanel	adminaccount
63	accounts	disputeevidence
64	accounts	reviewskilltag
65	adminpanel	certificationlog
66	accounts	jobskillslot
67	accounts	jobworkerassignment
68	profiles	conversationparticipant
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2025-09-29 16:13:00.882297+00
2	contenttypes	0002_remove_content_type_name	2025-09-29 16:13:01.231077+00
3	auth	0001_initial	2025-09-29 16:13:02.236299+00
4	auth	0002_alter_permission_name_max_length	2025-09-29 16:13:02.423239+00
5	auth	0003_alter_user_email_max_length	2025-09-29 16:13:02.552634+00
6	auth	0004_alter_user_username_opts	2025-09-29 16:13:02.737421+00
7	auth	0005_alter_user_last_login_null	2025-09-29 16:13:02.92246+00
8	auth	0006_require_contenttypes_0002	2025-09-29 16:13:03.107909+00
9	auth	0007_alter_validators_add_error_messages	2025-09-29 16:13:03.293065+00
10	auth	0008_alter_user_username_max_length	2025-09-29 16:13:03.477578+00
11	auth	0009_alter_user_last_name_max_length	2025-09-29 16:13:03.662741+00
12	auth	0010_alter_group_name_max_length	2025-09-29 16:13:03.969941+00
13	auth	0011_update_proxy_permissions	2025-09-29 16:13:04.094817+00
14	auth	0012_alter_user_first_name_max_length	2025-09-29 16:13:04.279721+00
15	accounts	0001_initial	2025-09-29 16:13:06.745604+00
16	admin	0001_initial	2025-09-29 16:13:07.249067+00
17	admin	0002_logentry_remove_auto_add	2025-09-29 16:13:07.315486+00
18	admin	0003_logentry_add_action_flag_choices	2025-09-29 16:13:07.503587+00
19	sessions	0001_initial	2025-09-29 16:13:07.999801+00
20	account	0001_initial	2025-09-30 07:55:41.956397+00
21	account	0002_email_max_length	2025-09-30 07:55:42.149735+00
22	account	0003_alter_emailaddress_create_unique_verified_email	2025-09-30 07:55:42.458273+00
23	account	0004_alter_emailaddress_drop_unique_email	2025-09-30 07:55:42.927665+00
24	account	0005_emailaddress_idx_upper_email	2025-09-30 07:55:43.174845+00
25	account	0006_emailaddress_lower	2025-09-30 07:55:43.485078+00
26	account	0007_emailaddress_idx_email	2025-09-30 07:55:43.854766+00
27	account	0008_emailaddress_unique_primary_email_fixup	2025-09-30 07:55:44.104109+00
28	account	0009_emailaddress_unique_primary_email	2025-09-30 07:55:44.347148+00
29	socialaccount	0001_initial	2025-09-30 07:55:45.287716+00
30	socialaccount	0002_token_max_lengths	2025-09-30 07:55:45.597435+00
31	socialaccount	0003_extra_data_default_dict	2025-09-30 07:55:45.72315+00
32	socialaccount	0004_app_provider_id_settings	2025-09-30 07:55:46.272057+00
33	socialaccount	0005_socialtoken_nullable_app	2025-09-30 07:55:46.758701+00
34	socialaccount	0006_alter_socialaccount_extra_data	2025-09-30 07:55:47.009128+00
35	adminpanel	0001_initial	2025-09-30 09:03:47.723596+00
36	accounts	0002_accounts_city_accounts_country_accounts_postal_code_and_more	2025-10-04 04:41:29.791244+00
37	accounts	0003_alter_agency_accountfk_kyc_kycfiles	2025-10-04 12:17:06.664277+00
38	accounts	0004_alter_kycfiles_idtype	2025-10-06 04:22:27.471611+00
39	accounts	0005_remove_kycfiles_filetype	2025-10-06 04:35:18.139202+00
40	accounts	0006_accounts_kycverified	2025-10-06 11:43:49.438748+00
41	adminpanel	0002_kyclogs	2025-10-06 12:06:27.735874+00
42	adminpanel	0003_alter_kyclogs_kycid	2025-10-06 12:38:08.760151+00
43	adminpanel	0004_rename_logid_kyclogs_kyclogid_and_more	2025-10-06 12:38:09.531317+00
44	accounts	0007_notification	2025-10-07 11:52:14.631888+00
45	accounts	0008_profile_latitude_profile_location_sharing_enabled_and_more	2025-10-10 03:52:43.227726+00
46	accounts	0009_alter_profile_profileimg	2025-10-13 16:32:42.931809+00
47	accounts	0010_jobposting_jobpostingphoto_and_more	2025-10-18 15:35:43.881511+00
48	accounts	0011_conversation_message_messageattachment_and_more	2025-10-18 15:41:40.523751+00
49	accounts	0012_wallet_transaction_and_more	2025-10-18 15:44:41.246201+00
50	accounts	0013_transaction_invoiceurl_transaction_xenditexternalid_and_more	2025-10-18 15:59:25.797054+00
51	accounts	0014_workerproduct	2025-10-20 02:12:32.817713+00
52	accounts	0015_alter_workerproduct_options_and_more	2025-10-20 02:12:34.676242+00
53	profiles	0001_initial	2025-10-20 02:12:35.527594+00
54	accounts	0016_delete_workerproduct	2025-10-20 05:48:20.044815+00
55	profiles	0002_alter_workerproduct_options_and_more	2025-10-20 05:48:20.445196+00
56	agency	0001_initial	2025-10-20 13:01:37.14551+00
57	agency	0002_remove_agencykycsubmission_agency_and_more	2025-10-20 13:01:39.417306+00
58	agency	0001_drop_old_kyc_tables	2025-10-21 13:55:23.721854+00
59	adminpanel	0005_kyclogs_kyctype	2025-10-22 04:35:00.641097+00
60	agency	0002_agencyemployee	2025-10-30 04:45:49.582085+00
61	accounts	0017_agency_contactnumber	2025-10-30 05:54:24.024301+00
62	accounts	0018_rename_job_models	2025-10-30 06:20:01.265739+00
63	accounts	0019_jobapplication	2025-10-30 09:00:27.102777+00
64	accounts	0020_specializations_averageprojectcostmax_and_more	2025-10-30 10:20:04.650501+00
65	accounts	0021_jobdispute	2025-10-30 10:39:36.337647+00
66	accounts	0022_jobreview	2025-10-30 10:46:08.941404+00
67	accounts	0023_remove_message_conversationid_remove_message_sender_and_more	2025-11-01 10:38:11.831396+00
68	profiles	0003_conversation_message_messageattachment_and_more	2025-11-01 10:38:13.925146+00
69	accounts	0024_alter_job_status	2025-11-03 18:42:59.321256+00
70	accounts	0025_job_clientmarkedcomplete_job_clientmarkedcompleteat_and_more	2025-11-04 03:39:50.639895+00
71	accounts	0026_add_escrow_fields_to_job	2025-11-05 14:20:31.955077+00
72	accounts	0027_add_remaining_payment_tracking	2025-11-05 16:46:07.049793+00
73	profiles	0004_add_archive_flags_to_conversation	2025-11-05 17:09:09.701159+00
74	accounts	0028_add_payment_method_tracking	2025-11-05 19:25:01.79255+00
75	accounts	0029_alter_job_cashpaymentapproved_and_more	2025-11-06 04:59:21.853548+00
76	accounts	0002_notification_updates	2025-11-09 20:48:07.702694+00
77	accounts	0030_merge_20251110_0447	2025-11-09 20:48:07.849391+00
78	accounts	0031_add_account_type	2025-11-10 20:37:09.936502+00
79	accounts	0032_add_agency_acceptance_fields	2025-11-10 20:37:10.482564+00
80	accounts	0033_alter_profile_profileimg	2025-11-10 22:21:23.016076+00
81	accounts	0034_remove_accounts_accounttype_and_more	2025-11-10 22:43:52.069513+00
82	accounts	0035_remove_job_agenciesonly_remove_job_agenciespreferred_and_more	2025-11-10 22:53:46.658414+00
83	accounts	0036_job_inviterejectionreason_job_inviterespondedat_and_more	2025-11-11 18:13:51.129643+00
84	agency	0003_agencyemployee_employeeofthemonth_and_more	2025-11-11 20:55:41.139091+00
85	accounts	0037_worker_phase1_profile_enhancements	2025-11-13 11:15:19.828027+00
86	accounts	0038_rename_worker_cert_worker_date_idx_worker_cert_workeri_6b96e2_idx_and_more	2025-11-13 11:15:20.238367+00
87	accounts	0039_rename_kycstatus_kyc_kyc_status_and_more	2025-11-13 12:45:13.594758+00
88	accounts	0040_alter_workerprofile_description_and_more	2025-11-13 12:47:31.400057+00
89	accounts	0041_notificationsettings_pushtoken	2025-11-15 20:40:23.427917+00
90	accounts	0042_add_city_barangay_models	2025-11-19 10:28:47.087087+00
91	accounts	0043_workermaterial	2025-11-23 03:32:35.242767+00
92	accounts	0044_workermaterial_quantity	2025-11-23 05:21:02.224996+00
93	accounts	0045_job_clientconfirmedworkstarted_and_more	2025-11-23 13:04:17.798175+00
94	accounts	0046_accounts_banned_at_accounts_banned_by_and_more	2025-11-24 02:15:07.497435+00
95	accounts	0038_job_assigned_employee_tracking	2025-11-25 06:17:14.879772+00
96	accounts	0047_merge_20251125_0616	2025-11-25 06:17:14.94884+00
97	accounts	0048_userpaymentmethod_and_more	2025-11-26 02:00:02.57164+00
98	accounts	0049_job_assignedemployeeid_job_assignmentnotes_and_more	2025-11-26 08:21:17.360862+00
99	profiles	0005_add_agency_to_conversation	2025-11-30 03:11:35.928168+00
100	profiles	0006_add_sender_agency_to_message	2025-11-30 03:16:37.079829+00
101	accounts	0050_agency_job_review_fields	2025-11-30 05:33:14.642126+00
102	accounts	0051_multi_employee_assignment	2025-11-30 07:26:42.880238+00
103	accounts	0052_rename_job_employe_job_id_f1c2e3_idx_job_employe_job_id_2d7113_idx_and_more	2025-11-30 07:45:35.498243+00
104	accounts	0053_kyc_enhancements	2025-11-30 11:40:25.740333+00
105	agency	0004_kyc_enhancements	2025-11-30 11:40:27.307139+00
106	adminpanel	0006_support_system	2025-11-30 12:20:22.719108+00
107	adminpanel	0007_audit_settings_admin	2025-11-30 12:56:50.51125+00
108	accounts	0054_dispute_evidence	2025-12-01 17:53:03.151323+00
109	accounts	0055_add_activejobscount_to_clientprofile	2025-12-09 10:39:28.342272+00
110	accounts	0056_increase_joblog_status_length	2025-12-09 10:39:28.42382+00
111	accounts	0057_add_reviewee_profile_to_jobreview	2025-12-09 10:39:28.520216+00
112	accounts	0058_add_wallet_reserved_balance	2025-12-09 10:39:28.554912+00
113	accounts	0059_backjob_workflow_tracking	2025-12-09 10:39:28.662888+00
114	accounts	0060_jobdispute_terms_acceptance_tracking	2025-12-09 10:39:28.803393+00
115	adminpanel	0008_alter_auditlog_action	2025-12-09 10:46:44.419651+00
116	accounts	0061_worker_skills_certifications_reviews	2025-12-09 11:22:27.125529+00
117	adminpanel	0009_certification_verification_logs	2025-12-09 12:47:59.697019+00
118	accounts	0062_multi_criteria_reviews	2025-12-10 14:14:39.154559+00
119	accounts	0063_team_mode_multi_skill_workers	2025-12-10 15:55:32.070911+00
120	accounts	0064_rename_job_app_skill_slot_status_idx_job_applica_applied_237261_idx_and_more	2025-12-10 15:55:32.242407+00
121	adminpanel	0010_rename_certificati_certifi_idx_certificati_certifi_eead3c_idx_and_more	2025-12-10 15:55:32.46376+00
122	profiles	0007_team_conversation_support	2025-12-10 15:55:32.630737+00
123	profiles	0008_remove_conversation_conv_type_status_idx_and_more	2025-12-10 15:55:32.690437+00
124	accounts	0065_payment_buffer_system	2025-12-10 19:02:36.760542+00
125	accounts	0066_job_universal_fields	2025-12-11 14:06:24.659516+00
126	accounts	0067_job_universal_fields	2025-12-11 14:10:01.805012+00
127	accounts	0068_kyc_ai_verification_fields	2025-12-11 17:28:47.432527+00
128	accounts	0069_remove_job_job_payment_release_idx_and_more	2025-12-11 17:29:14.470225+00
129	accounts	0070_kyc_notes_to_textfield	2025-12-12 06:01:44.469001+00
130	accounts	0071_workermaterial_category	2025-12-12 13:32:34.862733+00
131	accounts	0072_certification_skill_cascade	2025-12-13 06:16:11.874405+00
132	accounts	0073_add_soft_skills_field	2025-12-14 14:02:26.321592+00
133	accounts	0074_alter_workercertification_specializationid	2025-12-15 02:44:33.680925+00
134	accounts	0075_team_worker_arrival_tracking	2025-12-16 03:33:37.306493+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
67dj9gv9zs34v08zv9q9q88yx8x54hmz	.eJytzcEKgjAYAOB3-c8ibm1terMogkLoEAUhsua01XKi0xDx3RN6Bc_f4RuhtVILI6S0XeWy1gmnWohGqHbN5Vavt8kgHOsfX4juI9SNlaqdHYwtdQUe5MIJiKrOGA_qt1SZtLnKetXoQqvmL5OHGA0xRpgxf4UJZ8Eq9eC4-VyR6qyVKN6Xp8MiA6d-wDGljMxD8hpMLMUZD-xZlLlYYiAB8XGIOA3DdJp-bpZo5Q:1v3Vqm:tzknnLjmXakuEPvF1v9nlOtrqaiM1wUTTOUlL9WgZMA	2025-10-14 08:36:44.292211+00
d3qfqbvionygdl0scf2hipgnv7cuv6nj	.eJylzc8KgjAcAOB3-Z2H7I9bzlu3ICiLDmGIjLliNZxsUwPx3Qt6hM7f4Vsgem2VU1r7sU9tTCqZCOUC5srz-kjpMz_V78lhKG8LDMFrE78Ozj9sDwg6lRSU_egcguGlTat9Z9rJBHu3JvxkRWQjqMSSMp4xUQiCSYNg7vYhrw5bbc7VeNnN_w6MYSYlzQQlBee8WdcPmVxIxQ:1vKduy:ofyNN7C0i4cPDcIl39Og3J6W1nXjTsYDINolmwRXMOA	2025-11-30 14:39:52.625017+00
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_applications ("applicationID", "proposalMessage", "proposedBudget", "estimatedDuration", "budgetOption", status, "createdAt", "updatedAt", "jobID_id", "workerID_id", applied_skill_slot_id) FROM stdin;
2	I can do it i fix tables for a living	250.00		NEGOTIATE	ACCEPTED	2025-11-03 11:32:05.69898+00	2025-11-03 11:32:20.411814+00	4	2	\N
3	EZ	500.00		ACCEPT	ACCEPTED	2025-11-05 18:58:01.455194+00	2025-11-05 18:58:40.674637+00	6	2	\N
4	HEYYY	7750.00		ACCEPT	ACCEPTED	2025-11-06 03:38:52.978007+00	2025-11-06 03:39:12.886681+00	10	2	\N
5	MINE	399.98		ACCEPT	ACCEPTED	2025-11-09 20:38:05.404137+00	2025-11-09 20:38:40.69459+00	12	2	\N
19	Direct hire by client	1000.00	As discussed	ACCEPT	ACCEPTED	2025-11-19 16:26:28.877733+00	2025-11-19 16:26:28.877762+00	29	2	\N
23	Direct hire by client	500.00	KSOXJENENW	ACCEPT	ACCEPTED	2025-11-23 10:05:28.694401+00	2025-11-23 10:05:28.694413+00	33	2	\N
24	Direct hire by client	500.00	KSOXJENENW	ACCEPT	ACCEPTED	2025-11-23 10:06:12.293515+00	2025-11-23 10:06:12.293527+00	34	2	\N
26	Hey raise the thing to 100	600.00		NEGOTIATE	ACCEPTED	2025-11-23 12:03:47.055521+00	2025-11-23 12:04:59.408241+00	7	2	\N
27	Direct hire by client	500.00	As discussed	ACCEPT	ACCEPTED	2025-11-30 10:56:35.789435+00	2025-11-30 10:56:35.789453+00	46	2	\N
28	I am a professional worker and can complete this job efficiently. I have experience in this field.	0.00		ACCEPT	ACCEPTED	2025-12-10 15:03:42.131363+00	2025-12-10 15:04:19.064923+00	51	8	\N
29	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:05:58.579468+00	2025-12-10 17:05:58.579478+00	57	10	11
30	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:05:58.627382+00	2025-12-10 17:05:58.627393+00	57	11	12
31	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:07:11.798639+00	2025-12-10 17:07:11.798649+00	58	10	13
32	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:07:11.848014+00	2025-12-10 17:07:11.848025+00	58	11	14
33	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:08:05.557973+00	2025-12-10 17:08:05.557983+00	59	10	15
34	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:08:05.604627+00	2025-12-10 17:08:05.604638+00	59	11	16
35	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:08:48.938667+00	2025-12-10 17:08:48.93868+00	60	10	17
36	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:08:48.986512+00	2025-12-10 17:08:48.986525+00	60	11	18
37	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:09:51.038279+00	2025-12-10 17:09:51.03829+00	61	10	19
38	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:09:51.092092+00	2025-12-10 17:09:51.092104+00	61	11	20
39	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:10:53.088152+00	2025-12-10 17:10:53.088161+00	62	10	21
40	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:10:53.13613+00	2025-12-10 17:10:53.13614+00	62	11	22
41	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:17:40.414933+00	2025-12-10 17:17:40.414944+00	63	10	23
42	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:17:40.461865+00	2025-12-10 17:17:40.461874+00	63	11	24
43	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:19:44.508287+00	2025-12-10 17:19:44.508298+00	64	10	25
44	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	PENDING	2025-12-10 17:19:44.559078+00	2025-12-10 17:19:44.559088+00	64	11	26
46	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:31:12.822899+00	2025-12-10 17:31:12.926443+00	65	11	28
45	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:31:12.773668+00	2025-12-10 17:31:12.988154+00	65	10	27
48	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:33:44.337291+00	2025-12-10 17:33:44.433306+00	66	11	30
47	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:33:44.291646+00	2025-12-10 17:33:44.494641+00	66	10	29
50	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:34:07.423998+00	2025-12-10 17:34:07.531279+00	67	11	32
49	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:34:07.371227+00	2025-12-10 17:34:07.60122+00	67	10	31
52	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:36:09.023371+00	2025-12-10 17:36:09.120221+00	68	11	34
51	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:36:08.977103+00	2025-12-10 17:36:09.184405+00	68	10	33
54	Worker 2 applying for plumbing - will be rejected.	3000.00	\N	ACCEPT	PENDING	2025-12-10 17:45:08.506665+00	2025-12-10 17:45:08.506675+00	70	11	37
53	Worker 1 applying for plumbing work.	3000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:45:08.45357+00	2025-12-10 17:45:08.623138+00	70	10	37
55	Worker 3 applying for electrical work.	4000.00	\N	ACCEPT	ACCEPTED	2025-12-10 17:45:08.557423+00	2025-12-10 17:45:08.717621+00	70	9	38
57	Application from Worker2-Plumbing	3333.34	\N	ACCEPT	PENDING	2025-12-10 17:48:24.901696+00	2025-12-10 17:48:24.901706+00	71	11	39
56	Application from Worker1-Plumbing	3333.34	\N	ACCEPT	ACCEPTED	2025-12-10 17:48:24.854518+00	2025-12-10 17:48:25.012043+00	71	10	39
58	Application from Worker3-Electrical	3333.33	\N	ACCEPT	ACCEPTED	2025-12-10 17:48:24.949812+00	2025-12-10 17:48:25.078392+00	71	9	40
60	Application from Worker2-Plumbing	3333.34	\N	ACCEPT	PENDING	2025-12-10 17:58:19.917539+00	2025-12-10 17:58:19.917623+00	72	11	41
59	Application from Worker1-Plumbing	3333.34	\N	ACCEPT	ACCEPTED	2025-12-10 17:58:19.858529+00	2025-12-10 17:58:20.039507+00	72	10	41
61	Application from Worker3-Electrical	3333.33	\N	ACCEPT	ACCEPTED	2025-12-10 17:58:19.972076+00	2025-12-10 17:58:20.112773+00	72	9	42
62	Application from Worker1-Plumbing	3333.34	\N	ACCEPT	ACCEPTED	2025-12-10 17:59:29.805804+00	2025-12-10 17:59:29.971309+00	73	10	43
63	Application from Worker2-Plumbing	3333.34	\N	ACCEPT	REJECTED	2025-12-10 17:59:29.856899+00	2025-12-10 17:59:30.031107+00	73	11	43
64	Application from Worker3-Electrical	3333.33	\N	ACCEPT	ACCEPTED	2025-12-10 17:59:29.907838+00	2025-12-10 17:59:30.089583+00	73	9	44
65	I am an experienced plumber and can fix this quickly.	1500.00		ACCEPT	ACCEPTED	2025-12-11 16:35:06.71187+00	2025-12-11 16:35:28.678034+00	75	13	\N
67	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 04:29:58.911379+00	2025-12-12 04:29:59.020136+00	78	11	47
66	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 04:29:58.857546+00	2025-12-12 04:29:59.087133+00	78	10	46
68	I have 5 years experience in plumbing and bathroom renovations. I can handle this job efficiently.	6666.67	\N	ACCEPT	ACCEPTED	2025-12-12 09:14:44.290128+00	2025-12-12 09:14:44.352421+00	84	13	55
69	Worker 1 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:17:52.612041+00	2025-12-12 09:17:53.253232+00	85	13	57
70	Worker 2 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:17:52.906061+00	2025-12-12 09:17:53.310597+00	85	10	57
71	Worker 3 - I have extensive experience in Electrical. Ready to start immediately.	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:17:53.199472+00	2025-12-12 09:17:53.369479+00	85	11	58
72	Worker 1 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:04.479097+00	2025-12-12 09:19:05.154582+00	86	13	59
73	Worker 2 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:04.786805+00	2025-12-12 09:19:05.220427+00	86	10	59
74	Worker 3 - I have extensive experience in Electrical. Ready to start immediately.	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:05.095343+00	2025-12-12 09:19:05.290932+00	86	11	60
75	Worker 1 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:56.770758+00	2025-12-12 09:19:57.413592+00	87	13	61
76	Worker 2 - I have extensive experience in Plumbing. Ready to start immediately.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:57.065131+00	2025-12-12 09:19:57.471687+00	87	10	61
77	Worker 3 - I have extensive experience in Electrical. Ready to start immediately.	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:19:57.358237+00	2025-12-12 09:19:57.52936+00	87	11	62
78	Mobile app test application. I have the required experience.	6000.00	\N	ACCEPT	ACCEPTED	2025-12-12 09:24:10.021285+00	2025-12-12 09:24:10.118951+00	88	13	63
79	I have plumbing experience and can help with this job.	225.00	\N	ACCEPT	ACCEPTED	2025-12-12 15:37:43.654295+00	2025-12-12 15:37:57.286878+00	101	9	65
80	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:06:38.463896+00	2025-12-12 17:06:38.463905+00	104	14	71
82	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:06:38.564055+00	2025-12-12 17:06:38.673039+00	104	16	70
81	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:06:38.516315+00	2025-12-12 17:06:38.744467+00	104	15	71
83	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:06:42.685838+00	2025-12-12 17:06:42.685849+00	105	14	73
85	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:06:42.802565+00	2025-12-12 17:06:42.914683+00	105	16	72
84	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:06:42.741642+00	2025-12-12 17:06:42.980285+00	105	15	73
86	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:08:21.784815+00	2025-12-12 17:08:21.784827+00	106	14	75
88	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:08:21.891351+00	2025-12-12 17:08:22.002165+00	106	16	74
87	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:08:21.835599+00	2025-12-12 17:08:22.075945+00	106	15	75
89	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:09:24.57487+00	2025-12-12 17:09:24.574879+00	107	14	77
91	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:09:24.672361+00	2025-12-12 17:09:24.790343+00	107	16	76
90	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:09:24.623856+00	2025-12-12 17:09:24.859221+00	107	15	77
92	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:10:29.879391+00	2025-12-12 17:10:29.879401+00	108	14	79
94	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:10:29.978323+00	2025-12-12 17:10:30.086033+00	108	16	78
93	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:10:29.929988+00	2025-12-12 17:10:30.152234+00	108	15	79
95	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:11:35.85759+00	2025-12-12 17:11:35.857602+00	109	14	81
97	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:11:35.961498+00	2025-12-12 17:11:36.064479+00	109	16	80
96	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:11:35.910641+00	2025-12-12 17:11:36.128405+00	109	15	81
98	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:12:08.779144+00	2025-12-12 17:12:08.779154+00	110	14	83
100	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:12:08.876062+00	2025-12-12 17:12:08.978622+00	110	16	82
99	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:12:08.828651+00	2025-12-12 17:12:09.041617+00	110	15	83
101	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:12:56.652414+00	2025-12-12 17:12:56.652424+00	111	14	85
103	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:12:56.745486+00	2025-12-12 17:12:56.849691+00	111	16	84
102	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:12:56.699423+00	2025-12-12 17:12:56.912979+00	111	15	85
104	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:14:42.76059+00	2025-12-12 17:14:42.7606+00	112	14	87
105	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:14:42.814256+00	2025-12-12 17:14:43.0333+00	112	15	87
106	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:14:42.864124+00	2025-12-12 17:14:42.970197+00	112	16	86
107	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:19:53.70646+00	2025-12-12 17:19:53.70647+00	113	14	89
131	I am testworker3_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:22:12.48682+00	2025-12-12 20:22:12.58992+00	123	9	108
109	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:19:53.802309+00	2025-12-12 17:19:53.913155+00	113	16	88
108	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:19:53.75516+00	2025-12-12 17:19:53.981315+00	113	15	89
110	Worker 1 (testworker1@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	PENDING	2025-12-12 17:20:27.938297+00	2025-12-12 17:20:27.938309+00	114	14	91
130	I am testworker2_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:22:12.385815+00	2025-12-12 20:22:12.65194+00	123	11	107
129	I am testworker1_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:22:12.334678+00	2025-12-12 20:22:12.7112+00	123	10	107
112	Worker 3 (testworker3@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:20:28.032144+00	2025-12-12 17:20:28.13203+00	114	16	90
111	Worker 2 (testworker2@teamtest.com) applying for this position. I have relevant experience and am ready to work.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 17:20:27.986738+00	2025-12-12 17:20:28.196024+00	114	15	91
113	HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAH	140.00		ACCEPT	ACCEPTED	2025-12-12 17:51:12.843798+00	2025-12-12 17:52:05.205502+00	115	2	\N
133	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:38:35.63835+00	2025-12-12 20:38:35.74108+00	127	11	116
115	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:04:04.302894+00	2025-12-12 18:04:04.417229+00	116	11	94
114	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:04:04.240287+00	2025-12-12 18:04:04.479875+00	116	10	93
132	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:38:35.589033+00	2025-12-12 20:38:35.804185+00	127	10	115
118	Worker 3 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:05:11.162884+00	2025-12-12 18:05:11.27354+00	118	9	97
117	Worker 2 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:05:11.109042+00	2025-12-12 18:05:11.335202+00	118	11	98
116	Worker 1 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:05:11.061316+00	2025-12-12 18:05:11.394903+00	118	10	97
135	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:39:32.698011+00	2025-12-12 20:39:32.80359+00	128	11	118
134	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:39:32.649458+00	2025-12-12 20:39:32.867424+00	128	10	117
121	Worker 3 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:06:58.035021+00	2025-12-12 18:06:58.137106+00	119	9	99
120	Worker 2 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:06:57.987097+00	2025-12-12 18:06:58.199764+00	119	11	100
119	Worker 1 applying	3000.00	\N	ACCEPT	ACCEPTED	2025-12-12 18:06:57.936537+00	2025-12-12 18:06:58.265985+00	119	10	99
136	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:39:33.331343+00	2025-12-12 20:39:33.400237+00	128	9	117
124	I am testworker2_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	PENDING	2025-12-12 20:19:11.547309+00	2025-12-12 20:19:11.547321+00	121	11	104
125	I am testworker3_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:19:11.601099+00	2025-12-12 20:19:11.722763+00	121	9	104
123	I am testworker1_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:19:11.492249+00	2025-12-12 20:19:11.850334+00	121	10	103
138	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:42:21.656675+00	2025-12-12 20:42:21.762234+00	129	11	120
137	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:42:21.606928+00	2025-12-12 20:42:21.824083+00	129	10	119
128	I am testworker3_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:21:29.053457+00	2025-12-12 20:21:29.153243+00	122	9	106
127	I am testworker2_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:21:29.005795+00	2025-12-12 20:21:29.218611+00	122	11	105
126	I am testworker1_team and I have extensive experience. Ready to start immediately!	4000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:21:28.955186+00	2025-12-12 20:21:29.282739+00	122	10	105
139	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:42:22.24903+00	2025-12-12 20:42:22.309522+00	129	9	119
141	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:45:26.402822+00	2025-12-12 20:45:26.505559+00	130	11	122
140	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:45:26.353817+00	2025-12-12 20:45:26.568451+00	130	10	121
142	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:45:27.033309+00	2025-12-12 20:45:27.101595+00	130	9	121
144	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:49:24.335392+00	2025-12-12 20:49:24.434502+00	131	11	124
143	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:49:24.287897+00	2025-12-12 20:49:24.496373+00	131	10	123
145	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:49:25.070439+00	2025-12-12 20:49:25.129936+00	131	9	123
147	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:50:05.058773+00	2025-12-12 20:50:05.161738+00	132	11	126
146	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:50:05.007979+00	2025-12-12 20:50:05.224391+00	132	10	125
148	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-12 20:50:05.829691+00	2025-12-12 20:50:05.890184+00	132	9	125
176	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:51:28.269743+00	2025-12-13 02:51:28.533666+00	164	10	156
122	HEYYYYYYYYYYYYYYYYYYYYYYY	250.00		ACCEPT	ACCEPTED	2025-12-12 18:22:00.653508+00	2025-12-13 04:36:58.71181+00	77	2	\N
177	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:51:28.325523+00	2025-12-13 02:51:28.469306+00	164	11	157
178	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:51:29.162989+00	2025-12-13 02:51:29.222391+00	164	9	156
180	Worker 2 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:53:39.462643+00	2025-12-13 02:53:39.558848+00	165	11	159
179	Worker 1 applying for this position. I have relevant experience.	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:53:39.416695+00	2025-12-13 02:53:39.615367+00	165	10	158
181	Worker 3 applying to complete the plumbing team. Experienced plumber ready to work!	5000.00	\N	ACCEPT	ACCEPTED	2025-12-13 02:53:40.194763+00	2025-12-13 02:53:40.251637+00	165	9	158
182	Hi, i can donthis	3000.00	\N	ACCEPT	ACCEPTED	2025-12-16 01:26:28.427219+00	2025-12-16 01:49:31.568957+00	117	5	95
183	great	3000.00	\N	ACCEPT	ACCEPTED	2025-12-16 01:28:55.460261+00	2025-12-16 01:49:37.478668+00	117	2	96
184	i need the job	3000.00	\N	ACCEPT	ACCEPTED	2025-12-16 01:41:08.275885+00	2025-12-16 01:49:41.52357+00	117	18	95
186	Perfect	5060.00	\N	ACCEPT	ACCEPTED	2025-12-16 02:28:42.788874+00	2025-12-16 02:29:06.837579+00	166	5	160
185	This works perfectly	5060.00	\N	ACCEPT	ACCEPTED	2025-12-16 02:28:10.698638+00	2025-12-16 02:29:09.345677+00	166	2	160
\.


--
-- Data for Name: job_disputes; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_disputes ("disputeID", "disputedBy", reason, description, status, priority, "jobAmount", "disputedAmount", resolution, "resolvedDate", "assignedTo", "openedDate", "updatedAt", "jobID_id", termsaccepted, termsversion, termsacceptedat, "backjobStarted", "backjobStartedAt", "clientConfirmedBackjob", "clientConfirmedBackjobAt", "workerMarkedBackjobComplete", "workerMarkedBackjobCompleteAt", "termsAccepted", "termsVersion", "termsAcceptedAt", "adminRejectedAt", "adminRejectionReason") FROM stdin;
4	CLIENT	Broken Again Fuck	HAHSBEBWHSHSHSHSBSBDBBSDDDDDDSSSSHSHSHSBDIXIDHDBDBDBHDJSJSBSBSBSHSHSBEBEBEBSHJSJSJSJSJS	UNDER_REVIEW	MEDIUM	500.00	0.00	\N	\N	\N	2025-12-02 01:41:33.037096+00	2025-12-02 04:07:28.919545+00	46	f	\N	\N	f	\N	f	\N	f	\N	f	\N	\N	\N	\N
\.


--
-- Data for Name: job_employee_assignments; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_employee_assignments ("assignmentID", "assignedAt", notes, "isPrimaryContact", status, "employeeMarkedComplete", "employeeMarkedCompleteAt", "completionNotes", "assignedBy_id", employee_id, job_id) FROM stdin;
1	2025-11-30 08:36:20.146227+00		t	ASSIGNED	f	\N		23	1	45
2	2025-11-30 08:36:20.327184+00		f	ASSIGNED	f	\N		23	2	45
3	2025-12-01 16:58:18.280754+00		t	ASSIGNED	f	\N		23	1	47
\.


--
-- Data for Name: job_logs; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_logs ("logID", "oldStatus", "newStatus", notes, "createdAt", "changedBy_id", "jobID_id") FROM stdin;
1	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-01 09:31:37.403957+00	\N	1
2	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-01 09:31:41.406897+00	\N	2
4	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-03 11:32:20.609323+00	\N	4
5	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-04 04:28:14.837129+00	\N	4
6	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-05 15:21:27.440677+00	\N	5
7	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-05 18:58:40.879544+00	\N	6
8	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-05 19:41:38.194075+00	\N	9
9	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-06 03:39:13.083247+00	\N	10
10	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-06 05:14:24.122977+00	\N	6
11	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-06 05:33:00.302763+00	\N	10
12	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-06 08:06:19.145314+00	\N	11
13	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-09 20:38:40.897429+00	\N	12
14	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-23 12:04:59.657791+00	\N	7
15	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-23 15:17:43.052913+00	\N	7
16	IN_PROGRESS	COMPLETED	[2025-11-23 03:17:43 PM] Client Vaniel Cornelio approved job completion. Payment method: CASH. Status changed to COMPLETED.	2025-11-23 15:17:43.130638+00	7	7
17	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-11-26 01:36:36.964983+00	\N	29
18	IN_PROGRESS	IN_PROGRESS	[2025-11-26 04:22:52 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-11-26 04:22:52.35249+00	7	34
19	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-26 04:44:25.616784+00	\N	34
20	IN_PROGRESS	COMPLETED	[2025-11-26 04:44:25 AM] Client Vaniel Cornelio approved job completion. Payment method: CASH. Status changed to COMPLETED.	2025-11-26 04:44:25.813235+00	7	34
21	IN_PROGRESS	IN_PROGRESS	[2025-11-26 05:43:34 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-11-26 05:43:34.397724+00	7	12
22	IN_PROGRESS	IN_PROGRESS	[2025-11-26 05:44:01 AM] Worker Vaniel Cornelio marked job as complete. Notes: No completion notes provided	2025-11-26 05:44:01.437025+00	6	12
23	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-26 05:44:29.778163+00	\N	12
24	IN_PROGRESS	COMPLETED	[2025-11-26 05:44:29 AM] Client Vaniel Cornelio approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-11-26 05:44:29.969716+00	7	12
25	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-26 06:36:35.675155+00	\N	44
26	IN_PROGRESS	IN_PROGRESS	Employee assigned: Agency 'Devante' assigned employee 'Gabriel Modillas' to job. Notes: None	2025-11-26 08:58:31.069174+00	23	44
27	IN_PROGRESS	IN_PROGRESS	[2025-11-30 05:12:20 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-11-30 05:12:20.147767+00	7	44
28	IN_PROGRESS	IN_PROGRESS	[2025-11-30 05:25:10 AM] Gabriel Modillas marked job as complete. Notes: No completion notes provided	2025-11-30 05:25:10.455029+00	23	44
29	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-30 05:25:22.02174+00	\N	44
30	IN_PROGRESS	COMPLETED	[2025-11-30 05:25:22 AM] Client Vaniel Cornelio approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-11-30 05:25:22.21264+00	7	44
31	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-30 07:50:10.496065+00	\N	45
32	IN_PROGRESS	ACTIVE	Status changed from IN_PROGRESS to ACTIVE	2025-11-30 08:33:17.250757+00	\N	45
33	ACTIVE	ASSIGNED	Status changed from ACTIVE to ASSIGNED	2025-11-30 08:36:20.5326+00	\N	45
34	ACTIVE	ASSIGNED	Multi-employee assignment: 2 employees assigned (Gabriel Modillas, Vaniel Cornelio). Primary contact: Gabriel Modillas	2025-11-30 08:36:20.67033+00	23	45
35	ASSIGNED	IN_PROGRESS	Status changed from ASSIGNED to IN_PROGRESS	2025-11-30 08:54:21.44092+00	\N	45
36	IN_PROGRESS	IN_PROGRESS	[2025-11-30 08:59:45 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-11-30 08:59:45.823631+00	7	45
37	IN_PROGRESS	IN_PROGRESS	[2025-11-30 09:13:49 AM] Gabriel Modillas marked job as complete. Notes: No completion notes provided	2025-11-30 09:13:50.000326+00	23	45
38	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-30 09:13:59.125835+00	\N	45
39	IN_PROGRESS	COMPLETED	[2025-11-30 09:13:59 AM] Client Vaniel Cornelio approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-11-30 09:13:59.332084+00	7	45
40	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-11-30 10:58:12.534402+00	\N	46
41	IN_PROGRESS	IN_PROGRESS	[2025-11-30 10:59:09 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-11-30 10:59:09.114284+00	7	46
42	IN_PROGRESS	IN_PROGRESS	[2025-11-30 10:59:36 AM] Vaniel Cornelio marked job as complete. Notes: No completion notes provided	2025-11-30 10:59:36.534521+00	6	46
43	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-11-30 11:00:15.92764+00	\N	46
44	IN_PROGRESS	COMPLETED	[2025-11-30 11:00:16 AM] Client Vaniel Cornelio approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-11-30 11:00:16.117225+00	7	46
45	ACTIVE	CANCELLED	Status changed from ACTIVE to CANCELLED	2025-12-01 03:06:16.412626+00	\N	33
46	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-01 16:58:18.285471+00	\N	47
47	ACTIVE	IN_PROGRESS	Multi-employee assignment: 1 employees assigned (Gabriel Modillas). Primary contact: Gabriel Modillas	2025-12-01 16:58:18.290473+00	23	47
48	IN_PROGRESS	IN_PROGRESS	[2025-12-01 04:58:46 PM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-12-01 16:58:46.48965+00	7	47
49	IN_PROGRESS	IN_PROGRESS	[2025-12-01 04:58:54 PM] Gabriel Modillas marked job as complete. Notes: No completion notes provided	2025-12-01 16:58:54.940773+00	23	47
50	COMPLETED	BACKJOB	Client requested backjob. Reason: Broken Again Fuck	2025-12-02 01:41:33.049014+00	7	46
51	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-10 15:04:19.093903+00	\N	51
52	IN_PROGRESS	IN_PROGRESS	[2025-12-10 03:05:20 PM] Client Test Client confirmed that worker has arrived and work has started	2025-12-10 15:05:20.235753+00	48	51
53	IN_PROGRESS	IN_PROGRESS	[2025-12-10 03:05:30 PM] Test Worker marked job as complete. Notes: No completion notes provided	2025-12-10 15:05:30.818432+00	49	51
54	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-10 15:05:48.630091+00	\N	51
113	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 20:50:06.466459+00	\N	132
55	IN_PROGRESS	COMPLETED	[2025-12-10 03:05:48 PM] Client Test Client approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-12-10 15:05:48.643576+00	48	51
57	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-11 16:35:28.702629+00	\N	75
58	IN_PROGRESS	IN_PROGRESS	[2025-12-11 04:36:02 PM] Client Test Client confirmed that worker has arrived and work has started	2025-12-11 16:36:02.971446+00	54	75
59	IN_PROGRESS	IN_PROGRESS	[2025-12-11 04:36:10 PM] Test Worker marked job as complete. Notes: No completion notes provided	2025-12-11 16:36:10.248632+00	55	75
60	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-11 16:36:15.682635+00	\N	75
61	IN_PROGRESS	COMPLETED	[2025-12-11 04:36:15 PM] Client Test Client approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-12-11 16:36:15.697679+00	54	75
62	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 09:17:53.422377+00	\N	85
63	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 09:17:53.625856+00	\N	85
64	IN_PROGRESS	COMPLETED	[2025-12-12 09:17:53 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 09:17:53.641562+00	54	85
65	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 09:19:05.34685+00	\N	86
66	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 09:19:05.555961+00	\N	86
67	IN_PROGRESS	COMPLETED	[2025-12-12 09:19:05 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 09:19:05.571447+00	54	86
68	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 09:19:57.581944+00	\N	87
69	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 09:19:57.780774+00	\N	87
70	IN_PROGRESS	COMPLETED	[2025-12-12 09:19:57 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 09:19:57.79714+00	54	87
71	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:08:22.656154+00	\N	106
72	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:08:23.031978+00	\N	106
73	IN_PROGRESS	COMPLETED	[2025-12-12 05:08:23 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:08:23.050098+00	66	106
74	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:09:25.774746+00	\N	107
75	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:09:26.119149+00	\N	107
76	IN_PROGRESS	COMPLETED	[2025-12-12 05:09:26 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:09:26.13772+00	66	107
77	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:10:30.974335+00	\N	108
78	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:10:31.307125+00	\N	108
79	IN_PROGRESS	COMPLETED	[2025-12-12 05:10:31 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:10:31.325448+00	66	108
80	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:11:36.924339+00	\N	109
81	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:11:37.274076+00	\N	109
82	IN_PROGRESS	COMPLETED	[2025-12-12 05:11:37 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:11:37.291425+00	66	109
83	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:12:09.522016+00	\N	110
84	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:12:09.8401+00	\N	110
85	IN_PROGRESS	COMPLETED	[2025-12-12 05:12:09 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:12:09.857158+00	66	110
86	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:12:57.743381+00	\N	111
87	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:12:58.080718+00	\N	111
88	IN_PROGRESS	COMPLETED	[2025-12-12 05:12:58 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:12:58.098367+00	66	111
89	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:14:43.579237+00	\N	112
90	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:14:43.914505+00	\N	112
91	IN_PROGRESS	COMPLETED	[2025-12-12 05:14:43 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:14:43.931835+00	66	112
92	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:19:54.873564+00	\N	113
93	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:19:55.199423+00	\N	113
94	IN_PROGRESS	COMPLETED	[2025-12-12 05:19:55 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:19:55.217159+00	66	113
95	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:20:29.118476+00	\N	114
96	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 17:20:29.447734+00	\N	114
97	IN_PROGRESS	COMPLETED	[2025-12-12 05:20:29 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 17:20:29.465461+00	66	114
98	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 17:52:05.223696+00	\N	115
99	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 18:05:11.611092+00	\N	118
100	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 18:06:58.481265+00	\N	119
101	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:21:29.343331+00	\N	122
102	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:22:12.767612+00	\N	123
103	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 20:22:13.437302+00	\N	123
104	IN_PROGRESS	COMPLETED	[2025-12-12 08:22:13 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 20:22:13.454971+00	7	123
105	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:42:22.418702+00	\N	129
106	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:45:27.217739+00	\N	130
107	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 20:45:27.516757+00	\N	130
108	IN_PROGRESS	COMPLETED	[2025-12-12 08:45:27 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 20:45:27.534573+00	50	130
109	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:49:25.249795+00	\N	131
110	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-12 20:49:25.540407+00	\N	131
111	IN_PROGRESS	COMPLETED	[2025-12-12 08:49:25 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 20:49:25.559338+00	50	131
112	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-12 20:50:05.999067+00	\N	132
114	IN_PROGRESS	COMPLETED	[2025-12-12 08:50:06 PM] Client approved team job completion. All 0 workers completed their work.	2025-12-12 20:50:06.487556+00	50	132
142	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-13 02:51:29.329515+00	\N	164
143	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-13 02:51:29.782169+00	\N	164
144	IN_PROGRESS	COMPLETED	[2025-12-13 02:51:29 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-13 02:51:29.798593+00	50	164
145	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-13 02:53:40.35432+00	\N	165
146	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-13 02:53:40.796706+00	\N	165
147	IN_PROGRESS	COMPLETED	[2025-12-13 02:53:40 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-13 02:53:40.813971+00	50	165
148	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-13 04:36:58.73606+00	\N	77
149	IN_PROGRESS	IN_PROGRESS	[2025-12-13 04:37:08 AM] Client Vaniel Cornelio confirmed that worker has arrived and work has started	2025-12-13 04:37:08.733913+00	7	77
150	IN_PROGRESS	IN_PROGRESS	[2025-12-13 04:37:29 AM] Vaniel Cornelio marked job as complete. Notes: No completion notes provided	2025-12-13 04:37:29.602739+00	6	77
151	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-13 04:38:02.263412+00	\N	77
152	IN_PROGRESS	COMPLETED	[2025-12-13 04:38:02 AM] Client Vaniel Cornelio approved job completion. Payment method: WALLET. Status changed to COMPLETED.	2025-12-13 04:38:02.275704+00	7	77
153	ACTIVE	IN_PROGRESS	Status changed from ACTIVE to IN_PROGRESS	2025-12-16 04:27:48.589537+00	\N	166
154	IN_PROGRESS	COMPLETED	Status changed from IN_PROGRESS to COMPLETED	2025-12-16 04:46:12.262428+00	\N	166
155	IN_PROGRESS	COMPLETED	[2025-12-16 04:46:12 AM] Client approved team job completion. All 0 workers completed their work.	2025-12-16 04:46:12.281729+00	7	166
\.


--
-- Data for Name: job_photos; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_photos ("photoID", "photoURL", "fileName", "uploadedAt", "jobID_id") FROM stdin;
1	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_4/p_b.jfif	p_b.jfif	2025-11-03 10:57:02.957181+00	4
2	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_5/IMG_5654_imresizer.jpg	IMG_5654_imresizer.jpg	2025-11-05 15:16:27.911318+00	5
3	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_12/Screenshot%202025-11-03%20042440.png	Screenshot 2025-11-03 042440.png	2025-11-06 08:06:53.052533+00	12
\.


--
-- Data for Name: job_reviews; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_reviews ("reviewID", "reviewerType", rating, comment, status, "isFlagged", "flagReason", "flaggedAt", "helpfulCount", "createdAt", "updatedAt", "flaggedBy_id", "jobID_id", "revieweeID_id", "reviewerID_id", "revieweeAgencyID_id", "revieweeEmployeeID_id", "revieweeProfileID_id", rating_communication, rating_professionalism, rating_punctuality, rating_quality) FROM stdin;
1	CLIENT	4.00		ACTIVE	f	\N	\N	0	2025-11-04 04:28:24.070753+00	2025-11-04 04:28:24.070763+00	\N	4	6	7	\N	\N	\N	\N	\N	\N	\N
2	WORKER	5.00	Good Client	ACTIVE	f	\N	\N	0	2025-11-04 04:51:00.793143+00	2025-11-04 04:51:00.793164+00	\N	4	7	6	\N	\N	\N	\N	\N	\N	\N
3	WORKER	4.00		ACTIVE	f	\N	\N	0	2025-11-05 19:28:33.512359+00	2025-11-05 19:28:33.512376+00	\N	6	7	6	\N	\N	\N	\N	\N	\N	\N
4	CLIENT	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:14:19.741317+00	2025-11-06 05:14:19.741326+00	\N	6	6	7	\N	\N	\N	\N	\N	\N	\N
5	CLIENT	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:17:23.367516+00	2025-11-06 05:17:23.367526+00	\N	10	6	7	\N	\N	\N	\N	\N	\N	\N
6	WORKER	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:33:00.02842+00	2025-11-06 05:33:00.028432+00	\N	10	7	6	\N	\N	\N	\N	\N	\N	\N
7	CLIENT	3.00	Good, work was finished fast	ACTIVE	f	\N	\N	0	2025-11-23 15:24:19.162918+00	2025-11-23 15:24:19.162929+00	\N	7	6	7	\N	\N	\N	\N	\N	\N	\N
8	WORKER	4.00	Responsive	ACTIVE	f	\N	\N	0	2025-11-23 15:30:46.894805+00	2025-11-23 15:30:46.894815+00	\N	7	7	6	\N	\N	\N	\N	\N	\N	\N
9	CLIENT	4.00	Good Worker	ACTIVE	f	\N	\N	0	2025-11-26 04:44:36.251365+00	2025-11-26 04:44:36.251375+00	\N	34	6	7	\N	\N	\N	\N	\N	\N	\N
10	WORKER	5.00	May pa free meryenda lab et	ACTIVE	f	\N	\N	0	2025-11-26 04:45:20.753972+00	2025-11-26 04:45:20.753985+00	\N	34	7	6	\N	\N	\N	\N	\N	\N	\N
11	CLIENT	2.00	Slow Arrival	ACTIVE	f	\N	\N	0	2025-11-26 05:44:38.438956+00	2025-11-26 05:44:38.438964+00	\N	12	6	7	\N	\N	\N	\N	\N	\N	\N
12	WORKER	3.00	Mid	ACTIVE	f	\N	\N	0	2025-11-26 06:10:31.310825+00	2025-11-26 06:10:31.310834+00	\N	12	7	6	\N	\N	\N	\N	\N	\N	\N
13	CLIENT	5.00	Hey	ACTIVE	f	\N	\N	0	2025-11-30 05:51:45.862828+00	2025-11-30 05:51:45.862839+00	\N	44	\N	7	\N	1	\N	\N	\N	\N	\N
14	CLIENT	5.00	cool	ACTIVE	f	\N	\N	0	2025-11-30 06:20:32.463312+00	2025-11-30 06:20:32.463322+00	\N	44	\N	7	8	\N	\N	\N	\N	\N	\N
17	CLIENT	5.00	great worker	ACTIVE	f	\N	\N	0	2025-11-30 09:20:53.011266+00	2025-11-30 09:20:53.01128+00	\N	45	\N	7	\N	2	\N	\N	\N	\N	\N
18	CLIENT	5.00	done	ACTIVE	f	\N	\N	0	2025-11-30 09:20:59.523545+00	2025-11-30 09:20:59.523554+00	\N	45	\N	7	\N	1	\N	\N	\N	\N	\N
19	CLIENT	5.00	DEVANTEEEE	ACTIVE	f	\N	\N	0	2025-11-30 09:21:08.819245+00	2025-11-30 09:21:08.819255+00	\N	45	\N	7	8	\N	\N	\N	\N	\N	\N
21	CLIENT	5.00	Great	ACTIVE	f	\N	\N	0	2025-11-30 11:00:22.110294+00	2025-11-30 11:00:22.110305+00	\N	46	6	7	\N	\N	\N	\N	\N	\N	\N
22	WORKER	5.00	Great Employer	ACTIVE	f	\N	\N	0	2025-11-30 11:01:22.367861+00	2025-11-30 11:01:22.367875+00	\N	46	7	6	\N	\N	\N	\N	\N	\N	\N
15	AGENCY	5.00		ACTIVE	f	\N	\N	0	2025-11-30 06:52:08.750821+00	2025-11-30 06:52:08.750832+00	\N	44	7	23	\N	\N	\N	\N	\N	\N	\N
20	AGENCY	5.00		ACTIVE	f	\N	\N	0	2025-11-30 09:21:41.463477+00	2025-11-30 09:21:41.463486+00	\N	45	7	23	\N	\N	\N	\N	\N	\N	\N
23	CLIENT	4.75	Excellent worker! Very professional and completed the job quickly. Highly recommended.	ACTIVE	f	\N	\N	0	2025-12-10 15:08:48.29786+00	2025-12-10 15:08:48.297869+00	\N	51	49	48	\N	\N	38	5.00	4.00	5.00	5.00
24	WORKER	4.50	Great client! Clear instructions and prompt payment. Would work with them again.	ACTIVE	f	\N	\N	0	2025-12-10 15:09:23.314632+00	2025-12-10 15:09:23.314643+00	\N	51	48	49	\N	\N	37	5.00	5.00	4.00	4.00
25	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 2	ACTIVE	f	\N	\N	0	2025-12-12 17:12:58.378913+00	2025-12-12 17:12:58.37892+00	\N	111	66	68	\N	\N	\N	5.00	5.00	5.00	5.00
26	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 3	ACTIVE	f	\N	\N	0	2025-12-12 17:12:58.439185+00	2025-12-12 17:12:58.439192+00	\N	111	66	69	\N	\N	\N	5.00	5.00	5.00	5.00
27	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 2	ACTIVE	f	\N	\N	0	2025-12-12 17:14:44.145117+00	2025-12-12 17:14:44.145126+00	\N	112	66	68	\N	\N	\N	5.00	5.00	5.00	5.00
28	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 3	ACTIVE	f	\N	\N	0	2025-12-12 17:14:44.200229+00	2025-12-12 17:14:44.200238+00	\N	112	66	69	\N	\N	\N	5.00	5.00	5.00	5.00
29	CLIENT	4.75	Great work by Worker Three! Very professional and completed tasks on time.	ACTIVE	f	\N	\N	0	2025-12-12 17:19:55.294527+00	2025-12-12 17:19:55.294536+00	\N	113	69	66	\N	\N	\N	5.00	5.00	4.00	5.00
30	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 2	ACTIVE	f	\N	\N	0	2025-12-12 17:19:55.545459+00	2025-12-12 17:19:55.545467+00	\N	113	66	68	\N	\N	\N	5.00	5.00	5.00	5.00
31	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 3	ACTIVE	f	\N	\N	0	2025-12-12 17:19:55.608971+00	2025-12-12 17:19:55.608979+00	\N	113	66	69	\N	\N	\N	5.00	5.00	5.00	5.00
32	CLIENT	4.75	Great work by Worker Three! Very professional and completed tasks on time.	ACTIVE	f	\N	\N	0	2025-12-12 17:20:29.539082+00	2025-12-12 17:20:29.539091+00	\N	114	69	66	\N	\N	\N	5.00	5.00	4.00	5.00
33	CLIENT	5.00	Great work by Worker Two! Very professional and completed tasks on time.	ACTIVE	f	\N	\N	0	2025-12-12 17:20:29.673609+00	2025-12-12 17:20:29.673618+00	\N	114	68	66	\N	\N	\N	5.00	5.00	5.00	5.00
34	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 2	ACTIVE	f	\N	\N	0	2025-12-12 17:20:29.774623+00	2025-12-12 17:20:29.774632+00	\N	114	66	68	\N	\N	\N	5.00	5.00	5.00	5.00
35	WORKER	5.00	Excellent client! Clear communication and prompt payment. - Worker 3	ACTIVE	f	\N	\N	0	2025-12-12 17:20:29.834818+00	2025-12-12 17:20:29.834827+00	\N	114	66	69	\N	\N	\N	5.00	5.00	5.00	5.00
36	WORKER	5.00		ACTIVE	f	\N	\N	0	2025-12-12 20:22:13.545096+00	2025-12-12 20:22:13.545109+00	\N	123	7	51	\N	\N	\N	5.00	5.00	5.00	5.00
37	WORKER	5.00		ACTIVE	f	\N	\N	0	2025-12-12 20:22:13.60356+00	2025-12-12 20:22:13.603567+00	\N	123	7	52	\N	\N	\N	5.00	5.00	5.00	5.00
38	WORKER	5.00		ACTIVE	f	\N	\N	0	2025-12-12 20:22:13.66426+00	2025-12-12 20:22:13.664268+00	\N	123	7	53	\N	\N	\N	5.00	5.00	5.00	5.00
39	CLIENT	5.00	Excellent work by Worker1 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.668504+00	2025-12-12 20:45:27.668512+00	\N	130	51	50	\N	\N	\N	5.00	5.00	5.00	5.00
40	CLIENT	5.00	Excellent work by Worker3 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.72918+00	2025-12-12 20:45:27.72919+00	\N	130	53	50	\N	\N	\N	5.00	5.00	5.00	5.00
41	CLIENT	5.00	Excellent work by Worker2 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.793384+00	2025-12-12 20:45:27.793394+00	\N	130	52	50	\N	\N	\N	5.00	5.00	5.00	5.00
42	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.856251+00	2025-12-12 20:45:27.85626+00	\N	130	50	51	\N	\N	\N	5.00	5.00	5.00	5.00
43	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.920469+00	2025-12-12 20:45:27.920476+00	\N	130	50	53	\N	\N	\N	5.00	5.00	5.00	5.00
44	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:45:27.984384+00	2025-12-12 20:45:27.984392+00	\N	130	50	52	\N	\N	\N	5.00	5.00	5.00	5.00
45	CLIENT	5.00	Excellent work by Worker1 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:25.694266+00	2025-12-12 20:49:25.694274+00	\N	131	51	50	\N	\N	\N	5.00	5.00	5.00	5.00
46	CLIENT	5.00	Excellent work by Worker3 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:25.755599+00	2025-12-12 20:49:25.755607+00	\N	131	53	50	\N	\N	\N	5.00	5.00	5.00	5.00
47	CLIENT	5.00	Excellent work by Worker2 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:25.824097+00	2025-12-12 20:49:25.824106+00	\N	131	52	50	\N	\N	\N	5.00	5.00	5.00	5.00
48	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:25.889411+00	2025-12-12 20:49:25.889419+00	\N	131	50	51	\N	\N	\N	5.00	5.00	5.00	5.00
49	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:25.955419+00	2025-12-12 20:49:25.955427+00	\N	131	50	53	\N	\N	\N	5.00	5.00	5.00	5.00
50	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:49:26.017846+00	2025-12-12 20:49:26.017854+00	\N	131	50	52	\N	\N	\N	5.00	5.00	5.00	5.00
51	CLIENT	5.00	Excellent work by Worker1 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.635206+00	2025-12-12 20:50:06.635214+00	\N	132	51	50	\N	\N	\N	5.00	5.00	5.00	5.00
52	CLIENT	5.00	Excellent work by Worker3 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.695499+00	2025-12-12 20:50:06.695508+00	\N	132	53	50	\N	\N	\N	5.00	5.00	5.00	5.00
53	CLIENT	5.00	Excellent work by Worker2 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.760512+00	2025-12-12 20:50:06.76052+00	\N	132	52	50	\N	\N	\N	5.00	5.00	5.00	5.00
54	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.823176+00	2025-12-12 20:50:06.823185+00	\N	132	50	51	\N	\N	\N	5.00	5.00	5.00	5.00
55	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.887996+00	2025-12-12 20:50:06.888007+00	\N	132	50	53	\N	\N	\N	5.00	5.00	5.00	5.00
56	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-12 20:50:06.949241+00	2025-12-12 20:50:06.949252+00	\N	132	50	52	\N	\N	\N	5.00	5.00	5.00	5.00
78	CLIENT	5.00	Excellent work by Worker1 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:29.923715+00	2025-12-13 02:51:29.923723+00	\N	164	51	50	\N	\N	\N	5.00	5.00	5.00	5.00
79	CLIENT	5.00	Excellent work by Worker3 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:30.003176+00	2025-12-13 02:51:30.003185+00	\N	164	53	50	\N	\N	\N	5.00	5.00	5.00	5.00
80	CLIENT	5.00	Excellent work by Worker2 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:30.07054+00	2025-12-13 02:51:30.070547+00	\N	164	52	50	\N	\N	\N	5.00	5.00	5.00	5.00
81	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:30.136942+00	2025-12-13 02:51:30.136952+00	\N	164	50	51	\N	\N	\N	5.00	5.00	5.00	5.00
82	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:30.193286+00	2025-12-13 02:51:30.193305+00	\N	164	50	53	\N	\N	\N	5.00	5.00	5.00	5.00
83	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:51:30.248591+00	2025-12-13 02:51:30.248599+00	\N	164	50	52	\N	\N	\N	5.00	5.00	5.00	5.00
84	CLIENT	5.00	Excellent work by Worker1 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:40.934698+00	2025-12-13 02:53:40.934707+00	\N	165	51	50	\N	\N	\N	5.00	5.00	5.00	5.00
85	CLIENT	5.00	Excellent work by Worker3 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:41.019919+00	2025-12-13 02:53:41.019927+00	\N	165	53	50	\N	\N	\N	5.00	5.00	5.00	5.00
86	CLIENT	5.00	Excellent work by Worker2 Test! Very professional and completed on time.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:41.094358+00	2025-12-13 02:53:41.094366+00	\N	165	52	50	\N	\N	\N	5.00	5.00	5.00	5.00
87	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:41.166153+00	2025-12-13 02:53:41.166163+00	\N	165	50	51	\N	\N	\N	5.00	5.00	5.00	5.00
88	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:41.221+00	2025-12-13 02:53:41.221011+00	\N	165	50	53	\N	\N	\N	5.00	5.00	5.00	5.00
89	WORKER	5.00	Great client to work with! Clear instructions and prompt payment.	ACTIVE	f	\N	\N	0	2025-12-13 02:53:41.276012+00	2025-12-13 02:53:41.276021+00	\N	165	50	52	\N	\N	\N	5.00	5.00	5.00	5.00
90	CLIENT	3.75	YEHHH	ACTIVE	f	\N	\N	0	2025-12-13 04:38:12.55295+00	2025-12-13 04:38:12.552958+00	\N	77	6	7	\N	\N	\N	3.00	3.00	5.00	4.00
91	WORKER	5.00	great	ACTIVE	f	\N	\N	0	2025-12-13 04:58:26.057428+00	2025-12-13 04:58:26.057448+00	\N	77	7	6	\N	\N	\N	5.00	5.00	5.00	5.00
92	CLIENT	3.50	Grape	ACTIVE	f	\N	\N	0	2025-12-16 04:59:26.71195+00	2025-12-16 04:59:26.711958+00	\N	166	36	7	\N	\N	\N	3.00	3.00	5.00	3.00
93	CLIENT	3.50	Grape	ACTIVE	f	\N	\N	0	2025-12-16 04:59:49.236555+00	2025-12-16 04:59:49.236562+00	\N	166	6	7	\N	\N	\N	3.00	3.00	5.00	3.00
94	WORKER	5.00	goood	ACTIVE	f	\N	\N	0	2025-12-16 05:00:39.869727+00	2025-12-16 05:00:39.869735+00	\N	166	7	36	\N	\N	\N	5.00	5.00	5.00	5.00
95	WORKER	5.00	heyyyy	ACTIVE	f	\N	\N	0	2025-12-16 05:13:23.493704+00	2025-12-16 05:13:23.49375+00	\N	166	7	6	\N	\N	\N	5.00	5.00	5.00	5.00
\.


--
-- Data for Name: job_skill_slots; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_skill_slots ("skillSlotID", workers_needed, budget_allocated, skill_level_required, status, notes, "createdAt", "updatedAt", "jobID_id", "specializationID_id") FROM stdin;
7	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:03:53.244854+00	2025-12-10 17:03:53.244863+00	55	1
8	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:03:53.246708+00	2025-12-10 17:03:53.246717+00	55	2
9	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:04:57.543799+00	2025-12-10 17:04:57.543808+00	56	1
10	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:04:57.54601+00	2025-12-10 17:04:57.546019+00	56	2
11	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:05:58.478869+00	2025-12-10 17:05:58.478899+00	57	1
12	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:05:58.480657+00	2025-12-10 17:05:58.480664+00	57	2
13	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:07:11.691122+00	2025-12-10 17:07:11.691132+00	58	1
14	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:07:11.693319+00	2025-12-10 17:07:11.693329+00	58	2
15	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:08:05.45257+00	2025-12-10 17:08:05.452578+00	59	1
16	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:08:05.454251+00	2025-12-10 17:08:05.454258+00	59	2
17	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:08:48.826161+00	2025-12-10 17:08:48.82617+00	60	1
18	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:08:48.828242+00	2025-12-10 17:08:48.82825+00	60	2
19	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:09:50.910307+00	2025-12-10 17:09:50.910316+00	61	1
20	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:09:50.912151+00	2025-12-10 17:09:50.912159+00	61	2
21	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:10:52.970781+00	2025-12-10 17:10:52.97079+00	62	1
22	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:10:52.972492+00	2025-12-10 17:10:52.972501+00	62	2
23	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:17:40.313282+00	2025-12-10 17:17:40.313291+00	63	1
24	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:17:40.315492+00	2025-12-10 17:17:40.315502+00	63	2
25	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-10 17:19:44.403592+00	2025-12-10 17:19:44.403599+00	64	1
26	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-10 17:19:44.405174+00	2025-12-10 17:19:44.405195+00	64	2
28	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-10 17:31:12.669122+00	2025-12-10 17:31:12.927363+00	65	2
27	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-10 17:31:12.66711+00	2025-12-10 17:31:12.988859+00	65	1
30	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-10 17:33:44.195885+00	2025-12-10 17:33:44.434083+00	66	2
29	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-10 17:33:44.194241+00	2025-12-10 17:33:44.495349+00	66	1
32	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-10 17:34:07.254669+00	2025-12-10 17:34:07.532074+00	67	2
31	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-10 17:34:07.252984+00	2025-12-10 17:34:07.60203+00	67	1
34	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-10 17:36:08.878405+00	2025-12-10 17:36:09.121032+00	68	2
33	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-10 17:36:08.87659+00	2025-12-10 17:36:09.185163+00	68	1
35	2	6666.67	INTERMEDIATE	OPEN	\N	2025-12-10 17:44:32.937401+00	2025-12-10 17:44:32.937413+00	69	1
36	1	3333.33	INTERMEDIATE	OPEN	\N	2025-12-10 17:44:32.93955+00	2025-12-10 17:44:32.939559+00	69	2
37	2	6666.67	INTERMEDIATE	PARTIALLY_FILLED	\N	2025-12-10 17:45:08.340076+00	2025-12-10 17:45:08.624109+00	70	1
38	1	3333.33	INTERMEDIATE	FILLED	\N	2025-12-10 17:45:08.341862+00	2025-12-10 17:45:08.719566+00	70	2
39	2	6666.67	INTERMEDIATE	PARTIALLY_FILLED	\N	2025-12-10 17:48:24.751972+00	2025-12-10 17:48:25.013161+00	71	1
40	1	3333.33	INTERMEDIATE	FILLED	\N	2025-12-10 17:48:24.753705+00	2025-12-10 17:48:25.079069+00	71	2
41	2	6666.67	INTERMEDIATE	PARTIALLY_FILLED	\N	2025-12-10 17:58:19.74016+00	2025-12-10 17:58:20.040768+00	72	1
42	1	3333.33	INTERMEDIATE	FILLED	\N	2025-12-10 17:58:19.74212+00	2025-12-10 17:58:20.11368+00	72	2
43	2	6666.67	INTERMEDIATE	PARTIALLY_FILLED	\N	2025-12-10 17:59:29.690232+00	2025-12-10 17:59:29.972045+00	73	1
44	1	3333.33	INTERMEDIATE	FILLED	\N	2025-12-10 17:59:29.692623+00	2025-12-10 17:59:30.090492+00	73	2
45	2	50000.00	ENTRY	OPEN	\N	2025-12-11 18:26:08.955941+00	2025-12-11 18:26:08.955952+00	76	1
47	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 04:29:58.725091+00	2025-12-12 04:29:59.020808+00	78	2
46	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-12 04:29:58.715761+00	2025-12-12 04:29:59.087936+00	78	1
48	2	5000.00	ENTRY	OPEN	\N	2025-12-12 05:04:24.139597+00	2025-12-12 05:04:24.139626+00	79	1
49	2	6000.00	INTERMEDIATE	OPEN	Need experienced plumbers for bathroom renovation	2025-12-12 09:06:53.545699+00	2025-12-12 09:06:53.545708+00	81	1
50	3	9000.00	EXPERT	OPEN	Complex electrical rewiring required	2025-12-12 09:06:53.552941+00	2025-12-12 09:06:53.55295+00	81	2
51	2	6666.67	INTERMEDIATE	OPEN	Bathroom renovation plumbing	2025-12-12 09:12:42.316687+00	2025-12-12 09:12:42.316695+00	82	1
52	1	3333.33	EXPERT	OPEN	Electrical rewiring	2025-12-12 09:12:42.318837+00	2025-12-12 09:12:42.318846+00	82	2
53	2	6666.67	INTERMEDIATE	OPEN	Bathroom renovation plumbing	2025-12-12 09:13:58.271798+00	2025-12-12 09:13:58.271807+00	83	1
54	1	3333.33	EXPERT	OPEN	Electrical rewiring	2025-12-12 09:13:58.273797+00	2025-12-12 09:13:58.273807+00	83	2
56	1	3333.33	EXPERT	OPEN	Electrical rewiring	2025-12-12 09:14:43.915841+00	2025-12-12 09:14:43.915849+00	84	2
55	2	6666.67	INTERMEDIATE	PARTIALLY_FILLED	Bathroom renovation plumbing	2025-12-12 09:14:43.913653+00	2025-12-12 09:14:44.353103+00	84	1
57	2	6000.00	INTERMEDIATE	FILLED	Need 2 plumbers for bathroom renovation	2025-12-12 09:17:52.265799+00	2025-12-12 09:17:53.532711+00	85	1
58	1	3000.00	EXPERT	FILLED	Need 1 electrician for wiring	2025-12-12 09:17:52.267374+00	2025-12-12 09:17:53.58004+00	85	2
59	2	6000.00	INTERMEDIATE	FILLED	Need 2 plumbers for bathroom renovation	2025-12-12 09:19:04.127348+00	2025-12-12 09:19:05.45382+00	86	1
60	1	3000.00	EXPERT	FILLED	Need 1 electrician for wiring	2025-12-12 09:19:04.129212+00	2025-12-12 09:19:05.505582+00	86	2
61	2	6000.00	INTERMEDIATE	FILLED	Need 2 plumbers for bathroom renovation	2025-12-12 09:19:56.42851+00	2025-12-12 09:19:57.68494+00	87	1
62	1	3000.00	EXPERT	FILLED	Need 1 electrician for wiring	2025-12-12 09:19:56.430182+00	2025-12-12 09:19:57.733712+00	87	2
64	2	6000.00	EXPERT	OPEN	Electrical rewiring	2025-12-12 09:24:09.659767+00	2025-12-12 09:24:09.659773+00	88	2
63	2	6000.00	INTERMEDIATE	PARTIALLY_FILLED	Bathroom renovation work	2025-12-12 09:24:09.658147+00	2025-12-12 09:24:10.119839+00	88	1
66	1	225.00	ENTRY	OPEN	\N	2025-12-12 15:36:04.95623+00	2025-12-12 15:36:04.956239+00	101	3
65	1	225.00	ENTRY	FILLED	\N	2025-12-12 15:36:04.951817+00	2025-12-12 15:37:57.287636+00	101	1
68	2	10000.00	INTERMEDIATE	OPEN	Need 2 workers for Appliance Repair tasks	2025-12-12 17:04:03.617484+00	2025-12-12 17:04:03.617493+00	103	8
69	1	5000.00	EXPERT	OPEN	Need 1 expert for Carpentry work	2025-12-12 17:04:03.619578+00	2025-12-12 17:04:03.619586+00	103	3
92	2	140.00	INTERMEDIATE	OPEN	\N	2025-12-12 17:27:29.267781+00	2025-12-12 17:27:29.267792+00	115	3
70	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:06:38.353332+00	2025-12-12 17:06:38.673896+00	104	8
71	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:06:38.355916+00	2025-12-12 17:06:38.812012+00	104	3
72	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:06:42.554052+00	2025-12-12 17:06:42.915481+00	105	8
73	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:06:42.556487+00	2025-12-12 17:06:43.042354+00	105	3
96	1	3000.00	INTERMEDIATE	FILLED	\N	2025-12-12 18:04:49.092261+00	2025-12-16 01:49:37.479309+00	117	2
87	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:14:42.650094+00	2025-12-12 17:14:43.771707+00	112	3
86	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:14:42.64683+00	2025-12-12 17:14:43.862268+00	112	8
95	2	6000.00	INTERMEDIATE	FILLED	\N	2025-12-12 18:04:49.090318+00	2025-12-16 01:49:41.524137+00	117	1
94	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 18:04:04.140687+00	2025-12-12 18:04:04.417966+00	116	2
75	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:08:21.675985+00	2025-12-12 17:08:22.871097+00	106	3
74	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:08:21.674055+00	2025-12-12 17:08:22.975961+00	106	8
89	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:19:53.603931+00	2025-12-12 17:19:55.059273+00	113	3
88	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:19:53.602173+00	2025-12-12 17:19:55.146582+00	113	8
93	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-12 18:04:04.138265+00	2025-12-12 18:04:04.480615+00	116	1
77	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:09:24.471183+00	2025-12-12 17:09:25.970912+00	107	3
76	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:09:24.469265+00	2025-12-12 17:09:26.064195+00	107	8
81	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:11:35.753634+00	2025-12-12 17:11:37.130403+00	109	3
80	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:11:35.751827+00	2025-12-12 17:11:37.220273+00	109	8
91	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:20:27.836447+00	2025-12-12 17:20:29.304603+00	114	3
90	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:20:27.834799+00	2025-12-12 17:20:29.395829+00	114	8
79	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:10:29.773104+00	2025-12-12 17:10:31.160064+00	108	3
78	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:10:29.771244+00	2025-12-12 17:10:31.252471+00	108	8
98	1	3000.00	INTERMEDIATE	CLOSED	\N	2025-12-12 18:05:10.795341+00	2025-12-12 18:05:11.335862+00	118	2
83	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:12:08.674562+00	2025-12-12 17:12:09.70409+00	110	3
82	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:12:08.672877+00	2025-12-12 17:12:09.789522+00	110	8
97	2	6000.00	INTERMEDIATE	CLOSED	\N	2025-12-12 18:05:10.792954+00	2025-12-12 18:05:11.395682+00	118	1
105	2	8000.00	INTERMEDIATE	FILLED	Need 2 plumbers for bathroom pipes	2025-12-12 20:21:28.064287+00	2025-12-12 20:21:29.80941+00	122	1
104	1	4000.00	EXPERT	FILLED	Need 1 electrician for wiring	2025-12-12 20:19:10.545815+00	2025-12-12 20:19:11.785644+00	121	2
85	1	5000.00	EXPERT	FILLED	Need 1 expert for Carpentry work	2025-12-12 17:12:56.552647+00	2025-12-12 17:12:57.935269+00	111	3
84	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 workers for Appliance Repair tasks	2025-12-12 17:12:56.551167+00	2025-12-12 17:12:58.027279+00	111	8
100	1	3000.00	INTERMEDIATE	CLOSED	\N	2025-12-12 18:06:57.663622+00	2025-12-12 18:06:58.200657+00	119	2
99	2	6000.00	INTERMEDIATE	CLOSED	\N	2025-12-12 18:06:57.661984+00	2025-12-12 18:06:58.266668+00	119	1
101	2	8000.00	INTERMEDIATE	OPEN	Need 2 plumbers for bathroom pipes	2025-12-12 20:18:08.752786+00	2025-12-12 20:18:08.752797+00	120	1
102	1	4000.00	EXPERT	OPEN	Need 1 electrician for wiring	2025-12-12 20:18:08.755387+00	2025-12-12 20:18:08.755394+00	120	2
103	2	8000.00	INTERMEDIATE	PARTIALLY_FILLED	Need 2 plumbers for bathroom pipes	2025-12-12 20:19:10.54404+00	2025-12-12 20:19:11.851238+00	121	1
107	2	8000.00	INTERMEDIATE	FILLED	Need 2 plumbers for bathroom pipes	2025-12-12 20:22:11.45195+00	2025-12-12 20:22:13.327048+00	123	1
106	1	4000.00	EXPERT	CLOSED	Need 1 electrician for wiring	2025-12-12 20:21:28.066247+00	2025-12-12 20:21:29.153965+00	122	2
108	1	4000.00	EXPERT	FILLED	Need 1 electrician for wiring	2025-12-12 20:22:11.45357+00	2025-12-12 20:22:13.383196+00	123	2
109	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-12 20:32:37.915843+00	2025-12-12 20:32:37.915856+00	124	1
110	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-12 20:32:37.918811+00	2025-12-12 20:32:37.918821+00	124	2
111	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-12 20:33:57.697108+00	2025-12-12 20:33:57.697115+00	125	1
112	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-12 20:33:57.698839+00	2025-12-12 20:33:57.698844+00	125	2
113	2	10000.00	INTERMEDIATE	OPEN	Need experience with kitchen sink installation	2025-12-12 20:37:48.045767+00	2025-12-12 20:37:48.045776+00	126	1
114	1	5000.00	EXPERT	OPEN	Must have experience for outlet installation	2025-12-12 20:37:48.04816+00	2025-12-12 20:37:48.048169+00	126	2
116	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 20:38:35.491118+00	2025-12-12 20:38:35.741743+00	127	2
115	2	10000.00	INTERMEDIATE	PARTIALLY_FILLED	Need experience with kitchen sink installation	2025-12-12 20:38:35.489324+00	2025-12-12 20:38:35.804856+00	127	1
118	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 20:39:32.550457+00	2025-12-12 20:39:32.804725+00	128	2
117	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-12 20:39:32.548603+00	2025-12-12 20:39:33.401197+00	128	1
119	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-12 20:42:21.511234+00	2025-12-12 20:42:22.553761+00	129	1
120	1	5000.00	EXPERT	CLOSED	Must have experience for outlet installation	2025-12-12 20:42:21.513177+00	2025-12-12 20:42:21.762973+00	129	2
125	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-12 20:50:04.90922+00	2025-12-12 20:50:06.354446+00	132	1
126	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 20:50:04.910839+00	2025-12-12 20:50:06.406643+00	132	2
121	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-12 20:45:26.255925+00	2025-12-12 20:45:27.408028+00	130	1
122	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 20:45:26.257865+00	2025-12-12 20:45:27.463325+00	130	2
160	2	10120.00	INTERMEDIATE	FILLED	\N	2025-12-16 02:27:12.967524+00	2025-12-16 04:59:49.249425+00	166	8
123	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-12 20:49:24.186599+00	2025-12-12 20:49:25.437065+00	131	1
124	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-12 20:49:24.188612+00	2025-12-12 20:49:25.487646+00	131	2
156	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-13 02:51:28.16311+00	2025-12-13 02:51:30.015147+00	164	1
157	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-13 02:51:28.166143+00	2025-12-13 02:51:30.082392+00	164	2
158	2	10000.00	INTERMEDIATE	FILLED	Need experience with kitchen sink installation	2025-12-13 02:53:39.32383+00	2025-12-13 02:53:41.032587+00	165	1
159	1	5000.00	EXPERT	FILLED	Must have experience for outlet installation	2025-12-13 02:53:39.325659+00	2025-12-13 02:53:41.106816+00	165	2
\.


--
-- Data for Name: job_worker_assignments; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.job_worker_assignments ("assignmentID", slot_position, assignment_status, worker_marked_complete, worker_marked_complete_at, completion_notes, individual_rating, "assignedAt", "updatedAt", "jobID_id", "skillSlotID_id", "workerID_id", client_confirmed_arrival, client_confirmed_arrival_at) FROM stdin;
1	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:31:12.921734+00	2025-12-10 17:31:12.921742+00	65	28	11	f	\N
2	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:31:12.98548+00	2025-12-10 17:31:12.985487+00	65	27	10	f	\N
3	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:33:44.43008+00	2025-12-10 17:33:44.430088+00	66	30	11	f	\N
4	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:33:44.491954+00	2025-12-10 17:33:44.491962+00	66	29	10	f	\N
5	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:34:07.528345+00	2025-12-10 17:34:07.528353+00	67	32	11	f	\N
6	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:34:07.598077+00	2025-12-10 17:34:07.598084+00	67	31	10	f	\N
7	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:36:09.117302+00	2025-12-10 17:36:09.117309+00	68	34	11	f	\N
8	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:36:09.181446+00	2025-12-10 17:36:09.181455+00	68	33	10	f	\N
9	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:45:08.619388+00	2025-12-10 17:45:08.619398+00	70	37	10	f	\N
10	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:45:08.71154+00	2025-12-10 17:45:08.711554+00	70	38	9	f	\N
11	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:48:25.008597+00	2025-12-10 17:48:25.008606+00	71	39	10	f	\N
12	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:48:25.075494+00	2025-12-10 17:48:25.075503+00	71	40	9	f	\N
13	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:58:20.035704+00	2025-12-10 17:58:20.035712+00	72	41	10	f	\N
14	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:58:20.109199+00	2025-12-10 17:58:20.109209+00	72	42	9	f	\N
15	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:59:29.967851+00	2025-12-10 17:59:29.967862+00	73	43	10	f	\N
16	1	ACTIVE	f	\N	\N	\N	2025-12-10 17:59:30.086046+00	2025-12-10 17:59:30.086054+00	73	44	9	f	\N
17	1	ACTIVE	f	\N	\N	\N	2025-12-12 04:29:59.014673+00	2025-12-12 04:29:59.014687+00	78	47	11	f	\N
18	1	ACTIVE	f	\N	\N	\N	2025-12-12 04:29:59.083871+00	2025-12-12 04:29:59.083879+00	78	46	10	f	\N
19	1	ACTIVE	f	\N	\N	\N	2025-12-12 09:14:44.346316+00	2025-12-12 09:14:44.346325+00	84	55	13	f	\N
20	1	COMPLETED	t	2025-12-12 09:17:53.477442+00	Work completed by Worker 1. All Plumbing tasks finished successfully.	\N	2025-12-12 09:17:53.250524+00	2025-12-12 09:17:53.47754+00	85	57	13	f	\N
21	2	COMPLETED	t	2025-12-12 09:17:53.528123+00	Work completed by Worker 2. All Plumbing tasks finished successfully.	\N	2025-12-12 09:17:53.308193+00	2025-12-12 09:17:53.52819+00	85	57	10	f	\N
22	1	COMPLETED	t	2025-12-12 09:17:53.575317+00	Work completed by Worker 3. All Electrical tasks finished successfully.	\N	2025-12-12 09:17:53.366993+00	2025-12-12 09:17:53.575407+00	85	58	11	f	\N
38	1	COMPLETED	t	2025-12-12 17:09:25.966127+00	\N	\N	2025-12-12 17:09:24.85595+00	2025-12-12 17:09:25.966217+00	107	77	15	f	\N
37	1	COMPLETED	t	2025-12-12 17:09:26.058881+00	\N	\N	2025-12-12 17:09:24.785527+00	2025-12-12 17:09:26.058991+00	107	76	16	f	\N
23	1	COMPLETED	t	2025-12-12 09:19:05.398647+00	Work completed by Worker 1. All Plumbing tasks finished successfully.	\N	2025-12-12 09:19:05.151827+00	2025-12-12 09:19:05.398718+00	86	59	13	f	\N
24	2	COMPLETED	t	2025-12-12 09:19:05.448772+00	Work completed by Worker 2. All Plumbing tasks finished successfully.	\N	2025-12-12 09:19:05.217163+00	2025-12-12 09:19:05.448845+00	86	59	10	f	\N
25	1	COMPLETED	t	2025-12-12 09:19:05.501006+00	Work completed by Worker 3. All Electrical tasks finished successfully.	\N	2025-12-12 09:19:05.287093+00	2025-12-12 09:19:05.501077+00	86	60	11	f	\N
53	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:04:04.413814+00	2025-12-12 18:04:04.413822+00	116	94	11	f	\N
54	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:04:04.476921+00	2025-12-12 18:04:04.476931+00	116	93	10	f	\N
26	1	COMPLETED	t	2025-12-12 09:19:57.63293+00	Work completed by Worker 1. All Plumbing tasks finished successfully.	\N	2025-12-12 09:19:57.411213+00	2025-12-12 09:19:57.632998+00	87	61	13	f	\N
27	2	COMPLETED	t	2025-12-12 09:19:57.680527+00	Work completed by Worker 2. All Plumbing tasks finished successfully.	\N	2025-12-12 09:19:57.469297+00	2025-12-12 09:19:57.680602+00	87	61	10	f	\N
28	1	COMPLETED	t	2025-12-12 09:19:57.729268+00	Work completed by Worker 3. All Electrical tasks finished successfully.	\N	2025-12-12 09:19:57.526846+00	2025-12-12 09:19:57.729341+00	87	62	11	f	\N
29	1	ACTIVE	f	\N	\N	\N	2025-12-12 09:24:10.114165+00	2025-12-12 09:24:10.114175+00	88	63	13	f	\N
30	1	ACTIVE	f	\N	\N	\N	2025-12-12 15:37:57.282827+00	2025-12-12 15:37:57.282836+00	101	65	9	f	\N
31	1	ACTIVE	f	\N	\N	\N	2025-12-12 17:06:38.669063+00	2025-12-12 17:06:38.669071+00	104	70	16	f	\N
32	1	ACTIVE	f	\N	\N	\N	2025-12-12 17:06:38.7413+00	2025-12-12 17:06:38.741351+00	104	71	15	f	\N
33	1	ACTIVE	f	\N	\N	\N	2025-12-12 17:06:42.911907+00	2025-12-12 17:06:42.911915+00	105	72	16	f	\N
34	1	ACTIVE	f	\N	\N	\N	2025-12-12 17:06:42.977429+00	2025-12-12 17:06:42.977437+00	105	73	15	f	\N
39	1	COMPLETED	t	2025-12-12 17:10:31.247558+00	\N	\N	2025-12-12 17:10:30.082787+00	2025-12-12 17:10:31.24763+00	108	78	16	f	\N
40	1	COMPLETED	t	2025-12-12 17:10:31.155005+00	\N	\N	2025-12-12 17:10:30.149036+00	2025-12-12 17:10:31.155101+00	108	79	15	f	\N
35	1	COMPLETED	t	2025-12-12 17:08:22.970044+00	\N	\N	2025-12-12 17:08:21.998889+00	2025-12-12 17:08:22.970165+00	106	74	16	f	\N
36	1	COMPLETED	t	2025-12-12 17:08:22.865588+00	\N	\N	2025-12-12 17:08:22.072047+00	2025-12-12 17:08:22.865706+00	106	75	15	f	\N
47	1	COMPLETED	t	2025-12-12 17:14:43.857458+00	\N	\N	2025-12-12 17:14:42.966008+00	2025-12-12 17:14:43.857545+00	112	86	16	f	\N
48	1	COMPLETED	t	2025-12-12 17:14:43.766943+00	\N	\N	2025-12-12 17:14:43.030768+00	2025-12-12 17:14:43.767022+00	112	87	15	f	\N
41	1	COMPLETED	t	2025-12-12 17:11:37.215331+00	\N	\N	2025-12-12 17:11:36.060791+00	2025-12-12 17:11:37.215422+00	109	80	16	f	\N
42	1	COMPLETED	t	2025-12-12 17:11:37.12552+00	\N	\N	2025-12-12 17:11:36.125585+00	2025-12-12 17:11:37.125604+00	109	81	15	f	\N
43	1	COMPLETED	t	2025-12-12 17:12:09.78504+00	\N	\N	2025-12-12 17:12:08.975864+00	2025-12-12 17:12:09.785109+00	110	82	16	f	\N
44	1	COMPLETED	t	2025-12-12 17:12:09.699192+00	\N	\N	2025-12-12 17:12:09.038857+00	2025-12-12 17:12:09.699297+00	110	83	15	f	\N
55	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:05:11.270336+00	2025-12-12 18:05:11.270344+00	118	97	9	f	\N
56	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:05:11.332412+00	2025-12-12 18:05:11.332423+00	118	98	11	f	\N
45	1	COMPLETED	t	2025-12-12 17:12:58.022132+00	\N	\N	2025-12-12 17:12:56.846391+00	2025-12-12 17:12:58.022258+00	111	84	16	f	\N
46	1	COMPLETED	t	2025-12-12 17:12:57.929775+00	\N	\N	2025-12-12 17:12:56.91032+00	2025-12-12 17:12:57.929857+00	111	85	15	f	\N
49	1	COMPLETED	t	2025-12-12 17:19:55.142147+00	\N	\N	2025-12-12 17:19:53.910392+00	2025-12-12 17:19:55.142219+00	113	88	16	f	\N
50	1	COMPLETED	t	2025-12-12 17:19:55.054705+00	\N	\N	2025-12-12 17:19:53.978188+00	2025-12-12 17:19:55.054776+00	113	89	15	f	\N
57	2	ACTIVE	f	\N	\N	\N	2025-12-12 18:05:11.392317+00	2025-12-12 18:05:11.392327+00	118	97	10	f	\N
58	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:06:58.134539+00	2025-12-12 18:06:58.134548+00	119	99	9	f	\N
51	1	COMPLETED	t	2025-12-12 17:20:29.391177+00	\N	\N	2025-12-12 17:20:28.129145+00	2025-12-12 17:20:29.391257+00	114	90	16	f	\N
52	1	COMPLETED	t	2025-12-12 17:20:29.299478+00	\N	\N	2025-12-12 17:20:28.19258+00	2025-12-12 17:20:29.299579+00	114	91	15	f	\N
59	1	ACTIVE	f	\N	\N	\N	2025-12-12 18:06:58.196435+00	2025-12-12 18:06:58.196446+00	119	100	11	f	\N
60	2	ACTIVE	f	\N	\N	\N	2025-12-12 18:06:58.263191+00	2025-12-12 18:06:58.2632+00	119	99	10	f	\N
61	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:19:11.718787+00	2025-12-12 20:19:11.718797+00	121	104	9	f	\N
62	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:19:11.846763+00	2025-12-12 20:19:11.846774+00	121	103	10	f	\N
63	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:21:29.149885+00	2025-12-12 20:21:29.149894+00	122	106	9	f	\N
64	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:21:29.21603+00	2025-12-12 20:21:29.21604+00	122	105	11	f	\N
65	2	ACTIVE	t	2025-12-12 20:21:29.804731+00	Work completed by Worker1 Test. All tasks finished successfully.	\N	2025-12-12 20:21:29.279885+00	2025-12-12 20:21:29.804801+00	122	105	10	f	\N
67	1	COMPLETED	t	2025-12-12 20:22:13.270183+00	Work completed by Worker2 Test. All tasks finished successfully.	\N	2025-12-12 20:22:12.649172+00	2025-12-12 20:22:13.270265+00	123	107	11	f	\N
68	2	COMPLETED	t	2025-12-12 20:22:13.321989+00	Work completed by Worker1 Test. All tasks finished successfully.	\N	2025-12-12 20:22:12.708432+00	2025-12-12 20:22:13.322071+00	123	107	10	f	\N
66	1	COMPLETED	t	2025-12-12 20:22:13.376504+00	Work completed by Worker3 Test. All tasks finished successfully.	\N	2025-12-12 20:22:12.587391+00	2025-12-12 20:22:13.376593+00	123	108	9	f	\N
69	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:38:35.737695+00	2025-12-12 20:38:35.737704+00	127	116	11	f	\N
70	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:38:35.80152+00	2025-12-12 20:38:35.801528+00	127	115	10	f	\N
71	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:39:32.800748+00	2025-12-12 20:39:32.800757+00	128	118	11	f	\N
72	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:39:32.864224+00	2025-12-12 20:39:32.864235+00	128	117	10	f	\N
73	2	ACTIVE	f	\N	\N	\N	2025-12-12 20:39:33.396193+00	2025-12-12 20:39:33.396204+00	128	117	9	f	\N
74	1	ACTIVE	f	\N	\N	\N	2025-12-12 20:42:21.758721+00	2025-12-12 20:42:21.758729+00	129	120	11	f	\N
76	2	ACTIVE	f	\N	\N	\N	2025-12-12 20:42:22.306861+00	2025-12-12 20:42:22.30687+00	129	119	9	f	\N
75	1	ACTIVE	t	2025-12-12 20:42:22.548437+00	\N	\N	2025-12-12 20:42:21.82113+00	2025-12-12 20:42:22.548506+00	129	119	10	f	\N
78	1	COMPLETED	t	2025-12-12 20:45:27.348525+00	\N	\N	2025-12-12 20:45:26.565541+00	2025-12-12 20:45:27.348612+00	130	121	10	f	\N
79	2	COMPLETED	t	2025-12-12 20:45:27.402972+00	\N	\N	2025-12-12 20:45:27.098416+00	2025-12-12 20:45:27.40308+00	130	121	9	f	\N
77	1	COMPLETED	t	2025-12-12 20:45:27.458197+00	\N	\N	2025-12-12 20:45:26.502325+00	2025-12-12 20:45:27.458284+00	130	122	11	f	\N
81	1	COMPLETED	t	2025-12-12 20:49:25.381608+00	\N	\N	2025-12-12 20:49:24.49266+00	2025-12-12 20:49:25.381676+00	131	123	10	f	\N
82	2	COMPLETED	t	2025-12-12 20:49:25.43219+00	\N	\N	2025-12-12 20:49:25.127289+00	2025-12-12 20:49:25.43227+00	131	123	9	f	\N
80	1	COMPLETED	t	2025-12-12 20:49:25.482658+00	\N	\N	2025-12-12 20:49:24.431616+00	2025-12-12 20:49:25.482727+00	131	124	11	f	\N
122	1	COMPLETED	t	2025-12-16 04:44:52.982063+00	\N	3.50	2025-12-16 02:29:06.833486+00	2025-12-16 04:44:52.982159+00	166	160	5	t	2025-12-16 04:33:32.273061+00
123	2	COMPLETED	t	2025-12-16 04:45:18.291999+00	\N	3.50	2025-12-16 02:29:09.343082+00	2025-12-16 04:45:18.292074+00	166	160	2	t	2025-12-16 04:33:38.078255+00
84	1	COMPLETED	t	2025-12-12 20:50:06.296794+00	\N	\N	2025-12-12 20:50:05.221887+00	2025-12-12 20:50:06.296888+00	132	125	10	f	\N
85	2	COMPLETED	t	2025-12-12 20:50:06.349162+00	\N	\N	2025-12-12 20:50:05.887172+00	2025-12-12 20:50:06.349261+00	132	125	9	f	\N
83	1	COMPLETED	t	2025-12-12 20:50:06.401605+00	\N	\N	2025-12-12 20:50:05.158282+00	2025-12-12 20:50:06.401687+00	132	126	11	f	\N
114	1	COMPLETED	t	2025-12-13 02:51:29.624209+00	\N	5.00	2025-12-13 02:51:28.530741+00	2025-12-13 02:51:29.624276+00	164	156	10	f	\N
115	2	COMPLETED	t	2025-12-13 02:51:29.675026+00	\N	5.00	2025-12-13 02:51:29.219476+00	2025-12-13 02:51:29.675097+00	164	156	9	f	\N
113	1	COMPLETED	t	2025-12-13 02:51:29.72758+00	\N	5.00	2025-12-13 02:51:28.465111+00	2025-12-13 02:51:29.727651+00	164	157	11	f	\N
117	1	COMPLETED	t	2025-12-13 02:53:40.64264+00	\N	5.00	2025-12-13 02:53:39.612651+00	2025-12-13 02:53:40.642731+00	165	158	10	f	\N
118	2	COMPLETED	t	2025-12-13 02:53:40.693659+00	\N	5.00	2025-12-13 02:53:40.249146+00	2025-12-13 02:53:40.69378+00	165	158	9	f	\N
116	1	COMPLETED	t	2025-12-13 02:53:40.742662+00	\N	5.00	2025-12-13 02:53:39.555805+00	2025-12-13 02:53:40.74273+00	165	159	11	f	\N
119	1	ACTIVE	f	\N	\N	\N	2025-12-16 01:49:31.563569+00	2025-12-16 01:49:31.563578+00	117	95	5	f	\N
120	1	ACTIVE	f	\N	\N	\N	2025-12-16 01:49:37.476116+00	2025-12-16 01:49:37.476123+00	117	96	2	f	\N
121	2	ACTIVE	f	\N	\N	\N	2025-12-16 01:49:41.52143+00	2025-12-16 01:49:41.521437+00	117	95	18	f	\N
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.jobs ("jobID", title, description, budget, location, "expectedDuration", urgency, "preferredStartDate", "materialsNeeded", status, "completedAt", "cancellationReason", "createdAt", "updatedAt", "assignedWorkerID_id", "categoryID_id", "clientID_id", "clientMarkedComplete", "clientMarkedCompleteAt", "workerMarkedComplete", "workerMarkedCompleteAt", "escrowAmount", "escrowPaid", "escrowPaidAt", "remainingPayment", "remainingPaymentPaid", "remainingPaymentPaidAt", "finalPaymentMethod", "cashPaymentProofUrl", "paymentMethodSelectedAt", "cashProofUploadedAt", "cashPaymentApproved", "cashPaymentApprovedAt", "cashPaymentApprovedBy_id", "assignedAgencyFK_id", "jobType", "inviteRejectionReason", "inviteRespondedAt", "inviteStatus", "clientConfirmedWorkStarted", "clientConfirmedWorkStartedAt", "assignedEmployeeID_id", "assignmentNotes", "employeeAssignedAt", is_team_job, budget_allocation_type, team_job_start_threshold, "paymentReleaseDate", "paymentReleasedToWorker", "paymentReleasedAt", "paymentHeldReason", job_scope, skill_level_required, work_environment) FROM stdin;
1	Grass Cut	Grass cut my lawn	500.00	Pasobolong, Zone 4	\N	MEDIUM	2025-11-03	[]	CANCELLED	\N	\N	2025-11-01 09:06:20.062361+00	2025-11-01 09:31:37.332485+00	\N	10	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
2	Grass Cut	Grass cut my lawn	500.00	Pasobolong, Zone 4	\N	MEDIUM	2025-11-03	[]	CANCELLED	\N	\N	2025-11-01 09:06:30.104334+00	2025-11-01 09:31:41.338104+00	\N	10	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
45	BUILD PAYA	HAUSHWBDHZHZBSBWBSJSJSBSIAIWJWNAJAJ	1500.00	BABAHAHAHAHAHAHAHAH, Cabatangan	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 09:21:09.019144+00	\N	2025-11-30 07:21:34.722239+00	2025-11-30 09:21:09.086697+00	\N	3	1	t	2025-11-30 09:13:58.986905+00	t	2025-11-30 09:13:49.877844+00	750.00	t	2025-11-30 07:21:34.721638+00	750.00	t	2025-11-30 09:14:00.000705+00	WALLET	\N	2025-11-30 09:13:58.98691+00	\N	f	\N	\N	8	INVITE	\N	2025-11-30 07:50:10.361269+00	ACCEPTED	t	2025-11-30 08:59:45.699064+00	1		2025-11-30 08:36:20.394757+00	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
5	PC Maintenance	MY PC SHIT	500.00	Boalan, Zamboanga City	2 Hours	MEDIUM	2025-11-05	[]	CANCELLED	\N	\N	2025-11-05 15:16:24.020112+00	2025-11-05 15:21:27.379422+00	\N	2	1	f	\N	f	\N	250.00	t	2025-11-05 15:16:24.019669+00	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
46	Fix Table	Table Broken	500.00	Phase 4, Cabaluay	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 11:01:22.491097+00	\N	2025-11-30 10:56:35.728781+00	2025-11-30 11:01:22.553174+00	2	3	1	t	2025-11-30 11:00:15.799628+00	t	2025-11-30 10:59:36.400806+00	250.00	t	2025-11-30 10:56:35.728104+00	250.00	t	2025-11-30 11:00:16.625918+00	WALLET	\N	2025-11-30 11:00:15.799634+00	\N	f	\N	\N	\N	INVITE	\N	2025-11-30 10:58:12.406876+00	ACCEPTED	t	2025-11-30 10:59:08.994847+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
33	KSLSKDNEME	NSNDBEBSN	500.00	LAOXKENENW, Cabaluay	KSOXJENENW	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-23 10:05:28.502839+00	2025-12-01 03:06:16.304776+00	2	5	1	f	\N	f	\N	250.00	t	2025-11-23 10:05:28.502358+00	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	INVITE	No reason provided	2025-12-01 03:06:16.182144+00	REJECTED	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
9	Test Payment	asdfasdfasdf	7749.97	Campo Islam, Zamboanga City	9 hours	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-05 19:33:57.768218+00	2025-11-05 19:41:38.126041+00	\N	11	1	f	\N	f	\N	3874.99	f	\N	3874.99	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
6	PC FIX	Maintenance	500.00	Capisan, Zamboanga City	2 hours	MEDIUM	2025-11-05	[]	COMPLETED	2025-11-06 05:14:20.552924+00	\N	2025-11-05 15:21:55.130468+00	2025-11-06 05:14:20.72815+00	2	2	1	t	2025-11-05 19:03:10.166104+00	t	2025-11-05 18:59:13.640308+00	250.00	f	\N	250.00	t	2025-11-05 19:08:31.295862+00	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
10	TESTTT	TESTT	7750.00	Cabatangan, Zamboanga City	54 hours	MEDIUM	\N	[]	COMPLETED	2025-11-06 05:33:00.165127+00	\N	2025-11-05 19:41:52.85812+00	2025-11-06 05:33:00.233954+00	2	10	1	t	2025-11-06 05:10:04.695435+00	t	2025-11-06 03:40:06.704186+00	3875.00	t	2025-11-05 19:41:52.857525+00	3875.00	t	2025-11-06 05:12:50.491792+00	GCASH	\N	2025-11-06 05:10:04.69544+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
4	Fix Table	My table... Its Broken	250.00	Canelar, Zamboanga City	3	MEDIUM	2025-11-04	[]	COMPLETED	2025-11-04 04:28:14.577932+00	\N	2025-11-03 10:56:57.489371+00	2025-11-06 08:00:55.16746+00	2	3	1	t	2025-11-04 04:28:14.577927+00	t	2025-11-04 04:23:14.890827+00	0.00	f	\N	0.00	t	2025-11-06 08:00:54.826111+00	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
11	TERST @2	dfadfa	3874.99	Baliwasan, Zamboanga City	5 hours	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-05 19:56:43.494226+00	2025-11-06 08:06:18.96749+00	\N	9	1	f	\N	f	\N	1937.50	f	\N	1937.50	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
35	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:50:23.560066+00	2025-11-25 23:50:23.560079+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
36	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:50:45.409826+00	2025-11-25 23:50:45.409835+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
7	Hi Gab	:))	600.00	Malagutay, Zamboanga City	4 hours	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-05 19:29:03.829615+00	2025-11-23 15:17:42.938748+00	2	8	1	t	2025-11-23 15:17:42.877824+00	t	2025-11-23 14:23:25.615475+00	250.00	f	\N	250.00	f	\N	CASH	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/user-uploads/users/7/jobs/7/proof/cash_proof_20251123_151740_673c12ba.jpg	2025-11-23 15:17:42.877829+00	2025-11-23 15:17:42.877831+00	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-11-23 14:03:33.527915+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
37	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:57:27.794555+00	2025-11-25 23:57:27.794566+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
38	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:58:43.450224+00	2025-11-25 23:58:43.450237+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
44	GEST AGENCY SHT	JSJDNDBDNDJSJ	500.00	SHES, Ayala	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 06:20:32.588015+00	\N	2025-11-26 06:36:18.409808+00	2025-11-30 06:20:32.648031+00	\N	5	1	t	2025-11-30 05:25:21.887765+00	t	2025-11-30 05:25:10.337986+00	250.00	t	2025-11-26 06:36:18.409198+00	250.00	t	2025-11-30 05:25:22.794684+00	WALLET	\N	2025-11-30 05:25:21.88777+00	\N	f	\N	\N	8	INVITE	\N	2025-11-26 06:36:35.556678+00	ACCEPTED	t	2025-11-30 05:12:20.021765+00	1		2025-11-26 08:58:30.824301+00	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
29	NSKSKSMS	nakskskwmns	1000.00	JAKSOXOXKSMSMD, Mangusu	\N	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-19 16:26:28.813959+00	2025-11-26 01:36:36.906188+00	2	3	1	f	\N	f	\N	500.00	t	2025-11-19 16:26:28.813317+00	500.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	INVITE	No reason provided	2025-11-26 01:36:36.790575+00	REJECTED	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
12	HELLO HELO	dfasdfasdf	399.98	Cacao, Zamboanga City	3 hours	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-06 08:06:49.689452+00	2025-11-26 05:44:30.545909+00	2	10	1	t	2025-11-26 05:44:29.648842+00	t	2025-11-26 05:44:01.325699+00	199.99	t	2025-11-06 08:06:49.689015+00	199.99	t	2025-11-26 05:44:30.48189+00	WALLET	\N	2025-11-26 05:44:29.648846+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-11-26 05:43:34.275372+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
34	KSLSKDNEME	NSNDBEBSN	500.00	LAOXKENENW, Cabaluay	KSOXJENENW	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-23 10:06:12.117208+00	2025-11-26 04:44:26.336896+00	2	5	1	t	2025-11-26 04:44:25.440438+00	t	2025-11-26 04:25:52.692313+00	250.00	t	2025-11-23 10:06:12.11672+00	250.00	t	2025-11-26 04:44:26.272167+00	CASH	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/user-uploads/users/7/jobs/34/proof/cash_proof_20251126_044423_7d9339ee.jpg	2025-11-26 04:44:25.440444+00	2025-11-26 04:44:25.440445+00	f	\N	\N	\N	INVITE	\N	2025-11-26 01:36:49.20945+00	ACCEPTED	t	2025-11-26 04:22:52.215181+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
47	KSKSKSNSNSN	KAISJSBEBENWJS	500.00	PRESA, Pasobolong	\N	MEDIUM	\N	[]	IN_PROGRESS	\N	\N	2025-12-01 16:57:20.11144+00	2025-12-01 16:58:54.937725+00	\N	5	1	f	\N	t	2025-12-01 16:58:54.936168+00	250.00	t	2025-12-01 16:57:20.110657+00	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	8	INVITE	\N	2025-12-01 16:58:11.827687+00	ACCEPTED	t	2025-12-01 16:58:46.485965+00	1		2025-12-01 16:58:18.282538+00	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
48	ANANANSNSNWNE WN	JAHSHSBSBSBSBSHHSUS	140.00	SHSHEBWBBS, Bunguiao	\N	MEDIUM	2025-12-09	[]	ACTIVE	\N	\N	2025-12-09 11:08:04.467707+00	2025-12-09 11:08:04.467717+00	\N	3	1	f	\N	f	\N	70.00	f	\N	70.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
49	Test Multi-Criteria Review Job	This is a test job to verify the multi-criteria review system works correctly. We need to test that all 4 rating categories are properly saved.	1500.00	123 Test St, Tetuan, Zamboanga City	2 hours	MEDIUM	\N	["test material"]	ACTIVE	\N	\N	2025-12-10 14:59:38.150892+00	2025-12-10 14:59:38.150901+00	\N	1	6	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
50	Test Multi-Criteria Review Job	This is a test job to verify the multi-criteria review system works correctly. We need to test that all 4 rating categories.	1500.00	123 Test St, Tetuan, Zamboanga City	2 hours	MEDIUM	\N	["test material"]	ACTIVE	\N	\N	2025-12-10 14:59:44.067535+00	2025-12-10 14:59:44.067543+00	\N	1	6	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
51	Test Multi-Criteria Review Job	This is a test job to verify the multi-criteria review system works correctly. We need to test that all 4 rating categories.	1500.00	123 Test St, Tetuan, Zamboanga City	2 hours	MEDIUM	\N	["test material"]	COMPLETED	\N	\N	2025-12-10 14:59:50.37832+00	2025-12-10 15:05:48.67764+00	8	1	6	t	2025-12-10 15:05:48.623797+00	t	2025-12-10 15:05:30.812527+00	750.00	t	2025-12-10 15:04:19.076212+00	750.00	t	2025-12-10 15:05:48.676084+00	WALLET	\N	2025-12-10 15:05:48.623802+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-12-10 15:05:20.23023+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
55	Home Renovation TEST 1765386233	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:03:53.239304+00	2025-12-10 17:03:53.239311+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
56	Home Renovation TEST 1765386297	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:04:57.540048+00	2025-12-10 17:04:57.540056+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
57	Home Renovation TEST 1765386358	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:05:58.475374+00	2025-12-10 17:05:58.475382+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
58	Home Renovation TEST 1765386431	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:07:11.687181+00	2025-12-10 17:07:11.687189+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
59	Home Renovation TEST 1765386485	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:08:05.448724+00	2025-12-10 17:08:05.44873+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
60	Home Renovation TEST 1765386528	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:08:48.822542+00	2025-12-10 17:08:48.822551+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
61	Home Renovation TEST 1765386590	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:09:50.906238+00	2025-12-10 17:09:50.906246+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
62	Home Renovation TEST 1765386652	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:10:52.967146+00	2025-12-10 17:10:52.967154+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
63	Home Renovation TEST 1765387060	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:17:40.309886+00	2025-12-10 17:17:40.309894+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
64	Home Renovation TEST 1765387184	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:19:44.400472+00	2025-12-10 17:19:44.400479+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
65	Home Renovation TEST 1765387872	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:31:12.663227+00	2025-12-10 17:31:12.663236+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
66	Home Renovation TEST 1765388024	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:33:44.191092+00	2025-12-10 17:33:44.191099+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
67	Home Renovation TEST 1765388047	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:34:07.249268+00	2025-12-10 17:34:07.249276+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
68	Home Renovation TEST 1765388168	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-10 17:36:08.872685+00	2025-12-10 17:36:08.872693+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
69	Accept/Reject Test Job 1765388672	Test job for verifying accept and reject functions.	10000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-10 17:44:32.933619+00	2025-12-10 17:44:32.933629+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
70	Accept/Reject Test Job 1765388708	Test job for verifying accept and reject functions.	10000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-10 17:45:08.336072+00	2025-12-10 17:45:08.336084+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
71	Accept/Reject Test 1765388904	Test job for accept/reject verification.	10000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-10 17:48:24.748697+00	2025-12-10 17:48:24.748706+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
72	Accept/Reject Test 1765389499	Test job for accept/reject verification.	10000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-10 17:58:19.736446+00	2025-12-10 17:58:19.736454+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
73	Accept/Reject Test 1765389569	Test job for accept/reject verification.	10000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-10 17:59:29.686331+00	2025-12-10 17:59:29.686338+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
75	Fix Kitchen Faucet	Kitchen faucet leaking badly needs repair.	1500.00	Zamboanga City	\N	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-12-11 16:32:35.786561+00	2025-12-11 16:36:15.74807+00	13	3	10	t	2025-12-11 16:36:15.672947+00	t	2025-12-11 16:36:10.243326+00	750.00	t	2025-12-11 16:35:28.686013+00	750.00	t	2025-12-11 16:36:15.745806+00	WALLET	\N	2025-12-11 16:36:15.672952+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-12-11 16:36:02.965576+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	2025-12-18 16:36:15.733981+00	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
76	Home Renovation	Complete renovation	50000.00	Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-11 18:26:08.9476+00	2025-12-11 18:26:08.947626+00	\N	\N	12	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
78	Home Renovation TEST 1765513798	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 04:29:58.710821+00	2025-12-12 04:29:58.71084+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
79	TEST - Team Job API Check	This is a test to verify the team job creation endpoint is working. Need multiple skilled workers for this project.	5000.00	Test Location, Zamboanga City	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 05:04:24.135265+00	2025-12-12 05:04:24.135273+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
80	Fix Leaking Faucet - Test 090653	Kitchen sink faucet has been leaking for a week. Need professional plumber to fix it. Materials may be needed. This is a test job posting to verify the job creation endpoint is working correctly.	1500.00	123 Test Street, Tetuan, Zamboanga City	2 hours	MEDIUM	2025-12-14	["Pipe wrench", "Teflon tape", "New faucet parts"]	ACTIVE	\N	\N	2025-12-12 09:06:53.48075+00	2025-12-12 09:06:53.480764+00	\N	1	10	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
81	Home Renovation Team - Test 090653	Complete home renovation requiring multiple skilled workers. Need plumbers for bathroom, electricians for wiring, and painters for walls. This is a comprehensive project requiring coordination between different specializations. Test job to verify team mode implementation.	15000.00	456 Renovation Ave, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-19	["Various plumbing supplies", "Electrical wiring", "Paint"]	ACTIVE	\N	\N	2025-12-12 09:06:53.541814+00	2025-12-12 09:06:53.541821+00	\N	\N	10	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
82	Team Mode Test - 091242	Testing all team mode features: worker applications, assignments, individual completion tracking, and final approval. This job requires multiple workers across different specializations.	10000.00	789 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-19	[]	ACTIVE	\N	\N	2025-12-12 09:12:42.313003+00	2025-12-12 09:12:42.313009+00	\N	\N	10	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
83	Team Mode Test - 091358	Testing all team mode features: worker applications, assignments, individual completion tracking, and final approval. This job requires multiple workers across different specializations.	10000.00	789 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-19	[]	ACTIVE	\N	\N	2025-12-12 09:13:58.267948+00	2025-12-12 09:13:58.267957+00	\N	\N	10	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
84	Team Mode Test - 091443	Testing all team mode features: worker applications, assignments, individual completion tracking, and final approval. This job requires multiple workers across different specializations.	10000.00	789 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-19	[]	ACTIVE	\N	\N	2025-12-12 09:14:43.909886+00	2025-12-12 09:14:43.909893+00	\N	\N	10	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
85	Complete Team Flow Test - 171752	Full end-to-end team mode test including multi-worker reviews. Testing complete lifecycle from creation to individual worker reviews.	9000.00	Test Location, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-13	[]	COMPLETED	\N	\N	2025-12-12 09:17:52.26282+00	2025-12-12 09:17:53.621628+00	\N	\N	10	t	2025-12-12 09:17:53.620524+00	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
86	Complete Team Flow Test - 171904	Full end-to-end team mode test including multi-worker reviews. Testing complete lifecycle from creation to individual worker reviews.	9000.00	Test Location, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-13	[]	COMPLETED	\N	\N	2025-12-12 09:19:04.124109+00	2025-12-12 09:19:05.551599+00	\N	\N	10	t	2025-12-12 09:19:05.550309+00	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
87	Complete Team Flow Test - 171956	Full end-to-end team mode test including multi-worker reviews. Testing complete lifecycle from creation to individual worker reviews.	9000.00	Test Location, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-13	[]	COMPLETED	\N	\N	2025-12-12 09:19:56.424665+00	2025-12-12 09:19:57.776636+00	\N	\N	10	t	2025-12-12 09:19:57.775587+00	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
88	RN Test - Team Job 172409	Testing React Native integration for team mode. This job requires multiple workers with different specializations.	12000.00	Test Location, Zamboanga City	\N	MEDIUM	2025-12-15	["Tools", "Supplies"]	ACTIVE	\N	\N	2025-12-12 09:24:09.6542+00	2025-12-12 09:24:09.654207+00	\N	\N	10	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
89	Review Test Job 1	Testing multi-category review system	2000.00	Test Location	\N	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-12-12 09:31:15.516541+00	2025-12-12 09:31:15.51655+00	13	1	10	t	\N	t	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
90	Review Test Job 2	Testing multi-category review system	2000.00	Test Location	\N	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-12-12 09:31:15.526536+00	2025-12-12 09:31:15.526544+00	13	1	10	t	\N	t	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
77	Fix leaking Pipes	Pipes have been busted for 3 weeks now, and i need to get it fixed i have a party set up in 5 days I need it ASAP, top priority	250.00	BALIWASAN, Baliwasan	\N	MEDIUM	\N	[]	COMPLETED	2025-12-13 04:58:26.064187+00	\N	2025-12-12 04:11:35.548185+00	2025-12-13 04:58:26.06579+00	2	1	1	t	2025-12-13 04:38:02.257565+00	t	2025-12-13 04:37:29.596652+00	125.00	t	2025-12-13 04:36:58.720815+00	125.00	t	2025-12-13 04:38:02.305228+00	WALLET	\N	2025-12-13 04:38:02.257569+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-12-13 04:37:08.727909+00	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	2025-12-20 04:38:02.297035+00	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
108	Team Mode Test Job #1765559429	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	\N	\N	2025-12-12 17:10:29.766986+00	2025-12-12 17:10:31.302179+00	\N	\N	15	t	2025-12-12 17:10:31.30051+00	t	2025-12-12 17:10:31.300513+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
97	Payment Buffer API Test - 21:09:43	Testing payment buffer APIs. This job will test the backjob request functionality.	1500.00	Test Location, Zamboanga City	2 hours	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 13:09:43.307767+00	2025-12-12 13:09:43.307773+00	\N	1	10	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
98	Payment Buffer API Test - 21:12:40	Testing payment buffer APIs. This job will test the backjob request functionality.	1500.00	Test Location, Zamboanga City	2 hours	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 13:12:41.065672+00	2025-12-12 13:12:41.065679+00	\N	1	10	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
99	Payment Buffer API Test - 21:13:44	Testing payment buffer APIs. This job will test the backjob request functionality.	1500.00	Test Location, Zamboanga City	2 hours	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 13:13:44.962225+00	2025-12-12 13:13:44.962231+00	\N	1	10	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
100	Payment Buffer API Test - 21:16:02	Testing payment buffer APIs. This job will test the backjob request functionality.	1500.00	Test Location, Zamboanga City	2 hours	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 13:16:02.358668+00	2025-12-12 13:16:02.358675+00	\N	1	10	f	\N	f	\N	750.00	f	\N	750.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	f	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
101	Quick Home Repair	Need two workers for quick home repairs	450.00	123 Test St, Zamboanga City	\N	LOW	\N	[]	ACTIVE	\N	\N	2025-12-12 15:36:04.946066+00	2025-12-12 15:36:04.946075+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
103	Team Mode Test Job #1765559043	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 17:04:03.61339+00	2025-12-12 17:04:03.613399+00	\N	\N	15	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
104	Team Mode Test Job #1765559198	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 17:06:38.349341+00	2025-12-12 17:06:38.349348+00	\N	\N	15	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
105	Team Mode Test Job #1765559202	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 17:06:42.549383+00	2025-12-12 17:06:42.549392+00	\N	\N	15	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
106	Team Mode Test Job #1765559301	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	\N	\N	2025-12-12 17:08:21.6704+00	2025-12-12 17:08:23.027332+00	\N	\N	15	t	2025-12-12 17:08:23.025777+00	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
107	Team Mode Test Job #1765559364	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	\N	\N	2025-12-12 17:09:24.464887+00	2025-12-12 17:09:26.114266+00	\N	\N	15	t	2025-12-12 17:09:26.112523+00	t	2025-12-12 17:09:26.112528+00	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
109	Team Mode Test Job #1765559495	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	\N	\N	2025-12-12 17:11:35.747549+00	2025-12-12 17:11:37.268855+00	\N	\N	15	t	2025-12-12 17:11:37.26745+00	t	2025-12-12 17:11:37.267454+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
110	Team Mode Test Job #1765559528	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	\N	\N	2025-12-12 17:12:08.669173+00	2025-12-12 17:12:09.835535+00	\N	\N	15	t	2025-12-12 17:12:09.83392+00	t	2025-12-12 17:12:09.833926+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
111	Team Mode Test Job #1765559576	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 17:12:58.445339+00	\N	2025-12-12 17:12:56.547139+00	2025-12-12 17:12:58.446748+00	\N	\N	15	t	2025-12-12 17:12:58.074317+00	t	2025-12-12 17:12:58.074322+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
112	Team Mode Test Job #1765559682	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 17:14:44.205854+00	\N	2025-12-12 17:14:42.640587+00	2025-12-12 17:14:44.207421+00	\N	\N	15	t	2025-12-12 17:14:43.908185+00	t	2025-12-12 17:14:43.908191+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
113	Team Mode Test Job #1765559993	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 17:19:55.615762+00	\N	2025-12-12 17:19:53.597533+00	2025-12-12 17:19:55.617615+00	\N	\N	15	t	2025-12-12 17:19:55.192954+00	t	2025-12-12 17:19:55.192959+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
114	Team Mode Test Job #1765560027	Comprehensive team job test. This job requires multiple skilled workers to complete a home renovation project. Testing team group conversations, individual completion tracking, and multi-worker reviews.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 17:20:29.840656+00	\N	2025-12-12 17:20:27.830977+00	2025-12-12 17:20:29.842127+00	\N	\N	15	t	2025-12-12 17:20:29.44174+00	t	2025-12-12 17:20:29.441743+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
115	Fix THIS SHITTT NOWWWW	NIKKI ANNOYING SOOOOOOOOOO ANNOYINGGGGGGGGGGGGGGGGGGGGGGGGG	140.00	ZONE 5, Calabasa, Zamboanga City	\N	HIGH	\N	[]	IN_PROGRESS	\N	\N	2025-12-12 17:27:29.261948+00	2025-12-12 17:52:05.221727+00	2	\N	1	f	\N	f	\N	0.00	t	2025-12-12 17:52:05.21308+00	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
116	Home Renovation TEST 1765562644	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 18:04:04.134212+00	2025-12-12 18:04:04.134219+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
117	Conversation Test 1765562689	Test that conversation is created on job start.	9000.00	Test Location	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-12-12 18:04:49.086101+00	2025-12-12 18:04:49.08612+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
118	Conversation Test 1765562710	Test that conversation is created on job start.	9000.00	Test Location	\N	MEDIUM	\N	[]	IN_PROGRESS	\N	\N	2025-12-12 18:05:10.789536+00	2025-12-12 18:05:11.60916+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
119	Conversation Test 1765562817	Test that conversation is created on job start.	9000.00	Test Location	\N	MEDIUM	\N	[]	IN_PROGRESS	\N	\N	2025-12-12 18:06:57.658164+00	2025-12-12 18:06:58.478434+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
120	RN Flow Test - Home Renovation 041808	Complete bathroom and kitchen renovation. Need skilled workers for plumbing and electrical work. This is a team job test from React Native flow simulation. Minimum 50 characters for description validation.	12000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-15	[]	ACTIVE	\N	\N	2025-12-12 20:18:08.746354+00	2025-12-12 20:18:08.746364+00	\N	\N	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
121	RN Flow Test - Home Renovation 041910	Complete bathroom and kitchen renovation. Need skilled workers for plumbing and electrical work. This is a team job test from React Native flow simulation. Minimum 50 characters for description validation.	12000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-15	[]	ACTIVE	\N	\N	2025-12-12 20:19:10.539791+00	2025-12-12 20:19:10.539798+00	\N	\N	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
122	RN Flow Test - Home Renovation 042128	Complete bathroom and kitchen renovation. Need skilled workers for plumbing and electrical work. This is a team job test from React Native flow simulation. Minimum 50 characters for description validation.	12000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-15	[]	IN_PROGRESS	\N	\N	2025-12-12 20:21:28.060574+00	2025-12-12 20:21:29.340597+00	\N	\N	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
127	Home Renovation TEST 1765571915	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 20:38:35.485392+00	2025-12-12 20:38:35.4854+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
123	RN Flow Test - Home Renovation 042211	Complete bathroom and kitchen renovation. Need skilled workers for plumbing and electrical work. This is a team job test from React Native flow simulation. Minimum 50 characters for description validation.	12000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-15	[]	COMPLETED	2025-12-12 20:22:13.671251+00	\N	2025-12-12 20:22:11.447698+00	2025-12-12 20:22:13.673099+00	\N	\N	1	t	2025-12-12 20:22:13.431104+00	t	2025-12-12 20:22:13.431109+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
124	Home Renovation TEST 1765571557	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 20:32:37.909945+00	2025-12-12 20:32:37.909954+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
125	Home Renovation TEST 1765571637	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 20:33:57.693079+00	2025-12-12 20:33:57.693088+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
126	Home Renovation TEST 1765571867	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 20:37:48.042007+00	2025-12-12 20:37:48.042016+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
128	Home Renovation TEST 1765571972	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	ACTIVE	\N	\N	2025-12-12 20:39:32.544083+00	2025-12-12 20:39:32.54409+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
129	Home Renovation TEST 1765572141	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	IN_PROGRESS	\N	\N	2025-12-12 20:42:21.507698+00	2025-12-12 20:42:22.416847+00	\N	\N	8	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
130	Home Renovation TEST 1765572326	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 20:45:27.990641+00	\N	2025-12-12 20:45:26.252355+00	2025-12-12 20:45:27.992183+00	\N	\N	8	t	2025-12-12 20:45:27.510598+00	t	2025-12-12 20:45:27.510604+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
164	Home Renovation TEST 1765594288	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-13 02:51:30.257307+00	\N	2025-12-13 02:51:28.156469+00	2025-12-13 02:51:30.258761+00	\N	\N	8	t	2025-12-13 02:51:29.77657+00	t	2025-12-13 02:51:29.776575+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
131	Home Renovation TEST 1765572564	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 20:49:26.025034+00	\N	2025-12-12 20:49:24.181789+00	2025-12-12 20:49:26.026957+00	\N	\N	8	t	2025-12-12 20:49:25.533181+00	t	2025-12-12 20:49:25.533186+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
165	Home Renovation TEST 1765594419	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-13 02:53:41.285125+00	\N	2025-12-13 02:53:39.320313+00	2025-12-13 02:53:41.286489+00	\N	\N	8	t	2025-12-13 02:53:40.791072+00	t	2025-12-13 02:53:40.791077+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
132	Home Renovation TEST 1765572604	Complete renovation of kitchen and bathroom. Need skilled workers for plumbing and electrical work. Kitchen sink replacement, new faucets, electrical outlet installation, and lighting fixtures.	15000.00	123 Test Street, Tetuan, Zamboanga City	\N	MEDIUM	2025-12-20	[]	COMPLETED	2025-12-12 20:50:06.954956+00	\N	2025-12-12 20:50:04.905621+00	2025-12-12 20:50:06.956346+00	\N	\N	8	t	2025-12-12 20:50:06.458124+00	t	2025-12-12 20:50:06.45813+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
166	FIX CAR AT HOME	I NEED TOU TO FIX THE CAR THAT’s STUCK AT HOME I’ll need 2 people to work on it	10120.00	PRESA, Cabatangan, Zamboanga City	\N	MEDIUM	\N	[]	COMPLETED	2025-12-16 05:13:23.503095+00	\N	2025-12-16 02:27:12.961519+00	2025-12-16 05:13:23.504295+00	\N	\N	1	t	2025-12-16 04:46:12.255448+00	t	2025-12-16 04:46:12.255452+00	0.00	f	\N	0.00	t	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N	t	EQUAL_PER_WORKER	100.00	\N	f	\N	BUFFER_PERIOD	MINOR_REPAIR	INTERMEDIATE	INDOOR
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.message ("messageID", "messageText", "messageType", "locationAddress", "locationLandmark", "locationLatitude", "locationLongitude", "isRead", "readAt", "createdAt", "conversationID_id", sender_id, "senderAgency_id") FROM stdin;
2	Application accepted! You can now chat about the job: Fix Table	SYSTEM	\N	\N	\N	\N	t	2025-11-03 11:34:54.835794+00	2025-11-03 11:32:20.936487+00	2	3	\N
3	Hey	TEXT	\N	\N	\N	\N	t	2025-11-03 12:00:22.381679+00	2025-11-03 11:59:37.16938+00	2	3	\N
4	Fuck you	TEXT	\N	\N	\N	\N	t	2025-11-03 12:00:38.322737+00	2025-11-03 12:00:37.111339+00	2	3	\N
5	Bitch	TEXT	\N	\N	\N	\N	t	2025-11-03 12:01:33.615851+00	2025-11-03 12:00:45.466372+00	2	2	\N
6	Fix my table	TEXT	\N	\N	\N	\N	t	2025-11-03 12:02:31.284524+00	2025-11-03 12:02:19.161581+00	2	2	\N
8	FUCK	TEXT	\N	\N	\N	\N	t	2025-11-03 12:03:33.123241+00	2025-11-03 12:02:41.415081+00	2	2	\N
11	NO	TEXT	\N	\N	\N	\N	t	2025-11-03 12:03:33.123241+00	2025-11-03 12:03:15.559584+00	2	2	\N
13	ULOL	TEXT	\N	\N	\N	\N	t	2025-11-03 12:03:33.123241+00	2025-11-03 12:03:25.661164+00	2	2	\N
7	I dont want to	TEXT	\N	\N	\N	\N	t	2025-11-03 12:05:08.534777+00	2025-11-03 12:02:36.615904+00	2	3	\N
9	tangina	TEXT	\N	\N	\N	\N	t	2025-11-03 12:05:08.534777+00	2025-11-03 12:02:47.854641+00	2	3	\N
10	Suck my balls	TEXT	\N	\N	\N	\N	t	2025-11-03 12:05:08.534777+00	2025-11-03 12:03:11.172896+00	2	3	\N
12	ULOL	TEXT	\N	\N	\N	\N	t	2025-11-03 12:05:08.534777+00	2025-11-03 12:03:21.95277+00	2	3	\N
14	Application accepted! You can now chat about the job: PC FIX	SYSTEM	\N	\N	\N	\N	t	2025-11-05 18:59:11.073646+00	2025-11-05 18:58:41.228877+00	3	3	\N
15	Come her sir	TEXT	\N	\N	\N	\N	t	2025-11-05 18:59:11.073646+00	2025-11-05 18:58:57.061546+00	3	3	\N
16	done	TEXT	\N	\N	\N	\N	t	2025-11-05 19:02:07.482788+00	2025-11-05 19:01:01.793318+00	3	2	\N
17	Application accepted! You can now chat about the job: TESTTT	SYSTEM	\N	\N	\N	\N	t	2025-11-06 03:40:00.375694+00	2025-11-06 03:39:13.41337+00	4	3	\N
18	Complete The Job	TEXT	\N	\N	\N	\N	t	2025-11-06 03:40:00.375694+00	2025-11-06 03:39:35.457395+00	4	3	\N
19	Thanks for accepting the job	TEXT	\N	\N	\N	\N	t	2025-11-06 03:40:11.415178+00	2025-11-06 03:40:05.644197+00	4	2	\N
20	Application accepted! You can now chat about the job: HELLO HELO	SYSTEM	\N	\N	\N	\N	t	2025-11-09 20:39:04.93524+00	2025-11-09 20:38:41.22537+00	5	3	\N
21	Hey man u ready?	TEXT	\N	\N	\N	\N	t	2025-11-09 20:39:04.93524+00	2025-11-09 20:38:57.210409+00	5	3	\N
22	Application accepted! You can now chat about the job: Hi Gab	SYSTEM	\N	\N	\N	\N	t	2025-11-23 12:29:07.151877+00	2025-11-23 12:05:00.044233+00	6	3	\N
23	Hi how do you wanna start	TEXT	\N	\N	\N	\N	t	2025-11-23 12:29:07.151877+00	2025-11-23 12:05:28.36879+00	6	3	\N
24	Hmm iΓÇÖll finish then u pay	TEXT	\N	\N	\N	\N	t	2025-11-23 12:31:57.335558+00	2025-11-23 12:31:56.135201+00	6	3	\N
25	heyyy	TEXT	\N	\N	\N	\N	t	2025-11-23 12:35:35.783372+00	2025-11-23 12:35:33.975937+00	6	3	\N
26	bey	TEXT	\N	\N	\N	\N	t	2025-11-23 13:12:10.802141+00	2025-11-23 12:38:34.03333+00	6	2	\N
27	Hey	TEXT	\N	\N	\N	\N	t	2025-11-26 04:18:34.761545+00	2025-11-26 01:49:24.867337+00	7	2	\N
28	yeah	TEXT	\N	\N	\N	\N	t	2025-11-26 04:25:40.366826+00	2025-11-26 04:23:03.616799+00	7	3	\N
29	hey hey	TEXT	\N	\N	\N	\N	t	2025-11-30 05:01:42.380015+00	2025-11-30 03:36:27.082616+00	9	\N	8
30	hey man, where u at?	TEXT	\N	\N	\N	\N	t	\N	2025-11-30 05:10:06.915654+00	9	3	\N
31	Almost there	TEXT	\N	\N	\N	\N	t	2025-11-30 05:11:40.590828+00	2025-11-30 05:11:18.116353+00	9	\N	8
32	just arrived	TEXT	\N	\N	\N	\N	t	2025-11-30 05:12:03.923414+00	2025-11-30 05:11:47.534575+00	9	\N	8
33	wait what	TEXT	\N	\N	\N	\N	t	\N	2025-11-30 05:12:02.995378+00	9	3	\N
34	Thanks for the opporutnity	TEXT	\N	\N	\N	\N	t	2025-12-01 16:58:41.404028+00	2025-11-30 11:01:12.589402+00	11	2	\N
35		IMAGE	\N	\N	\N	\N	t	\N	2025-12-01 17:02:48.707973+00	12	3	\N
36		IMAGE	\N	\N	\N	\N	t	\N	2025-12-01 17:05:18.815222+00	12	3	\N
37	cant see it	TEXT	\N	\N	\N	\N	t	2025-12-01 17:06:54.836702+00	2025-12-01 17:06:40.88923+00	12	\N	8
38		IMAGE	\N	\N	\N	\N	t	\N	2025-12-01 17:07:43.398725+00	12	3	\N
39		IMAGE	\N	\N	\N	\N	t	\N	2025-12-01 17:11:00.33602+00	12	3	\N
40		IMAGE	\N	\N	\N	\N	t	2025-12-01 17:31:06.865645+00	2025-12-01 17:30:55.761195+00	12	\N	8
41	Application accepted! You can now chat about the job: Test Multi-Criteria Review Job	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-10 15:04:19.115466+00	13	37	\N
44	Welcome team! Looking forward to working with you all. Please coordinate your schedules. 👍	TEXT	\N	\N	\N	\N	f	\N	2025-12-10 17:36:09.574918+00	27	41	\N
42	Hello team! Worker 1 here. Ready to start the job! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-10 17:36:09.62368+00	2025-12-10 17:36:09.473989+00	27	42	\N
43	Hi everyone! Worker 2 reporting in. Let's get this done! ⚡	TEXT	\N	\N	\N	\N	t	2025-12-10 17:36:09.62368+00	2025-12-10 17:36:09.527394+00	27	43	\N
45	Application accepted! You can now chat about the job: Fix Kitchen Faucet	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-11 16:35:28.724273+00	33	45	\N
48	Welcome team! Looking forward to working with you all. Please coordinate your schedules. 👍	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 04:29:59.532914+00	35	41	\N
46	Hello team! Worker 1 here. Ready to start the job! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 04:29:59.592117+00	2025-12-12 04:29:59.430709+00	35	42	\N
47	Hi everyone! Worker 2 reporting in. Let's get this done! ⚡	TEXT	\N	\N	\N	\N	t	2025-12-12 04:29:59.592117+00	2025-12-12 04:29:59.482406+00	35	43	\N
49	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:04:03.893203+00	47	56	\N
50	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:06:39.00682+00	48	56	\N
51	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:06:39.148307+00	2025-12-12 17:06:39.096906+00	48	58	\N
52	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:06:43.239497+00	49	56	\N
53	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:06:43.380887+00	2025-12-12 17:06:43.329482+00	49	58	\N
54	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:08:22.349128+00	50	56	\N
55	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:08:22.497276+00	2025-12-12 17:08:22.442915+00	50	58	\N
56	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:09:25.142952+00	51	56	\N
57	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:09:25.288272+00	2025-12-12 17:09:25.23483+00	51	58	\N
58	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:10:30.415047+00	52	56	\N
59	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:10:30.554202+00	2025-12-12 17:10:30.503349+00	52	58	\N
60	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:11:36.388094+00	53	56	\N
61	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:11:36.523063+00	2025-12-12 17:11:36.473923+00	53	58	\N
62	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:12:09.306001+00	54	56	\N
63	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:12:09.441495+00	2025-12-12 17:12:09.393147+00	54	58	\N
64	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:12:57.194581+00	55	56	\N
65	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:12:57.333836+00	2025-12-12 17:12:57.282922+00	55	58	\N
66	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:14:43.356834+00	56	56	\N
67	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:14:43.496857+00	2025-12-12 17:14:43.445562+00	56	58	\N
68	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:19:54.340157+00	57	56	\N
69	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:19:54.484651+00	2025-12-12 17:19:54.430189+00	57	58	\N
70	Welcome team! Let's coordinate our work. 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 17:20:28.581772+00	58	56	\N
71	Worker 2 here! Ready to start. 🔧	TEXT	\N	\N	\N	\N	t	2025-12-12 17:20:28.725886+00	2025-12-12 17:20:28.675721+00	58	58	\N
72	Team job 'Conversation Test 1765562710' has started! Team members: Worker3 Test, Worker1 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 18:05:11.633563+00	60	41	\N
73	Team job 'Conversation Test 1765562817' has started! Team members: Worker3 Test, Worker1 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 18:06:58.505544+00	61	41	\N
74	hey	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 18:20:39.363757+00	59	3	\N
75	Hello team! This is the client. Looking forward to working with everyone! 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 20:18:09.8814+00	59	3	\N
76	Hello team! This is the client. Looking forward to working with everyone! 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 20:19:12.169964+00	59	3	\N
77	Team job 'RN Flow Test - Home Renovation 042128' has started! Team members: Worker2 Test, Worker1 Test, Worker3 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:21:29.368701+00	62	3	\N
78	Hello team! This is the client. Looking forward to working with everyone! 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 20:21:29.567172+00	62	3	\N
81	Team job 'RN Flow Test - Home Renovation 042211' has started! Team members: Worker2 Test, Worker1 Test, Worker3 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:22:12.788501+00	63	3	\N
82	Hello team! This is the client. Looking forward to working with everyone! 👋	TEXT	\N	\N	\N	\N	f	\N	2025-12-12 20:22:12.990338+00	63	3	\N
85	Team job 'Home Renovation TEST 1765572141' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:42:22.441047+00	64	41	\N
86	Team job 'Home Renovation TEST 1765572326' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:45:27.239193+00	65	41	\N
87	Team job 'Home Renovation TEST 1765572564' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:49:25.273157+00	66	41	\N
88	Team job 'Home Renovation TEST 1765572604' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-12 20:50:06.01874+00	67	41	\N
83	Hi everyone! testworker1_team here. Ready to start work! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-13 02:40:11.017738+00	2025-12-12 20:22:13.037961+00	63	42	\N
84	Hi everyone! testworker2_team here. Ready to start work! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-13 02:40:11.017738+00	2025-12-12 20:22:13.08521+00	63	43	\N
79	Hi everyone! testworker1_team here. Ready to start work! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-13 02:40:25.2193+00	2025-12-12 20:21:29.615362+00	62	42	\N
80	Hi everyone! testworker2_team here. Ready to start work! 🔧	TEXT	\N	\N	\N	\N	t	2025-12-13 02:40:25.2193+00	2025-12-12 20:21:29.663803+00	62	43	\N
120	Team job 'Home Renovation TEST 1765594288' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-13 02:51:29.353023+00	99	41	\N
121	Team job 'Home Renovation TEST 1765594419' has started! Team members: Worker1 Test, Worker3 Test, Worker2 Test. You can all communicate here.	SYSTEM	\N	\N	\N	\N	f	\N	2025-12-13 02:53:40.373138+00	100	41	\N
122	Application accepted! You can now chat about the job: Fix leaking Pipes	SYSTEM	\N	\N	\N	\N	t	2025-12-13 04:37:24.289133+00	2025-12-13 04:36:58.752799+00	101	3	\N
123	fix it boy	TEXT	\N	\N	\N	\N	t	2025-12-13 04:37:24.289133+00	2025-12-13 04:37:07.204867+00	101	3	\N
124	i will fix it biy	TEXT	\N	\N	\N	\N	t	2025-12-13 04:37:58.148867+00	2025-12-13 04:37:27.442417+00	101	2	\N
125	Heyyy bro	TEXT	\N	\N	\N	\N	t	2025-12-16 03:23:07.255033+00	2025-12-16 03:20:16.965029+00	103	3	\N
126	HELLOOO	TEXT	\N	\N	\N	\N	t	2025-12-16 03:59:37.228961+00	2025-12-16 03:24:21.027821+00	103	21	\N
127	Start?	TEXT	\N	\N	\N	\N	t	2025-12-16 03:59:37.228961+00	2025-12-16 03:24:52.577854+00	103	2	\N
\.


--
-- Data for Name: message_attachment; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.message_attachment ("attachmentID", "fileURL", "fileName", "fileSize", "fileType", "uploadedAt", "messageID_id") FROM stdin;
1	/media/iayos_files/chat/conversation_12/images/message_20251201_170248_3.png	\N	\N	IMAGE	2025-12-01 17:02:48.713997+00	35
2	/media/iayos_files/chat/conversation_12/images/message_20251201_170518_3.png	\N	\N	IMAGE	2025-12-01 17:05:18.820638+00	36
3	/media/iayos_files/chat/conversation_12/images/message_20251201_170743_3.png	\N	\N	IMAGE	2025-12-01 17:07:43.689134+00	38
4	/media/iayos_files/chat/conversation_12/images/message_20251201_171100_3.jpg	\N	\N	IMAGE	2025-12-01 17:11:00.342145+00	39
5	/media/iayos_files/chat/conversation_12/images/agency_message_20251201_173055_8.png	\N	\N	IMAGE	2025-12-01 17:30:58.51449+00	40
\.


--
-- Data for Name: profiles_workerproduct; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.profiles_workerproduct ("productID", "productName", description, price, "priceUnit", "inStock", "stockQuantity", "productImage", "isActive", "createdAt", "updatedAt", "categoryID_id", "workerID_id") FROM stdin;
\.


--
-- Data for Name: review_skill_tags; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.review_skill_tags ("tagID", "createdAt", "reviewID_id", "workerSpecializationID_id") FROM stdin;
\.


--
-- Data for Name: socialaccount_socialaccount; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.socialaccount_socialaccount (id, provider, uid, last_login, date_joined, extra_data, user_id) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialapp; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.socialaccount_socialapp (id, provider, name, client_id, secret, key, provider_id, settings) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialtoken; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.socialaccount_socialtoken (id, token, token_secret, expires_at, account_id, app_id) FROM stdin;
\.


--
-- Data for Name: specializations; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.specializations ("specializationID", "specializationName", "averageProjectCostMax", "averageProjectCostMin", description, "minimumRate", "rateType", "skillLevel") FROM stdin;
1	Plumbing	5000.00	500.00	Pipe installation, repair, leak fixing, and water system maintenance	150.00	hourly	intermediate
2	Electrical	8000.00	800.00	Wiring, electrical panel installation, lighting, and repairs	175.00	hourly	intermediate
3	Carpentry	15000.00	1000.00	Furniture making, cabinet installation, door/window repair, and woodwork	140.00	hourly	intermediate
9	Home Cleaning	2000.00	300.00	Residential cleaning, deep cleaning, and housekeeping services	85.00	hourly	entry
10	HVAC	10000.00	1500.00	AC installation, repair, maintenance, and ventilation systems	200.00	hourly	expert
4	Painting	8000.00	800.00	Interior/exterior painting, wall finishing, and surface preparation	120.00	hourly	intermediate
11	Masonry	20000.00	1500.00	Brickwork, concrete work, tile installation, and stonework	130.00	hourly	intermediate
12	Welding	12000.00	1000.00	Metal fabrication, gate repair, structural welding	180.00	hourly	expert
5	Cleaning	1500.00	250.00	General cleaning services for residential and commercial properties	80.00	hourly	entry
6	Gardening	3000.00	400.00	Lawn care, landscaping, tree trimming, and garden maintenance	90.00	hourly	entry
7	Moving	5000.00	500.00	Residential and commercial moving services, packing, and transport	100.00	hourly	entry
8	Appliance Repair	4000.00	600.00	Repair and maintenance of household appliances	160.00	hourly	intermediate
13	Electrical Work	0.00	0.00	Electrical Work services	600.00	hourly	intermediate
\.


--
-- Data for Name: worker_certifications; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.worker_certifications ("certificationID", name, issuing_organization, issue_date, expiry_date, certificate_url, is_verified, verified_at, "createdAt", "updatedAt", verified_by_id, "workerID_id", "specializationID_id") FROM stdin;
6	Advanced Plumbing Certificate	PICE	2024-06-01	2029-06-01		f	\N	2025-12-09 11:39:50.093239+00	2025-12-09 11:39:50.093247+00	\N	6	1
7	Electrical Safety Certificate	MERALCO Training Center	2024-03-10	2027-03-10		t	2025-12-09 14:42:02.510886+00	2025-12-09 11:39:50.098917+00	2025-12-09 16:53:09.4596+00	13	6	2
13	FIX	DIXEDD	2025-12-15	\N	/media/users/user_2/certificates/cert_FIX_1765769229	f	\N	2025-12-15 03:27:09.78443+00	2025-12-15 03:27:09.784439+00	\N	2	3
14	ELECTRICIAN	TESDA	2025-12-16	2028-12-16	/media/users/user_21/certificates/cert_ELECTRICIAN_1765846238	t	2025-12-16 01:01:54.370744+00	2025-12-16 00:50:38.50348+00	2025-12-16 01:01:54.37093+00	13	5	5
\.


--
-- Data for Name: worker_materials; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.worker_materials ("materialID", name, description, price, unit, image_url, is_available, "createdAt", "updatedAt", "workerID_id", quantity, "categoryID_id") FROM stdin;
1	Cement	PREMIUM CEMENT	450.00	per sack	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_21/materials/material_Cement_1763875374.jpg	t	2025-11-23 05:22:56.389731+00	2025-11-23 05:22:56.389742+00	5	1.00	\N
\.


--
-- Data for Name: worker_portfolio; Type: TABLE DATA; Schema: public; Owner: iayos_user
--

COPY public.worker_portfolio ("portfolioID", image_url, caption, display_order, file_name, file_size, "createdAt", "updatedAt", "workerID_id") FROM stdin;
\.


--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.account_emailaddress_id_seq', 1, false);


--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.account_emailconfirmation_id_seq', 1, false);


--
-- Name: accounts_accounts_accountID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_accounts_accountID_seq"', 70, true);


--
-- Name: accounts_accounts_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_accounts_groups_id_seq', 1, false);


--
-- Name: accounts_accounts_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_accounts_user_permissions_id_seq', 1, false);


--
-- Name: accounts_agency_agencyId_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_agency_agencyId_seq"', 9, true);


--
-- Name: accounts_barangay_barangayID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_barangay_barangayID_seq"', 99, true);


--
-- Name: accounts_city_cityID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_city_cityID_seq"', 1, true);


--
-- Name: accounts_clientprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_clientprofile_id_seq', 15, true);


--
-- Name: accounts_interestedjobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_interestedjobs_id_seq', 1, false);


--
-- Name: accounts_kyc_kycID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_kyc_kycID_seq"', 15, true);


--
-- Name: accounts_kycfiles_kycFileID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_kycfiles_kycFileID_seq"', 126, true);


--
-- Name: accounts_notification_notificationID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_notification_notificationID_seq"', 525, true);


--
-- Name: accounts_notificationsettings_settingsID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_notificationsettings_settingsID_seq"', 2, true);


--
-- Name: accounts_profile_profileID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_profile_profileID_seq"', 62, true);


--
-- Name: accounts_pushtoken_tokenID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_pushtoken_tokenID_seq"', 1, false);


--
-- Name: accounts_specializations_specializationID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_specializations_specializationID_seq"', 13, true);


--
-- Name: accounts_transaction_transactionID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_transaction_transactionID_seq"', 225, true);


--
-- Name: accounts_userpaymentmethod_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_userpaymentmethod_id_seq', 3, true);


--
-- Name: accounts_wallet_walletID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."accounts_wallet_walletID_seq"', 23, true);


--
-- Name: accounts_workerprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_workerprofile_id_seq', 18, true);


--
-- Name: accounts_workerspecialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.accounts_workerspecialization_id_seq', 5, true);


--
-- Name: adminpanel_adminaccount_adminID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_adminaccount_adminID_seq"', 1, false);


--
-- Name: adminpanel_auditlog_auditLogID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_auditlog_auditLogID_seq"', 527, true);


--
-- Name: adminpanel_cannedresponse_responseID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_cannedresponse_responseID_seq"', 1, false);


--
-- Name: adminpanel_faq_faqID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_faq_faqID_seq"', 1, false);


--
-- Name: adminpanel_kyclogs_logID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_kyclogs_logID_seq"', 17, true);


--
-- Name: adminpanel_platformsettings_settingsID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_platformsettings_settingsID_seq"', 1, true);


--
-- Name: adminpanel_supportticket_ticketID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_supportticket_ticketID_seq"', 1, false);


--
-- Name: adminpanel_supportticketreply_replyID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_supportticketreply_replyID_seq"', 1, false);


--
-- Name: adminpanel_systemroles_systemRoleID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_systemroles_systemRoleID_seq"', 2, true);


--
-- Name: adminpanel_userreport_reportID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."adminpanel_userreport_reportID_seq"', 1, false);


--
-- Name: agency_agencykyc_agencyKycID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."agency_agencykyc_agencyKycID_seq"', 3, true);


--
-- Name: agency_agencykycfile_fileID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."agency_agencykycfile_fileID_seq"', 25, true);


--
-- Name: agency_employees_employeeID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."agency_employees_employeeID_seq"', 2, true);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 272, true);


--
-- Name: certification_logs_certLogID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."certification_logs_certLogID_seq"', 4, true);


--
-- Name: conversation_conversationID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."conversation_conversationID_seq"', 103, true);


--
-- Name: conversation_participants_participantID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."conversation_participants_participantID_seq"', 169, true);


--
-- Name: dispute_evidence_evidenceID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."dispute_evidence_evidenceID_seq"', 4, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 68, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 134, true);


--
-- Name: job_applications_applicationID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_applications_applicationID_seq"', 186, true);


--
-- Name: job_disputes_disputeID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_disputes_disputeID_seq"', 8, true);


--
-- Name: job_employee_assignments_assignmentID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_employee_assignments_assignmentID_seq"', 3, true);


--
-- Name: job_logs_logID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_logs_logID_seq"', 155, true);


--
-- Name: job_photos_photoID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_photos_photoID_seq"', 3, true);


--
-- Name: job_reviews_reviewID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_reviews_reviewID_seq"', 95, true);


--
-- Name: job_skill_slots_skillSlotID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_skill_slots_skillSlotID_seq"', 160, true);


--
-- Name: job_worker_assignments_assignmentID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."job_worker_assignments_assignmentID_seq"', 123, true);


--
-- Name: jobs_jobID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."jobs_jobID_seq"', 166, true);


--
-- Name: message_attachment_attachmentID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."message_attachment_attachmentID_seq"', 5, true);


--
-- Name: message_messageID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."message_messageID_seq"', 127, true);


--
-- Name: profiles_workerproduct_productID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."profiles_workerproduct_productID_seq"', 4, true);


--
-- Name: review_skill_tags_tagID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."review_skill_tags_tagID_seq"', 1, false);


--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.socialaccount_socialaccount_id_seq', 1, false);


--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.socialaccount_socialapp_id_seq', 1, false);


--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public.socialaccount_socialtoken_id_seq', 1, false);


--
-- Name: worker_certifications_certificationID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."worker_certifications_certificationID_seq"', 14, true);


--
-- Name: worker_materials_materialID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."worker_materials_materialID_seq"', 1, true);


--
-- Name: worker_portfolio_portfolioID_seq; Type: SEQUENCE SET; Schema: public; Owner: iayos_user
--

SELECT pg_catalog.setval('public."worker_portfolio_portfolioID_seq"', 1, false);


--
-- Name: account_emailaddress account_emailaddress_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_pkey PRIMARY KEY (id);


--
-- Name: account_emailaddress account_emailaddress_user_id_email_987c8728_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_user_id_email_987c8728_uniq UNIQUE (user_id, email);


--
-- Name: account_emailconfirmation account_emailconfirmation_key_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_key_key UNIQUE (key);


--
-- Name: account_emailconfirmation account_emailconfirmation_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_pkey PRIMARY KEY (id);


--
-- Name: accounts_accounts accounts_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_email_key UNIQUE (email);


--
-- Name: accounts_accounts_groups accounts_accounts_groups_accounts_id_group_id_fe616882_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_accounts_id_group_id_fe616882_uniq UNIQUE (accounts_id, group_id);


--
-- Name: accounts_accounts_groups accounts_accounts_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_pkey PRIMARY KEY (id);


--
-- Name: accounts_accounts accounts_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_pkey PRIMARY KEY ("accountID");


--
-- Name: accounts_accounts_user_permissions accounts_accounts_user_p_accounts_id_permission_i_310c5a2e_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_user_p_accounts_id_permission_i_310c5a2e_uniq UNIQUE (accounts_id, permission_id);


--
-- Name: accounts_accounts_user_permissions accounts_accounts_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: accounts_agency accounts_agency_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_agency
    ADD CONSTRAINT accounts_agency_pkey PRIMARY KEY ("agencyId");


--
-- Name: accounts_barangay accounts_barangay_name_city_id_abb1e7d9_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT accounts_barangay_name_city_id_abb1e7d9_uniq UNIQUE (name, city_id);


--
-- Name: accounts_barangay accounts_barangay_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT accounts_barangay_pkey PRIMARY KEY ("barangayID");


--
-- Name: accounts_city accounts_city_name_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_city
    ADD CONSTRAINT accounts_city_name_key UNIQUE (name);


--
-- Name: accounts_city accounts_city_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_city
    ADD CONSTRAINT accounts_city_pkey PRIMARY KEY ("cityID");


--
-- Name: accounts_clientprofile accounts_clientprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT accounts_clientprofile_pkey PRIMARY KEY (id);


--
-- Name: accounts_clientprofile accounts_clientprofile_profileID_id_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT "accounts_clientprofile_profileID_id_key" UNIQUE ("profileID_id");


--
-- Name: accounts_interestedjobs accounts_interestedjobs_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT accounts_interestedjobs_pkey PRIMARY KEY (id);


--
-- Name: accounts_kyc accounts_kyc_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT accounts_kyc_pkey PRIMARY KEY ("kycID");


--
-- Name: accounts_kycfiles accounts_kycfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_kycfiles
    ADD CONSTRAINT accounts_kycfiles_pkey PRIMARY KEY ("kycFileID");


--
-- Name: accounts_notification accounts_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_notification
    ADD CONSTRAINT accounts_notification_pkey PRIMARY KEY ("notificationID");


--
-- Name: accounts_notificationsettings accounts_notificationsettings_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT "accounts_notificationsettings_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: accounts_notificationsettings accounts_notificationsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT accounts_notificationsettings_pkey PRIMARY KEY ("settingsID");


--
-- Name: accounts_profile accounts_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_profile
    ADD CONSTRAINT accounts_profile_pkey PRIMARY KEY ("profileID");


--
-- Name: accounts_pushtoken accounts_pushtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT accounts_pushtoken_pkey PRIMARY KEY ("tokenID");


--
-- Name: accounts_pushtoken accounts_pushtoken_pushToken_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT "accounts_pushtoken_pushToken_key" UNIQUE ("pushToken");


--
-- Name: specializations accounts_specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT accounts_specializations_pkey PRIMARY KEY ("specializationID");


--
-- Name: accounts_transaction accounts_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT accounts_transaction_pkey PRIMARY KEY ("transactionID");


--
-- Name: accounts_transaction accounts_transaction_xenditInvoiceID_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_xenditInvoiceID_key" UNIQUE ("xenditInvoiceID");


--
-- Name: accounts_userpaymentmethod accounts_userpaymentmethod_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_userpaymentmethod
    ADD CONSTRAINT accounts_userpaymentmethod_pkey PRIMARY KEY (id);


--
-- Name: accounts_wallet accounts_wallet_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT "accounts_wallet_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: accounts_wallet accounts_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT accounts_wallet_pkey PRIMARY KEY ("walletID");


--
-- Name: accounts_workerprofile accounts_workerprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT accounts_workerprofile_pkey PRIMARY KEY (id);


--
-- Name: accounts_workerprofile accounts_workerprofile_profileID_id_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT "accounts_workerprofile_profileID_id_key" UNIQUE ("profileID_id");


--
-- Name: accounts_workerspecialization accounts_workerspecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT accounts_workerspecialization_pkey PRIMARY KEY (id);


--
-- Name: adminpanel_adminaccount adminpanel_adminaccount_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT "adminpanel_adminaccount_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: adminpanel_adminaccount adminpanel_adminaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT adminpanel_adminaccount_pkey PRIMARY KEY ("adminID");


--
-- Name: adminpanel_auditlog adminpanel_auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_auditlog
    ADD CONSTRAINT adminpanel_auditlog_pkey PRIMARY KEY ("auditLogID");


--
-- Name: adminpanel_cannedresponse adminpanel_cannedresponse_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_cannedresponse
    ADD CONSTRAINT adminpanel_cannedresponse_pkey PRIMARY KEY ("responseID");


--
-- Name: adminpanel_faq adminpanel_faq_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_faq
    ADD CONSTRAINT adminpanel_faq_pkey PRIMARY KEY ("faqID");


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT adminpanel_kyclogs_pkey PRIMARY KEY ("kycLogID");


--
-- Name: adminpanel_platformsettings adminpanel_platformsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_platformsettings
    ADD CONSTRAINT adminpanel_platformsettings_pkey PRIMARY KEY ("settingsID");


--
-- Name: adminpanel_supportticket adminpanel_supportticket_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT adminpanel_supportticket_pkey PRIMARY KEY ("ticketID");


--
-- Name: adminpanel_supportticketreply adminpanel_supportticketreply_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT adminpanel_supportticketreply_pkey PRIMARY KEY ("replyID");


--
-- Name: adminpanel_systemroles adminpanel_systemroles_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_systemroles
    ADD CONSTRAINT adminpanel_systemroles_pkey PRIMARY KEY ("systemRoleID");


--
-- Name: adminpanel_userreport adminpanel_userreport_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT adminpanel_userreport_pkey PRIMARY KEY ("reportID");


--
-- Name: agency_agencykyc agency_agencykyc_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT agency_agencykyc_pkey PRIMARY KEY ("agencyKycID");


--
-- Name: agency_agencykycfile agency_agencykycfile_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_agencykycfile
    ADD CONSTRAINT agency_agencykycfile_pkey PRIMARY KEY ("fileID");


--
-- Name: agency_employees agency_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_employees
    ADD CONSTRAINT agency_employees_pkey PRIMARY KEY ("employeeID");


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: certification_logs certification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.certification_logs
    ADD CONSTRAINT certification_logs_pkey PRIMARY KEY ("certLogID");


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY ("participantID");


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY ("conversationID");


--
-- Name: dispute_evidence dispute_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY ("evidenceID");


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY ("applicationID");


--
-- Name: job_disputes job_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_disputes
    ADD CONSTRAINT job_disputes_pkey PRIMARY KEY ("disputeID");


--
-- Name: job_employee_assignments job_employee_assignments_job_id_employee_id_458658f4_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignments_job_id_employee_id_458658f4_uniq UNIQUE (job_id, employee_id);


--
-- Name: job_employee_assignments job_employee_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignments_pkey PRIMARY KEY ("assignmentID");


--
-- Name: job_logs job_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT job_logs_pkey PRIMARY KEY ("logID");


--
-- Name: job_photos job_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT job_photos_pkey PRIMARY KEY ("photoID");


--
-- Name: job_reviews job_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT job_reviews_pkey PRIMARY KEY ("reviewID");


--
-- Name: job_skill_slots job_skill_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_skill_slots
    ADD CONSTRAINT job_skill_slots_pkey PRIMARY KEY ("skillSlotID");


--
-- Name: job_worker_assignments job_worker_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT job_worker_assignments_pkey PRIMARY KEY ("assignmentID");


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY ("jobID");


--
-- Name: message_attachment message_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_pkey PRIMARY KEY ("attachmentID");


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY ("messageID");


--
-- Name: profiles_workerproduct profiles_workerproduct_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT profiles_workerproduct_pkey PRIMARY KEY ("productID");


--
-- Name: review_skill_tags review_skill_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.review_skill_tags
    ADD CONSTRAINT review_skill_tags_pkey PRIMARY KEY ("tagID");


--
-- Name: review_skill_tags review_skill_tags_reviewID_id_workerSpecia_87b0b8fc_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.review_skill_tags
    ADD CONSTRAINT "review_skill_tags_reviewID_id_workerSpecia_87b0b8fc_uniq" UNIQUE ("reviewID_id", "workerSpecializationID_id");


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_provider_uid_fc810c6e_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_provider_uid_fc810c6e_uniq UNIQUE (provider, uid);


--
-- Name: socialaccount_socialapp socialaccount_socialapp_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialapp
    ADD CONSTRAINT socialaccount_socialapp_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq UNIQUE (app_id, account_id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants unique_conversation_participant; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, profile_id);


--
-- Name: conversation unique_job_conversation; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT unique_job_conversation UNIQUE ("relatedJobPosting_id");


--
-- Name: job_applications unique_job_skill_slot_application; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT unique_job_skill_slot_application UNIQUE ("jobID_id", "workerID_id", applied_skill_slot_id);


--
-- Name: job_worker_assignments unique_slot_position; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT unique_slot_position UNIQUE ("skillSlotID_id", slot_position);


--
-- Name: job_worker_assignments unique_worker_per_job; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT unique_worker_per_job UNIQUE ("jobID_id", "workerID_id");


--
-- Name: worker_certifications worker_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT worker_certifications_pkey PRIMARY KEY ("certificationID");


--
-- Name: worker_materials worker_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_materials
    ADD CONSTRAINT worker_materials_pkey PRIMARY KEY ("materialID");


--
-- Name: worker_portfolio worker_portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_portfolio
    ADD CONSTRAINT worker_portfolio_pkey PRIMARY KEY ("portfolioID");


--
-- Name: account_emailaddress_email_03be32b2; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX account_emailaddress_email_03be32b2 ON public.account_emailaddress USING btree (email);


--
-- Name: account_emailaddress_email_03be32b2_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX account_emailaddress_email_03be32b2_like ON public.account_emailaddress USING btree (email varchar_pattern_ops);


--
-- Name: account_emailaddress_user_id_2c513194; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX account_emailaddress_user_id_2c513194 ON public.account_emailaddress USING btree (user_id);


--
-- Name: account_emailconfirmation_email_address_id_5b7f8c58; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX account_emailconfirmation_email_address_id_5b7f8c58 ON public.account_emailconfirmation USING btree (email_address_id);


--
-- Name: account_emailconfirmation_key_f43612bd_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX account_emailconfirmation_key_f43612bd_like ON public.account_emailconfirmation USING btree (key varchar_pattern_ops);


--
-- Name: accounts_accounts_banned_by_id_9d6a0a86; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_banned_by_id_9d6a0a86 ON public.accounts_accounts USING btree (banned_by_id);


--
-- Name: accounts_accounts_email_da8a4382_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_email_da8a4382_like ON public.accounts_accounts USING btree (email varchar_pattern_ops);


--
-- Name: accounts_accounts_groups_accounts_id_a094314b; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_groups_accounts_id_a094314b ON public.accounts_accounts_groups USING btree (accounts_id);


--
-- Name: accounts_accounts_groups_group_id_d2af1629; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_groups_group_id_d2af1629 ON public.accounts_accounts_groups USING btree (group_id);


--
-- Name: accounts_accounts_user_permissions_accounts_id_001e820c; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_user_permissions_accounts_id_001e820c ON public.accounts_accounts_user_permissions USING btree (accounts_id);


--
-- Name: accounts_accounts_user_permissions_permission_id_7df1f232; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_accounts_user_permissions_permission_id_7df1f232 ON public.accounts_accounts_user_permissions USING btree (permission_id);


--
-- Name: accounts_agency_accountFK_id_00b00793; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_agency_accountFK_id_00b00793" ON public.accounts_agency USING btree ("accountFK_id");


--
-- Name: accounts_ba_city_id_e22fce_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_ba_city_id_e22fce_idx ON public.accounts_barangay USING btree (city_id, name);


--
-- Name: accounts_ba_name_b64a2f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_ba_name_b64a2f_idx ON public.accounts_barangay USING btree (name);


--
-- Name: accounts_barangay_city_id_9f1a1154; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_barangay_city_id_9f1a1154 ON public.accounts_barangay USING btree (city_id);


--
-- Name: accounts_ci_name_3741a5_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_ci_name_3741a5_idx ON public.accounts_city USING btree (name);


--
-- Name: accounts_ci_provinc_3bc3e1_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_ci_provinc_3bc3e1_idx ON public.accounts_city USING btree (province);


--
-- Name: accounts_city_name_f214d25a_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_city_name_f214d25a_like ON public.accounts_city USING btree (name varchar_pattern_ops);


--
-- Name: accounts_interestedjobs_clientID_id_dac08b1c; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_interestedjobs_clientID_id_dac08b1c" ON public.accounts_interestedjobs USING btree ("clientID_id");


--
-- Name: accounts_interestedjobs_specializationID_id_de8a5af8; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_interestedjobs_specializationID_id_de8a5af8" ON public.accounts_interestedjobs USING btree ("specializationID_id");


--
-- Name: accounts_kyc_accountFK_id_564123ac; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_kyc_accountFK_id_564123ac" ON public.accounts_kyc USING btree ("accountFK_id");


--
-- Name: accounts_kyc_reviewedBy_id_c6f62ceb; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_kyc_reviewedBy_id_c6f62ceb" ON public.accounts_kyc USING btree ("reviewedBy_id");


--
-- Name: accounts_kycfiles_kycID_id_9ce3c182; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_kycfiles_kycID_id_9ce3c182" ON public.accounts_kycfiles USING btree ("kycID_id");


--
-- Name: accounts_no_account_225939_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_no_account_225939_idx ON public.accounts_notification USING btree ("accountFK_id", "createdAt" DESC);


--
-- Name: accounts_no_account_992e61_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_no_account_992e61_idx ON public.accounts_notification USING btree ("accountFK_id", "isRead");


--
-- Name: accounts_notification_accountFK_id_83e15b07; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_notification_accountFK_id_83e15b07" ON public.accounts_notification USING btree ("accountFK_id");


--
-- Name: accounts_profile_accountFK_id_52ee2884; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_profile_accountFK_id_52ee2884" ON public.accounts_profile USING btree ("accountFK_id");


--
-- Name: accounts_pu_account_956577_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_pu_account_956577_idx ON public.accounts_pushtoken USING btree ("accountFK_id", "isActive");


--
-- Name: accounts_pu_pushTok_d919a9_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_pu_pushTok_d919a9_idx" ON public.accounts_pushtoken USING btree ("pushToken");


--
-- Name: accounts_pushtoken_accountFK_id_dd0aaf60; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_pushtoken_accountFK_id_dd0aaf60" ON public.accounts_pushtoken USING btree ("accountFK_id");


--
-- Name: accounts_pushtoken_pushToken_e1af6fba_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_pushtoken_pushToken_e1af6fba_like" ON public.accounts_pushtoken USING btree ("pushToken" varchar_pattern_ops);


--
-- Name: accounts_tr_referen_0f1695_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_tr_referen_0f1695_idx ON public.accounts_transaction USING btree ("referenceNumber");


--
-- Name: accounts_tr_status_c95c77_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_tr_status_c95c77_idx ON public.accounts_transaction USING btree (status, "createdAt" DESC);


--
-- Name: accounts_tr_transac_c2a5d5_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_tr_transac_c2a5d5_idx ON public.accounts_transaction USING btree ("transactionType", "createdAt" DESC);


--
-- Name: accounts_tr_walletI_417c5f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_tr_walletI_417c5f_idx" ON public.accounts_transaction USING btree ("walletID_id", "createdAt" DESC);


--
-- Name: accounts_tr_xenditE_a6ad2c_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_tr_xenditE_a6ad2c_idx" ON public.accounts_transaction USING btree ("xenditExternalID");


--
-- Name: accounts_tr_xenditI_348817_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_tr_xenditI_348817_idx" ON public.accounts_transaction USING btree ("xenditInvoiceID");


--
-- Name: accounts_transaction_relatedJobPosting_id_84d00915; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_transaction_relatedJobPosting_id_84d00915" ON public.accounts_transaction USING btree ("relatedJobPosting_id");


--
-- Name: accounts_transaction_walletID_id_9ee06035; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_transaction_walletID_id_9ee06035" ON public.accounts_transaction USING btree ("walletID_id");


--
-- Name: accounts_transaction_xenditInvoiceID_6f1c3fe4_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_transaction_xenditInvoiceID_6f1c3fe4_like" ON public.accounts_transaction USING btree ("xenditInvoiceID" varchar_pattern_ops);


--
-- Name: accounts_userpaymentmethod_accountFK_id_2c4e9955; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_userpaymentmethod_accountFK_id_2c4e9955" ON public.accounts_userpaymentmethod USING btree ("accountFK_id");


--
-- Name: accounts_wa_account_5c6166_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX accounts_wa_account_5c6166_idx ON public.accounts_wallet USING btree ("accountFK_id");


--
-- Name: accounts_workerspecialization_specializationID_id_a72faa78; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_workerspecialization_specializationID_id_a72faa78" ON public.accounts_workerspecialization USING btree ("specializationID_id");


--
-- Name: accounts_workerspecialization_workerID_id_11bc9350; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "accounts_workerspecialization_workerID_id_11bc9350" ON public.accounts_workerspecialization USING btree ("workerID_id");


--
-- Name: adminpanel__account_0675e3_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__account_0675e3_idx ON public.adminpanel_kyclogs USING btree ("accountFK_id");


--
-- Name: adminpanel__action_fac12d_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__action_fac12d_idx ON public.adminpanel_auditlog USING btree (action);


--
-- Name: adminpanel__action_ffbe16_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__action_ffbe16_idx ON public.adminpanel_kyclogs USING btree (action);


--
-- Name: adminpanel__adminFK_d93624_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel__adminFK_d93624_idx" ON public.adminpanel_auditlog USING btree ("adminFK_id");


--
-- Name: adminpanel__assigne_460e54_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__assigne_460e54_idx ON public.adminpanel_supportticket USING btree ("assignedTo_id");


--
-- Name: adminpanel__categor_11a477_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__categor_11a477_idx ON public.adminpanel_supportticket USING btree (category);


--
-- Name: adminpanel__created_301685_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__created_301685_idx ON public.adminpanel_userreport USING btree ("createdAt" DESC);


--
-- Name: adminpanel__created_3c5926_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__created_3c5926_idx ON public.adminpanel_auditlog USING btree ("createdAt" DESC);


--
-- Name: adminpanel__created_8a9f85_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__created_8a9f85_idx ON public.adminpanel_supportticket USING btree ("createdAt" DESC);


--
-- Name: adminpanel__entityT_72b6c5_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel__entityT_72b6c5_idx" ON public.adminpanel_auditlog USING btree ("entityType", "entityID");


--
-- Name: adminpanel__entityT_aea4a2_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel__entityT_aea4a2_idx" ON public.adminpanel_auditlog USING btree ("entityType");


--
-- Name: adminpanel__isActiv_aca720_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel__isActiv_aca720_idx" ON public.adminpanel_adminaccount USING btree ("isActive");


--
-- Name: adminpanel__priorit_cb784b_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__priorit_cb784b_idx ON public.adminpanel_supportticket USING btree (priority);


--
-- Name: adminpanel__reportT_47a4b1_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel__reportT_47a4b1_idx" ON public.adminpanel_userreport USING btree ("reportType");


--
-- Name: adminpanel__reviewe_a8552e_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__reviewe_a8552e_idx ON public.adminpanel_kyclogs USING btree ("reviewedAt" DESC);


--
-- Name: adminpanel__role_aca1c5_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__role_aca1c5_idx ON public.adminpanel_adminaccount USING btree (role);


--
-- Name: adminpanel__status_694d0c_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__status_694d0c_idx ON public.adminpanel_userreport USING btree (status);


--
-- Name: adminpanel__status_bb623a_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX adminpanel__status_bb623a_idx ON public.adminpanel_supportticket USING btree (status);


--
-- Name: adminpanel_auditlog_adminFK_id_4eefb86e; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_auditlog_adminFK_id_4eefb86e" ON public.adminpanel_auditlog USING btree ("adminFK_id");


--
-- Name: adminpanel_cannedresponse_createdBy_id_69f34ba6; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_cannedresponse_createdBy_id_69f34ba6" ON public.adminpanel_cannedresponse USING btree ("createdBy_id");


--
-- Name: adminpanel_kyclogs_accountFK_id_cc292720; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_kyclogs_accountFK_id_cc292720" ON public.adminpanel_kyclogs USING btree ("accountFK_id");


--
-- Name: adminpanel_kyclogs_reviewedBy_id_7b3b6785; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_kyclogs_reviewedBy_id_7b3b6785" ON public.adminpanel_kyclogs USING btree ("reviewedBy_id");


--
-- Name: adminpanel_platformsettings_updatedBy_id_99ff4e3b; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_platformsettings_updatedBy_id_99ff4e3b" ON public.adminpanel_platformsettings USING btree ("updatedBy_id");


--
-- Name: adminpanel_supportticket_assignedTo_id_ec7f4077; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_supportticket_assignedTo_id_ec7f4077" ON public.adminpanel_supportticket USING btree ("assignedTo_id");


--
-- Name: adminpanel_supportticket_userFK_id_7f238b84; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_supportticket_userFK_id_7f238b84" ON public.adminpanel_supportticket USING btree ("userFK_id");


--
-- Name: adminpanel_supportticketreply_senderFK_id_be761933; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_supportticketreply_senderFK_id_be761933" ON public.adminpanel_supportticketreply USING btree ("senderFK_id");


--
-- Name: adminpanel_supportticketreply_ticketFK_id_68cec9a2; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_supportticketreply_ticketFK_id_68cec9a2" ON public.adminpanel_supportticketreply USING btree ("ticketFK_id");


--
-- Name: adminpanel_systemroles_accountID_id_b80596d8; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_systemroles_accountID_id_b80596d8" ON public.adminpanel_systemroles USING btree ("accountID_id");


--
-- Name: adminpanel_userreport_reportedUserFK_id_b0aee279; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_userreport_reportedUserFK_id_b0aee279" ON public.adminpanel_userreport USING btree ("reportedUserFK_id");


--
-- Name: adminpanel_userreport_reporterFK_id_719fb23f; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_userreport_reporterFK_id_719fb23f" ON public.adminpanel_userreport USING btree ("reporterFK_id");


--
-- Name: adminpanel_userreport_reviewedBy_id_2238d296; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "adminpanel_userreport_reviewedBy_id_2238d296" ON public.adminpanel_userreport USING btree ("reviewedBy_id");


--
-- Name: agency_agencykyc_accountFK_id_0f3bd1fa; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "agency_agencykyc_accountFK_id_0f3bd1fa" ON public.agency_agencykyc USING btree ("accountFK_id");


--
-- Name: agency_agencykyc_reviewedBy_id_46ba9427; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "agency_agencykyc_reviewedBy_id_46ba9427" ON public.agency_agencykyc USING btree ("reviewedBy_id");


--
-- Name: agency_agencykycfile_agencyKyc_id_0fdb3a43; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "agency_agencykycfile_agencyKyc_id_0fdb3a43" ON public.agency_agencykycfile USING btree ("agencyKyc_id");


--
-- Name: agency_empl_agency__4dc656_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX agency_empl_agency__4dc656_idx ON public.agency_employees USING btree (agency_id, "isActive");


--
-- Name: agency_empl_agency__8ae1c3_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX agency_empl_agency__8ae1c3_idx ON public.agency_employees USING btree (agency_id, "employeeOfTheMonth");


--
-- Name: agency_empl_rating_2ae8be_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX agency_empl_rating_2ae8be_idx ON public.agency_employees USING btree (rating DESC);


--
-- Name: agency_empl_totalJo_532418_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "agency_empl_totalJo_532418_idx" ON public.agency_employees USING btree ("totalJobsCompleted" DESC);


--
-- Name: agency_employees_agency_id_cea6dc3f; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX agency_employees_agency_id_cea6dc3f ON public.agency_employees USING btree (agency_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: certificati_action_ea4a2f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX certificati_action_ea4a2f_idx ON public.certification_logs USING btree (action);


--
-- Name: certificati_certifi_eead3c_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX certificati_certifi_eead3c_idx ON public.certification_logs USING btree ("certificationID", "reviewedAt");


--
-- Name: certificati_workerI_adad02_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "certificati_workerI_adad02_idx" ON public.certification_logs USING btree ("workerID_id", "reviewedAt");


--
-- Name: certification_logs_reviewedBy_id_37abefe3; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "certification_logs_reviewedBy_id_37abefe3" ON public.certification_logs USING btree ("reviewedBy_id");


--
-- Name: certification_logs_workerID_id_c8ce1c5a; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "certification_logs_workerID_id_c8ce1c5a" ON public.certification_logs USING btree ("workerID_id");


--
-- Name: conversatio_agency__90e6b8_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_agency__90e6b8_idx ON public.conversation USING btree (agency_id, "updatedAt" DESC);


--
-- Name: conversatio_client__5b2f1f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_client__5b2f1f_idx ON public.conversation USING btree (client_id, "updatedAt" DESC);


--
-- Name: conversatio_convers_763591_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_convers_763591_idx ON public.conversation_participants USING btree (conversation_id, profile_id);


--
-- Name: conversatio_profile_7a3caa_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_profile_7a3caa_idx ON public.conversation_participants USING btree (profile_id, joined_at DESC);


--
-- Name: conversatio_related_6f5495_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_related_6f5495_idx ON public.conversation USING btree ("relatedJobPosting_id");


--
-- Name: conversatio_status_7e2047_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_status_7e2047_idx ON public.conversation USING btree (status);


--
-- Name: conversatio_worker__cc2b64_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversatio_worker__cc2b64_idx ON public.conversation USING btree (worker_id, "updatedAt" DESC);


--
-- Name: conversation_agency_id_5b03fc82; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_agency_id_5b03fc82 ON public.conversation USING btree (agency_id);


--
-- Name: conversation_client_id_6121652e; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_client_id_6121652e ON public.conversation USING btree (client_id);


--
-- Name: conversation_lastMessageSender_id_212ad3fe; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "conversation_lastMessageSender_id_212ad3fe" ON public.conversation USING btree ("lastMessageSender_id");


--
-- Name: conversation_participants_conversation_id_58e662d4; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_participants_conversation_id_58e662d4 ON public.conversation_participants USING btree (conversation_id);


--
-- Name: conversation_participants_profile_id_f750bb98; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_participants_profile_id_f750bb98 ON public.conversation_participants USING btree (profile_id);


--
-- Name: conversation_participants_skill_slot_id_27792a70; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_participants_skill_slot_id_27792a70 ON public.conversation_participants USING btree (skill_slot_id);


--
-- Name: conversation_relatedJobPosting_id_e787baf8; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "conversation_relatedJobPosting_id_e787baf8" ON public.conversation USING btree ("relatedJobPosting_id");


--
-- Name: conversation_worker_id_c1fa5961; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX conversation_worker_id_c1fa5961 ON public.conversation USING btree (worker_id);


--
-- Name: dispute_evidence_disputeID_id_92feccbf; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "dispute_evidence_disputeID_id_92feccbf" ON public.dispute_evidence USING btree ("disputeID_id");


--
-- Name: dispute_evidence_uploadedBy_id_17b30546; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "dispute_evidence_uploadedBy_id_17b30546" ON public.dispute_evidence USING btree ("uploadedBy_id");


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: job_applica_applied_237261_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_applica_applied_237261_idx ON public.job_applications USING btree (applied_skill_slot_id, status);


--
-- Name: job_applica_jobID_i_c676f8_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_applica_jobID_i_c676f8_idx" ON public.job_applications USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_applica_status_08790f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_applica_status_08790f_idx ON public.job_applications USING btree (status, "createdAt" DESC);


--
-- Name: job_applica_workerI_027e10_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_applica_workerI_027e10_idx" ON public.job_applications USING btree ("workerID_id", "createdAt" DESC);


--
-- Name: job_applications_applied_skill_slot_id_12f3ea43; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_applications_applied_skill_slot_id_12f3ea43 ON public.job_applications USING btree (applied_skill_slot_id);


--
-- Name: job_applications_jobID_id_af6552d1; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_applications_jobID_id_af6552d1" ON public.job_applications USING btree ("jobID_id");


--
-- Name: job_applications_workerID_id_218ce27c; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_applications_workerID_id_218ce27c" ON public.job_applications USING btree ("workerID_id");


--
-- Name: job_assign_emp_status_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_assign_emp_status_idx ON public.jobs USING btree ("assignedEmployeeID_id", status);


--
-- Name: job_dispute_jobID_i_5435ed_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_dispute_jobID_i_5435ed_idx" ON public.job_disputes USING btree ("jobID_id", "openedDate" DESC);


--
-- Name: job_dispute_priorit_40a747_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_dispute_priorit_40a747_idx ON public.job_disputes USING btree (priority, "openedDate" DESC);


--
-- Name: job_dispute_status_3f7a05_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_dispute_status_3f7a05_idx ON public.job_disputes USING btree (status, "openedDate" DESC);


--
-- Name: job_disputes_jobID_id_13a7964a; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_disputes_jobID_id_13a7964a" ON public.job_disputes USING btree ("jobID_id");


--
-- Name: job_employe_employe_5d922f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_employe_employe_5d922f_idx ON public.job_employee_assignments USING btree (employee_id, status);


--
-- Name: job_employe_job_id_2d7113_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_employe_job_id_2d7113_idx ON public.job_employee_assignments USING btree (job_id, status);


--
-- Name: job_employee_assignments_assignedBy_id_177295a3; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_employee_assignments_assignedBy_id_177295a3" ON public.job_employee_assignments USING btree ("assignedBy_id");


--
-- Name: job_employee_assignments_employee_id_494ec9c6; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_employee_assignments_employee_id_494ec9c6 ON public.job_employee_assignments USING btree (employee_id);


--
-- Name: job_employee_assignments_job_id_73ae29a2; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_employee_assignments_job_id_73ae29a2 ON public.job_employee_assignments USING btree (job_id);


--
-- Name: job_logs_changedBy_id_c84def83; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_logs_changedBy_id_c84def83" ON public.job_logs USING btree ("changedBy_id");


--
-- Name: job_logs_jobID_i_b5c46a_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_logs_jobID_i_b5c46a_idx" ON public.job_logs USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_logs_jobID_id_98d5ee9f; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_logs_jobID_id_98d5ee9f" ON public.job_logs USING btree ("jobID_id");


--
-- Name: job_logs_newStat_d67ac4_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_logs_newStat_d67ac4_idx" ON public.job_logs USING btree ("newStatus", "createdAt" DESC);


--
-- Name: job_photos_jobID_id_7a20d525; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_photos_jobID_id_7a20d525" ON public.job_photos USING btree ("jobID_id");


--
-- Name: job_reviews_flaggedBy_id_a320e7dc; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_flaggedBy_id_a320e7dc" ON public.job_reviews USING btree ("flaggedBy_id");


--
-- Name: job_reviews_isFlagg_8bb65d_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_isFlagg_8bb65d_idx" ON public.job_reviews USING btree ("isFlagged", "createdAt" DESC);


--
-- Name: job_reviews_jobID_i_fe8bbe_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_jobID_i_fe8bbe_idx" ON public.job_reviews USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_reviews_jobID_id_faafb0c7; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_jobID_id_faafb0c7" ON public.job_reviews USING btree ("jobID_id");


--
-- Name: job_reviews_reviewe_1276ae_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_reviewe_1276ae_idx ON public.job_reviews USING btree ("revieweeAgencyID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_504347_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_reviewe_504347_idx ON public.job_reviews USING btree ("revieweeProfileID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_67461b_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_reviewe_67461b_idx ON public.job_reviews USING btree ("reviewerID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_c3a832_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_reviewe_c3a832_idx ON public.job_reviews USING btree ("revieweeEmployeeID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_f47e2e_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_reviewe_f47e2e_idx ON public.job_reviews USING btree ("revieweeID_id", "createdAt" DESC);


--
-- Name: job_reviews_revieweeAgencyID_id_9e4a1f26; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_revieweeAgencyID_id_9e4a1f26" ON public.job_reviews USING btree ("revieweeAgencyID_id");


--
-- Name: job_reviews_revieweeEmployeeID_id_675563af; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_revieweeEmployeeID_id_675563af" ON public.job_reviews USING btree ("revieweeEmployeeID_id");


--
-- Name: job_reviews_revieweeID_id_dd84a739; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_revieweeID_id_dd84a739" ON public.job_reviews USING btree ("revieweeID_id");


--
-- Name: job_reviews_revieweeProfileID_id_b7d3247a; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_revieweeProfileID_id_b7d3247a" ON public.job_reviews USING btree ("revieweeProfileID_id");


--
-- Name: job_reviews_reviewerID_id_f663e256; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_reviews_reviewerID_id_f663e256" ON public.job_reviews USING btree ("reviewerID_id");


--
-- Name: job_reviews_status_d2c214_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_reviews_status_d2c214_idx ON public.job_reviews USING btree (status, "createdAt" DESC);


--
-- Name: job_skill_s_jobID_i_04a042_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_skill_s_jobID_i_04a042_idx" ON public.job_skill_slots USING btree ("jobID_id", status);


--
-- Name: job_skill_s_special_8c143c_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX job_skill_s_special_8c143c_idx ON public.job_skill_slots USING btree ("specializationID_id", status);


--
-- Name: job_skill_slots_jobID_id_da790968; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_skill_slots_jobID_id_da790968" ON public.job_skill_slots USING btree ("jobID_id");


--
-- Name: job_skill_slots_specializationID_id_9552b385; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_skill_slots_specializationID_id_9552b385" ON public.job_skill_slots USING btree ("specializationID_id");


--
-- Name: job_worker__jobID_i_aacfe5_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker__jobID_i_aacfe5_idx" ON public.job_worker_assignments USING btree ("jobID_id", assignment_status);


--
-- Name: job_worker__skillSl_c608db_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker__skillSl_c608db_idx" ON public.job_worker_assignments USING btree ("skillSlotID_id", slot_position);


--
-- Name: job_worker__workerI_574455_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker__workerI_574455_idx" ON public.job_worker_assignments USING btree ("workerID_id", assignment_status);


--
-- Name: job_worker_assignments_jobID_id_7e0fd5c3; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker_assignments_jobID_id_7e0fd5c3" ON public.job_worker_assignments USING btree ("jobID_id");


--
-- Name: job_worker_assignments_skillSlotID_id_ebcc166e; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker_assignments_skillSlotID_id_ebcc166e" ON public.job_worker_assignments USING btree ("skillSlotID_id");


--
-- Name: job_worker_assignments_workerID_id_0998a652; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "job_worker_assignments_workerID_id_0998a652" ON public.job_worker_assignments USING btree ("workerID_id");


--
-- Name: jobs_assigne_cc625f_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX jobs_assigne_cc625f_idx ON public.jobs USING btree ("assignedWorkerID_id", status);


--
-- Name: jobs_assignedAgencyFK_id_e16077b8; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_assignedAgencyFK_id_e16077b8" ON public.jobs USING btree ("assignedAgencyFK_id");


--
-- Name: jobs_assignedEmployeeID_id_0654ee21; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_assignedEmployeeID_id_0654ee21" ON public.jobs USING btree ("assignedEmployeeID_id");


--
-- Name: jobs_assignedWorkerID_id_9fab1ae7; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_assignedWorkerID_id_9fab1ae7" ON public.jobs USING btree ("assignedWorkerID_id");


--
-- Name: jobs_cashPaymentApprovedBy_id_7ed3ab69; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_cashPaymentApprovedBy_id_7ed3ab69" ON public.jobs USING btree ("cashPaymentApprovedBy_id");


--
-- Name: jobs_categor_d47dee_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX jobs_categor_d47dee_idx ON public.jobs USING btree ("categoryID_id", status);


--
-- Name: jobs_categoryID_id_70143f40; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_categoryID_id_70143f40" ON public.jobs USING btree ("categoryID_id");


--
-- Name: jobs_clientID_id_f35c16c3; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_clientID_id_f35c16c3" ON public.jobs USING btree ("clientID_id");


--
-- Name: jobs_clientI_03c7a0_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "jobs_clientI_03c7a0_idx" ON public.jobs USING btree ("clientID_id", "createdAt" DESC);


--
-- Name: jobs_status_9d014c_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX jobs_status_9d014c_idx ON public.jobs USING btree (status, "createdAt" DESC);


--
-- Name: jobs_urgency_b2dcee_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX jobs_urgency_b2dcee_idx ON public.jobs USING btree (urgency, "createdAt" DESC);


--
-- Name: kyc_ai_status_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX kyc_ai_status_idx ON public.accounts_kycfiles USING btree (ai_verification_status);


--
-- Name: message_attachment_messageID_id_4b72e1bb; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "message_attachment_messageID_id_4b72e1bb" ON public.message_attachment USING btree ("messageID_id");


--
-- Name: message_convers_1671b3_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX message_convers_1671b3_idx ON public.message USING btree ("conversationID_id", "createdAt");


--
-- Name: message_conversationID_id_bc59843b; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "message_conversationID_id_bc59843b" ON public.message USING btree ("conversationID_id");


--
-- Name: message_isRead_b20976_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "message_isRead_b20976_idx" ON public.message USING btree ("isRead");


--
-- Name: message_senderAgency_id_1e392f6f; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "message_senderAgency_id_1e392f6f" ON public.message USING btree ("senderAgency_id");


--
-- Name: message_sender__33ec43_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX message_sender__33ec43_idx ON public.message USING btree (sender_id, "createdAt" DESC);


--
-- Name: message_sender_id_a2a2e825; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX message_sender_id_a2a2e825 ON public.message USING btree (sender_id);


--
-- Name: profiles_workerproduct_categoryID_id_05fd3863; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "profiles_workerproduct_categoryID_id_05fd3863" ON public.profiles_workerproduct USING btree ("categoryID_id");


--
-- Name: profiles_workerproduct_workerID_id_79c64228; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "profiles_workerproduct_workerID_id_79c64228" ON public.profiles_workerproduct USING btree ("workerID_id");


--
-- Name: review_skil_reviewI_f86a86_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "review_skil_reviewI_f86a86_idx" ON public.review_skill_tags USING btree ("reviewID_id");


--
-- Name: review_skil_workerS_587697_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "review_skil_workerS_587697_idx" ON public.review_skill_tags USING btree ("workerSpecializationID_id");


--
-- Name: review_skill_tags_reviewID_id_5092dbb6; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "review_skill_tags_reviewID_id_5092dbb6" ON public.review_skill_tags USING btree ("reviewID_id");


--
-- Name: review_skill_tags_workerSpecializationID_id_ce661cf0; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "review_skill_tags_workerSpecializationID_id_ce661cf0" ON public.review_skill_tags USING btree ("workerSpecializationID_id");


--
-- Name: socialaccount_socialaccount_user_id_8146e70c; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX socialaccount_socialaccount_user_id_8146e70c ON public.socialaccount_socialaccount USING btree (user_id);


--
-- Name: socialaccount_socialtoken_account_id_951f210e; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX socialaccount_socialtoken_account_id_951f210e ON public.socialaccount_socialtoken USING btree (account_id);


--
-- Name: socialaccount_socialtoken_app_id_636a42d7; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX socialaccount_socialtoken_app_id_636a42d7 ON public.socialaccount_socialtoken USING btree (app_id);


--
-- Name: unique_non_team_job_application; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE UNIQUE INDEX unique_non_team_job_application ON public.job_applications USING btree ("jobID_id", "workerID_id") WHERE (applied_skill_slot_id IS NULL);


--
-- Name: unique_primary_email; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE UNIQUE INDEX unique_primary_email ON public.account_emailaddress USING btree (user_id, "primary") WHERE "primary";


--
-- Name: unique_verified_email; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE UNIQUE INDEX unique_verified_email ON public.account_emailaddress USING btree (email) WHERE verified;


--
-- Name: worker_cert_expiry__fe5d02_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX worker_cert_expiry__fe5d02_idx ON public.worker_certifications USING btree (expiry_date);


--
-- Name: worker_cert_workerI_6b96e2_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_cert_workerI_6b96e2_idx" ON public.worker_certifications USING btree ("workerID_id", issue_date DESC);


--
-- Name: worker_certifications_specializationID_id_9076ff05; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_certifications_specializationID_id_9076ff05" ON public.worker_certifications USING btree ("specializationID_id");


--
-- Name: worker_certifications_verified_by_id_84b6e673; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX worker_certifications_verified_by_id_84b6e673 ON public.worker_certifications USING btree (verified_by_id);


--
-- Name: worker_certifications_workerID_id_e709a48d; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_certifications_workerID_id_e709a48d" ON public.worker_certifications USING btree ("workerID_id");


--
-- Name: worker_mate_name_b9fee4_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX worker_mate_name_b9fee4_idx ON public.worker_materials USING btree (name);


--
-- Name: worker_mate_workerI_082c93_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_mate_workerI_082c93_idx" ON public.worker_materials USING btree ("workerID_id", "categoryID_id");


--
-- Name: worker_mate_workerI_77a627_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_mate_workerI_77a627_idx" ON public.worker_materials USING btree ("workerID_id", is_available);


--
-- Name: worker_materials_categoryID_id_bb83eace; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_materials_categoryID_id_bb83eace" ON public.worker_materials USING btree ("categoryID_id");


--
-- Name: worker_materials_workerID_id_98c651ce; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_materials_workerID_id_98c651ce" ON public.worker_materials USING btree ("workerID_id");


--
-- Name: worker_port_workerI_7d29c4_idx; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_port_workerI_7d29c4_idx" ON public.worker_portfolio USING btree ("workerID_id", display_order);


--
-- Name: worker_portfolio_workerID_id_010518a8; Type: INDEX; Schema: public; Owner: iayos_user
--

CREATE INDEX "worker_portfolio_workerID_id_010518a8" ON public.worker_portfolio USING btree ("workerID_id");


--
-- Name: account_emailaddress account_emailaddress_user_id_2c513194_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_user_id_2c513194_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: account_emailconfirmation account_emailconfirm_email_address_id_5b7f8c58_fk_account_e; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirm_email_address_id_5b7f8c58_fk_account_e FOREIGN KEY (email_address_id) REFERENCES public.account_emailaddress(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts accounts_accounts_banned_by_id_9d6a0a86_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_banned_by_id_9d6a0a86_fk_accounts_ FOREIGN KEY (banned_by_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_groups accounts_accounts_gr_accounts_id_a094314b_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_gr_accounts_id_a094314b_fk_accounts_ FOREIGN KEY (accounts_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_groups accounts_accounts_groups_group_id_d2af1629_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_group_id_d2af1629_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_user_permissions accounts_accounts_us_accounts_id_001e820c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_us_accounts_id_001e820c_fk_accounts_ FOREIGN KEY (accounts_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_user_permissions accounts_accounts_us_permission_id_7df1f232_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_us_permission_id_7df1f232_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_agency accounts_agency_accountFK_id_00b00793_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_agency
    ADD CONSTRAINT "accounts_agency_accountFK_id_00b00793_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_barangay accounts_barangay_city_id_9f1a1154_fk_accounts_city_cityID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT "accounts_barangay_city_id_9f1a1154_fk_accounts_city_cityID" FOREIGN KEY (city_id) REFERENCES public.accounts_city("cityID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_clientprofile accounts_clientprofi_profileID_id_fa8b1900_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT "accounts_clientprofi_profileID_id_fa8b1900_fk_accounts_" FOREIGN KEY ("profileID_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_interestedjobs accounts_interestedj_clientID_id_dac08b1c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT "accounts_interestedj_clientID_id_dac08b1c_fk_accounts_" FOREIGN KEY ("clientID_id") REFERENCES public.accounts_clientprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_interestedjobs accounts_interestedj_specializationID_id_de8a5af8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT "accounts_interestedj_specializationID_id_de8a5af8_fk_accounts_" FOREIGN KEY ("specializationID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kyc accounts_kyc_accountFK_id_564123ac_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT "accounts_kyc_accountFK_id_564123ac_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kyc accounts_kyc_reviewedBy_id_c6f62ceb_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT "accounts_kyc_reviewedBy_id_c6f62ceb_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kycfiles accounts_kycfiles_kycID_id_9ce3c182_fk_accounts_kyc_kycID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_kycfiles
    ADD CONSTRAINT "accounts_kycfiles_kycID_id_9ce3c182_fk_accounts_kyc_kycID" FOREIGN KEY ("kycID_id") REFERENCES public.accounts_kyc("kycID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_notification accounts_notificatio_accountFK_id_83e15b07_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_notification
    ADD CONSTRAINT "accounts_notificatio_accountFK_id_83e15b07_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_notificationsettings accounts_notificatio_accountFK_id_97e2deff_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT "accounts_notificatio_accountFK_id_97e2deff_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_profile accounts_profile_accountFK_id_52ee2884_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_profile
    ADD CONSTRAINT "accounts_profile_accountFK_id_52ee2884_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_pushtoken accounts_pushtoken_accountFK_id_dd0aaf60_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT "accounts_pushtoken_accountFK_id_dd0aaf60_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_transaction accounts_transaction_relatedJobPosting_id_84d00915_fk_jobs_jobI; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_relatedJobPosting_id_84d00915_fk_jobs_jobI" FOREIGN KEY ("relatedJobPosting_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_transaction accounts_transaction_walletID_id_9ee06035_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_walletID_id_9ee06035_fk_accounts_" FOREIGN KEY ("walletID_id") REFERENCES public.accounts_wallet("walletID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_userpaymentmethod accounts_userpayment_accountFK_id_2c4e9955_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_userpaymentmethod
    ADD CONSTRAINT "accounts_userpayment_accountFK_id_2c4e9955_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_wallet accounts_wallet_accountFK_id_29a5de9e_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT "accounts_wallet_accountFK_id_29a5de9e_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerprofile accounts_workerprofi_profileID_id_dde1700c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT "accounts_workerprofi_profileID_id_dde1700c_fk_accounts_" FOREIGN KEY ("profileID_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerspecialization accounts_workerspeci_specializationID_id_a72faa78_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT "accounts_workerspeci_specializationID_id_a72faa78_fk_accounts_" FOREIGN KEY ("specializationID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerspecialization accounts_workerspeci_workerID_id_11bc9350_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT "accounts_workerspeci_workerID_id_11bc9350_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_adminaccount adminpanel_adminacco_accountFK_id_eeb69271_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT "adminpanel_adminacco_accountFK_id_eeb69271_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_auditlog adminpanel_auditlog_adminFK_id_4eefb86e_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_auditlog
    ADD CONSTRAINT "adminpanel_auditlog_adminFK_id_4eefb86e_fk_accounts_" FOREIGN KEY ("adminFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_cannedresponse adminpanel_cannedres_createdBy_id_69f34ba6_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_cannedresponse
    ADD CONSTRAINT "adminpanel_cannedres_createdBy_id_69f34ba6_fk_accounts_" FOREIGN KEY ("createdBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_accountFK_id_cc292720_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT "adminpanel_kyclogs_accountFK_id_cc292720_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_reviewedBy_id_7b3b6785_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT "adminpanel_kyclogs_reviewedBy_id_7b3b6785_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_platformsettings adminpanel_platforms_updatedBy_id_99ff4e3b_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_platformsettings
    ADD CONSTRAINT "adminpanel_platforms_updatedBy_id_99ff4e3b_fk_accounts_" FOREIGN KEY ("updatedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticket adminpanel_supportti_assignedTo_id_ec7f4077_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT "adminpanel_supportti_assignedTo_id_ec7f4077_fk_accounts_" FOREIGN KEY ("assignedTo_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticketreply adminpanel_supportti_senderFK_id_be761933_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT "adminpanel_supportti_senderFK_id_be761933_fk_accounts_" FOREIGN KEY ("senderFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticketreply adminpanel_supportti_ticketFK_id_68cec9a2_fk_adminpane; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT "adminpanel_supportti_ticketFK_id_68cec9a2_fk_adminpane" FOREIGN KEY ("ticketFK_id") REFERENCES public.adminpanel_supportticket("ticketID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticket adminpanel_supportti_userFK_id_7f238b84_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT "adminpanel_supportti_userFK_id_7f238b84_fk_accounts_" FOREIGN KEY ("userFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_systemroles adminpanel_systemrol_accountID_id_b80596d8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_systemroles
    ADD CONSTRAINT "adminpanel_systemrol_accountID_id_b80596d8_fk_accounts_" FOREIGN KEY ("accountID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reportedUserFK_id_b0aee279_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reportedUserFK_id_b0aee279_fk_accounts_" FOREIGN KEY ("reportedUserFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reporterFK_id_719fb23f_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reporterFK_id_719fb23f_fk_accounts_" FOREIGN KEY ("reporterFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reviewedBy_id_2238d296_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reviewedBy_id_2238d296_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykyc agency_agencykyc_accountFK_id_0f3bd1fa_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT "agency_agencykyc_accountFK_id_0f3bd1fa_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykyc agency_agencykyc_reviewedBy_id_46ba9427_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT "agency_agencykyc_reviewedBy_id_46ba9427_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykycfile agency_agencykycfile_agencyKyc_id_0fdb3a43_fk_agency_ag; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_agencykycfile
    ADD CONSTRAINT "agency_agencykycfile_agencyKyc_id_0fdb3a43_fk_agency_ag" FOREIGN KEY ("agencyKyc_id") REFERENCES public.agency_agencykyc("agencyKycID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_employees agency_employees_agency_id_cea6dc3f_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.agency_employees
    ADD CONSTRAINT agency_employees_agency_id_cea6dc3f_fk_accounts_ FOREIGN KEY (agency_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: certification_logs certification_logs_reviewedBy_id_37abefe3_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.certification_logs
    ADD CONSTRAINT "certification_logs_reviewedBy_id_37abefe3_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: certification_logs certification_logs_workerID_id_c8ce1c5a_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.certification_logs
    ADD CONSTRAINT "certification_logs_workerID_id_c8ce1c5a_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId" FOREIGN KEY (agency_id) REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_client_id_6121652e_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_client_id_6121652e_fk_accounts_profile_profileID" FOREIGN KEY (client_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_lastMessageSender_id_212ad3fe_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_lastMessageSender_id_212ad3fe_fk_accounts_" FOREIGN KEY ("lastMessageSender_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation_participants conversation_partici_conversation_id_58e662d4_fk_conversat; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_partici_conversation_id_58e662d4_fk_conversat FOREIGN KEY (conversation_id) REFERENCES public.conversation("conversationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation_participants conversation_partici_profile_id_f750bb98_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_partici_profile_id_f750bb98_fk_accounts_ FOREIGN KEY (profile_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation_participants conversation_partici_skill_slot_id_27792a70_fk_job_skill; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_partici_skill_slot_id_27792a70_fk_job_skill FOREIGN KEY (skill_slot_id) REFERENCES public.job_skill_slots("skillSlotID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID" FOREIGN KEY ("relatedJobPosting_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_worker_id_c1fa5961_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_worker_id_c1fa5961_fk_accounts_profile_profileID" FOREIGN KEY (worker_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: dispute_evidence dispute_evidence_disputeID_id_92feccbf_fk_job_dispu; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT "dispute_evidence_disputeID_id_92feccbf_fk_job_dispu" FOREIGN KEY ("disputeID_id") REFERENCES public.job_disputes("disputeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: dispute_evidence dispute_evidence_uploadedBy_id_17b30546_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT "dispute_evidence_uploadedBy_id_17b30546_fk_accounts_" FOREIGN KEY ("uploadedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_applications job_applications_applied_skill_slot_i_12f3ea43_fk_job_skill; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_applied_skill_slot_i_12f3ea43_fk_job_skill FOREIGN KEY (applied_skill_slot_id) REFERENCES public.job_skill_slots("skillSlotID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_applications job_applications_jobID_id_af6552d1_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT "job_applications_jobID_id_af6552d1_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_applications job_applications_workerID_id_218ce27c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT "job_applications_workerID_id_218ce27c_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_disputes job_disputes_jobID_id_13a7964a_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_disputes
    ADD CONSTRAINT "job_disputes_jobID_id_13a7964a_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignm_assignedBy_id_177295a3_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT "job_employee_assignm_assignedBy_id_177295a3_fk_accounts_" FOREIGN KEY ("assignedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignm_employee_id_494ec9c6_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignm_employee_id_494ec9c6_fk_agency_em FOREIGN KEY (employee_id) REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignments_job_id_73ae29a2_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT "job_employee_assignments_job_id_73ae29a2_fk_jobs_jobID" FOREIGN KEY (job_id) REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_logs job_logs_changedBy_id_c84def83_fk_accounts_accounts_accountID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT "job_logs_changedBy_id_c84def83_fk_accounts_accounts_accountID" FOREIGN KEY ("changedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_logs job_logs_jobID_id_98d5ee9f_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT "job_logs_jobID_id_98d5ee9f_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_photos job_photos_jobID_id_7a20d525_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT "job_photos_jobID_id_7a20d525_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_flaggedBy_id_a320e7dc_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_flaggedBy_id_a320e7dc_fk_accounts_" FOREIGN KEY ("flaggedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_jobID_id_faafb0c7_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_jobID_id_faafb0c7_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeAgencyID_id_9e4a1f26_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeAgencyID_id_9e4a1f26_fk_accounts_" FOREIGN KEY ("revieweeAgencyID_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeEmployeeID_i_675563af_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeEmployeeID_i_675563af_fk_agency_em" FOREIGN KEY ("revieweeEmployeeID_id") REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeID_id_dd84a739_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeID_id_dd84a739_fk_accounts_" FOREIGN KEY ("revieweeID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeProfileID_id_b7d3247a_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeProfileID_id_b7d3247a_fk_accounts_" FOREIGN KEY ("revieweeProfileID_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_reviewerID_id_f663e256_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_reviewerID_id_f663e256_fk_accounts_" FOREIGN KEY ("reviewerID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_skill_slots job_skill_slots_jobID_id_da790968_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_skill_slots
    ADD CONSTRAINT "job_skill_slots_jobID_id_da790968_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_skill_slots job_skill_slots_specializationID_id_9552b385_fk_specializ; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_skill_slots
    ADD CONSTRAINT "job_skill_slots_specializationID_id_9552b385_fk_specializ" FOREIGN KEY ("specializationID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_worker_assignments job_worker_assignmen_skillSlotID_id_ebcc166e_fk_job_skill; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT "job_worker_assignmen_skillSlotID_id_ebcc166e_fk_job_skill" FOREIGN KEY ("skillSlotID_id") REFERENCES public.job_skill_slots("skillSlotID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_worker_assignments job_worker_assignmen_workerID_id_0998a652_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT "job_worker_assignmen_workerID_id_0998a652_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_worker_assignments job_worker_assignments_jobID_id_7e0fd5c3_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.job_worker_assignments
    ADD CONSTRAINT "job_worker_assignments_jobID_id_7e0fd5c3_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedAgencyFK_id_e16077b8_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedAgencyFK_id_e16077b8_fk_accounts_agency_agencyId" FOREIGN KEY ("assignedAgencyFK_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedEmployeeID_i_0654ee21_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedEmployeeID_i_0654ee21_fk_agency_em" FOREIGN KEY ("assignedEmployeeID_id") REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedWorkerID_id_9fab1ae7_fk_accounts_workerprofile_id; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedWorkerID_id_9fab1ae7_fk_accounts_workerprofile_id" FOREIGN KEY ("assignedWorkerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_cashPaymentApprovedB_7ed3ab69_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_cashPaymentApprovedB_7ed3ab69_fk_accounts_" FOREIGN KEY ("cashPaymentApprovedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_categoryID_id_70143f40_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_categoryID_id_70143f40_fk_accounts_" FOREIGN KEY ("categoryID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_clientID_id_f35c16c3_fk_accounts_clientprofile_id; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_clientID_id_f35c16c3_fk_accounts_clientprofile_id" FOREIGN KEY ("clientID_id") REFERENCES public.accounts_clientprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message_attachment message_attachment_messageID_id_4b72e1bb_fk_message_messageID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT "message_attachment_messageID_id_4b72e1bb_fk_message_messageID" FOREIGN KEY ("messageID_id") REFERENCES public.message("messageID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_conversationID_id_bc59843b_fk_conversat; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_conversationID_id_bc59843b_fk_conversat" FOREIGN KEY ("conversationID_id") REFERENCES public.conversation("conversationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_senderAgency_id_1e392f6f_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_senderAgency_id_1e392f6f_fk_accounts_agency_agencyId" FOREIGN KEY ("senderAgency_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_sender_id_a2a2e825_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_sender_id_a2a2e825_fk_accounts_profile_profileID" FOREIGN KEY (sender_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: profiles_workerproduct profiles_workerprodu_categoryID_id_05fd3863_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT "profiles_workerprodu_categoryID_id_05fd3863_fk_accounts_" FOREIGN KEY ("categoryID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: profiles_workerproduct profiles_workerprodu_workerID_id_79c64228_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT "profiles_workerprodu_workerID_id_79c64228_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: review_skill_tags review_skill_tags_reviewID_id_5092dbb6_fk_job_reviews_reviewID; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.review_skill_tags
    ADD CONSTRAINT "review_skill_tags_reviewID_id_5092dbb6_fk_job_reviews_reviewID" FOREIGN KEY ("reviewID_id") REFERENCES public.job_reviews("reviewID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: review_skill_tags review_skill_tags_workerSpecialization_ce661cf0_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.review_skill_tags
    ADD CONSTRAINT "review_skill_tags_workerSpecialization_ce661cf0_fk_accounts_" FOREIGN KEY ("workerSpecializationID_id") REFERENCES public.accounts_workerspecialization(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_account_id_951f210e_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_account_id_951f210e_fk_socialacc FOREIGN KEY (account_id) REFERENCES public.socialaccount_socialaccount(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_app_id_636a42d7_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_app_id_636a42d7_fk_socialacc FOREIGN KEY (app_id) REFERENCES public.socialaccount_socialapp(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialaccount socialaccount_social_user_id_8146e70c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_social_user_id_8146e70c_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_certifications worker_certification_specializationID_id_9076ff05_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT "worker_certification_specializationID_id_9076ff05_fk_accounts_" FOREIGN KEY ("specializationID_id") REFERENCES public.accounts_workerspecialization(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_certifications worker_certification_verified_by_id_84b6e673_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT worker_certification_verified_by_id_84b6e673_fk_accounts_ FOREIGN KEY (verified_by_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_certifications worker_certification_workerID_id_e709a48d_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT "worker_certification_workerID_id_e709a48d_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_materials worker_materials_categoryID_id_bb83eace_fk_specializ; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_materials
    ADD CONSTRAINT "worker_materials_categoryID_id_bb83eace_fk_specializ" FOREIGN KEY ("categoryID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_materials worker_materials_workerID_id_98c651ce_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_materials
    ADD CONSTRAINT "worker_materials_workerID_id_98c651ce_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_portfolio worker_portfolio_workerID_id_010518a8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: iayos_user
--

ALTER TABLE ONLY public.worker_portfolio
    ADD CONSTRAINT "worker_portfolio_workerID_id_010518a8_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict aQMALhd4olXkPhLHJpv62BXtaanPFuaoOhKISkTJ2OFxhttC0NGf1yX7ngudssx

