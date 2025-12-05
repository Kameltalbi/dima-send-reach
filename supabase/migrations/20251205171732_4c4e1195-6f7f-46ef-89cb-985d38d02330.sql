-- Permettre aux utilisateurs de supprimer leurs propres campagnes (sans permission spéciale)
DROP POLICY IF EXISTS "Les utilisateurs avec permission peuvent supprimer campagnes" ON public.campaigns;
CREATE POLICY "Les utilisateurs peuvent supprimer leurs campagnes" 
ON public.campaigns 
FOR DELETE 
USING (user_id = auth.uid());

-- Permettre aux utilisateurs de supprimer les stats de leurs campagnes
CREATE POLICY "Les utilisateurs peuvent supprimer stats de leurs campagnes" 
ON public.campaign_stats 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = campaign_stats.campaign_id 
  AND campaigns.user_id = auth.uid()
));

-- Permettre aux utilisateurs de supprimer les destinataires de leurs campagnes
CREATE POLICY "Les utilisateurs peuvent supprimer destinataires de leurs campagnes" 
ON public.campaign_recipients 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = campaign_recipients.campaign_id 
  AND campaigns.user_id = auth.uid()
));

-- Permettre aux utilisateurs de supprimer les emails en queue de leurs campagnes
CREATE POLICY "Les utilisateurs peuvent supprimer queue de leurs campagnes" 
ON public.email_queue 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = email_queue.campaign_id 
  AND campaigns.user_id = auth.uid()
));