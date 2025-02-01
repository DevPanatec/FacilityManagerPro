'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';
import { uploadContingencyFile, deleteContingencyFile, getContingencyFiles } from '@/app/shared/services/fileService';
import { useToast } from '@/app/hooks/useToast';

interface FileUploaderProps {
  contingencyId: string;
  organizationId: string;
  userId: string;
  onFileUploaded?: () => void;
}

export default function FileUploader({ contingencyId, organizationId, userId, onFileUploaded }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);
      const file = acceptedFiles[0];
      
      await uploadContingencyFile(file, contingencyId, organizationId, userId);
      
      showToast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido correctamente',
        type: 'success'
      });

      if (onFileUploaded) {
        onFileUploaded();
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Error al subir el archivo',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [contingencyId, organizationId, userId, onFileUploaded, showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <FiUpload className="w-8 h-8 text-gray-400" />
          {isUploading ? (
            <p className="text-sm text-gray-500">Subiendo archivo...</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {isDragActive
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra y suelta un archivo aquí, o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-400">
                Formatos permitidos: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (máx. 5MB)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FileListProps {
  contingencyId: string;
  onFileDeleted?: () => void;
}

export function FileList({ contingencyId, onFileDeleted }: FileListProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const data = await getContingencyFiles(contingencyId);
      setFiles(data);
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: 'Error al cargar los archivos',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [contingencyId, showToast]);

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      await deleteContingencyFile(fileId, filePath);
      await loadFiles();
      
      if (onFileDeleted) {
        onFileDeleted();
      }

      showToast({
        title: 'Archivo eliminado',
        description: 'El archivo se ha eliminado correctamente',
        type: 'success'
      });
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: 'Error al eliminar el archivo',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  if (isLoading) {
    return <div className="text-center py-4">Cargando archivos...</div>;
  }

  if (files.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay archivos adjuntos</div>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg border"
        >
          <div className="flex items-center space-x-3">
            {file.content_type === 'image' ? (
              <div className="relative w-10 h-10">
                <Image
                  src={file.file_url}
                  alt={file.file_name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <FiFile className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {file.file_name}
              </a>
              <p className="text-xs text-gray-500">
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(file.id, file.file_path)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
} 