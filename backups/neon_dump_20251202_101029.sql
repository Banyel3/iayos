--
-- PostgreSQL database dump
--

\restrict Y9hWbdSXGCyz9pO5iE3fviZFFRM5dptj0khaCeEWBelGPNHbzikeVZ2l8s1ztjB

-- Dumped from database version 17.6 (0d47993)
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
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS "worker_certification_workerID_id_e709a48d_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.worker_certifications DROP CONSTRAINT IF EXISTS worker_certification_verified_by_id_84b6e673_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_social_user_id_8146e70c_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_social_app_id_636a42d7_fk_socialacc;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_social_account_id_951f210e_fk_socialacc;
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
ALTER TABLE IF EXISTS ONLY public.job_reviews DROP CONSTRAINT IF EXISTS "job_reviews_reviewerID_id_f663e256_fk_accounts_";
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
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_accounts_;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_worker_id_c1fa5961_fk_accounts_profile_profileID";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_lastMessageSender_id_212ad3fe_fk_accounts_";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_client_id_6121652e_fk_accounts_profile_profileID";
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS "conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId";
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
DROP INDEX IF EXISTS public."worker_mate_workerI_77a627_idx";
DROP INDEX IF EXISTS public.worker_mate_name_b9fee4_idx;
DROP INDEX IF EXISTS public."worker_certifications_workerID_id_e709a48d";
DROP INDEX IF EXISTS public.worker_certifications_verified_by_id_84b6e673;
DROP INDEX IF EXISTS public."worker_cert_workerI_6b96e2_idx";
DROP INDEX IF EXISTS public.worker_cert_expiry__fe5d02_idx;
DROP INDEX IF EXISTS public.unique_verified_email;
DROP INDEX IF EXISTS public.unique_primary_email;
DROP INDEX IF EXISTS public.socialaccount_socialtoken_app_id_636a42d7;
DROP INDEX IF EXISTS public.socialaccount_socialtoken_account_id_951f210e;
DROP INDEX IF EXISTS public.socialaccount_socialaccount_user_id_8146e70c;
DROP INDEX IF EXISTS public."profiles_workerproduct_workerID_id_79c64228";
DROP INDEX IF EXISTS public."profiles_workerproduct_categoryID_id_05fd3863";
DROP INDEX IF EXISTS public.message_sender_id_a2a2e825;
DROP INDEX IF EXISTS public.message_sender__33ec43_idx;
DROP INDEX IF EXISTS public."message_senderAgency_id_1e392f6f";
DROP INDEX IF EXISTS public."message_isRead_b20976_idx";
DROP INDEX IF EXISTS public."message_conversationID_id_bc59843b";
DROP INDEX IF EXISTS public.message_convers_1671b3_idx;
DROP INDEX IF EXISTS public."message_attachment_messageID_id_4b72e1bb";
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
DROP INDEX IF EXISTS public.job_reviews_status_d2c214_idx;
DROP INDEX IF EXISTS public."job_reviews_reviewerID_id_f663e256";
DROP INDEX IF EXISTS public."job_reviews_revieweeID_id_dd84a739";
DROP INDEX IF EXISTS public."job_reviews_revieweeEmployeeID_id_675563af";
DROP INDEX IF EXISTS public."job_reviews_revieweeAgencyID_id_9e4a1f26";
DROP INDEX IF EXISTS public.job_reviews_reviewe_f47e2e_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_c3a832_idx;
DROP INDEX IF EXISTS public.job_reviews_reviewe_67461b_idx;
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
DROP INDEX IF EXISTS public."job_applica_workerI_027e10_idx";
DROP INDEX IF EXISTS public.job_applica_status_08790f_idx;
DROP INDEX IF EXISTS public."job_applica_jobID_i_c676f8_idx";
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.conversation_worker_id_c1fa5961;
DROP INDEX IF EXISTS public."conversation_relatedJobPosting_id_e787baf8";
DROP INDEX IF EXISTS public."conversation_lastMessageSender_id_212ad3fe";
DROP INDEX IF EXISTS public.conversation_client_id_6121652e;
DROP INDEX IF EXISTS public.conversation_agency_id_5b03fc82;
DROP INDEX IF EXISTS public.conversatio_worker__cc2b64_idx;
DROP INDEX IF EXISTS public.conversatio_status_7e2047_idx;
DROP INDEX IF EXISTS public.conversatio_related_6f5495_idx;
DROP INDEX IF EXISTS public.conversatio_client__5b2f1f_idx;
DROP INDEX IF EXISTS public.conversatio_agency__90e6b8_idx;
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
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS unique_job_conversation;
ALTER TABLE IF EXISTS ONLY public.job_applications DROP CONSTRAINT IF EXISTS unique_job_application;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_socialtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialtoken DROP CONSTRAINT IF EXISTS socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialapp DROP CONSTRAINT IF EXISTS socialaccount_socialapp_pkey;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_socialaccount_provider_uid_fc810c6e_uniq;
ALTER TABLE IF EXISTS ONLY public.socialaccount_socialaccount DROP CONSTRAINT IF EXISTS socialaccount_socialaccount_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles_workerproduct DROP CONSTRAINT IF EXISTS profiles_workerproduct_pkey;
ALTER TABLE IF EXISTS ONLY public.message DROP CONSTRAINT IF EXISTS message_pkey;
ALTER TABLE IF EXISTS ONLY public.message_attachment DROP CONSTRAINT IF EXISTS message_attachment_pkey;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
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
ALTER TABLE IF EXISTS ONLY public.conversation DROP CONSTRAINT IF EXISTS conversation_pkey;
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
DROP TABLE IF EXISTS public.profiles_workerproduct;
DROP TABLE IF EXISTS public.message_attachment;
DROP TABLE IF EXISTS public.message;
DROP TABLE IF EXISTS public.jobs;
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
DROP TABLE IF EXISTS public.conversation;
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
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_emailaddress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_emailaddress (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    verified boolean NOT NULL,
    "primary" boolean NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: account_emailconfirmation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_emailconfirmation (
    id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    sent timestamp with time zone,
    key character varying(64) NOT NULL,
    email_address_id integer NOT NULL
);


--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_accounts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_accounts_accountID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_accounts_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_accounts_groups (
    id bigint NOT NULL,
    accounts_id bigint NOT NULL,
    group_id integer NOT NULL
);


--
-- Name: accounts_accounts_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_accounts_user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_accounts_user_permissions (
    id bigint NOT NULL,
    accounts_id bigint NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: accounts_accounts_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_agency; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_agency_agencyId_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_barangay; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_barangay (
    "barangayID" integer NOT NULL,
    name character varying(100) NOT NULL,
    "zipCode" character varying(10),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    city_id integer NOT NULL
);


--
-- Name: accounts_barangay_barangayID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_city; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_city_cityID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_clientprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_clientprofile (
    id bigint NOT NULL,
    description character varying(350) NOT NULL,
    "totalJobsPosted" integer NOT NULL,
    "clientRating" integer NOT NULL,
    "profileID_id" bigint NOT NULL
);


--
-- Name: accounts_clientprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_interestedjobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_interestedjobs (
    id bigint NOT NULL,
    "clientID_id" bigint NOT NULL,
    "specializationID_id" bigint NOT NULL
);


--
-- Name: accounts_interestedjobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_kyc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_kyc (
    "kycID" bigint NOT NULL,
    kyc_status character varying(10) NOT NULL,
    "reviewedAt" timestamp with time zone NOT NULL,
    notes character varying(211) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL,
    "reviewedBy_id" bigint,
    "rejectionCategory" character varying(30),
    "rejectionReason" text NOT NULL,
    "resubmissionCount" integer NOT NULL,
    "maxResubmissions" integer NOT NULL
);


--
-- Name: accounts_kyc_kycID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_kycfiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_kycfiles (
    "kycFileID" bigint NOT NULL,
    "idType" character varying(20),
    "fileURL" character varying(255) NOT NULL,
    "fileName" character varying(255),
    "fileSize" integer,
    "uploadedAt" timestamp with time zone NOT NULL,
    "kycID_id" bigint NOT NULL
);


--
-- Name: accounts_kycfiles_kycFileID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_notification; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_notification_notificationID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_notificationsettings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_notificationsettings_settingsID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_profile; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_profile_profileID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_pushtoken; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_pushtoken_tokenID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: specializations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_specializations_specializationID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_transaction (
    "transactionID" bigint NOT NULL,
    "transactionType" character varying(15) NOT NULL,
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


--
-- Name: accounts_transaction_transactionID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_userpaymentmethod; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: accounts_userpaymentmethod_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_wallet (
    "walletID" bigint NOT NULL,
    balance numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountFK_id" bigint NOT NULL
);


--
-- Name: accounts_wallet_walletID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_workerprofile; Type: TABLE; Schema: public; Owner: -
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
    profile_completion_percentage integer NOT NULL
);


--
-- Name: accounts_workerprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: accounts_workerspecialization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts_workerspecialization (
    id bigint NOT NULL,
    "experienceYears" integer NOT NULL,
    certification character varying(120) NOT NULL,
    "specializationID_id" bigint NOT NULL,
    "workerID_id" bigint NOT NULL
);


--
-- Name: accounts_workerspecialization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_adminaccount; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_adminaccount_adminID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_auditlog; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_auditlog_auditLogID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_cannedresponse; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_cannedresponse_responseID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_faq; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_faq_faqID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_kyclogs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_kyclogs_logID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_platformsettings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_platformsettings_settingsID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_supportticket; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_supportticket_ticketID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_supportticketreply; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_supportticketreply_replyID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_systemroles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adminpanel_systemroles (
    "systemRoleID" bigint NOT NULL,
    "systemRole" character varying(10) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "accountID_id" bigint NOT NULL
);


--
-- Name: adminpanel_systemroles_systemRoleID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: adminpanel_userreport; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: adminpanel_userreport_reportID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: agency_agencykyc; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: agency_agencykyc_agencyKycID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: agency_agencykycfile; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: agency_agencykycfile_fileID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: agency_employees; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: agency_employees_employeeID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: auth_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: conversation; Type: TABLE; Schema: public; Owner: -
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
    agency_id bigint
);


--
-- Name: conversation_conversationID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: django_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: -
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
    "workerID_id" bigint NOT NULL
);


--
-- Name: job_applications_applicationID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: job_disputes; Type: TABLE; Schema: public; Owner: -
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
    "jobID_id" bigint NOT NULL
);


--
-- Name: job_disputes_disputeID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: job_employee_assignments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: job_employee_assignments_assignmentID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: job_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_logs (
    "logID" bigint NOT NULL,
    "oldStatus" character varying(15),
    "newStatus" character varying(15) NOT NULL,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "changedBy_id" bigint,
    "jobID_id" bigint NOT NULL
);


--
-- Name: job_logs_logID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: job_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_photos (
    "photoID" bigint NOT NULL,
    "photoURL" character varying(255) NOT NULL,
    "fileName" character varying(255),
    "uploadedAt" timestamp with time zone NOT NULL,
    "jobID_id" bigint NOT NULL
);


--
-- Name: job_photos_photoID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: job_reviews; Type: TABLE; Schema: public; Owner: -
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
    "revieweeEmployeeID_id" bigint
);


--
-- Name: job_reviews_reviewID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
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
    "employeeAssignedAt" timestamp with time zone
);


--
-- Name: jobs_jobID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: message; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: message_attachment; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: message_attachment_attachmentID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: message_messageID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: profiles_workerproduct; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: profiles_workerproduct_productID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: socialaccount_socialaccount; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: socialaccount_socialapp; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: socialaccount_socialtoken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socialaccount_socialtoken (
    id integer NOT NULL,
    token text NOT NULL,
    token_secret text NOT NULL,
    expires_at timestamp with time zone,
    account_id integer NOT NULL,
    app_id integer
);


--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: worker_certifications; Type: TABLE; Schema: public; Owner: -
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
    "workerID_id" bigint NOT NULL
);


--
-- Name: worker_certifications_certificationID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: worker_materials; Type: TABLE; Schema: public; Owner: -
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
    quantity numeric(10,2) NOT NULL
);


--
-- Name: worker_materials_materialID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Name: worker_portfolio; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: worker_portfolio_portfolioID_seq; Type: SEQUENCE; Schema: public; Owner: -
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
-- Data for Name: account_emailaddress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_emailaddress (id, email, verified, "primary", user_id) FROM stdin;
\.


--
-- Data for Name: account_emailconfirmation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_emailconfirmation (id, created, sent, key, email_address_id) FROM stdin;
\.


