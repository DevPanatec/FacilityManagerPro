import '../app/globals.css'
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'
import DisableCSP from '../app/disable-csp'

export default function MyApp({ Component, pageProps }) {
  // Actualizar CSP en el lado del cliente
  useEffect(() => {
    // Función para actualizar la política CSP
    const updateCSP = () => {
      try {
        // Eliminar todas las meta tags CSP
        const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        metaTags.forEach(tag => tag.parentNode.removeChild(tag));
        
        // Insertar una política permisiva sin nonces ni hashes
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://*.githubusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https:; frame-src 'self' https://vercel.live https: data:; frame-ancestors 'self'; base-uri 'self'; form-action 'self';";
        document.head.appendChild(meta);
        
        console.log('CSP actualizada desde _app.js');
      } catch (e) {
        console.error('Error al actualizar CSP:', e);
      }
    };
    
    // Ejecutar inmediatamente
    updateCSP();
    
    // También al cargar completamente
    window.addEventListener('load', updateCSP);
    
    return () => {
      window.removeEventListener('load', updateCSP);
    };
  }, []);

  return (
    <>
      <DisableCSP />
      <Component {...pageProps} />
      <Toaster position="top-center" />
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  )
} 