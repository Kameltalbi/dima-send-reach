export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      campaign_recipients: {
        Row: {
          campaign_id: string
          clique: boolean
          contact_id: string
          created_at: string
          date_clic: string | null
          date_envoi: string | null
          date_ouverture: string | null
          desabonne: boolean
          id: string
          ouvert: boolean
          statut_envoi: string
        }
        Insert: {
          campaign_id: string
          clique?: boolean
          contact_id: string
          created_at?: string
          date_clic?: string | null
          date_envoi?: string | null
          date_ouverture?: string | null
          desabonne?: boolean
          id?: string
          ouvert?: boolean
          statut_envoi?: string
        }
        Update: {
          campaign_id?: string
          clique?: boolean
          contact_id?: string
          created_at?: string
          date_clic?: string | null
          date_envoi?: string | null
          date_ouverture?: string | null
          desabonne?: boolean
          id?: string
          ouvert?: boolean
          statut_envoi?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          id: string
          total_cliques: number
          total_desabonnements: number
          total_envoyes: number
          total_ouverts: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          id?: string
          total_cliques?: number
          total_desabonnements?: number
          total_envoyes?: number
          total_ouverts?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          id?: string
          total_cliques?: number
          total_desabonnements?: number
          total_envoyes?: number
          total_ouverts?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          date_envoi: string | null
          expediteur_email: string
          expediteur_nom: string
          html_contenu: string | null
          id: string
          list_id: string | null
          nom_campagne: string
          statut: string
          sujet_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_envoi?: string | null
          expediteur_email: string
          expediteur_nom: string
          html_contenu?: string | null
          id?: string
          list_id?: string | null
          nom_campagne: string
          statut?: string
          sujet_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_envoi?: string | null
          expediteur_email?: string
          expediteur_nom?: string
          html_contenu?: string | null
          id?: string
          list_id?: string | null
          nom_campagne?: string
          statut?: string
          sujet_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string
          prenom: string
          segment: string | null
          statut: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nom: string
          prenom: string
          segment?: string | null
          statut?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string
          prenom?: string
          segment?: string | null
          statut?: string
          user_id?: string
        }
        Relationships: []
      }
      list_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          list_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          list_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          date_creation: string
          email_contact: string
          id: string
          nom: string
          notes: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_creation?: string
          email_contact: string
          id?: string
          nom: string
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_creation?: string
          email_contact?: string
          id?: string
          nom?: string
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email_envoi_defaut: string | null
          id: string
          nom: string
          nom_entreprise: string
          organization_id: string | null
          prenom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_envoi_defaut?: string | null
          id: string
          nom: string
          nom_entreprise: string
          organization_id?: string | null
          prenom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_envoi_defaut?: string | null
          id?: string
          nom?: string
          nom_entreprise?: string
          organization_id?: string | null
          prenom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ses_config: {
        Row: {
          aws_access_key_id: string | null
          aws_region: string | null
          aws_secret_access_key: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          aws_access_key_id?: string | null
          aws_region?: string | null
          aws_secret_access_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          aws_access_key_id?: string | null
          aws_region?: string | null
          aws_secret_access_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string | null
          email_limit: number
          id: string
          notes: string | null
          organization_id: string
          plan_type: string
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          email_limit?: number
          id?: string
          notes?: string | null
          organization_id: string
          plan_type?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          email_limit?: number
          id?: string
          notes?: string | null
          organization_id?: string
          plan_type?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content_html: string | null
          content_json: Json | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          nom: string
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          nom: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          nom?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          default_send_hour: number | null
          enable_tracking: boolean | null
          enable_unsubscribe_link: boolean | null
          id: string
          notify_on_campaign_sent: boolean | null
          notify_on_high_engagement: boolean | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_send_hour?: number | null
          enable_tracking?: boolean | null
          enable_unsubscribe_link?: boolean | null
          id?: string
          notify_on_campaign_sent?: boolean | null
          notify_on_high_engagement?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_send_hour?: number | null
          enable_tracking?: boolean | null
          enable_unsubscribe_link?: boolean | null
          id?: string
          notify_on_campaign_sent?: boolean | null
          notify_on_high_engagement?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "user"],
    },
  },
} as const
