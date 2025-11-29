-- Ajouter une colonne pour suivre les emails supplémentaires achetés
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS extra_emails integer DEFAULT 0 NOT NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN subscriptions.extra_emails IS 'Emails supplémentaires achetés en plus de la limite du plan de base';