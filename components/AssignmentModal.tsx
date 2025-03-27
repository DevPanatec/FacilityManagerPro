import { Switch, Select } from '@/components/ui';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Definir variantes de animación para el modal
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
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
                </motion.div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <motion.button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  onClick={() => handleSubmit({})}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Guardar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 