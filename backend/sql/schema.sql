-- CareDesk - Oracle Autonomous Database スキーマ
-- 実行順序: 1) テーブル作成 → 2) インデックス作成 → 3) 初期データ挿入

-- ============================================================
-- ユーザーテーブル
-- ============================================================
CREATE TABLE caredesk_users (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    email           VARCHAR2(255) NOT NULL,
    password_hash   VARCHAR2(255) NOT NULL,
    clinic_id       VARCHAR2(36),
    role            VARCHAR2(50)  DEFAULT 'admin',
    is_super_admin  NUMBER(1)     DEFAULT 0,
    created_date    VARCHAR2(50),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- ============================================================
-- 院（クリニック）テーブル
-- ============================================================
CREATE TABLE caredesk_clinics (
    id                      VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    name                    VARCHAR2(255) NOT NULL,
    slug                    VARCHAR2(100) NOT NULL,
    owner_email             VARCHAR2(255),
    phone                   VARCHAR2(50),
    email                   VARCHAR2(255),
    address                 CLOB,
    logo_url                VARCHAR2(500),
    business_hours          CLOB,          -- JSON
    treatment_menu          CLOB,          -- JSON array
    subscription_status     VARCHAR2(50)  DEFAULT 'trial',
    trial_end_date          VARCHAR2(20),
    subscription_start_date VARCHAR2(20),
    monthly_fee             NUMBER(10,2)  DEFAULT 3000,
    stripe_customer_id      VARCHAR2(255),
    stripe_subscription_id  VARCHAR2(255),
    created_date            VARCHAR2(50),
    updated_date            VARCHAR2(50),
    CONSTRAINT pk_clinics PRIMARY KEY (id),
    CONSTRAINT uq_clinics_slug UNIQUE (slug)
);

-- ============================================================
-- 患者テーブル
-- ============================================================
CREATE TABLE caredesk_patients (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id       VARCHAR2(36)  NOT NULL,
    name            VARCHAR2(255) NOT NULL,
    name_kana       VARCHAR2(255),
    phone           VARCHAR2(50)  NOT NULL,
    email           VARCHAR2(255),
    date_of_birth   VARCHAR2(20),
    gender          VARCHAR2(20),
    address         CLOB,
    insurance_type  VARCHAR2(100) DEFAULT '自費',
    medical_history CLOB,
    intake_notes    CLOB,
    last_visit_date VARCHAR2(20),
    total_visits    NUMBER(10)    DEFAULT 0,
    is_lapsed       NUMBER(1)     DEFAULT 0,
    created_date    VARCHAR2(50),
    updated_date    VARCHAR2(50),
    CONSTRAINT pk_patients PRIMARY KEY (id),
    CONSTRAINT fk_patients_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- 予約テーブル
-- ============================================================
CREATE TABLE caredesk_appointments (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id       VARCHAR2(36)  NOT NULL,
    patient_id      VARCHAR2(36),
    patient_name    VARCHAR2(255) NOT NULL,
    patient_phone   VARCHAR2(50),
    staff_id        VARCHAR2(36),
    staff_name      VARCHAR2(255),
    date            VARCHAR2(20)  NOT NULL,
    time            VARCHAR2(10)  NOT NULL,
    end_time        VARCHAR2(10),
    treatment_type  VARCHAR2(100) DEFAULT '再診',
    status          VARCHAR2(50)  DEFAULT 'confirmed',
    notes           CLOB,
    price           NUMBER(10,2),
    created_date    VARCHAR2(50),
    updated_date    VARCHAR2(50),
    CONSTRAINT pk_appointments PRIMARY KEY (id),
    CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- スタッフテーブル
-- ============================================================
CREATE TABLE caredesk_staff (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id       VARCHAR2(36)  NOT NULL,
    name            VARCHAR2(255) NOT NULL,
    email           VARCHAR2(255),
    phone           VARCHAR2(50),
    role            VARCHAR2(50)  DEFAULT 'therapist',
    specialization  VARCHAR2(255),
    avatar_url      VARCHAR2(500),
    is_active       NUMBER(1)     DEFAULT 1,
    created_date    VARCHAR2(50),
    updated_date    VARCHAR2(50),
    CONSTRAINT pk_staff PRIMARY KEY (id),
    CONSTRAINT fk_staff_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- 施術記録テーブル
-- ============================================================
CREATE TABLE caredesk_treatment_records (
    id                      VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id               VARCHAR2(36)  NOT NULL,
    patient_id              VARCHAR2(36)  NOT NULL,
    staff_id                VARCHAR2(36),
    date                    VARCHAR2(20)  NOT NULL,
    symptoms                CLOB,
    treatment_details       CLOB,
    body_areas              VARCHAR2(500),
    next_appointment_notes  VARCHAR2(500),
    insurance_claim_reason  VARCHAR2(500),
    insurance_body_parts    VARCHAR2(500),
    treatment_days          NUMBER(5),
    created_date            VARCHAR2(50),
    updated_date            VARCHAR2(50),
    CONSTRAINT pk_treatment_records PRIMARY KEY (id),
    CONSTRAINT fk_treatment_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- コース・回数券テーブル
-- ============================================================
CREATE TABLE caredesk_courses (
    id                  VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id           VARCHAR2(36)  NOT NULL,
    patient_id          VARCHAR2(36),
    patient_name        VARCHAR2(255),
    name                VARCHAR2(255) NOT NULL,
    total_sessions      NUMBER(5)     NOT NULL,
    remaining_sessions  NUMBER(5)     NOT NULL,
    total_price         NUMBER(10,2),
    status              VARCHAR2(50)  DEFAULT 'active',
    purchase_date       VARCHAR2(20),
    created_date        VARCHAR2(50),
    updated_date        VARCHAR2(50),
    CONSTRAINT pk_courses PRIMARY KEY (id),
    CONSTRAINT fk_courses_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- 請求書テーブル
-- ============================================================
CREATE TABLE caredesk_invoices (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id       VARCHAR2(36)  NOT NULL,
    patient_id      VARCHAR2(36),
    patient_name    VARCHAR2(255),
    date            VARCHAR2(20)  NOT NULL,
    treatment_type  VARCHAR2(100),
    amount          NUMBER(10,2)  NOT NULL,
    payment_status  VARCHAR2(50)  DEFAULT '未払い',
    payment_method  VARCHAR2(100),
    notes           CLOB,
    created_date    VARCHAR2(50),
    updated_date    VARCHAR2(50),
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT fk_invoices_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id)
);

-- ============================================================
-- レビューテーブル
-- ============================================================
CREATE TABLE caredesk_reviews (
    id              VARCHAR2(36)  DEFAULT SYS_GUID() NOT NULL,
    clinic_id       VARCHAR2(36)  NOT NULL,
    patient_id      VARCHAR2(36),
    patient_name    VARCHAR2(255),
    staff_id        VARCHAR2(36),
    staff_name      VARCHAR2(255),
    rating          NUMBER(1)     NOT NULL,
    comment         CLOB,
    date            VARCHAR2(20),
    created_date    VARCHAR2(50),
    updated_date    VARCHAR2(50),
    CONSTRAINT pk_reviews PRIMARY KEY (id),
    CONSTRAINT fk_reviews_clinic FOREIGN KEY (clinic_id) REFERENCES caredesk_clinics(id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

-- ============================================================
-- インデックス（パフォーマンス最適化）
-- ============================================================
CREATE INDEX idx_patients_clinic     ON caredesk_patients(clinic_id);
CREATE INDEX idx_patients_lapsed     ON caredesk_patients(clinic_id, is_lapsed);
CREATE INDEX idx_appointments_clinic ON caredesk_appointments(clinic_id);
CREATE INDEX idx_appointments_date   ON caredesk_appointments(clinic_id, date);
CREATE INDEX idx_staff_clinic        ON caredesk_staff(clinic_id);
CREATE INDEX idx_records_clinic      ON caredesk_treatment_records(clinic_id);
CREATE INDEX idx_records_patient     ON caredesk_treatment_records(patient_id);
CREATE INDEX idx_courses_clinic      ON caredesk_courses(clinic_id);
CREATE INDEX idx_invoices_clinic     ON caredesk_invoices(clinic_id);
CREATE INDEX idx_invoices_date       ON caredesk_invoices(clinic_id, date);
CREATE INDEX idx_reviews_clinic      ON caredesk_reviews(clinic_id);
CREATE INDEX idx_users_email         ON caredesk_users(email);

-- ============================================================
-- スーパー管理者アカウントの初期データ（パスワードは環境構築後に変更すること）
-- パスワード: admin_change_me  → bcryptハッシュ（Python: passlib.hash.bcrypt.hash("admin_change_me")）
-- ============================================================
-- INSERT INTO caredesk_users (id, email, password_hash, role, is_super_admin, created_date)
-- VALUES (
--   SYS_GUID(),
--   'admin@caredesk.jp',
--   '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  -- bcryptハッシュを入れること
--   'super_admin',
--   1,
--   TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD"T"HH24:MI:SS')
-- );
