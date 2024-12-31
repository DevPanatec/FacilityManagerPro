export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_default: boolean;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  layouts: DashboardLayout[];
  widgets: DashboardWidget[];
} 