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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      area_classifications: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          classification_id: string | null
          contact_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          metadata: Json | null
          name: string
          organization_id: string
          parent_id: string | null
          sala_id: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          classification_id?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          parent_id?: string | null
          sala_id?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          classification_id?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          sala_id?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "area_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          area_id: string
          completed_at: string | null
          created_at: string | null
          end_time: string | null
          id: string
          organization_id: string
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          area_id: string
          completed_at?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          organization_id: string
          start_time: string
          status?: string
          user_id: string
        }
        Update: {
          area_id?: string
          completed_at?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          organization_id?: string
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          edited: boolean | null
          file_url: string | null
          id: string
          importance: string | null
          online_status: string | null
          organization_id: string
          reactions: Json | null
          reply_to: Json | null
          room_id: string
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited?: boolean | null
          file_url?: string | null
          id?: string
          importance?: string | null
          online_status?: string | null
          organization_id: string
          reactions?: Json | null
          reply_to?: Json | null
          room_id: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited?: boolean | null
          file_url?: string | null
          id?: string
          importance?: string | null
          online_status?: string | null
          organization_id?: string
          reactions?: Json | null
          reply_to?: Json | null
          room_id?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string | null
          organization_id: string
          role: string
          room_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          organization_id: string
          role: string
          room_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          organization_id?: string
          role?: string
          room_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "chat_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_webhooks: {
        Row: {
          created_at: string | null
          endpoint_url: string
          event_type: string
          id: string
          is_active: boolean | null
          organization_id: string
          secret_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_url: string
          event_type: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          secret_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_url?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          secret_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_requirements: {
        Row: {
          area_id: string
          created_at: string | null
          frequency: string
          frequency_type: string
          id: string
          organization_id: string
          requires_prn: boolean | null
          technique_id: string
          updated_at: string | null
        }
        Insert: {
          area_id: string
          created_at?: string | null
          frequency: string
          frequency_type: string
          id?: string
          organization_id: string
          requires_prn?: boolean | null
          technique_id: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string | null
          frequency?: string
          frequency_type?: string
          id?: string
          organization_id?: string
          requires_prn?: boolean | null
          technique_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_requirements_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_requirements_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "cleaning_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_techniques: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_techniques_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          parent_id: string | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          parent_id?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          parent_id?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contingencies: {
        Row: {
          area_id: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string | null
          priority: string
          status: string
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          status?: string
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          status?: string
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contingencies_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contingencies_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "contingency_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contingency_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contingency_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string | null
          area_id: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          last_viewed_at: string | null
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string | null
          uploaded_by: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          access_level?: string | null
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          last_viewed_at?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          access_level?: string | null
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          last_viewed_at?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          department: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          organization_id: string
          position: string
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
          work_shift_id: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          department: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          organization_id: string
          position: string
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          work_shift_id?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          department?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          organization_id?: string
          position?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          work_shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_shift_id_fkey"
            columns: ["work_shift_id"]
            isOneToOne: false
            referencedRelation: "work_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string | null
          development_plan: string | null
          evaluation_period: string | null
          evaluator_id: string
          goals: Json | null
          id: string
          next_review_date: string | null
          organization_id: string
          previous_evaluation_id: string | null
          scores: Json | null
          skills_assessment: Json | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          development_plan?: string | null
          evaluation_period?: string | null
          evaluator_id: string
          goals?: Json | null
          id?: string
          next_review_date?: string | null
          organization_id: string
          previous_evaluation_id?: string | null
          scores?: Json | null
          skills_assessment?: Json | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          development_plan?: string | null
          evaluation_period?: string | null
          evaluator_id?: string
          goals?: Json | null
          id?: string
          next_review_date?: string | null
          organization_id?: string
          previous_evaluation_id?: string | null
          scores?: Json | null
          skills_assessment?: Json | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_previous_evaluation_id_fkey"
            columns: ["previous_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string
          created_at: string | null
          estimated_duration: number | null
          id: string
          last_updated: string | null
          last_used: string | null
          location: string
          min_stock: number
          name: string
          organization_id: string | null
          quantity: number
          status: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          last_updated?: string | null
          last_used?: string | null
          location: string
          min_stock: number
          name: string
          organization_id?: string | null
          quantity?: number
          status: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          last_updated?: string | null
          last_used?: string | null
          location?: string
          min_stock?: number
          name?: string
          organization_id?: string | null
          quantity?: number
          status?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          created_at: string
          date: string
          id: string
          inventory_id: string | null
          organization_id: string | null
          quantity: number
          type: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          inventory_id?: string | null
          organization_id?: string | null
          quantity: number
          type: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          inventory_id?: string | null
          organization_id?: string | null
          quantity?: number
          type?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          area_id: string | null
          barcode: string | null
          category: string | null
          cost_history: Json | null
          created_at: string | null
          description: string | null
          id: string
          location_data: Json | null
          min_stock: number
          minimum_quantity: number | null
          name: string
          organization_id: string
          quantity: number
          reorder_point: number | null
          status: string | null
          supplier_info: Json | null
          unit: string
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          barcode?: string | null
          category?: string | null
          cost_history?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_data?: Json | null
          min_stock?: number
          minimum_quantity?: number | null
          name: string
          organization_id: string
          quantity?: number
          reorder_point?: number | null
          status?: string | null
          supplier_info?: Json | null
          unit?: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          barcode?: string | null
          category?: string | null
          cost_history?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_data?: Json | null
          min_stock?: number
          minimum_quantity?: number | null
          name?: string
          organization_id?: string
          quantity?: number
          reorder_point?: number | null
          status?: string | null
          supplier_info?: Json | null
          unit?: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_restock: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          inventory_id: string | null
          organization_id: string
          quantity: number
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          inventory_id?: string | null
          organization_id: string
          quantity: number
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          inventory_id?: string | null
          organization_id?: string
          quantity?: number
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_restock_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_restock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          inventory_id: string | null
          organization_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          inventory_id?: string | null
          organization_id?: string | null
          quantity: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          inventory_id?: string | null
          organization_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_name: string | null
          sender_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_name?: string | null
          sender_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_name?: string | null
          sender_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string | null
          id: string
          metadata: Json | null
          quiet_hours: Json | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          metadata?: Json | null
          quiet_hours?: Json | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          metadata?: Json | null
          quiet_hours?: Json | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string | null
          organization_id: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string | null
          organization_id: string
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string | null
          organization_id?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          contact_email: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salas: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: boolean | null
          id: string
          nombre: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: boolean | null
          id?: string
          nombre: string
          organization_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: boolean | null
          id?: string
          nombre?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule: {
        Row: {
          area_id: string | null
          assigned_to: string[] | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          organization_id: string | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          assigned_to?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          organization_id?: string | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          assigned_to?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          organization_id?: string | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subareas: {
        Row: {
          area_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subareas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      task_images: {
        Row: {
          created_at: string | null
          created_by: string
          file_path: string
          id: string
          image_url: string
          organization_id: string
          task_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          file_path: string
          id?: string
          image_url: string
          organization_id: string
          task_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          file_path?: string
          id?: string
          image_url?: string
          organization_id?: string
          task_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_images_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string | null
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          after_image: string | null
          area_id: string | null
          assigned_to: string | null
          attachments: Json | null
          before_image: string | null
          completed_at: string | null
          completion_notes: string | null
          complexity: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          during_image: string | null
          end_time: string | null
          estimated_hours: number | null
          frequency: string | null
          id: string
          organization_id: string
          parent_task_id: string | null
          priority: string | null
          sala_id: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          subarea_id: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          after_image?: string | null
          area_id?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          before_image?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          during_image?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          frequency?: string | null
          id?: string
          organization_id: string
          parent_task_id?: string | null
          priority?: string | null
          sala_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          subarea_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          after_image?: string | null
          area_id?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          before_image?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          during_image?: string | null
          end_time?: string | null
          estimated_hours?: number | null
          frequency?: string | null
          id?: string
          organization_id?: string
          parent_task_id?: string | null
          priority?: string | null
          sala_id?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          subarea_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_subarea_id_fkey"
            columns: ["subarea_id"]
            isOneToOne: false
            referencedRelation: "subareas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          first_name: string | null
          id: string
          language: string | null
          last_active_at: string | null
          last_login_at: string | null
          last_name: string | null
          metadata: Json | null
          organization_id: string | null
          password_changed_at: string | null
          phone_number: string | null
          role: string
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          first_name?: string | null
          id: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          organization_id?: string | null
          password_changed_at?: string | null
          phone_number?: string | null
          role: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          organization_id?: string | null
          password_changed_at?: string | null
          phone_number?: string | null
          role?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          error_message: string | null
          event: string
          execution_time: number | null
          id: string
          next_retry_at: string | null
          payload: Json
          request_body: Json | null
          request_headers: Json | null
          response_body: string | null
          response_status: number | null
          updated_at: string | null
          webhook_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          event: string
          execution_time?: number | null
          id?: string
          next_retry_at?: string | null
          payload: Json
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_status?: number | null
          updated_at?: string | null
          webhook_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          event?: string
          execution_time?: number | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_status?: number | null
          updated_at?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          name: string
          organization_id: string
          retry_count: number | null
          secret: string | null
          security_token: string | null
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          events: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          name: string
          organization_id: string
          retry_count?: number | null
          secret?: string | null
          security_token?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          name?: string
          organization_id?: string
          retry_count?: number | null
          secret?: string | null
          security_token?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shifts: {
        Row: {
          area_id: string | null
          break_time: number | null
          created_at: string | null
          end_time: string
          id: string
          location: Json | null
          notes: string | null
          organization_id: string
          overtime_minutes: number | null
          replacement_user_id: string | null
          sala_id: string | null
          shift_type: string | null
          start_time: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          break_time?: number | null
          created_at?: string | null
          end_time: string
          id?: string
          location?: Json | null
          notes?: string | null
          organization_id: string
          overtime_minutes?: number | null
          replacement_user_id?: string | null
          sala_id?: string | null
          shift_type?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          break_time?: number | null
          created_at?: string | null
          end_time?: string
          id?: string
          location?: Json | null
          notes?: string | null
          organization_id?: string
          overtime_minutes?: number | null
          replacement_user_id?: string | null
          sala_id?: string | null
          shift_type?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_replacement_user_id_fkey"
            columns: ["replacement_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_replacement_user_id_fkey"
            columns: ["replacement_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      inventory_statistics: {
        Row: {
          date: string | null
          low_stock_count: number | null
          organization_id: string | null
          out_of_stock_count: number | null
          refreshed_at: string | null
          status: string | null
          total_items: number | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statistics: {
        Row: {
          cancelled_count: number | null
          completed_count: number | null
          date: string | null
          high_priority_count: number | null
          in_progress_count: number | null
          organization_id: string | null
          overdue_count: number | null
          pending_count: number | null
          refreshed_at: string | null
          total_tasks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shift_statistics: {
        Row: {
          cancelled_count: number | null
          completed_count: number | null
          date: string | null
          in_progress_count: number | null
          organization_id: string | null
          refreshed_at: string | null
          scheduled_count: number | null
          total_shifts: number | null
          total_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_direct_chat: {
        Args: {
          target_user_id: string
        }
        Returns: boolean
      }
      check_chat_room_membership: {
        Args: {
          p_room_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      create_enterprise_admin_chat: {
        Args: {
          p_enterprise_id: string
          p_admin_id: string
        }
        Returns: string
      }
      ensure_chat_membership: {
        Args: {
          p_room_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      generate_search_vector: {
        Args: {
          title: string
          description: string
          additional_text?: string
        }
        Returns: unknown
      }
      get_available_admins_for_chat: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          user_id: string
          full_name: string
          avatar_url: string
          role: string
          online_status: string
          last_seen: string
        }[]
      }
      get_chat_display_name: {
        Args: {
          p_room_id: string
          p_current_user_id: string
        }
        Returns: string
      }
      get_chat_messages:
        | {
            Args: {
              p_room_id: string
            }
            Returns: {
              id: string
              content: string
              created_at: string
              user_id: string
              first_name: string
              last_name: string
            }[]
          }
        | {
            Args: {
              p_room_id: string
              p_limit?: number
              p_offset?: number
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
              avatar_url: string
            }[]
          }
      get_chat_messages_v2:
        | {
            Args: {
              p_room_id: string
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
              file_url: string
              importance: string
              edited: boolean
              reactions: Json
              reply_to: Json
              online_status: string
              users: Json
            }[]
          }
        | {
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
              avatar_url: string
            }[]
          }
      get_current_user_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_inventory_report: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
          p_area_id?: string
        }
        Returns: {
          period: string
          total_items: number
          low_stock_items: number
          total_quantity: number
        }[]
      }
      get_or_create_direct_chat:
        | {
            Args: {
              p_organization_id: string
              p_user_id_1: string
              p_user_id_2: string
            }
            Returns: {
              room_id: string
              room_name: string
              other_user_name: string
            }[]
          }
        | {
            Args: {
              target_user_id: string
            }
            Returns: string
          }
      get_org_admins: {
        Args: {
          org_id: string
        }
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: string
        }[]
      }
      get_task_report: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
          p_area_id?: string
        }
        Returns: {
          period: string
          status: string
          priority: string
          total_tasks: number
          overdue_tasks: number
          avg_completion_time_hours: number
        }[]
      }
      get_user_chat_rooms:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              room_id: string
              room_name: string
              is_group: boolean
              last_message: string
              last_message_at: string
              unread_count: number
            }[]
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: {
              room_id: string
              room_name: string
              is_group: boolean
              last_message: string
              last_message_at: string
              unread_count: number
              other_user_id: string
              other_user_name: string
            }[]
          }
      get_user_data: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          role: string
          organization_id: string
        }[]
      }
      get_users_online_status: {
        Args: {
          p_user_ids: string[]
        }
        Returns: {
          user_id: string
          online_status: string
          last_seen: string
        }[]
      }
      get_work_shift_report: {
        Args: {
          p_organization_id: string
          p_start_date: string
          p_end_date: string
          p_area_id?: string
          p_user_id?: string
        }
        Returns: {
          period: string
          user_id: string
          total_shifts: number
          total_hours: number
          avg_shift_duration_hours: number
        }[]
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      is_room_member: {
        Args: {
          user_uuid: string
          room_uuid: string
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_user_room_member: {
        Args: {
          room_id: string
        }
        Returns: boolean
      }
      mark_chat_room_as_read: {
        Args: {
          p_room_id: string
        }
        Returns: undefined
      }
      mark_webhook_failed: {
        Args: {
          p_log_id: string
          p_error_message: string
          p_max_attempts?: number
        }
        Returns: undefined
      }
      mark_webhook_successful: {
        Args: {
          p_log_id: string
          p_response_status: number
          p_response_body: string
        }
        Returns: undefined
      }
      queue_webhook: {
        Args: {
          p_webhook_id: string
          p_event: string
          p_payload: Json
        }
        Returns: string
      }
      refresh_all_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_entities: {
        Args: {
          p_organization_id: string
          p_query: string
          p_entity_types?: string[]
          p_status?: string[]
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          entity_type: string
          entity_id: string
          title: string
          description: string
          status: string
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
      send_chat_message: {
        Args: {
          p_room_id: string
          p_content: string
        }
        Returns: string
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      test_webhooks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_last_read: {
        Args: {
          p_room_id: string
        }
        Returns: undefined
      }
      update_last_read_at: {
        Args: {
          p_chat_room_id: string
        }
        Returns: undefined
      }
      update_user_online_status: {
        Args: {
          p_user_id: string
          p_status: string
        }
        Returns: undefined
      }
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
