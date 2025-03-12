'use client';

import { useEffect, useState } from 'react';

export default function CSPFix() {
  const [nonce, setNonce] = useState(null);

  useEffect(() => {
    // Extraer el nonce de la política CSP
    function extractNonce() {
      try {
        const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
        let extractedNonce = null;
        
        metaTags.forEach(tag => {
          const content = tag.getAttribute('content');
          if (content) {
            const match = content.match(/'nonce-([^']+)'/);
            if (match && match[1]) {
              extractedNonce = match[1];
            }
          }
        });
        
        if (extractedNonce) {
          setNonce(extractedNonce);
          return extractedNonce;
        }
        return null;
      } catch (e) {
        console.error('Error extrayendo nonce:', e);
        return null;
      }
    }

    // Aplicar el nonce a todos los scripts inline
    function applyNonceToScripts(currentNonce) {
      if (!currentNonce) return;
      
      try {
        document.querySelectorAll('script:not([nonce]):not([src])').forEach(script => {
          script.setAttribute('nonce', currentNonce);
        });
      } catch (e) {
        console.error('Error aplicando nonce a scripts:', e);
      }
    }

    // Ejecutar la extracción y aplicación del nonce
    const extractedNonce = extractNonce();
    if (extractedNonce) {
      applyNonceToScripts(extractedNonce);
      
      // Configurar un MutationObserver para detectar cambios en el DOM
      const observer = new MutationObserver(() => {
        applyNonceToScripts(extractedNonce);
      });
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // Limpiar el observer cuando el componente se desmonte
      return () => observer.disconnect();
    }
  }, []);

  return null; // Este componente no renderiza nada visible
} 