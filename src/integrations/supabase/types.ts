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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      balance_transactions: {
        Row: {
          account_name: string | null
          account_number: string | null
          admin_notes: string | null
          amount: number
          bank_name: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          reference: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          reference?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          reference?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_records: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          deposit_status: string
          id: string
          idempotency_key: string | null
          notes: string | null
          package_name: string
          payment_method: string
          proof_url: string | null
          tx_ref: string
          updated_at: string | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          deposit_status?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          package_name?: string
          payment_method?: string
          proof_url?: string | null
          tx_ref?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          deposit_status?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          package_name?: string
          payment_method?: string
          proof_url?: string | null
          tx_ref?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_entries: {
        Row: {
          amount_paid: number
          created_at: string
          giveaway_id: string
          giveaway_title: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          giveaway_id: string
          giveaway_title?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          giveaway_id?: string
          giveaway_title?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          badge: string
          created_at: string
          description: string
          ends_at: string
          entries_count: number
          entry_fee: number
          id: string
          image_url: string | null
          is_active: boolean
          max_entries: number
          prize: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string
          created_at?: string
          description?: string
          ends_at?: string
          entries_count?: number
          entry_fee?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_entries?: number
          prize?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string
          created_at?: string
          description?: string
          ends_at?: string
          entries_count?: number
          entry_fee?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_entries?: number
          prize?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          alt: string
          badge: string
          badge_type: string
          category: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          price: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt?: string
          badge?: string
          badge_type?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name: string
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt?: string
          badge?: string
          badge_type?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          category: string
          created_at: string
          daily_roi: number
          description: string
          duration_days: number
          id: string
          is_active: boolean
          max_deposit: number
          min_deposit: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          daily_roi?: number
          description?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          max_deposit?: number
          min_deposit?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          daily_roi?: number
          description?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          max_deposit?: number
          min_deposit?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_note: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_id: string
          notes: string
          phone: string | null
          resume_path: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_id: string
          notes?: string
          phone?: string | null
          resume_path?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_id?: string
          notes?: string
          phone?: string | null
          resume_path?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          department: string
          description: string
          id: string
          job_type: string
          location: string
          requirements: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string
          description?: string
          id?: string
          job_type?: string
          location?: string
          requirements?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string
          id?: string
          job_type?: string
          location?: string
          requirements?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_state: {
        Row: {
          consecutive_failures: number
          key: string
          last_error: string | null
          last_run_at: string | null
          lease_until: string | null
          pause_reason: string | null
          paused: boolean
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          key: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          key?: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          address_proof_url: string | null
          admin_notes: string | null
          annual_income: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          id: string
          id_document_back_url: string | null
          id_document_url: string | null
          id_number: string | null
          id_type: Database["public"]["Enums"]["kyc_id_type"] | null
          income_document_url: string | null
          investment_experience: string | null
          investor_type: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          street_address: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address_proof_url?: string | null
          admin_notes?: string | null
          annual_income?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_url?: string | null
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["kyc_id_type"] | null
          income_document_url?: string | null
          investment_experience?: string | null
          investor_type?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          street_address?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address_proof_url?: string | null
          admin_notes?: string | null
          annual_income?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          id_document_back_url?: string | null
          id_document_url?: string | null
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["kyc_id_type"] | null
          income_document_url?: string | null
          investment_experience?: string | null
          investor_type?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          street_address?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      session_bookings: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          crypto_tx_hash: string | null
          email: string
          full_name: string
          id: string
          payment_method: string
          payment_status: string
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          session_type: string
          topics: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          crypto_tx_hash?: string | null
          email: string
          full_name: string
          id?: string
          payment_method: string
          payment_status?: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          session_type?: string
          topics?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          crypto_tx_hash?: string | null
          email?: string
          full_name?: string
          id?: string
          payment_method?: string
          payment_status?: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          session_type?: string
          topics?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          admin_reply: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          subject: string
          ticket_number: string
          ticket_status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reply?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          subject?: string
          ticket_number?: string
          ticket_status?: string
          updated_at?: string
          user_email?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reply?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          subject?: string
          ticket_number?: string
          ticket_status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          amount: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          amount?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          amount?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_balance: {
        Row: {
          available_balance: number
          created_at: string | null
          id: string
          total_deposited: number
          total_invested: number
          total_profit: number
          total_returns: number
          total_withdrawn: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string | null
          id?: string
          total_deposited?: number
          total_invested?: number
          total_profit?: number
          total_returns?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string | null
          id?: string
          total_deposited?: number
          total_invested?: number
          total_profit?: number
          total_returns?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_investments: {
        Row: {
          created_at: string
          daily_roi: number
          duration_days: number
          id: string
          last_accrued_at: string
          matures_at: string
          plan_category: string
          plan_id: string | null
          plan_name: string
          principal: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
          yield_earned: number
        }
        Insert: {
          created_at?: string
          daily_roi?: number
          duration_days?: number
          id?: string
          last_accrued_at?: string
          matures_at?: string
          plan_category?: string
          plan_id?: string | null
          plan_name?: string
          principal?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          yield_earned?: number
        }
        Update: {
          created_at?: string
          daily_roi?: number
          duration_days?: number
          id?: string
          last_accrued_at?: string
          matures_at?: string
          plan_category?: string
          plan_id?: string | null
          plan_name?: string
          principal?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          yield_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portfolios: {
        Row: {
          alerts: Json
          allocation: Json
          chart_data: Json
          created_at: string | null
          id: string
          investments: Json
          referrals: Json
          stats: Json
          transactions: Json
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          alerts?: Json
          allocation?: Json
          chart_data?: Json
          created_at?: string | null
          id?: string
          investments?: Json
          referrals?: Json
          stats?: Json
          transactions?: Json
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name?: string
        }
        Update: {
          alerts?: Json
          allocation?: Json
          chart_data?: Json
          created_at?: string | null
          id?: string
          investments?: Json
          referrals?: Json
          stats?: Json
          transactions?: Json
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string | null
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
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          amount: number
          bank_name: string
          created_at: string | null
          id: string
          idempotency_key: string | null
          notes: string | null
          payout_status: string
          processed_at: string | null
          queue_attempts: number
          queue_last_error: string | null
          queue_lease_until: string | null
          queue_status: string
          requested_at: string | null
          routing_number: string
          tx_code: string | null
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          amount?: number
          bank_name?: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          payout_status?: string
          processed_at?: string | null
          queue_attempts?: number
          queue_last_error?: string | null
          queue_lease_until?: string | null
          queue_status?: string
          requested_at?: string | null
          routing_number?: string
          tx_code?: string | null
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          amount?: number
          bank_name?: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          payout_status?: string
          processed_at?: string | null
          queue_attempts?: number
          queue_last_error?: string | null
          queue_lease_until?: string | null
          queue_status?: string
          requested_at?: string | null
          routing_number?: string
          tx_code?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accrue_investments: { Args: { _user_id?: string }; Returns: Json }
      admin_approve_deposit: { Args: { _deposit_id: string }; Returns: Json }
      admin_queue_withdrawal: { Args: { _id: string }; Returns: Json }
      admin_set_wallet_balance: {
        Args: { _available: number; _note?: string; _user_id: string }
        Returns: Json
      }
      claim_withdrawal_batch: {
        Args: { _limit?: number }
        Returns: {
          account_name: string
          account_number: string
          amount: number
          bank_name: string
          created_at: string | null
          id: string
          idempotency_key: string | null
          notes: string | null
          payout_status: string
          processed_at: string | null
          queue_attempts: number
          queue_last_error: string | null
          queue_lease_until: string | null
          queue_status: string
          requested_at: string | null
          routing_number: string
          tx_code: string | null
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "withdrawal_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      enter_giveaway: { Args: { _giveaway_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_from_auth: { Args: never; Returns: boolean }
      is_portfolio_admin: { Args: never; Returns: boolean }
      log_txn_audit: {
        Args: {
          _action: string
          _amount?: number
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _status?: string
          _user_id: string
        }
        Returns: undefined
      }
      purchase_investment_plan: {
        Args: { _amount: number; _plan_id: string }
        Returns: Json
      }
      settle_withdrawal: {
        Args: { _id: string; _notes?: string; _status: string }
        Returns: Json
      }
      submit_withdrawal_request:
        | {
            Args: {
              _account_name?: string
              _account_number?: string
              _amount: number
              _bank_name?: string
              _description?: string
              _method: string
              _routing_number?: string
              _wallet_address?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _account_name?: string
              _account_number?: string
              _amount: number
              _bank_name?: string
              _description?: string
              _idempotency_key?: string
              _method: string
              _routing_number?: string
              _wallet_address?: string
            }
            Returns: Json
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      kyc_id_type: "passport" | "drivers_license" | "national_id"
      kyc_status: "pending" | "under_review" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      kyc_id_type: ["passport", "drivers_license", "national_id"],
      kyc_status: ["pending", "under_review", "approved", "rejected"],
    },
  },
} as const
