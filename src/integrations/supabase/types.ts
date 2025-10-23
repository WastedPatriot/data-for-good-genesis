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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badge_codes: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          code: string
          created_at: string
          dataset_id: string | null
          id: string
          purchase_id: string | null
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          code: string
          created_at?: string
          dataset_id?: string | null
          id?: string
          purchase_id?: string | null
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          code?: string
          created_at?: string
          dataset_id?: string | null
          id?: string
          purchase_id?: string | null
        }
        Relationships: []
      }
      charity_partnerships: {
        Row: {
          agreement_url: string | null
          charity_registration_number: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          country: string
          created_at: string
          ends_at: string | null
          id: string
          impact_areas: string[] | null
          organization_id: string | null
          organization_name: string
          registration_proof_url: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["partnership_status"]
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          agreement_url?: string | null
          charity_registration_number: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          country: string
          created_at?: string
          ends_at?: string | null
          id?: string
          impact_areas?: string[] | null
          organization_id?: string | null
          organization_name: string
          registration_proof_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["partnership_status"]
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          agreement_url?: string | null
          charity_registration_number?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          impact_areas?: string[] | null
          organization_id?: string | null
          organization_name?: string
          registration_proof_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["partnership_status"]
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charity_partnerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          organization: string | null
          status: string | null
          subject: string
          submission_type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          organization?: string | null
          status?: string | null
          subject: string
          submission_type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          organization?: string | null
          status?: string | null
          subject?: string
          submission_type?: string
        }
        Relationships: []
      }
      data_processing_queue: {
        Row: {
          ai_analysis: Json | null
          backup_location: string | null
          categorization: Json | null
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          processed_data: Json | null
          processing_status: string | null
          published_dataset_id: string | null
          quality_score: number | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          backup_location?: string | null
          categorization?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_data?: Json | null
          processing_status?: string | null
          published_dataset_id?: string | null
          quality_score?: number | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          backup_location?: string | null
          categorization?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_data?: Json | null
          processing_status?: string | null
          published_dataset_id?: string | null
          quality_score?: number | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_processing_queue_published_dataset_id_fkey"
            columns: ["published_dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_processing_queue_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "data_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_submissions: {
        Row: {
          age_range: string | null
          created_at: string
          device_ownership: string | null
          email: string | null
          ev_ownership: string | null
          id: string
          interests: string[] | null
          location: string | null
          sensor_data: Json | null
          sustainability: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          device_ownership?: string | null
          email?: string | null
          ev_ownership?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          sensor_data?: Json | null
          sustainability?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string
          device_ownership?: string | null
          email?: string | null
          ev_ownership?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          sensor_data?: Json | null
          sustainability?: string | null
        }
        Relationships: []
      }
      datasets: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          description: string
          featured: boolean | null
          id: string
          name: string
          price: number
          sample_data: Json | null
          size_mb: number | null
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          description: string
          featured?: boolean | null
          id?: string
          name: string
          price: number
          sample_data?: Json | null
          size_mb?: number | null
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          description?: string
          featured?: boolean | null
          id?: string
          name?: string
          price?: number
          sample_data?: Json | null
          size_mb?: number | null
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_profiles: {
        Row: {
          compliance_accepted: boolean
          contact_email: string
          contact_phone: string | null
          country: string
          created_at: string
          description: string | null
          id: string
          organization_name: string
          organization_type: string
          privacy_accepted_at: string | null
          tax_id: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          compliance_accepted?: boolean
          contact_email: string
          contact_phone?: string | null
          country: string
          created_at?: string
          description?: string | null
          id?: string
          organization_name: string
          organization_type: string
          privacy_accepted_at?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          compliance_accepted?: boolean
          contact_email?: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_name?: string
          organization_type?: string
          privacy_accepted_at?: string | null
          tax_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          completion_proof_url: string | null
          created_at: string
          description: string
          id: string
          order_index: number
          project_id: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_proof_url?: string | null
          created_at?: string
          description: string
          id?: string
          order_index?: number
          project_id: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_proof_url?: string | null
          created_at?: string
          description?: string
          id?: string
          order_index?: number
          project_id?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_votes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
          vote_weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
          vote_weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
          vote_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_votes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_from: string | null
          active_until: string | null
          category: string
          charity_registration_number: string | null
          created_at: string
          description: string
          documentation_url: string | null
          flag_reason: string | null
          flagged: boolean | null
          funded_amount: number
          funding_goal: number
          icon: string | null
          id: string
          image_url: string | null
          long_description: string | null
          organization_id: string | null
          organization_name: string
          proof_of_work_url: string | null
          status: Database["public"]["Enums"]["project_status"]
          submitted_by: string | null
          tags: string[] | null
          title: string
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          votes_count: number
          website_url: string | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          category: string
          charity_registration_number?: string | null
          created_at?: string
          description: string
          documentation_url?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          funded_amount?: number
          funding_goal: number
          icon?: string | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          organization_id?: string | null
          organization_name: string
          proof_of_work_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_by?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          votes_count?: number
          website_url?: string | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          category?: string
          charity_registration_number?: string | null
          created_at?: string
          description?: string
          documentation_url?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          funded_amount?: number
          funding_goal?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          organization_id?: string | null
          organization_name?: string
          proof_of_work_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_by?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          votes_count?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_paid: number
          created_at: string
          dataset_id: string
          download_count: number | null
          id: string
          last_downloaded_at: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          dataset_id: string
          download_count?: number | null
          id?: string
          last_downloaded_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          dataset_id?: string
          download_count?: number | null
          id?: string
          last_downloaded_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
    }
    Enums: {
      app_role: "admin" | "user"
      partnership_status: "pending" | "verified" | "rejected" | "suspended"
      project_status:
        | "proposed"
        | "under_review"
        | "verified"
        | "active"
        | "funded"
        | "completed"
        | "rejected"
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
      app_role: ["admin", "user"],
      partnership_status: ["pending", "verified", "rejected", "suspended"],
      project_status: [
        "proposed",
        "under_review",
        "verified",
        "active",
        "funded",
        "completed",
        "rejected",
      ],
    },
  },
} as const
