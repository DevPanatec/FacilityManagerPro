import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // 1. Obtener datos de organizaciones
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*');

    if (orgError) throw orgError;

    // 2. Obtener datos de personal
    const { data: personnel, error: persError } = await supabase
      .from('personnel')
      .select('*');

    if (persError) throw persError;

    // 3. Obtener datos de áreas
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('*');

    if (areasError) throw areasError;

    // 4. Obtener datos de tareas
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (tasksError) throw tasksError;

    // Procesar y estructurar todos los datos
    const dashboardData = {
      timestamp: new Date().toISOString(),
      resumen: {
        organizaciones: {
          total: organizations.length,
          activas: organizations.filter(org => org.estado === 'Activo').length,
          inactivas: organizations.filter(org => org.estado === 'Inactivo').length
        },
        personal: {
          total: personnel.length,
          activos: personnel.filter(p => p.estado === 'Activo').length,
          por_turno: {
            mañana: personnel.filter(p => p.turno === 'Mañana').length,
            tarde: personnel.filter(p => p.turno === 'Tarde').length,
            noche: personnel.filter(p => p.turno === 'Noche').length
          }
        },
        areas: {
          total: areas.length,
          distribucion: areas.map(area => ({
            nombre: area.nombre,
            personal: personnel.filter(p => p.area === area.nombre).length,
            tareas: tasks.filter(t => t.area === area.nombre).length
          }))
        },
        tareas: {
          total: tasks.length,
          completadas: tasks.filter(t => t.estado === 'completada').length,
          en_progreso: tasks.filter(t => t.estado === 'en_progreso').length,
          pendientes: tasks.filter(t => t.estado === 'pendiente').length
        }
      },
      detalle: {
        organizaciones: organizations.map(org => ({
          id: org.id,
          nombre: org.name,
          tipo: org.type,
          estado: org.estado,
          metricas: {
            personal: org.personal || 0,
            areas: org.areas || 0,
            servicios: org.servicios || 0
          }
        })),
        personal: personnel.map(p => ({
          nombre: p.nombre,
          area: p.area,
          turno: p.turno,
          rol: p.rol,
          estado: p.estado
        })),
        areas: areas.map(area => {
          const areaTasks = tasks.filter(t => t.area === area.nombre);
          return {
            nombre: area.nombre,
            personal_asignado: personnel.filter(p => p.area === area.nombre).length,
            tareas: areaTasks.map(t => ({
              descripcion: t.descripcion,
              estado: t.estado,
              asignado: t.asignado,
              prioridad: t.prioridad
            }))
          };
        })
      }
    };

    // Formatear respuesta según el formato solicitado
    switch (format) {
      case 'json':
        return NextResponse.json(dashboardData);
      
      case 'excel':
        const wb = XLSX.utils.book_new();
        
        // Hoja de Resumen
        const resumenSheet = XLSX.utils.json_to_sheet([dashboardData.resumen]);
        XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');
        
        // Hoja de Organizaciones
        const orgsSheet = XLSX.utils.json_to_sheet(dashboardData.detalle.organizaciones);
        XLSX.utils.book_append_sheet(wb, orgsSheet, 'Organizaciones');
        
        // Hoja de Personal
        const persSheet = XLSX.utils.json_to_sheet(dashboardData.detalle.personal);
        XLSX.utils.book_append_sheet(wb, persSheet, 'Personal');
        
        // Hoja de Áreas
        const areasSheet = XLSX.utils.json_to_sheet(dashboardData.detalle.areas);
        XLSX.utils.book_append_sheet(wb, areasSheet, 'Areas');

        // Generar el archivo Excel como un buffer
        const excelBuffer = XLSX.write(wb, { 
          bookType: 'xlsx', 
          type: 'buffer'
        });

        return new NextResponse(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=dashboard_report.xlsx'
          }
        });
      
      case 'csv':
        const csv = convertToCSV(dashboardData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=dashboard_report.csv'
          }
        });
      
      default:
        return NextResponse.json(dashboardData);
    }

  } catch (error) {
    console.error('Error generating dashboard report:', error);
    return NextResponse.json(
      { error: 'Error generating report', details: error.message },
      { status: 500 }
    );
  }
}

function convertToCSV(data) {
  // Convertir solo los datos más importantes a CSV
  const header = [
    'nombre',
    'tipo',
    'estado',
    'area',
    'personal',
    'tareas_total',
    'tareas_completadas'
  ].join(',');
  
  const rows = data.detalle.areas.map(area => [
    area.nombre,
    'area',
    'activo',
    '-',
    area.personal_asignado,
    area.tareas.length,
    area.tareas.filter(t => t.estado === 'completada').length
  ].join(','));
  
  return [header, ...rows].join('\n');
} 