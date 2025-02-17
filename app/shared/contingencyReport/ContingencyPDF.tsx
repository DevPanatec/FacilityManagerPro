import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  title: string;
  type: 'contingencia' | 'tarea';
  area: string;
  sala?: string | null;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  description?: string | null;
  actividades: string[];
  imagenes: {
    inicial?: string;
    durante?: string;
    final?: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    estimated_hours: number;
  }>;
}

export const generateContingencyPDF = async (reportData: ReportData) => {
  try {
    // Función para cargar una imagen y convertirla a base64
    const loadImage = async (url: string): Promise<string> => {
      if (!url) return '';
      
      try {
        // Si la URL ya es base64, retornarla directamente
        if (url.startsWith('data:image')) {
          return url;
        }

        // Si es una URL de Supabase o una URL pública
        const response = await fetch(url);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            console.log('Imagen cargada exitosamente:', url.substring(0, 50));
            resolve(base64data);
          };
          reader.onerror = () => {
            console.error('Error al leer la imagen:', url.substring(0, 50));
            reject(new Error('Error al leer la imagen'));
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error al cargar la imagen:', url.substring(0, 50), error);
        return '';
      }
    };

    // Cargar logos
    let logoHSMA = '', logoMINSA = '', logoCSS = '';
    try {
      logoHSMA = await loadImage('/logo.jpg');
    } catch (error) {
      console.warn('No se pudo cargar el logo HSMA:', error);
      logoHSMA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    try {
      logoMINSA = await loadImage('/issa.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo MINSA:', error);
      logoMINSA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    try {
      logoCSS = await loadImage('/sgs-iso.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo CSS:', error);
      logoCSS = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    // Función para capitalizar la primera letra
    const capitalize = (str: string) => {
      if (!str) return '';
      return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    let parsedDescription = '';
    let tasks: any[] = [];
    let images: string[] = [];
    let imagenesReporte = {
      inicial: '',
      durante: '',
      final: ''
    };

    // Cargar las imágenes del reporte primero
    try {
      console.log('Cargando imágenes del reporte...');
      console.log('URLs de imágenes:', {
        inicial: reportData.imagenes.inicial,
        durante: reportData.imagenes.durante,
        final: reportData.imagenes.final
      });
      
      // Cargar las imágenes del reporte de forma paralela
      const [inicial, durante, final] = await Promise.all([
        reportData.imagenes.inicial ? loadImage(reportData.imagenes.inicial) : Promise.resolve(''),
        reportData.imagenes.durante ? loadImage(reportData.imagenes.durante) : Promise.resolve(''),
        reportData.imagenes.final ? loadImage(reportData.imagenes.final) : Promise.resolve('')
      ]);

      imagenesReporte = {
        inicial,
        durante,
        final
      };

      console.log('Estado de carga de imágenes:', {
        inicial: inicial ? 'Cargada' : 'No disponible',
        durante: durante ? 'Cargada' : 'No disponible',
        final: final ? 'Cargada' : 'No disponible'
      });
    } catch (error) {
      console.error('Error al cargar las imágenes del reporte:', error);
    }

    // Parsear la descripción si es un string JSON
    try {
      if (reportData.description) {
        const descData = JSON.parse(reportData.description);
        if (descData.details) {
          const details = [];
          
          // Tipo de contingencia
          if (descData.details.type) {
            details.push(`Tipo: ${capitalize(descData.details.type)}`);
          }

          // Actividades
          if (descData.details.actividades && descData.details.actividades.length > 0) {
            details.push('Actividades realizadas:');
            descData.details.actividades.forEach((act: string, index: number) => {
              details.push(`${index + 1}. ${capitalize(act)}`);
            });
          }

          parsedDescription = details.join('\n');
        }

        // Guardar las imágenes del JSON y cargarlas
        if (descData.images && Array.isArray(descData.images)) {
          // Cargar las imágenes del JSON
          const loadedImages = await Promise.all(
            descData.images.map(async (imageUrl: string) => {
              try {
                const base64Image = await loadImage(imageUrl);
                return base64Image;
              } catch (error) {
                console.error('Error al cargar imagen:', error);
                return '';
              }
            })
          );
          // Filtrar las imágenes que se cargaron correctamente
          images = loadedImages.filter(img => img !== '');
          console.log(`Se cargaron ${images.length} imágenes del JSON`);
        }
      }
    } catch (e) {
      console.log('La descripción no es un JSON válido, usando texto plano');
      parsedDescription = reportData.description || '';
    }

    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('No se pudo crear el iframe');

    // Escribir el contenido en el iframe
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { 
              margin: 10mm;
              size: A4 portrait;
            }
            body { 
              margin: 0;
              font-family: Arial, sans-serif;
              background: white;
              color: #333;
              font-size: 12pt;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page {
              padding: 5mm;
              background: white;
              width: 210mm;
              height: 297mm;
              position: relative;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 3mm;
              padding-bottom: 2mm;
              border-bottom: 1px solid #ccc;
            }
            .logo {
              height: 20mm;
              width: auto;
              object-fit: contain;
            }
            .title {
              text-align: center;
              font-size: 24pt;
              font-weight: bold;
              margin: 3mm 0;
              text-transform: uppercase;
            }
            .basic-info {
              margin-bottom: 4mm;
            }
            .info-row {
              margin-bottom: 1mm;
              display: flex;
              align-items: baseline;
            }
            .info-label {
              font-size: 12pt;
              color: #666;
              width: 40mm;
              font-weight: 500;
            }
            .info-value {
              font-size: 12pt;
              margin-left: 2mm;
            }
            .section-title {
              font-size: 16pt;
              font-weight: bold;
              margin: 4mm 0 2mm 0;
              color: #444;
              border-bottom: 0.5pt solid #ccc;
              padding-bottom: 1mm;
            }
            .activities-list {
              margin: 0;
              padding-left: 3mm;
              list-style-type: decimal;
            }
            .activity-item {
              font-size: 12pt;
              margin-bottom: 1mm;
            }
            .images-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10mm;
              margin-top: 5mm;
              width: 100%;
            }
            .image-container {
              text-align: center;
              width: 100%;
            }
            .report-image {
              width: 100%;
              height: 60mm;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 4mm;
            }
            .image-caption {
              font-size: 10pt;
              color: #666;
              margin-top: 2mm;
              text-align: center;
            }
            .description-text {
              font-size: 12pt;
              margin-bottom: 3mm;
              white-space: pre-wrap;
            }
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <img src="${logoCSS}" alt="Logo CSS" class="logo" />
              <img src="${logoHSMA}" alt="Logo HSMA" class="logo" />
              <img src="${logoMINSA}" alt="Logo MINSA" class="logo" />
            </div>

            <div class="title">
              REPORTE DE ${reportData.type === 'contingencia' ? 'CONTINGENCIA' : 'TAREA'}
            </div>

            <div class="basic-info">
              <div class="info-row">
                <div class="info-label">Área:</div>
                <div class="info-value">${capitalize(reportData.area)}</div>
              </div>
              ${reportData.sala ? `
              <div class="info-row">
                <div class="info-label">Sala:</div>
                <div class="info-value">${capitalize(reportData.sala)}</div>
              </div>
              ` : ''}
              <div class="info-row">
                <div class="info-label">Fecha:</div>
                <div class="info-value">${reportData.fecha}</div>
              </div>
              ${reportData.horaInicio ? `
              <div class="info-row">
                <div class="info-label">Hora Inicio:</div>
                <div class="info-value">${reportData.horaInicio}</div>
              </div>
              ` : ''}
              ${reportData.horaFin ? `
              <div class="info-row">
                <div class="info-label">Hora Fin:</div>
                <div class="info-value">${reportData.horaFin}</div>
              </div>
              ` : ''}
            </div>

            ${parsedDescription ? `
            <div class="section-title">Descripción</div>
            <div class="description-text">${parsedDescription}</div>
            ` : ''}

            ${reportData.tasks && reportData.tasks.length > 0 ? `
            <div class="section-title">Tareas Asignadas</div>
            <div class="tasks-list">
              ${reportData.tasks.map((task, index) => `
                <div class="task-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                  <div style="font-weight: bold;">${index + 1}. ${task.title}</div>
                  ${task.description ? `<div style="margin-top: 5px;">${task.description}</div>` : ''}
                  <div style="margin-top: 5px; color: #666;">
                    Estado: ${task.status === 'completed' ? 'Completada' : 'Pendiente'} | 
                    Prioridad: ${task.priority} | 
                    Tiempo estimado: ${task.estimated_hours}h
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${reportData.actividades.length > 0 ? `
            <div class="section-title">Actividades Realizadas</div>
            <ul class="activities-list">
              ${reportData.actividades.map(actividad => `
                <li class="activity-item">${capitalize(actividad)}</li>
              `).join('')}
            </ul>
            ` : ''}

            ${(images.length > 0) ? `
            <div class="page-break"></div>
            <div class="section-title">Imágenes Adjuntas</div>
            <div class="images-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10mm;">
              ${images.map((imageBase64, index) => `
                <div class="image-container">
                  <img src="${imageBase64}" alt="Imagen ${index + 1}" class="report-image" style="width: 100%; height: 60mm; object-fit: cover;" />
                  <div class="image-caption">Imagen ${index + 1}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${(imagenesReporte.inicial || imagenesReporte.durante || imagenesReporte.final) ? `
            <div class="section-title">Evidencia Fotográfica</div>
            <div class="images-grid">
              ${imagenesReporte.inicial ? `
              <div class="image-container">
                <img src="${imagenesReporte.inicial}" alt="Imagen inicial" class="report-image" style="width: 100%; height: 60mm; object-fit: cover;" />
                <div class="image-caption">Antes</div>
              </div>
              ` : ''}
              ${imagenesReporte.durante ? `
              <div class="image-container">
                <img src="${imagenesReporte.durante}" alt="Imagen durante" class="report-image" style="width: 100%; height: 60mm; object-fit: cover;" />
                <div class="image-caption">Durante</div>
              </div>
              ` : ''}
              ${imagenesReporte.final ? `
              <div class="image-container">
                <img src="${imagenesReporte.final}" alt="Imagen final" class="report-image" style="width: 100%; height: 60mm; object-fit: cover;" />
                <div class="image-caption">Después</div>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
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
      format: 'a4',
      compress: true
    });

    // Procesar cada página
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
        foreignObjectRendering: true,
        removeContainer: true,
        backgroundColor: '#ffffff',
        logging: true,
        imageTimeout: 30000,
        onclone: function(clonedDoc) {
          const images = Array.from(clonedDoc.getElementsByTagName('img'));
          images.forEach(img => {
            img.crossOrigin = 'anonymous';
            if (img.classList.contains('report-image')) {
              img.style.width = '100%';
              img.style.height = '60mm';
              img.style.objectFit = 'cover';
            }
          });
        }
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        'FAST'
      );
    }

    // Guardar el PDF
    pdf.save(`Reporte_${reportData.type}_${new Date().toLocaleDateString()}.pdf`);
    
    // Limpiar
    document.body.removeChild(iframe);
    return true;
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return false;
  }
}; 