--
-- Data for Name: accounts_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_accounts (last_login, is_superuser, "accountID", email, password, "isVerified", is_active, is_staff, "verifyToken", "verifyTokenExpiry", "createdAt", "updatedAt", city, country, postal_code, province, street_address, "KYCVerified", banned_at, banned_by_id, banned_reason, is_banned, is_suspended, suspended_reason, suspended_until) FROM stdin;
\N	f	28	edrisbaks@gmail.com	pbkdf2_sha256$1000000$d6Y9nLKVsupgwNAmO05UEd$PGbN9w0b1+O7UpvwNcBSPSGrJsJPkkwgOTR7p8a4wcI=	t	t	f	\N	\N	2025-11-14 12:41:33.512251+00	2025-11-14 12:43:10.946418+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	San Roque Zamboanga City	f	\N	\N	\N	f	f	\N	\N
\N	f	2	admin@example.com	pbkdf2_sha256$1000000$aGZ52BDFhZIBSxr8mTQXPR$qytSNA0Xmd5N2xqkabZwWEbmVHeCr8Ug181ya6+aEIU=	t	t	f	\N	\N	2025-09-30 11:25:53.632938+00	2025-09-30 11:25:53.74142+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	29	edris.bakaun@one.uz.edu.ph	pbkdf2_sha256$1000000$TJzBlljcCHgICNRFy5LLHR$T4TV4d5pVoDEJPJ908AQER3JouXM7qoiwneB8hU6QN4=	t	t	f	\N	\N	2025-11-14 13:40:19.495534+00	2025-11-14 13:41:30.343951+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	San Roque Zamboanga City	f	\N	\N	\N	f	f	\N	\N
\N	f	23	ririka.ruu@gmail.com	pbkdf2_sha256$1000000$yRgbghaG8HktbecsULdxUL$JSa0WB1KbBcD8hT5sbTyQPC5lH8ZncxaAYRzkvKA9CQ=	t	t	f	\N	\N	2025-10-20 08:54:18.197708+00	2025-10-22 05:13:18.930636+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	30	testjobs422@example.com	pbkdf2_sha256$1000000$LVOQWsPzcaVRG6Br5NASUU$cbd1is9JdAwq/6qxM6vv7TEynZnUfMv/aTjdX5WgV1U=	f	t	f	aab30083e2fc5c79f27f8a64b93d6ed9d64a59e535ebcc4f3f38c906295344a6	2025-11-20 19:19:48.112351+00	2025-11-19 19:19:48.031717+00	2025-11-19 19:19:48.112472+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	24	testworker@example.com	pbkdf2_sha256$1000000$bn5rvHIoZi7HSxU0Qb2jYS$DrHiYOVDQD/MS0hpK/DAsIXEFkQdzn9hrQAigHRlTr8=	t	t	f	\N	\N	2025-11-08 18:19:42.437191+00	2025-11-08 18:19:42.437201+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	31	testjobs423@example.com	pbkdf2_sha256$1000000$kDHS4KeXRIm9CtXPctHtd6$F4X9FUWRlHlCMiu6SRwJBLj4nm7rRhTmH2yklZj4j8k=	f	t	f	88e6fee2353f4b12f7874029782a624d862f8523a2f07e45d451c966d8a88b42	2025-11-20 19:20:06.161818+00	2025-11-19 19:20:06.098456+00	2025-11-19 19:20:06.161927+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	15	hz202300645@wmsu.edu.ph	pbkdf2_sha256$1000000$1KiWz4J1pFG7FCXLdKSRet$apXfFSdNs+0FQsR6Il7N+H/wSrOg12//shyyISdNsZI=	t	t	f	\N	\N	2025-10-09 04:19:14.051355+00	2025-11-24 02:59:00.795868+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	Pasobolong	f	\N	\N	\N	f	f	\N	\N
\N	f	6	new.cornelio.vaniel38@gmail.com	pbkdf2_sha256$1000000$ilwZGpP5ciELAqEbhulUHU$R4WFBYiCgvjMoSG6IByYELCLvVDYh7TQHoN7+PR3ABI=	t	t	f	\N	\N	2025-10-01 10:57:38.698752+00	2025-11-24 03:17:36.437062+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	7	cornelio.vaniel38@gmail.com	pbkdf2_sha256$1000000$baVqUkiNMRnQ2Nj0vC6NTP$cct43TYwbyMYxwelYb26NZ3KlGfB0FJ0Uu3nPC26L8g=	t	t	f	\N	\N	2025-10-03 10:40:27.706664+00	2025-10-12 14:27:31.048969+00		Philippines				t	\N	\N	\N	f	f	\N	\N
\N	f	11	gamerofgames76@gmail.com	pbkdf2_sha256$1000000$hXpPPg9MGietsFc3yGOyqC$B1LcbZXw9dsHUoTWKsgcQwY71X84fF/111ZhnK3sUUE=	t	t	f	\N	\N	2025-10-04 04:46:30.869578+00	2025-10-04 04:47:15.890289+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	Presa, Zone 4 Pasobolong	f	\N	\N	\N	f	f	\N	\N
\N	f	13	superadmin@gmail.com	pbkdf2_sha256$1000000$bQXLfBylBFtoe9BD9H7McD$ROa8ahchzfmObAyQ6Z0iTfub4E9IierbJg3Eog2+EXE=	t	t	f	\N	\N	2025-10-06 04:47:14.655428+00	2025-10-06 04:47:14.72765+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\N	f	36	dump.temp.27@gmail.com	pbkdf2_sha256$1000000$uWQ5pivWbhEi23BdZRWTSy$zMDqyWeji8Fej7SDgL/KZlEJdW4XenzkuF+scjEnKdM=	t	t	f	\N	\N	2025-11-21 23:21:17.527548+00	2025-11-24 09:05:00.517853+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	shshsbbwnwksnxnx	t	\N	\N	\N	f	f	\N	\N
\N	f	32	testjobs424@example.com	pbkdf2_sha256$1000000$fbafMyCk5qAbzzwlP4CpI4$vfsv1aCZuoPysqai51sZQTHVnFgKzPLmfrLUIa0Qu2k=	t	t	f	\N	\N	2025-11-19 19:20:31.759321+00	2025-11-19 19:20:51.318037+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	123 St	f	\N	\N	\N	f	f	\N	\N
\N	f	26	daraemoon21@gmail.com	pbkdf2_sha256$1000000$A6MIMEh4oB4ktDL8G7aCxs$pbwexwaQrlGO4NVnRPxwc86MNhEmFfBke/rcF0yLw3c=	t	t	f	\N	\N	2025-11-14 09:18:41.867348+00	2025-11-14 11:12:36.498337+00	Zamboanga City	Philippines	7000	Zamboanga del Sur	511 Kristina Homes Phase 2	t	\N	\N	\N	f	f	\N	\N
\N	f	25	modillasgabriel@gmail.com	pbkdf2_sha256$1000000$2wXPL5KH7TT8MgFSeh6Ez5$HJmHnafkDyDu3gJwP/WP+h/stXSztupnP3UJPUT2sHE=	t	t	f	\N	\N	2025-11-12 01:04:23.57575+00	2025-11-24 09:05:34.642442+00	Zamboanga City	Philippines	7000	Zamboanga Del Sur	yuhyuhyuudsg	t	\N	\N	\N	f	f	\N	\N
\N	f	27	daraemoon2127@gmail.com	pbkdf2_sha256$1000000$wqbiVhSkx2MaG9ZFjEb0BM$Tr0G7lCB0455Pfm7pO+h21uDrSRnjW/sJXIg0ecz8qg=	t	t	f	\N	\N	2025-11-14 12:39:15.959996+00	2025-11-30 11:51:00.733637+00		Philippines				f	\N	\N	\N	f	f	\N	\N
\.


--
-- Data for Name: accounts_accounts_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_accounts_groups (id, accounts_id, group_id) FROM stdin;
\.


--
-- Data for Name: accounts_accounts_user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_accounts_user_permissions (id, accounts_id, permission_id) FROM stdin;
\.


--
-- Data for Name: accounts_agency; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_agency ("agencyId", "businessName", "businessDesc", "createdAt", "accountFK_id", city, country, postal_code, province, street_address, "contactNumber") FROM stdin;
8	Devante	Devante is the company behind iayos	2025-10-20 08:54:18.325219+00	23		Philippines				09998500312
9	Bubbles Agency	im da best in the world	2025-11-14 12:39:16.129437+00	27		Philippines				143
\.


--
-- Data for Name: accounts_barangay; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: accounts_city; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_city ("cityID", name, province, region, "zipCode", "createdAt", "updatedAt") FROM stdin;
1	Zamboanga City	Zamboanga Peninsula	Region IX	7000	2025-11-19 10:32:12.482036+00	2025-11-19 10:32:12.482051+00
\.


--
-- Data for Name: accounts_clientprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_clientprofile (id, description, "totalJobsPosted", "clientRating", "profileID_id") FROM stdin;
1		0	0	3
2		0	0	12
3		0	0	14
4		0	0	22
\.


--
-- Data for Name: accounts_interestedjobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_interestedjobs (id, "clientID_id", "specializationID_id") FROM stdin;
\.


--
-- Data for Name: accounts_kyc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_kyc ("kycID", kyc_status, "reviewedAt", notes, "createdAt", "updatedAt", "accountFK_id", "reviewedBy_id", "rejectionCategory", "rejectionReason", "resubmissionCount", "maxResubmissions") FROM stdin;
9	APPROVED	2025-11-14 11:12:36.425846+00	Re-submitted	2025-11-14 10:31:00.060948+00	2025-11-14 11:12:36.425892+00	26	\N	\N		0	3
12	APPROVED	2025-11-24 09:05:00.456721+00		2025-11-23 02:55:00.023446+00	2025-11-24 09:05:00.456728+00	36	\N	\N		0	3
10	APPROVED	2025-11-24 09:05:34.581492+00		2025-11-16 14:46:18.005164+00	2025-11-24 09:05:34.581497+00	25	\N	\N		0	3
\.


--
-- Data for Name: accounts_kycfiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_kycfiles ("kycFileID", "idType", "fileURL", "fileName", "fileSize", "uploadedAt", "kycID_id") FROM stdin;
34	PASSPORT	user_26/kyc/frontid_passport_f3788eab7df14f60a182b8e7baae34e4.jpg	frontid_passport_f3788eab7df14f60a182b8e7baae34e4.jpg	440295	2025-11-14 10:52:22.184891+00	9
35	PASSPORT	user_26/kyc/backid_passport_653e3fdfeb9147578c44f46a6d09e3d0.jpg	backid_passport_653e3fdfeb9147578c44f46a6d09e3d0.jpg	440295	2025-11-14 10:52:24.377186+00	9
36	POLICE	user_26/kyc/clearance_police_42c85272a013402a971d5749d4cb4b36.jpg	clearance_police_42c85272a013402a971d5749d4cb4b36.jpg	440295	2025-11-14 10:52:26.853229+00	9
37	\N	user_26/kyc/selfie_selfie_df63878f43e14e4bb536ddec653d640b.jpg	selfie_selfie_df63878f43e14e4bb536ddec653d640b.jpg	440295	2025-11-14 10:52:29.18996+00	9
38	NATIONALID	user_25/kyc/frontid_nationalid_00ee211afdf946139836265884249d47.png	frontid_nationalid_00ee211afdf946139836265884249d47.png	1623123	2025-11-16 14:46:22.301694+00	10
39	NATIONALID	user_25/kyc/backid_nationalid_ae4640466c974fd5a87f1805b4676994.png	backid_nationalid_ae4640466c974fd5a87f1805b4676994.png	1499369	2025-11-16 14:46:26.381694+00	10
40	NBI	user_25/kyc/clearance_nbi_a25b5cc87a8d4601b17ccff157aef058.png	clearance_nbi_a25b5cc87a8d4601b17ccff157aef058.png	1499369	2025-11-16 14:46:28.258106+00	10
41	\N	user_25/kyc/selfie_selfie_2235f5918a9945bb9ef3afcebd2045ea.jpg	selfie_selfie_2235f5918a9945bb9ef3afcebd2045ea.jpg	60361	2025-11-16 14:46:30.140456+00	10
46	DRIVERSLICENSE	user_36/kyc/frontid_driverslicense_bf6def74be37446db915b635898c6f95.jpg	frontid_driverslicense_bf6def74be37446db915b635898c6f95.jpg	75410	2025-11-23 02:55:01.970833+00	12
47	DRIVERSLICENSE	user_36/kyc/backid_driverslicense_625bf8b02a874c059454500721aec14b.jpg	backid_driverslicense_625bf8b02a874c059454500721aec14b.jpg	165058	2025-11-23 02:55:03.054987+00	12
48	NBI	user_36/kyc/clearance_nbi_a1c5384cc0ab47979dce2f581ecaab96.jpg	clearance_nbi_a1c5384cc0ab47979dce2f581ecaab96.jpg	77617	2025-11-23 02:55:04.402929+00	12
49	\N	user_36/kyc/selfie_selfie_f135dcb158094984af5b2a30fe0d8340.jpg	selfie_selfie_f135dcb158094984af5b2a30fe0d8340.jpg	436865	2025-11-23 02:55:06.432865+00	12
\.


