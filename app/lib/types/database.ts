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
          organization_id: string | null
          avatar_url: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name?: string | null
          last_name?: string | null
          organization_id?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name?: string | null
          last_name?: string | null
          organization_id?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      areas: {
        Row: {
          id: string
          name: string
          description: string | null
          organization_id: string
          parent_id: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organization_id: string
          parent_id?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          organization_id?: string
          parent_id?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          area_id: string
          assigned_to: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          area_id: string
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          area_id?: string
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      work_shifts: {
        Row: {
          id: string
          area_id: string
          user_id: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_id: string
          user_id: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_id?: string
          user_id?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          description: string | null
          area_id: string
          category: string
          quantity: number
          unit: string
          min_quantity: number
          max_quantity: number
          status: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
          last_restocked_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          area_id: string
          category: string
          quantity: number
          unit: string
          min_quantity: number
          max_quantity: number
          status?: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
          last_restocked_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          area_id?: string
          category?: string
          quantity?: number
          unit?: string
          min_quantity?: number
          max_quantity?: number
          status?: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
          last_restocked_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          area_id: string | null
          action: string
          entity_type: 'task' | 'work_shift' | 'inventory_item' | 'user' | 'area'
          entity_id: string
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id?: string | null
          action: string
          entity_type: 'task' | 'work_shift' | 'inventory_item' | 'user' | 'area'
          entity_id: string
          details: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string | null
          action?: string
          entity_type?: 'task' | 'work_shift' | 'inventory_item' | 'user' | 'area'
          entity_id?: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'task' | 'work_shift' | 'inventory' | 'system'
          priority: 'low' | 'medium' | 'high'
          read: boolean
          action_url: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'task' | 'work_shift' | 'inventory' | 'system'
          priority?: 'low' | 'medium' | 'high'
          read?: boolean
          action_url?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'task' | 'work_shift' | 'inventory' | 'system'
          priority?: 'low' | 'medium' | 'high'
          read?: boolean
          action_url?: string | null
          created_at?: string
          read_at?: string | null
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          type: 'task' | 'work_shift' | 'inventory' | 'system'
          email_enabled: boolean
          push_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'task' | 'work_shift' | 'inventory' | 'system'
          email_enabled?: boolean
          push_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'task' | 'work_shift' | 'inventory' | 'system'
          email_enabled?: boolean
          push_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          file_type: string
          file_size: number
          area_id: string
          category: string
          tags: string[]
          status: 'active' | 'archived' | 'deleted'
          created_by: string
          created_at: string
          updated_at: string
          last_accessed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          file_size: number
          area_id: string
          category: string
          tags?: string[]
          status?: 'active' | 'archived' | 'deleted'
          created_by: string
          created_at?: string
          updated_at?: string
          last_accessed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          file_size?: number
          area_id?: string
          category?: string
          tags?: string[]
          status?: 'active' | 'archived' | 'deleted'
          created_by?: string
          created_at?: string
          updated_at?: string
          last_accessed_at?: string | null
        }
      }
      contingencies: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          created_at: string
          updated_at: string
          created_by: string | null
          assigned_to: string | null
          area_id: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          assigned_to?: string | null
          area_id?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          assigned_to?: string | null
          area_id?: string | null
          organization_id?: string | null
        }
      }
      chat_rooms: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: 'direct' | 'group' | 'channel'
          description: string | null
          created_by: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          name: string
          type: 'direct' | 'group' | 'channel'
          description?: string | null
          created_by: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          name?: string
          type?: 'direct' | 'group' | 'channel'
          description?: string | null
          created_by?: string
          is_private?: boolean
          updated_at?: string
        }
      }
      chat_room_members: {
        Row: {
          room_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          last_read_at: string
          unread_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          last_read_at?: string
          unread_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'owner' | 'admin' | 'member'
          last_read_at?: string
          unread_count?: number
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          organization_id: string
          room_id: string
          user_id: string
          content: string
          type: 'text' | 'image' | 'file' | 'system'
          parent_id: string | null
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          room_id: string
          user_id: string
          content: string
          type: 'text' | 'image' | 'file' | 'system'
          parent_id?: string | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          type?: 'text' | 'image' | 'file' | 'system'
          is_edited?: boolean
          updated_at?: string
        }
      }
      chat_message_reactions: {
        Row: {
          message_id: string
          user_id: string
          reaction: string
          created_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          reaction: string
          created_at?: string
        }
        Update: {
          reaction?: string
        }
      }
      chat_message_attachments: {
        Row: {
          id: string
          organization_id: string
          message_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          message_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          file_url?: string
          file_type?: string
          file_name?: string
          file_size?: number
          updated_at?: string
        }
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
  }
}

export interface Sala {
  id: string;
  nombre: string;
  estado: boolean;
  organization_id: string;
  created_at?: string;
}

export interface Area {
  id: string;
  name: string;
  organization_id: string;
  sala_id: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
} 