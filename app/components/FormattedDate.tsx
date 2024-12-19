'use client'
import React from 'react';

interface FormattedDateProps {
  date?: string;
}

const FormattedDate: React.FC<FormattedDateProps> = ({ date }) => {
  // Usar una fecha estática si no se proporciona una
  const defaultDate = new Date('2024-11-28T08:15:00Z');
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Asegurarnos de que usamos UTC para evitar problemas de zona horaria
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).format(date);
  };

  return (
    <span suppressHydrationWarning>
      {formatDate(date || defaultDate.toISOString())}
    </span>
  );
};

export default FormattedDate; 