import '../app/globals.css'
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'
import Head from 'next/head'

// Eliminar la importación que causa error
// import DisableCSP from '../app/disable-csp'

export default function MyApp({ Component, pageProps }) {
  // Cargar el script de corrección CSP lo antes posible
  useEffect(() => {
    // Cargar el script apenas la aplicación se inicia
    const script = document.createElement('script');
    script.src = '/csp-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      // Limpiar si es necesario
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <Head>
        {/* Cargar el script de corrección CSP directamente en el Head */}
        <script src="/csp-fix.js" />
      </Head>
      {/* Eliminar el componente que causa error */}
      {/* <DisableCSP /> */}
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