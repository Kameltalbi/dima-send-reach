-- Ajouter les nouveaux champs à la table contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS societe TEXT,
ADD COLUMN IF NOT EXISTS fonction TEXT,
ADD COLUMN IF NOT EXISTS telephone TEXT,
ADD COLUMN IF NOT EXISTS site_web TEXT,
ADD COLUMN IF NOT EXISTS pays TEXT,
ADD COLUMN IF NOT EXISTS ville TEXT;

-- Créer des index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_contacts_pays ON public.contacts(pays);
CREATE INDEX IF NOT EXISTS idx_contacts_ville ON public.contacts(ville);
CREATE INDEX IF NOT EXISTS idx_contacts_societe ON public.contacts(societe);

