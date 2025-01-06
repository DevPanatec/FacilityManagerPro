import { createClient } from '../utils/supabase/client';

export async function getInventoryItems() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    console.error('Error getting inventory items:', errorMessage);
    throw error;
  }
}

export async function addInventoryItem(name: string, quantity: number, minQuantity: number) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .insert([
        { name, quantity, min_quantity: minQuantity }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    console.error('Error adding inventory item:', errorMessage);
    throw error;
  }
}

export async function updateInventoryItem(id: number, quantity: number) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory')
      .update({ 
        quantity,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    console.error('Error updating inventory item:', errorMessage);
    throw error;
  }
} 