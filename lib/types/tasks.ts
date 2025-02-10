export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  assigned_to?: string;
  created_by: string;
  organization_id: string;
  area_id: string;
  sala_id?: string;
  category_id?: string;
  department_id?: string;
  parent_task_id?: string;
  recurrence?: RecurrencePattern;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
}

export interface TaskInsert extends Omit<Task, 'id'> {
  id?: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  end_date?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  created_at: string;
} 