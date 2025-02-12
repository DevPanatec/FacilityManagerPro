'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { FiUpload, FiX, FiAlertCircle, FiCheckCircle, FiClock, FiPieChart, FiList, FiFilter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  subarea: string;
  sala?: string;
  subareas: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  start_time?: string;
  end_time?: string;
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
  area: string;
  sala: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
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
  const tiposContingencia = [
    'Falla de Equipo',
    'Accidente Laboral',
    'Problema de Infraestructura',
    'Falla Eléctrica',
    'Fuga o Derrame',
    'Problema de Seguridad',
    'Emergencia Médica',
    'Otro'
  ];
  const [stats, setStats] = useState({ pendientes: 0, resueltos: 0, total: 0 });

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const supabase = createClientComponentClient();

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data: userData, error: orgError } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', user?.id)
          .single();
        if (orgError) throw orgError;

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

      // Calcular rango de fechas según el filtro
      const now = new Date();
      let startDate = new Date();
      if (timeFilter === 'dia') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'semana') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'mes') {
        startDate.setMonth(now.getMonth() - 1);
      }

      console.log('Filtro de fechas:', {
        filtro: timeFilter,
        fechaInicio: startDate.toISOString(),
        fechaFin: now.toISOString()
      });

      // Cargar reportes
      let reportsQuery = supabase
        .from('contingencies')
        .select(`
          *,
          creator:user_profiles!created_by(id, first_name, last_name),
          assignee:user_profiles!assigned_to(id, first_name, last_name),
          area:areas!area_id(
            id, 
            name,
            sala_id,
            sala:salas(
              id,
              nombre,
              descripcion
            )
          ),
          subarea:subareas!subarea_id(
            id,
            nombre,
            descripcion
          ),
          organization:organizations!organization_id(id, name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: false });

      // Si no es superadmin, filtrar por organization_id
      if (userData.role !== 'superadmin') {
        if (!userData.organization_id) {
          throw new Error('Usuario no tiene organización asignada');
        }
        reportsQuery = reportsQuery.eq('organization_id', userData.organization_id);
      }

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
        fechaFin: now,
        organizacionId: userData.organization_id
      });

      // Mapear los reportes con la información
      const reportsWithOrgs = reports.map((report: any) => {
        const sala = report.area?.sala;
        
        return {
          id: report.id,
          title: report.title,
          description: report.description,
          date: report.created_at,
          status: report.status === 'completed' ? 'Completada' : 'Pendiente',
          type: report.type || 'No especificado',
          area: report.area?.name || 'No especificada',
          subarea: report.area?.name || 'No especificada',
          sala: sala?.nombre || 'No especificada',
          subareas: [
            { id: '1', name: 'CAMAS 1 A LA 7', description: null },
            { id: '2', name: 'BAÑO DE CUBICULO 1', description: null },
            { id: '3', name: 'ESTACION DE ENFERMERIA', description: null },
            { id: '4', name: 'CUARTO SEPTICO', description: null }
          ],
          attachments: report.attachments || [],
          creator: report.creator,
          organization: {
            id: report.organization?.id || report.organization_id,
            name: report.organization?.name || 'Organización Desconocida'
          }
        };
      }) as ContingencyReport[];

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
      const { data: areaData, error } = await supabase
        .from('areas')
        .select(`
          id,
          subareas (
            id,
            nombre
          )
        `)
        .eq('id', areaId)
        .single();

      if (error) throw error;

      if (areaData && areaData.subareas) {
        setSubareas(areaData.subareas);
      } else {
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
      loadSubareas(selectedArea);
    } else {
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
        const newReport = {
          title: contingencyType,
          description: JSON.stringify({
            area: selectedArea,
            subarea: selectedSubarea,
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
          }),
          area_id: selectedArea,
          subarea_id: selectedSubarea,  // Added subarea_id
          organization_id: userData.organization_id,
          created_by: session.user.id,
          status: 'pending',
          priority: 'medium',
          assigned_to: session.user.id
        };

        const { data, error: insertError } = await supabase
          .from('contingencies')
          .insert([newReport])
          .select('*')
          .single();

        if (insertError) throw insertError;

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
        setShowModal(false);  // Fixed: Changed setIsModalOpen to setShowModal

        toast.success('Reporte creado exitosamente');
      } catch (error: any) {
        console.error('Error al guardar el reporte:', error);
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

  const orderedTaskDescriptions: string[] = [
    "SE REALIZA HIGIENE DE MANOS Y SE COLOCA EL EQUIPO DE PROTECCION PERSONAL",
    "SE CLASIFICA EL AREA SEGUN EL TIPO DE LIMPIEZA PROFUNDA",
    "SE LIMPIA LA UNIDAD DEL PACIENTE CON WAYPALL EN METODO DE FRICCION Y ARRASTRE",
    "SE LIMPIA LAS SUPERFICIES HORIZONTALES DEBEMOS LIMPIARLOS CON UN PAÑO EMBEBIDO DE DESINFECTANTES COMO MESAS, MOBILIARIOS DE MEDICAMENTOS, ESTACION DE ENFERMERIA, DISPENSADORES DE PAPEL TOALLA E HIGIENICO",
    "SE ENJUAGA UNIDAD DE PACIENTE CON AGUA Y SE REALIZA METODO DE FRICCION CON WAYPALL",
    "SE SELLO EN PISO BARRIDO HUMEDO, LIMPIEZA Y DESINFECCION CON TECNICA ZIGZAG",
    "SE REALIZA DESINFECCION DE LA UNIDAD DEL PACIENTE CON VIRUGUAT Y WAYPALL METODO DE FRICCION",
    "SE LIMPIA PISOS CON METODO DE DOS BALDES, BARRIDO HUMEDO Y TRAPEADO ENJABONADO Y LUEGO ENJUAGAR",
    "AL ENTRAR AL AREA HOSPITALARIA REALIZAMOS LIMPIEZA INICIANDO POR EL TECHO, ELIMINANDO MANCHAS EN CIELO RASO",
    "SE LIMPIA PUERTAS Y PERILLAS CON ATOMIZADOR, WAYPALL Y SEPTIN",
    "SE REALIZA LIMPIEZA DE RODAPIES CON PAÑO Y DESINFECTANTE PANO DE MICROFIBRA",
    "SE LIMPIA CORTINAS DE BAÑO Y SI ESTA EN MAL ESTADO SE REPORTA AL ENCARGADO DEL SERVICIO SU PRONTO CAMBIO",
    "SE REALIZA LIMPIEZA DE VENTANAS FIJAS O PERSIANAS CON PAÑOS DE MICROFIBRA Y CRYSTAL MIX",
    "LA SOLUCION DESINFECTANTE SE DEBE PREPARAR EN EL MOMENTO DE USO Y DESCARTAR LUEGO DE 24 HORAS",
    "EN LAS AREAS DE AISLAMIENTO REALIZAMOS PROCEDIMIENTO CON EQUIPO EXCLUSIVO ADECUADO Y SE INICIA LA LIMPIEZA DE LIMPIO A LO SUCIO"
  ];

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;

    try {
      const iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('No se pudo crear el iframe');

      let reportData: ReportData = {
        title: selectedReport.title || 'Reporte de Contingencia',
        area: selectedReport.area || '',
        sala: selectedReport.sala || '',
        fecha: new Date(selectedReport.date).toLocaleDateString(),
        horaInicio: selectedReport.start_time || new Date().toLocaleTimeString(),
        horaFin: selectedReport.end_time || new Date().toLocaleTimeString(),
        actividades: orderedTaskDescriptions,
        imagenes: {}
      };

      if (selectedReport.description) {
        try {
          const parsedData = JSON.parse(selectedReport.description);
          reportData = { ...reportData, ...parsedData };
        } catch (e) {
          console.error('Error parsing description:', e);
        }
      }

      // Dividir las actividades en grupos de 5 para múltiples páginas
      const activitiesByPage = [];
      for (let i = 0; i < orderedTaskDescriptions.length; i += 5) {
        activitiesByPage.push(orderedTaskDescriptions.slice(i, i + 5));
      }

      // Escribir el contenido en el iframe con estilos mejorados
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
            <style>
              @page { 
                margin: 20mm;
                size: A4;
              }
              body { 
                margin: 0; 
                font-family: 'Poppins', Arial, sans-serif;
                color: #1a1a1a;
                line-height: 1.6;
              }
              .page { 
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                background: white;
                position: relative;
                page-break-after: always;
              }
              .page:last-child {
                page-break-after: avoid;
              }
              .logos { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 30px;
                width: 100%;
              }
              .logos img { 
                height: 60px; 
                width: auto; 
                object-fit: contain;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
              }
              .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin: 0;
                margin-bottom: 15px;
                letter-spacing: 1px;
                color: #1e40af;
                text-transform: uppercase;
              }
              .header p {
                font-size: 18px;
                margin: 5px 0;
                color: #4b5563;
              }
              .subheader {
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 30px;
                border: 1px solid #e2e8f0;
              }
              .subheader p {
                margin: 8px 0;
                font-size: 15px;
                color: #4b5563;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .subheader strong {
                color: #1e40af;
                min-width: 120px;
                display: inline-block;
              }
              .content {
                font-size: 14px;
                line-height: 1.8;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 20px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
                text-transform: uppercase;
              }
              .area-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
              }
              .area-info p {
                margin: 8px 0;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .area-info strong {
                color: #1e40af;
                min-width: 100px;
                display: inline-block;
              }
              .task-item {
                background: #f8fafc;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                display: flex;
                align-items: flex-start;
                gap: 15px;
              }
              .task-number {
                background: #2563eb;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                flex-shrink: 0;
              }
              .task-text {
                color: #4b5563;
                font-size: 14px;
                line-height: 1.6;
              }
              .evidence {
                margin-top: 40px;
              }
              .evidence-title {
                font-size: 20px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 25px;
                text-transform: uppercase;
              }
              .evidence-grid {
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                gap: 30px;
              }
              .evidence-item {
                text-align: center;
                page-break-inside: avoid;
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
              }
              .evidence-item img {
                width: 100%;
                max-height: 180mm;
                object-fit: contain;
                margin-bottom: 15px;
                border-radius: 8px;
              }
              .evidence-label {
                font-weight: 500;
                color: #1e40af;
                margin-top: 15px;
                font-size: 16px;
                text-transform: uppercase;
              }
              .page-number {
                position: absolute;
                bottom: 10mm;
                right: 10mm;
                font-size: 12px;
                color: #6b7280;
                padding: 5px 10px;
                background: #f8fafc;
                border-radius: 4px;
                border: 1px solid #e2e8f0;
              }
              .signatures {
                margin-top: 50px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 50px;
                page-break-inside: avoid;
              }
              .signature {
                text-align: center;
              }
              .signature-line {
                border-top: 2px solid #2563eb;
                margin-top: 50px;
                margin-bottom: 15px;
              }
              .signature-title {
                color: #1e40af;
                font-weight: 500;
                font-size: 14px;
              }
              .status-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                text-transform: uppercase;
              }
              .status-pending {
                background: #fef3c7;
                color: #92400e;
              }
              .status-completed {
                background: #d1fae5;
                color: #065f46;
              }
              .subareas-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 20px;
              }
              .subarea-item {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
              }
              .subarea-name {
                color: #1e40af;
                font-weight: 500;
                margin-bottom: 5px;
              }
              .subarea-description {
                color: #6b7280;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <!-- Primera página: Información general -->
            <div class="page">
              <div class="logos">
                <img src="/sgs-iso.png" alt="SGS Logo" />
                <img src="/logo.jpg" alt="Hombres de Blanco Logo" class="main-logo" />
                <img src="/issa.png" alt="ISSA Member Logo" />
              </div>
            
              <div class="header">
                <h1>Reporte de Contingencia</h1>
                <p>Hospital San Miguel Arcángel</p>
                <p>Departamento de Mantenimiento y Limpieza</p>
              </div>

              <div class="subheader">
                <p><strong>Fecha:</strong> ${reportData.fecha}</p>
                <p><strong>Hora Inicio:</strong> ${reportData.horaInicio}</p>
                <p><strong>Hora Fin:</strong> ${reportData.horaFin}</p>
                <p><strong>Tipo:</strong> ${reportData.title}</p>
                <p><strong>Estado:</strong> <span class="status-badge ${selectedReport.status === 'Pendiente' ? 'status-pending' : 'status-completed'}">${selectedReport.status}</span></p>
              </div>
            
              <div class="content">
                <div class="section">
                  <div class="section-title">Ubicación</div>
                  <div class="area-info">
                    <p><strong>Área:</strong> ${reportData.area}</p>
                    <p><strong>Sala:</strong> ${reportData.sala}</p>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">Subareas</div>
                  <div class="subareas-grid">
                    ${selectedReport.subareas.map(subarea => `
                      <div class="subarea-item">
                        <div class="subarea-name">${subarea.name}</div>
                        ${subarea.description ? `<div class="subarea-description">${subarea.description}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="page-number">Página 1</div>
            </div>

            <!-- Páginas de actividades -->
            ${activitiesByPage.map((pageActivities, pageIndex) => `
              <div class="page">
                <div class="section">
                  <div class="section-title">Actividades Realizadas</div>
                  ${pageActivities.map((task, index) => `
                    <div class="task-item">
                      <div class="task-number">${(pageIndex * 5) + index + 1}</div>
                      <div class="task-text">${task}</div>
                    </div>
                  `).join('')}
                </div>

                ${pageIndex === activitiesByPage.length - 1 ? `
                  <div class="signatures">
                    <div class="signature">
                      <div class="signature-line"></div>
                      <div class="signature-title">Firma del Supervisor</div>
                    </div>
                    <div class="signature">
                      <div class="signature-line"></div>
                      <div class="signature-title">Firma del Encargado</div>
                    </div>
                  </div>
                ` : ''}

                <div class="page-number">Página ${pageIndex + 2}</div>
              </div>
            `).join('')}

            <!-- Página de evidencias fotográficas -->
            ${(reportData.imagenes?.inicial || reportData.imagenes?.durante || reportData.imagenes?.final) ? `
              <div class="page">
                <div class="evidence">
                  <div class="section-title">Evidencia Fotográfica</div>
                  <div class="evidence-grid">
                    ${reportData.imagenes.inicial ? `
                      <div class="evidence-item">
                        <img src="${reportData.imagenes.inicial}" alt="Foto inicial" />
                        <div class="evidence-label">Antes</div>
                      </div>
                    ` : ''}
                    
                    ${reportData.imagenes.durante ? `
                      <div class="evidence-item">
                        <img src="${reportData.imagenes.durante}" alt="Foto durante" />
                        <div class="evidence-label">Durante</div>
                      </div>
                    ` : ''}
                    
                    ${reportData.imagenes.final ? `
                      <div class="evidence-item">
                        <img src="${reportData.imagenes.final}" alt="Foto final" />
                        <div class="evidence-label">Después</div>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="page-number">Página ${activitiesByPage.length + 2}</div>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Esperar a que las imágenes se carguen
      await Promise.all(
        Array.from(iframeDoc.images).map(
          img => new Promise((resolve) => {
            if (img.complete) resolve(null);
            else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          })
        )
      );

      // Generar el PDF
      const pages = Array.from(iframeDoc.querySelectorAll('.page')) as HTMLElement[];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: pages[i].offsetWidth,
          height: pages[i].offsetHeight,
          windowWidth: pages[i].offsetWidth,
          windowHeight: pages[i].offsetHeight,
          foreignObjectRendering: false,
          removeContainer: true,
          backgroundColor: null,
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          210,
          297
        );
      }

      pdf.save(`Reporte_${reportData.sala}_${reportData.fecha}.pdf`);
      
      // Limpiar
      document.body.removeChild(iframe);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const renderReportModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 shadow-2xl border border-blue-100">
          {/* Header con gradiente */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-blue-100">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Detalles del Reporte
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Creado el {new Date(selectedReport.date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Información principal en cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Organización</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.organization?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Área</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.area}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Subárea</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.subarea}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Sala</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.sala || 'No especificada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subareas */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="text-sm font-semibold text-gray-900">Subareas</h4>
            </div>
            <div className="ml-7 space-y-4">
              {selectedReport.subareas && selectedReport.subareas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.subareas.map((subarea) => (
                    <div key={subarea.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-900">{subarea.name}</p>
                      {subarea.description && (
                        <p className="text-sm text-gray-600 mt-1">{subarea.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay subareas definidas</p>
              )}
            </div>
          </div>

          {/* Tipo de Contingencia */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-sm font-semibold text-gray-900">Tipo de Contingencia</h4>
            </div>
            <p className="text-sm text-gray-700 ml-7">{selectedReport.type}</p>
          </div>

          {/* Descripción */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <h4 className="text-sm font-semibold text-gray-900">Descripción</h4>
            </div>
            {(() => {
              try {
                const data = JSON.parse(selectedReport.description || '{}');
                return (
                  <div className="ml-7 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Área</p>
                        <p className="text-sm font-medium">{data.area}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Subárea</p>
                        <p className="text-sm font-medium">{data.subarea || 'No especificada'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sala</p>
                        <p className="text-sm font-medium">{data.sala || 'No especificada'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha</p>
                        <p className="text-sm font-medium">{data.fecha}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Horario</p>
                        <p className="text-sm font-medium">{data.horaInicio} - {data.horaFin}</p>
                      </div>
                    </div>
                    {data.actividades && data.actividades.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Actividades realizadas</p>
                        <ul className="space-y-2">
                          {data.actividades.map((actividad: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{actividad}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              } catch (error) {
                return <p className="text-sm text-gray-700 ml-7 whitespace-pre-wrap">{selectedReport.description}</p>;
              }
            })()}
          </div>

          {/* Imágenes */}
          {selectedReport.attachments && selectedReport.attachments.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-900">Imágenes adjuntas</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedReport.attachments.map((attachment, index) => (
                  attachment.type === 'image' && (
                    <div key={index} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                      <Image
                        src={attachment.url}
                        alt={`Imagen ${index + 1}`}
                        fill
                        className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-0 left-0 right-0 p-4 text-white text-center"
                        >
                          <span className="text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                            Ver imagen
                          </span>
                        </a>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cerrar
            </button>
            {selectedReport.status === 'Pendiente' ? (
              <button
                onClick={() => {
                  handleUpdateStatus(selectedReport.id, 'Completada');
                  setShowModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center space-x-2"
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
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors flex items-center space-x-2"
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

  const formatReportContent = (content: string) => {
    try {
      const data = JSON.parse(content);
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{data.title}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Área:</p>
                <p className="font-medium">{data.area}</p>
              </div>
              <div>
                <p className="text-gray-600">Sala:</p>
                <p className="font-medium">{data.sala}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha:</p>
                <p className="font-medium">{data.fecha}</p>
              </div>
              <div>
                <p className="text-gray-600">Horario:</p>
                <p className="font-medium">{data.horaInicio} - {data.horaFin}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Tareas realizadas:</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {data.actividades.map((actividad: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 mb-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{actividad.substring(actividad.indexOf('. ') + 2)}</p>
                </div>
              ))}
            </div>
          </div>

          {(data.imagenes?.inicial || data.imagenes?.durante || data.imagenes?.final) && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Evidencia fotográfica:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.imagenes?.inicial && (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Antes</p>
                    <img 
                      src={data.imagenes.inicial} 
                      alt="Foto inicial" 
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  </div>
                )}
                {data.imagenes?.durante && (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Durante</p>
                    <img 
                      src={data.imagenes.durante} 
                      alt="Foto durante" 
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  </div>
                )}
                {data.imagenes?.final && (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Después</p>
                    <img 
                      src={data.imagenes.final} 
                      alt="Foto final" 
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error al formatear el reporte:', error);
      return <p className="text-red-500">Error al cargar el contenido del reporte</p>;
    }
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

                {/* Tipo de Contingencia */}
                <div className="col-span-2 md:col-span-1">
                  <select
                    value={contingencyType}
                    onChange={(e) => {
                      setContingencyType(e.target.value);
                      console.log('Tipo de contingencia seleccionado:', e.target.value);
                    }}
                    className="w-full rounded-lg border border-gray-200 text-sm focus:ring-blue-500"
                    required
                  >
                    <option value="">Tipo de Contingencia</option>
                    {tiposContingencia.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
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