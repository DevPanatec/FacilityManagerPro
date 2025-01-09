export const demoAreas = [
  {
    id: 1,
    nombre: "Bioseguridad",
    color: "#FF6B6B",
    tareas: [
      {
        id: 101,
        descripcion: "Desinfección de trajes y EPP",
        asignado: "Juan Pérez",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-28T08:15:00",
        endTime: "2024-11-28T09:30:00"
      },
      {
        id: 102,
        descripcion: "Limpieza de duchas de descontaminación",
        asignado: "Ana Martínez",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T10:00:00",
        endTime: null
      },
      {
        id: 103,
        descripcion: "Reposición de materiales de bioseguridad",
        asignado: "Pedro Sánchez",
        estado: "pendiente",
        prioridad: "media",
        startTime: null,
        endTime: null
      }
    ]
  },
  {
    id: 2,
    nombre: "Inyección",
    color: "#4ECDC4",
    tareas: [
      {
        id: 201,
        descripcion: "Limpieza de máquinas inyectoras",
        asignado: "María López",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-28T07:00:00",
        endTime: "2024-11-28T08:45:00"
      },
      {
        id: 202,
        descripcion: "Mantenimiento preventivo",
        asignado: "Carlos Gómez",
        estado: "pendiente",
        prioridad: "media",
        startTime: null,
        endTime: null
      }
    ]
  },
  {
    id: 3,
    nombre: "Laboratorio",
    color: "#FFE66D",
    tareas: [
      {
        id: 301,
        descripcion: "Limpieza de equipos de análisis",
        asignado: "Laura Torres",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-28T09:00:00",
        endTime: "2024-11-28T10:30:00"
      },
      {
        id: 302,
        descripcion: "Calibración de instrumentos",
        asignado: "Miguel Ángel",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T11:00:00",
        endTime: null
      }
    ]
  }
];