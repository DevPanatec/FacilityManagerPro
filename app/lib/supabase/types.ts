export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name: string | null
          last_name: string | null
          status: 'active' | 'inactive' | 'pending'
          organization_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name?: string
          last_name?: string
          status?: 'active' | 'inactive' | 'pending'
          organization_id?: string
          avatar_url?: string
        }
        Update: Partial<{
          email: string
          role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name: string | null
          last_name: string | null
          status: 'active' | 'inactive' | 'pending'
          organization_id: string | null
          avatar_url: string | null
        }>
      }
      organizations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          logo_url?: string
          status?: 'active' | 'inactive' | 'pending'
        }
        Update: Partial<{
          name: string
          logo_url: string | null
          status: 'active' | 'inactive' | 'pending'
        }>
      }
      areas: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          parent_id: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          name: string
          description?: string
          parent_id?: string
          status?: 'active' | 'inactive'
        }
        Update: Partial<{
          organization_id: string
          name: string
          description: string | null
          parent_id: string | null
          status: 'active' | 'inactive'
        }>
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          area_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          area_id?: string
          title: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string
          due_date?: string
          created_by?: string
        }
        Update: Partial<{
          organization_id: string
          area_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          created_by: string | null
        }>
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id?: string
          action: string
          entity_type: string
          entity_id: string
          metadata?: Record<string, any>
        }
        Update: Partial<{
          organization_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          metadata: Record<string, any>
        }>
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
        }
        Update: Partial<{
          organization_id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
        }>
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          type: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          type: string
          enabled?: boolean
        }
        Update: Partial<{
          user_id: string
          type: string
          enabled: boolean
        }>
      }
      evaluations: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          evaluator_id: string
          type: 'performance' | 'skills' | 'objectives'
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
          scores: Record<string, any>
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          evaluator_id: string
          type: 'performance' | 'skills' | 'objectives'
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
          scores?: Record<string, any>
          comments?: string
        }
        Update: Partial<{
          organization_id: string
          user_id: string
          evaluator_id: string
          type: 'performance' | 'skills' | 'objectives'
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
          scores: Record<string, any>
          comments: string | null
        }>
      }
      security_audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          event_type: string
          resource_type: string
          resource_id: string | null
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id?: string
          event_type: string
          resource_type: string
          resource_id?: string
          old_values?: Record<string, any>
          new_values?: Record<string, any>
          ip_address?: string
          user_agent?: string
        }
        Update: Partial<{
          organization_id: string
          user_id: string | null
          event_type: string
          resource_type: string
          resource_id: string | null
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
        }>
      }
      failed_auth_attempts: {
        Row: {
          id: string
          organization_id: string
          email: string
          ip_address: string
          user_agent: string | null
          attempt_count: number
          blocked_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          email: string
          ip_address: string
          user_agent?: string
          attempt_count?: number
          blocked_until?: string
        }
        Update: Partial<{
          organization_id: string
          email: string
          ip_address: string
          user_agent: string | null
          attempt_count: number
          blocked_until: string | null
        }>
      }
      security_settings: {
        Row: {
          id: string
          organization_id: string
          password_min_length: number
          password_require_uppercase: boolean
          password_require_lowercase: boolean
          password_require_numbers: boolean
          password_require_special_chars: boolean
          password_expiry_days: number
          max_failed_attempts: number
          lockout_duration_minutes: number
          session_timeout_minutes: number
          mfa_required: boolean
          allowed_ip_ranges: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          password_min_length?: number
          password_require_uppercase?: boolean
          password_require_lowercase?: boolean
          password_require_numbers?: boolean
          password_require_special_chars?: boolean
          password_expiry_days?: number
          max_failed_attempts?: number
          lockout_duration_minutes?: number
          session_timeout_minutes?: number
          mfa_required?: boolean
          allowed_ip_ranges?: string[]
        }
        Update: Partial<{
          organization_id: string
          password_min_length: number
          password_require_uppercase: boolean
          password_require_lowercase: boolean
          password_require_numbers: boolean
          password_require_special_chars: boolean
          password_expiry_days: number
          max_failed_attempts: number
          lockout_duration_minutes: number
          session_timeout_minutes: number
          mfa_required: boolean
          allowed_ip_ranges: string[]
        }>
      }
      incidents: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          type: 'security' | 'maintenance' | 'health_safety' | 'environmental' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          area_id: string | null
          reported_by: string
          assigned_to: string | null
          resolution_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          title: string
          description?: string
          type: 'security' | 'maintenance' | 'health_safety' | 'environmental' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          area_id?: string
          reported_by: string
          assigned_to?: string
          resolution_date?: string
        }
        Update: Partial<{
          organization_id: string
          title: string
          description: string | null
          type: 'security' | 'maintenance' | 'health_safety' | 'environmental' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          area_id: string | null
          reported_by: string
          assigned_to: string | null
          resolution_date: string | null
        }>
      }
      documentation_categories: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          parent_id: string | null
          order_index: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          name: string
          description?: string
          parent_id?: string
          order_index?: number
          created_by: string
        }
        Update: Partial<{
          organization_id: string
          name: string
          description: string | null
          parent_id: string | null
          order_index: number
          created_by: string
        }>
      }
      documentation_articles: {
        Row: {
          id: string
          organization_id: string
          category_id: string
          title: string
          content: string
          type: 'technical' | 'user_guide' | 'procedure' | 'faq' | 'release_note'
          status: 'draft' | 'review' | 'published' | 'archived'
          version: string | null
          tags: string[]
          is_featured: boolean
          view_count: number
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          category_id: string
          title: string
          content: string
          type: 'technical' | 'user_guide' | 'procedure' | 'faq' | 'release_note'
          status: 'draft' | 'review' | 'published' | 'archived'
          version?: string
          tags?: string[]
          is_featured?: boolean
          view_count?: number
          last_reviewed_at?: string
          last_reviewed_by?: string
          created_by: string
        }
        Update: Partial<{
          organization_id: string
          category_id: string
          title: string
          content: string
          type: 'technical' | 'user_guide' | 'procedure' | 'faq' | 'release_note'
          status: 'draft' | 'review' | 'published' | 'archived'
          version: string | null
          tags: string[]
          is_featured: boolean
          view_count: number
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          created_by: string
        }>
      }
      chat_rooms: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: 'direct' | 'group' | 'channel'
          status: 'active' | 'archived'
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          name: string
          description?: string
          type: 'direct' | 'group' | 'channel'
          status?: 'active' | 'archived'
          is_private?: boolean
          created_by: string
        }
        Update: Partial<{
          organization_id: string
          name: string
          description: string | null
          type: 'direct' | 'group' | 'channel'
          status: 'active' | 'archived'
          is_private: boolean
          created_by: string
        }>
      }
      chat_room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          status: 'active' | 'inactive'
          last_read_at: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          organization_id: string
          role?: 'owner' | 'admin' | 'member'
          status?: 'active' | 'inactive'
          last_read_at?: string
          created_by: string
        }
        Update: Partial<{
          room_id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          status: 'active' | 'inactive'
          last_read_at: string
          created_by: string
        }>
      }
      chat_messages: {
        Row: {
          id: string
          content: string
          type: 'text' | 'image' | 'file'
          status: 'sent' | 'edited' | 'deleted'
          created_at: string
          updated_at: string
          user_id: string
          room_id: string
          organization_id: string
          file_url?: string | null
          importance: 'normal' | 'urgent' | 'important'
          edited: boolean
          reactions: {
            emoji: string
            users: string[]
          }[]
          reply_to?: {
            id: string
            content: string
            user: {
              first_name: string
              last_name: string
            }
          } | null
          online_status: 'online' | 'offline'
        }
        Insert: {
          id?: string
          content: string
          type?: 'text' | 'image' | 'file'
          status?: 'sent' | 'edited' | 'deleted'
          created_at?: string
          updated_at?: string
          user_id: string
          room_id: string
          organization_id: string
          file_url?: string | null
          importance?: 'normal' | 'urgent' | 'important'
          edited?: boolean
          reactions?: {
            emoji: string
            users: string[]
          }[]
          reply_to?: {
            id: string
            content: string
            user: {
              first_name: string
              last_name: string
            }
          } | null
          online_status?: 'online' | 'offline'
        }
        Update: {
          id?: string
          content?: string
          type?: 'text' | 'image' | 'file'
          status?: 'sent' | 'edited' | 'deleted'
          created_at?: string
          updated_at?: string
          user_id?: string
          room_id?: string
          organization_id?: string
          file_url?: string | null
          importance?: 'normal' | 'urgent' | 'important'
          edited?: boolean
          reactions?: {
            emoji: string
            users: string[]
          }[]
          reply_to?: {
            id: string
            content: string
            user: {
              first_name: string
              last_name: string
            }
          } | null
          online_status?: 'online' | 'offline'
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_message_attachments: {
        Row: {
          id: string
          message_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
          created_at: string
          updated_at: string
        }
        Insert: {
          message_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
        }
        Update: Partial<{
          message_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
        }>
      }
      chat_message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          reaction: string
          created_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          reaction: string
        }
        Update: Partial<{
          message_id: string
          user_id: string
          reaction: string
        }>
      }
    }
    Functions: {
      get_chat_messages: {
        Args: {
          p_room_id: string
          p_limit: number
          p_offset: number
        }
        Returns: {
          id: string
          content: string
          type: string
          status: string
          created_at: string
          updated_at: string
          user_id: string
          room_id: string
          organization_id: string
          first_name: string
          last_name: string
          avatar_url: string | null
        }[]
      }
      get_chat_messages_v2: {
        Args: {
          p_room_id: string
        }
        Returns: {
          id: string
          content: string
          type: 'text' | 'image' | 'file'
          status: string
          created_at: string
          updated_at: string
          user_id: string
          room_id: string
          organization_id: string
          file_url: string | null
          importance: 'normal' | 'urgent' | 'important'
          edited: boolean
          reactions: {
            emoji: string
            users: string[]
          }[]
          reply_to: {
            id: string
            content: string
            user: {
              first_name: string
              last_name: string
            }
          } | null
          online_status: 'online' | 'offline'
          users: {
            first_name: string
            last_name: string
            avatar_url: string | null
          }
        }[]
      }
      get_chat_room_messages_v1: {
        Args: {
          room_uuid: string
          msg_limit?: number
          msg_offset?: number
        }
        Returns: {
          id: string
          content: string
          type: string
          status: string
          created_at: string
          updated_at: string
          user_id: string
          room_id: string
          organization_id: string
          first_name: string
          last_name: string
          avatar_url: string | null
        }[]
      }
      get_users_online_status: {
        Args: {
          p_user_ids: string[]
        }
        Returns: {
          user_id: string
          online_status: 'online' | 'offline'
          last_seen: string
        }[]
      }
      update_user_online_status: {
        Args: {
          p_user_id: string
          p_status: 'online' | 'offline'
        }
        Returns: void
      }
    }
  }
} 