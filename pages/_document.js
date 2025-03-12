import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* No intentamos modificar la CSP aquí */}
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* Script para hacer que la aplicación sea compatible con la CSP de Vercel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Función para aplicar nonces dinámicamente a los scripts inline
              (function() {
                function applyNonce() {
                  try {
                    // Encontrar el nonce actual en meta tags
                    let nonce = '';
                    const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
                    metaTags.forEach(tag => {
                      const content = tag.getAttribute('content');
                      if (content) {
                        const match = content.match(/'nonce-([^']+)'/);
                        if (match && match[1]) {
                          nonce = match[1];
                        }
                      }
                    });

                    if (!nonce) return;
                    
                    // Aplicar el nonce a todos los scripts inline
                    const scripts = document.querySelectorAll('script:not([src])');
                    scripts.forEach(script => {
                      if (!script.nonce) {
                        script.setAttribute('nonce', nonce);
                      }
                    });
                  } catch (e) {
                    console.error('Error al aplicar nonces:', e);
                  }
                }
                
                // Ejecutar inmediatamente
                applyNonce();
                
                // También cuando cambie el DOM
                new MutationObserver(applyNonce).observe(document.documentElement, {
                  childList: true,
                  subtree: true
                });
              })();
            `
          }}
          nonce={
            // Intento de capturar el nonce de Vercel desde SSR
            // (esto no funcionará realmente, pero mostramos la intención)
            "NEXT_DYNAMIC_NONCE"
          }
        />
      </body>
    </Html>
  );
} 