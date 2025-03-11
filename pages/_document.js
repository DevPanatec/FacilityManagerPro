import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Extraer los hashes específicos de los errores CSP
  const specificHashes = [
    'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=',
    'sha256-siOdv9navDThT+8MoXrcb/Kc8oDXskSlHEddzXrdjJU=',
    'sha256-r5XRWHwynX3nweId4lDaP8aMWsiNjy/wrW4QQyiVmhY=',
    'sha256-yc7cCOwI6XOC+YpDFGiu5KCZesDvZ84bBdULm2DAuHE=',
    'sha256-0e555M679pj1SEhYgM9HcLs+fMjbSnkd6toVzNTlK/Q=',
    'sha256-lma+TBE66mvjgzANpVBbhLZngjD8rD00zJJiiPHKUx8=',
    'sha256-kjUxnhKjABwjcxcuLEgp0OOXT0SsXpn2A7O9PH3fhxA=',
    'sha256-42sidmBuIALnnoPM2iUHjEQ/0KaNX++UdNLTOl3tocU='
  ];

  // Crear una meta tag CSP que incluya todos estos hashes
  const hashesString = specificHashes.map(hash => `'${hash}'`).join(' ');
  
  return (
    <Html lang="es">
      <Head>
        {/* No incluimos nuestra propia meta tag aquí - dejamos que Next.js la maneje */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 