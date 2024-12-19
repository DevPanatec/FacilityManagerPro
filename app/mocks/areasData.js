export const areasData = [
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
        descripcion: "Desinfección de moldes",
        asignado: "Carlos Gómez",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T09:30:00",
        endTime: null
      },
      {
        id: 203,
        descripcion: "Limpieza de área de enfriamiento",
        asignado: "Laura Torres",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-29T06:00:00",
        endTime: "2024-11-29T07:30:00"
      }
    ]
  },
  {
    id: 3,
    nombre: "Cuarto Frío",
    color: "#45B7D1",
    tareas: [
      {
        id: 301,
        descripcion: "Limpieza de estanterías refrigeradas",
        asignado: "Isabel Díaz",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T08:00:00",
        endTime: null
      },
      {
        id: 302,
        descripcion: "Desinfección de superficies frías",
        asignado: "Roberto Martín",
        estado: "pendiente",
        prioridad: "alta",
        startTime: null,
        endTime: null
      },
      {
        id: 303,
        descripcion: "Limpieza de sistemas de refrigeración",
        asignado: "Carmen Vega",
        estado: "completada",
        prioridad: "media",
        startTime: "2024-11-28T07:15:00",
        endTime: "2024-11-28T09:00:00"
      }
    ]
  },
  {
    id: 4,
    nombre: "Producción",
    color: "#96CEB4",
    tareas: [
      {
        id: 401,
        descripcion: "Limpieza de líneas de producción",
        asignado: "Miguel Ángel",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-27T06:30:00",
        endTime: "2024-11-27T08:00:00"
      },
      {
        id: 402,
        descripcion: "Desinfección de equipos de envasado",
        asignado: "Patricia López",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T09:00:00",
        endTime: null
      },
      {
        id: 403,
        descripcion: "Limpieza de bandas transportadoras",
        asignado: "Fernando Gil",
        estado: "pendiente",
        prioridad: "media",
        startTime: null,
        endTime: null
      }
    ]
  },
  {
    id: 5,
    nombre: "Techos, Paredes y Pisos",
    color: "#FFB347",
    tareas: [
      {
        id: 501,
        descripcion: "Limpieza profunda de techos",
        asignado: "Laura Torres",
        estado: "completada",
        prioridad: "media",
        startTime: "2024-11-28T07:30:00",
        endTime: "2024-11-28T09:00:00"
      },
      {
        id: 502,
        descripcion: "Desinfección de paredes",
        asignado: "Ana Martínez",
        estado: "en_progreso",
        prioridad: "alta",
        startTime: "2024-11-29T09:15:00",
        endTime: null
      },
      {
        id: 503,
        descripcion: "Limpieza y sellado de pisos",
        asignado: "Pedro Sánchez",
        estado: "pendiente",
        prioridad: "alta",
        startTime: null,
        endTime: null
      }
    ]
  },
  {
    id: 6,
    nombre: "Canaletas y Rejillas",
    color: "#A7C7E7",
    tareas: [
      {
        id: 601,
        descripcion: "Limpieza de canaletas principales",
        asignado: "Carlos Gómez",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-28T06:00:00",
        endTime: "2024-11-28T08:30:00"
      },
      {
        id: 602,
        descripcion: "Desinfección de rejillas",
        asignado: "Isabel Díaz",
        estado: "en_progreso",
        prioridad: "media",
        startTime: "2024-11-29T08:45:00",
        endTime: null
      },
      {
        id: 603,
        descripcion: "Mantenimiento de drenajes",
        asignado: "María López",
        estado: "completada",
        prioridad: "alta",
        startTime: "2024-11-29T07:00:00",
        endTime: "2024-11-29T07:30:00"
      }
    ]
  },
  {
    id: 7,
    nombre: "Área Externa",
    color: "#98D8AA",
    tareas: [
      {
        id: 701,
        descripcion: "Limpieza de áreas verdes",
        asignado: "Roberto Martín",
        estado: "completada",
        prioridad: "media",
        startTime: "2024-11-28T06:30:00",
        endTime: "2024-11-28T08:00:00"
      },
      {
        id: 702,
        descripcion: "Limpieza de estacionamiento",
        asignado: "Carmen Vega",
        estado: "en_progreso",
        prioridad: "baja",
        startTime: "2024-11-29T08:15:00",
        endTime: null
      },
      {
        id: 703,
        descripcion: "Mantenimiento de aceras y accesos",
        asignado: "Miguel Ángel",
        estado: "pendiente",
        prioridad: "media",
        startTime: null,
        endTime: null
      }
    ]
  }
];