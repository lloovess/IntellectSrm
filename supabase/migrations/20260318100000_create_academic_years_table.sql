-- Create helper function for updating timestamps (if not exists)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create academic_years table
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for name lookup
CREATE INDEX idx_academic_years_name ON academic_years(name);
CREATE INDEX idx_academic_years_status ON academic_years(status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_academic_years_updated_at
    BEFORE UPDATE ON academic_years
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

COMMENT ON TABLE academic_years IS 'Academic years (e.g., 2025-2026)';
COMMENT ON COLUMN academic_years.name IS 'Academic year name, e.g., "2025-2026"';
COMMENT ON COLUMN academic_years.status IS 'Status: active or archived';
