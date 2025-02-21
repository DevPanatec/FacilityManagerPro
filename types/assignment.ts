interface Assignment {
  // ... existing fields ...
  deep_task_id?: string | null;
  deepTask?: {
    id: string;
    name: string;
    description: string;
  } | null;
} 