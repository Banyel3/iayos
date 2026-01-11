-- iAyos PostgreSQL Database Schema for ERD
-- Generated: 2025-11-25
-- Source: Django Models from apps/backend/src/accounts/models.py

-- ============================================
-- CORE AUTHENTICATION & USER MANAGEMENT
-- ============================================

-- Main user accounts table
CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(64) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_until TIMESTAMP,
    suspended_reason TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    banned_at TIMESTAMP,
    banned_reason TEXT,
    banned_by_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    verify_token VARCHAR(255),
    verify_token_expiry TIMESTAMP,
    street_address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (worker or client)
CREATE TABLE profile (
    profile_id BIGSERIAL PRIMARY KEY,
    account_fk BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    profile_img VARCHAR(500),
    first_name VARCHAR(24) NOT NULL,
    middle_name VARCHAR(24),
    last_name VARCHAR(24) NOT NULL,
    contact_num VARCHAR(11) NOT NULL,
    birth_date DATE NOT NULL,
    profile_type VARCHAR(10) CHECK (profile_type IN ('WORKER', 'CLIENT')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    barangay VARCHAR(100),
    location_updated_at TIMESTAMP,
    location_sharing_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profile_account ON profile(account_fk);
CREATE INDEX idx_profile_type ON profile(profile_type);
CREATE INDEX idx_profile_location ON profile(latitude, longitude);

-- ============================================
-- WORKER-SPECIFIC TABLES
-- ============================================

-- Worker profiles (extended profile for workers)
CREATE TABLE worker_profile (
    worker_profile_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT UNIQUE NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    skills TEXT,
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worker_profile ON worker_profile(profile_id);
CREATE INDEX idx_worker_available ON worker_profile(is_available);

-- Worker certifications
CREATE TABLE worker_certification (
    certification_id BIGSERIAL PRIMARY KEY,
    worker_profile_id BIGINT NOT NULL REFERENCES worker_profile(worker_profile_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url VARCHAR(500),
    document_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cert_worker ON worker_certification(worker_profile_id);
CREATE INDEX idx_cert_verified ON worker_certification(is_verified);

-- Worker portfolio images
CREATE TABLE worker_portfolio (
    portfolio_id BIGSERIAL PRIMARY KEY,
    worker_profile_id BIGINT NOT NULL REFERENCES worker_profile(worker_profile_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_worker ON worker_portfolio(worker_profile_id);
CREATE INDEX idx_portfolio_order ON worker_portfolio(worker_profile_id, display_order);

-- ============================================
-- AGENCY TABLES
-- ============================================

-- Agency profiles
CREATE TABLE agency (
    agency_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT UNIQUE NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    agency_name VARCHAR(100) NOT NULL,
    description TEXT,
    contact_email VARCHAR(64),
    contact_phone VARCHAR(15),
    business_permit_number VARCHAR(50),
    kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    is_verified BOOLEAN DEFAULT FALSE,
    total_employees INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agency_profile ON agency(profile_id);
CREATE INDEX idx_agency_kyc ON agency(kyc_status);

-- Agency employees
CREATE TABLE agency_employee (
    employee_id BIGSERIAL PRIMARY KEY,
    agency_id BIGINT NOT NULL REFERENCES agency(agency_id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    position VARCHAR(50),
    hourly_rate DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    employee_of_the_month BOOLEAN DEFAULT FALSE,
    employee_of_the_month_date DATE,
    employee_of_the_month_reason TEXT,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    last_rating_update TIMESTAMP,
    total_jobs_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    hired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agency_id, profile_id)
);

CREATE INDEX idx_employee_agency ON agency_employee(agency_id);
CREATE INDEX idx_employee_profile ON agency_employee(profile_id);
CREATE INDEX idx_employee_active ON agency_employee(is_active);
CREATE INDEX idx_employee_rating ON agency_employee(average_rating);

-- ============================================
-- JOB & CATEGORY TABLES
-- ============================================

-- Job categories
CREATE TABLE jobcategory (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DOLE labor rates
CREATE TABLE dole_labor_rate (
    rate_id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES jobcategory(category_id) ON DELETE CASCADE,
    skill_level VARCHAR(20) CHECK (skill_level IN ('ENTRY', 'INTERMEDIATE', 'EXPERT')),
    hourly_rate DECIMAL(10, 2) NOT NULL,
    daily_rate DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dole_category ON dole_labor_rate(category_id);
CREATE INDEX idx_dole_skill ON dole_labor_rate(skill_level);

-- Main jobs table
CREATE TABLE job (
    job_id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES jobcategory(category_id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    job_type VARCHAR(10) CHECK (job_type IN ('LISTING', 'INVITE')),
    urgency VARCHAR(10) CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH')),
    materials_needed TEXT,
    preferred_start_date DATE,
    location TEXT,
    
    -- Worker/Agency assignment
    assigned_worker_id BIGINT REFERENCES profile(profile_id) ON DELETE SET NULL,
    assigned_agency_id BIGINT REFERENCES agency(agency_id) ON DELETE SET NULL,
    assigned_employee_id BIGINT REFERENCES agency_employee(employee_id) ON DELETE SET NULL,
    employee_assigned_at TIMESTAMP,
    assignment_notes TEXT,
    
    -- INVITE job specific
    invite_status VARCHAR(20) CHECK (invite_status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    invite_expires_at TIMESTAMP,
    
    -- Completion tracking
    client_confirmed_work_started BOOLEAN DEFAULT FALSE,
    worker_marked_complete BOOLEAN DEFAULT FALSE,
    worker_marked_complete_at TIMESTAMP,
    client_marked_complete BOOLEAN DEFAULT FALSE,
    client_marked_complete_at TIMESTAMP,
    completion_notes TEXT,
    client_reviewed BOOLEAN DEFAULT FALSE,
    worker_reviewed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_job_client ON job(client_id);
CREATE INDEX idx_job_category ON job(category_id);
CREATE INDEX idx_job_status ON job(status);
CREATE INDEX idx_job_type ON job(job_type);
CREATE INDEX idx_job_worker ON job(assigned_worker_id);
CREATE INDEX idx_job_agency ON job(assigned_agency_id);
CREATE INDEX idx_job_employee ON job(assigned_employee_id, status);

-- Job images
CREATE TABLE job_image (
    image_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(10) CHECK (uploaded_by IN ('CLIENT', 'WORKER')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_image_job ON job_image(job_id);

-- Job applications
CREATE TABLE job_application (
    application_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    worker_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    proposal_message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_application_job ON job_application(job_id);
CREATE INDEX idx_application_worker ON job_application(worker_id);
CREATE INDEX idx_application_status ON job_application(status);

-- Job activity log
CREATE TABLE job_log (
    log_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_log_job ON job_log(job_id);

-- ============================================
-- PAYMENT & WALLET TABLES
-- ============================================

-- User wallets
CREATE TABLE wallet (
    wallet_id BIGSERIAL PRIMARY KEY,
    account_fk BIGINT UNIQUE NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_account ON wallet(account_fk);

-- Wallet transactions
CREATE TABLE wallet_transaction (
    transaction_id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallet(wallet_id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'EARNING')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_wallet ON wallet_transaction(wallet_id);
CREATE INDEX idx_transaction_type ON wallet_transaction(transaction_type);
CREATE INDEX idx_transaction_date ON wallet_transaction(created_at);

-- Payment transactions (escrow + final)
CREATE TABLE transaction (
    transaction_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    payer_id BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    payee_id BIGINT REFERENCES accounts(account_id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_charged DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(10) CHECK (payment_type IN ('ESCROW', 'FINAL')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('WALLET', 'GCASH', 'CASH')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'VERIFYING', 'REFUNDED')),
    xendit_invoice_id VARCHAR(100),
    xendit_payment_id VARCHAR(100),
    cash_proof_image VARCHAR(500),
    verified_by_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_transaction_job ON transaction(job_id);
CREATE INDEX idx_transaction_payer ON transaction(payer_id);
CREATE INDEX idx_transaction_payee ON transaction(payee_id);
CREATE INDEX idx_transaction_status ON transaction(status);
CREATE INDEX idx_transaction_type ON transaction(payment_type);

-- ============================================
-- KYC VERIFICATION TABLES
-- ============================================

-- KYC submissions
CREATE TABLE kyc (
    kyc_id BIGSERIAL PRIMARY KEY,
    account_fk BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    id_type VARCHAR(50),
    id_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    reviewed_by_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_kyc_account ON kyc(account_fk);
CREATE INDEX idx_kyc_status ON kyc(status);

-- KYC document files
CREATE TABLE kyc_files (
    file_id BIGSERIAL PRIMARY KEY,
    kyc_id BIGINT NOT NULL REFERENCES kyc(kyc_id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_files_kyc ON kyc_files(kyc_id);

-- ============================================
-- REVIEWS & RATINGS TABLES
-- ============================================

-- Job reviews
CREATE TABLE review (
    review_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    reviewee_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    rating DECIMAL(2, 1) CHECK (rating BETWEEN 1.0 AND 5.0),
    comment TEXT,
    review_type VARCHAR(20) CHECK (review_type IN ('CLIENT_TO_WORKER', 'WORKER_TO_CLIENT', 'CLIENT_TO_AGENCY')),
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, reviewer_id, reviewee_id)
);

CREATE INDEX idx_review_job ON review(job_id);
CREATE INDEX idx_review_reviewer ON review(reviewer_id);
CREATE INDEX idx_review_reviewee ON review(reviewee_id);
CREATE INDEX idx_review_rating ON review(rating);

-- ============================================
-- MESSAGING TABLES
-- ============================================

-- Conversations
CREATE TABLE conversation (
    conversation_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES job(job_id) ON DELETE CASCADE,
    participant1_id BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    participant2_id BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant1_id, participant2_id, job_id)
);

CREATE INDEX idx_conversation_p1 ON conversation(participant1_id);
CREATE INDEX idx_conversation_p2 ON conversation(participant2_id);
CREATE INDEX idx_conversation_job ON conversation(job_id);

-- Messages
CREATE TABLE message (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    message_text TEXT,
    image_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_conversation ON message(conversation_id);
CREATE INDEX idx_message_sender ON message(sender_id);
CREATE INDEX idx_message_unread ON message(is_read, conversation_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notification (
    notification_id BIGSERIAL PRIMARY KEY,
    account_fk BIGINT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    related_job_id BIGINT REFERENCES job(job_id) ON DELETE CASCADE,
    related_user_id BIGINT REFERENCES accounts(account_id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_account ON notification(account_fk);
CREATE INDEX idx_notification_unread ON notification(is_read, account_fk);
CREATE INDEX idx_notification_type ON notification(notification_type);

-- ============================================
-- ADDITIONAL FEATURES
-- ============================================

-- Saved jobs
CREATE TABLE saved_job (
    saved_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    job_id BIGINT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, job_id)
);

CREATE INDEX idx_saved_profile ON saved_job(profile_id);
CREATE INDEX idx_saved_job ON saved_job(job_id);

-- Worker products/materials
CREATE TABLE worker_product (
    product_id BIGSERIAL PRIMARY KEY,
    worker_id BIGINT NOT NULL REFERENCES profile(profile_id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    unit VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_worker ON worker_product(worker_id);
CREATE INDEX idx_product_available ON worker_product(is_available);

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Key Relationships Summary:
-- 1. Accounts → Profile (1:Many - dual profiles supported)
-- 2. Profile → WorkerProfile/Agency (1:1 optional)
-- 3. Agency → AgencyEmployee (1:Many)
-- 4. Job → JobApplication (1:Many)
-- 5. Job → Transaction (1:Many - escrow + final)
-- 6. Accounts → Wallet (1:1)
-- 7. Job → Review (1:2 - bidirectional)
-- 8. Conversation → Message (1:Many)
-- 9. Accounts → Notification (1:Many)

-- Payment Flow:
-- Client creates job → Worker applies → Client accepts → Escrow payment (50% + 5% fee) →
-- Job in progress → Worker marks complete → Client approves → Final payment (50% + 5% fee) →
-- Both review → Job closed

-- Platform Fee: 5% of each payment (2.5% of total per phase)
-- Total: Client pays 105%, Worker receives 100%, Platform keeps 5%
