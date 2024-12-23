import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase';

export async function GET(request) {
  try {
    const supabase = createServerComponentClient();
    const searchParams = new URL(request.url).searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    let query = supabase
      .from('reportes')
      .select('*', { count: 'exact' });

    if (startDate && endDate) {
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    const { data: reports, count, error } = await query
      .order('fecha', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReports: count
    });
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = createServerComponentClient();
    const data = await request.json();

    const { error, data: newReport } = await supabase
      .from('reportes')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newReport);
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 