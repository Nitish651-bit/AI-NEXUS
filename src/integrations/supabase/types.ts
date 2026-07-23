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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agent_job_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          job_id: string
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          job_id: string
          message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          job_id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "agent_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_jobs: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          attempts: number
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          max_attempts: number
          output: Json | null
          parent_job_id: string | null
          priority: number
          started_at: string | null
          status: Database["public"]["Enums"]["agent_job_status"]
          updated_at: string
          user_id: string
          validation: Json | null
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          attempts?: number
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          max_attempts?: number
          output?: Json | null
          parent_job_id?: string | null
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_job_status"]
          updated_at?: string
          user_id: string
          validation?: Json | null
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          attempts?: number
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          max_attempts?: number
          output?: Json | null
          parent_job_id?: string | null
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_job_status"]
          updated_at?: string
          user_id?: string
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "agent_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_usage: {
        Row: {
          created_at: string
          id: string
          prompt: string | null
          tool_category: string
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt?: string | null
          tool_category: string
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string | null
          tool_category?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      image_generations: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          model: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      text_generations: {
        Row: {
          created_at: string
          id: string
          input_text: string
          output_text: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text: string
          output_text?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string
          output_text?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      tts_usage: {
        Row: {
          created_at: string
          id: string
          provider: string
          text: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          text: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          text?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          created_at: string
          id: string
          input_text: string | null
          output_text: string | null
          tool_category: string
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text?: string | null
          output_text?: string | null
          tool_category: string
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string | null
          output_text?: string | null
          tool_category?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "voice_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_activity_summary: {
        Row: {
          activity_date: string | null
          tool_category: string | null
          tool_name: string | null
          total_activities: number | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_agent_job: {
        Args: {
          _agent_types: Database["public"]["Enums"]["agent_type"][]
          _user_id: string
          _worker: string
        }
        Returns: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          attempts: number
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          max_attempts: number
          output: Json | null
          parent_job_id: string | null
          priority: number
          started_at: string | null
          status: Database["public"]["Enums"]["agent_job_status"]
          updated_at: string
          user_id: string
          validation: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "agent_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      agent_job_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "validated"
        | "rejected"
        | "cancelled"
      agent_type:
        | "planner"
        | "research"
        | "coding"
        | "document"
        | "image"
        | "automation"
        | "validator"
        | "orchestrator"
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
      agent_job_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "validated",
        "rejected",
        "cancelled",
      ],
      agent_type: [
        "planner",
        "research",
        "coding",
        "document",
        "image",
        "automation",
        "validator",
        "orchestrator",
      ],
    },
  },
} as const
