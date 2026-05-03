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
      activity_log: {
        Row: {
          action_type: string
          activity_date: string
          created_at: string
          id: string
          item_id: string | null
          topic_id: string | null
        }
        Insert: {
          action_type: string
          activity_date?: string
          created_at?: string
          id?: string
          item_id?: string | null
          topic_id?: string | null
        }
        Update: {
          action_type?: string
          activity_date?: string
          created_at?: string
          id?: string
          item_id?: string | null
          topic_id?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          bookmarked: boolean
          completed: boolean
          course_id: string
          created_at: string
          id: string
          kind: string
          pinned: boolean
          section_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          bookmarked?: boolean
          completed?: boolean
          course_id: string
          created_at?: string
          id?: string
          kind?: string
          pinned?: boolean
          section_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          bookmarked?: boolean
          completed?: boolean
          course_id?: string
          created_at?: string
          id?: string
          kind?: string
          pinned?: boolean
          section_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_links: {
        Row: {
          course_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      course_sessions: {
        Row: {
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          session_date: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          session_date?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          estimated_hours: number
          id: string
          instructor_id: string | null
          last_activity: string | null
          name: string
          progress: number
          provider: string
          start_date: string | null
          status: string
          thumbnail: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          estimated_hours?: number
          id?: string
          instructor_id?: string | null
          last_activity?: string | null
          name: string
          progress?: number
          provider?: string
          start_date?: string | null
          status?: string
          thumbnail?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          estimated_hours?: number
          id?: string
          instructor_id?: string | null
          last_activity?: string | null
          name?: string
          progress?: number
          provider?: string
          start_date?: string | null
          status?: string
          thumbnail?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          title?: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_resources: {
        Row: {
          code_content: string | null
          created_at: string
          description: string
          file_size: number | null
          id: string
          language: string | null
          lesson_id: string
          name: string
          page_count: number | null
          sort_order: number
          storage_path: string | null
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          code_content?: string | null
          created_at?: string
          description?: string
          file_size?: number | null
          id?: string
          language?: string | null
          lesson_id: string
          name: string
          page_count?: number | null
          sort_order?: number
          storage_path?: string | null
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          code_content?: string | null
          created_at?: string
          description?: string
          file_size?: number | null
          id?: string
          language?: string | null
          lesson_id?: string
          name?: string
          page_count?: number | null
          sort_order?: number
          storage_path?: string | null
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_cards: {
        Row: {
          created_at: string
          ease_factor: number
          id: string
          interval: number
          item_id: string
          last_quality: number | null
          last_review_date: string | null
          next_review_date: string
          repetitions: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval?: number
          item_id: string
          last_quality?: number | null
          last_review_date?: string | null
          next_review_date?: string
          repetitions?: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval?: number
          item_id?: string
          last_quality?: number | null
          last_review_date?: string | null
          next_review_date?: string
          repetitions?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rich_notes: {
        Row: {
          content: string
          created_at: string
          format: string
          id: string
          item_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          format?: string
          id?: string
          item_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          format?: string
          id?: string
          item_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          cadence: string
          context_label: string
          course_id: string | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          progress: number
          status: string
          updated_at: string
        }
        Insert: {
          cadence?: string
          context_label?: string
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          progress?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          context_label?: string
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          progress?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
