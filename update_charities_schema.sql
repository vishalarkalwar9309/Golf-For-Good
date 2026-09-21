-- ============================================================
-- UPDATE CHARITIES SCHEMA
-- Adds support for full charity profiles, slugs, and events.
-- ============================================================

-- Add new columns to charities table
ALTER TABLE public.charities 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS upcoming_events JSONB DEFAULT '[]'::jsonb;

-- Populate slugs for existing charities that don't have one
-- This uses the name as a base and simple lowercasing/hyphenating
UPDATE public.charities
SET slug = lower(replace(name, ' ', '-'))
WHERE slug IS NULL;

-- Ensure slugs are unique (if name collisions occurred)
-- This is a simple fallback for existing data
UPDATE public.charities c1
SET slug = slug || '-' || id::text
FROM public.charities c2
WHERE c1.id <> c2.id AND c1.slug = c2.slug;

-- Make slug NOT NULL after populating
ALTER TABLE public.charities ALTER COLUMN slug SET NOT NULL;

-- Add index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_charities_slug ON public.charities(slug);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
