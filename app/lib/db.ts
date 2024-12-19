import { sql } from '@vercel/postgres';

export async function createInventoryTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        min_stock INTEGER NOT NULL,
        location VARCHAR(255),
        image_url TEXT,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (error) {
    console.error('Error creating inventory table:', error);
    throw error;
  }
} 