export type AttendanceRecord = {
  id: string
  employee_id: string
  check_in: string
  check_out?: string
  location_data?: {
    latitude?: number
    longitude?: number
    address?: string
  }
  created_at: string
  updated_at: string
} 