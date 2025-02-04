import DOMPurify from 'isomorphic-dompurify';

interface SanitizerConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOWED_URI_REGEXP?: RegExp;
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  RETURN_TRUSTED_TYPE?: boolean;
}

const DEFAULT_CONFIG: SanitizerConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

// Sanitizar texto simple
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// Sanitizar HTML con configuración personalizada
export function sanitizeHtml(input: string, config: SanitizerConfig = DEFAULT_CONFIG): string {
  return DOMPurify.sanitize(input, {
    ...DEFAULT_CONFIG,
    ...config,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  });
}

// Sanitizar URLs
export function sanitizeUrl(url: string): string {
  // Eliminar caracteres no permitidos y protocolos peligrosos
  const sanitized = url.replace(/[^\w\s-.:/?=&%]/gi, '');
  
  if (sanitized.toLowerCase().startsWith('javascript:') ||
      sanitized.toLowerCase().startsWith('data:') ||
      sanitized.toLowerCase().startsWith('vbscript:')) {
    return '#';
  }
  
  return sanitized;
}

// Sanitizar objetos JSON
export function sanitizeJson<T extends object>(obj: T): T {
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key as keyof T];
    
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeJson(value as object) as any;
    }
  });
  
  return sanitized;
}

// Sanitizar entrada de formulario
export function sanitizeFormInput(input: string): string {
  return sanitizeText(input)
    .replace(/[<>]/g, '') // Eliminar < y >
    .trim();
}

// Sanitizar nombre de archivo
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres no permitidos con _
    .replace(/\.{2,}/g, '.') // Prevenir path traversal
    .replace(/^\.+|\.+$/g, '') // Eliminar puntos al inicio y final
    .substring(0, 255); // Limitar longitud
}

// Sanitizar SQL
export function sanitizeSqlIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

// Sanitizar HTML para uso en PDF
export function sanitizeHtmlForPdf(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true }
  });
}

// Sanitizar datos para uso en gráficas
export function sanitizeChartData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeChartData(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      sanitized[sanitizeSqlIdentifier(key)] = sanitizeChartData(data[key]);
    });
    return sanitized;
  }
  return data;
} 