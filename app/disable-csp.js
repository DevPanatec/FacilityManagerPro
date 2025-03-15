// Este archivo modifica el comportamiento de Next.js para permitir scripts en línea

if (typeof window !== 'undefined') {
  // Cuando se carga en el navegador, actualiza la política CSP
  const updateCSP = () => {
    try {
      // Busca todas las meta tags de CSP
      document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(meta => {
        // Elimina la meta tag
        meta.parentNode.removeChild(meta);
      });
      
      // Agrega una política permisiva sin nonces ni hashes
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://*.githubusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https:; frame-src 'self' https://vercel.live https: data:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';";
      document.head.appendChild(meta);
      
      console.log('✅ CSP actualizada correctamente');
    } catch (e) {
      console.error('Error al actualizar CSP:', e);
    }
  };

  // Ejecutar inmediatamente
  updateCSP();
  
  // También ejecutar cuando el DOM esté completamente cargado
  document.addEventListener('DOMContentLoaded', updateCSP);
  
  // Y después de cualquier cambio en la navegación
  window.addEventListener('load', updateCSP);
}

export default function DisableCSP() {
  return null; // Este componente no renderiza nada
} 