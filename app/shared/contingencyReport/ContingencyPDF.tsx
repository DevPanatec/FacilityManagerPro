import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportData {
  title: string;
  type: "contingencia" | "tarea";
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

/**
 * Carga una imagen desde una URL y retorna la URL de la imagen cargada
 */
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("Intentando cargar imagen:", url.substring(0, 50) + "...");
    
    // Verificar que la URL sea válida
    if (!url || url.trim() === "") {
      console.log("URL de imagen inválida o vacía");
      reject("URL de imagen inválida o vacía");
      return;
    }
    
    const img = new Image();
    
    // Manejo de errores
    img.onerror = (error) => {
      console.error("Error cargando imagen:", url.substring(0, 50) + "...", error);
      reject(error);
    };
    
    // Cuando la imagen cargue
    img.onload = () => {
      console.log("Imagen cargada correctamente:", {
        url: url.substring(0, 50) + "...",
        dimensiones: `${img.width}x${img.height}`
      });
      resolve(url);
    };
    
    // Intentar con crossOrigin 'anonymous' para evitar problemas de CORS
    img.crossOrigin = "anonymous";
    img.src = url;
    
    // Si después de 5 segundos la imagen no carga, rechazar
    setTimeout(() => {
      if (!img.complete) {
        console.warn("Tiempo de carga de imagen excedido:", url.substring(0, 50) + "...");
        reject("Tiempo de carga excedido");
      }
    }, 5000);
  });
}

