import '../app/globals.css'
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'
import DisableCSP from '../app/disable-csp'

export default function MyApp({ Component, pageProps }) {
  // Desactivar CSP en el lado del cliente
  useEffect(() => {
    // Función para eliminar todas las políticas CSP
    const disableCSP = () => {
      try {
        // Eliminar todas las meta tags CSP
        const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        metaTags.forEach(tag => tag.parentNode.removeChild(tag));
        
        // Insertar una política permisiva
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:";
        document.head.appendChild(meta);
        
        console.log('CSP desactivada desde _app.js');
      } catch (e) {
        console.error('Error al desactivar CSP:', e);
      }
    };
    
    // Ejecutar inmediatamente
    disableCSP();
    
    // También al cargar completamente
    window.addEventListener('load', disableCSP);
    
    return () => {
      window.removeEventListener('load', disableCSP);
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