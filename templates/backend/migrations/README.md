# Database Migration Templates

SQL migration templates for PostgreSQL.

## Migration Naming Convention

```
[number]_[description].sql

Examples:
- 001_initial_schema.sql
- 002_users_table.sql
- 003_add_user_roles.sql
```

## Initial Schema Template

```sql
-- migrations/001_initial_schema.sql
-- Initial database schema setup
--
-- @description Creates the base schema and initial tables
-- @version 1.0.0
-- @author Your Name

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    CONSTRAINT valid_token CHECK (
        (revoked_at IS NULL AND expires_at > NOW()) OR
        (revoked_at IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Sessions table (if using database sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## Content Tables Template

```sql
-- migrations/002_content_tables.sql
-- Tables for content management
--
-- @description Creates tables for posts, comments, tags, and categories
-- @version 1.0.0

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),

    -- Post metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),

    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Statistics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0
);

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = TRUE;

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Junction table for posts and categories
CREATE TABLE post_categories (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- Junction table for posts and tags
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    author_name VARCHAR(255),
    author_email VARCHAR(255),
    content TEXT NOT NULL,

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
```

## Rate Limiting Template

```sql
-- migrations/003_rate_limiting.sql
-- Tables for rate limiting and request tracking
--
-- @description Creates tables for distributed rate limiting
-- @version 1.0.0

CREATE TABLE rate_limits (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 minute',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_window CHECK (window_end > window_start)
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key VARCHAR,
    p_max_requests INTEGER,
    p_window_seconds INTEGER DEFAULT 60
) RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    v_window_start := date_trunc('second', NOW() AT TIME ZONE 'UTC');
    v_window_start := v_window_start - (EXTRACT(EPOCH FROM v_window_start) % p_window_seconds) * INTERVAL '1 second';
    v_window_end := v_window_start + p_window_seconds * INTERVAL '1 second';

    -- Insert or update rate limit record
    INSERT INTO rate_limits (key, count, window_start, window_end)
    VALUES (p_key, 1, v_window_start, v_window_end)
    ON CONFLICT (key)
    DO UPDATE SET
        count = rate_limits.count + 1,
        window_start = v_window_start,
        window_end = v_window_end
    WHERE rate_limits.window_end <= v_window_end
    RETURNING count INTO v_count;

    -- Check if limit exceeded
    RETURN QUERY SELECT
        (v_count <= p_max_requests) AS allowed,
        GREATEST(p_max_requests - v_count, 0) AS remaining,
        v_window_end AS reset_at;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits WHERE window_end < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Soft Delete Template

```sql
-- migrations/004_soft_delete.sql
-- Add soft delete functionality to tables
--
-- @description Adds deleted_at columns and triggers for soft deletion
-- @version 1.0.0

-- Function to handle soft deletes
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add deleted_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TRIGGER soft_delete_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION soft_delete();

-- Add deleted_at to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TRIGGER soft_delete_posts
    BEFORE UPDATE ON posts
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION soft_delete();

-- Create indexes for filtering active records
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(id) WHERE deleted_at IS NULL;

-- View for active users (excluding soft-deleted)
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- View for active posts
CREATE OR REPLACE VIEW active_posts AS
SELECT * FROM posts WHERE deleted_at IS NULL;
```

## Notification System Template

```sql
-- migrations/005_notifications.sql
-- Tables for notification system
--
-- @description Creates tables for user notifications
-- @version 1.0.0

CREATE TYPE notification_type AS ENUM (
    'comment',
    'like',
    'follow',
    'mention',
    'system',
    'alert'
);

CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'delivered',
    'read',
    'failed'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',

    -- Links
    link_url VARCHAR(500),
    entity_type VARCHAR(100),
    entity_id UUID,

    -- Status
    status notification_status DEFAULT 'pending',

    -- Delivery
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_link CHECK (
        (link_url IS NOT NULL) OR
        (entity_type IS NOT NULL AND entity_id IS NOT NULL) OR
        (type = 'system')
    )
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE read_at IS NULL;

-- Notification preferences
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_comments BOOLEAN DEFAULT TRUE,
    email_likes BOOLEAN DEFAULT TRUE,
    email_follows BOOLEAN DEFAULT TRUE,
    email_mentions BOOLEAN DEFAULT TRUE,
    email_system BOOLEAN DEFAULT TRUE,
    push_comments BOOLEAN DEFAULT TRUE,
    push_likes BOOLEAN DEFAULT TRUE,
    push_follows BOOLEAN DEFAULT TRUE,
    push_mentions BOOLEAN DEFAULT TRUE,
    push_system BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Analytics Template

```sql
-- migrations/006_analytics.sql
-- Tables for analytics and event tracking
--
-- @description Creates tables for page views, events, and analytics
-- @version 1.0.0

CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}',

    -- Request info
    url VARCHAR(1000),
    referrer VARCHAR(1000),
    user_agent TEXT,
    ip_address INET,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
CREATE TABLE analytics_events_y2024m01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_properties ON analytics_events USING gin(properties);

-- Page views table
CREATE TABLE page_views (
    id BIGSERIAL PRIMARY KEY,
    path VARCHAR(500) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    duration_seconds INTEGER,

    -- Referrer info
    referrer VARCHAR(1000),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),

    -- Device info
    browser VARCHAR(100),
    os VARCHAR(100),
    device_type VARCHAR(50),
    screen_width INTEGER,
    screen_height INTEGER,

    -- Location (optional)
    country_code CHAR(2),
    city VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);

-- Aggregated daily stats
CREATE TABLE daily_stats (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    stat_key VARCHAR(100) NOT NULL,
    count BIGINT DEFAULT 0,
    value NUMERIC,
    metadata JSONB DEFAULT '{}',

    UNIQUE(stat_date, stat_type, stat_key)
);

CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);
CREATE INDEX idx_daily_stats_type ON daily_stats(stat_type, stat_key);

-- Materialized view for recent page view stats
CREATE MATERIALIZED VIEW mv_recent_page_stats AS
SELECT
    path,
    DATE_TRUNC('day', created_at) as stat_date,
    COUNT(*) as views,
    COUNT(DISTINCT user_id) as unique_visitors,
    AVG(duration_seconds) as avg_duration
FROM page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY path, DATE_TRUNC('day', created_at');

CREATE UNIQUE INDEX ON mv_recent_page_stats (path, stat_date);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_recent_page_stats() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_page_stats;
END;
$$ LANGUAGE plpgsql;
```

## Migration Execution Script

```bash
#!/bin/bash
# scripts/run-migration.sh

set -e

DB_HOST=${DB_HOST:-postgres.default.svc.cluster.local}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-app_db}
DB_USER=${DB_USER:-app_user}
MIGRATIONS_DIR=$(dirname "$0")/../migrations

echo "Running migrations..."
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"

# Get list of migration files sorted by number
migration_files=$(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort || true)

if [ -z "$migration_files" ]; then
    echo "No migration files found in $MIGRATIONS_DIR"
    exit 1
fi

for migration in $migration_files; do
    filename=$(basename "$migration")
    echo "Applying: $filename"

    kubectl exec -it postgres-0 -n database -- psql \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "/migrations/$filename"

    echo "✓ Applied: $filename"
done

echo "All migrations completed successfully!"
```
