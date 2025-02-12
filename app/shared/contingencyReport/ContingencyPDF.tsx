import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportImage {
  url: string;
  caption: string;
}

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

// Función auxiliar para dividir el array en grupos
function chunk<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

export const generateContingencyPDF = async (reportData: ReportData) => {
  try {
    // Función para cargar una imagen y convertirla a base64
    const loadImage = async (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
          resolve(canvas.toDataURL('image/png', 1.0));
        };
        img.onerror = () => {
          console.error('Error al cargar imagen:', url);
          reject(new Error('Error loading image'));
        };
        img.src = url;
      });
    };

    // Cargar logos
    let logoHSMA = '', logoMINSA = '', logoCSS = '';
    try {
      logoHSMA = await loadImage('/logo.jpg');
    } catch (error) {
      console.warn('No se pudo cargar el logo HSMA:', error);
    }
    try {
      logoMINSA = await loadImage('/issa.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo MINSA:', error);
    }
    try {
      logoCSS = await loadImage('/sgs-iso.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo CSS:', error);
    }

    // Preparar imágenes del reporte
    const reportImages: ReportImage[] = [];
    if (reportData.imagenes.inicial) {
      reportImages.push({
        url: reportData.imagenes.inicial,
        caption: 'Estado Inicial'
      });
    }
    if (reportData.imagenes.durante) {
      reportImages.push({
        url: reportData.imagenes.durante,
        caption: 'Durante el Proceso'
      });
    }
    if (reportData.imagenes.final) {
      reportImages.push({
        url: reportData.imagenes.final,
        caption: 'Estado Final'
      });
    }

    // Crear el iframe para el contenido del PDF
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
              margin: 20mm;
              size: A4 portrait;
            }
            body { 
              margin: 0;
              font-family: Arial, sans-serif;
              color: #000000;
              font-size: 14px !important;
              line-height: 1.6 !important;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
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
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20mm;
            }
            .logo {
              height: 20mm;
              width: auto;
              object-fit: contain;
              background: transparent;
            }
            .title {
              text-align: center;
              font-size: 20px !important;
              font-weight: bold;
              margin: 10mm 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-section {
              margin-bottom: 10mm;
            }
            .info-row {
              display: flex;
              margin-bottom: 3mm;
            }
            .info-label {
              width: 35mm;
              font-weight: bold;
              font-size: 14px !important;
            }
            .info-value {
              flex: 1;
              font-size: 14px !important;
            }
            .section-title {
              font-size: 16px !important;
              font-weight: bold;
              margin: 10mm 0 5mm;
              border-bottom: 1.5pt solid #000;
              padding-bottom: 2mm;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .task-item {
              margin-bottom: 5mm;
              page-break-inside: avoid;
            }
            .task-title {
              font-size: 14px !important;
              font-weight: bold;
              letter-spacing: 0.2px;
            }
            .task-description {
              font-size: 14px !important;
              margin: 2mm 0;
            }
            .image-section {
              page-break-before: always;
              text-align: center;
            }
            .image-container {
              margin: 5mm 0;
              display: inline-block;
              width: 48%;
              vertical-align: top;
              padding: 2mm;
            }
            .report-image {
              width: 100%;
              max-height: 100mm;
              object-fit: contain;
              margin-bottom: 3mm;
            }
            .image-caption {
              margin-top: 2mm;
              font-weight: bold;
              font-size: 14px !important;
              text-align: center;
            }
            .page-number {
              position: absolute;
              bottom: 10mm;
              right: 10mm;
              font-size: 12px !important;
            }
          </style>
        </head>
        <body>
          <!-- Primera página -->
          <div class="page">
            <div class="header">
              <img src="${logoCSS}" alt="Logo CSS" class="logo" />
              <img src="${logoHSMA}" alt="Logo HSMA" class="logo" />
              <img src="${logoMINSA}" alt="Logo MINSA" class="logo" />
            </div>
            
            <div class="title">
              REPORTE DE ${reportData.type.toUpperCase()}
            </div>

            <div class="info-section">
              <div class="info-row">
                <div class="info-label">Área:</div>
                <div class="info-value">${reportData.area}</div>
              </div>
              ${reportData.sala ? `
              <div class="info-row">
                <div class="info-label">Sala:</div>
                <div class="info-value">${reportData.sala}</div>
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

            ${reportData.tasks && reportData.tasks.length > 0 ? `
            <div class="section-title">TAREAS ASIGNADAS</div>
            ${reportData.tasks.map((task, index) => `
              <div class="task-item">
                <div class="task-title">${index + 1}. ${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div>Estado: ${task.status === 'completed' ? 'Completada' : 'Pendiente'}</div>
                <div>Prioridad: ${task.priority}</div>
              </div>
            `).join('')}
            ` : ''}

            ${reportData.actividades.length > 0 ? `
            <div class="section-title">ACTIVIDADES REALIZADAS</div>
            <div class="activities-section">
              ${reportData.actividades.map((actividad, index) => `
                <div class="task-item">
                  <div class="task-title">${index + 1}. ${actividad}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <div class="page-number">1</div>
          </div>

          ${reportImages.length > 0 ? `
          <!-- Página de imágenes -->
          <div class="page">
            <div class="section-title" style="text-align: center; margin-bottom: 15mm;">
              EVIDENCIA FOTOGRÁFICA
            </div>
            <div style="text-align: center;">
              ${reportImages.map((image, index) => `
                <div class="image-container">
                  <img src="${image.url}" alt="${image.caption}" class="report-image" />
                  <div class="image-caption">${image.caption}</div>
                </div>
              `).join('')}
            </div>
            <div class="page-number">2</div>
          </div>
          ` : ''}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Esperar a que las imágenes se carguen
    await new Promise((resolve) => {
      const images = iframeDoc.getElementsByTagName('img');
      let loadedImages = 0;
      const totalImages = images.length;

      function checkAllImagesLoaded() {
        loadedImages++;
        if (loadedImages === totalImages) {
          resolve(null);
        }
      }

      Array.from(images).forEach(img => {
        if (img.complete) {
          checkAllImagesLoaded();
        } else {
          img.onload = checkAllImagesLoaded;
          img.onerror = checkAllImagesLoaded;
        }
      });

      if (totalImages === 0) {
        resolve(null);
      }
    });

    // Esperar un momento para asegurar el renderizado
    await new Promise(resolve => setTimeout(resolve, 1000));

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
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    pdf.save(`Reporte_${reportData.type}_${new Date().toLocaleDateString()}.pdf`);
    document.body.removeChild(iframe);
    return true;

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return false;
  }
}; 