--
-- Data for Name: accounts_notification; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: accounts_notificationsettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_notificationsettings ("settingsID", "pushEnabled", "soundEnabled", "jobUpdates", messages, payments, reviews, "kycUpdates", "doNotDisturbStart", "doNotDisturbEnd", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
1	t	t	t	t	t	t	t	\N	\N	2025-11-19 19:50:59.953506+00	2025-11-19 19:50:59.953518+00	7
2	t	t	t	t	t	t	t	\N	\N	2025-11-26 06:15:20.720404+00	2025-11-26 06:15:20.720415+00	6
\.


--
-- Data for Name: accounts_profile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_profile ("profileID", "profileImg", "firstName", "lastName", "contactNum", "birthDate", "profileType", "accountFK_id", "middleName", latitude, location_sharing_enabled, location_updated_at, longitude) FROM stdin;
7		Vaniel	Cornelio	09998500312	2005-02-02	CLIENT	11	Garcia	\N	f	\N	\N
9		Van	Cornelio	09998500312	2003-02-02	WORKER	15		\N	f	\N	\N
11	\N	Gabriel	Modillas	09268448694	2003-12-24	WORKER	25	Beligolo	\N	f	\N	\N
12	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_26/profileImage/avatar.png/12eccbee_1763118838	Sandara	Pasa	09976087745	2000-07-06	CLIENT	26		6.91350567	f	2025-11-14 11:13:38.350833+00	122.11304144
13	\N	Edris	Bakaun	09569986983	2006-06-09	WORKER	28		6.93698560	t	2025-11-14 12:48:30.117956+00	122.05096960
14	\N	Edriss	Bakaunn	09569986982	2003-02-04	CLIENT	29		\N	f	\N	\N
15	\N	Test	Jobs	09123456789	1990-01-01	\N	30		\N	f	\N	\N
16	\N	Test	Jobs	09123456789	1990-01-01	\N	31		\N	f	\N	\N
17	\N	Test	Jobs	09123456789	1990-01-01	\N	32		\N	f	\N	\N
21	\N	Hutao	Hutao	09998500347	2003-09-22	WORKER	36		\N	f	\N	\N
3	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/profileImage/avatar.png/6edc0488_1763056019	Vaniel	Cornelio	9998500312	2005-02-02	CLIENT	7	\N	6.97929117	t	2025-11-23 07:54:23.993807+00	122.12852556
22	\N	Hutao	Hutao	09998500347	2003-09-22	CLIENT	36		\N	f	\N	\N
2	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_6/profileImage/762E2F62-3FA2-4243-B53C-957C4BBF1955.jpg	Vaniel	Cornelio	9998500312	2005-02-02	WORKER	6	\N	9.96000000	t	2025-10-13 16:01:40.431961+00	126.01000000
\.


--
-- Data for Name: accounts_pushtoken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_pushtoken ("tokenID", "pushToken", "deviceType", "isActive", "createdAt", "updatedAt", "lastUsed", "accountFK_id") FROM stdin;
\.


--
-- Data for Name: accounts_transaction; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: accounts_userpaymentmethod; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_userpaymentmethod (id, "methodType", "accountName", "accountNumber", "bankName", "isPrimary", "isVerified", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
1	GCASH	Vaniel Cornelio	09998500312	\N	t	f	2025-11-26 02:49:38.119406+00	2025-11-26 02:49:38.119421+00	6
2	GCASH	Vaniel Cornelio	09998500312	\N	t	f	2025-11-26 04:24:50.148184+00	2025-11-26 04:24:50.148195+00	7
3	GCASH	Ririka Ruii	09998500312	\N	t	f	2025-11-30 04:41:05.359022+00	2025-11-30 04:41:05.359036+00	23
\.


--
-- Data for Name: accounts_wallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_wallet ("walletID", balance, "createdAt", "updatedAt", "accountFK_id") FROM stdin;
3	1750.00	2025-10-20 08:55:36.800751+00	2025-11-30 09:13:59.863754+00	23
4	0.00	2025-11-12 01:05:54.023277+00	2025-11-12 01:05:54.023306+00	25
5	0.00	2025-11-14 09:24:14.775446+00	2025-11-14 09:24:14.775526+00	26
6	0.00	2025-11-14 12:43:43.633791+00	2025-11-14 12:43:43.633833+00	28
7	0.00	2025-11-14 13:42:09.448713+00	2025-11-14 13:42:09.448744+00	29
2	399.98	2025-10-19 15:37:39.965893+00	2025-11-30 11:01:41.377143+00	6
1	650.02	2025-10-18 15:52:55.329513+00	2025-12-01 03:06:16.734473+00	7
8	0.00	2025-11-21 23:25:16.410326+00	2025-11-21 23:25:16.410341+00	36
\.


--
-- Data for Name: accounts_workerprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_workerprofile (id, description, "workerRating", "totalEarningGross", availability_status, "profileID_id", bio, hourly_rate, profile_completion_percentage) FROM stdin;
3		0	0.00	AVAILABLE	9		\N	0
2	Test worker profile for availability testing	0	0.00	AVAILABLE	2		\N	0
4		0	0.00	AVAILABLE	11		\N	0
5		0	0.00	OFFLINE	21		\N	14
\.


--
-- Data for Name: accounts_workerspecialization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts_workerspecialization (id, "experienceYears", certification, "specializationID_id", "workerID_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_adminaccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_adminaccount ("adminID", role, permissions, "isActive", "lastLogin", "createdAt", "updatedAt", "accountFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_auditlog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_auditlog ("auditLogID", "adminEmail", action, "entityType", "entityID", details, "beforeValue", "afterValue", "ipAddress", "userAgent", "createdAt", "adminFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_cannedresponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_cannedresponse ("responseID", title, content, category, shortcuts, "usageCount", "createdAt", "updatedAt", "createdBy_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_faq; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_faq ("faqID", question, answer, category, "sortOrder", "viewCount", "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: adminpanel_kyclogs; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: adminpanel_platformsettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_platformsettings ("settingsID", "platformFeePercentage", "escrowHoldingDays", "maxJobBudget", "minJobBudget", "workerVerificationRequired", "autoApproveKYC", "kycDocumentExpiryDays", "maintenanceMode", "sessionTimeoutMinutes", "maxUploadSizeMB", "lastUpdated", "updatedBy_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_supportticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_supportticket ("ticketID", subject, category, priority, status, "createdAt", "updatedAt", "lastReplyAt", "resolvedAt", "assignedTo_id", "userFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_supportticketreply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_supportticketreply ("replyID", content, "isSystemMessage", "attachmentURL", "createdAt", "senderFK_id", "ticketFK_id") FROM stdin;
\.


--
-- Data for Name: adminpanel_systemroles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_systemroles ("systemRoleID", "systemRole", "createdAt", "updatedAt", "accountID_id") FROM stdin;
1	ADMIN	2025-09-30 11:25:53.809975+00	2025-09-30 11:25:53.809988+00	2
2	ADMIN	2025-10-06 04:47:14.787939+00	2025-10-06 04:47:14.78795+00	13
\.


--
-- Data for Name: adminpanel_userreport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adminpanel_userreport ("reportID", "reportType", reason, description, "relatedContentID", status, "adminNotes", "actionTaken", "createdAt", "updatedAt", "resolvedAt", "reportedUserFK_id", "reporterFK_id", "reviewedBy_id") FROM stdin;
\.


--
-- Data for Name: agency_agencykyc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agency_agencykyc ("agencyKycID", status, "reviewedAt", notes, "createdAt", "updatedAt", "accountFK_id", "reviewedBy_id", "rejectionCategory", "rejectionReason", "resubmissionCount", "maxResubmissions") FROM stdin;
2	APPROVED	2025-10-22 05:13:18.739574+00		2025-10-22 05:12:47.584874+00	2025-10-22 05:13:18.73982+00	23	\N	\N		0	3
3	REJECTED	2025-11-30 11:51:00.522951+00	Agency documents did not meet verification requirements	2025-11-14 12:42:01.071834+00	2025-11-30 11:51:00.80024+00	27	\N	\N		0	3
\.


--
-- Data for Name: agency_agencykycfile; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: agency_employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agency_employees ("employeeID", name, email, role, avatar, rating, "createdAt", "updatedAt", agency_id, "employeeOfTheMonth", "employeeOfTheMonthDate", "employeeOfTheMonthReason", "isActive", "lastRatingUpdate", "totalEarnings", "totalJobsCompleted") FROM stdin;
1	Gabriel Modillas	modillasgabriel@gmail.com	Carpentry	\N	5.00	2025-10-30 04:50:46.337643+00	2025-11-30 09:36:55.376183+00	23	t	2025-11-30 02:14:12.184372+00	Only Employee	t	\N	0.00	0
2	Vaniel Cornelio	new.cornelio.vaniel38@gmail.com	Welding	\N	5.00	2025-11-30 02:14:37.905079+00	2025-11-30 09:36:55.513327+00	23	f	\N		t	\N	0.00	0
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation ("conversationID", "lastMessageText", "lastMessageTime", "unreadCountClient", "unreadCountWorker", status, "createdAt", "updatedAt", client_id, "lastMessageSender_id", "relatedJobPosting_id", worker_id, "archivedByClient", "archivedByWorker", agency_id) FROM stdin;
10	\N	\N	0	0	COMPLETED	2025-11-30 07:50:10.762144+00	2025-11-30 09:13:59.262557+00	3	\N	45	\N	f	f	8
7	yeah	2025-11-26 04:23:03.616799+00	0	0	COMPLETED	2025-11-26 01:36:49.612011+00	2025-11-26 04:44:25.747445+00	3	3	34	2	f	f	\N
2	ULOL	2025-11-03 12:03:25.661164+00	0	0	ACTIVE	2025-11-03 11:32:20.741569+00	2025-11-03 12:03:25.978824+00	3	2	4	2	f	t	\N
4	Thanks for accepting the job	2025-11-06 03:40:05.644197+00	0	0	ACTIVE	2025-11-06 03:39:13.226553+00	2025-11-06 03:40:06.252105+00	3	2	10	2	f	t	\N
5	Hey man u ready?	2025-11-09 20:38:57.210409+00	0	0	COMPLETED	2025-11-09 20:38:41.031269+00	2025-11-26 05:44:29.905028+00	3	3	12	2	f	f	\N
9	wait what	2025-11-30 05:12:02.995378+00	0	0	COMPLETED	2025-11-30 03:05:43.912381+00	2025-11-30 05:25:22.147405+00	3	3	44	\N	f	f	8
3	done	2025-11-05 19:01:01.793318+00	0	0	ACTIVE	2025-11-05 18:58:41.02263+00	2025-11-05 19:01:01.923939+00	3	2	6	2	f	t	\N
11	Thanks for the opporutnity	2025-11-30 11:01:12.589402+00	1	0	COMPLETED	2025-11-30 10:58:12.850789+00	2025-11-30 11:01:12.703793+00	3	2	46	2	f	f	\N
6	bey	2025-11-23 12:38:34.03333+00	0	0	ACTIVE	2025-11-23 12:04:59.849655+00	2025-11-23 12:38:34.225916+00	3	2	7	2	f	f	\N
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
67dj9gv9zs34v08zv9q9q88yx8x54hmz	.eJytzcEKgjAYAOB3-c8ibm1terMogkLoEAUhsua01XKi0xDx3RN6Bc_f4RuhtVILI6S0XeWy1gmnWohGqHbN5Vavt8kgHOsfX4juI9SNlaqdHYwtdQUe5MIJiKrOGA_qt1SZtLnKetXoQqvmL5OHGA0xRpgxf4UJZ8Eq9eC4-VyR6qyVKN6Xp8MiA6d-wDGljMxD8hpMLMUZD-xZlLlYYiAB8XGIOA3DdJp-bpZo5Q:1v3Vqm:tzknnLjmXakuEPvF1v9nlOtrqaiM1wUTTOUlL9WgZMA	2025-10-14 08:36:44.292211+00
d3qfqbvionygdl0scf2hipgnv7cuv6nj	.eJylzc8KgjAcAOB3-Z2H7I9bzlu3ICiLDmGIjLliNZxsUwPx3Qt6hM7f4Vsgem2VU1r7sU9tTCqZCOUC5srz-kjpMz_V78lhKG8LDMFrE78Ozj9sDwg6lRSU_egcguGlTat9Z9rJBHu3JvxkRWQjqMSSMp4xUQiCSYNg7vYhrw5bbc7VeNnN_w6MYSYlzQQlBee8WdcPmVxIxQ:1vKduy:ofyNN7C0i4cPDcIl39Og3J6W1nXjTsYDINolmwRXMOA	2025-11-30 14:39:52.625017+00
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_applications ("applicationID", "proposalMessage", "proposedBudget", "estimatedDuration", "budgetOption", status, "createdAt", "updatedAt", "jobID_id", "workerID_id") FROM stdin;
2	I can do it i fix tables for a living	250.00		NEGOTIATE	ACCEPTED	2025-11-03 11:32:05.69898+00	2025-11-03 11:32:20.411814+00	4	2
3	EZ	500.00		ACCEPT	ACCEPTED	2025-11-05 18:58:01.455194+00	2025-11-05 18:58:40.674637+00	6	2
4	HEYYY	7750.00		ACCEPT	ACCEPTED	2025-11-06 03:38:52.978007+00	2025-11-06 03:39:12.886681+00	10	2
5	MINE	399.98		ACCEPT	ACCEPTED	2025-11-09 20:38:05.404137+00	2025-11-09 20:38:40.69459+00	12	2
19	Direct hire by client	1000.00	As discussed	ACCEPT	ACCEPTED	2025-11-19 16:26:28.877733+00	2025-11-19 16:26:28.877762+00	29	2
23	Direct hire by client	500.00	KSOXJENENW	ACCEPT	ACCEPTED	2025-11-23 10:05:28.694401+00	2025-11-23 10:05:28.694413+00	33	2
24	Direct hire by client	500.00	KSOXJENENW	ACCEPT	ACCEPTED	2025-11-23 10:06:12.293515+00	2025-11-23 10:06:12.293527+00	34	2
26	Hey raise the thing to 100	600.00		NEGOTIATE	ACCEPTED	2025-11-23 12:03:47.055521+00	2025-11-23 12:04:59.408241+00	7	2
27	Direct hire by client	500.00	As discussed	ACCEPT	ACCEPTED	2025-11-30 10:56:35.789435+00	2025-11-30 10:56:35.789453+00	46	2
\.


--
-- Data for Name: job_disputes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_disputes ("disputeID", "disputedBy", reason, description, status, priority, "jobAmount", "disputedAmount", resolution, "resolvedDate", "assignedTo", "openedDate", "updatedAt", "jobID_id") FROM stdin;
\.


--
-- Data for Name: job_employee_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_employee_assignments ("assignmentID", "assignedAt", notes, "isPrimaryContact", status, "employeeMarkedComplete", "employeeMarkedCompleteAt", "completionNotes", "assignedBy_id", employee_id, job_id) FROM stdin;
1	2025-11-30 08:36:20.146227+00		t	ASSIGNED	f	\N		23	1	45
2	2025-11-30 08:36:20.327184+00		f	ASSIGNED	f	\N		23	2	45
\.


--
-- Data for Name: job_logs; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: job_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_photos ("photoID", "photoURL", "fileName", "uploadedAt", "jobID_id") FROM stdin;
1	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_4/p_b.jfif	p_b.jfif	2025-11-03 10:57:02.957181+00	4
2	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_5/IMG_5654_imresizer.jpg	IMG_5654_imresizer.jpg	2025-11-05 15:16:27.911318+00	5
3	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_7/job_12/Screenshot%202025-11-03%20042440.png	Screenshot 2025-11-03 042440.png	2025-11-06 08:06:53.052533+00	12
\.


--
-- Data for Name: job_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_reviews ("reviewID", "reviewerType", rating, comment, status, "isFlagged", "flagReason", "flaggedAt", "helpfulCount", "createdAt", "updatedAt", "flaggedBy_id", "jobID_id", "revieweeID_id", "reviewerID_id", "revieweeAgencyID_id", "revieweeEmployeeID_id") FROM stdin;
1	CLIENT	4.00		ACTIVE	f	\N	\N	0	2025-11-04 04:28:24.070753+00	2025-11-04 04:28:24.070763+00	\N	4	6	7	\N	\N
2	WORKER	5.00	Good Client	ACTIVE	f	\N	\N	0	2025-11-04 04:51:00.793143+00	2025-11-04 04:51:00.793164+00	\N	4	7	6	\N	\N
3	WORKER	4.00		ACTIVE	f	\N	\N	0	2025-11-05 19:28:33.512359+00	2025-11-05 19:28:33.512376+00	\N	6	7	6	\N	\N
4	CLIENT	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:14:19.741317+00	2025-11-06 05:14:19.741326+00	\N	6	6	7	\N	\N
5	CLIENT	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:17:23.367516+00	2025-11-06 05:17:23.367526+00	\N	10	6	7	\N	\N
6	WORKER	5.00		ACTIVE	f	\N	\N	0	2025-11-06 05:33:00.02842+00	2025-11-06 05:33:00.028432+00	\N	10	7	6	\N	\N
7	CLIENT	3.00	Good, work was finished fast	ACTIVE	f	\N	\N	0	2025-11-23 15:24:19.162918+00	2025-11-23 15:24:19.162929+00	\N	7	6	7	\N	\N
8	WORKER	4.00	Responsive	ACTIVE	f	\N	\N	0	2025-11-23 15:30:46.894805+00	2025-11-23 15:30:46.894815+00	\N	7	7	6	\N	\N
9	CLIENT	4.00	Good Worker	ACTIVE	f	\N	\N	0	2025-11-26 04:44:36.251365+00	2025-11-26 04:44:36.251375+00	\N	34	6	7	\N	\N
10	WORKER	5.00	May pa free meryenda lab et	ACTIVE	f	\N	\N	0	2025-11-26 04:45:20.753972+00	2025-11-26 04:45:20.753985+00	\N	34	7	6	\N	\N
11	CLIENT	2.00	Slow Arrival	ACTIVE	f	\N	\N	0	2025-11-26 05:44:38.438956+00	2025-11-26 05:44:38.438964+00	\N	12	6	7	\N	\N
12	WORKER	3.00	Mid	ACTIVE	f	\N	\N	0	2025-11-26 06:10:31.310825+00	2025-11-26 06:10:31.310834+00	\N	12	7	6	\N	\N
13	CLIENT	5.00	Hey	ACTIVE	f	\N	\N	0	2025-11-30 05:51:45.862828+00	2025-11-30 05:51:45.862839+00	\N	44	\N	7	\N	1
14	CLIENT	5.00	cool	ACTIVE	f	\N	\N	0	2025-11-30 06:20:32.463312+00	2025-11-30 06:20:32.463322+00	\N	44	\N	7	8	\N
17	CLIENT	5.00	great worker	ACTIVE	f	\N	\N	0	2025-11-30 09:20:53.011266+00	2025-11-30 09:20:53.01128+00	\N	45	\N	7	\N	2
18	CLIENT	5.00	done	ACTIVE	f	\N	\N	0	2025-11-30 09:20:59.523545+00	2025-11-30 09:20:59.523554+00	\N	45	\N	7	\N	1
19	CLIENT	5.00	DEVANTEEEE	ACTIVE	f	\N	\N	0	2025-11-30 09:21:08.819245+00	2025-11-30 09:21:08.819255+00	\N	45	\N	7	8	\N
21	CLIENT	5.00	Great	ACTIVE	f	\N	\N	0	2025-11-30 11:00:22.110294+00	2025-11-30 11:00:22.110305+00	\N	46	6	7	\N	\N
22	WORKER	5.00	Great Employer	ACTIVE	f	\N	\N	0	2025-11-30 11:01:22.367861+00	2025-11-30 11:01:22.367875+00	\N	46	7	6	\N	\N
15	AGENCY	5.00		ACTIVE	f	\N	\N	0	2025-11-30 06:52:08.750821+00	2025-11-30 06:52:08.750832+00	\N	44	7	23	\N	\N
20	AGENCY	5.00		ACTIVE	f	\N	\N	0	2025-11-30 09:21:41.463477+00	2025-11-30 09:21:41.463486+00	\N	45	7	23	\N	\N
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs ("jobID", title, description, budget, location, "expectedDuration", urgency, "preferredStartDate", "materialsNeeded", status, "completedAt", "cancellationReason", "createdAt", "updatedAt", "assignedWorkerID_id", "categoryID_id", "clientID_id", "clientMarkedComplete", "clientMarkedCompleteAt", "workerMarkedComplete", "workerMarkedCompleteAt", "escrowAmount", "escrowPaid", "escrowPaidAt", "remainingPayment", "remainingPaymentPaid", "remainingPaymentPaidAt", "finalPaymentMethod", "cashPaymentProofUrl", "paymentMethodSelectedAt", "cashProofUploadedAt", "cashPaymentApproved", "cashPaymentApprovedAt", "cashPaymentApprovedBy_id", "assignedAgencyFK_id", "jobType", "inviteRejectionReason", "inviteRespondedAt", "inviteStatus", "clientConfirmedWorkStarted", "clientConfirmedWorkStartedAt", "assignedEmployeeID_id", "assignmentNotes", "employeeAssignedAt") FROM stdin;
1	Grass Cut	Grass cut my lawn	500.00	Pasobolong, Zone 4	\N	MEDIUM	2025-11-03	[]	CANCELLED	\N	\N	2025-11-01 09:06:20.062361+00	2025-11-01 09:31:37.332485+00	\N	10	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
2	Grass Cut	Grass cut my lawn	500.00	Pasobolong, Zone 4	\N	MEDIUM	2025-11-03	[]	CANCELLED	\N	\N	2025-11-01 09:06:30.104334+00	2025-11-01 09:31:41.338104+00	\N	10	1	f	\N	f	\N	0.00	f	\N	0.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
45	BUILD PAYA	HAUSHWBDHZHZBSBWBSJSJSBSIAIWJWNAJAJ	1500.00	BABAHAHAHAHAHAHAHAH, Cabatangan	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 09:21:09.019144+00	\N	2025-11-30 07:21:34.722239+00	2025-11-30 09:21:09.086697+00	\N	3	1	t	2025-11-30 09:13:58.986905+00	t	2025-11-30 09:13:49.877844+00	750.00	t	2025-11-30 07:21:34.721638+00	750.00	t	2025-11-30 09:14:00.000705+00	WALLET	\N	2025-11-30 09:13:58.98691+00	\N	f	\N	\N	8	INVITE	\N	2025-11-30 07:50:10.361269+00	ACCEPTED	t	2025-11-30 08:59:45.699064+00	1		2025-11-30 08:36:20.394757+00
5	PC Maintenance	MY PC SHIT	500.00	Boalan, Zamboanga City	2 Hours	MEDIUM	2025-11-05	[]	CANCELLED	\N	\N	2025-11-05 15:16:24.020112+00	2025-11-05 15:21:27.379422+00	\N	2	1	f	\N	f	\N	250.00	t	2025-11-05 15:16:24.019669+00	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
46	Fix Table	Table Broken	500.00	Phase 4, Cabaluay	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 11:01:22.491097+00	\N	2025-11-30 10:56:35.728781+00	2025-11-30 11:01:22.553174+00	2	3	1	t	2025-11-30 11:00:15.799628+00	t	2025-11-30 10:59:36.400806+00	250.00	t	2025-11-30 10:56:35.728104+00	250.00	t	2025-11-30 11:00:16.625918+00	WALLET	\N	2025-11-30 11:00:15.799634+00	\N	f	\N	\N	\N	INVITE	\N	2025-11-30 10:58:12.406876+00	ACCEPTED	t	2025-11-30 10:59:08.994847+00	\N	\N	\N
33	KSLSKDNEME	NSNDBEBSN	500.00	LAOXKENENW, Cabaluay	KSOXJENENW	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-23 10:05:28.502839+00	2025-12-01 03:06:16.304776+00	2	5	1	f	\N	f	\N	250.00	t	2025-11-23 10:05:28.502358+00	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	INVITE	No reason provided	2025-12-01 03:06:16.182144+00	REJECTED	f	\N	\N	\N	\N
9	Test Payment	asdfasdfasdf	7749.97	Campo Islam, Zamboanga City	9 hours	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-05 19:33:57.768218+00	2025-11-05 19:41:38.126041+00	\N	11	1	f	\N	f	\N	3874.99	f	\N	3874.99	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
6	PC FIX	Maintenance	500.00	Capisan, Zamboanga City	2 hours	MEDIUM	2025-11-05	[]	COMPLETED	2025-11-06 05:14:20.552924+00	\N	2025-11-05 15:21:55.130468+00	2025-11-06 05:14:20.72815+00	2	2	1	t	2025-11-05 19:03:10.166104+00	t	2025-11-05 18:59:13.640308+00	250.00	f	\N	250.00	t	2025-11-05 19:08:31.295862+00	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
10	TESTTT	TESTT	7750.00	Cabatangan, Zamboanga City	54 hours	MEDIUM	\N	[]	COMPLETED	2025-11-06 05:33:00.165127+00	\N	2025-11-05 19:41:52.85812+00	2025-11-06 05:33:00.233954+00	2	10	1	t	2025-11-06 05:10:04.695435+00	t	2025-11-06 03:40:06.704186+00	3875.00	t	2025-11-05 19:41:52.857525+00	3875.00	t	2025-11-06 05:12:50.491792+00	GCASH	\N	2025-11-06 05:10:04.69544+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
4	Fix Table	My table... Its Broken	250.00	Canelar, Zamboanga City	3	MEDIUM	2025-11-04	[]	COMPLETED	2025-11-04 04:28:14.577932+00	\N	2025-11-03 10:56:57.489371+00	2025-11-06 08:00:55.16746+00	2	3	1	t	2025-11-04 04:28:14.577927+00	t	2025-11-04 04:23:14.890827+00	0.00	f	\N	0.00	t	2025-11-06 08:00:54.826111+00	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
11	TERST @2	dfadfa	3874.99	Baliwasan, Zamboanga City	5 hours	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-05 19:56:43.494226+00	2025-11-06 08:06:18.96749+00	\N	9	1	f	\N	f	\N	1937.50	f	\N	1937.50	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
35	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:50:23.560066+00	2025-11-25 23:50:23.560079+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
36	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:50:45.409826+00	2025-11-25 23:50:45.409835+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
7	Hi Gab	:))	600.00	Malagutay, Zamboanga City	4 hours	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-05 19:29:03.829615+00	2025-11-23 15:17:42.938748+00	2	8	1	t	2025-11-23 15:17:42.877824+00	t	2025-11-23 14:23:25.615475+00	250.00	f	\N	250.00	f	\N	CASH	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/user-uploads/users/7/jobs/7/proof/cash_proof_20251123_151740_673c12ba.jpg	2025-11-23 15:17:42.877829+00	2025-11-23 15:17:42.877831+00	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-11-23 14:03:33.527915+00	\N	\N	\N
37	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:57:27.794555+00	2025-11-25 23:57:27.794566+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
38	JAOSKENENWNSN	fycyyyfuucjcjcjcjcjcjccu	500.00	PRESA, Baluno	\N	MEDIUM	\N	[]	ACTIVE	\N	\N	2025-11-25 23:58:43.450224+00	2025-11-25 23:58:43.450237+00	\N	5	1	f	\N	f	\N	250.00	f	\N	250.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	LISTING	\N	\N	\N	f	\N	\N	\N	\N
44	GEST AGENCY SHT	JSJDNDBDNDJSJ	500.00	SHES, Ayala	\N	MEDIUM	\N	[]	COMPLETED	2025-11-30 06:20:32.588015+00	\N	2025-11-26 06:36:18.409808+00	2025-11-30 06:20:32.648031+00	\N	5	1	t	2025-11-30 05:25:21.887765+00	t	2025-11-30 05:25:10.337986+00	250.00	t	2025-11-26 06:36:18.409198+00	250.00	t	2025-11-30 05:25:22.794684+00	WALLET	\N	2025-11-30 05:25:21.88777+00	\N	f	\N	\N	8	INVITE	\N	2025-11-26 06:36:35.556678+00	ACCEPTED	t	2025-11-30 05:12:20.021765+00	1		2025-11-26 08:58:30.824301+00
29	NSKSKSMS	nakskskwmns	1000.00	JAKSOXOXKSMSMD, Mangusu	\N	MEDIUM	\N	[]	CANCELLED	\N	\N	2025-11-19 16:26:28.813959+00	2025-11-26 01:36:36.906188+00	2	3	1	f	\N	f	\N	500.00	t	2025-11-19 16:26:28.813317+00	500.00	f	\N	\N	\N	\N	\N	f	\N	\N	\N	INVITE	No reason provided	2025-11-26 01:36:36.790575+00	REJECTED	f	\N	\N	\N	\N
12	HELLO HELO	dfasdfasdf	399.98	Cacao, Zamboanga City	3 hours	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-06 08:06:49.689452+00	2025-11-26 05:44:30.545909+00	2	10	1	t	2025-11-26 05:44:29.648842+00	t	2025-11-26 05:44:01.325699+00	199.99	t	2025-11-06 08:06:49.689015+00	199.99	t	2025-11-26 05:44:30.48189+00	WALLET	\N	2025-11-26 05:44:29.648846+00	\N	f	\N	\N	\N	LISTING	\N	\N	\N	t	2025-11-26 05:43:34.275372+00	\N	\N	\N
34	KSLSKDNEME	NSNDBEBSN	500.00	LAOXKENENW, Cabaluay	KSOXJENENW	MEDIUM	\N	[]	COMPLETED	\N	\N	2025-11-23 10:06:12.117208+00	2025-11-26 04:44:26.336896+00	2	5	1	t	2025-11-26 04:44:25.440438+00	t	2025-11-26 04:25:52.692313+00	250.00	t	2025-11-23 10:06:12.11672+00	250.00	t	2025-11-26 04:44:26.272167+00	CASH	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/user-uploads/users/7/jobs/34/proof/cash_proof_20251126_044423_7d9339ee.jpg	2025-11-26 04:44:25.440444+00	2025-11-26 04:44:25.440445+00	f	\N	\N	\N	INVITE	\N	2025-11-26 01:36:49.20945+00	ACCEPTED	t	2025-11-26 04:22:52.215181+00	\N	\N	\N
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: -
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
34	Thanks for the opporutnity	TEXT	\N	\N	\N	\N	f	\N	2025-11-30 11:01:12.589402+00	11	2	\N
\.


--
-- Data for Name: message_attachment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_attachment ("attachmentID", "fileURL", "fileName", "fileSize", "fileType", "uploadedAt", "messageID_id") FROM stdin;
\.


--
-- Data for Name: profiles_workerproduct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles_workerproduct ("productID", "productName", description, price, "priceUnit", "inStock", "stockQuantity", "productImage", "isActive", "createdAt", "updatedAt", "categoryID_id", "workerID_id") FROM stdin;
1	PVC Pipes	High-quality PVC pipes for plumbing installations	250.00	METER	t	50	\N	t	2025-11-16 23:07:34.728005+00	2025-11-16 23:07:34.728017+00	\N	3
2	Electrical Wires	Standard electrical wiring for residential installations	180.00	METER	t	100	\N	t	2025-11-16 23:07:34.800396+00	2025-11-16 23:07:34.800405+00	\N	3
3	Paint (Interior)	Premium quality interior paint, various colors available	1200.00	GALLON	t	15	\N	t	2025-11-16 23:07:34.866308+00	2025-11-16 23:07:34.866319+00	\N	3
4	Cement Mix	Professional grade cement for construction work	350.00	KG	f	0	\N	t	2025-11-16 23:07:34.932697+00	2025-11-16 23:07:34.932709+00	\N	3
\.


--
-- Data for Name: socialaccount_socialaccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.socialaccount_socialaccount (id, provider, uid, last_login, date_joined, extra_data, user_id) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialapp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.socialaccount_socialapp (id, provider, name, client_id, secret, key, provider_id, settings) FROM stdin;
\.


--
-- Data for Name: socialaccount_socialtoken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.socialaccount_socialtoken (id, token, token_secret, expires_at, account_id, app_id) FROM stdin;
\.


--
-- Data for Name: specializations; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: worker_certifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.worker_certifications ("certificationID", name, issuing_organization, issue_date, expiry_date, certificate_url, is_verified, verified_at, "createdAt", "updatedAt", verified_by_id, "workerID_id") FROM stdin;
1	TESDA Plumbing NC II	Technical Education and Skills Development Authority	2022-03-15	\N		t	\N	2025-11-16 23:07:34.417571+00	2025-11-16 23:07:34.417581+00	\N	3
2	Electrical Installation and Maintenance	TESDA	2021-08-20	2026-08-20		t	\N	2025-11-16 23:07:34.529936+00	2025-11-16 23:07:34.529945+00	\N	3
3	Occupational Safety and Health Training	Department of Labor and Employment	2023-01-10	2025-01-10		f	\N	2025-11-16 23:07:34.59584+00	2025-11-16 23:07:34.59585+00	\N	3
4	Certified Bumbay		\N	\N		f	\N	2025-11-23 04:14:27.55903+00	2025-11-23 07:26:12.914372+00	\N	5
\.


--
-- Data for Name: worker_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.worker_materials ("materialID", name, description, price, unit, image_url, is_available, "createdAt", "updatedAt", "workerID_id", quantity) FROM stdin;
1	Cement	PREMIUM CEMENT	450.00	per sack	https://agtldjbubhrrsxnsdaxc.supabase.co/storage/v1/object/public/users/user_21/materials/material_Cement_1763875374.jpg	t	2025-11-23 05:22:56.389731+00	2025-11-23 05:22:56.389742+00	5	1.00
\.


--
-- Data for Name: worker_portfolio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.worker_portfolio ("portfolioID", image_url, caption, display_order, file_name, file_size, "createdAt", "updatedAt", "workerID_id") FROM stdin;
\.


--
-- Name: account_emailaddress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_emailaddress_id_seq', 1, false);


--
-- Name: account_emailconfirmation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_emailconfirmation_id_seq', 1, false);


--
-- Name: accounts_accounts_accountID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_accounts_accountID_seq"', 36, true);


--
-- Name: accounts_accounts_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_accounts_groups_id_seq', 1, false);


--
-- Name: accounts_accounts_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_accounts_user_permissions_id_seq', 1, false);


--
-- Name: accounts_agency_agencyId_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_agency_agencyId_seq"', 9, true);


--
-- Name: accounts_barangay_barangayID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_barangay_barangayID_seq"', 99, true);


--
-- Name: accounts_city_cityID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_city_cityID_seq"', 1, true);


--
-- Name: accounts_clientprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_clientprofile_id_seq', 4, true);


--
-- Name: accounts_interestedjobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_interestedjobs_id_seq', 1, false);


--
-- Name: accounts_kyc_kycID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_kyc_kycID_seq"', 12, true);


--
-- Name: accounts_kycfiles_kycFileID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_kycfiles_kycFileID_seq"', 49, true);


--
-- Name: accounts_notification_notificationID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_notification_notificationID_seq"', 72, true);


--
-- Name: accounts_notificationsettings_settingsID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_notificationsettings_settingsID_seq"', 2, true);


--
-- Name: accounts_profile_profileID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_profile_profileID_seq"', 24, true);


--
-- Name: accounts_pushtoken_tokenID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_pushtoken_tokenID_seq"', 1, false);


--
-- Name: accounts_specializations_specializationID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_specializations_specializationID_seq"', 12, true);


--
-- Name: accounts_transaction_transactionID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_transaction_transactionID_seq"', 89, true);


--
-- Name: accounts_userpaymentmethod_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_userpaymentmethod_id_seq', 3, true);


--
-- Name: accounts_wallet_walletID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."accounts_wallet_walletID_seq"', 8, true);


--
-- Name: accounts_workerprofile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_workerprofile_id_seq', 5, true);


--
-- Name: accounts_workerspecialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_workerspecialization_id_seq', 1, false);


--
-- Name: adminpanel_adminaccount_adminID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_adminaccount_adminID_seq"', 1, false);


--
-- Name: adminpanel_auditlog_auditLogID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_auditlog_auditLogID_seq"', 1, false);


--
-- Name: adminpanel_cannedresponse_responseID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_cannedresponse_responseID_seq"', 1, false);


--
-- Name: adminpanel_faq_faqID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_faq_faqID_seq"', 1, false);


--
-- Name: adminpanel_kyclogs_logID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_kyclogs_logID_seq"', 12, true);


--
-- Name: adminpanel_platformsettings_settingsID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_platformsettings_settingsID_seq"', 1, false);


--
-- Name: adminpanel_supportticket_ticketID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_supportticket_ticketID_seq"', 1, false);


--
-- Name: adminpanel_supportticketreply_replyID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_supportticketreply_replyID_seq"', 1, false);


--
-- Name: adminpanel_systemroles_systemRoleID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_systemroles_systemRoleID_seq"', 2, true);


--
-- Name: adminpanel_userreport_reportID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."adminpanel_userreport_reportID_seq"', 1, false);


--
-- Name: agency_agencykyc_agencyKycID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."agency_agencykyc_agencyKycID_seq"', 3, true);


--
-- Name: agency_agencykycfile_fileID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."agency_agencykycfile_fileID_seq"', 25, true);


--
-- Name: agency_employees_employeeID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."agency_employees_employeeID_seq"', 2, true);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 248, true);


--
-- Name: conversation_conversationID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."conversation_conversationID_seq"', 11, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 62, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 107, true);


--
-- Name: job_applications_applicationID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_applications_applicationID_seq"', 27, true);


--
-- Name: job_disputes_disputeID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_disputes_disputeID_seq"', 1, false);


--
-- Name: job_employee_assignments_assignmentID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_employee_assignments_assignmentID_seq"', 2, true);


--
-- Name: job_logs_logID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_logs_logID_seq"', 45, true);


--
-- Name: job_photos_photoID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_photos_photoID_seq"', 3, true);


--
-- Name: job_reviews_reviewID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."job_reviews_reviewID_seq"', 22, true);


--
-- Name: jobs_jobID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."jobs_jobID_seq"', 46, true);


--
-- Name: message_attachment_attachmentID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."message_attachment_attachmentID_seq"', 1, false);


--
-- Name: message_messageID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."message_messageID_seq"', 34, true);


--
-- Name: profiles_workerproduct_productID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."profiles_workerproduct_productID_seq"', 4, true);


--
-- Name: socialaccount_socialaccount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.socialaccount_socialaccount_id_seq', 1, false);


--
-- Name: socialaccount_socialapp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.socialaccount_socialapp_id_seq', 1, false);


--
-- Name: socialaccount_socialtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.socialaccount_socialtoken_id_seq', 1, false);


--
-- Name: worker_certifications_certificationID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."worker_certifications_certificationID_seq"', 4, true);


--
-- Name: worker_materials_materialID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."worker_materials_materialID_seq"', 1, true);


--
-- Name: worker_portfolio_portfolioID_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."worker_portfolio_portfolioID_seq"', 1, false);


--
-- Name: account_emailaddress account_emailaddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_pkey PRIMARY KEY (id);


--
-- Name: account_emailaddress account_emailaddress_user_id_email_987c8728_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_user_id_email_987c8728_uniq UNIQUE (user_id, email);


--
-- Name: account_emailconfirmation account_emailconfirmation_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_key_key UNIQUE (key);


--
-- Name: account_emailconfirmation account_emailconfirmation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirmation_pkey PRIMARY KEY (id);


--
-- Name: accounts_accounts accounts_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_email_key UNIQUE (email);


--
-- Name: accounts_accounts_groups accounts_accounts_groups_accounts_id_group_id_fe616882_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_accounts_id_group_id_fe616882_uniq UNIQUE (accounts_id, group_id);


--
-- Name: accounts_accounts_groups accounts_accounts_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_pkey PRIMARY KEY (id);


--
-- Name: accounts_accounts accounts_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_pkey PRIMARY KEY ("accountID");


--
-- Name: accounts_accounts_user_permissions accounts_accounts_user_p_accounts_id_permission_i_310c5a2e_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_user_p_accounts_id_permission_i_310c5a2e_uniq UNIQUE (accounts_id, permission_id);


--
-- Name: accounts_accounts_user_permissions accounts_accounts_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: accounts_agency accounts_agency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_agency
    ADD CONSTRAINT accounts_agency_pkey PRIMARY KEY ("agencyId");


--
-- Name: accounts_barangay accounts_barangay_name_city_id_abb1e7d9_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT accounts_barangay_name_city_id_abb1e7d9_uniq UNIQUE (name, city_id);


--
-- Name: accounts_barangay accounts_barangay_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT accounts_barangay_pkey PRIMARY KEY ("barangayID");


--
-- Name: accounts_city accounts_city_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_city
    ADD CONSTRAINT accounts_city_name_key UNIQUE (name);


--
-- Name: accounts_city accounts_city_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_city
    ADD CONSTRAINT accounts_city_pkey PRIMARY KEY ("cityID");


--
-- Name: accounts_clientprofile accounts_clientprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT accounts_clientprofile_pkey PRIMARY KEY (id);


--
-- Name: accounts_clientprofile accounts_clientprofile_profileID_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT "accounts_clientprofile_profileID_id_key" UNIQUE ("profileID_id");


--
-- Name: accounts_interestedjobs accounts_interestedjobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT accounts_interestedjobs_pkey PRIMARY KEY (id);


--
-- Name: accounts_kyc accounts_kyc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT accounts_kyc_pkey PRIMARY KEY ("kycID");


--
-- Name: accounts_kycfiles accounts_kycfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_kycfiles
    ADD CONSTRAINT accounts_kycfiles_pkey PRIMARY KEY ("kycFileID");


--
-- Name: accounts_notification accounts_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_notification
    ADD CONSTRAINT accounts_notification_pkey PRIMARY KEY ("notificationID");


--
-- Name: accounts_notificationsettings accounts_notificationsettings_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT "accounts_notificationsettings_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: accounts_notificationsettings accounts_notificationsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT accounts_notificationsettings_pkey PRIMARY KEY ("settingsID");


--
-- Name: accounts_profile accounts_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_profile
    ADD CONSTRAINT accounts_profile_pkey PRIMARY KEY ("profileID");


--
-- Name: accounts_pushtoken accounts_pushtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT accounts_pushtoken_pkey PRIMARY KEY ("tokenID");


--
-- Name: accounts_pushtoken accounts_pushtoken_pushToken_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT "accounts_pushtoken_pushToken_key" UNIQUE ("pushToken");


--
-- Name: specializations accounts_specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT accounts_specializations_pkey PRIMARY KEY ("specializationID");


--
-- Name: accounts_transaction accounts_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT accounts_transaction_pkey PRIMARY KEY ("transactionID");


--
-- Name: accounts_transaction accounts_transaction_xenditInvoiceID_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_xenditInvoiceID_key" UNIQUE ("xenditInvoiceID");


--
-- Name: accounts_userpaymentmethod accounts_userpaymentmethod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_userpaymentmethod
    ADD CONSTRAINT accounts_userpaymentmethod_pkey PRIMARY KEY (id);


--
-- Name: accounts_wallet accounts_wallet_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT "accounts_wallet_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: accounts_wallet accounts_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT accounts_wallet_pkey PRIMARY KEY ("walletID");


--
-- Name: accounts_workerprofile accounts_workerprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT accounts_workerprofile_pkey PRIMARY KEY (id);


--
-- Name: accounts_workerprofile accounts_workerprofile_profileID_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT "accounts_workerprofile_profileID_id_key" UNIQUE ("profileID_id");


--
-- Name: accounts_workerspecialization accounts_workerspecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT accounts_workerspecialization_pkey PRIMARY KEY (id);


--
-- Name: adminpanel_adminaccount adminpanel_adminaccount_accountFK_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT "adminpanel_adminaccount_accountFK_id_key" UNIQUE ("accountFK_id");


--
-- Name: adminpanel_adminaccount adminpanel_adminaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT adminpanel_adminaccount_pkey PRIMARY KEY ("adminID");


--
-- Name: adminpanel_auditlog adminpanel_auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_auditlog
    ADD CONSTRAINT adminpanel_auditlog_pkey PRIMARY KEY ("auditLogID");


--
-- Name: adminpanel_cannedresponse adminpanel_cannedresponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_cannedresponse
    ADD CONSTRAINT adminpanel_cannedresponse_pkey PRIMARY KEY ("responseID");


--
-- Name: adminpanel_faq adminpanel_faq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_faq
    ADD CONSTRAINT adminpanel_faq_pkey PRIMARY KEY ("faqID");


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT adminpanel_kyclogs_pkey PRIMARY KEY ("kycLogID");


--
-- Name: adminpanel_platformsettings adminpanel_platformsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_platformsettings
    ADD CONSTRAINT adminpanel_platformsettings_pkey PRIMARY KEY ("settingsID");


--
-- Name: adminpanel_supportticket adminpanel_supportticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT adminpanel_supportticket_pkey PRIMARY KEY ("ticketID");


--
-- Name: adminpanel_supportticketreply adminpanel_supportticketreply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT adminpanel_supportticketreply_pkey PRIMARY KEY ("replyID");


--
-- Name: adminpanel_systemroles adminpanel_systemroles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_systemroles
    ADD CONSTRAINT adminpanel_systemroles_pkey PRIMARY KEY ("systemRoleID");


--
-- Name: adminpanel_userreport adminpanel_userreport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT adminpanel_userreport_pkey PRIMARY KEY ("reportID");


--
-- Name: agency_agencykyc agency_agencykyc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT agency_agencykyc_pkey PRIMARY KEY ("agencyKycID");


--
-- Name: agency_agencykycfile agency_agencykycfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_agencykycfile
    ADD CONSTRAINT agency_agencykycfile_pkey PRIMARY KEY ("fileID");


--
-- Name: agency_employees agency_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_employees
    ADD CONSTRAINT agency_employees_pkey PRIMARY KEY ("employeeID");


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY ("conversationID");


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY ("applicationID");


--
-- Name: job_disputes job_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_disputes
    ADD CONSTRAINT job_disputes_pkey PRIMARY KEY ("disputeID");


--
-- Name: job_employee_assignments job_employee_assignments_job_id_employee_id_458658f4_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignments_job_id_employee_id_458658f4_uniq UNIQUE (job_id, employee_id);


--
-- Name: job_employee_assignments job_employee_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignments_pkey PRIMARY KEY ("assignmentID");


--
-- Name: job_logs job_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT job_logs_pkey PRIMARY KEY ("logID");


--
-- Name: job_photos job_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT job_photos_pkey PRIMARY KEY ("photoID");


--
-- Name: job_reviews job_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT job_reviews_pkey PRIMARY KEY ("reviewID");


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY ("jobID");


--
-- Name: message_attachment message_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT message_attachment_pkey PRIMARY KEY ("attachmentID");


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY ("messageID");


--
-- Name: profiles_workerproduct profiles_workerproduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT profiles_workerproduct_pkey PRIMARY KEY ("productID");


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialaccount socialaccount_socialaccount_provider_uid_fc810c6e_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_socialaccount_provider_uid_fc810c6e_uniq UNIQUE (provider, uid);


--
-- Name: socialaccount_socialapp socialaccount_socialapp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialapp
    ADD CONSTRAINT socialaccount_socialapp_pkey PRIMARY KEY (id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq UNIQUE (app_id, account_id);


--
-- Name: socialaccount_socialtoken socialaccount_socialtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_socialtoken_pkey PRIMARY KEY (id);


--
-- Name: job_applications unique_job_application; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT unique_job_application UNIQUE ("jobID_id", "workerID_id");


--
-- Name: conversation unique_job_conversation; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT unique_job_conversation UNIQUE ("relatedJobPosting_id");


--
-- Name: worker_certifications worker_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT worker_certifications_pkey PRIMARY KEY ("certificationID");


--
-- Name: worker_materials worker_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_materials
    ADD CONSTRAINT worker_materials_pkey PRIMARY KEY ("materialID");


--
-- Name: worker_portfolio worker_portfolio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_portfolio
    ADD CONSTRAINT worker_portfolio_pkey PRIMARY KEY ("portfolioID");


--
-- Name: account_emailaddress_email_03be32b2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_emailaddress_email_03be32b2 ON public.account_emailaddress USING btree (email);


--
-- Name: account_emailaddress_email_03be32b2_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_emailaddress_email_03be32b2_like ON public.account_emailaddress USING btree (email varchar_pattern_ops);


--
-- Name: account_emailaddress_user_id_2c513194; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_emailaddress_user_id_2c513194 ON public.account_emailaddress USING btree (user_id);


--
-- Name: account_emailconfirmation_email_address_id_5b7f8c58; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_emailconfirmation_email_address_id_5b7f8c58 ON public.account_emailconfirmation USING btree (email_address_id);


--
-- Name: account_emailconfirmation_key_f43612bd_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_emailconfirmation_key_f43612bd_like ON public.account_emailconfirmation USING btree (key varchar_pattern_ops);


--
-- Name: accounts_accounts_banned_by_id_9d6a0a86; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_banned_by_id_9d6a0a86 ON public.accounts_accounts USING btree (banned_by_id);


--
-- Name: accounts_accounts_email_da8a4382_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_email_da8a4382_like ON public.accounts_accounts USING btree (email varchar_pattern_ops);


--
-- Name: accounts_accounts_groups_accounts_id_a094314b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_groups_accounts_id_a094314b ON public.accounts_accounts_groups USING btree (accounts_id);


--
-- Name: accounts_accounts_groups_group_id_d2af1629; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_groups_group_id_d2af1629 ON public.accounts_accounts_groups USING btree (group_id);


--
-- Name: accounts_accounts_user_permissions_accounts_id_001e820c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_user_permissions_accounts_id_001e820c ON public.accounts_accounts_user_permissions USING btree (accounts_id);


--
-- Name: accounts_accounts_user_permissions_permission_id_7df1f232; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_accounts_user_permissions_permission_id_7df1f232 ON public.accounts_accounts_user_permissions USING btree (permission_id);


--
-- Name: accounts_agency_accountFK_id_00b00793; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_agency_accountFK_id_00b00793" ON public.accounts_agency USING btree ("accountFK_id");


--
-- Name: accounts_ba_city_id_e22fce_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_ba_city_id_e22fce_idx ON public.accounts_barangay USING btree (city_id, name);


--
-- Name: accounts_ba_name_b64a2f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_ba_name_b64a2f_idx ON public.accounts_barangay USING btree (name);


--
-- Name: accounts_barangay_city_id_9f1a1154; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_barangay_city_id_9f1a1154 ON public.accounts_barangay USING btree (city_id);


--
-- Name: accounts_ci_name_3741a5_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_ci_name_3741a5_idx ON public.accounts_city USING btree (name);


--
-- Name: accounts_ci_provinc_3bc3e1_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_ci_provinc_3bc3e1_idx ON public.accounts_city USING btree (province);


--
-- Name: accounts_city_name_f214d25a_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_city_name_f214d25a_like ON public.accounts_city USING btree (name varchar_pattern_ops);


--
-- Name: accounts_interestedjobs_clientID_id_dac08b1c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_interestedjobs_clientID_id_dac08b1c" ON public.accounts_interestedjobs USING btree ("clientID_id");


--
-- Name: accounts_interestedjobs_specializationID_id_de8a5af8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_interestedjobs_specializationID_id_de8a5af8" ON public.accounts_interestedjobs USING btree ("specializationID_id");


--
-- Name: accounts_kyc_accountFK_id_564123ac; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_kyc_accountFK_id_564123ac" ON public.accounts_kyc USING btree ("accountFK_id");


--
-- Name: accounts_kyc_reviewedBy_id_c6f62ceb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_kyc_reviewedBy_id_c6f62ceb" ON public.accounts_kyc USING btree ("reviewedBy_id");


--
-- Name: accounts_kycfiles_kycID_id_9ce3c182; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_kycfiles_kycID_id_9ce3c182" ON public.accounts_kycfiles USING btree ("kycID_id");


--
-- Name: accounts_no_account_225939_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_no_account_225939_idx ON public.accounts_notification USING btree ("accountFK_id", "createdAt" DESC);


--
-- Name: accounts_no_account_992e61_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_no_account_992e61_idx ON public.accounts_notification USING btree ("accountFK_id", "isRead");


--
-- Name: accounts_notification_accountFK_id_83e15b07; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_notification_accountFK_id_83e15b07" ON public.accounts_notification USING btree ("accountFK_id");


--
-- Name: accounts_profile_accountFK_id_52ee2884; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_profile_accountFK_id_52ee2884" ON public.accounts_profile USING btree ("accountFK_id");


--
-- Name: accounts_pu_account_956577_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_pu_account_956577_idx ON public.accounts_pushtoken USING btree ("accountFK_id", "isActive");


--
-- Name: accounts_pu_pushTok_d919a9_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_pu_pushTok_d919a9_idx" ON public.accounts_pushtoken USING btree ("pushToken");


--
-- Name: accounts_pushtoken_accountFK_id_dd0aaf60; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_pushtoken_accountFK_id_dd0aaf60" ON public.accounts_pushtoken USING btree ("accountFK_id");


--
-- Name: accounts_pushtoken_pushToken_e1af6fba_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_pushtoken_pushToken_e1af6fba_like" ON public.accounts_pushtoken USING btree ("pushToken" varchar_pattern_ops);


--
-- Name: accounts_tr_referen_0f1695_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_tr_referen_0f1695_idx ON public.accounts_transaction USING btree ("referenceNumber");


--
-- Name: accounts_tr_status_c95c77_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_tr_status_c95c77_idx ON public.accounts_transaction USING btree (status, "createdAt" DESC);


--
-- Name: accounts_tr_transac_c2a5d5_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_tr_transac_c2a5d5_idx ON public.accounts_transaction USING btree ("transactionType", "createdAt" DESC);


--
-- Name: accounts_tr_walletI_417c5f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_tr_walletI_417c5f_idx" ON public.accounts_transaction USING btree ("walletID_id", "createdAt" DESC);


--
-- Name: accounts_tr_xenditE_a6ad2c_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_tr_xenditE_a6ad2c_idx" ON public.accounts_transaction USING btree ("xenditExternalID");


--
-- Name: accounts_tr_xenditI_348817_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_tr_xenditI_348817_idx" ON public.accounts_transaction USING btree ("xenditInvoiceID");


--
-- Name: accounts_transaction_relatedJobPosting_id_84d00915; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_transaction_relatedJobPosting_id_84d00915" ON public.accounts_transaction USING btree ("relatedJobPosting_id");


--
-- Name: accounts_transaction_walletID_id_9ee06035; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_transaction_walletID_id_9ee06035" ON public.accounts_transaction USING btree ("walletID_id");


--
-- Name: accounts_transaction_xenditInvoiceID_6f1c3fe4_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_transaction_xenditInvoiceID_6f1c3fe4_like" ON public.accounts_transaction USING btree ("xenditInvoiceID" varchar_pattern_ops);


--
-- Name: accounts_userpaymentmethod_accountFK_id_2c4e9955; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_userpaymentmethod_accountFK_id_2c4e9955" ON public.accounts_userpaymentmethod USING btree ("accountFK_id");


--
-- Name: accounts_wa_account_5c6166_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_wa_account_5c6166_idx ON public.accounts_wallet USING btree ("accountFK_id");


--
-- Name: accounts_workerspecialization_specializationID_id_a72faa78; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_workerspecialization_specializationID_id_a72faa78" ON public.accounts_workerspecialization USING btree ("specializationID_id");


--
-- Name: accounts_workerspecialization_workerID_id_11bc9350; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_workerspecialization_workerID_id_11bc9350" ON public.accounts_workerspecialization USING btree ("workerID_id");


--
-- Name: adminpanel__account_0675e3_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__account_0675e3_idx ON public.adminpanel_kyclogs USING btree ("accountFK_id");


--
-- Name: adminpanel__action_fac12d_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__action_fac12d_idx ON public.adminpanel_auditlog USING btree (action);


--
-- Name: adminpanel__action_ffbe16_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__action_ffbe16_idx ON public.adminpanel_kyclogs USING btree (action);


--
-- Name: adminpanel__adminFK_d93624_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel__adminFK_d93624_idx" ON public.adminpanel_auditlog USING btree ("adminFK_id");


--
-- Name: adminpanel__assigne_460e54_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__assigne_460e54_idx ON public.adminpanel_supportticket USING btree ("assignedTo_id");


--
-- Name: adminpanel__categor_11a477_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__categor_11a477_idx ON public.adminpanel_supportticket USING btree (category);


--
-- Name: adminpanel__created_301685_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__created_301685_idx ON public.adminpanel_userreport USING btree ("createdAt" DESC);


--
-- Name: adminpanel__created_3c5926_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__created_3c5926_idx ON public.adminpanel_auditlog USING btree ("createdAt" DESC);


--
-- Name: adminpanel__created_8a9f85_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__created_8a9f85_idx ON public.adminpanel_supportticket USING btree ("createdAt" DESC);


--
-- Name: adminpanel__entityT_72b6c5_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel__entityT_72b6c5_idx" ON public.adminpanel_auditlog USING btree ("entityType", "entityID");


--
-- Name: adminpanel__entityT_aea4a2_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel__entityT_aea4a2_idx" ON public.adminpanel_auditlog USING btree ("entityType");


--
-- Name: adminpanel__isActiv_aca720_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel__isActiv_aca720_idx" ON public.adminpanel_adminaccount USING btree ("isActive");


--
-- Name: adminpanel__priorit_cb784b_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__priorit_cb784b_idx ON public.adminpanel_supportticket USING btree (priority);


--
-- Name: adminpanel__reportT_47a4b1_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel__reportT_47a4b1_idx" ON public.adminpanel_userreport USING btree ("reportType");


--
-- Name: adminpanel__reviewe_a8552e_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__reviewe_a8552e_idx ON public.adminpanel_kyclogs USING btree ("reviewedAt" DESC);


--
-- Name: adminpanel__role_aca1c5_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__role_aca1c5_idx ON public.adminpanel_adminaccount USING btree (role);


--
-- Name: adminpanel__status_694d0c_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__status_694d0c_idx ON public.adminpanel_userreport USING btree (status);


--
-- Name: adminpanel__status_bb623a_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adminpanel__status_bb623a_idx ON public.adminpanel_supportticket USING btree (status);


--
-- Name: adminpanel_auditlog_adminFK_id_4eefb86e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_auditlog_adminFK_id_4eefb86e" ON public.adminpanel_auditlog USING btree ("adminFK_id");


--
-- Name: adminpanel_cannedresponse_createdBy_id_69f34ba6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_cannedresponse_createdBy_id_69f34ba6" ON public.adminpanel_cannedresponse USING btree ("createdBy_id");


--
-- Name: adminpanel_kyclogs_accountFK_id_cc292720; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_kyclogs_accountFK_id_cc292720" ON public.adminpanel_kyclogs USING btree ("accountFK_id");


--
-- Name: adminpanel_kyclogs_reviewedBy_id_7b3b6785; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_kyclogs_reviewedBy_id_7b3b6785" ON public.adminpanel_kyclogs USING btree ("reviewedBy_id");


--
-- Name: adminpanel_platformsettings_updatedBy_id_99ff4e3b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_platformsettings_updatedBy_id_99ff4e3b" ON public.adminpanel_platformsettings USING btree ("updatedBy_id");


--
-- Name: adminpanel_supportticket_assignedTo_id_ec7f4077; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_supportticket_assignedTo_id_ec7f4077" ON public.adminpanel_supportticket USING btree ("assignedTo_id");


--
-- Name: adminpanel_supportticket_userFK_id_7f238b84; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_supportticket_userFK_id_7f238b84" ON public.adminpanel_supportticket USING btree ("userFK_id");


--
-- Name: adminpanel_supportticketreply_senderFK_id_be761933; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_supportticketreply_senderFK_id_be761933" ON public.adminpanel_supportticketreply USING btree ("senderFK_id");


--
-- Name: adminpanel_supportticketreply_ticketFK_id_68cec9a2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_supportticketreply_ticketFK_id_68cec9a2" ON public.adminpanel_supportticketreply USING btree ("ticketFK_id");


--
-- Name: adminpanel_systemroles_accountID_id_b80596d8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_systemroles_accountID_id_b80596d8" ON public.adminpanel_systemroles USING btree ("accountID_id");


--
-- Name: adminpanel_userreport_reportedUserFK_id_b0aee279; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_userreport_reportedUserFK_id_b0aee279" ON public.adminpanel_userreport USING btree ("reportedUserFK_id");


--
-- Name: adminpanel_userreport_reporterFK_id_719fb23f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_userreport_reporterFK_id_719fb23f" ON public.adminpanel_userreport USING btree ("reporterFK_id");


--
-- Name: adminpanel_userreport_reviewedBy_id_2238d296; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "adminpanel_userreport_reviewedBy_id_2238d296" ON public.adminpanel_userreport USING btree ("reviewedBy_id");


--
-- Name: agency_agencykyc_accountFK_id_0f3bd1fa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "agency_agencykyc_accountFK_id_0f3bd1fa" ON public.agency_agencykyc USING btree ("accountFK_id");


--
-- Name: agency_agencykyc_reviewedBy_id_46ba9427; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "agency_agencykyc_reviewedBy_id_46ba9427" ON public.agency_agencykyc USING btree ("reviewedBy_id");


--
-- Name: agency_agencykycfile_agencyKyc_id_0fdb3a43; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "agency_agencykycfile_agencyKyc_id_0fdb3a43" ON public.agency_agencykycfile USING btree ("agencyKyc_id");


--
-- Name: agency_empl_agency__4dc656_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agency_empl_agency__4dc656_idx ON public.agency_employees USING btree (agency_id, "isActive");


--
-- Name: agency_empl_agency__8ae1c3_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agency_empl_agency__8ae1c3_idx ON public.agency_employees USING btree (agency_id, "employeeOfTheMonth");


--
-- Name: agency_empl_rating_2ae8be_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agency_empl_rating_2ae8be_idx ON public.agency_employees USING btree (rating DESC);


--
-- Name: agency_empl_totalJo_532418_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "agency_empl_totalJo_532418_idx" ON public.agency_employees USING btree ("totalJobsCompleted" DESC);


--
-- Name: agency_employees_agency_id_cea6dc3f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agency_employees_agency_id_cea6dc3f ON public.agency_employees USING btree (agency_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: conversatio_agency__90e6b8_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversatio_agency__90e6b8_idx ON public.conversation USING btree (agency_id, "updatedAt" DESC);


--
-- Name: conversatio_client__5b2f1f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversatio_client__5b2f1f_idx ON public.conversation USING btree (client_id, "updatedAt" DESC);


--
-- Name: conversatio_related_6f5495_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversatio_related_6f5495_idx ON public.conversation USING btree ("relatedJobPosting_id");


--
-- Name: conversatio_status_7e2047_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversatio_status_7e2047_idx ON public.conversation USING btree (status);


--
-- Name: conversatio_worker__cc2b64_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversatio_worker__cc2b64_idx ON public.conversation USING btree (worker_id, "updatedAt" DESC);


--
-- Name: conversation_agency_id_5b03fc82; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_agency_id_5b03fc82 ON public.conversation USING btree (agency_id);


--
-- Name: conversation_client_id_6121652e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_client_id_6121652e ON public.conversation USING btree (client_id);


--
-- Name: conversation_lastMessageSender_id_212ad3fe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "conversation_lastMessageSender_id_212ad3fe" ON public.conversation USING btree ("lastMessageSender_id");


--
-- Name: conversation_relatedJobPosting_id_e787baf8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "conversation_relatedJobPosting_id_e787baf8" ON public.conversation USING btree ("relatedJobPosting_id");


--
-- Name: conversation_worker_id_c1fa5961; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_worker_id_c1fa5961 ON public.conversation USING btree (worker_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: job_applica_jobID_i_c676f8_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_applica_jobID_i_c676f8_idx" ON public.job_applications USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_applica_status_08790f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_applica_status_08790f_idx ON public.job_applications USING btree (status, "createdAt" DESC);


--
-- Name: job_applica_workerI_027e10_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_applica_workerI_027e10_idx" ON public.job_applications USING btree ("workerID_id", "createdAt" DESC);


--
-- Name: job_applications_jobID_id_af6552d1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_applications_jobID_id_af6552d1" ON public.job_applications USING btree ("jobID_id");


--
-- Name: job_applications_workerID_id_218ce27c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_applications_workerID_id_218ce27c" ON public.job_applications USING btree ("workerID_id");


--
-- Name: job_assign_emp_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_assign_emp_status_idx ON public.jobs USING btree ("assignedEmployeeID_id", status);


--
-- Name: job_dispute_jobID_i_5435ed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_dispute_jobID_i_5435ed_idx" ON public.job_disputes USING btree ("jobID_id", "openedDate" DESC);


--
-- Name: job_dispute_priorit_40a747_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_dispute_priorit_40a747_idx ON public.job_disputes USING btree (priority, "openedDate" DESC);


--
-- Name: job_dispute_status_3f7a05_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_dispute_status_3f7a05_idx ON public.job_disputes USING btree (status, "openedDate" DESC);


--
-- Name: job_disputes_jobID_id_13a7964a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_disputes_jobID_id_13a7964a" ON public.job_disputes USING btree ("jobID_id");


--
-- Name: job_employe_employe_5d922f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_employe_employe_5d922f_idx ON public.job_employee_assignments USING btree (employee_id, status);


--
-- Name: job_employe_job_id_2d7113_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_employe_job_id_2d7113_idx ON public.job_employee_assignments USING btree (job_id, status);


--
-- Name: job_employee_assignments_assignedBy_id_177295a3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_employee_assignments_assignedBy_id_177295a3" ON public.job_employee_assignments USING btree ("assignedBy_id");


--
-- Name: job_employee_assignments_employee_id_494ec9c6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_employee_assignments_employee_id_494ec9c6 ON public.job_employee_assignments USING btree (employee_id);


--
-- Name: job_employee_assignments_job_id_73ae29a2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_employee_assignments_job_id_73ae29a2 ON public.job_employee_assignments USING btree (job_id);


--
-- Name: job_logs_changedBy_id_c84def83; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_logs_changedBy_id_c84def83" ON public.job_logs USING btree ("changedBy_id");


--
-- Name: job_logs_jobID_i_b5c46a_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_logs_jobID_i_b5c46a_idx" ON public.job_logs USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_logs_jobID_id_98d5ee9f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_logs_jobID_id_98d5ee9f" ON public.job_logs USING btree ("jobID_id");


--
-- Name: job_logs_newStat_d67ac4_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_logs_newStat_d67ac4_idx" ON public.job_logs USING btree ("newStatus", "createdAt" DESC);


--
-- Name: job_photos_jobID_id_7a20d525; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_photos_jobID_id_7a20d525" ON public.job_photos USING btree ("jobID_id");


--
-- Name: job_reviews_flaggedBy_id_a320e7dc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_flaggedBy_id_a320e7dc" ON public.job_reviews USING btree ("flaggedBy_id");


--
-- Name: job_reviews_isFlagg_8bb65d_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_isFlagg_8bb65d_idx" ON public.job_reviews USING btree ("isFlagged", "createdAt" DESC);


--
-- Name: job_reviews_jobID_i_fe8bbe_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_jobID_i_fe8bbe_idx" ON public.job_reviews USING btree ("jobID_id", "createdAt" DESC);


--
-- Name: job_reviews_jobID_id_faafb0c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_jobID_id_faafb0c7" ON public.job_reviews USING btree ("jobID_id");


--
-- Name: job_reviews_reviewe_1276ae_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_reviews_reviewe_1276ae_idx ON public.job_reviews USING btree ("revieweeAgencyID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_67461b_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_reviews_reviewe_67461b_idx ON public.job_reviews USING btree ("reviewerID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_c3a832_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_reviews_reviewe_c3a832_idx ON public.job_reviews USING btree ("revieweeEmployeeID_id", "createdAt" DESC);


--
-- Name: job_reviews_reviewe_f47e2e_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_reviews_reviewe_f47e2e_idx ON public.job_reviews USING btree ("revieweeID_id", "createdAt" DESC);


--
-- Name: job_reviews_revieweeAgencyID_id_9e4a1f26; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_revieweeAgencyID_id_9e4a1f26" ON public.job_reviews USING btree ("revieweeAgencyID_id");


--
-- Name: job_reviews_revieweeEmployeeID_id_675563af; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_revieweeEmployeeID_id_675563af" ON public.job_reviews USING btree ("revieweeEmployeeID_id");


--
-- Name: job_reviews_revieweeID_id_dd84a739; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_revieweeID_id_dd84a739" ON public.job_reviews USING btree ("revieweeID_id");


--
-- Name: job_reviews_reviewerID_id_f663e256; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "job_reviews_reviewerID_id_f663e256" ON public.job_reviews USING btree ("reviewerID_id");


--
-- Name: job_reviews_status_d2c214_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_reviews_status_d2c214_idx ON public.job_reviews USING btree (status, "createdAt" DESC);


--
-- Name: jobs_assigne_cc625f_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_assigne_cc625f_idx ON public.jobs USING btree ("assignedWorkerID_id", status);


--
-- Name: jobs_assignedAgencyFK_id_e16077b8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_assignedAgencyFK_id_e16077b8" ON public.jobs USING btree ("assignedAgencyFK_id");


--
-- Name: jobs_assignedEmployeeID_id_0654ee21; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_assignedEmployeeID_id_0654ee21" ON public.jobs USING btree ("assignedEmployeeID_id");


--
-- Name: jobs_assignedWorkerID_id_9fab1ae7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_assignedWorkerID_id_9fab1ae7" ON public.jobs USING btree ("assignedWorkerID_id");


--
-- Name: jobs_cashPaymentApprovedBy_id_7ed3ab69; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_cashPaymentApprovedBy_id_7ed3ab69" ON public.jobs USING btree ("cashPaymentApprovedBy_id");


--
-- Name: jobs_categor_d47dee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_categor_d47dee_idx ON public.jobs USING btree ("categoryID_id", status);


--
-- Name: jobs_categoryID_id_70143f40; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_categoryID_id_70143f40" ON public.jobs USING btree ("categoryID_id");


--
-- Name: jobs_clientID_id_f35c16c3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_clientID_id_f35c16c3" ON public.jobs USING btree ("clientID_id");


--
-- Name: jobs_clientI_03c7a0_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "jobs_clientI_03c7a0_idx" ON public.jobs USING btree ("clientID_id", "createdAt" DESC);


--
-- Name: jobs_status_9d014c_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_status_9d014c_idx ON public.jobs USING btree (status, "createdAt" DESC);


--
-- Name: jobs_urgency_b2dcee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_urgency_b2dcee_idx ON public.jobs USING btree (urgency, "createdAt" DESC);


--
-- Name: message_attachment_messageID_id_4b72e1bb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "message_attachment_messageID_id_4b72e1bb" ON public.message_attachment USING btree ("messageID_id");


--
-- Name: message_convers_1671b3_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_convers_1671b3_idx ON public.message USING btree ("conversationID_id", "createdAt");


--
-- Name: message_conversationID_id_bc59843b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "message_conversationID_id_bc59843b" ON public.message USING btree ("conversationID_id");


--
-- Name: message_isRead_b20976_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "message_isRead_b20976_idx" ON public.message USING btree ("isRead");


--
-- Name: message_senderAgency_id_1e392f6f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "message_senderAgency_id_1e392f6f" ON public.message USING btree ("senderAgency_id");


--
-- Name: message_sender__33ec43_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_sender__33ec43_idx ON public.message USING btree (sender_id, "createdAt" DESC);


--
-- Name: message_sender_id_a2a2e825; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_sender_id_a2a2e825 ON public.message USING btree (sender_id);


--
-- Name: profiles_workerproduct_categoryID_id_05fd3863; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "profiles_workerproduct_categoryID_id_05fd3863" ON public.profiles_workerproduct USING btree ("categoryID_id");


--
-- Name: profiles_workerproduct_workerID_id_79c64228; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "profiles_workerproduct_workerID_id_79c64228" ON public.profiles_workerproduct USING btree ("workerID_id");


--
-- Name: socialaccount_socialaccount_user_id_8146e70c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socialaccount_socialaccount_user_id_8146e70c ON public.socialaccount_socialaccount USING btree (user_id);


--
-- Name: socialaccount_socialtoken_account_id_951f210e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socialaccount_socialtoken_account_id_951f210e ON public.socialaccount_socialtoken USING btree (account_id);


--
-- Name: socialaccount_socialtoken_app_id_636a42d7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socialaccount_socialtoken_app_id_636a42d7 ON public.socialaccount_socialtoken USING btree (app_id);


--
-- Name: unique_primary_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_primary_email ON public.account_emailaddress USING btree (user_id, "primary") WHERE "primary";


--
-- Name: unique_verified_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_verified_email ON public.account_emailaddress USING btree (email) WHERE verified;


--
-- Name: worker_cert_expiry__fe5d02_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX worker_cert_expiry__fe5d02_idx ON public.worker_certifications USING btree (expiry_date);


--
-- Name: worker_cert_workerI_6b96e2_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_cert_workerI_6b96e2_idx" ON public.worker_certifications USING btree ("workerID_id", issue_date DESC);


--
-- Name: worker_certifications_verified_by_id_84b6e673; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX worker_certifications_verified_by_id_84b6e673 ON public.worker_certifications USING btree (verified_by_id);


--
-- Name: worker_certifications_workerID_id_e709a48d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_certifications_workerID_id_e709a48d" ON public.worker_certifications USING btree ("workerID_id");


--
-- Name: worker_mate_name_b9fee4_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX worker_mate_name_b9fee4_idx ON public.worker_materials USING btree (name);


--
-- Name: worker_mate_workerI_77a627_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_mate_workerI_77a627_idx" ON public.worker_materials USING btree ("workerID_id", is_available);


--
-- Name: worker_materials_workerID_id_98c651ce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_materials_workerID_id_98c651ce" ON public.worker_materials USING btree ("workerID_id");


--
-- Name: worker_port_workerI_7d29c4_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_port_workerI_7d29c4_idx" ON public.worker_portfolio USING btree ("workerID_id", display_order);


--
-- Name: worker_portfolio_workerID_id_010518a8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "worker_portfolio_workerID_id_010518a8" ON public.worker_portfolio USING btree ("workerID_id");


--
-- Name: account_emailaddress account_emailaddress_user_id_2c513194_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailaddress
    ADD CONSTRAINT account_emailaddress_user_id_2c513194_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: account_emailconfirmation account_emailconfirm_email_address_id_5b7f8c58_fk_account_e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_emailconfirmation
    ADD CONSTRAINT account_emailconfirm_email_address_id_5b7f8c58_fk_account_e FOREIGN KEY (email_address_id) REFERENCES public.account_emailaddress(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts accounts_accounts_banned_by_id_9d6a0a86_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts
    ADD CONSTRAINT accounts_accounts_banned_by_id_9d6a0a86_fk_accounts_ FOREIGN KEY (banned_by_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_groups accounts_accounts_gr_accounts_id_a094314b_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_gr_accounts_id_a094314b_fk_accounts_ FOREIGN KEY (accounts_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_groups accounts_accounts_groups_group_id_d2af1629_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_groups
    ADD CONSTRAINT accounts_accounts_groups_group_id_d2af1629_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_user_permissions accounts_accounts_us_accounts_id_001e820c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_us_accounts_id_001e820c_fk_accounts_ FOREIGN KEY (accounts_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_accounts_user_permissions accounts_accounts_us_permission_id_7df1f232_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_accounts_user_permissions
    ADD CONSTRAINT accounts_accounts_us_permission_id_7df1f232_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_agency accounts_agency_accountFK_id_00b00793_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_agency
    ADD CONSTRAINT "accounts_agency_accountFK_id_00b00793_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_barangay accounts_barangay_city_id_9f1a1154_fk_accounts_city_cityID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_barangay
    ADD CONSTRAINT "accounts_barangay_city_id_9f1a1154_fk_accounts_city_cityID" FOREIGN KEY (city_id) REFERENCES public.accounts_city("cityID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_clientprofile accounts_clientprofi_profileID_id_fa8b1900_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_clientprofile
    ADD CONSTRAINT "accounts_clientprofi_profileID_id_fa8b1900_fk_accounts_" FOREIGN KEY ("profileID_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_interestedjobs accounts_interestedj_clientID_id_dac08b1c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT "accounts_interestedj_clientID_id_dac08b1c_fk_accounts_" FOREIGN KEY ("clientID_id") REFERENCES public.accounts_clientprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_interestedjobs accounts_interestedj_specializationID_id_de8a5af8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_interestedjobs
    ADD CONSTRAINT "accounts_interestedj_specializationID_id_de8a5af8_fk_accounts_" FOREIGN KEY ("specializationID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kyc accounts_kyc_accountFK_id_564123ac_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT "accounts_kyc_accountFK_id_564123ac_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kyc accounts_kyc_reviewedBy_id_c6f62ceb_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_kyc
    ADD CONSTRAINT "accounts_kyc_reviewedBy_id_c6f62ceb_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_kycfiles accounts_kycfiles_kycID_id_9ce3c182_fk_accounts_kyc_kycID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_kycfiles
    ADD CONSTRAINT "accounts_kycfiles_kycID_id_9ce3c182_fk_accounts_kyc_kycID" FOREIGN KEY ("kycID_id") REFERENCES public.accounts_kyc("kycID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_notification accounts_notificatio_accountFK_id_83e15b07_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_notification
    ADD CONSTRAINT "accounts_notificatio_accountFK_id_83e15b07_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_notificationsettings accounts_notificatio_accountFK_id_97e2deff_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_notificationsettings
    ADD CONSTRAINT "accounts_notificatio_accountFK_id_97e2deff_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_profile accounts_profile_accountFK_id_52ee2884_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_profile
    ADD CONSTRAINT "accounts_profile_accountFK_id_52ee2884_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_pushtoken accounts_pushtoken_accountFK_id_dd0aaf60_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_pushtoken
    ADD CONSTRAINT "accounts_pushtoken_accountFK_id_dd0aaf60_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_transaction accounts_transaction_relatedJobPosting_id_84d00915_fk_jobs_jobI; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_relatedJobPosting_id_84d00915_fk_jobs_jobI" FOREIGN KEY ("relatedJobPosting_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_transaction accounts_transaction_walletID_id_9ee06035_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_transaction
    ADD CONSTRAINT "accounts_transaction_walletID_id_9ee06035_fk_accounts_" FOREIGN KEY ("walletID_id") REFERENCES public.accounts_wallet("walletID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_userpaymentmethod accounts_userpayment_accountFK_id_2c4e9955_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_userpaymentmethod
    ADD CONSTRAINT "accounts_userpayment_accountFK_id_2c4e9955_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_wallet accounts_wallet_accountFK_id_29a5de9e_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_wallet
    ADD CONSTRAINT "accounts_wallet_accountFK_id_29a5de9e_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerprofile accounts_workerprofi_profileID_id_dde1700c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerprofile
    ADD CONSTRAINT "accounts_workerprofi_profileID_id_dde1700c_fk_accounts_" FOREIGN KEY ("profileID_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerspecialization accounts_workerspeci_specializationID_id_a72faa78_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT "accounts_workerspeci_specializationID_id_a72faa78_fk_accounts_" FOREIGN KEY ("specializationID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: accounts_workerspecialization accounts_workerspeci_workerID_id_11bc9350_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts_workerspecialization
    ADD CONSTRAINT "accounts_workerspeci_workerID_id_11bc9350_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_adminaccount adminpanel_adminacco_accountFK_id_eeb69271_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_adminaccount
    ADD CONSTRAINT "adminpanel_adminacco_accountFK_id_eeb69271_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_auditlog adminpanel_auditlog_adminFK_id_4eefb86e_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_auditlog
    ADD CONSTRAINT "adminpanel_auditlog_adminFK_id_4eefb86e_fk_accounts_" FOREIGN KEY ("adminFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_cannedresponse adminpanel_cannedres_createdBy_id_69f34ba6_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_cannedresponse
    ADD CONSTRAINT "adminpanel_cannedres_createdBy_id_69f34ba6_fk_accounts_" FOREIGN KEY ("createdBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_accountFK_id_cc292720_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT "adminpanel_kyclogs_accountFK_id_cc292720_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_kyclogs adminpanel_kyclogs_reviewedBy_id_7b3b6785_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_kyclogs
    ADD CONSTRAINT "adminpanel_kyclogs_reviewedBy_id_7b3b6785_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_platformsettings adminpanel_platforms_updatedBy_id_99ff4e3b_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_platformsettings
    ADD CONSTRAINT "adminpanel_platforms_updatedBy_id_99ff4e3b_fk_accounts_" FOREIGN KEY ("updatedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticket adminpanel_supportti_assignedTo_id_ec7f4077_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT "adminpanel_supportti_assignedTo_id_ec7f4077_fk_accounts_" FOREIGN KEY ("assignedTo_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticketreply adminpanel_supportti_senderFK_id_be761933_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT "adminpanel_supportti_senderFK_id_be761933_fk_accounts_" FOREIGN KEY ("senderFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticketreply adminpanel_supportti_ticketFK_id_68cec9a2_fk_adminpane; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticketreply
    ADD CONSTRAINT "adminpanel_supportti_ticketFK_id_68cec9a2_fk_adminpane" FOREIGN KEY ("ticketFK_id") REFERENCES public.adminpanel_supportticket("ticketID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_supportticket adminpanel_supportti_userFK_id_7f238b84_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_supportticket
    ADD CONSTRAINT "adminpanel_supportti_userFK_id_7f238b84_fk_accounts_" FOREIGN KEY ("userFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_systemroles adminpanel_systemrol_accountID_id_b80596d8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_systemroles
    ADD CONSTRAINT "adminpanel_systemrol_accountID_id_b80596d8_fk_accounts_" FOREIGN KEY ("accountID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reportedUserFK_id_b0aee279_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reportedUserFK_id_b0aee279_fk_accounts_" FOREIGN KEY ("reportedUserFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reporterFK_id_719fb23f_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reporterFK_id_719fb23f_fk_accounts_" FOREIGN KEY ("reporterFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: adminpanel_userreport adminpanel_userrepor_reviewedBy_id_2238d296_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adminpanel_userreport
    ADD CONSTRAINT "adminpanel_userrepor_reviewedBy_id_2238d296_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykyc agency_agencykyc_accountFK_id_0f3bd1fa_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT "agency_agencykyc_accountFK_id_0f3bd1fa_fk_accounts_" FOREIGN KEY ("accountFK_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykyc agency_agencykyc_reviewedBy_id_46ba9427_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_agencykyc
    ADD CONSTRAINT "agency_agencykyc_reviewedBy_id_46ba9427_fk_accounts_" FOREIGN KEY ("reviewedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_agencykycfile agency_agencykycfile_agencyKyc_id_0fdb3a43_fk_agency_ag; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_agencykycfile
    ADD CONSTRAINT "agency_agencykycfile_agencyKyc_id_0fdb3a43_fk_agency_ag" FOREIGN KEY ("agencyKyc_id") REFERENCES public.agency_agencykyc("agencyKycID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: agency_employees agency_employees_agency_id_cea6dc3f_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_employees
    ADD CONSTRAINT agency_employees_agency_id_cea6dc3f_fk_accounts_ FOREIGN KEY (agency_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_agency_id_5b03fc82_fk_accounts_agency_agencyId" FOREIGN KEY (agency_id) REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_client_id_6121652e_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_client_id_6121652e_fk_accounts_profile_profileID" FOREIGN KEY (client_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_lastMessageSender_id_212ad3fe_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_lastMessageSender_id_212ad3fe_fk_accounts_" FOREIGN KEY ("lastMessageSender_id") REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_relatedJobPosting_id_e787baf8_fk_jobs_jobID" FOREIGN KEY ("relatedJobPosting_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: conversation conversation_worker_id_c1fa5961_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_worker_id_c1fa5961_fk_accounts_profile_profileID" FOREIGN KEY (worker_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_applications job_applications_jobID_id_af6552d1_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT "job_applications_jobID_id_af6552d1_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_applications job_applications_workerID_id_218ce27c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT "job_applications_workerID_id_218ce27c_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_disputes job_disputes_jobID_id_13a7964a_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_disputes
    ADD CONSTRAINT "job_disputes_jobID_id_13a7964a_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignm_assignedBy_id_177295a3_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT "job_employee_assignm_assignedBy_id_177295a3_fk_accounts_" FOREIGN KEY ("assignedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignm_employee_id_494ec9c6_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT job_employee_assignm_employee_id_494ec9c6_fk_agency_em FOREIGN KEY (employee_id) REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_employee_assignments job_employee_assignments_job_id_73ae29a2_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_employee_assignments
    ADD CONSTRAINT "job_employee_assignments_job_id_73ae29a2_fk_jobs_jobID" FOREIGN KEY (job_id) REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_logs job_logs_changedBy_id_c84def83_fk_accounts_accounts_accountID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT "job_logs_changedBy_id_c84def83_fk_accounts_accounts_accountID" FOREIGN KEY ("changedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_logs job_logs_jobID_id_98d5ee9f_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_logs
    ADD CONSTRAINT "job_logs_jobID_id_98d5ee9f_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_photos job_photos_jobID_id_7a20d525_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT "job_photos_jobID_id_7a20d525_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_flaggedBy_id_a320e7dc_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_flaggedBy_id_a320e7dc_fk_accounts_" FOREIGN KEY ("flaggedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_jobID_id_faafb0c7_fk_jobs_jobID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_jobID_id_faafb0c7_fk_jobs_jobID" FOREIGN KEY ("jobID_id") REFERENCES public.jobs("jobID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeAgencyID_id_9e4a1f26_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeAgencyID_id_9e4a1f26_fk_accounts_" FOREIGN KEY ("revieweeAgencyID_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeEmployeeID_i_675563af_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeEmployeeID_i_675563af_fk_agency_em" FOREIGN KEY ("revieweeEmployeeID_id") REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_revieweeID_id_dd84a739_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_revieweeID_id_dd84a739_fk_accounts_" FOREIGN KEY ("revieweeID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: job_reviews job_reviews_reviewerID_id_f663e256_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_reviews
    ADD CONSTRAINT "job_reviews_reviewerID_id_f663e256_fk_accounts_" FOREIGN KEY ("reviewerID_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedAgencyFK_id_e16077b8_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedAgencyFK_id_e16077b8_fk_accounts_agency_agencyId" FOREIGN KEY ("assignedAgencyFK_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedEmployeeID_i_0654ee21_fk_agency_em; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedEmployeeID_i_0654ee21_fk_agency_em" FOREIGN KEY ("assignedEmployeeID_id") REFERENCES public.agency_employees("employeeID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_assignedWorkerID_id_9fab1ae7_fk_accounts_workerprofile_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_assignedWorkerID_id_9fab1ae7_fk_accounts_workerprofile_id" FOREIGN KEY ("assignedWorkerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_cashPaymentApprovedB_7ed3ab69_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_cashPaymentApprovedB_7ed3ab69_fk_accounts_" FOREIGN KEY ("cashPaymentApprovedBy_id") REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_categoryID_id_70143f40_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_categoryID_id_70143f40_fk_accounts_" FOREIGN KEY ("categoryID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jobs jobs_clientID_id_f35c16c3_fk_accounts_clientprofile_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_clientID_id_f35c16c3_fk_accounts_clientprofile_id" FOREIGN KEY ("clientID_id") REFERENCES public.accounts_clientprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message_attachment message_attachment_messageID_id_4b72e1bb_fk_message_messageID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachment
    ADD CONSTRAINT "message_attachment_messageID_id_4b72e1bb_fk_message_messageID" FOREIGN KEY ("messageID_id") REFERENCES public.message("messageID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_conversationID_id_bc59843b_fk_conversat; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_conversationID_id_bc59843b_fk_conversat" FOREIGN KEY ("conversationID_id") REFERENCES public.conversation("conversationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_senderAgency_id_1e392f6f_fk_accounts_agency_agencyId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_senderAgency_id_1e392f6f_fk_accounts_agency_agencyId" FOREIGN KEY ("senderAgency_id") REFERENCES public.accounts_agency("agencyId") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: message message_sender_id_a2a2e825_fk_accounts_profile_profileID; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_sender_id_a2a2e825_fk_accounts_profile_profileID" FOREIGN KEY (sender_id) REFERENCES public.accounts_profile("profileID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: profiles_workerproduct profiles_workerprodu_categoryID_id_05fd3863_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT "profiles_workerprodu_categoryID_id_05fd3863_fk_accounts_" FOREIGN KEY ("categoryID_id") REFERENCES public.specializations("specializationID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: profiles_workerproduct profiles_workerprodu_workerID_id_79c64228_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles_workerproduct
    ADD CONSTRAINT "profiles_workerprodu_workerID_id_79c64228_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_account_id_951f210e_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_account_id_951f210e_fk_socialacc FOREIGN KEY (account_id) REFERENCES public.socialaccount_socialaccount(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialtoken socialaccount_social_app_id_636a42d7_fk_socialacc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialtoken
    ADD CONSTRAINT socialaccount_social_app_id_636a42d7_fk_socialacc FOREIGN KEY (app_id) REFERENCES public.socialaccount_socialapp(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: socialaccount_socialaccount socialaccount_social_user_id_8146e70c_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socialaccount_socialaccount
    ADD CONSTRAINT socialaccount_social_user_id_8146e70c_fk_accounts_ FOREIGN KEY (user_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_certifications worker_certification_verified_by_id_84b6e673_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT worker_certification_verified_by_id_84b6e673_fk_accounts_ FOREIGN KEY (verified_by_id) REFERENCES public.accounts_accounts("accountID") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_certifications worker_certification_workerID_id_e709a48d_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_certifications
    ADD CONSTRAINT "worker_certification_workerID_id_e709a48d_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_materials worker_materials_workerID_id_98c651ce_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_materials
    ADD CONSTRAINT "worker_materials_workerID_id_98c651ce_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: worker_portfolio worker_portfolio_workerID_id_010518a8_fk_accounts_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_portfolio
    ADD CONSTRAINT "worker_portfolio_workerID_id_010518a8_fk_accounts_" FOREIGN KEY ("workerID_id") REFERENCES public.accounts_workerprofile(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict Y9hWbdSXGCyz9pO5iE3fviZFFRM5dptj0khaCeEWBelGPNHbzikeVZ2l8s1ztjB

