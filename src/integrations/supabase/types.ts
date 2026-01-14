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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          email: string | null
          id: string
          joined_at: string
          name: string
          role: string
          user_id: string | null
          vault_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          joined_at?: string
          name: string
          role?: string
          user_id?: string | null
          vault_id: string
        }
        Update: {
          email?: string | null
          id?: string
          joined_at?: string
          name?: string
          role?: string
          user_id?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          created_at: string
          id: string
          name: string
          position_x: number
          position_y: number
          position_z: number
          region: string
          total_invested: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position_x: number
          position_y: number
          position_z?: number
          region: string
          total_invested?: number
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position_x?: number
          position_y?: number
          position_z?: number
          region?: string
          total_invested?: number
          type?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_on_large_transaction: boolean
          email_on_milestone: boolean
          email_on_new_user: boolean
          email_on_role_change: boolean
          id: string
          large_transaction_threshold: number
          notification_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_on_large_transaction?: boolean
          email_on_milestone?: boolean
          email_on_new_user?: boolean
          email_on_role_change?: boolean
          id?: string
          large_transaction_threshold?: number
          notification_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_on_large_transaction?: boolean
          email_on_milestone?: boolean
          email_on_new_user?: boolean
          email_on_role_change?: boolean
          id?: string
          large_transaction_threshold?: number
          notification_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          last_sent_at: string | null
          next_scheduled_at: string | null
          recipient_emails: string[] | null
          report_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          recipient_emails?: string[] | null
          report_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          recipient_emails?: string[] | null
          report_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          from_investor_id: string | null
          id: string
          to_vault_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          from_investor_id?: string | null
          id?: string
          to_vault_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          from_investor_id?: string | null
          id?: string
          to_vault_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_investor_id_fkey"
            columns: ["from_investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_vault_id_fkey"
            columns: ["to_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_engagement_scores: {
        Row: {
          badge: string | null
          clicks_count: number
          created_at: string
          feature_uses_count: number
          form_submissions_count: number
          id: string
          last_calculated_at: string | null
          login_count: number
          page_views_count: number
          session_count: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge?: string | null
          clicks_count?: number
          created_at?: string
          feature_uses_count?: number
          form_submissions_count?: number
          id?: string
          last_calculated_at?: string | null
          login_count?: number
          page_views_count?: number
          session_count?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge?: string | null
          clicks_count?: number
          created_at?: string
          feature_uses_count?: number
          form_submissions_count?: number
          id?: string
          last_calculated_at?: string | null
          login_count?: number
          page_views_count?: number
          session_count?: number
          total_score?: number
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vault_milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vault_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_projects: {
        Row: {
          budget: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          updated_at: string
          vault_id: string
        }
        Insert: {
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
          vault_id: string
        }
        Update: {
          budget?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_projects_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          carbon_offset_tons: number
          community_members: number
          country: string
          created_at: string
          id: string
          name: string
          position_x: number
          position_y: number
          position_z: number
          projects_funded: number
          status: string
          total_capital: number
          updated_at: string
        }
        Insert: {
          carbon_offset_tons?: number
          community_members?: number
          country: string
          created_at?: string
          id?: string
          name: string
          position_x: number
          position_y: number
          position_z?: number
          projects_funded?: number
          status?: string
          total_capital?: number
          updated_at?: string
        }
        Update: {
          carbon_offset_tons?: number
          community_members?: number
          country?: string
          created_at?: string
          id?: string
          name?: string
          position_x?: number
          position_y?: number
          position_z?: number
          projects_funded?: number
          status?: string
          total_capital?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_engagement_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      has_moderator_or_admin_role: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
