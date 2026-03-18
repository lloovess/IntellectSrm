-- Add academic_year_id and current_enrollment to classes table
ALTER TABLE classes
ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
ADD COLUMN current_enrollment INTEGER NOT NULL DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW(),
ADD CONSTRAINT check_enrollment_within_capacity CHECK (current_enrollment <= capacity);

-- Backfill academic_year_id based on existing academic_year text
-- Find or create academic years from existing classes
INSERT INTO academic_years (name, start_date, end_date, status)
SELECT DISTINCT
    c.academic_year,
    '2025-09-01'::DATE,
    '2026-08-31'::DATE,
    'active'
FROM classes c
WHERE c.academic_year IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Update classes with academic_year_id
UPDATE classes c
SET academic_year_id = ay.id
FROM academic_years ay
WHERE c.academic_year = ay.name
AND c.academic_year_id IS NULL;

-- Make academic_year_id NOT NULL
ALTER TABLE classes
ALTER COLUMN academic_year_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_classes_branch_year ON classes(branch_id, academic_year_id);
CREATE INDEX idx_classes_academic_year_id ON classes(academic_year_id);
CREATE INDEX idx_classes_status ON classes(status);

-- Create trigger to update updated_at timestamp for classes
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

COMMENT ON COLUMN classes.academic_year_id IS 'Reference to academic_years table';
COMMENT ON COLUMN classes.current_enrollment IS 'Current number of enrolled students (maintained by triggers)';
