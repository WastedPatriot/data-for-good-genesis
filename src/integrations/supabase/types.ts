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
      agent_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          domain: string | null
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
          domain?: string | null
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
          domain?: string | null
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
      automation_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
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
      campaign_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
          replied_at: string | null
          reply_body: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
          replied_at?: string | null
          reply_body?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          replied_at?: string | null
          reply_body?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      complaint_resolutions: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          ai_analysis: Json
          ai_response: string | null
          confidence_score: number | null
          contact_submission_id: string | null
          created_at: string | null
          escalated_to_admin: boolean | null
          escalation_reason: string | null
          id: string
          resolution_status: string
          updated_at: string | null
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_analysis: Json
          ai_response?: string | null
          confidence_score?: number | null
          contact_submission_id?: string | null
          created_at?: string | null
          escalated_to_admin?: boolean | null
          escalation_reason?: string | null
          id?: string
          resolution_status?: string
          updated_at?: string | null
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_analysis?: Json
          ai_response?: string | null
          confidence_score?: number | null
          contact_submission_id?: string | null
          created_at?: string | null
          escalated_to_admin?: boolean | null
          escalation_reason?: string | null
          id?: string
          resolution_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_resolutions_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          ai_analysis: Json | null
          created_at: string
          email: string
          id: string
          last_response_at: string | null
          message: string
          name: string
          organization: string | null
          priority_level: string | null
          response_time_minutes: number | null
          severity_score: number | null
          status: string | null
          subject: string
          submission_type: string
        }
        Insert: {
          admin_notes?: string | null
          ai_analysis?: Json | null
          created_at?: string
          email: string
          id?: string
          last_response_at?: string | null
          message: string
          name: string
          organization?: string | null
          priority_level?: string | null
          response_time_minutes?: number | null
          severity_score?: number | null
          status?: string | null
          subject: string
          submission_type: string
        }
        Update: {
          admin_notes?: string | null
          ai_analysis?: Json | null
          created_at?: string
          email?: string
          id?: string
          last_response_at?: string | null
          message?: string
          name?: string
          organization?: string | null
          priority_level?: string | null
          response_time_minutes?: number | null
          severity_score?: number | null
          status?: string | null
          subject?: string
          submission_type?: string
        }
        Relationships: []
      }
      conversation_threads: {
        Row: {
          contact_submission_id: string | null
          created_at: string | null
          direction: string
          from_email: string
          id: string
          message: string
          sent_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          contact_submission_id?: string | null
          created_at?: string | null
          direction: string
          from_email: string
          id?: string
          message: string
          sent_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          contact_submission_id?: string | null
          created_at?: string | null
          direction?: string
          from_email?: string
          id?: string
          message?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_pool: {
        Row: {
          batch_number: number | null
          category: string
          confidence_score: number
          created_at: string
          curated_payload: Json
          domain: string | null
          enterprise_grade: boolean | null
          id: string
          last_used_at: string | null
          limited_supply: number | null
          quality_tier: string
          region: string | null
          review_queue_id: string
          sector: string | null
          tags: string[] | null
          usage_count: number
          used_in_datasets: string[] | null
        }
        Insert: {
          batch_number?: number | null
          category: string
          confidence_score: number
          created_at?: string
          curated_payload: Json
          domain?: string | null
          enterprise_grade?: boolean | null
          id?: string
          last_used_at?: string | null
          limited_supply?: number | null
          quality_tier: string
          region?: string | null
          review_queue_id: string
          sector?: string | null
          tags?: string[] | null
          usage_count?: number
          used_in_datasets?: string[] | null
        }
        Update: {
          batch_number?: number | null
          category?: string
          confidence_score?: number
          created_at?: string
          curated_payload?: Json
          domain?: string | null
          enterprise_grade?: boolean | null
          id?: string
          last_used_at?: string | null
          limited_supply?: number | null
          quality_tier?: string
          region?: string | null
          review_queue_id?: string
          sector?: string | null
          tags?: string[] | null
          usage_count?: number
          used_in_datasets?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "curated_pool_review_queue_id_fkey"
            columns: ["review_queue_id"]
            isOneToOne: false
            referencedRelation: "review_queue"
            referencedColumns: ["id"]
          },
        ]
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
      dataset_export_metadata: {
        Row: {
          checksum_sha256: string | null
          created_at: string | null
          created_by: string | null
          dataset_id: string | null
          export_metadata: Json | null
          file_size_bytes: number | null
          format: string
          id: string
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string | null
          created_by?: string | null
          dataset_id?: string | null
          export_metadata?: Json | null
          file_size_bytes?: number | null
          format: string
          id?: string
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string | null
          created_by?: string | null
          dataset_id?: string | null
          export_metadata?: Json | null
          file_size_bytes?: number | null
          format?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_export_metadata_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_files: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          dataset_id: string
          download_url: string | null
          file_path: string
          file_size_bytes: number | null
          format: string
          id: string
          presigned_url_expires_at: string | null
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          dataset_id: string
          download_url?: string | null
          file_path: string
          file_size_bytes?: number | null
          format: string
          id?: string
          presigned_url_expires_at?: string | null
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          dataset_id?: string
          download_url?: string | null
          file_path?: string
          file_size_bytes?: number | null
          format?: string
          id?: string
          presigned_url_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_files_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          active: boolean | null
          batch_number: number | null
          category: string
          created_at: string
          description: string
          domain: string | null
          enterprise_grade: boolean | null
          featured: boolean | null
          id: string
          limited_supply: number | null
          name: string
          price: number
          region: string | null
          sample_data: Json | null
          sector: string | null
          size_mb: number | null
          source_channel: string | null
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          batch_number?: number | null
          category: string
          created_at?: string
          description: string
          domain?: string | null
          enterprise_grade?: boolean | null
          featured?: boolean | null
          id?: string
          limited_supply?: number | null
          name: string
          price: number
          region?: string | null
          sample_data?: Json | null
          sector?: string | null
          size_mb?: number | null
          source_channel?: string | null
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          batch_number?: number | null
          category?: string
          created_at?: string
          description?: string
          domain?: string | null
          enterprise_grade?: boolean | null
          featured?: boolean | null
          id?: string
          limited_supply?: number | null
          name?: string
          price?: number
          region?: string | null
          sample_data?: Json | null
          sector?: string | null
          size_mb?: number | null
          source_channel?: string | null
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_badges: {
        Row: {
          badge_code: string
          badge_image_url: string | null
          badge_seed: string | null
          badge_tier: string
          created_at: string
          eco_funding_contributed: number | null
          expires_at: string | null
          id: string
          user_id: string
          verified: boolean
          volume_purchased: number | null
        }
        Insert: {
          badge_code: string
          badge_image_url?: string | null
          badge_seed?: string | null
          badge_tier: string
          created_at?: string
          eco_funding_contributed?: number | null
          expires_at?: string | null
          id?: string
          user_id: string
          verified?: boolean
          volume_purchased?: number | null
        }
        Update: {
          badge_code?: string
          badge_image_url?: string | null
          badge_seed?: string | null
          badge_tier?: string
          created_at?: string
          eco_funding_contributed?: number | null
          expires_at?: string | null
          id?: string
          user_id?: string
          verified?: boolean
          volume_purchased?: number | null
        }
        Relationships: []
      }
      funding_ledger: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          month: string
          project_id: string | null
          region_impact: Database["public"]["Enums"]["region_impact"] | null
          source: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          month: string
          project_id?: string | null
          region_impact?: Database["public"]["Enums"]["region_impact"] | null
          source: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          month?: string
          project_id?: string | null
          region_impact?: Database["public"]["Enums"]["region_impact"] | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_allocation_history: {
        Row: {
          allocation_month: string
          amount: number
          created_at: string
          id: string
          project_id: string
          source_purchase_id: string | null
        }
        Insert: {
          allocation_month: string
          amount: number
          created_at?: string
          id?: string
          project_id: string
          source_purchase_id?: string | null
        }
        Update: {
          allocation_month?: string
          amount?: number
          created_at?: string
          id?: string
          project_id?: string
          source_purchase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_allocation_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_allocation_history_source_purchase_id_fkey"
            columns: ["source_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string
          confidence_score: number | null
          contact_name: string
          created_at: string
          data_interests: string[] | null
          email: string
          id: string
          last_reply_at: string | null
          status: string
        }
        Insert: {
          company: string
          confidence_score?: number | null
          contact_name: string
          created_at?: string
          data_interests?: string[] | null
          email: string
          id?: string
          last_reply_at?: string | null
          status?: string
        }
        Update: {
          company?: string
          confidence_score?: number | null
          contact_name?: string
          created_at?: string
          data_interests?: string[] | null
          email?: string
          id?: string
          last_reply_at?: string | null
          status?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string | null
          fingerprint: string | null
          id: string
          ip_address: string
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email?: string | null
          fingerprint?: string | null
          id?: string
          ip_address: string
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string | null
          fingerprint?: string | null
          id?: string
          ip_address?: string
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          approved_by: string | null
          company_name: string
          created_at: string
          created_by: string | null
          email: string
          email_content: string
          id: string
          research_data: Json | null
          sent_at: string | null
          status: string
        }
        Insert: {
          approved_by?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          email: string
          email_content: string
          id?: string
          research_data?: Json | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          approved_by?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          email_content?: string
          id?: string
          research_data?: Json | null
          sent_at?: string | null
          status?: string
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
      project_comments: {
        Row: {
          comment: string
          created_at: string
          flagged: boolean | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          blocked_associations: string[] | null
          category: string
          charity_registration_number: string | null
          charity_verification_status: string | null
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
          recommended_funding_sources: Json | null
          region_impact: Database["public"]["Enums"]["region_impact"] | null
          status: Database["public"]["Enums"]["project_status"]
          submitted_by: string | null
          tags: string[] | null
          title: string
          updated_at: string
          urgency_level: string | null
          verification_flags: Json | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          votes_count: number
          website_url: string | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          blocked_associations?: string[] | null
          category: string
          charity_registration_number?: string | null
          charity_verification_status?: string | null
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
          recommended_funding_sources?: Json | null
          region_impact?: Database["public"]["Enums"]["region_impact"] | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_by?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          urgency_level?: string | null
          verification_flags?: Json | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          votes_count?: number
          website_url?: string | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          blocked_associations?: string[] | null
          category?: string
          charity_registration_number?: string | null
          charity_verification_status?: string | null
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
          recommended_funding_sources?: Json | null
          region_impact?: Database["public"]["Enums"]["region_impact"] | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_by?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          urgency_level?: string | null
          verification_flags?: Json | null
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
      provenance_collisions: {
        Row: {
          created_at: string | null
          existing_id: string | null
          id: string
          incoming_payload: Json
        }
        Insert: {
          created_at?: string | null
          existing_id?: string | null
          id?: string
          incoming_payload: Json
        }
        Update: {
          created_at?: string | null
          existing_id?: string | null
          id?: string
          incoming_payload?: Json
        }
        Relationships: []
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
      release_policy: {
        Row: {
          burst_activated_at: string | null
          burst_mode_enabled: boolean | null
          burst_reason: string | null
          channel: string
          created_at: string
          domain: string | null
          id: string
          last_release_at: string | null
          max_datasets_per_week: number
          max_external_releases_per_month: number | null
          max_external_releases_per_month_per_domain: number | null
          max_releases_per_week_per_domain: number | null
          min_confidence: number
          min_days_between_releases: number
          min_quality_tier: string
          updated_at: string
        }
        Insert: {
          burst_activated_at?: string | null
          burst_mode_enabled?: boolean | null
          burst_reason?: string | null
          channel: string
          created_at?: string
          domain?: string | null
          id?: string
          last_release_at?: string | null
          max_datasets_per_week?: number
          max_external_releases_per_month?: number | null
          max_external_releases_per_month_per_domain?: number | null
          max_releases_per_week_per_domain?: number | null
          min_confidence?: number
          min_days_between_releases?: number
          min_quality_tier?: string
          updated_at?: string
        }
        Update: {
          burst_activated_at?: string | null
          burst_mode_enabled?: boolean | null
          burst_reason?: string | null
          channel?: string
          created_at?: string
          domain?: string | null
          id?: string
          last_release_at?: string | null
          max_datasets_per_week?: number
          max_external_releases_per_month?: number | null
          max_external_releases_per_month_per_domain?: number | null
          max_releases_per_week_per_domain?: number | null
          min_confidence?: number
          min_days_between_releases?: number
          min_quality_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          category: string | null
          confidence_score: number | null
          created_at: string
          duplicate_of: string | null
          id: string
          normalized_payload: Json | null
          provenance_hash: string
          publish_decision: string | null
          published_to: string[] | null
          quality_tier: string | null
          raw_payload: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          similar_items: Json | null
          source_reference: string
          source_type: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          normalized_payload?: Json | null
          provenance_hash: string
          publish_decision?: string | null
          published_to?: string[] | null
          quality_tier?: string | null
          raw_payload: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similar_items?: Json | null
          source_reference: string
          source_type: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          normalized_payload?: Json | null
          provenance_hash?: string
          publish_decision?: string | null
          published_to?: string[] | null
          quality_tier?: string | null
          raw_payload?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similar_items?: Json | null
          source_reference?: string
          source_type?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "review_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      sharecards: {
        Row: {
          badge_level: string | null
          created_at: string | null
          id: string
          image_url: string | null
          project_id: string | null
          seed: string
          user_id: string | null
        }
        Insert: {
          badge_level?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          seed: string
          user_id?: string | null
        }
        Update: {
          badge_level?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          seed?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sharecards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      visitor_analytics: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          visited_at: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          visited_at?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          visited_at?: string | null
        }
        Relationships: []
      }
      vote_cooldowns: {
        Row: {
          created_at: string | null
          id: string
          last_vote_at: string
          user_id: string
          vote_count_this_month: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_vote_at?: string
          user_id: string
          vote_count_this_month?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_vote_at?: string
          user_id?: string
          vote_count_this_month?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      charity_partnerships_public: {
        Row: {
          charity_registration_number: string | null
          contact_email_masked: string | null
          contact_name_masked: string | null
          country: string | null
          created_at: string | null
          ends_at: string | null
          id: string | null
          impact_areas: string[] | null
          organization_name: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["partnership_status"] | null
          updated_at: string | null
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          charity_registration_number?: string | null
          contact_email_masked?: never
          contact_name_masked?: never
          country?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          impact_areas?: string[] | null
          organization_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["partnership_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          charity_registration_number?: string | null
          contact_email_masked?: never
          contact_name_masked?: never
          country?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          impact_areas?: string[] | null
          organization_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["partnership_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_public_impact: {
        Row: {
          active_domains: number | null
          high_quality_records: number | null
          total_contributors: number | null
          total_datasets: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_blocked_associations: {
        Args: { charity_name: string; project_data: string; website: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      run_automation_cycle: { Args: never; Returns: Json }
      trigger_ai_curation: { Args: never; Returns: undefined }
      trigger_dataset_builder: { Args: never; Returns: undefined }
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
      region_impact:
        | "palestine"
        | "sudan"
        | "congo"
        | "refugee"
        | "housing"
        | "reforestation"
        | "river_cleanup"
        | "soil_restoration"
        | "medical"
        | "global"
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
      region_impact: [
        "palestine",
        "sudan",
        "congo",
        "refugee",
        "housing",
        "reforestation",
        "river_cleanup",
        "soil_restoration",
        "medical",
        "global",
      ],
    },
  },
} as const
