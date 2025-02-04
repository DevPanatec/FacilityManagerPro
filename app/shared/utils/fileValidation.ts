export interface FileValidationConfig {
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'TOO_MANY_FILES';
  message: string;
  file?: File;
}

const DEFAULT_CONFIG: FileValidationConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxFiles: 10
};

export function validateFile(file: File, config: FileValidationConfig = DEFAULT_CONFIG): FileValidationError | null {
  // Validar tamaño
  if (config.maxSize && file.size > config.maxSize) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `El archivo excede el tamaño máximo permitido de ${Math.round(config.maxSize / 1024 / 1024)}MB`,
      file
    };
  }

  // Validar tipo
  if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Tipo de archivo no permitido',
      file
    };
  }

  return null;
}

export function validateFiles(files: File[], config: FileValidationConfig = DEFAULT_CONFIG): FileValidationError[] {
  const errors: FileValidationError[] = [];

  // Validar número máximo de archivos
  if (config.maxFiles && files.length > config.maxFiles) {
    errors.push({
      code: 'TOO_MANY_FILES',
      message: `No se pueden subir más de ${config.maxFiles} archivos`
    });
    return errors;
  }

  // Validar cada archivo
  files.forEach(file => {
    const error = validateFile(file, config);
    if (error) {
      errors.push(error);
    }
  });

  return errors;
}

export function getFileTypeConfig(type: 'image' | 'document' | 'all'): FileValidationConfig {
  switch (type) {
    case 'image':
      return {
        ...DEFAULT_CONFIG,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxSize: 5 * 1024 * 1024 // 5MB
      };
    case 'document':
      return {
        ...DEFAULT_CONFIG,
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxSize: 10 * 1024 * 1024 // 10MB
      };
    default:
      return DEFAULT_CONFIG;
  }
} 