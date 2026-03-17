-- Add payment_due_day to contracts with default 1
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_due_day integer NOT NULL DEFAULT 1 CHECK (payment_due_day >= 1 AND payment_due_day <= 31);
