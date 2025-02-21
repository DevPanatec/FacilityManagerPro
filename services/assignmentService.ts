export const createAssignment = async (assignmentData: Partial<Assignment>) => {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      ...assignmentData,
      deep_task_id: assignmentData.deep_task_id || null,
    })
    .select('*, deep_tasks(*)');

  if (error) throw error;
  return data;
}; 