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
      ab_tests: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          id: string
          started_at: string | null
          status: string
          test_duration_hours: number
          test_percentage: number
          test_type: string
          updated_at: string
          user_id: string
          variant_a_clicks: number | null
          variant_a_content: string | null
          variant_a_opens: number | null
          variant_a_send_time: string | null
          variant_a_sent: number | null
          variant_a_subject: string | null
          variant_b_clicks: number | null
          variant_b_content: string | null
          variant_b_opens: number | null
          variant_b_send_time: string | null
          variant_b_sent: number | null
          variant_b_subject: string | null
          winner: string | null
          winning_criteria: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string | null
          status?: string
          test_duration_hours?: number
          test_percentage?: number
          test_type?: string
          updated_at?: string
          user_id: string
          variant_a_clicks?: number | null
          variant_a_content?: string | null
          variant_a_opens?: number | null
          variant_a_send_time?: string | null
          variant_a_sent?: number | null
          variant_a_subject?: string | null
          variant_b_clicks?: number | null
          variant_b_content?: string | null
          variant_b_opens?: number | null
          variant_b_send_time?: string | null
          variant_b_sent?: number | null
          variant_b_subject?: string | null
          winner?: string | null
          winning_criteria?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string | null
          status?: string
          test_duration_hours?: number
          test_percentage?: number
          test_type?: string
          updated_at?: string
          user_id?: string
          variant_a_clicks?: number | null
          variant_a_content?: string | null
          variant_a_opens?: number | null
          variant_a_send_time?: string | null
          variant_a_sent?: number | null
          variant_a_subject?: string | null
          variant_b_clicks?: number | null
          variant_b_content?: string | null
          variant_b_opens?: number | null
          variant_b_send_time?: string | null
          variant_b_sent?: number | null
          variant_b_subject?: string | null
          winner?: string | null
          winning_criteria?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          automation_id: string
          completed_at: string | null
          contact_id: string
          created_at: string
          current_step: number
          id: string
          next_execution_at: string | null
          status: string
        }
        Insert: {
          automation_id: string
          completed_at?: string | null
          contact_id: string
          created_at?: string
          current_step?: number
          id?: string
          next_execution_at?: string | null
          status?: string
        }
        Update: {
          automation_id?: string
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          current_step?: number
          id?: string
          next_execution_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_steps: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          step_config: Json | null
          step_order: number
          step_type: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          step_config?: Json | null
          step_order?: number
          step_type?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          step_config?: Json | null
          step_order?: number
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_steps_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          nom: string
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          nom: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          nom?: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bounces: {
        Row: {
          action_taken: string | null
          bounce_code: string | null
          bounce_message: string | null
          bounce_reason: string | null
          bounce_type: string
          contact_id: string | null
          created_at: string
          email: string
          id: string
          is_processed: boolean
          processed_at: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          bounce_code?: string | null
          bounce_message?: string | null
          bounce_reason?: string | null
          bounce_type?: string
          contact_id?: string | null
          created_at?: string
          email: string
          id?: string
          is_processed?: boolean
          processed_at?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          bounce_code?: string | null
          bounce_message?: string | null
          bounce_reason?: string | null
          bounce_type?: string
          contact_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_processed?: boolean
          processed_at?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounces_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          ab_variant: string | null
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
          ab_variant?: string | null
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
          ab_variant?: string | null
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
          fonction: string | null
          id: string
          is_test_contact: boolean
          nom: string
          pays: string | null
          prenom: string
          segment: string | null
          site_web: string | null
          societe: string | null
          statut: string
          telephone: string | null
          user_id: string
          ville: string | null
        }
        Insert: {
          created_at?: string
          email: string
          fonction?: string | null
          id?: string
          is_test_contact?: boolean
          nom: string
          pays?: string | null
          prenom: string
          segment?: string | null
          site_web?: string | null
          societe?: string | null
          statut?: string
          telephone?: string | null
          user_id: string
          ville?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          fonction?: string | null
          id?: string
          is_test_contact?: boolean
          nom?: string
          pays?: string | null
          prenom?: string
          segment?: string | null
          site_web?: string | null
          societe?: string | null
          statut?: string
          telephone?: string | null
          user_id?: string
          ville?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number
          campaign_id: string | null
          created_at: string
          error_message: string | null
          from_email: string
          from_name: string
          html: string
          id: string
          locked_at: string | null
          locked_by: string | null
          recipient_id: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email: string
          from_name: string
          html: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          attempts?: number
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string
          from_name?: string
          html?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
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
      orders: {
        Row: {
          amount: number
          billing_info: Json | null
          created_at: string
          currency: string
          id: string
          konnect_payment_id: string | null
          notes: string | null
          organization_id: string | null
          payment_method: string
          payment_status: string
          plan_type: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          billing_info?: Json | null
          created_at?: string
          currency?: string
          id?: string
          konnect_payment_id?: string | null
          notes?: string | null
          organization_id?: string | null
          payment_method: string
          payment_status?: string
          plan_type: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          billing_info?: Json | null
          created_at?: string
          currency?: string
          id?: string
          konnect_payment_id?: string | null
          notes?: string | null
          organization_id?: string | null
          payment_method?: string
          payment_status?: string
          plan_type?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_role: Database["public"]["Enums"]["organization_role"]
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
          organization_role?: Database["public"]["Enums"]["organization_role"]
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
          organization_role?: Database["public"]["Enums"]["organization_role"]
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
      segments: {
        Row: {
          contact_count: number | null
          created_at: string
          criteria: Json | null
          description: string | null
          id: string
          is_active: boolean
          nom: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_count?: number | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          nom: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_count?: number | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          nom?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          contact_limit: number | null
          created_at: string
          date_debut: string
          date_fin: string | null
          email_limit: number
          extra_emails: number
          id: string
          notes: string | null
          organization_id: string
          plan_type: string
          statut: string
          updated_at: string
        }
        Insert: {
          contact_limit?: number | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          email_limit?: number
          extra_emails?: number
          id?: string
          notes?: string | null
          organization_id: string
          plan_type?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          contact_limit?: number | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          email_limit?: number
          extra_emails?: number
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
      unsubscribe_preferences: {
        Row: {
          contact_id: string
          created_at: string
          email: string
          id: string
          preferences: Json | null
          reason: string | null
          unsubscribe_all: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          email: string
          id?: string
          preferences?: Json | null
          reason?: string | null
          unsubscribe_all?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          email?: string
          id?: string
          preferences?: Json | null
          reason?: string | null
          unsubscribe_all?: boolean
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
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          organization_id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organization_id: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_organization_id_fkey"
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
      get_bounce_stats: { Args: { p_user_id: string }; Returns: Json }
      get_contact_quota: { Args: { p_user_id: string }; Returns: Json }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      process_bounce: {
        Args: { p_bounce_type: string; p_contact_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "superadmin" | "user"
      organization_role: "admin" | "user"
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
      organization_role: ["admin", "user"],
    },
  },
} as const
