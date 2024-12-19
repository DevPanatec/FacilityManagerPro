import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getInventoryItems() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting inventory items:', error);
    throw error;
  }
}

export async function addInventoryItem(name: string, quantity: number, minQuantity: number) {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .insert([
        { name, quantity, min_quantity: minQuantity }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(id: number, quantity: number) {
  try {
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
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
} 