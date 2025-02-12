export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invitations: {
        Row: {
          coins_awarded: boolean | null
          id: number
          invited_user_id: number
          inviter_id: number
          joined_at: string
          voice_time: number | null
        }
        Insert: {
          coins_awarded?: boolean | null
          id?: number
          invited_user_id: number
          inviter_id: number
          joined_at: string
          voice_time?: number | null
        }
        Update: {
          coins_awarded?: boolean | null
          id?: number
          invited_user_id?: number
          inviter_id?: number
          joined_at?: string
          voice_time?: number | null
        }
        Relationships: []
      }
      pomodoro_rooms: {
        Row: {
          break_time: number
          force_video: boolean | null
          is_break: boolean | null
          room_id: number
          session_time: number
          started_at: string
          user_data: Json | null
        }
        Insert: {
          break_time: number
          force_video?: boolean | null
          is_break?: boolean | null
          room_id: number
          session_time: number
          started_at: string
          user_data?: Json | null
        }
        Update: {
          break_time?: number
          force_video?: boolean | null
          is_break?: boolean | null
          room_id?: number
          session_time?: number
          started_at?: string
          user_data?: Json | null
        }
        Relationships: []
      }
      ranks: {
        Row: {
          required_xp: number
          reward: number
          role_id: number
        }
        Insert: {
          required_xp: number
          reward: number
          role_id: number
        }
        Update: {
          required_xp?: number
          reward?: number
          role_id?: number
        }
        Relationships: []
      }
      rent_settings: {
        Row: {
          guild_id: number
          multiplier: number
          rent_per_day: number
        }
        Insert: {
          guild_id: number
          multiplier: number
          rent_per_day: number
        }
        Update: {
          guild_id?: number
          multiplier?: number
          rent_per_day?: number
        }
        Relationships: []
      }
      rented_rooms: {
        Row: {
          expiration_time: string
          guild_id: number
          id: number
          members: number[]
          multiplier: number
          owner_id: number
          text_channel_id: number
          voice_channel_id: number
        }
        Insert: {
          expiration_time: string
          guild_id: number
          id?: number
          members?: number[]
          multiplier: number
          owner_id: number
          text_channel_id: number
          voice_channel_id: number
        }
        Update: {
          expiration_time?: string
          guild_id?: number
          id?: number
          members?: number[]
          multiplier?: number
          owner_id?: number
          text_channel_id?: number
          voice_channel_id?: number
        }
        Relationships: []
      }
      user_ranks: {
        Row: {
          rank_id: number
          user_id: number
        }
        Insert: {
          rank_id: number
          user_id: number
        }
        Update: {
          rank_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_ranks_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["required_xp"]
          },
        ]
      }
      user_stats: {
        Row: {
          daily_voice_time: number | null
          last_updated: string
          previous_weekly_voice_time: number | null
          total_voice_time: number | null
          user_id: number
          weekly_voice_time: number | null
        }
        Insert: {
          daily_voice_time?: number | null
          last_updated?: string
          previous_weekly_voice_time?: number | null
          total_voice_time?: number | null
          user_id: number
          weekly_voice_time?: number | null
        }
        Update: {
          daily_voice_time?: number | null
          last_updated?: string
          previous_weekly_voice_time?: number | null
          total_voice_time?: number | null
          user_id?: number
          weekly_voice_time?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          coins: number | null
          daily_coins_earned: number | null
          last_reward_date: string
          user_id: number
          xp: number | null
        }
        Insert: {
          coins?: number | null
          daily_coins_earned?: number | null
          last_reward_date?: string
          user_id: number
          xp?: number | null
        }
        Update: {
          coins?: number | null
          daily_coins_earned?: number | null
          last_reward_date?: string
          user_id?: number
          xp?: number | null
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          duration: number | null
          end_time: string | null
          id: number
          start_time: string
          user_id: number
        }
        Insert: {
          duration?: number | null
          end_time?: string | null
          id?: number
          start_time: string
          user_id: number
        }
        Update: {
          duration?: number | null
          end_time?: string | null
          id?: number
          start_time?: string
          user_id?: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
