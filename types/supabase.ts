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
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      alertas_inventario: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          mensaje: string
          nivel: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: string
          mensaje: string
          nivel: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          mensaje?: string
          nivel?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          created_at: string
          data_type: string
          data_value: Json
          hospital_id: string | null
          id: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_type: string
          data_value: Json
          hospital_id?: string | null
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_type?: string
          data_value?: Json
          hospital_id?: string | null
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          hospital_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_hospital: {
        Row: {
          color: string
          created_at: string | null
          frecuencia_limpieza: Json | null
          id: string
          nombre: string
          tipo: string
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          frecuencia_limpieza?: Json | null
          id?: string
          nombre: string
          tipo: string
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          frecuencia_limpieza?: Json | null
          id?: string
          nombre?: string
          tipo?: string
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asignaciones_turnos: {
        Row: {
          created_at: string | null
          id: string
          turno_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          turno_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          turno_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_turnos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string | null
          end_date: string | null
          facility_id: string | null
          hospital_id: string | null
          id: string
          role: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          role: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          role?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          employee_id: string
          hospital_id: string | null
          id: string
          location_data: Json | null
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out?: string | null
          created_at?: string
          employee_id: string
          hospital_id?: string | null
          id?: string
          location_data?: Json | null
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          employee_id?: string
          hospital_id?: string | null
          id?: string
          location_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string | null
          created_at: string
          description: string
          event_type: string
          hospital_id: string | null
          id: string
          metadata: Json | null
          organization_id: string
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          description: string
          event_type: string
          hospital_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string
          description?: string
          event_type?: string
          hospital_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_settings: {
        Row: {
          id: string
          lockout_duration_minutes: number | null
          max_login_attempts: number | null
          min_password_length: number | null
          password_expiry_days: number | null
          require_2fa_for_role: string[] | null
          require_number: boolean | null
          require_special_char: boolean | null
          require_uppercase: boolean | null
        }
        Insert: {
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          min_password_length?: number | null
          password_expiry_days?: number | null
          require_2fa_for_role?: string[] | null
          require_number?: boolean | null
          require_special_char?: boolean | null
          require_uppercase?: boolean | null
        }
        Update: {
          id?: string
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          min_password_length?: number | null
          password_expiry_days?: number | null
          require_2fa_for_role?: string[] | null
          require_number?: boolean | null
          require_special_char?: boolean | null
          require_uppercase?: boolean | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_name: string
          backup_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          file_path: string | null
          file_size: number | null
          id: string
          retention_days: number | null
          status: string
        }
        Insert: {
          backup_name: string
          backup_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_days?: number | null
          status: string
        }
        Update: {
          backup_name?: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_days?: number | null
          status?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          hospital_id: string | null
          id: string
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_room_id: string | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_room_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_room_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          hospital_id: string | null
          id: string
          name: string | null
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          hospital_id?: string | null
          id?: string
          name?: string | null
          organization_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          hospital_id?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
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
      dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout: Json
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout: Json
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout?: Json
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          active: boolean | null
          config: Json | null
          created_at: string | null
          id: string
          position: Json
          title: string
          updated_at: string | null
          user_id: string | null
          widget_type: string
        }
        Insert: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          position?: Json
          title: string
          updated_at?: string | null
          user_id?: string | null
          widget_type: string
        }
        Update: {
          active?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          position?: Json
          title?: string
          updated_at?: string | null
          user_id?: string | null
          widget_type?: string
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          function_name: string | null
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          function_name?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          function_name?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string
          hospital_id: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url: string
          hospital_id?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string
          hospital_id?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_records: {
        Row: {
          created_at: string
          department_id: string | null
          employee_id: string | null
          hire_date: string
          hospital_id: string | null
          id: string
          organization_id: string
          position_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          hire_date: string
          hospital_id?: string | null
          id?: string
          organization_id: string
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          employee_id?: string | null
          hire_date?: string
          hospital_id?: string | null
          id?: string
          organization_id?: string
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_records_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          organization_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          organization_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      error_alerts: {
        Row: {
          active: boolean | null
          alert_threshold: number | null
          cooldown_minutes: number | null
          created_at: string | null
          error_pattern: string
          id: string
          last_triggered: string | null
          notification_channels: Json | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          alert_threshold?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          error_pattern: string
          id?: string
          last_triggered?: string | null
          notification_channels?: Json | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          alert_threshold?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          error_pattern?: string
          id?: string
          last_triggered?: string | null
          notification_channels?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_type: string
          hospital_id: string | null
          id: string
          ip_address: string | null
          message: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_type: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          message: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_type?: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          message?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string
          employee_id: string
          evaluation_date: string
          evaluation_type: string
          evaluator_id: string
          hospital_id: string | null
          id: string
          scores: Json
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          employee_id: string
          evaluation_date: string
          evaluation_type: string
          evaluator_id: string
          hospital_id?: string | null
          id?: string
          scores: Json
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          employee_id?: string
          evaluation_date?: string
          evaluation_type?: string
          evaluator_id?: string
          hospital_id?: string | null
          id?: string
          scores?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          created_at: string | null
          hospital_id: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number | null
          email: string
          hospital_id: string | null
          id: string
          ip_address: string | null
          is_locked: boolean | null
          last_attempt: string | null
          locked_until: string | null
        }
        Insert: {
          attempt_count?: number | null
          email: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          is_locked?: boolean | null
          last_attempt?: string | null
          locked_until?: string | null
        }
        Update: {
          attempt_count?: number | null
          email?: string
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          is_locked?: boolean | null
          last_attempt?: string | null
          locked_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_login_attempts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_info: {
        Row: {
          created_at: string | null
          direccion: string
          id: string
          nivel_atencion: string | null
          nombre: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          direccion: string
          id?: string
          nivel_atencion?: string | null
          nombre: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          direccion?: string
          id?: string
          nivel_atencion?: string | null
          nombre?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          province: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          province: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          province?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          cantidad: number
          cantidad_minima: number
          created_at: string | null
          id: string
          nombre: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          cantidad: number
          cantidad_minima: number
          created_at?: string | null
          id?: string
          nombre: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          cantidad_minima?: number
          created_at?: string | null
          id?: string
          nombre?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string | null
          facility_id: string | null
          hospital_id: string | null
          id: string
          location: string | null
          min_quantity: number | null
          name: string
          quantity: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name: string
          quantity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name?: string
          quantity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_config: {
        Row: {
          active: boolean | null
          calculation_period: string
          created_at: string | null
          critical_threshold: number | null
          hospital_id: string | null
          id: string
          kpi_name: string
          metric_query: string
          target_value: number | null
          updated_at: string | null
          warning_threshold: number | null
        }
        Insert: {
          active?: boolean | null
          calculation_period: string
          created_at?: string | null
          critical_threshold?: number | null
          hospital_id?: string | null
          id?: string
          kpi_name: string
          metric_query: string
          target_value?: number | null
          updated_at?: string | null
          warning_threshold?: number | null
        }
        Update: {
          active?: boolean | null
          calculation_period?: string
          created_at?: string | null
          critical_threshold?: number | null
          hospital_id?: string | null
          id?: string
          kpi_name?: string
          metric_query?: string
          target_value?: number | null
          updated_at?: string | null
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_config_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      location_settings: {
        Row: {
          address: string | null
          coordinates: unknown | null
          created_at: string
          id: string
          name: string
          organization_id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          coordinates?: unknown | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          coordinates?: unknown | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          facility_id: string | null
          hospital_id: string | null
          id: string
          scheduled_date: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          scheduled_date?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          hospital_id?: string | null
          id?: string
          scheduled_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          timestamp: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          timestamp?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          timestamp?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channels: Json
          created_at: string | null
          id: string
          notification_type: string
          organization_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channels?: Json
          created_at?: string | null
          id?: string
          notification_type: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channels?: Json
          created_at?: string | null
          id?: string
          notification_type?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          notification_type: string | null
          priority: string | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          priority?: string | null
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string | null
          priority?: string | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          metric_type: string
          metric_value: Json
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at: string
          metric_type: string
          metric_value: Json
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          metric_type?: string
          metric_value?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string
          id: string
          organization_id: string | null
          resource: string
          role_id: string
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string
          id?: string
          organization_id?: string | null
          resource: string
          role_id: string
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          organization_id?: string | null
          resource?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          id: string
          name: string
          requirements: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          name: string
          requirements?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          name?: string
          requirements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          last_used: string | null
          organization_id: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          last_used?: string | null
          organization_id?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          last_used?: string | null
          organization_id?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          parameters: Json | null
          priority: string | null
          report_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parameters?: Json | null
          priority?: string | null
          report_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parameters?: Json | null
          priority?: string | null
          report_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revoked_tokens: {
        Row: {
          id: string
          revoked_at: string
          token: string
        }
        Insert: {
          id?: string
          revoked_at?: string
          token: string
        }
        Update: {
          id?: string
          revoked_at?: string
          token?: string
        }
        Relationships: []
      }
      role_hierarchy: {
        Row: {
          child_role_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          parent_role_id: string | null
        }
        Insert: {
          child_role_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          parent_role_id?: string | null
        }
        Update: {
          child_role_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          parent_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_hierarchy_child_role_id_fkey"
            columns: ["child_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_hierarchy_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_hierarchy_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      supported_languages: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          default_lang: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          default_lang?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          default_lang?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          hospital_id: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_audit_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tareas: {
        Row: {
          area_id: string | null
          created_at: string | null
          descripcion: string
          estado: string | null
          frecuencia: string
          id: string
          prioridad: string
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string | null
          frecuencia: string
          id?: string
          prioridad: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: string | null
          frecuencia?: string
          id?: string
          prioridad?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_hospital"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          id: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          id?: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          id?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklists: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          item_text: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          item_text: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          item_text?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_recurrence: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          day_of_month: number | null
          days_of_week: number[] | null
          end_date: string | null
          frequency: string
          id: string
          interval_value: number | null
          last_generated: string | null
          start_date: string
          task_template_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_value?: number | null
          last_generated?: string | null
          start_date: string
          task_template_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_value?: number | null
          last_generated?: string | null
          start_date?: string
          task_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_recurrence_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
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
      task_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          parent_task_id: string | null
          priority: string
          recurrence: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          parent_task_id?: string | null
          priority?: string
          recurrence?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          parent_task_id?: string | null
          priority?: string
          recurrence?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      time_off_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          request_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          request_type: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          request_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_records"
            referencedColumns: ["id"]
          },
        ]
      }
      totp_backup_codes: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          key: string
          lang_code: string | null
          namespace: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key: string
          lang_code?: string | null
          namespace: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key?: string
          lang_code?: string | null
          namespace?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_lang_code_fkey"
            columns: ["lang_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      turnos: {
        Row: {
          codigo: string
          color: string
          created_at: string | null
          descripcion: string
          hora_fin: string
          hora_inicio: string
          id: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          color: string
          created_at?: string | null
          descripcion: string
          hora_fin: string
          hora_inicio: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          color?: string
          created_at?: string | null
          descripcion?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          secret_key: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret_key: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret_key?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_language_preferences: {
        Row: {
          preferred_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_language_preferences_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          ip_address: string | null
          last_activity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          active: boolean | null
          created_at: string | null
          events: string[]
          id: string
          secret: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          events: string[]
          id?: string
          secret?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          events?: string[]
          id?: string
          secret?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          config_id: string | null
          created_at: string | null
          event: string
          id: string
          response_body: string | null
          response_code: number | null
          status: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          event: string
          id?: string
          response_body?: string | null
          response_code?: number | null
          status: string
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          event?: string
          id?: string
          response_body?: string | null
          response_code?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_areas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location_data: Json | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location_data?: Json | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location_data?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shifts: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          end_time: string
          id: string
          name: string
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          end_time: string
          id?: string
          name: string
          organization_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          end_time?: string
          id?: string
          name?: string
          organization_id?: string
          start_time?: string
          updated_at?: string
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjuntaryprocesardocumentos: {
        Args: {
          id_tarea: number
          archivo: string
          tipo_documento: string
        }
        Returns: undefined
      }
      assign_tags_to_task: {
        Args: {
          p_task_id: string
          p_tag_ids: string[]
        }
        Returns: string[]
      }
      calculate_kpis: {
        Args: {
          p_period_start: string
          p_period_end: string
        }
        Returns: {
          kpi_name: string
          current_value: number
          target_value: number
          status: string
          trend: number
        }[]
      }
      check_permission:
        | {
            Args: {
              p_user_id: string
              p_resource: string
              p_action: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_user_id: string
              p_resource: string
              p_action: string
            }
            Returns: boolean
          }
      cleanup_old_debug_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_backup: {
        Args: {
          p_backup_type: string
          p_retention_days?: number
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_recurring_task: {
        Args: {
          p_template_id: string
          p_frequency: string
          p_interval_value?: number
          p_days_of_week?: number[]
          p_day_of_month?: number
          p_start_date?: string
          p_end_date?: string
        }
        Returns: string
      }
      export_evaluations_to_csv: {
        Args: {
          p_user_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: string
      }
      export_tasks_to_csv: {
        Args: {
          p_user_id: string
          p_start_date?: string
          p_end_date?: string
          p_status?: string
        }
        Returns: string
      }
      generate_performance_report: {
        Args: {
          p_user_id: string
          p_employee_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Json
      }
      generate_recurring_task_instance: {
        Args: {
          p_recurrence_id: string
        }
        Returns: string
      }
      generate_refresh_token: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      gestionarlistasverificacion: {
        Args: {
          accion: string
          id_lista?: number
          descripcion?: string
          estado?: boolean
        }
        Returns: undefined
      }
      get_available_filters: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      get_dashboard_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_error_summary: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          error_type: string
          error_count: number
          resolved_count: number
          last_occurrence: string
          avg_resolution_time: unknown
        }[]
      }
      get_inherited_roles: {
        Args: {
          p_role_id: string
        }
        Returns: {
          role_id: string
        }[]
      }
      get_metric_history: {
        Args: {
          p_metric_type: string
          p_period_start: string
          p_period_end: string
          p_interval?: string
        }
        Returns: {
          time_bucket: string
          avg_value: number
          min_value: number
          max_value: number
        }[]
      }
      get_translations: {
        Args: {
          p_lang_code: string
          p_namespace?: string
        }
        Returns: Json
      }
      get_user_organizations: {
        Args: {
          p_user_id: string
        }
        Returns: {
          organization_id: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_error: {
        Args: {
          p_error_type: string
          p_message: string
          p_stack_trace?: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_notification_read: {
        Args: {
          p_notification_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      nuevousuarioregistrado: {
        Args: {
          id_usuario: string
        }
        Returns: undefined
      }
      process_pending_recurring_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      record_metric: {
        Args: {
          p_metric_type: string
          p_metric_name: string
          p_value: number
          p_metadata?: Json
        }
        Returns: string
      }
      resolve_error: {
        Args: {
          p_error_id: string
          p_resolution_notes: string
        }
        Returns: boolean
      }
      revoke_refresh_token: {
        Args: {
          token: string
        }
        Returns: undefined
      }
      save_dashboard_layout: {
        Args: {
          p_name: string
          p_layout: Json
          p_set_default?: boolean
        }
        Returns: string
      }
      search_tasks: {
        Args: {
          p_query: string
          p_filters?: Json
        }
        Returns: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          assigned_to: string
          created_at: string
          relevance: number
        }[]
      }
      search_tasks_advanced: {
        Args: {
          p_user_id: string
          p_search?: string
          p_filters?: Json
          p_sort?: Json
        }
        Returns: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          assigned_to: string
          assignee_name: string
          work_area_name: string
          created_at: string
          completed_at: string
          relevance: number
        }[]
      }
      search_tasks_by_tags: {
        Args: {
          p_tag_ids: string[]
          p_match_all?: boolean
        }
        Returns: {
          task_id: string
          title: string
          status: string
          tag_count: number
        }[]
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      set_user_language: {
        Args: {
          p_lang_code: string
        }
        Returns: boolean
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
      sync_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_dashboard_widget: {
        Args: {
          p_widget_id: string
          p_widget_type: string
          p_title: string
          p_config?: Json
          p_position?: Json
        }
        Returns: string
      }
      upsert_tag: {
        Args: {
          p_name: string
          p_color?: string
          p_description?: string
        }
        Returns: string
      }
      upsert_translation: {
        Args: {
          p_namespace: string
          p_key: string
          p_lang_code: string
          p_value: string
        }
        Returns: string
      }
      upsert_translation_v2: {
        Args: {
          p_namespace: string
          p_key: string
          p_lang_code: string
          p_value: string
          p_user_id?: string
        }
        Returns: string
      }
      validaritemsverificacion: {
        Args: {
          id_lista: number
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