export const generateContingencyPDF = async (reportData: ReportData) => {
  try {
    // Cargar logos
    let logoHSMA = "",
      logoMINSA = "",
      logoCSS = "";
    try {
      console.log("Cargando logos...");
      [logoHSMA, logoMINSA, logoCSS] = await Promise.all([
        loadImage("/logo.jpg"),
        loadImage("/issa.png"),
        loadImage("/sgs-iso.png"),
      ]);
      console.log("Logos cargados correctamente");
    } catch (error) {
      console.warn("Error cargando logos:", error);
    }

    // Función de capitalización segura
    const capitalize = (str?: string | null) => {
      if (!str) return "";
      return str
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
    };

    // Datos seguros con valores por defecto
    const safeData = {
      area: reportData.area || "No especificado",
      sala: reportData.sala || null,
      fecha: reportData.fecha || "Sin fecha",
      horaInicio: reportData.horaInicio || null,
      horaFin: reportData.horaFin || null,
      actividades: reportData.actividades || [],
      description: reportData.description || "",
      tasks: reportData.tasks || [],
    };

    // Cargar imágenes del reporte
    const imagenesReporte = {
      inicial: "",
      durante: "",
      final: "",
    };

    try {
      console.log("Cargando imágenes del reporte...", reportData.imagenes);

      // Extraer URLs de las imágenes de manera segura
      const urlInicial =
        typeof reportData.imagenes === "object" && reportData.imagenes !== null
          ? reportData.imagenes.inicial || ""
          : "";

      const urlDurante =
        typeof reportData.imagenes === "object" && reportData.imagenes !== null
          ? reportData.imagenes.durante || ""
          : "";

      const urlFinal =
        typeof reportData.imagenes === "object" && reportData.imagenes !== null
          ? reportData.imagenes.final || ""
          : "";

      console.log("URLs de imágenes extraídas:", {
        inicial: urlInicial.substring(0, 50) + "...",
        durante: urlDurante.substring(0, 50) + "...",
        final: urlFinal.substring(0, 50) + "...",
      });

      // Cargar las imágenes de forma segura
      const [inicial, durante, final] = await Promise.all([
        urlInicial
          ? loadImage(urlInicial).catch((err) => {
              console.error("Error al cargar imagen inicial:", err);
              return "";
            })
          : Promise.resolve(""),

        urlDurante
          ? loadImage(urlDurante).catch((err) => {
              console.error("Error al cargar imagen durante:", err);
              return "";
            })
          : Promise.resolve(""),

        urlFinal
          ? loadImage(urlFinal).catch((err) => {
              console.error("Error al cargar imagen final:", err);
              return "";
            })
          : Promise.resolve(""),
      ]);

      Object.assign(imagenesReporte, { inicial, durante, final });
      console.log("Imágenes del reporte cargadas:", {
        inicialCargada: !!inicial,
        duranteCargada: !!durante,
        finalCargada: !!final,
      });
    } catch (error) {
      console.error("Error cargando imágenes:", error);
    }

    // Procesar descripción
    let parsedDescription = "";
    let mostrarDescripcion = false;
    
    try {
      if (safeData.description) {
        // Si es una descripción simple, usarla directamente
        if (
          typeof safeData.description === "string" &&
          !safeData.description.startsWith("{")
        ) {
          parsedDescription = safeData.description;
          mostrarDescripcion = parsedDescription.length > 0;
        } else {
          // Intentar parsear como JSON si no se ha hecho ya
          const descData =
            typeof safeData.description === "string"
              ? JSON.parse(safeData.description)
              : safeData.description;

          // Si hay imágenes en la descripción, usarlas
          if (descData.details?.imagenes) {
            const imagenes = descData.details.imagenes;
            
            // Combinar con las imágenes del reporte, priorizando las de la descripción
            if (imagenes.inicial && !imagenesReporte.inicial) {
              imagenesReporte.inicial = imagenes.inicial;
            }
            
            if (imagenes.durante && !imagenesReporte.durante) {
              imagenesReporte.durante = imagenes.durante;
            }
            
            if (imagenes.final && !imagenesReporte.final) {
              imagenesReporte.final = imagenes.final;
            }
            
            console.log("Imágenes extraídas de la descripción (details.imagenes):", {
              inicial: !!imagenes.inicial,
              durante: !!imagenes.durante,
              final: !!imagenes.final
            });
          }
          
          // Verificar si hay imágenes en la raíz del objeto
          if (descData.imagenes) {
            const imagenes = descData.imagenes;
            
            // Combinar con las imágenes del reporte, priorizando las de la descripción
            if (imagenes.inicial && !imagenesReporte.inicial) {
              imagenesReporte.inicial = imagenes.inicial;
            }
            
            if (imagenes.durante && !imagenesReporte.durante) {
              imagenesReporte.durante = imagenes.durante;
            }
            
            if (imagenes.final && !imagenesReporte.final) {
              imagenesReporte.final = imagenes.final;
            }
            
            console.log("Imágenes extraídas de la descripción (raíz):", {
              inicial: !!imagenes.inicial,
              durante: !!imagenes.durante,
              final: !!imagenes.final
            });
          }
          
          // Verificar si hay un array de imágenes
          if (descData.images || descData.photos || descData.attachments) {
            const imageArray = descData.images || descData.photos || descData.attachments || [];
            
            if (Array.isArray(imageArray) && imageArray.length > 0) {
              // Ordenar por fecha si tienen propiedad created_at
              const sorted = imageArray.sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return 0;
              });
              
              // Asignar imágenes según su posición en el array
              if (sorted.length >= 1 && !imagenesReporte.inicial) {
                imagenesReporte.inicial = sorted[0].url || sorted[0];
              }
              
              if (sorted.length >= 2 && !imagenesReporte.durante) {
                imagenesReporte.durante = sorted[1].url || sorted[1];
              }
              
              if (sorted.length >= 3 && !imagenesReporte.final) {
                imagenesReporte.final = sorted[2].url || sorted[2];
              }
              
              console.log("Imágenes extraídas de array en la descripción:", {
                encontradas: sorted.length,
                inicial: !!imagenesReporte.inicial,
                durante: !!imagenesReporte.durante,
                final: !!imagenesReporte.final
              });
            }
          }

          // Resumen final de todas las imágenes recopiladas
          console.log("Estado final de imágenes después de procesar todas las fuentes:", {
            inicial: !!imagenesReporte.inicial,
            durante: !!imagenesReporte.durante,
            final: !!imagenesReporte.final,
            urlInicial: imagenesReporte.inicial ? imagenesReporte.inicial.substring(0, 50) + "..." : "No disponible",
            urlDurante: imagenesReporte.durante ? imagenesReporte.durante.substring(0, 50) + "..." : "No disponible",
            urlFinal: imagenesReporte.final ? imagenesReporte.final.substring(0, 50) + "..." : "No disponible"
          });

          // Si hay una descripción directa, usarla
          if (descData.details?.descripcion) {
            parsedDescription = descData.details.descripcion;
            mostrarDescripcion = true;
          }
          // Si no, construir a partir de otros datos
          else if (descData.details) {
            const details = [];
            if (descData.details.type)
              details.push(`Tipo: ${capitalize(descData.details.type)}`);
            if (descData.details.actividades?.length) {
              details.push("Actividades realizadas:");
              details.push(
                ...descData.details.actividades.map(
                  (a: string, i: number) => `${i + 1}. ${capitalize(a)}`,
                ),
              );
            }
            parsedDescription = details.join("\n");
            mostrarDescripcion = details.length > 0;
          }
        }
      }
    } catch (e) {
      console.log(
        "La descripción no es un JSON válido, usando texto plano:",
        e,
      );
      parsedDescription = String(safeData.description || "");
      mostrarDescripcion = parsedDescription.length > 0;
    }

    // Crear iframe
    const iframe = document.createElement("iframe");
    iframe.style.visibility = "hidden";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("No se pudo crear el iframe");

    // Generar contenido HTML
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { margin: 10mm; size: A4 portrait; }
            body { 
              margin: 0;
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white;
              color: #333;
            }
            .pdf-container { width: 210mm; }
            .page {
              padding: 8mm;
              width: 210mm;
              min-height: 270mm;
              page-break-after: always;
              break-after: page;
              visibility: visible !important;
              position: relative;
              background-color: white;
              box-sizing: border-box;
            }
            .page:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 5mm;
              padding-bottom: 2mm;
              border-bottom: 1px solid #ccc;
            }
            .logo {
              height: 20mm;
              width: auto;
              object-fit: contain;
              max-width: 30%;
            }
            .title {
              text-align: center;
              font-size: 22pt;
              font-weight: bold;
              margin: 5mm 0;
              text-transform: uppercase;
            }
            .custom-title {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 2mm;
              color: #333;
            }
            .basic-info { margin-bottom: 5mm; }
            .info-row {
              display: flex;
              margin-bottom: 2mm;
              align-items: baseline;
            }
            .info-label {
              width: 40mm;
              color: #666;
              font-weight: 500;
            }
            .info-value { margin-left: 2mm; }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 6mm 0 3mm;
              border-bottom: 0.5pt solid #ccc;
              padding-bottom: 1mm;
              color: #444;
            }
            .description-text {
              white-space: pre-wrap;
              margin-bottom: 4mm;
              line-height: 1.5;
            }
            .activities-list {
              padding-left: 6mm;
              list-style-type: decimal;
              margin-top: 3mm;
            }
            .activity-item {
              margin-bottom: 2mm; 
              padding: 1mm 0;
            }
            .tasks-list { margin-bottom: 5mm; }
            .task-item {
              margin-bottom: 12px;
              padding: 12px;
              border: 1px solid #eee;
              border-radius: 5px;
            }
            .task-header {
              font-weight: bold; 
              font-size: 12pt;
              margin-bottom: 5px;
            }
            .task-description {
              margin: 5px 0;
            }
            .task-meta {
              color: #666; 
              margin-top: 5px;
            }
            .images-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10mm;
              margin-top: 5mm;
            }
            .image-container {
              text-align: center;
              width: 100%;
              margin-bottom: 8mm;
            }
            .report-image {
              width: 100%;
              max-height: 60mm;
              object-fit: cover;
              border: 1px solid #ddd;
              border-radius: 4mm;
            }
            .image-caption {
              text-align: center;
              font-size: 10pt;
              color: #666;
              margin-top: 2mm;
            }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <!-- Página principal -->
          <div class="page">
            <div class="header">
                <img src="${logoCSS}" class="logo" alt="CSS"/>
                <img src="${logoHSMA}" class="logo" alt="HSMA"/>
                <img src="${logoMINSA}" class="logo" alt="MINSA"/>
            </div>

            ${
              reportData.title &&
              reportData.title !==
                `${reportData.type?.toUpperCase() || "CONTINGENCIA"}`
                ? `<div class="custom-title">${reportData.title}</div>`
                : ""
            }

            <div class="title">
                REPORTE DE ${reportData.type?.toUpperCase() || "CONTINGENCIA"}
            </div>

            <div class="basic-info">
              <div class="info-row">
                <div class="info-label">Área:</div>
                  <div class="info-value">${capitalize(safeData.area)}</div>
              </div>

              ${
                safeData.sala
                  ? `
              <div class="info-row">
                <div class="info-label">Sala:</div>
                  <div class="info-value">${capitalize(safeData.sala)}</div>
                </div>`
                  : ""
              }

              <div class="info-row">
                <div class="info-label">Fecha:</div>
                  <div class="info-value">${safeData.fecha}</div>
              </div>

              ${
                safeData.horaInicio
                  ? `
              <div class="info-row">
                <div class="info-label">Hora Inicio:</div>
                  <div class="info-value">${safeData.horaInicio}</div>
                </div>`
                  : ""
              }

              ${
                safeData.horaFin
                  ? `
              <div class="info-row">
                <div class="info-label">Hora Fin:</div>
                  <div class="info-value">${safeData.horaFin}</div>
                </div>`
                  : ""
              }
            </div>

            ${
              mostrarDescripcion
                ? `
            <div class="section-title">Descripción</div>
              <div class="description-text">${parsedDescription}</div>`
                : ""
            }

            ${
              safeData.actividades.length > 0
                ? `
              <div class="section-title">Actividades Realizadas</div>
              <ul class="activities-list">
                ${safeData.actividades
                .map(
                    (a) => `
                  <li class="activity-item">${capitalize(a)}</li>
              `,
                )
                .join("")}
              </ul>`
                : ""
            }

            ${
              safeData.tasks.length > 0
                ? `
              <div class="section-title">Tareas Asignadas</div>
              <div class="tasks-list">
                ${safeData.tasks
                  .slice(0, 6)
                .map(
                    (task, i) => `
                  <div class="task-item">
                    <div class="task-header">${i + 1}. ${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
                    <div class="task-meta">
                      <strong>Estado:</strong> ${task.status === "completed" ? "Completada" : "Pendiente"} | 
                      <strong>Prioridad:</strong> ${task.priority} | 
                      <strong>Tiempo estimado:</strong> ${task.estimated_hours}h
                    </div>
                  </div>
              `,
                )
                .join("")}
              </div>`
                : ""
            }

            ${
              // Mostrar imágenes en la primera página si hay menos de 4 tareas o si hay descripción
              (safeData.tasks.length < 4 || mostrarDescripcion) &&
                ((imagenesReporte.inicial && imagenesReporte.inicial.length > 0) ||
                (imagenesReporte.durante && imagenesReporte.durante.length > 0) ||
                (imagenesReporte.final && imagenesReporte.final.length > 0))
                ? `
              <div class="section-title">Evidencia Fotográfica</div>
              <div class="images-grid">
                ${
                  imagenesReporte.inicial && imagenesReporte.inicial.length > 0
                    ? `
                <div class="image-container">
                  <img src="${imagenesReporte.inicial}" class="report-image" alt="Antes"/>
                  <div class="image-caption">Antes</div>
                </div>`
                    : ""
                }
                ${
                  imagenesReporte.durante && imagenesReporte.durante.length > 0
                    ? `
                <div class="image-container">
                  <img src="${imagenesReporte.durante}" class="report-image" alt="Durante"/>
                  <div class="image-caption">Durante</div>
                </div>`
                    : ""
                }
                ${
                  imagenesReporte.final && imagenesReporte.final.length > 0
                    ? `
                <div class="image-container">
                  <img src="${imagenesReporte.final}" class="report-image" alt="Después"/>
                  <div class="image-caption">Después</div>
                </div>`
                    : ""
                }
              </div>`
                : ""
            }
            </div>

            <!-- Páginas adicionales para tareas -->
            ${
              safeData.tasks.length > 6
                ? Array.from(
                    { length: Math.ceil((safeData.tasks.length - 6) / 6) },
                    (_, pageIndex) => {
                      const start = pageIndex * 6 + 6;
                      const tasksChunk = safeData.tasks.slice(start, start + 6);
                      const isLastPage = start + 6 >= safeData.tasks.length;

                      // Determinar si esta es la última página de tareas y si hay imágenes
                      const hayImagenes =
                        (imagenesReporte.inicial &&
                          imagenesReporte.inicial.length > 0) ||
                        (imagenesReporte.durante &&
                          imagenesReporte.durante.length > 0) ||
                        (imagenesReporte.final &&
                          imagenesReporte.final.length > 0);

                      // Si es la última página de tareas Y hay pocas tareas (3 o menos), incluir las imágenes
                      const incluirImagenesEnEstaPagina =
                        isLastPage && hayImagenes && tasksChunk.length <= 3;

                      return `
                      <div class="page">
                        <div class="header">
                          <img src="${logoCSS}" class="logo" alt="CSS"/>
                          <img src="${logoHSMA}" class="logo" alt="HSMA"/>
                          <img src="${logoMINSA}" class="logo" alt="MINSA"/>
                        </div>
                        
                        <div class="section-title">Tareas Asignadas (continuación)</div>
                        <div class="tasks-list">
                          ${tasksChunk
                            .map(
                              (task, i) => `
                            <div class="task-item">
                              <div class="task-header">${start + i + 1}. ${task.title}</div>
                              ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
                              <div class="task-meta">
                                <strong>Estado:</strong> ${task.status === "completed" ? "Completada" : "Pendiente"} | 
                                <strong>Prioridad:</strong> ${task.priority} | 
                                <strong>Tiempo estimado:</strong> ${task.estimated_hours}h
                              </div>
                </div>
              `,
                )
                .join("")}
            </div>

            ${
              incluirImagenesEnEstaPagina
                ? `
            <div class="section-title">Evidencia Fotográfica</div>
            <div class="images-grid">
              ${
                imagenesReporte.inicial && imagenesReporte.inicial.length > 0
                  ? `
              <div class="image-container">
                              <img src="${imagenesReporte.inicial}" class="report-image" alt="Antes"/>
                <div class="image-caption">Antes</div>
                            </div>`
                  : ""
              }
              ${
                imagenesReporte.durante && imagenesReporte.durante.length > 0
                  ? `
              <div class="image-container">
                              <img src="${imagenesReporte.durante}" class="report-image" alt="Durante"/>
                <div class="image-caption">Durante</div>
                            </div>`
                  : ""
              }
              ${
                imagenesReporte.final && imagenesReporte.final.length > 0
                  ? `
              <div class="image-container">
                              <img src="${imagenesReporte.final}" class="report-image" alt="Después"/>
                <div class="image-caption">Después</div>
                            </div>`
                  : ""
              }
            </div>
            `
                : ""
            }
                      </div>
                    `;
                    },
                  ).join("")
                : ""
            }

            <!-- Página de evidencia fotográfica (solo si hay imágenes y no se incluyeron en la última página de tareas) -->
            ${(() => {
              // Verificar si hay al menos una imagen cargada exitosamente
              const hayImagenes =
                (imagenesReporte.inicial &&
                  imagenesReporte.inicial.length > 0) ||
                (imagenesReporte.durante &&
                  imagenesReporte.durante.length > 0) ||
                (imagenesReporte.final && imagenesReporte.final.length > 0);

              // Determinar si las imágenes ya se incluyeron en la última página de tareas
              const ultimaPaginaTareas =
                safeData.tasks.length > 6
                  ? Math.ceil((safeData.tasks.length - 6) / 6) - 1
                  : -1;

              const hayUltimaPaginaTareas = ultimaPaginaTareas >= 0;
              const tasksEnUltimaPagina = hayUltimaPaginaTareas
                ? safeData.tasks.slice(6 + ultimaPaginaTareas * 6).length
                : 0;

              // Si hay pocas tareas en la primera página (6 o menos) y hay 3 o menos, incluir imágenes ahí
              const pocasTareasEnPrimeraPagina = safeData.tasks.length <= 3;

              // Verificar si las imágenes ya se incluyeron en alguna página de tareas
              const imagenesYaIncluidas =
                (hayUltimaPaginaTareas && tasksEnUltimaPagina <= 3) ||
                (safeData.tasks.length <= 6 && pocasTareasEnPrimeraPagina);

              // Solo crear página de evidencias si hay imágenes Y no se incluyeron antes
              if (hayImagenes && !imagenesYaIncluidas) {
                return `
                    <div class="page">
                      <div class="header">
                        <img src="${logoCSS}" class="logo" alt="CSS"/>
                        <img src="${logoHSMA}" class="logo" alt="HSMA"/>
                        <img src="${logoMINSA}" class="logo" alt="MINSA"/>
                      </div>

                      <div class="section-title">Evidencia Fotográfica</div>
                      <div class="images-grid">
                        ${
                          imagenesReporte.inicial &&
                          imagenesReporte.inicial.length > 0
                            ? `
                        <div class="image-container">
                          <img src="${imagenesReporte.inicial}" class="report-image" alt="Antes"/>
                          <div class="image-caption">Antes</div>
                        </div>`
                            : ""
                        }
                        ${
                          imagenesReporte.durante &&
                          imagenesReporte.durante.length > 0
                            ? `
                        <div class="image-container">
                          <img src="${imagenesReporte.durante}" class="report-image" alt="Durante"/>
                          <div class="image-caption">Durante</div>
                        </div>`
                            : ""
                        }
                        ${
                          imagenesReporte.final &&
                          imagenesReporte.final.length > 0
                            ? `
                        <div class="image-container">
                          <img src="${imagenesReporte.final}" class="report-image" alt="Después"/>
                          <div class="image-caption">Después</div>
                        </div>`
                            : ""
                        }
                      </div>
                    </div>`;
              }
              return "";
            })()}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Esperar a que las imágenes se carguen
    console.log("Esperando a que las imágenes se carguen...");
    await Promise.all(
      Array.from(iframeDoc.images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              console.log(`Imagen ya cargada: ${img.alt || "sin nombre"}`);
              resolve(null);
            } else {
              img.onload = () => {
                console.log(`Imagen cargada: ${img.alt || "sin nombre"}`);
                resolve(null);
              };
              img.onerror = () => {
                console.error(
                  `Error al cargar imagen: ${img.alt || "sin nombre"}`,
                );
                resolve(null);
              };
            }
          }),
      ),
    );
    console.log("Todas las imágenes cargadas.");

    // Generar PDF
    console.log("Iniciando generación de PDF...");
    const pages = Array.from(
      iframeDoc.querySelectorAll(".page"),
    ) as HTMLElement[];
    console.log(`Número de páginas encontradas: ${pages.length}`);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Procesar todas las imágenes al inicio para tenerlas disponibles
    try {
      // Registrar qué datos de imágenes hemos recibido inicialmente
      console.log("Datos iniciales de imágenes recibidos:", {
        "imagenesReporte inicial": {
          inicial: !!imagenesReporte.inicial,
          durante: !!imagenesReporte.durante, 
          final: !!imagenesReporte.final
        },
        "safeData.description presente": !!safeData.description,
      });

      const urlInicial = imagenesReporte.inicial || "";
      const urlDurante = imagenesReporte.durante || "";
      const urlFinal = imagenesReporte.final || "";

    // Procesar cada página
    for (let i = 0; i < pages.length; i++) {
        console.log(`Procesando página ${i + 1} de ${pages.length}`);

      if (i > 0) pdf.addPage();

      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
          imageTimeout: 60000,
        onclone: function (clonedDoc) {
          const images = Array.from(clonedDoc.getElementsByTagName("img"));
            console.log(
              `Encontradas ${images.length} imágenes en página ${i + 1}`,
            );
          images.forEach((img) => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      const pageWidth = 210;
      const pageHeight = 297;
        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        console.log(`Añadiendo página ${i + 1} al PDF`);
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST",
      );
    }

      console.log(`PDF generado con ${pages.length} páginas`);
    pdf.save(
      `Reporte_${reportData.type}_${new Date().toLocaleDateString()}.pdf`,
    );

    // Limpiar
    document.body.removeChild(iframe);
    return true;
  } catch (error) {
      console.error("Error generando PDF:", error);
      return false;
    }
  } catch (error) {
    console.error("Error generando PDF:", error);
    return false;
  }
};
