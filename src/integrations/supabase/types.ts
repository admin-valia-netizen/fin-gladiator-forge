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
      donations: {
        Row: {
          amount: number
          cedula_confirmed: string
          created_at: string
          id: string
          payment_proof_url: string
          registration_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          cedula_confirmed: string
          created_at?: string
          id?: string
          payment_proof_url: string
          registration_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cedula_confirmed?: string
          created_at?: string
          id?: string
          payment_proof_url?: string
          registration_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      province_counters: {
        Row: {
          cidp_activated: boolean
          cidp_activated_at: string | null
          created_at: string
          id: string
          province_code: string
          province_name: string
          registration_count: number
          target_count: number
          updated_at: string
          zone_type: string
        }
        Insert: {
          cidp_activated?: boolean
          cidp_activated_at?: string | null
          created_at?: string
          id?: string
          province_code: string
          province_name: string
          registration_count?: number
          target_count?: number
          updated_at?: string
          zone_type: string
        }
        Update: {
          cidp_activated?: boolean
          cidp_activated_at?: string | null
          created_at?: string
          id?: string
          province_code?: string
          province_name?: string
          registration_count?: number
          target_count?: number
          updated_at?: string
          zone_type?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          apellidos: string | null
          apodo: string | null
          barrio_sector: string | null
          calle: string | null
          categoria: string | null
          cedula: string
          cedula_back_url: string | null
          cedula_front_url: string | null
          circunscripcion: string | null
          ciudad: string | null
          correo: string | null
          created_at: string
          distrito_municipal: string | null
          donation_status: string | null
          frente_sectorial: string | null
          full_name: string
          id: string
          interest_area: Database["public"]["Enums"]["interest_area"] | null
          legal_accepted: boolean | null
          municipio: string | null
          numero_casa: string | null
          oath_accepted: boolean | null
          ocupacion: string | null
          paraje_seccion: string | null
          passport_level: string | null
          phone: string
          provincia: string | null
          qr_code: string | null
          referidor_cedula: string | null
          referidor_nombre: string | null
          referidor_telefono: string | null
          referral_code: string | null
          referred_by: string | null
          region: string | null
          residencial_nombre: string | null
          sector: string | null
          selfie_url: string | null
          signature_confirmed: boolean | null
          telefono_otro: string | null
          telefono_residencial: string | null
          telefono_trabajo: string | null
          updated_at: string
          user_id: string | null
          user_level: Database["public"]["Enums"]["user_level"] | null
          vote_selfie_url: string | null
          vote_validated_at: string | null
          zona: string | null
        }
        Insert: {
          apellidos?: string | null
          apodo?: string | null
          barrio_sector?: string | null
          calle?: string | null
          categoria?: string | null
          cedula: string
          cedula_back_url?: string | null
          cedula_front_url?: string | null
          circunscripcion?: string | null
          ciudad?: string | null
          correo?: string | null
          created_at?: string
          distrito_municipal?: string | null
          donation_status?: string | null
          frente_sectorial?: string | null
          full_name: string
          id?: string
          interest_area?: Database["public"]["Enums"]["interest_area"] | null
          legal_accepted?: boolean | null
          municipio?: string | null
          numero_casa?: string | null
          oath_accepted?: boolean | null
          ocupacion?: string | null
          paraje_seccion?: string | null
          passport_level?: string | null
          phone: string
          provincia?: string | null
          qr_code?: string | null
          referidor_cedula?: string | null
          referidor_nombre?: string | null
          referidor_telefono?: string | null
          referral_code?: string | null
          referred_by?: string | null
          region?: string | null
          residencial_nombre?: string | null
          sector?: string | null
          selfie_url?: string | null
          signature_confirmed?: boolean | null
          telefono_otro?: string | null
          telefono_residencial?: string | null
          telefono_trabajo?: string | null
          updated_at?: string
          user_id?: string | null
          user_level?: Database["public"]["Enums"]["user_level"] | null
          vote_selfie_url?: string | null
          vote_validated_at?: string | null
          zona?: string | null
        }
        Update: {
          apellidos?: string | null
          apodo?: string | null
          barrio_sector?: string | null
          calle?: string | null
          categoria?: string | null
          cedula?: string
          cedula_back_url?: string | null
          cedula_front_url?: string | null
          circunscripcion?: string | null
          ciudad?: string | null
          correo?: string | null
          created_at?: string
          distrito_municipal?: string | null
          donation_status?: string | null
          frente_sectorial?: string | null
          full_name?: string
          id?: string
          interest_area?: Database["public"]["Enums"]["interest_area"] | null
          legal_accepted?: boolean | null
          municipio?: string | null
          numero_casa?: string | null
          oath_accepted?: boolean | null
          ocupacion?: string | null
          paraje_seccion?: string | null
          passport_level?: string | null
          phone?: string
          provincia?: string | null
          qr_code?: string | null
          referidor_cedula?: string | null
          referidor_nombre?: string | null
          referidor_telefono?: string | null
          referral_code?: string | null
          referred_by?: string | null
          region?: string | null
          residencial_nombre?: string | null
          sector?: string | null
          selfie_url?: string | null
          signature_confirmed?: boolean | null
          telefono_otro?: string | null
          telefono_residencial?: string | null
          telefono_trabajo?: string | null
          updated_at?: string
          user_id?: string | null
          user_level?: Database["public"]["Enums"]["user_level"] | null
          vote_selfie_url?: string | null
          vote_validated_at?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      get_donations_safe: {
        Args: { p_donation_id?: string }
        Returns: {
          amount: number
          cedula_confirmed: string
          created_at: string
          id: string
          registration_id: string
          rejection_reason: string
          reviewed_at: string
          reviewed_by: string
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
        }[]
      }
      get_own_document_urls: {
        Args: { p_registration_id: string }
        Returns: {
          cedula_back_url: string
          cedula_front_url: string
          selfie_url: string
          vote_selfie_url: string
        }[]
      }
      get_payment_proof_url: {
        Args: { p_donation_id: string }
        Returns: string
      }
      get_registration_safe: {
        Args: { p_registration_id?: string }
        Returns: {
          cedula: string
          created_at: string
          donation_status: string
          full_name: string
          id: string
          interest_area: Database["public"]["Enums"]["interest_area"]
          legal_accepted: boolean
          oath_accepted: boolean
          passport_level: string
          phone: string
          qr_code: string
          referral_code: string
          referred_by: string
          signature_confirmed: boolean
          updated_at: string
          user_id: string
          user_level: Database["public"]["Enums"]["user_level"]
          vote_validated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_cedula_format: { Args: { p_cedula: string }; Returns: boolean }
      validate_referral_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      donation_status: "pending" | "approved" | "rejected"
      interest_area:
        | "emprendimiento"
        | "tecnologia"
        | "deporte"
        | "empleo_tecnico"
      user_level: "aspirante" | "gladiador" | "campeon"
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
      donation_status: ["pending", "approved", "rejected"],
      interest_area: [
        "emprendimiento",
        "tecnologia",
        "deporte",
        "empleo_tecnico",
      ],
      user_level: ["aspirante", "gladiador", "campeon"],
    },
  },
} as const
