import { Switch, Select } from '@/components/ui';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface DeepTask {
  id: string;
  name: string;
  description: string;
}

function AssignmentModal({ isOpen, onClose, onSubmit }) {
  const [enableDeepTasks, setEnableDeepTasks] = useState(false);
  const [deepTasks, setDeepTasks] = useState<DeepTask[]>([]);
  const [selectedDeepTask, setSelectedDeepTask] = useState<string | null>(null);

  useEffect(() => {
    if (enableDeepTasks) {
      loadDeepTasks();
    }
  }, [enableDeepTasks]);

  const loadDeepTasks = async () => {
    const { data, error } = await supabase
      .from('deep_tasks')
      .select('id, name, description')
      .eq('active', true);
    
    if (data && !error) {
      setDeepTasks(data);
    }
  };

  const handleSubmit = async (formData) => {
    const assignmentData = {
      ...formData,
      deep_task_id: enableDeepTasks ? selectedDeepTask : null,
    };
    onSubmit(assignmentData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={enableDeepTasks}
            onCheckedChange={setEnableDeepTasks}
            id="deep-tasks-switch"
          />
          <label htmlFor="deep-tasks-switch">
            Activar tareas profundas
          </label>
        </div>

        {enableDeepTasks && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Seleccionar tarea profunda
            </label>
            <Select
              value={selectedDeepTask}
              onValueChange={setSelectedDeepTask}
              className="w-full"
            >
              {deepTasks.map((task) => (
                <Select.Option key={task.id} value={task.id}>
                  {task.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </Modal>
  );
} 