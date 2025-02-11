import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { validateFile, getFileTypeConfig } from '@/app/shared/utils/fileValidation'

export type FileType = 'image' | 'document' | 'spreadsheet' | 'other'

interface UploadedFile {
  url: string
  type: FileType
  name: string
  size: number
}

interface UploadProgress {
  progress: number
  controller: AbortController
}

export class FileService {
  private supabase = createClientComponentClient<Database>()
  private uploadControllers = new Map<string, AbortController>()

  private getFileType(file: File): FileType {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.includes('spreadsheet') || file.name.match(/\.(xlsx|xls|csv)$/i)) return 'spreadsheet'
    if (file.type.includes('document') || file.name.match(/\.(doc|docx|pdf)$/i)) return 'document'
    return 'other'
  }

  private async uploadFile(
    file: File,
    organizationId: string,
    bucket: string = 'contingency-files',
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    // Validar archivo
    const error = validateFile(file, getFileTypeConfig(this.getFileType(file)));
    if (error) {
      throw new Error(error.message);
    }

    const fileType = this.getFileType(file)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${organizationId}/${fileName}`

    // Crear un nuevo AbortController para esta carga
    const controller = new AbortController()
    this.uploadControllers.set(file.name, controller)

    try {
      // Subir el archivo con seguimiento de progreso
      const { data, error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          abortSignal: controller.signal,
          onUploadProgress: (progress) => {
            if (onProgress) {
              onProgress((progress.loaded / progress.total) * 100)
            }
          }
        })

      if (uploadError) throw uploadError

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        url: publicUrl,
        type: fileType,
        name: file.name,
        size: file.size
      }
    } finally {
      this.uploadControllers.delete(file.name)
    }
  }

  async uploadFiles(
    files: File[],
    organizationId: string,
    bucket: string = 'contingency-files',
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(
        file,
        organizationId,
        bucket,
        progress => onProgress?.(file.name, progress)
      )
    )

    return Promise.all(uploadPromises)
  }

  async uploadContingencyFile(
    file: File,
    contingencyId: string,
    organizationId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    const uploadedFile = await this.uploadFile(file, organizationId, 'contingency-files', onProgress);

    // Registrar el archivo en la base de datos
    const { error } = await this.supabase
      .from('contingency_files')
      .insert([{
        contingency_id: contingencyId,
        organization_id: organizationId,
        user_id: userId,
        file_name: file.name,
        file_type: this.getFileType(file),
        file_size: file.size,
        file_url: uploadedFile.url
      }]);

    if (error) throw error;

    return uploadedFile;
  }

  async getContingencyFiles(contingencyId: string) {
    const { data, error } = await this.supabase
      .from('contingency_files')
      .select('*')
      .eq('contingency_id', contingencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteContingencyFile(fileId: string, filePath: string) {
    // Eliminar el archivo del storage
    const { error: storageError } = await this.supabase.storage
      .from('contingency-files')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Eliminar el registro de la base de datos
    const { error: dbError } = await this.supabase
      .from('contingency_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  }

  cancelUpload(fileName: string) {
    const controller = this.uploadControllers.get(fileName)
    if (controller) {
      controller.abort()
      this.uploadControllers.delete(fileName)
    }
  }

  getImageThumbnail(url: string, size: number = 200): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from('contingency-files')
      .getPublicUrl(url, {
        transform: {
          width: size,
          height: size,
          resize: 'cover'
        }
      })

    return publicUrl
  }

  async getFileMetadata(url: string) {
    const path = url.split('/').slice(-2).join('/')
    const { data, error } = await this.supabase.storage
      .from('contingency-files')
      .list(path.split('/')[0], {
        search: path.split('/')[1]
      })

    if (error) throw error
    if (!data || data.length === 0) throw new Error('File not found')

    return data[0]
  }
}

// Crear una instancia del servicio
const fileService = new FileService()

// Exportar las funciones necesarias
export const uploadContingencyFile = (
  file: File,
  contingencyId: string,
  organizationId: string,
  userId: string,
  onProgress?: (progress: number) => void
) => fileService.uploadContingencyFile(file, contingencyId, organizationId, userId, onProgress)

export const getContingencyFiles = (contingencyId: string) => 
  fileService.getContingencyFiles(contingencyId)

export const deleteContingencyFile = (fileId: string, filePath: string) => 
  fileService.deleteContingencyFile(fileId, filePath)

// Exportar el servicio por defecto
export default fileService 