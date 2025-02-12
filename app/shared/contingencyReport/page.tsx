'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { FiUpload, FiX, FiAlertCircle, FiCheckCircle, FiClock, FiPieChart, FiList, FiFilter } from 'react-icons/fi';
import { generateContingencyPDF } from './ContingencyPDF';

interface ContingencyFile {
  id: string;
  report_id: string;
  name: string;
  url: string;
  type: 'image' | 'documento';
  created_at: string;
}

interface ContingencyReport {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: 'Pendiente' | 'Completada';
  type: string;
  area: string;
  sala?: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    estimated_hours: number;
  }>;
  attachments: Array<{
    type: 'image' | 'documento';
    url: string;
    created_at: string;
  }>;
  creator: string;
  organization: {
    id: string;
    name: string;
  };
}

interface FileWithPreview extends File {
  preview: string;
}

// Interfaz para los datos que vienen de Supabase
interface SupabaseReport {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
  priority: string;
  area_id: string;
  subarea_id: string | null;  // Added subarea_id field
  organization_id: string;
  created_by: string;
  attachments: Array<{
    type: 'image' | 'documento';
    url: string;
    created_at: string;
  }>;
  creator: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  area: {
    id: string;
    name: string;
    subareas: {
      id: string;
      nombre: string;
      descripcion: string | null;
      area_id: string;
      sala: {
        id: string;
        nombre: string;
      } | null;
    }[] | null;
  };
  subarea?: {
    id: string;
    nombre: string;
    descripcion: string | null;
  };
}

