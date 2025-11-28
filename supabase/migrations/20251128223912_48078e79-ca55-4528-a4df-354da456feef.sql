-- Ajouter les colonnes supplémentaires à la table contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS telephone text,
ADD COLUMN IF NOT EXISTS fonction text,
ADD COLUMN IF NOT EXISTS societe text,
ADD COLUMN IF NOT EXISTS site_web text,
ADD COLUMN IF NOT EXISTS pays text,
ADD COLUMN IF NOT EXISTS ville text;