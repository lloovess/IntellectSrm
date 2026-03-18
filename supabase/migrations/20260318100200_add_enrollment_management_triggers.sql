-- Create triggers to automatically manage current_enrollment count

-- Trigger to increment current_enrollment when a student is enrolled
CREATE OR REPLACE FUNCTION increment_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE classes
    SET current_enrollment = current_enrollment + 1
    WHERE id = NEW.class_id AND NEW.status = 'active';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_increment_trigger
    AFTER INSERT ON enrollments
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION increment_class_enrollment();

-- Trigger to decrement current_enrollment when a student is unenrolled or status changes
CREATE OR REPLACE FUNCTION decrement_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed from active to something else, decrement
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE classes
        SET current_enrollment = GREATEST(current_enrollment - 1, 0)
        WHERE id = NEW.class_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_decrement_on_status_change_trigger
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION decrement_class_enrollment();

-- Trigger to decrement enrollment when enrollment is deleted
CREATE OR REPLACE FUNCTION decrement_class_enrollment_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'active' THEN
        UPDATE classes
        SET current_enrollment = GREATEST(current_enrollment - 1, 0)
        WHERE id = OLD.class_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_decrement_on_delete_trigger
    BEFORE DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION decrement_class_enrollment_on_delete();

-- Trigger to handle class_id change (move from one class to another)
CREATE OR REPLACE FUNCTION handle_class_change_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- If class changed and both old and new are active
    IF OLD.class_id IS DISTINCT FROM NEW.class_id THEN
        -- Decrement from old class if old was active
        IF OLD.status = 'active' THEN
            UPDATE classes
            SET current_enrollment = GREATEST(current_enrollment - 1, 0)
            WHERE id = OLD.class_id;
        END IF;
        -- Increment to new class if new is active
        IF NEW.status = 'active' THEN
            UPDATE classes
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.class_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_class_change_trigger
    AFTER UPDATE ON enrollments
    FOR EACH ROW
    WHEN (OLD.class_id IS DISTINCT FROM NEW.class_id)
    EXECUTE FUNCTION handle_class_change_on_enrollment();

-- Indexes for enrollment queries
CREATE INDEX idx_enrollments_class_id_status ON enrollments(class_id, status);
CREATE INDEX idx_enrollments_student_id_academic_year ON enrollments(student_id, academic_year);
CREATE INDEX idx_enrollments_branch_id ON enrollments(branch_id);

COMMENT ON FUNCTION increment_class_enrollment() IS 'Automatically increments class enrollment when a student is enrolled';
COMMENT ON FUNCTION decrement_class_enrollment() IS 'Automatically decrements class enrollment when student status changes';
COMMENT ON FUNCTION decrement_class_enrollment_on_delete() IS 'Automatically decrements class enrollment when enrollment is deleted';
COMMENT ON FUNCTION handle_class_change_on_enrollment() IS 'Automatically updates class enrollments when a student changes class';
