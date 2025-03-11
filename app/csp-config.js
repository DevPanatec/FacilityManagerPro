/**
 * Configuración de Content Security Policy
 * 
 * Este archivo permite configurar la Política de Seguridad de Contenido
 * incluyendo los hashes específicos para los scripts en línea necesarios
 */

// Extraer los hashes específicos de los errores CSP
export const specificHashes = [
  'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=',
  'sha256-siOdv9navDThT+8MoXrcb/Kc8oDXskSlHEddzXrdjJU=',
  'sha256-r5XRWHwynX3nweId4lDaP8aMWsiNjy/wrW4QQyiVmhY=',
  'sha256-yc7cCOwI6XOC+YpDFGiu5KCZesDvZ84bBdULm2DAuHE=',
  'sha256-0e555M679pj1SEhYgM9HcLs+fMjbSnkd6toVzNTlK/Q=',
  'sha256-lma+TBE66mvjgzANpVBbhLZngjD8rD00zJJiiPHKUx8=',
  'sha256-kjUxnhKjABwjcxcuLEgp0OOXT0SsXpn2A7O9PH3fhxA=',
  'sha256-42sidmBuIALnnoPM2iUHjEQ/0KaNX++UdNLTOl3tocU='
];

// Crear la directiva CSP basada en los hashes
export function getCSPDirective() {
  const hashesString = specificHashes.map(hash => `'${hash}'`).join(' ');
  
  return `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${hashesString} https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; default-src 'self'; frame-src 'self' https:;`;
} 