interface ReportData {
  title: string;
  type: 'contingencia';
  area: string;
  sala: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  description: string | null;
  actividades: string[];
  imagenes: {
    inicial?: string;
    durante?: string;
    final?: string;
  };
}

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState('dia');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [selectedSubarea, setSelectedSubarea] = useState<string | null>(null);
  const [subareas, setSubareas] = useState<Array<{id: string; nombre: string; descripcion: string | null}>>([]);
  const [contingencyType, setContingencyType] = useState('');
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContingencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ role: string; organization_id: string | null } | null>(null);

  // Estado para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estado para reportes y tipos de contingencia
  const [reportes, setReportes] = useState<ContingencyReport[]>([]);
  const [contingencyTypes, setContingencyTypes] = useState<Array<{id: string; name: string; description: string | null}>>([]);
  const [stats, setStats] = useState({ pendientes: 0, resueltos: 0, total: 0 });

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const supabase = createClientComponentClient();

  // Cargar tipos de contingencia
  const loadContingencyTypes = async () => {
    try {
      if (!userData?.organization_id) {
        console.log('No hay organization_id disponible');
        return;
      }

      console.log('Cargando tipos de contingencia para organización:', userData.organization_id);

      // Cargar todos los tipos activos
      const { data: types, error } = await supabase
        .from('contingency_types')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error al cargar tipos de contingencia:', error);
        return;
      }

      console.log('Tipos de contingencia cargados:', types);
      setContingencyTypes(types || []);
    } catch (error) {
      console.error('Error al cargar tipos de contingencia:', error);
    }
  };

  // Efecto para cargar tipos de contingencia cuando cambie userData
  useEffect(() => {
    if (userData?.organization_id) {
      console.log('userData cambió, cargando tipos de contingencia con organization_id:', userData.organization_id);
      loadContingencyTypes();
    }
  }, [userData?.organization_id]);

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        console.log('Usuario autenticado:', user);

        const { data: userData, error: orgError } = await supabase
          .from('users')
          .select(`
            role, 
            organization_id,
            organization:organizations(
              id,
              name,
              status
            )
          `)
          .eq('id', user?.id)
          .single();

        if (orgError) {
          console.error('Error al cargar datos de organización:', orgError);
          throw orgError;
        }

        console.log('Datos completos de usuario y organización:', userData);
        setUserData(userData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar datos del usuario');
      }
    };

    loadUserData();
  }, []);

  // Cargar datos de reportes cuando cambie el filtro o la página
  useEffect(() => {
    if (userData) {
      loadData();
    }
  }, [timeFilter, page, userData]);

  const loadData = async () => {
    if (!userData) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get current date in local timezone
      const now = new Date();
      const startDate = new Date(now);

      // Set the start date based on filter
      if (timeFilter === 'dia') {
        // Set to start of current day in local timezone
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'semana') {
        // Set to 7 days ago from current time
        startDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'mes') {
        // Set to 1 month ago from current time
        startDate.setMonth(now.getMonth() - 1);
      }

      // Ensure end date is set to end of current day
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      console.log('Filtro de fechas:', {
        filtro: timeFilter,
        fechaInicio: startDate.toISOString(),
        fechaFin: endDate.toISOString()
      });

      // Cargar reportes
      let reportsQuery = supabase
        .from('contingencies')
        .select(`
          *,
          creator:user_profiles!created_by(id, first_name, last_name),
          assignee:user_profiles!assigned_to(id, first_name, last_name),
          area:areas!inner(
            id, 
            name,
            sala:salas(
              id,
              nombre,
              descripcion
            ),
            subareas!left(
              id,
              nombre,
              descripcion,
              area_id
            ),
            tasks(
              id,
              title,
              description,
              status,
              priority,
              estimated_hours,
              created_at,
              updated_at
            )
          ),
          organization:organizations!organization_id(
            id,
            name,
            status
          ),
          type:contingency_types(
            id,
            name,
            description
          )
        `)
        .eq('organization_id', userData.organization_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: reports, error: reportsError } = await reportsQuery;

      if (reportsError) {
        console.error('Error en la consulta de reportes:', reportsError);
        throw reportsError;
      }

      if (!reports) {
        console.log('No se encontraron reportes');
        setReportes([]);
        setTotalPages(0);
        setStats({ pendientes: 0, resueltos: 0, total: 0 });
        return;
      }

      console.log('Resultado de la consulta:', {
        reportesEncontrados: reports.length,
        fechaInicio: startDate,
        fechaFin: endDate,
        organizacionId: userData.organization_id
      });

      // Mapear los reportes con la información
      const reportsWithOrgs = reports.map((report: any) => {
        const sala = report.area?.sala;
        const tasks = report.area?.tasks || [];
        
        console.log('Datos del reporte:', {
          id: report.id,
          area: report.area?.name,
          sala: sala?.nombre,
          tipo: report.type?.name,
          tasks: tasks.length
        });
        
        return {
          id: report.id,
          title: report.type?.name || report.title,
          description: report.description,
          date: report.created_at,
          status: report.status === 'completed' ? 'Completada' as const : 'Pendiente' as const,
          type: report.type?.name || 'No especificado',
          area: report.area?.name || 'No especificada',
          sala: sala?.nombre || 'No especificada',
          tasks: tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            estimated_hours: task.estimated_hours
          })),
          attachments: report.attachments || [],
          creator: report.creator ? `${report.creator.first_name || ''} ${report.creator.last_name || ''}`.trim() || 'Usuario' : 'Usuario',
          organization: {
            id: report.organization?.id,
            name: report.organization?.name || 'Hospital San Miguel Arcángel'
          }
        };
      });

      setReportes(reportsWithOrgs);
      setTotalPages(Math.ceil(reportsWithOrgs.length / 10));

      // Calcular estadísticas
      const pendientes = reportsWithOrgs.filter(r => r.status === 'Pendiente').length;
      const resueltos = reportsWithOrgs.filter(r => r.status === 'Completada').length;
      setStats({
        pendientes,
        resueltos,
        total: pendientes + resueltos
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error instanceof Error ? error.message : 
        typeof error === 'object' && error !== null ? JSON.stringify(error, null, 2) : 
        'Error desconocido al cargar los datos');
      toast.error('Error al cargar los datos. Revisa la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prev => [...prev, ...acceptedFiles]);
    
    // Crear URLs para preview
    const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newUrls]);
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => {
      // Revocar la URL del objeto para liberar memoria
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  // Función para cargar subáreas cuando se selecciona un área
  const loadSubareas = async (areaId: string) => {
    try {
      console.log('Cargando subáreas para área:', areaId);

      const { data: areaData, error } = await supabase
        .from('subareas')
        .select(`
          id,
          nombre,
          descripcion,
          area:areas(id, name)
        `)
        .eq('area_id', areaId)
        .order('nombre');

      if (error) {
        console.error('Error al cargar subáreas:', error);
        throw error;
      }

      console.log('Subáreas cargadas:', areaData);

      if (areaData && areaData.length > 0) {
        setSubareas(areaData);
      } else {
        console.log('No se encontraron subáreas para el área:', areaId);
        setSubareas([]);
      }
    } catch (error) {
      console.error('Error al cargar subáreas:', error);
      toast.error('Error al cargar las subáreas');
    }
  };

  // Actualizar el useEffect para cargar subáreas cuando cambia el área
  useEffect(() => {
    if (selectedArea) {
      console.log('Área seleccionada cambió a:', selectedArea);
      loadSubareas(selectedArea);
    } else {
      console.log('No hay área seleccionada, limpiando subáreas');
      setSubareas([]);
      setSelectedSubarea(null);
    }
  }, [selectedArea]);

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userData?.organization_id) {
        throw new Error('Usuario no tiene organización asignada');
      }

      if (!selectedArea) {
        toast.error('Por favor seleccione un área');
        return;
      }

      // Verificar autenticación
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Error de autenticación:', sessionError);
        throw new Error('No se pudo verificar la sesión del usuario');
      }

      console.log('Sesión verificada:', {
        userId: session.user.id,
        role: session.user.role,
        token: session.access_token.substring(0, 20) + '...'
      });

      // Primero subimos las imágenes si hay alguna
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        try {
          console.log('Iniciando subida de imágenes:', {
            cantidadImagenes: images.length,
            organizacionId: userData.organization_id,
            accessToken: session.access_token.substring(0, 20) + '...'
          });

          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            try {
              const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${image.name.split('.').pop()}`;
              const filePath = `${userData.organization_id}/${fileName}`;

              console.log(`Procesando archivo ${i + 1}/${images.length}:`, {
                nombre: image.name,
                tipo: image.type,
                tamaño: `${(image.size / 1024 / 1024).toFixed(2)}MB`,
                ruta: filePath
              });

              // Obtener el token de la sesión actual
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              if (sessionError || !session) {
                throw new Error('No hay sesión activa');
              }

              // Configurar cliente de storage con token de autenticación
              const { data: storageData, error: uploadError } = await supabase.storage
                .from('Reports')
                .upload(filePath, image, {
                  cacheControl: '3600',
                  upsert: true,
                  contentType: image.type,
                  duplex: 'half'
                });

              if (uploadError) {
                console.error('Error detallado de subida:', {
                  mensaje: uploadError.message,
                  error: uploadError,
                  contexto: {
                    archivo: image.name,
                    ruta: filePath,
                    organizacionId: userData.organization_id,
                    token: session.access_token.substring(0, 20) + '...'
                  }
                });
                throw new Error(`Error al subir archivo ${i + 1}: ${uploadError.message}`);
              }

              if (!storageData?.path) {
                throw new Error('No se recibió la ruta del archivo subido');
              }

              // Obtener la URL pública
              const { data: urlData } = supabase.storage
                .from('Reports')
                .getPublicUrl(storageData.path);

              if (!urlData?.publicUrl) {
                throw new Error(`No se pudo obtener la URL pública para el archivo ${i + 1}`);
              }

              uploadedUrls.push(urlData.publicUrl);
              console.log(`Archivo ${i + 1} subido exitosamente:`, {
                url: urlData.publicUrl,
                ruta: storageData.path
              });
            } catch (imageError) {
              console.error(`Error al procesar archivo ${i + 1}:`, {
                error: imageError instanceof Error ? imageError.message : 'Error desconocido',
                archivo: {
                  nombre: image.name,
                  tipo: image.type,
                  tamaño: image.size
                }
              });
              throw imageError;
            }
          }
        } catch (error) {
          console.error('Error al procesar archivos:', {
            mensaje: error instanceof Error ? error.message : 'Error desconocido',
            tipo: typeof error,
            detalles: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      }

      // Crear el nuevo reporte
      try {
        const selectedType = contingencyTypes.find(type => type.id === contingencyType);
        if (!selectedType) {
          throw new Error('Tipo de contingencia no válido');
        }

        // Crear el reporte
        const newReport = {
          title: selectedType.name,
          description: JSON.stringify({
            details: {
            area: selectedArea,
            sala: selectedSala,
            fecha: new Date().toLocaleDateString(),
            horaInicio: new Date().toLocaleTimeString(),
            horaFin: new Date().toLocaleTimeString(),
            actividades: orderedTaskDescriptions,
            imagenes: uploadedUrls.reduce((acc, url, index) => {
              if (index === 0) acc.inicial = url;
              else if (index === 1) acc.durante = url;
              else if (index === 2) acc.final = url;
              return acc;
            }, {} as { inicial?: string; durante?: string; final?: string })
            },
            images: uploadedUrls
          }),
          status: 'pending',
          priority: 'medium',
          area_id: selectedArea,
          organization_id: userData.organization_id,
          created_by: session.user.id,
          assigned_to: session.user.id,
          type_id: selectedType.id
        };

        console.log('Guardando reporte con datos:', newReport);

        // Insertar el reporte
        const { data: reportData, error: insertError } = await supabase
          .from('contingencies')
          .insert([newReport])
          .select()
          .single();

        if (insertError) {
          console.error('Error detallado al insertar reporte:', insertError);
          throw insertError;
        }

        if (!reportData) {
          throw new Error('No se recibieron datos del reporte creado');
        }

        console.log('Reporte creado exitosamente:', reportData);

        // Crear la asignación relacionada
        const newAssignment = {
          organization_id: userData.organization_id,
          user_id: session.user.id,
          area_id: selectedArea,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          status: 'pending'
        };

        console.log('Guardando asignación con datos:', newAssignment);

        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert([newAssignment])
          .select();

        if (assignmentError) {
          console.error('Error detallado al crear la asignación:', assignmentError);
          throw new Error('Error al crear la asignación relacionada');
        }

        // Actualizar la lista de reportes
        await loadData();
        
        // Limpiar el formulario
        setContingencyType('');
        setSelectedSala(null);
        setSelectedArea('');
        setSelectedSubarea(null);
        setDescription('');
        setImages([]);
        setImageUrls([]);
        setShowModal(false);

        toast.success('Reporte y asignación creados exitosamente');
      } catch (error: any) {
        console.error('Error detallado al guardar el reporte:', error);
        toast.error(error?.message || 'Error al guardar el reporte');
      }
    } catch (error: any) {
      console.error('Error detallado al guardar el reporte:', error);
      toast.error(error?.message || 'Error al guardar el reporte');
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contingencies')
        .update({ status: newStatus === 'Completada' ? 'completed' : 'pending' })
        .eq('id', reportId);

      if (error) throw error;

      await loadData();
      toast.success('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const orderedTaskDescriptions: string[] = [];

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;

    try {
      // Parsear la descripción JSON
      let reportDetails;
      try {
        reportDetails = JSON.parse(selectedReport.description || '{}');
      } catch (error) {
        console.error('Error al parsear la descripción:', error);
        reportDetails = {};
      }

      const reportData = {
        title: selectedReport.title,
        type: 'contingencia' as const,
        area: selectedReport.area,
        sala: selectedReport.sala || '',
        fecha: new Date(selectedReport.date).toLocaleDateString(),
        horaInicio: reportDetails.horaInicio,
        horaFin: reportDetails.horaFin,
        description: selectedReport.description,
        actividades: reportDetails.actividades || [],
        imagenes: reportDetails.imagenes || {},
        tasks: selectedReport.tasks || [] // Incluir las tareas
      };

      const success = await generateContingencyPDF(reportData);
      if (success) {
        toast.success('PDF generado exitosamente');
      } else {
        toast.error('Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const renderReportModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto m-4 shadow-xl">
          {/* Header con gradiente */}
          <div className="flex justify-between items-start mb-6 -mx-6 -mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">
                Detalles del Reporte
              </h3>
              <p className="text-sm text-blue-100 mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(selectedReport.date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/70 hover:text-white transition-all duration-300 p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del reporte */}
          <div className="space-y-6">
            {selectedReport.description ? (
              (() => {
                try {
                  const data = JSON.parse(selectedReport.description);
                  const details = data.details || {};
                  
                  return (
                    <>
                      {/* Información básica */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Organización
                          </p>
                          <p className="font-medium text-gray-900">{selectedReport.organization.name || 'No especificada'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Sala
                          </p>
                          <p className="font-medium text-gray-900">{selectedReport.sala || 'No especificada'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Área
                          </p>
                          <p className="font-medium text-gray-900">{selectedReport.area || 'No especificada'}</p>
                        </div>
                        <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Fecha
                          </p>
                          <p className="font-medium text-gray-900">{new Date(selectedReport.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Tipo de Contingencia */}
                      {details.type && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Tipo de Contingencia
                          </h4>
                          <p className="text-gray-700">{details.type}</p>
                        </div>
                      )}

                      {/* Tareas */}
                      {selectedReport.tasks && selectedReport.tasks.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Tareas del Área
                          </h4>
                          <div className="space-y-2">
                            {selectedReport.tasks.map((task, index) => (
                              <div key={task.id} className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                  task.status === 'completed' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  {task.description && (
                                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      task.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {task.status === 'completed' ? 'Completada' : 'Pendiente'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Prioridad: {task.priority}
                                    </span>
                                    {task.estimated_hours && (
                                      <span className="text-xs text-gray-500">
                                        Tiempo estimado: {task.estimated_hours}h
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Imágenes */}
                      {details.imagenes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Evidencia Fotográfica</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {details.imagenes.inicial && (
                              <div className="space-y-1">
                                <div className="aspect-video rounded-lg overflow-hidden shadow-sm">
                                  <img 
                                    src={details.imagenes.inicial} 
                                    alt="Imagen inicial" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm text-center text-gray-500">Antes</p>
                              </div>
                            )}
                            {details.imagenes.durante && (
                              <div className="space-y-1">
                                <div className="aspect-video rounded-lg overflow-hidden shadow-sm">
                                  <img 
                                    src={details.imagenes.durante} 
                                    alt="Imagen durante" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm text-center text-gray-500">Durante</p>
                              </div>
                            )}
                            {details.imagenes.final && (
                              <div className="space-y-1">
                                <div className="aspect-video rounded-lg overflow-hidden shadow-sm">
                                  <img 
                                    src={details.imagenes.final} 
                                    alt="Imagen final" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm text-center text-gray-500">Después</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                } catch (error) {
                  console.error('Error al formatear el reporte:', error);
                  return <p className="text-red-500">Error al cargar el contenido del reporte</p>;
                }
              })()
            ) : (
              <div className="text-gray-500">No hay descripción disponible</div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cerrar
            </button>
            {selectedReport.status === 'Pendiente' ? (
              <button
                onClick={() => {
                  handleUpdateStatus(selectedReport.id, 'Completada');
                  setShowModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Marcar como resuelto</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  handleUpdateStatus(selectedReport.id, 'Pendiente');
                  setShowModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reabrir reporte</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReportList = () => {
    if (isLoading) {
      return <div className="p-4 text-center">Cargando...</div>;
    }

    if (error) {
      return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }

    if (!reportes.length) {
      return <div className="p-4 text-center">No hay reportes para mostrar</div>;
    }

    return (
      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-4 gap-2 p-3 text-xs font-medium text-gray-500 bg-gray-50">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            FECHA
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            SALA
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ÁREA
          </div>
          <div className="text-center">ACCIONES</div>
        </div>
        {reportes.map((report) => (
          <div
            key={report.id}
            className="grid grid-cols-4 gap-2 p-2 text-sm hover:bg-gray-50 items-center"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                report.status === 'Pendiente' ? 'bg-yellow-400' : 'bg-green-400'
              }`} />
              <span className="text-gray-600">{new Date(report.date).toLocaleDateString()}</span>
            </div>
            <div className="truncate text-gray-600" title={report.sala}>
              {report.sala || 'No especificada'}
            </div>
            <div className="truncate text-gray-600" title={report.area}>
              {report.area}
            </div>
            <div className="flex justify-center gap-4">
              {/* Icono de ojo para ver detalles */}
              <button
                onClick={() => {
                  setSelectedReport(report);
                  setShowModal(true);
                }}
                className="text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              {/* Icono de check para marcar como completado */}
              <button
                onClick={() => handleUpdateStatus(report.id, report.status === 'Pendiente' ? 'Completada' : 'Pendiente')}
                className={`${
                  report.status === 'Pendiente' 
                    ? 'text-gray-400 hover:text-green-500' 
                    : 'text-green-500 hover:text-green-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header mejorado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Reportes de Contingencia
            </h1>
            <p className="mt-2 text-gray-600">Sistema de gestión y seguimiento de incidentes</p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border-2 border-blue-100 rounded-xl px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <option value="dia">Reportes de Hoy</option>
              <option value="semana">Reportes de la Semana</option>
              <option value="mes">Reportes del Mes</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Reportes */}
          <div className="relative bg-white rounded-[2rem] shadow-sm p-6 overflow-hidden">
            <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-blue-500 rounded-r-full"></div>
            <div className="flex items-start">
              <div className="bg-blue-50 rounded-2xl p-3">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Reportes</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-blue-500 mt-1">Hoy</p>
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="relative bg-white rounded-[2rem] shadow-sm p-6 overflow-hidden">
            <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-yellow-500 rounded-r-full"></div>
            <div className="flex items-start">
              <div className="bg-yellow-50 rounded-2xl p-3">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Pendientes</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
                <p className="text-sm text-yellow-500 mt-1">Requieren atención</p>
              </div>
            </div>
          </div>

          {/* Resueltos */}
          <div className="relative bg-white rounded-[2rem] shadow-sm p-6 overflow-hidden">
            <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-green-500 rounded-r-full"></div>
            <div className="flex items-start">
              <div className="bg-green-50 rounded-2xl p-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Resueltos</h3>
                <p className="text-3xl font-bold text-green-600">{stats.resueltos}</p>
                <p className="text-sm text-green-500 mt-1">Completados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista de Reportes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
              </div>
            </div>
            {renderReportList()}
          </div>

          {/* Formulario de Nuevo Reporte */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Nuevo Reporte</h3>
              </div>
            </div>

            <form onSubmit={handleSaveReport} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Área */}
                <div className="col-span-2 md:col-span-1">
                  <SalaAreaSelector
                    onSalaChange={(sala) => {
                      setSelectedSala(sala?.id || null);
                      console.log('Sala seleccionada:', sala);
                    }}
                    onAreaChange={(area) => {
                      setSelectedArea(area?.id || '');
                      console.log('Área seleccionada:', area);
                    }}
                    className="space-y-2"
                  />
                </div>

                {/* Mostrar subáreas automáticamente */}
                {subareas.length > 0 && (
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subáreas del Área
                    </label>
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                      {subareas.map((subarea) => (
                        <div key={subarea.id} className="flex items-start space-x-2 p-2 bg-white rounded-lg shadow-sm">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{subarea.nombre}</p>
                            {subarea.descripcion && (
                              <p className="text-xs text-gray-500 mt-1">{subarea.descripcion}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tipo de Contingencia */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Contingencia
                  </label>
                  <select
                    value={contingencyType}
                    onChange={(e) => {
                      setContingencyType(e.target.value);
                      console.log('Tipo de contingencia seleccionado:', e.target.value);
                    }}
                    className="w-full h-10 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    required
                    disabled={!userData?.organization_id}
                  >
                    <option value="">Seleccionar tipo</option>
                    {contingencyTypes.length === 0 && (
                      <option value="" disabled>
                        {userData?.organization_id ? 'No hay tipos disponibles' : 'Cargando...'}
                      </option>
                    )}
                    {contingencyTypes.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                  {contingencyTypes.length === 0 && userData?.organization_id && (
                    <p className="mt-1 text-sm text-red-500">
                      No hay tipos de contingencia configurados para esta organización
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div className="col-span-2">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      console.log('Descripción actualizada:', e.target.value);
                    }}
                    placeholder="Descripción detallada de la contingencia..."
                    className="w-full h-32 rounded-lg border border-gray-200 text-sm focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Imágenes */}
                <div className="col-span-2">
                  <div
                    {...getRootProps()}
                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FiUpload className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500 mt-1">
                      {isDragActive ? 'Suelta aquí' : 'Arrastra o selecciona imágenes'}
                    </p>
                  </div>
                </div>

                {/* Preview de imágenes */}
                {imageUrls.length > 0 && (
                  <div className="col-span-2 grid grid-cols-4 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={url} className="relative group aspect-square">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón de envío */}
                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedArea || !contingencyType || !description}
                  >
                    Crear Reporte
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedReport && renderReportModal()}
    </div>
  );
}