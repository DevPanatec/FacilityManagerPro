import { createClient } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

const handleDatabaseError = (error: unknown): never => {
  const dbError = error as DatabaseError;
  console.error('Database operation failed:', {
    message: dbError.message,
    code: dbError.code,
    details: dbError.details,
    hint: dbError.hint
  });
  throw error;
};

export async function getInventoryItems() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function addInventoryItem(name: string, quantity: number, minQuantity: number) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .insert([
        { 
          name, 
          quantity, 
          min_quantity: minQuantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function updateInventoryItem(id: number, quantity: number) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleDatabaseError(error);
  }
} 
