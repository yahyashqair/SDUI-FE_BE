-- SDUI Database Schema
-- Run this after PostgreSQL is deployed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MFE Registry Table
-- Stores metadata for Micro-Frontends
-- ============================================================
CREATE TABLE mfe_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    source VARCHAR(500) NOT NULL,
    integrity VARCHAR(200),
    version VARCHAR(20) DEFAULT '1.0.0',
    variables JSONB DEFAULT '{}',
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active MFEs lookup
CREATE INDEX idx_mfe_registry_active ON mfe_registry(active) WHERE active = true;
CREATE INDEX idx_mfe_registry_name ON mfe_registry(name);

-- ============================================================
-- SDUI Pages Table
-- Stores SDUI configurations for each page/route
-- ============================================================
CREATE TABLE sdui_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path VARCHAR(500) NOT NULL,
    title VARCHAR(200),
    mfe_name VARCHAR(100) REFERENCES mfe_registry(name),
    config JSONB NOT NULL,
    variables JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint on path + active (only one active version per path)
CREATE UNIQUE INDEX idx_sdui_pages_path_active ON sdui_pages(path) WHERE active = true;
CREATE INDEX idx_sdui_pages_mfe ON sdui_pages(mfe_name);

-- ============================================================
-- Users Table
-- Basic user management
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- Audit Log Table
-- Track changes to SDUI configurations
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- Function: Update timestamp trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_mfe_registry_updated_at
    BEFORE UPDATE ON mfe_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sdui_pages_updated_at
    BEFORE UPDATE ON sdui_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed Data: Sample MFEs (matches your current public/mfe/)
-- ============================================================
INSERT INTO mfe_registry (name, source, version, variables, description) VALUES
('hc-dashboard', '/mfe/hc-dashboard/index.js', '1.0.0', '{"title": "Healthcare Dashboard"}', 'Main dashboard with stats, charts, and recent activity'),
('hc-appointments', '/mfe/hc-appointments/index.js', '1.0.0', '{"title": "Appointments"}', 'Manage patient appointments and scheduling'),
('hc-patients', '/mfe/hc-patients/index.js', '1.0.0', '{"title": "Patients"}', 'Patient directory and search'),
('hc-records', '/mfe/hc-records/index.js', '1.0.0', '{"title": "Medical Records"}', 'Patient medical records and history'),
('hc-settings', '/mfe/hc-settings/index.js', '1.0.0', '{"title": "Settings"}', 'User preferences and system settings'),
('dashboard', '/mfe/dashboard/index.js', '1.0.0', '{"title": "Dashboard"}', 'General dashboard MFE'),
('about-us', '/mfe/about-us/index.js', '1.0.0', '{"title": "About Us"}', 'About page MFE');

-- ============================================================
-- Seed Data: Sample SDUI Pages
-- ============================================================
INSERT INTO sdui_pages (path, title, mfe_name, config) VALUES
('/healthcare', 'Healthcare Dashboard', 'hc-dashboard', '{
    "version": "1.0.0",
    "root": {
        "type": "Container",
        "id": "page-container",
        "children": [
            {
                "type": "Hero",
                "id": "welcome-hero",
                "title": "Welcome to Healthcare Portal",
                "subtitle": "Manage your practice efficiently"
            }
        ]
    }
}'::jsonb),
('/healthcare/appointments', 'Appointments', 'hc-appointments', '{
    "version": "1.0.0",
    "root": {
        "type": "Container",
        "id": "appointments-container",
        "children": []
    }
}'::jsonb),
('/healthcare/patients', 'Patients', 'hc-patients', '{
    "version": "1.0.0",
    "root": {
        "type": "Container",
        "id": "patients-container",
        "children": []
    }
}'::jsonb);

-- ============================================================
-- Permissions (for future role-based access)
-- ============================================================
COMMENT ON TABLE mfe_registry IS 'Registry of all available Micro-Frontends';
COMMENT ON TABLE sdui_pages IS 'SDUI page configurations with versioning';
COMMENT ON TABLE users IS 'User accounts for the platform';
COMMENT ON TABLE audit_log IS 'Audit trail for configuration changes';
