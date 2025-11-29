-- Ajouter une colonne pour marquer les contacts de test
ALTER TABLE contacts ADD COLUMN is_test_contact BOOLEAN NOT NULL DEFAULT false;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_contacts_test ON contacts(user_id, is_test_contact) WHERE is_test_contact = true;

-- Commenter la colonne
COMMENT ON COLUMN contacts.is_test_contact IS 'Indique si ce contact est utilisé pour les tests d''envoi';