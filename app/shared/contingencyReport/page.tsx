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
  sala?: string;
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
    sala: {
      id: string;
      nombre: string;
    } | null;
  };
}

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState('dia');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
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
        .from('tasks')
        .select(`
          id,
          title,
          description,
          created_at,
          status,
          priority,
          area_id,
          organization_id,
          created_by,
          attachments,
          creator:users!tasks_created_by_fkey (
            id,
            first_name,
            last_name
          ),
          area:areas!inner (
            id,
            name,
            sala:salas!areas_sala_id_fkey (
              id,
              nombre
            )
          )
        `, { count: 'exact' })
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

      const { data: reports, error: reportsError, count } = await reportsQuery;

      console.log('Resultado de la consulta:', {
        totalReportes: count,
        reportesEncontrados: reports?.length,
        fechaInicio: startDate,
        fechaFin: now,
        organizacionId: userData.organization_id
      });

      if (reportsError) throw reportsError;

      // Obtener todas las organizaciones (usuarios enterprise)
      const { data: organizations, error: orgsError } = await supabase
        .from('users')
        .select('id, organization_id, first_name, last_name')
        .eq('role', 'enterprise')
        .not('organization_id', 'is', null);

      if (orgsError) throw orgsError;

      // Crear un mapa de organizaciones para acceso más rápido
      const organizationsMap = new Map(
        organizations.map(org => [org.organization_id, {
          id: org.organization_id,
          name: `${org.first_name} ${org.last_name || ''}`.trim()
        }])
      );

      // Mapear los reportes con la información de la organización
      const reportsWithOrgs = (reports || []).map((report: any) => {
        const typedReport: SupabaseReport = {
          ...report,
          creator: report.creator || null,
          area: {
            ...report.area,
            sala: report.area?.sala || null
          }
        };

        return {
          id: typedReport.id,
          title: typedReport.title,
          description: typedReport.description,
          date: typedReport.created_at,
          status: typedReport.status === 'completed' ? 'Completada' : 'Pendiente',
          type: contingencyType || 'No especificado',
          area: typedReport.area?.name || 'No especificada',
          sala: typedReport.area?.sala?.nombre || 'No especificada',
          attachments: typedReport.attachments || [],
          creator: typedReport.creator,
          organization: organizationsMap.get(typedReport.organization_id) || {
            id: typedReport.organization_id,
            name: 'Organización Desconocida'
          }
        };
      }) as ContingencyReport[];

      setReportes(reportsWithOrgs);
      setTotalPages(Math.ceil((count || 0) / 10));

      // Calcular estadísticas
      const pendientes = reports?.filter(r => r.status !== 'completed').length || 0;
      const resueltos = reports?.filter(r => r.status === 'completed').length || 0;
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
    const newFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...newFiles]);
    
    // Crear URLs para preview
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
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
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('No se pudo obtener el usuario');

      // Primero subimos las imágenes si hay alguna
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop()?.toLowerCase();
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${userData.organization_id}/${fileName}`;

          const arrayBuffer = await image.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: image.type });

          const uploadResult = await supabase.storage
            .from('Reports')
            .upload(filePath, blob, {
              contentType: image.type,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadResult.error) {
            console.error('Error al subir imagen:', uploadResult.error);
            throw uploadResult.error;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('Reports')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }

      // Crear el nuevo reporte con todos los campos requeridos
      const newReport = {
        title: contingencyType,
        description: description,
        area_id: selectedArea,
        organization_id: userData.organization_id,
        created_by: user.id,
        status: 'pending',
        priority: 'urgent',
        attachments: uploadedUrls.map(url => ({
          type: 'image',
          url: url,
          created_at: new Date().toISOString()
        }))
      };

      console.log('Intentando crear reporte con datos:', newReport);

      // Insertar el reporte usando el cliente autenticado
      const { data, error } = await supabase
        .from('tasks')
        .insert([newReport])
        .select('*')
        .single();

      if (error) {
        console.error('Error específico de Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Reporte creado exitosamente:', data);

      // Actualizar la lista de reportes
      await loadData();
      
      // Limpiar el formulario
      setContingencyType('');
      setSelectedSala(null);
      setSelectedArea('');
      setDescription('');
      setImages([]);
      setImageUrls([]);

      toast.success('Reporte creado exitosamente');
    } catch (error: any) {
      console.error('Error detallado al guardar el reporte:', {
        message: error?.message || 'Error desconocido',
        details: error?.details || {},
        hint: error?.hint || '',
        code: error?.code || '',
        fullError: JSON.stringify(error, null, 2)
      });
      
      let errorMessage = 'Error al guardar el reporte';
      if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
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

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;

    try {
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        font-family: Arial, sans-serif;
        background-color: #FFFFFF;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      `;
      
      // Convertir las imágenes a base64
      const loadImage = async (url) => {
        try {
          console.log('Intentando cargar imagen:', url);
          const response = await fetch(url);
          if (!response.ok) {
            console.error('Error al cargar imagen:', url, response.status);
            return null;
          }
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              console.log('Imagen cargada exitosamente:', url);
              resolve(reader.result);
            };
            reader.onerror = () => {
              console.error('Error al leer imagen:', url);
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error al cargar imagen:', url, error);
          return null;
        }
      };

      // Cargar las imágenes
      console.log('Iniciando carga de imágenes...');
      const [sgsIsoLogo, hbLogo, issaLogo] = await Promise.all([
        loadImage('/sgs-iso.png'),
        loadImage('/logo.jpg'),
        loadImage('/issa.png')
      ]);

      console.log('Estado de carga de imágenes:', {
        sgsIso: !!sgsIsoLogo,
        hombresBlanco: !!hbLogo,
        issa: !!issaLogo
      });

      // Solo incluir las imágenes que se cargaron correctamente
      const logosHtml = [
        sgsIsoLogo ? `<img src="${sgsIsoLogo}" alt="SGS ISO 9001" style="height: 100px; width: 100px; object-fit: contain;" />` : '',
        issaLogo ? `<img src="${issaLogo}" alt="ISSA Member" style="height: 100px; width: 100px; object-fit: contain;" />` : ''
      ].filter(Boolean).join('');
      
      reportElement.innerHTML = `
        <div style="padding: 90px; font-family: Arial, sans-serif; background-color: #FFFFFF; border: 1px solid #E5E7EB;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
            <div style="display: flex; align-items: center; gap: 30px;">
              ${logosHtml}
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
              ${hbLogo ? `<img src="${hbLogo}" alt="Hombres de Blanco" style="height: 100px; width: 100px; object-fit: contain;" />` : ''}
              <p style="color: #1F2937; font-size: 26px; margin: 0; font-family: Arial, sans-serif;">
                Fecha: ${new Date(selectedReport.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 0 90px 40px 90px;">
            <h1 style="color: #1F2937; font-size: 36px; margin: 0; font-family: Arial, sans-serif; font-weight: bold;">REPORTE DE CONTINGENCIA</h1>
          </div>

          <div style="text-align: center; margin: 0 90px 40px 90px;">
            <h2 style="color: #1F2937; font-size: 32px; margin: 0; font-family: Arial, sans-serif; font-weight: bold;">${selectedReport.organization.name.replace(/\s*ENTERPRISE\s*/gi, '').trim()}</h2>
          </div>

          <div style="margin: 0 90px 40px 90px;">
            <h2 style="color: #1F2937; font-size: 28px; margin-bottom: 20px; font-family: Arial, sans-serif; font-weight: bold;">INFORMACIÓN GENERAL</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; width: 200px; font-family: Arial, sans-serif; font-size: 26px;"><strong>Organización:</strong></td>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;">${selectedReport.organization.name.replace(/\s*ENTERPRISE\s*/gi, '').trim()}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;"><strong>Área:</strong></td>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;">${selectedReport.area}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;"><strong>Sala:</strong></td>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;">${selectedReport.sala}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 0 90px 40px 90px;">
            <h2 style="color: #1F2937; font-size: 28px; margin-bottom: 20px; font-family: Arial, sans-serif; font-weight: bold;">DETALLES DE LA CONTINGENCIA</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;"><strong>Tipo:</strong></td>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;">${selectedReport.type}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;"><strong>Descripción:</strong></td>
                <td style="padding: 12px 0; font-family: Arial, sans-serif; font-size: 26px;">${selectedReport.description || 'No especificada'}</td>
              </tr>
            </table>
          </div>

          ${selectedReport.attachments && selectedReport.attachments.length > 0 ? `
            <div style="margin: 0 90px 40px 90px;">
              <h2 style="color: #1F2937; font-size: 28px; margin-bottom: 20px; font-family: Arial, sans-serif; font-weight: bold;">EVIDENCIA FOTOGRÁFICA</h2>
              <div style="display: flex; flex-direction: column; gap: 35px; align-items: center;">
                ${selectedReport.attachments
                  .filter(attachment => attachment.type === 'image')
                  .map(attachment => `
                    <div style="width: 100%; display: flex; justify-content: center;">
                      <img src="${attachment.url}" alt="Evidencia" style="max-width: 90%; height: auto; object-fit: contain;" />
                    </div>
                  `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(reportElement);

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.style) {
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
                el.style.backgroundColor = '#FFFFFF';
              }
              if (computedStyle.color && computedStyle.color.includes('oklch')) {
                el.style.color = '#000000';
              }
            }
          }
        }
      });

      document.body.removeChild(reportElement);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Contingencia_${selectedReport.id}.pdf`);

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
                  <p className="text-xs font-medium text-gray-500">Sala</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.sala || 'No especificada'}</p>
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
                  <p className="text-xs font-medium text-gray-500">Área</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.area}</p>
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
                  <p className="text-xs font-medium text-gray-500">Estado</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedReport.status === 'Pendiente' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
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
            <p className="text-sm text-gray-700 ml-7 whitespace-pre-wrap">{selectedReport.description}</p>
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
                    onSalaChange={(sala) => setSelectedSala(sala?.id || null)}
                    onAreaChange={(area) => setSelectedArea(area?.id || '')}
                    className="space-y-2"
                  />
                </div>

                {/* Tipo de Contingencia */}
                <div className="col-span-2 md:col-span-1">
                  <select
                    value={contingencyType}
                    onChange={(e) => setContingencyType(e.target.value)}
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
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del incidente"
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 text-sm focus:ring-blue-500"
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
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    <span>{isLoading ? 'Enviando...' : 'Crear Reporte'}</span>
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