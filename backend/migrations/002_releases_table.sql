-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL,
    description TEXT,
    artifacts JSONB NOT NULL, -- { mfes: [{name, version, url}], functions: [{name, url}] }
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);
