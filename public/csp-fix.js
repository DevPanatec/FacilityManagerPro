// Script para manejar dinámicamente la política CSP de Vercel
(function() {
  function extractNonceFromCSP() {
    try {
      // Buscar meta tags de CSP
      const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
      let nonce = null;
      
      metaTags.forEach(tag => {
        const content = tag.getAttribute('content');
        if (content) {
          // Extraer el nonce de la directiva script-src
          const nonceMatch = content.match(/'nonce-([^']+)'/);
          if (nonceMatch && nonceMatch[1]) {
            nonce = nonceMatch[1];
          }
        }
      });
      
      return nonce;
    } catch (e) {
      console.error('Error al extraer nonce:', e);
      return null;
    }
  }

  function applyNonceToInlineScripts(nonce) {
    if (!nonce) return;
    
    try {
      // Aplicar el nonce a todos los scripts inline sin nonce
      document.querySelectorAll('script:not([nonce]):not([src])').forEach(script => {
        script.setAttribute('nonce', nonce);
      });
      
      // Reemplazar scripts problemáticos
      document.querySelectorAll('script:not([nonce]):not([src])').forEach(script => {
        const content = script.textContent;
        const newScript = document.createElement('script');
        newScript.setAttribute('nonce', nonce);
        newScript.textContent = content;
        if (script.parentNode) {
          script.parentNode.replaceChild(newScript, script);
        }
      });
    } catch (e) {
      console.error('Error al aplicar nonce a scripts:', e);
    }
  }
  
  function setupCSPFix() {
    const nonce = extractNonceFromCSP();
    if (nonce) {
      applyNonceToInlineScripts(nonce);
      
      // Observar cambios en el DOM para nuevos scripts
      const observer = new MutationObserver(() => {
        applyNonceToInlineScripts(nonce);
      });
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      console.log('✅ CSP fix aplicado exitosamente con nonce:', nonce);
    }
  }
  
  // Ejecutar cuando el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCSPFix);
  } else {
    setupCSPFix();
  }
  
  // También ejecutar en load por si acaso
  window.addEventListener('load', setupCSPFix);
})(); 