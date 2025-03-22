import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { taskService } from '@/services/taskService';

const ScheduleApp: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Fetch tasks for the calendar
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user profile
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error(userError.message);
        if (!userData.user) throw new Error('No user found');

        // Get organization info
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', userData.user.id)
          .single();

        if (profileError) throw new Error(profileError.message);
        setUserProfile(profile);

        // Get all tasks from the centralized service
        console.log('Obteniendo tareas desde servicio centralizado (Sección CALENDARIO)');
        const allTasks = await taskService.getAllTasks(profile.organization_id);
        
        // Filter only calendar type tasks
        const calendarTasks = allTasks.filter(task => task.type === 'calendar_task');
        console.log(`Mostrando ${calendarTasks.length} tareas de calendario de ${allTasks.length} totales`);
        
        setTasks(calendarTasks);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching calendar tasks:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTasks();

    // Set up real-time subscription for tasks table
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, async (payload) => {
        console.log('Cambio en tabla tasks detectado:', payload);
        // Refresh tasks when any change occurs
        try {
          if (userProfile?.organization_id) {
            console.log('Actualizando tareas desde servicio centralizado tras cambio en tiempo real');
            const newTasks = await taskService.getAllTasks(userProfile.organization_id);
            const calendarTasks = newTasks.filter(task => task.type === 'calendar_task');
            setTasks(calendarTasks);
          }
        } catch (error: any) {
          console.error('Error refreshing tasks after real-time update:', error);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userProfile?.organization_id]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default ScheduleApp; 