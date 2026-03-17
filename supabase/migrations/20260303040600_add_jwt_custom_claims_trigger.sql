-- Function to sync the role from the user_roles table into auth.users raw_app_meta_data
CREATE OR REPLACE FUNCTION public.sync_user_role_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- We assume 'role' column is what you want to store in meta data
  UPDATE auth.users
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists, so migration is idempotent
DROP TRIGGER IF EXISTS on_user_role_updated ON public.user_roles;

-- Bind the trigger to the user_roles table
CREATE TRIGGER on_user_role_updated
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_app_metadata();

-- Backfill script to populate existing users' app_metadata
UPDATE auth.users u
SET raw_app_meta_data = 
  coalesce(u.raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', ur.role)
FROM public.user_roles ur
WHERE u.id = ur.user_id;

-- Ensure that raw_app_meta_data ->> 'role' is protected from users changing it 
-- normally handled by Supabase, users cannot modify their own app_metadata directly.
