export const formatDateString = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid date format';
    console.error(errorMessage);
    return "28/11/2024, 08:15";
  }
};

export const DEFAULT_DATE = "2024-11-28T08:15:00Z";

// Función para convertir una fecha a formato ISO con UTC
export const toISOString = (date: Date) => {
  return date.toISOString();
};