-- Configuration de l'authentification auto-confirmée
-- (à configurer dans les settings Supabase)

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom_entreprise TEXT NOT NULL,
  email_envoi_defaut TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, nom_entreprise)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Table des contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  segment TEXT,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'desabonne', 'erreur')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, email)
);

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_segment ON public.contacts(segment);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Table des listes
CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_lists_user_id ON public.lists(user_id);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs listes"
  ON public.lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs listes"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs listes"
  ON public.lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs listes"
  ON public.lists FOR DELETE
  USING (auth.uid() = user_id);

-- Table de liaison listes-contacts
CREATE TABLE public.list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(list_id, contact_id)
);

CREATE INDEX idx_list_contacts_list_id ON public.list_contacts(list_id);
CREATE INDEX idx_list_contacts_contact_id ON public.list_contacts(contact_id);

ALTER TABLE public.list_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les contacts de leurs listes"
  ON public.list_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_contacts.list_id
    AND lists.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent ajouter des contacts à leurs listes"
  ON public.list_contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_contacts.list_id
    AND lists.user_id = auth.uid()
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer des contacts de leurs listes"
  ON public.list_contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.lists
    WHERE lists.id = list_contacts.list_id
    AND lists.user_id = auth.uid()
  ));

-- Table des campagnes
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_campagne TEXT NOT NULL,
  sujet_email TEXT NOT NULL,
  expediteur_nom TEXT NOT NULL,
  expediteur_email TEXT NOT NULL,
  list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,
  html_contenu TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_attente', 'en_cours', 'envoye', 'annule')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  date_envoi TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_statut ON public.campaigns(statut);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs campagnes"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs campagnes"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs campagnes"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs campagnes"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Table des statistiques de campagnes
CREATE TABLE public.campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
  total_envoyes INTEGER DEFAULT 0 NOT NULL,
  total_ouverts INTEGER DEFAULT 0 NOT NULL,
  total_cliques INTEGER DEFAULT 0 NOT NULL,
  total_desabonnements INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaign_stats_campaign_id ON public.campaign_stats(campaign_id);

ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les stats de leurs campagnes"
  ON public.campaign_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_stats.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Table des destinataires de campagnes
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  statut_envoi TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_envoi IN ('en_attente', 'envoye', 'erreur')),
  ouvert BOOLEAN DEFAULT FALSE NOT NULL,
  clique BOOLEAN DEFAULT FALSE NOT NULL,
  desabonne BOOLEAN DEFAULT FALSE NOT NULL,
  date_envoi TIMESTAMP WITH TIME ZONE,
  date_ouverture TIMESTAMP WITH TIME ZONE,
  date_clic TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_contact_id ON public.campaign_recipients(contact_id);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les destinataires de leurs campagnes"
  ON public.campaign_recipients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_recipients.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Table de configuration Amazon SES par utilisateur
CREATE TABLE public.ses_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  aws_access_key_id TEXT,
  aws_secret_access_key TEXT,
  aws_region TEXT DEFAULT 'us-east-1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ses_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur config SES"
  ON public.ses_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leur config SES"
  ON public.ses_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leur config SES"
  ON public.ses_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ses_config_updated_at
  BEFORE UPDATE ON public.ses_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();