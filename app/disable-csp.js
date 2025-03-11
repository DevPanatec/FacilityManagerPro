// Este archivo modifica el comportamiento de Next.js para desactivar completamente su CSP

if (typeof window !== 'undefined') {
  // Cuando se carga en el navegador, desactiva todas las políticas CSP
  const disableCSP = () => {
    try {
      // Busca todas las meta tags de CSP
      document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(meta => {
        // Elimina la meta tag
        meta.parentNode.removeChild(meta);
      });
      
      // Agrega una política totalmente permisiva
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:";
      document.head.appendChild(meta);
      
      console.log('✅ CSP desactivada correctamente');
    } catch (e) {
      console.error('Error al desactivar CSP:', e);
    }
  };

  // Ejecutar inmediatamente
  disableCSP();
  
  // También ejecutar cuando el DOM esté completamente cargado
  document.addEventListener('DOMContentLoaded', disableCSP);
  
  // Y después de cualquier cambio en la navegación
  window.addEventListener('load', disableCSP);
}

export default function DisableCSP() {
  return null; // Este componente no renderiza nada
} 